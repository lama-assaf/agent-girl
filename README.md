# Agent Boy - Claude Agent SDK Chat UI

A modern chat interface powered by the Claude Agent SDK, built with React, Bun, and TypeScript.

## Features

- 🤖 **Claude Agent SDK Integration** - Powered by Anthropic's official Agent SDK
- 💬 **Real-time Streaming** - WebSocket-based streaming responses
- 🗂️ **Session Management** - Persistent chat sessions with SQLite
- 🎨 **Modern UI** - Clean, responsive interface with Radix UI components
- ⚡ **Hot Reload** - Instant development feedback
- 🤖 **Claude Sonnet 4.5** - Powered by Anthropic's most intelligent model

## Prerequisites

- [Bun](https://bun.sh/) v1.0.0 or higher
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd agent-boy2
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
API_PROVIDER=anthropic
```

## Usage

### Development Mode

Start the development server with hot reload:

```bash
bun run dev
```

The application will be available at `http://localhost:3001`

### Production Build

Build the client bundle:

```bash
bun run build
```

## Architecture

### Client
- **React 18** - UI framework
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Styling
- **Zustand** - State management (if needed)
- **WebSocket** - Real-time communication

### Server
- **Bun** - Runtime and bundler
- **Claude Agent SDK** - AI agent integration
- **SQLite** - Session persistence
- **WebSocket** - Streaming responses

### Key Files

```
├── client/
│   ├── components/
│   │   ├── chat/          # Chat UI components
│   │   ├── message/       # Message rendering
│   │   ├── sidebar/       # Session sidebar
│   │   └── header/        # Header components
│   ├── hooks/             # Custom React hooks
│   └── index.tsx          # Entry point
├── server/
│   ├── server.ts          # Main server & SDK integration
│   └── database.ts        # Session database
└── data/
    └── sessions.db        # SQLite database (auto-created)
```

## API Endpoints

### WebSocket
- `ws://localhost:3001/ws` - Chat WebSocket endpoint
- `ws://localhost:3001/hot-reload` - Development hot reload

### REST API
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/:id/messages` - Get session messages
- `PATCH /api/sessions/:id` - Rename session
- `DELETE /api/sessions/:id` - Delete session

## Configuration

### Model

Uses Claude Sonnet 4.5:
- **Model ID**: `claude-sonnet-4-5-20250929`
- **Released**: September 29, 2025
- **Best for**: Complex agents, coding, and intelligent reasoning

### Claude Agent SDK Options

The server is configured with:
- **Streaming** - Real-time response streaming
- **Permission Mode** - Default tool permissions
- **System Prompt** - Customizable assistant behavior

See `server/server.ts` lines 88-96 for configuration.

## Development

### Adding New Features

1. **Client Components** - Add to `client/components/`
2. **Server Endpoints** - Extend `server/server.ts`
3. **Database Schema** - Modify `server/database.ts`

### Hot Reload

The development server watches for changes in:
- `.tsx` and `.ts` files
- `.css` files
- `.html` files

Changes trigger automatic browser reload.

## Troubleshooting

### Port Already in Use

If port 3001 is occupied:

```bash
lsof -ti:3001 | xargs kill -9
```

### Database Issues

Reset the database:

```bash
rm -rf data/
mkdir data
```

### API Key Issues

Verify your `.env` file contains:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Resources

- [Claude Agent SDK Documentation](https://docs.claude.com/en/api/agent-sdk/overview)
- [Anthropic API Reference](https://docs.anthropic.com/)
- [Bun Documentation](https://bun.sh/docs)
