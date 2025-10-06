import { watch } from "fs";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { sessionDb } from "./database";
import { getSystemPrompt } from "./systemPrompt";
import { AVAILABLE_MODELS } from "../client/config/models";
import { configureProvider, PROVIDERS, getMaskedApiKey } from "./providers";
import { getMcpServers, getAllowedMcpTools } from "./mcpServers";
import { AGENT_REGISTRY } from "./agents";
import { getDefaultWorkingDirectory, ensureDirectory, getPlatformInfo, validateDirectory } from "./directoryUtils";
import { openDirectoryPicker } from "./directoryPicker";
import type { ServerWebSocket } from "bun";

// Load environment variables
import "dotenv/config";

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

const hotReloadClients = new Set<HotReloadClient>();

// Watch for file changes (hot reload)
watch('./client', { recursive: true }, (_eventType, filename) => {
  if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.css') || filename.endsWith('.html'))) {
    // Notify all hot reload clients
    hotReloadClients.forEach(client => {
      try {
        client.send(JSON.stringify({ type: 'reload' }));
      } catch (err) {
        hotReloadClients.delete(client);
      }
    });
  }
});

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
          configureProvider(providerType);

          // Get provider config for logging
          const providerConfig = PROVIDERS[providerType];

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
            const queryOptions: any = {
              model: apiModelId,
              systemPrompt: getSystemPrompt(providerType, AGENT_REGISTRY),
              permissionMode: 'bypassPermissions', // Enable all tools without restrictions
              includePartialMessages: true,
              agents: AGENT_REGISTRY, // Register custom agents (already in SDK format)
            };

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

            console.log(`✅ Query initialized successfully`);

            // Track full message content structure for saving to database
            let fullMessageContent: any[] = [];

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
                      ws.send(JSON.stringify({
                        type: 'tool_use',
                        toolId: block.id,
                        toolName: block.name,
                        toolInput: block.input,
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
      const sessions = sessionDb.getSessions();
      return new Response(JSON.stringify(sessions), {
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
      const file = Bun.file('./client/index.html');
      let html = await file.text();

      // Inject hot reload script
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

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    if (url.pathname.startsWith('/client/') && url.pathname.endsWith('.css')) {
      const filePath = `.${url.pathname}`;
      const file = Bun.file(filePath);

      if (await file.exists()) {
        try {
          const cssContent = await file.text();

          const postcss = require('postcss');
          const tailwindcss = require('@tailwindcss/postcss');
          const autoprefixer = require('autoprefixer');

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
        } catch (error) {
          return new Response('CSS processing failed', { status: 500 });
        }
      }
    }

    if (url.pathname.startsWith('/client/') && (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts'))) {
      const filePath = `.${url.pathname}`;
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

    // Serve SVG files
    if (url.pathname.startsWith('/client/') && url.pathname.endsWith('.svg')) {
      const filePath = `.${url.pathname}`;
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

console.log(`🚀 Server running at http://localhost:${server.port}`);
console.log(`📡 WebSocket endpoint: ws://localhost:${server.port}/ws`);
console.log(`🗄️  Database initialized`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏠 Working Directory Configuration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const platformInfo = getPlatformInfo();
console.log(`💻 Platform: ${platformInfo.platform} (${platformInfo.os})`);
console.log(`🏠 Home Directory: ${platformInfo.home}`);
console.log(`📁 Default Working Directory: ${DEFAULT_WORKING_DIR}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
