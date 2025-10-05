# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Boy is a modern chat interface powered by the Claude Agent SDK. It's built with React, Bun, and TypeScript, featuring real-time streaming responses via WebSocket and persistent session storage with SQLite.

## Development Commands

### Start Development Server
```bash
bun run dev
```
Starts the server at `http://localhost:3001` with hot reload enabled. The server watches for changes in `.tsx`, `.ts`, `.css`, and `.html` files in the `client/` directory.

### Build Client Bundle
```bash
bun run build
```
Builds the client bundle to `./dist` with minification.

### Run Tests
```bash
bun test              # Run all tests
bun test --watch      # Run tests in watch mode
```

### Port Management
If port 3001 is already in use:
```bash
lsof -ti:3001 | xargs kill -9
```

### Database Reset
To reset the SQLite database:
```bash
rm -rf data/
mkdir data
```

## Architecture

### Core Integration Pattern

The application uses the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) for AI interactions. Key integration points:

1. **WebSocket-based Streaming**: Real-time message streaming via `server/server.ts:95-145`
2. **Session Persistence**: SQLite database manages conversation history via `server/database.ts`
3. **Model Configuration**: Centralized in `client/config/models.ts` with mapping in `server/server.ts:37-39`

### Claude Agent SDK Usage

The SDK is integrated in `server/server.ts` using the `query()` function:

```typescript
const result = query({
  prompt,
  options: {
    model: modelId,
    systemPrompt: 'You are a helpful AI assistant...',
    permissionMode: 'bypassPermissions', // Full tool access
    includePartialMessages: true,
  }
});

// Stream response as AsyncGenerator
for await (const message of result) {
  if (message.type === 'stream_event') {
    // Handle streaming text deltas
  } else if (message.type === 'assistant') {
    // Handle complete assistant messages with tool use
  }
}
```

**Important**: The SDK uses `permissionMode: 'bypassPermissions'` to enable all tools without restrictions (line 100).

### WebSocket Message Flow

1. **Client → Server**: User messages sent via WebSocket at `/ws` endpoint
2. **Server → Claude SDK**: Conversation history built from database and passed to `query()`
3. **Claude SDK → Server**: Streaming response via AsyncGenerator
4. **Server → Client**: Real-time text deltas and tool use events
5. **Database**: Both user and assistant messages persisted to SQLite

### Message Structure

The codebase uses a hybrid message format:

- **User messages**: `content` is a string
- **Assistant messages**: `content` is an array of blocks (`text` or `tool_use`)

This is handled in `client/components/chat/ChatContainer.tsx:56-62` when converting database messages to UI format.

### Session Management

Sessions are managed through:
- **Database**: `server/database.ts` (SessionDatabase class)
- **API Hook**: `client/hooks/useSessionAPI.ts`
- **REST Endpoints**:
  - `GET /api/sessions` - List all sessions
  - `POST /api/sessions` - Create new session
  - `GET /api/sessions/:id` - Get session details
  - `GET /api/sessions/:id/messages` - Get session messages
  - `PATCH /api/sessions/:id` - Rename session
  - `DELETE /api/sessions/:id` - Delete session

### File Structure

```
├── server/
│   ├── server.ts          # Main server, WebSocket handler, Claude SDK integration
│   └── database.ts        # SQLite session and message persistence
├── client/
│   ├── components/
│   │   ├── chat/          # ChatContainer (main orchestrator), MessageList, ChatInput
│   │   ├── message/       # AssistantMessage, UserMessage, MessageRenderer
│   │   ├── sidebar/       # Session sidebar
│   │   └── header/        # ModelSelector
│   ├── hooks/
│   │   ├── useWebSocket.ts    # WebSocket connection with reconnect logic
│   │   └── useSessionAPI.ts   # REST API calls for session management
│   ├── config/
│   │   └── models.ts      # Centralized model configuration
│   └── index.tsx          # Entry point
└── data/
    └── sessions.db        # SQLite database (auto-created)
```

## Environment Setup

Required environment variables (see `.env.example`):

```env
API_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

The application supports two providers:
1. **Anthropic** - Direct Claude API access
2. **Z.AI** - Anthropic-compatible proxy (requires additional `ANTHROPIC_BASE_URL` config)

## Adding New Models

To add a new model:

1. Update `client/config/models.ts`:
```typescript
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'sonnet',
    name: 'Claude Sonnet 4.5',
    description: 'Description here',
    apiModelId: 'claude-sonnet-4-5-20250929',
  },
  // Add new model here
];
```

2. Update `server/server.ts` model mapping:
```typescript
const MODEL_MAP: Record<string, string> = {
  'sonnet': 'claude-sonnet-4-5-20250929',
  // Add new model mapping here
};
```

## Hot Reload System

The development server implements file watching and hot reload:

1. **Server side**: `fs.watch()` monitors `client/` directory (server.ts:23-34)
2. **Client side**: Hot reload WebSocket at `/hot-reload` receives reload signals
3. **Injection**: Hot reload script injected into HTML at runtime (server.ts:269-284)

When files change, all connected clients automatically reload.

## Key Technical Details

### Bun-specific Features
- **Runtime**: Bun serves as both runtime and bundler
- **TypeScript**: Direct `.ts`/`.tsx` execution without separate transpilation
- **SQLite**: Native `bun:sqlite` integration
- **Build**: `Bun.build()` for on-the-fly transpilation in dev mode (server.ts:332-344)

### State Management
- **WebSocket state**: `useWebSocket` hook with auto-reconnect (max 5 attempts, 3s delay)
- **Session state**: Local React state synchronized with database via REST API
- **Model selection**: Persisted to localStorage (`agent-boy-model` key)

### Message Streaming Pattern

Assistant responses are built incrementally:

1. First text delta creates new assistant message
2. Subsequent deltas append to last text block
3. Tool use blocks appended when received
4. Complete response saved to database when stream ends

See `ChatContainer.tsx:103-186` for full implementation.

## Database Schema

```sql
-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)

-- Messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'user' or 'assistant'
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
)

-- Index for performance
CREATE INDEX idx_messages_session_id ON messages(session_id)
```

## Common Pitfalls

1. **Port conflicts**: Port 3001 must be available before starting dev server
2. **API key**: Must be valid Anthropic API key in `.env`
3. **Database location**: Database auto-created at `./data/sessions.db` - ensure `data/` directory is writable
4. **Model ID mismatch**: Ensure client model IDs map correctly in `MODEL_MAP`
5. **WebSocket reconnection**: Maximum 5 reconnection attempts before manual intervention needed
