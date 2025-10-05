import { watch } from "fs";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { sessionDb } from "./database";
import type { ServerWebSocket } from "bun";

// Load environment variables
import "dotenv/config";

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

// Model mapping
const MODEL_MAP: Record<string, string> = {
  'opus': 'claude-opus-4-20250514',
  'sonnet': 'claude-sonnet-4-5-20250929',
  'haiku': 'claude-3-5-haiku-20241022',
};

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

          // Use Claude Agent SDK
          const modelId = MODEL_MAP[model] || MODEL_MAP['sonnet'];

          let assistantResponse = '';

          try {
            // Query Claude using the SDK
            const result = query({
              prompt,
              options: {
                model: modelId,
                systemPrompt: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.',
                permissionMode: 'default',
                includePartialMessages: true,
              }
            });

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
                // Handle tool use from complete assistant message
                const content = message.message.content;

                if (Array.isArray(content)) {
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

            // Save assistant response to database
            if (assistantResponse) {
              sessionDb.addMessage(sessionId, 'assistant', assistantResponse);
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
      const body = await req.json();
      const session = sessionDb.createSession(body.title || 'New Chat');
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
      const body = await req.json();
      const success = sessionDb.renameSession(sessionId, body.title);

      return new Response(JSON.stringify({ success }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.match(/^\/api\/sessions\/[^/]+\/messages$/) && req.method === 'GET') {
      const sessionId = url.pathname.split('/')[3];
      const messages = sessionDb.getSessionMessages(sessionId);

      return new Response(JSON.stringify(messages), {
        headers: { 'Content-Type': 'application/json' },
      });
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
