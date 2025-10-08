/**
 * WebSocket Message Handlers
 * Handles all WebSocket message types for the chat interface
 */

import type { ServerWebSocket } from "bun";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { HookInput } from "@anthropic-ai/claude-agent-sdk/sdkTypes";
import { sessionDb } from "../database";
import { getSystemPrompt, injectWorkingDirIntoAgents } from "../systemPrompt";
import { AVAILABLE_MODELS } from "../../client/config/models";
import { configureProvider, getProviders, getMaskedApiKey } from "../providers";
import { getMcpServers, getAllowedMcpTools } from "../mcpServers";
import { AGENT_REGISTRY } from "../agents";
import { validateDirectory } from "../directoryUtils";
import { saveImageToSessionPictures, saveFileToSessionFiles } from "../imageUtils";
import { backgroundProcessManager } from "../backgroundProcessManager";

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

export async function handleWebSocketMessage(
  ws: ServerWebSocket<ChatWebSocketData>,
  message: string,
  activeQueries: Map<string, unknown>,
  IS_STANDALONE: boolean,
  BINARY_DIR: string
): Promise<void> {
  if (ws.data?.type === 'hot-reload') return;

  try {
    const data = JSON.parse(message);

    if (data.type === 'chat') {
      await handleChatMessage(ws, data, activeQueries, IS_STANDALONE, BINARY_DIR);
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

async function handleChatMessage(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>,
  activeQueries: Map<string, unknown>,
  IS_STANDALONE: boolean,
  BINARY_DIR: string
): Promise<void> {
  const { content, sessionId, model } = data;

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
  const messages = sessionDb.getSessionMessages(sessionId as string);

  // Build conversation context for Claude
  // Parse JSON content for messages with images (array format)
  const conversationHistory = messages
    .map(msg => {
      let displayContent = msg.content;
      // Try to parse JSON for structured content
      try {
        const parsed = JSON.parse(msg.content);
        if (Array.isArray(parsed)) {
          // Extract text from blocks
          displayContent = parsed
            .filter((block: Record<string, unknown>) => block.type === 'text')
            .map((block: Record<string, unknown>) => block.text)
            .join('\n');
        }
      } catch {
        // Not JSON, use as-is
      }
      return `${msg.type === 'user' ? 'User' : 'Assistant'}: ${displayContent}`;
    })
    .join('\n\n');

  let prompt = conversationHistory;

  // Inject attachment paths for model access
  if (imagePaths.length > 0 || filePaths.length > 0) {
    const attachmentLines: string[] = [];

    // Add image paths (for MCP vision tools on GLM models)
    imagePaths.forEach(p => attachmentLines.push(`[Image attached: ${p}]`));

    // Add file paths (for Read tool on all models)
    filePaths.forEach(p => attachmentLines.push(`[File attached: ${p}]`));

    const pathsText = attachmentLines.join('\n');

    // Find the last "User: " in the prompt and inject paths after it
    const lastUserIndex = prompt.lastIndexOf('User: ');
    if (lastUserIndex !== -1) {
      const beforeUser = prompt.substring(0, lastUserIndex + 6); // "User: "
      const afterUser = prompt.substring(lastUserIndex + 6);
      prompt = `${beforeUser}${pathsText}\n\n${afterUser}`;
    }
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

  let assistantResponse = '';

  // Log working directory info
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 Working Directory Info');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔹 Session ID:', sessionId);
  console.log('🔹 Session Working Dir:', workingDir);

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

    // Build query options with provider-specific system prompt (including agent list)
    // Add working directory context to system prompt AND all agent prompts
    const baseSystemPrompt = getSystemPrompt(providerType, AGENT_REGISTRY);
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
    };

    // In standalone mode, point to the CLI in node_modules
    if (IS_STANDALONE) {
      queryOptions.pathToClaudeCodeExecutable = `${BINARY_DIR}/node_modules/@anthropic-ai/claude-code/cli.js`;
      console.log('🔧 Using Claude Code CLI at:', queryOptions.pathToClaudeCodeExecutable);
    }

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

    // Stream the response - query() is an AsyncGenerator
    for await (const message of result) {
      if (message.type === 'stream_event') {
        // Handle streaming events for real-time updates
        const event = message.event;

        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const text = event.delta.text;
          assistantResponse += text;
          ws.send(JSON.stringify({
            type: 'assistant_message',
            content: text,
            sessionId: sessionId,  // Include sessionId for client-side filtering
          }));
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
    ws.send(JSON.stringify({ type: 'result', success: true }));

  } catch (error) {
    console.error('Claude SDK error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
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
