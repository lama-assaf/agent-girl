/**
 * WebSocket Message Handlers
 * Handles all WebSocket message types for the chat interface
 */

import type { ServerWebSocket } from "bun";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { HookInput } from "@anthropic-ai/claude-agent-sdk/sdkTypes";
import { sessionDb, type SessionMessage } from "../database";
import { getSystemPrompt, injectWorkingDirIntoAgents } from "../systemPrompt";
import { AVAILABLE_MODELS } from "../../client/config/models";
import { configureProvider, getProviders, getMaskedApiKey } from "../providers";
import { getMcpServers, getAllowedMcpTools } from "../mcpServers";
import { AGENT_REGISTRY } from "../agents";
import { validateDirectory } from "../directoryUtils";
import { saveImageToSessionPictures, saveFileToSessionFiles } from "../imageUtils";
import { backgroundProcessManager } from "../backgroundProcessManager";
import { loadUserConfig } from "../userConfig";
import { parseApiError, getUserFriendlyMessage } from "../utils/apiErrors";
import { TimeoutController } from "../utils/timeout";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

// Build model mapping from configuration
const MODEL_MAP: Record<string, { apiModelId: string; provider: string }> = {};
AVAILABLE_MODELS.forEach(model => {
  MODEL_MAP[model.id] = {
    apiModelId: model.apiModelId,
    provider: model.provider,
  };
});

// Platform-specific conversation history byte limits
// These limits prevent ENAMETOOLONG errors when spawning CLI subprocesses
const CONVERSATION_LIMITS = {
  win32: 10000,   // 10KB - Windows CreateProcess has 32KB total limit
  darwin: 200000, // 200KB - macOS has 1MB total limit, plenty of headroom
  linux: 200000,  // 200KB - Linux has 2MB total limit, even more headroom
};

// Validate platform and get conversation byte limit
const platform = process.platform as keyof typeof CONVERSATION_LIMITS;
if (!(platform in CONVERSATION_LIMITS)) {
  throw new Error(
    `Unsupported platform: ${process.platform}. ` +
    `Supported platforms: ${Object.keys(CONVERSATION_LIMITS).join(', ')}. ` +
    `Please report this issue with your OS details.`
  );
}

const MAX_CONVERSATION_BYTES = CONVERSATION_LIMITS[platform];
console.log(`📏 Platform: ${platform}, Conversation limit: ${MAX_CONVERSATION_BYTES} bytes`);

export async function handleWebSocketMessage(
  ws: ServerWebSocket<ChatWebSocketData>,
  message: string,
  activeQueries: Map<string, unknown>
): Promise<void> {
  if (ws.data?.type === 'hot-reload') return;

  try {
    const data = JSON.parse(message);

    if (data.type === 'chat') {
      await handleChatMessage(ws, data, activeQueries);
    } else if (data.type === 'approve_plan') {
      await handleApprovePlan(ws, data, activeQueries);
    } else if (data.type === 'set_permission_mode') {
      await handleSetPermissionMode(ws, data, activeQueries);
    } else if (data.type === 'kill_background_process') {
      await handleKillBackgroundProcess(ws, data);
    }
  } catch (error) {
    console.error('WebSocket message error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Invalid message format'
    }));
  }
}

/**
 * Build conversation history string with automatic trimming to fit byte limit.
 * Removes oldest messages first until under the limit, always keeping at least 1 message.
 * Also injects file/image attachment paths into the prompt.
 */
function buildConversationHistoryWithLimit(
  messages: SessionMessage[],
  maxBytes: number,
  attachmentInfo: { imagePaths: string[], filePaths: string[] }
): { prompt: string; messagesIncluded: number; totalMessages: number } {

  // Helper to build prompt string from messages array
  const buildPromptString = (msgs: SessionMessage[]): string => {
    return msgs.map(msg => {
      // Parse JSON content for structured messages
      let displayContent = msg.content;
      try {
        const parsed = JSON.parse(msg.content);
        if (Array.isArray(parsed)) {
          displayContent = parsed
            .filter((block: Record<string, unknown>) => block.type === 'text')
            .map((block: Record<string, unknown>) => block.text)
            .join('\n');
        }
      } catch {
        // Not JSON, use as-is
      }
      return `${msg.type === 'user' ? 'User' : 'Assistant'}: ${displayContent}`;
    }).join('\n\n');
  };

  const totalMessages = messages.length;
  let prompt = buildPromptString(messages);
  let messagesIncluded = messages.length;

  // Trim oldest messages until under limit (keep at least 1)
  while (Buffer.byteLength(prompt, 'utf8') > maxBytes && messagesIncluded > 1) {
    messages = messages.slice(1); // Remove oldest
    prompt = buildPromptString(messages);
    messagesIncluded = messages.length;
  }

  // Inject attachment paths into final prompt
  if (attachmentInfo.imagePaths.length > 0 || attachmentInfo.filePaths.length > 0) {
    const attachmentLines: string[] = [];
    attachmentInfo.imagePaths.forEach(p => attachmentLines.push(`[Image attached: ${p}]`));
    attachmentInfo.filePaths.forEach(p => attachmentLines.push(`[File attached: ${p}]`));

    const pathsText = attachmentLines.join('\n');
    const lastUserIndex = prompt.lastIndexOf('User: ');
    if (lastUserIndex !== -1) {
      const beforeUser = prompt.substring(0, lastUserIndex + 6);
      const afterUser = prompt.substring(lastUserIndex + 6);
      prompt = `${beforeUser}${pathsText}\n\n${afterUser}`;
    }
  }

  return {
    prompt,
    messagesIncluded,
    totalMessages
  };
}

async function handleChatMessage(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>,
  activeQueries: Map<string, unknown>
): Promise<void> {
  const { content, sessionId, model, timezone } = data;

  if (!content || !sessionId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing content or sessionId' }));
    return;
  }

  // Get session for working directory access
  const session = sessionDb.getSession(sessionId as string);
  if (!session) {
    console.error('❌ Session not found:', sessionId);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Session not found'
    }));
    return;
  }

  const workingDir = session.working_directory;

  // Process attachments (images and files)
  const imagePaths: string[] = [];
  const filePaths: string[] = [];

  // Debug: log the content structure
  console.log('🔍 Content type:', typeof content);
  console.log('🔍 Content is array?', Array.isArray(content));
  if (Array.isArray(content)) {
    console.log('🔍 Content blocks:', content.map((b: Record<string, unknown>) => ({ type: b?.type, hasSource: !!b?.source, hasData: !!b?.data })));
  }

  // Check if content is an array (contains blocks like text/image/file)
  const contentIsArray = Array.isArray(content);
  if (contentIsArray) {
    const contentBlocks = content as Array<Record<string, unknown>>;

    // Extract and save images and files
    for (const block of contentBlocks) {
      console.log('🔍 Processing block:', { type: block.type, hasSource: !!block.source, hasData: !!block.data });

      // Handle images
      if (block.type === 'image' && typeof block.source === 'object') {
        const source = block.source as Record<string, unknown>;
        console.log('🔍 Image source:', { type: source.type, hasData: !!source.data });
        if (source.type === 'base64' && typeof source.data === 'string') {
          // Save image to pictures folder
          const base64Data = `data:${source.media_type || 'image/png'};base64,${source.data}`;
          const imagePath = saveImageToSessionPictures(base64Data, sessionId as string, workingDir);
          imagePaths.push(imagePath);
          console.log('✅ Image saved and path added:', imagePath);
        }
      }

      // Handle document files
      if (block.type === 'document' && typeof block.data === 'string' && typeof block.name === 'string') {
        console.log('🔍 Document file:', { name: block.name });
        const filePath = saveFileToSessionFiles(block.data as string, block.name as string, sessionId as string, workingDir);
        filePaths.push(filePath);
        console.log('✅ File saved and path added:', filePath);
      }
    }
  }

  // Save user message to database (stringify if array)
  const contentForDb = typeof content === 'string' ? content : JSON.stringify(content);
  sessionDb.addMessage(sessionId as string, 'user', contentForDb);

  // Get conversation history
  const allMessages = sessionDb.getSessionMessages(sessionId as string);

  // Build conversation with automatic trimming to prevent ENAMETOOLONG errors
  const { prompt, messagesIncluded, totalMessages } = buildConversationHistoryWithLimit(
    allMessages,
    MAX_CONVERSATION_BYTES,
    { imagePaths, filePaths }
  );

  // Log conversation size and trimming info
  const promptBytes = Buffer.byteLength(prompt, 'utf8');
  console.log(`📊 Conversation: ${messagesIncluded}/${totalMessages} messages, ${promptBytes} bytes`);
  if (messagesIncluded < totalMessages) {
    console.log(`⚠️  Trimmed ${totalMessages - messagesIncluded} oldest messages to fit ${MAX_CONVERSATION_BYTES} byte limit`);
  }

  // Get model configuration
  const modelConfig = MODEL_MAP[model as string] || MODEL_MAP['sonnet'];
  const { apiModelId, provider } = modelConfig;

  // Configure provider (sets ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY env vars)
  const providerType = provider as 'anthropic' | 'z-ai';

  // Validate API key before proceeding
  try {
    configureProvider(providerType);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Provider configuration error:', errorMessage);
    ws.send(JSON.stringify({
      type: 'error',
      message: errorMessage
    }));
    return;
  }

  // Get provider config for logging
  const providers = getProviders();
  const providerConfig = providers[providerType];

  // Get MCP servers for this provider
  const mcpServers = getMcpServers(providerType);
  const allowedMcpTools = getAllowedMcpTools(providerType);

  // Comprehensive diagnostic logging
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📨 Incoming Request');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔹 Model from client: "${model}"`);
  console.log(`🔹 API Model ID: "${apiModelId}"`);
  console.log(`🔹 Provider: ${providerConfig.name} (${provider})`);
  console.log(`🔹 API Endpoint: ${providerConfig.baseUrl || 'https://api.anthropic.com (default)'}`);
  console.log(`🔹 API Key: ${getMaskedApiKey(providerConfig.apiKey)}`);
  console.log(`🔹 Available models: ${Object.keys(MODEL_MAP).join(', ')}`);
  console.log(`🔹 Custom agents: ${Object.keys(AGENT_REGISTRY).join(', ')}`);
  console.log(`🔹 MCP Servers: ${Object.keys(mcpServers).length > 0 ? Object.keys(mcpServers).join(', ') : 'None'}`);
  console.log(`🔹 Allowed MCP Tools: ${allowedMcpTools.length > 0 ? allowedMcpTools.join(', ') : 'None'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Log working directory info
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 Working Directory & Mode Info');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔹 Session ID:', sessionId);
  console.log('🔹 Session Working Dir:', workingDir);
  console.log('🎭 Session Mode:', session.mode);

  // Validate working directory
  const validation = validateDirectory(workingDir);
  if (!validation.valid) {
    console.error('❌ Working directory invalid:', validation.error);
    ws.send(JSON.stringify({
      type: 'error',
      message: `Working directory error: ${validation.error}`
    }));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }

  console.log('✅ Working directory validated:', workingDir);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {

    // Load user configuration
    const userConfig = loadUserConfig();

    // Build query options with provider-specific system prompt (including agent list)
    // Add working directory context to system prompt AND all agent prompts
    const baseSystemPrompt = getSystemPrompt(providerType, AGENT_REGISTRY, userConfig, timezone as string | undefined, session.mode);
    const systemPromptWithContext = `${baseSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ENVIRONMENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORKING DIRECTORY: ${workingDir}

When creating files for this session, use the WORKING DIRECTORY path above.
All file paths should be relative to this directory or use absolute paths within it.
Run bash commands with the understanding that this is your current working directory.
`;

    // Inject working directory context into all custom agent prompts
    const agentsWithWorkingDir = injectWorkingDirIntoAgents(AGENT_REGISTRY, workingDir);

    const queryOptions: Record<string, unknown> = {
      model: apiModelId,
      systemPrompt: systemPromptWithContext,
      permissionMode: session.permission_mode || 'bypassPermissions', // Use session's permission mode
      includePartialMessages: true,
      agents: agentsWithWorkingDir, // Register custom agents with working dir context
      cwd: workingDir, // Set working directory for all tool executions
      executable: 'bun', // Explicitly specify bun as the runtime for SDK subprocess

      // Capture stderr from SDK's bundled CLI for debugging
      stderr: (data: string) => {
        console.error('🔴 SDK CLI stderr:', data.trim());
      },
    };

    // Enable extended thinking only for Anthropic models
    // Z.AI's Anthropic-compatible API doesn't support maxThinkingTokens parameter
    if (providerType === 'anthropic') {
      queryOptions.maxThinkingTokens = 10000;
      console.log('🧠 Extended thinking enabled with maxThinkingTokens:', queryOptions.maxThinkingTokens);
    } else {
      console.log('⚠️ Extended thinking not supported for provider:', providerType);
    }

    // SDK automatically uses its bundled CLI at @anthropic-ai/claude-agent-sdk/cli.js
    // No need to specify pathToClaudeCodeExecutable - the SDK handles this internally

    // Add MCP servers and allowed tools if provider has them
    if (Object.keys(mcpServers).length > 0) {
      queryOptions.mcpServers = mcpServers;
      queryOptions.allowedTools = allowedMcpTools;
    }

    // Add PreToolUse hook to intercept background Bash commands
    queryOptions.hooks = {
      PreToolUse: [{
        hooks: [async (input: HookInput, toolUseID: string | undefined) => {
          // PreToolUse hook has tool_name and tool_input properties
          type PreToolUseInput = HookInput & { tool_name: string; tool_input: Record<string, unknown> };

          console.log('🔧 PreToolUse hook triggered:', { event: input.hook_event_name, tool: (input as PreToolUseInput).tool_name });

          if (input.hook_event_name !== 'PreToolUse') return {};

          const { tool_name, tool_input } = input as PreToolUseInput;
          console.log('🔧 Tool name:', tool_name, 'Tool input:', JSON.stringify(tool_input).slice(0, 200));

          if (tool_name !== 'Bash') return {};

          const bashInput = tool_input as Record<string, unknown>;
          console.log('🔧 Bash input run_in_background:', bashInput.run_in_background);

          if (bashInput.run_in_background !== true) return {};

          // This is a background Bash command - intercept it!
          console.log('🎯 INTERCEPTING BACKGROUND BASH COMMAND!');
          const command = bashInput.command as string;
          const description = bashInput.description as string | undefined;
          const bashId = toolUseID || `bg-${Date.now()}`;

          // Check if this specific command is already running for this session
          const existingProcess = backgroundProcessManager.findExistingProcess(sessionId as string, command);

          if (existingProcess) {
            // Check if the process is actually still alive
            try {
              // kill -0 doesn't kill the process, just checks if it exists
              process.kill(existingProcess.pid, 0);
              // Process is alive, block duplicate
              console.log(`⚠️  This command is already running for this session, skipping spawn: ${command}`);
              return {
                decision: 'approve' as const,
                updatedInput: {
                  command: `echo "✓ Command already running in background (PID ${existingProcess.pid}, started at ${new Date(existingProcess.startedAt).toLocaleTimeString()})"`,
                  description,
                },
              };
            } catch {
              // Process is dead, remove from registry and allow respawn
              console.log(`🧹 Process ${existingProcess.pid} is dead, removing from registry and allowing respawn`);
              backgroundProcessManager.delete(existingProcess.bashId);
            }
          }

          // Spawn the process ourselves
          const { pid } = await backgroundProcessManager.spawn(command, workingDir, bashId, sessionId as string, description);

          // Notify the client
          ws.send(JSON.stringify({
            type: 'background_process_started',
            bashId,
            command,
            description,
            startedAt: Date.now(),
          }));

          console.log(`✅ Background process spawned (PID ${pid}), replacing command with success echo`);

          // Replace the command with an echo so the SDK gets a successful result
          // This prevents the agent from retrying
          return {
            decision: 'approve' as const,
            updatedInput: {
              command: `echo "✓ Background server started (PID ${pid})"`,
              description,
            },
          };
        }],
      }],
    };

    // Create timeout controller
    const timeoutController = new TimeoutController({
      timeoutMs: 120000, // 2 minutes
      warningMs: 60000,  // 1 minute
      onWarning: () => {
        // Send warning notification to client
        ws.send(JSON.stringify({
          type: 'timeout_warning',
          message: 'AI is taking longer than usual...',
          elapsedSeconds: 60,
          sessionId: sessionId,
        }));
      },
      onTimeout: () => {
        console.log('⏱️ Request timeout reached (120s)');
      },
    });

    // Retry configuration
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 2000;
    const BACKOFF_MULTIPLIER = 2;

    let attemptNumber = 0;
    let _lastError: unknown = null;

    // Retry loop
    while (attemptNumber < MAX_RETRIES) {
      attemptNumber++;

      try {
        console.log(`🔄 Query attempt ${attemptNumber}/${MAX_RETRIES}`);

        // Query using the SDK (env vars already configured)
        const result = query({
          prompt,
          options: queryOptions
        });

        // Store query instance for mid-stream control
        activeQueries.set(sessionId as string, result);

        console.log(`✅ Query initialized successfully`);

        // Track full message content structure for saving to database
        const fullMessageContent: unknown[] = [];
        let waitingForPlanApproval = false;
        let totalCharCount = 0; // Count ALL characters (text + tool inputs)
        let assistantResponse = ''; // Track text response

        // Stream the response - query() is an AsyncGenerator
        for await (const message of result) {
          // Reset timeout on each message (inactivity timer)
          timeoutController.reset();
          // Check if timeout was already fired before reset
          timeoutController.checkTimeout();

          if (message.type === 'stream_event') {
        // Handle streaming events for real-time updates
        const event = message.event;

        if (event.type === 'content_block_start') {
          // Log when new content blocks start (text, tool_use, thinking, etc.)
          console.log('🆕 Content block started:', {
            index: event.index,
            type: event.content_block?.type,
          });

          // Send thinking block start notification to client
          if (event.content_block?.type === 'thinking') {
            ws.send(JSON.stringify({
              type: 'thinking_start',
              sessionId: sessionId,
            }));
          }
        } else if (event.type === 'content_block_delta') {
          // Count all delta types: text_delta, input_json_delta, thinking_delta
          let deltaChars = 0;

          if (event.delta?.type === 'text_delta') {
            const text = event.delta.text;
            assistantResponse += text;
            deltaChars = text.length;

            ws.send(JSON.stringify({
              type: 'assistant_message',
              content: text,
              sessionId: sessionId,  // Include sessionId for client-side filtering
            }));
          } else if (event.delta?.type === 'input_json_delta') {
            // Tool input being generated (like Write tool file content)
            const jsonDelta = event.delta.partial_json || '';
            deltaChars = jsonDelta.length;
          } else if (event.delta?.type === 'thinking_delta') {
            // Claude's internal reasoning/thinking
            const thinkingText = event.delta.thinking || '';
            deltaChars = thinkingText.length;

            console.log('💭 Thinking delta:', thinkingText.slice(0, 50) + (thinkingText.length > 50 ? '...' : ''));

            ws.send(JSON.stringify({
              type: 'thinking_delta',
              content: thinkingText,
              sessionId: sessionId,
            }));
          } else {
            // Log unknown delta types for debugging
            console.log('⚠️ Unknown delta type:', event.delta?.type);
          }

          // Update total character count and estimate tokens (~4 chars/token)
          totalCharCount += deltaChars;
          const estimatedTokens = Math.floor(totalCharCount / 4);

          // Send estimated token count update
          if (deltaChars > 0) {
            ws.send(JSON.stringify({
              type: 'token_update',
              outputTokens: estimatedTokens,
              sessionId: sessionId,
            }));
          }
        }
      } else if (message.type === 'assistant') {
        // Log assistant message details
        console.log('📝 Assistant message received:', {
          type: message.type,
          model: message.message?.model || 'unknown',
          role: message.message?.role || 'unknown',
        });

        // Capture full message content structure for database storage
        const content = message.message.content;
        if (Array.isArray(content)) {
          // Log all content block types received
          const blockTypes = content.map((b: Record<string, unknown>) => b.type).join(', ');
          console.log('📦 Content blocks in message:', blockTypes);

          // Log thinking blocks if present
          const thinkingBlocks = content.filter((b: Record<string, unknown>) => b.type === 'thinking');
          if (thinkingBlocks.length > 0) {
            console.log('💭 Thinking blocks found:', thinkingBlocks.length);
            thinkingBlocks.forEach((tb: Record<string, unknown>, idx: number) => {
              const thinkingText = (tb.thinking as string) || '';
              console.log(`💭 Thinking block ${idx + 1}:`, thinkingText.slice(0, 100) + (thinkingText.length > 100 ? '...' : ''));
            });
          }

          // Append blocks instead of replacing (SDK may send multiple assistant messages)
          fullMessageContent.push(...content);

          // Handle tool use from complete assistant message
          for (const block of content) {
            if (block.type === 'tool_use') {
              // Check if this is ExitPlanMode tool
              if (block.name === 'ExitPlanMode') {
                console.log('🛡️ ExitPlanMode detected, sending plan to client');
                waitingForPlanApproval = true;
                ws.send(JSON.stringify({
                  type: 'exit_plan_mode',
                  plan: (block.input as Record<string, unknown>)?.plan || 'No plan provided',
                  sessionId: sessionId,  // Include sessionId for client-side filtering
                }));
              }

              // Background processes are now intercepted and spawned via PreToolUse hook
              // No need for detection here since the hook blocks SDK execution

              ws.send(JSON.stringify({
                type: 'tool_use',
                toolId: block.id,
                toolName: block.name,
                toolInput: block.input,
                sessionId: sessionId,  // Include sessionId for client-side filtering
              }));
            }
          }
        }
      }
    }

    // Save assistant response to database with full content structure
    if (fullMessageContent.length > 0) {
      // Save the full content blocks as JSON to preserve tool_use, thinking, etc.
      sessionDb.addMessage(sessionId as string, 'assistant', JSON.stringify(fullMessageContent));
    } else if (assistantResponse) {
      // Fallback to text-only if no full content (shouldn't happen normally)
      sessionDb.addMessage(sessionId as string, 'assistant', JSON.stringify([{ type: 'text', text: assistantResponse }]));
    }

    console.log(`✅ Response completed. Length: ${assistantResponse.length} chars`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Don't clean up query if session has background processes or waiting for plan approval
    console.log(`🔍 Checking query cleanup for session ${sessionId}`);
    console.log(`   Background processes registry size: ${backgroundProcessManager.size}`);
    console.log(`   All processes:`, backgroundProcessManager.entries().map(([id, p]) => ({
      bashId: id,
      sessionId: p.sessionId,
      command: p.command.substring(0, 50)
    })));

    const sessionProcesses = backgroundProcessManager.getBySession(sessionId as string);
    console.log(`   Processes for this session (${sessionId}):`, sessionProcesses.length);
    if (sessionProcesses.length > 0) {
      sessionProcesses.forEach(p => {
        console.log(`     - ${p.bashId}: ${p.command}`);
      });
    }

    const sessionHasBackgroundProcesses = sessionProcesses.length > 0;
    console.log(`   sessionHasBackgroundProcesses: ${sessionHasBackgroundProcesses}`);
    console.log(`   waitingForPlanApproval: ${waitingForPlanApproval}`);

    if (!waitingForPlanApproval && !sessionHasBackgroundProcesses) {
      console.log(`🗑️ Deleting query for session ${sessionId} - no background processes or plan approval needed`);
      activeQueries.delete(sessionId as string);
    } else {
      const reasons = [];
      if (waitingForPlanApproval) reasons.push('waiting for plan approval');
      if (sessionHasBackgroundProcesses) reasons.push(`${sessionProcesses.length} background process(es) running`);
      console.log(`⏸️ Query kept alive - ${reasons.join(', ')}`);
    }

        // Send completion signal
        ws.send(JSON.stringify({ type: 'result', success: true, sessionId: sessionId }));

        // Clean up timeout controller
        timeoutController.cancel();

        // Success! Break out of retry loop
        break;

      } catch (error) {
        _lastError = error;
        console.error(`❌ Query attempt ${attemptNumber}/${MAX_RETRIES} failed:`, error);

        // Parse error
        const parsedError = parseApiError(error);
        console.log('📊 Parsed error:', {
          type: parsedError.type,
          message: parsedError.message,
          isRetryable: parsedError.isRetryable,
          requestId: parsedError.requestId,
        });

        // Check if error is retryable
        if (!parsedError.isRetryable) {
          console.error('❌ Non-retryable error, aborting:', parsedError.type);

          // Send error to client with specific error type
          ws.send(JSON.stringify({
            type: 'error',
            errorType: parsedError.type,
            message: getUserFriendlyMessage(parsedError),
            requestId: parsedError.requestId,
            sessionId: sessionId,
          }));

          // Clean up
          timeoutController.cancel();
          break; // Don't retry
        }

        // Check if we've exhausted retries
        if (attemptNumber >= MAX_RETRIES) {
          console.error('❌ Max retries reached, giving up');

          // Send final error to client
          ws.send(JSON.stringify({
            type: 'error',
            errorType: parsedError.type,
            message: getUserFriendlyMessage(parsedError),
            requestId: parsedError.requestId,
            sessionId: sessionId,
          }));

          // Clean up
          timeoutController.cancel();
          break;
        }

        // Calculate retry delay
        let delayMs = INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attemptNumber - 1);

        // Respect rate limit retry-after
        if (parsedError.type === 'rate_limit_error' && parsedError.retryAfterSeconds) {
          delayMs = parsedError.retryAfterSeconds * 1000;
        }

        // Cap at 16 seconds
        delayMs = Math.min(delayMs, 16000);

        // Notify client of retry
        ws.send(JSON.stringify({
          type: 'retry_attempt',
          attempt: attemptNumber,
          maxAttempts: MAX_RETRIES,
          delayMs: delayMs,
          errorType: parsedError.type,
          message: `Retrying... (attempt ${attemptNumber}/${MAX_RETRIES})`,
          sessionId: sessionId,
        }));

        // Wait before retrying
        console.log(`⏳ Waiting ${delayMs}ms before retry ${attemptNumber + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

  } catch (error) {
    // This catch is for errors outside the retry loop (e.g., session validation)
    console.error('WebSocket handler error:', error);
    const parsedError = parseApiError(error);
    ws.send(JSON.stringify({
      type: 'error',
      errorType: parsedError.type,
      message: getUserFriendlyMessage(parsedError),
      sessionId: sessionId,
    }));
  }
}

async function handleApprovePlan(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>,
  activeQueries: Map<string, unknown>
): Promise<void> {
  const { sessionId } = data;

  if (!sessionId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId' }));
    return;
  }

  try {
    console.log('✅ Plan approved, switching to bypassPermissions mode');

    // Update database to bypassPermissions mode
    sessionDb.updatePermissionMode(sessionId as string, 'bypassPermissions');

    // Send confirmation to client
    ws.send(JSON.stringify({
      type: 'permission_mode_changed',
      mode: 'bypassPermissions'
    }));

    // Clean up any stale query reference
    activeQueries.delete(sessionId as string);

    // Send a continuation message to the user to trigger execution
    ws.send(JSON.stringify({
      type: 'plan_approved_continue',
      message: 'Plan approved. Proceeding with implementation...'
    }));

    console.log('✅ Plan approved, ready to continue with next user message');
  } catch (error) {
    console.error('Failed to handle plan approval:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to approve plan'
    }));
  }
}

async function handleSetPermissionMode(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>,
  activeQueries: Map<string, unknown>
): Promise<void> {
  const { sessionId, mode } = data;

  if (!sessionId || !mode) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId or mode' }));
    return;
  }

  const activeQuery = activeQueries.get(sessionId as string);

  try {
    // If there's an active query, update it mid-stream
    if (activeQuery) {
      console.log(`🔄 Switching permission mode mid-stream: ${mode}`);
      await (activeQuery as { setPermissionMode: (mode: string) => Promise<void> }).setPermissionMode(mode as string);
    }

    // Always update database
    sessionDb.updatePermissionMode(sessionId as string, mode as 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan');

    ws.send(JSON.stringify({
      type: 'permission_mode_changed',
      mode
    }));
  } catch (error) {
    console.error('Failed to update permission mode:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to update permission mode'
    }));
  }
}

async function handleKillBackgroundProcess(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>
): Promise<void> {
  const { bashId } = data;

  if (!bashId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing bashId' }));
    return;
  }

  try {
    console.log(`🛑 Killing background process: ${bashId}`);

    const success = await backgroundProcessManager.kill(bashId as string);

    if (success) {
      ws.send(JSON.stringify({
        type: 'background_process_killed',
        bashId
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Process not found'
      }));
    }
  } catch (error) {
    console.error('Failed to kill background process:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to kill background process'
    }));
  }
}
