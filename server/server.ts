import { watch } from "fs";

// Hot reload WebSocket clients
interface HotReloadClient {
  send: (message: string) => void;
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

const server = Bun.serve({
  port: 3001,
  idleTimeout: 120,

  websocket: {
    open(ws: HotReloadClient & { data?: { type?: string } }) {
      if (ws.data?.type === 'hot-reload') {
        hotReloadClients.add(ws);
      }
    },

    message(_ws: HotReloadClient, _message: string) {
      // Hot reload only, no other WebSocket logic
    },

    close(ws: HotReloadClient & { data?: { type?: string } }) {
      if (ws.data?.type === 'hot-reload') {
        hotReloadClients.delete(ws);
      }
    }
  },

  async fetch(req: Request, server: { upgrade: (req: Request, data?: { data: { type?: string } }) => boolean }) {
    const url = new URL(req.url);

    if (url.pathname === '/hot-reload') {
      const upgraded = server.upgrade(req, { data: { type: 'hot-reload' } });
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return;
    }

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
