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
import { loadUserConfig } from "../userConfig";
import { parseApiError, getUserFriendlyMessage } from "../utils/apiErrors";
import { TimeoutController } from "../utils/timeout";
import { sessionStreamManager } from "../sessionStreamManager";

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

  // Extract text content for prompt
  let promptText = typeof content === 'string' ? content : '';
  if (Array.isArray(content)) {
    // Extract text blocks from content array
    const textBlocks = (content as Array<Record<string, unknown>>)
      .filter(b => b.type === 'text')
      .map(b => b.text as string);
    promptText = textBlocks.join('\n');
  }

  // Inject attachment paths into prompt if any
  if (imagePaths.length > 0 || filePaths.length > 0) {
    const attachmentLines: string[] = [];
    imagePaths.forEach(p => attachmentLines.push(`[Image attached: ${p}]`));
    filePaths.forEach(p => attachmentLines.push(`[File attached: ${p}]`));
    promptText = attachmentLines.join('\n') + '\n\n' + promptText;
  }

  // Check if this is a new session or continuing existing
  const isNewStream = !sessionStreamManager.hasStream(sessionId as string);

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

  // Minimal request logging - one line summary
  console.log(`📨 [${apiModelId} @ ${provider}] Session: ${sessionId?.toString().substring(0, 8)} (${session.mode} mode) ${isNewStream ? '🆕 NEW' : '♻️ CONTINUE'}`);

  // Validate working directory (only log on failure)
  const validation = validateDirectory(workingDir);
  if (!validation.valid) {
    console.error('❌ Working directory invalid:', validation.error);
    ws.send(JSON.stringify({
      type: 'error',
      message: `Working directory error: ${validation.error}`
    }));
    return;
  }

  // For existing streams: Update WebSocket, enqueue message, and return
  // Background response loop is already running
  if (!isNewStream) {
    sessionStreamManager.updateWebSocket(sessionId as string, ws);
    sessionStreamManager.sendMessage(sessionId as string, promptText);
    return; // Background loop handles response
  }

  // For NEW streams: Spawn SDK and start background response processing
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

    // Capture stderr output for better error messages
    let stderrOutput = '';

    const queryOptions: Record<string, unknown> = {
      model: apiModelId,
      systemPrompt: systemPromptWithContext,
      permissionMode: session.permission_mode || 'bypassPermissions', // Use session's permission mode
      includePartialMessages: true,
      agents: agentsWithWorkingDir, // Register custom agents with working dir context
      cwd: workingDir, // Set working directory for all tool executions
      executable: 'bun', // Explicitly specify bun as the runtime for SDK subprocess

      // Capture stderr from SDK's bundled CLI for debugging and error context
      stderr: (data: string) => {
        const trimmedData = data.trim();

        // Skip logging the massive system prompt dump from CLI spawn command
        if (trimmedData.includes('Spawning Claude Code process:') && trimmedData.includes('--system-prompt')) {
          return; // Skip this line entirely
        }

        console.error('🔴 SDK CLI stderr:', trimmedData);

        // Only capture lines that look like actual errors, not debug output or command echoes
        const lowerData = trimmedData.toLowerCase();
        const isActualError =
          lowerData.includes('error:') ||
          lowerData.includes('error ') ||
          lowerData.includes('invalid api key') ||
          lowerData.includes('authentication') ||
          lowerData.includes('unauthorized') ||
          lowerData.includes('permission') ||
          lowerData.includes('forbidden') ||
          lowerData.includes('credit') ||
          lowerData.includes('insufficient') ||
          lowerData.includes('quota') ||
          lowerData.includes('billing') ||
          lowerData.includes('rate limit') ||
          lowerData.includes('failed') ||
          lowerData.includes('401') ||
          lowerData.includes('403') ||
          lowerData.includes('429') ||
          (lowerData.includes('status') && (lowerData.includes('4') || lowerData.includes('5'))); // 4xx/5xx errors

        if (isActualError) {
          // Only keep actual error messages, limit to 300 chars
          stderrOutput = (stderrOutput + '\n' + trimmedData).slice(-300);
        }
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
        // Send warning notification to client (use safeSend for WebSocket lifecycle safety)
        sessionStreamManager.safeSend(
          sessionId as string,
          JSON.stringify({
            type: 'timeout_warning',
            message: 'AI is taking longer than usual...',
            elapsedSeconds: 60,
            sessionId: sessionId,
          })
        );
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
        // Only log retries (not first attempt)
        if (attemptNumber > 1) {
          console.log(`🔄 Retry attempt ${attemptNumber}/${MAX_RETRIES}`);
        }

        // Create AsyncIterable stream for this session
        const messageStream = sessionStreamManager.getOrCreateStream(sessionId as string);

        // Spawn SDK with AsyncIterable stream
        const result = query({
          prompt: messageStream,
          options: queryOptions
        });

        // Register query and store for mid-stream control
        sessionStreamManager.registerQuery(sessionId as string, result);
        activeQueries.set(sessionId as string, result);

        // Set active WebSocket for this session
        sessionStreamManager.updateWebSocket(sessionId as string, ws);

        // Enqueue first message to stream
        sessionStreamManager.sendMessage(sessionId as string, promptText);

        console.log(`🚀 SDK subprocess spawned with AsyncIterable stream`);

        // Start background response processing loop (non-blocking)
        // This loop runs continuously, processing responses for ALL messages in the session
        (async () => {
          // Per-turn state (resets after each completion)
          let currentMessageContent: unknown[] = [];
          let currentTextResponse = '';
          let waitingForPlanApproval = false;
          let totalCharCount = 0;
          let currentMessageId: string | null = null; // Track DB message ID for incremental saves

          try {
            // Stream the response - query() is an AsyncGenerator
            // Loop runs indefinitely, processing message after message
            for await (const message of result) {
              // Reset timeout on each event (inactivity timer)
              timeoutController.reset();
              timeoutController.checkTimeout();

              // Handle turn completion
              if (message.type === 'result') {
                console.log(`✅ Turn completed: ${message.subtype}`);

                // Final save (if no content was saved incrementally)
                if (!currentMessageId) {
                  if (currentMessageContent.length > 0) {
                    sessionDb.addMessage(sessionId as string, 'assistant', JSON.stringify(currentMessageContent));
                  } else if (currentTextResponse) {
                    sessionDb.addMessage(sessionId as string, 'assistant', JSON.stringify([{ type: 'text', text: currentTextResponse }]));
                  }
                }

                // Send completion signal (safe send checks WebSocket readyState)
                sessionStreamManager.safeSend(
                  sessionId as string,
                  JSON.stringify({ type: 'result', success: true, sessionId: sessionId })
                );

                // Cancel timeout for this turn (will restart on next message)
                timeoutController.cancel();

                // Reset state for next turn
                currentMessageContent = [];
                currentTextResponse = '';
                waitingForPlanApproval = false;
                totalCharCount = 0;
                currentMessageId = null; // Reset message ID for next turn

                // Continue loop - wait for next message from stream
                continue;
              }

              if (message.type === 'stream_event') {
        // Handle streaming events for real-time updates
        const event = message.event;

        if (event.type === 'content_block_start') {
          // Send thinking block start notification to client
          if (event.content_block?.type === 'thinking') {
            sessionStreamManager.safeSend(
              sessionId as string,
              JSON.stringify({
                type: 'thinking_start',
                sessionId: sessionId,
              })
            );
          }
        } else if (event.type === 'content_block_delta') {
          // Count all delta types: text_delta, input_json_delta, thinking_delta
          let deltaChars = 0;

          if (event.delta?.type === 'text_delta') {
            const text = event.delta.text;
            currentTextResponse += text;
            deltaChars = text.length;

            sessionStreamManager.safeSend(
              sessionId as string,
              JSON.stringify({
                type: 'assistant_message',
                content: text,
                sessionId: sessionId,
              })
            );

            // Incremental save for text (every 500 chars or on tool boundaries)
            if (currentTextResponse.length % 500 < text.length) {
              if (!currentMessageId) {
                // Create message on first text
                const msg = sessionDb.addMessage(
                  sessionId as string,
                  'assistant',
                  JSON.stringify([{ type: 'text', text: currentTextResponse }])
                );
                currentMessageId = msg.id;
              } else {
                // Update existing message with accumulated text
                const contentToSave = currentMessageContent.length > 0
                  ? currentMessageContent.concat([{ type: 'text', text: currentTextResponse }])
                  : [{ type: 'text', text: currentTextResponse }];
                sessionDb.updateMessage(currentMessageId, JSON.stringify(contentToSave));
              }
            }
          } else if (event.delta?.type === 'input_json_delta') {
            // Tool input being generated (like Write tool file content)
            const jsonDelta = event.delta.partial_json || '';
            deltaChars = jsonDelta.length;
          } else if (event.delta?.type === 'thinking_delta') {
            // Claude's internal reasoning/thinking
            const thinkingText = event.delta.thinking || '';
            deltaChars = thinkingText.length;

            sessionStreamManager.safeSend(
              sessionId as string,
              JSON.stringify({
                type: 'thinking_delta',
                content: thinkingText,
                sessionId: sessionId,
              })
            );
          } else {
            // Log unknown delta types for debugging
            console.log('⚠️ Unknown delta type:', event.delta?.type);
          }

          // Update total character count and estimate tokens (~4 chars/token)
          totalCharCount += deltaChars;
          const estimatedTokens = Math.floor(totalCharCount / 4);

          // Send estimated token count update
          if (deltaChars > 0) {
            sessionStreamManager.safeSend(
              sessionId as string,
              JSON.stringify({
                type: 'token_update',
                outputTokens: estimatedTokens,
                sessionId: sessionId,
              })
            );
          }
        }
              } else if (message.type === 'assistant') {
                // Capture full message content structure for database storage
                const content = message.message.content;
                if (Array.isArray(content)) {
                  // Append blocks instead of replacing (SDK may send multiple assistant messages)
                  currentMessageContent.push(...content);

                  // Incremental save: Create or update message in database
                  if (!currentMessageId) {
                    // First content - create message
                    const msg = sessionDb.addMessage(
                      sessionId as string,
                      'assistant',
                      JSON.stringify(currentMessageContent)
                    );
                    currentMessageId = msg.id;
                  } else {
                    // Subsequent content - update existing message
                    sessionDb.updateMessage(currentMessageId, JSON.stringify(currentMessageContent));
                  }

          // Handle tool use from complete assistant message
          for (const block of content) {
            if (block.type === 'tool_use') {
              // Check if this is ExitPlanMode tool
              if (block.name === 'ExitPlanMode') {
                console.log('🛡️ ExitPlanMode detected, sending plan to client');
                waitingForPlanApproval = true;
                sessionStreamManager.safeSend(
                  sessionId as string,
                  JSON.stringify({
                    type: 'exit_plan_mode',
                    plan: (block.input as Record<string, unknown>)?.plan || 'No plan provided',
                    sessionId: sessionId,
                  })
                );
              }

              // Background processes are now intercepted and spawned via PreToolUse hook
              // No need for detection here since the hook blocks SDK execution

              sessionStreamManager.safeSend(
                sessionId as string,
                JSON.stringify({
                  type: 'tool_use',
                  toolId: block.id,
                  toolName: block.name,
                  toolInput: block.input,
                  sessionId: sessionId,
                })
              );
            }
                }
              }
            }
          } // End for-await loop

          } catch (error) {
            // Background loop error - log and cleanup
            console.error(`❌ Background response loop error for session ${sessionId}:`, error);
            sessionStreamManager.cleanupSession(sessionId as string, 'loop_error');
            activeQueries.delete(sessionId as string);

            // Send error to client
            sessionStreamManager.safeSend(
              sessionId as string,
              JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Response processing error',
                sessionId: sessionId,
              })
            );
          } finally {
            console.log(`🏁 Background loop ended for session ${sessionId?.toString().substring(0, 8)}`);
          }
        })(); // Execute async IIFE immediately (non-blocking)

        // Success! SDK spawned and background loop started
        console.log(`✅ Request handling complete - background loop running`);
        break; // Exit retry loop

      } catch (error) {
        _lastError = error;
        console.error(`❌ Query attempt ${attemptNumber}/${MAX_RETRIES} failed:`, error);

        // Parse error with stderr context for better error messages
        const parsedError = parseApiError(error, stderrOutput);
        console.log('📊 Parsed error:', {
          type: parsedError.type,
          message: parsedError.message,
          isRetryable: parsedError.isRetryable,
          requestId: parsedError.requestId,
          stderrContext: parsedError.stderrContext ? parsedError.stderrContext.slice(0, 100) + '...' : undefined,
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
    // No stderr context available here since this is before SDK initialization
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
