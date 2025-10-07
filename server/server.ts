/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { watch } from "fs";
import path from "path";
import { readFileSync, existsSync, appendFileSync } from "fs";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { sessionDb } from "./database";
import { getSystemPrompt, injectWorkingDirIntoAgents } from "./systemPrompt";
import { AVAILABLE_MODELS } from "../client/config/models";
import { configureProvider, getProviders, getMaskedApiKey } from "./providers";
import { getMcpServers, getAllowedMcpTools } from "./mcpServers";
import { AGENT_REGISTRY } from "./agents";
import { getDefaultWorkingDirectory, ensureDirectory, validateDirectory } from "./directoryUtils";
import { openDirectoryPicker } from "./directoryPicker";
import type { ServerWebSocket } from "bun";

// Determine if running in standalone mode
const IS_STANDALONE = process.env.STANDALONE_BUILD === 'true';

// Create debug log function
// In standalone mode: only writes to debug log file (silent in console)
// In dev mode: writes to console for debugging
const debugLog = (message: string) => {
  if (IS_STANDALONE) {
    try {
      const logPath = path.join(path.dirname(process.execPath), 'agent-girl-debug.log');
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      appendFileSync(logPath, logMessage, 'utf-8');
    } catch (e) {
      console.error('Failed to write debug log:', e);
    }
  } else {
    console.log(message);
  }
};

debugLog('🔍 Startup diagnostics:');
debugLog(`  - IS_STANDALONE: ${IS_STANDALONE}`);
debugLog(`  - STANDALONE_BUILD env: ${process.env.STANDALONE_BUILD}`);
debugLog(`  - process.execPath: ${process.execPath}`);
debugLog(`  - process.cwd(): ${process.cwd()}`);

// Conditionally import PostCSS only in dev mode (not standalone)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let postcss: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tailwindcss: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let autoprefixer: any = null;

if (!IS_STANDALONE) {
  postcss = (await import('postcss')).default;
  tailwindcss = (await import('@tailwindcss/postcss')).default;
  autoprefixer = (await import('autoprefixer')).default;
}

// Get the directory where the binary/script is located
const getBinaryDir = () => {
  if (IS_STANDALONE) {
    return path.dirname(process.execPath);
  }
  return process.cwd();
};

const BINARY_DIR = getBinaryDir();
debugLog(`  - BINARY_DIR: ${BINARY_DIR}`);

// In standalone mode, change working directory to binary location
// This ensures all relative paths work correctly regardless of how the binary was launched
if (IS_STANDALONE) {
  debugLog(`  - Changing cwd from ${process.cwd()} to ${BINARY_DIR}`);
  process.chdir(BINARY_DIR);
  debugLog(`  - New cwd: ${process.cwd()}`);
}

// Load environment variables
// In standalone mode, manually parse .env from binary directory
// In dev mode, use dotenv/config from project root
if (IS_STANDALONE) {
  const envPath = path.join(BINARY_DIR, '.env');
  debugLog(`  - Looking for .env at: ${envPath}`);
  debugLog(`  - .env exists: ${existsSync(envPath)}`);

  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    debugLog(`  - .env file size: ${envContent.length} bytes`);

    let keysLoaded = 0;
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) return;

      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        process.env[key] = value;
        keysLoaded++;
        // Only log the key name, not the value (for security)
        if (key === 'ANTHROPIC_API_KEY' || key === 'ZAI_API_KEY') {
          debugLog(`  - Loaded ${key}: ${value.substring(0, 10)}...`);
        }
      }
    });
    debugLog(`✅ Loaded .env from: ${envPath} (${keysLoaded} keys)`);
  } else {
    debugLog(`⚠️  .env file not found at: ${envPath}`);
  }
} else {
  debugLog('  - Using dotenv/config (dev mode)');
  await import("dotenv/config");
}

debugLog(`  - ANTHROPIC_API_KEY set: ${!!process.env.ANTHROPIC_API_KEY}`);
debugLog(`  - ZAI_API_KEY set: ${!!process.env.ZAI_API_KEY}`);

// Initialize default working directory
const DEFAULT_WORKING_DIR = getDefaultWorkingDirectory();
ensureDirectory(DEFAULT_WORKING_DIR);

// Hot reload WebSocket clients
interface HotReloadClient {
  send: (message: string) => void;
}

// Chat WebSocket clients
interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

// Store active queries for mid-stream control
const activeQueries = new Map<string, unknown>();

const hotReloadClients = new Set<HotReloadClient>();

// Watch for file changes (hot reload) - only in dev mode
if (!IS_STANDALONE) {
  watch('./client', { recursive: true }, (_eventType, filename) => {
    if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.css') || filename.endsWith('.html'))) {
      // Notify all hot reload clients
      hotReloadClients.forEach(client => {
        try {
          client.send(JSON.stringify({ type: 'reload' }));
        } catch {
          hotReloadClients.delete(client);
        }
      });
    }
  });
}

// Build model mapping from configuration
const MODEL_MAP: Record<string, { apiModelId: string; provider: string }> = {};
AVAILABLE_MODELS.forEach(model => {
  MODEL_MAP[model.id] = {
    apiModelId: model.apiModelId,
    provider: model.provider,
  };
});

const server = Bun.serve({
  port: 3001,
  idleTimeout: 120,

  websocket: {
    open(ws: ServerWebSocket<ChatWebSocketData>) {
      if (ws.data?.type === 'hot-reload') {
        hotReloadClients.add(ws);
      }
      console.log(`WebSocket opened: ${ws.data?.type}`);
    },

    async message(ws: ServerWebSocket<ChatWebSocketData>, message: string) {
      if (ws.data?.type === 'hot-reload') return;

      try {
        const data = JSON.parse(message);

        if (data.type === 'chat') {
          const { content, sessionId, model } = data;

          if (!content || !sessionId) {
            ws.send(JSON.stringify({ type: 'error', error: 'Missing content or sessionId' }));
            return;
          }

          // Save user message to database
          sessionDb.addMessage(sessionId, 'user', content);

          // Get conversation history
          const messages = sessionDb.getSessionMessages(sessionId);

          // Build conversation context for Claude
          const conversationHistory = messages
            .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n\n');

          const prompt = conversationHistory;

          // Get model configuration
          const modelConfig = MODEL_MAP[model] || MODEL_MAP['sonnet'];
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

          // Get session working directory
          const session = sessionDb.getSession(sessionId);
          if (!session) {
            console.error('❌ Session not found:', sessionId);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Session not found'
            }));
            return;
          }

          const workingDir = session.working_directory;
          const originalCwd = process.cwd();

          // Log working directory info
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📂 Working Directory Info');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔹 Session ID:', sessionId);
          console.log('🔹 Original CWD:', originalCwd);
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

          try {
            // Change to session's working directory
            try {
              process.chdir(workingDir);
              console.log('✅ Changed to working directory:', process.cwd());
            } catch (chdirError) {
              console.error('❌ Failed to change directory:', chdirError);
              const errorMessage = chdirError instanceof Error ? chdirError.message : 'Unknown error';
              ws.send(JSON.stringify({
                type: 'error',
                message: `Failed to access working directory: ${errorMessage}. The directory may have been deleted.`
              }));
              return;
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
            };

            // In standalone mode, point to the CLI in the binary directory
            if (IS_STANDALONE) {
              queryOptions.pathToClaudeCodeExecutable = path.join(BINARY_DIR, 'cli.js');
              console.log('🔧 Using Claude Code CLI at:', queryOptions.pathToClaudeCodeExecutable);
            }

            // Add MCP servers and allowed tools if provider has them
            if (Object.keys(mcpServers).length > 0) {
              queryOptions.mcpServers = mcpServers;
              queryOptions.allowedTools = allowedMcpTools;
            }

            // Query using the SDK (env vars already configured)
            const result = query({
              prompt,
              options: queryOptions
            });

            // Store query instance for mid-stream control
            activeQueries.set(sessionId, result);

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
              sessionDb.addMessage(sessionId, 'assistant', JSON.stringify(fullMessageContent));
            } else if (assistantResponse) {
              // Fallback to text-only if no full content (shouldn't happen normally)
              sessionDb.addMessage(sessionId, 'assistant', JSON.stringify([{ type: 'text', text: assistantResponse }]));
            }

            console.log(`✅ Response completed. Length: ${assistantResponse.length} chars`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // Clean up active query - but NOT if waiting for plan approval
            if (!waitingForPlanApproval) {
              activeQueries.delete(sessionId);
            } else {
              console.log('⏸️ Query kept active - waiting for plan approval');
            }

            // Send completion signal
            ws.send(JSON.stringify({ type: 'result', success: true }));

          } catch (error) {
            console.error('Claude SDK error:', error);
            ws.send(JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            }));
          } finally {
            // Always restore original working directory
            process.chdir(originalCwd);
            console.log('↩️  Restored to original directory:', process.cwd());
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          }
        } else if (data.type === 'approve_plan') {
          // Handle plan approval - switch mode to bypassPermissions and continue
          const { sessionId } = data;

          if (!sessionId) {
            ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId' }));
            return;
          }

          try {
            console.log('✅ Plan approved, switching to bypassPermissions mode');

            // Update database to bypassPermissions mode
            sessionDb.updatePermissionMode(sessionId, 'bypassPermissions');

            // Send confirmation to client
            ws.send(JSON.stringify({
              type: 'permission_mode_changed',
              mode: 'bypassPermissions'
            }));

            // Clean up any stale query reference
            activeQueries.delete(sessionId);

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
        } else if (data.type === 'set_permission_mode') {
          // Handle permission mode change request
          const { sessionId, mode } = data;

          if (!sessionId || !mode) {
            ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId or mode' }));
            return;
          }

          const activeQuery = activeQueries.get(sessionId);

          try {
            // If there's an active query, update it mid-stream
            if (activeQuery) {
              console.log(`🔄 Switching permission mode mid-stream: ${mode}`);
              await (activeQuery as { setPermissionMode: (mode: string) => Promise<void> }).setPermissionMode(mode);
            }

            // Always update database
            sessionDb.updatePermissionMode(sessionId, mode);

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
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Invalid message format'
        }));
      }
    },

    close(ws: ServerWebSocket<ChatWebSocketData>) {
      if (ws.data?.type === 'hot-reload') {
        hotReloadClients.delete(ws);
      }
      console.log(`WebSocket closed: ${ws.data?.type}`);
    }
  },

  async fetch(req: Request, server: { upgrade: (req: Request, data?: { data: ChatWebSocketData }) => boolean }) {
    const url = new URL(req.url);

    // WebSocket endpoints
    if (url.pathname === '/hot-reload') {
      const upgraded = server.upgrade(req, { data: { type: 'hot-reload' } });
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return;
    }

    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req, { data: { type: 'chat' } });
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return;
    }

    // REST API endpoints
    if (url.pathname === '/api/sessions' && req.method === 'GET') {
      const { sessions, recreatedDirectories } = sessionDb.getSessions();

      return new Response(JSON.stringify({
        sessions,
        warning: recreatedDirectories.length > 0
          ? `Recreated ${recreatedDirectories.length} missing director${recreatedDirectories.length === 1 ? 'y' : 'ies'}`
          : undefined
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/api/sessions' && req.method === 'POST') {
      const body = await req.json() as { title?: string; workingDirectory?: string };
      const session = sessionDb.createSession(body.title || 'New Chat', body.workingDirectory);
      return new Response(JSON.stringify(session), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'GET') {
      const sessionId = url.pathname.split('/').pop()!;
      const session = sessionDb.getSession(sessionId);

      if (!session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(session), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'DELETE') {
      const sessionId = url.pathname.split('/').pop()!;
      const success = sessionDb.deleteSession(sessionId);

      return new Response(JSON.stringify({ success }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'PATCH') {
      const sessionId = url.pathname.split('/').pop()!;
      const body = await req.json() as { folderName: string };

      console.log('📝 API: Rename folder request:', {
        sessionId,
        folderName: body.folderName
      });

      const result = sessionDb.renameFolderAndSession(sessionId, body.folderName);

      if (result.success) {
        const session = sessionDb.getSession(sessionId);
        return new Response(JSON.stringify({ success: true, session }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: result.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (url.pathname.match(/^\/api\/sessions\/[^/]+\/messages$/) && req.method === 'GET') {
      const sessionId = url.pathname.split('/')[3];
      const messages = sessionDb.getSessionMessages(sessionId);

      return new Response(JSON.stringify(messages), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update working directory for a session
    if (url.pathname.match(/^\/api\/sessions\/[^/]+\/directory$/) && req.method === 'PATCH') {
      const sessionId = url.pathname.split('/')[3];
      const body = await req.json() as { workingDirectory: string };

      console.log('📁 API: Update working directory request:', {
        sessionId,
        directory: body.workingDirectory
      });

      const success = sessionDb.updateWorkingDirectory(sessionId, body.workingDirectory);

      if (success) {
        const session = sessionDb.getSession(sessionId);
        return new Response(JSON.stringify({ success: true, session }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Invalid directory or session not found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Update permission mode for a session
    if (url.pathname.match(/^\/api\/sessions\/[^/]+\/mode$/) && req.method === 'PATCH') {
      const sessionId = url.pathname.split('/')[3];
      const body = await req.json() as { mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' };

      console.log('🔐 API: Update permission mode request:', {
        sessionId,
        mode: body.mode
      });

      const success = sessionDb.updatePermissionMode(sessionId, body.mode);

      if (success) {
        const session = sessionDb.getSession(sessionId);
        return new Response(JSON.stringify({ success: true, session }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate directory path
    if (url.pathname === '/api/validate-directory' && req.method === 'POST') {
      const body = await req.json() as { directory: string };

      console.log('🔍 API: Validate directory request:', body.directory);

      const validation = validateDirectory(body.directory);

      return new Response(JSON.stringify({
        valid: validation.valid,
        expanded: validation.expanded,
        error: validation.error
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Open directory picker dialog
    if (url.pathname === '/api/pick-directory' && req.method === 'POST') {
      console.log('📂 API: Opening directory picker dialog...');

      try {
        const selectedPath = await openDirectoryPicker();

        if (selectedPath) {
          console.log('✅ Directory selected:', selectedPath);
          return new Response(JSON.stringify({
            success: true,
            path: selectedPath
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          console.log('⚠️  Directory picker cancelled');
          return new Response(JSON.stringify({
            success: false,
            cancelled: true
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Directory picker error:', errorMessage);
        return new Response(JSON.stringify({
          success: false,
          error: errorMessage
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Static file serving
    if (url.pathname === '/') {
      const file = Bun.file(path.join(BINARY_DIR, 'client/index.html'));
      let html = await file.text();

      // In standalone mode, replace raw tsx with pre-built bundle
      if (IS_STANDALONE) {
        html = html.replace('/client/index.tsx', '/dist/index.js');
      } else {
        // Inject hot reload script only in dev mode
        const hotReloadScript = `
          <script>
            (function() {
              const ws = new WebSocket('ws://localhost:3001/hot-reload');
              ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'reload') {
                  window.location.reload();
                }
              };
              ws.onclose = () => {
                setTimeout(() => window.location.reload(), 1000);
              };
            })();
          </script>
        `;

        html = html.replace('</body>', `${hotReloadScript}</body>`);
      }

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    if (url.pathname.startsWith('/client/') && url.pathname.endsWith('.css')) {
      const filePath = path.join(BINARY_DIR, url.pathname);
      const file = Bun.file(filePath);

      if (await file.exists()) {
        try {
          const cssContent = await file.text();

          // In standalone mode, CSS is pre-built - serve directly
          if (IS_STANDALONE) {
            return new Response(cssContent, {
              headers: {
                'Content-Type': 'text/css',
              },
            });
          }

          // In dev mode, process CSS with PostCSS
          if (postcss && tailwindcss && autoprefixer) {
            const result = await postcss([
              tailwindcss(),
              autoprefixer,
            ]).process(cssContent, {
              from: filePath,
              to: undefined
            });

            return new Response(result.css, {
              headers: {
                'Content-Type': 'text/css',
              },
            });
          }

          // Fallback: serve raw CSS
          return new Response(cssContent, {
            headers: {
              'Content-Type': 'text/css',
            },
          });
        } catch {
          return new Response('CSS processing failed', { status: 500 });
        }
      }
    }

    // Serve pre-built bundle in standalone mode
    if (IS_STANDALONE && url.pathname === '/dist/index.js') {
      const filePath = path.join(BINARY_DIR, 'dist/index.js');
      const file = Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'application/javascript',
          },
        });
      }
    }

    // Transpile TypeScript on-the-fly (dev mode only)
    if (!IS_STANDALONE && url.pathname.startsWith('/client/') && (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts'))) {
      const filePath = path.join(BINARY_DIR, url.pathname);
      const file = Bun.file(filePath);

      if (await file.exists()) {
        try {
          const transpiled = await Bun.build({
            entrypoints: [filePath],
            target: 'browser',
            format: 'esm',
          });

          if (transpiled.success) {
            const jsCode = await transpiled.outputs[0].text();
            return new Response(jsCode, {
              headers: {
                'Content-Type': 'application/javascript',
              },
            });
          } else {
            console.error('Build failed for', filePath);
            console.error(transpiled.logs);
            return new Response(`Transpilation failed: ${transpiled.logs.join('\n')}`, { status: 500 });
          }
        } catch (error) {
          console.error('Transpilation error:', error);
          return new Response(`Transpilation error: ${error}`, { status: 500 });
        }
      }
    }

    // Serve MP3 files
    if (url.pathname.endsWith('.mp3')) {
      const filePath = path.join(BINARY_DIR, url.pathname.slice(1)); // Remove leading slash
      const file = Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'audio/mpeg',
          },
        });
      }
    }

    // Serve SVG files
    if (url.pathname.startsWith('/client/') && url.pathname.endsWith('.svg')) {
      const filePath = path.join(BINARY_DIR, url.pathname);
      const file = Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': 'image/svg+xml',
          },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
});

// ASCII Art Banner
console.log('\n');
console.log('  █████╗  ██████╗ ███████╗███╗   ██╗████████╗     ██████╗ ██╗██████╗ ██╗     ');
console.log(' ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝    ██╔════╝ ██║██╔══██╗██║     ');
console.log(' ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║       ██║  ███╗██║██████╔╝██║     ');
console.log(' ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║       ██║   ██║██║██╔══██╗██║     ');
console.log(' ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║       ╚██████╔╝██║██║  ██║███████╗');
console.log(' ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝        ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝');
console.log('\n');
console.log(`  👉 Open here: http://localhost:${server.port}`);
console.log('\n');
console.log('  ═══════════════════════════════════════════════════════════════════════════');
console.log('\n');
console.log('  All logs will show below this:');
console.log('\n');
