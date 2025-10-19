# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Girl is a modern chat interface powered by the Claude Agent SDK. It's built with React, Bun, and TypeScript, featuring real-time streaming responses via WebSocket and persistent session storage with SQLite.

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

### OAuth Authentication (Claude Pro/Max)
```bash
bun run login         # Log in with Claude subscription
bun run logout        # Log out and clear OAuth tokens
bun run auth:status   # Check authentication status
```

**IMPORTANT**: When logged in with OAuth, your API key is **never used**. This ensures you use your Claude Pro/Max subscription instead of API credits, saving money!

See [OAUTH.md](./OAUTH.md) for full OAuth documentation.

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

The application uses the **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) for AI interactions. The SDK bundles the Claude Code CLI internally and spawns it as a subprocess using **Node.js** to handle tool execution (Read, Write, Bash, etc.).

**Important**: The SDK subprocess requires Node.js v18+ even though the server runs on Bun. This ensures compatibility with the SDK's native runtime environment and resolves potential timeout issues.

Key integration points:

1. **WebSocket-based Streaming**: Real-time message streaming via `server/server.ts:145-183`
2. **Session Persistence**: SQLite database manages conversation history via `server/database.ts`
3. **Model Configuration**: Centralized in `client/config/models.ts` with provider mapping in `server/server.ts:42-48`
4. **Multi-provider Support**: Provider configuration in `server/providers.ts` (Anthropic, Z.AI)
5. **Custom Agents**: Specialized agents defined in `server/agents.ts` (researcher, code-reviewer, debugger, test-writer, documenter)
6. **MCP Integration**: MCP servers configured per-provider in `server/mcpServers.ts`
7. **Bundled CLI**: SDK includes Claude Code CLI at `node_modules/@anthropic-ai/claude-agent-sdk/cli.js` for tool execution

### Claude Agent SDK Usage

The SDK is integrated in `server/server.ts` using the `query()` function:

```typescript
const result = query({
  prompt,
  options: {
    model: apiModelId,
    systemPrompt: getSystemPrompt(providerType, AGENT_REGISTRY), // Dynamic prompt
    permissionMode: 'bypassPermissions', // Full tool access
    includePartialMessages: true,
    agents: AGENT_REGISTRY, // Custom specialized agents
    mcpServers: mcpServers, // Provider-specific MCP servers
    allowedTools: allowedMcpTools, // MCP tool whitelist
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

**Important**:
- Uses `permissionMode: 'bypassPermissions'` to enable all tools without restrictions (server.ts:126)
- System prompt is generated dynamically based on provider and includes custom agent list (server.ts:125)
- Custom agents are registered via the `agents` option to enable spawning with Task tool

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
│   ├── database.ts        # SQLite session and message persistence
│   ├── providers.ts       # Multi-provider configuration (Anthropic, Z.AI)
│   ├── agents.ts          # Custom agent registry and definitions
│   ├── mcpServers.ts      # MCP server configuration per provider
│   └── systemPrompt.ts    # Dynamic system prompt generation
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
│   │   └── models.ts      # Centralized model configuration (with providers)
│   └── index.tsx          # Entry point
└── data/
    └── sessions.db        # SQLite database (auto-created)
```

## Environment Setup

The application supports **multi-provider architecture** with two providers:

### Anthropic (Default)
```env
API_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
```
- Uses direct Claude API access at `https://api.anthropic.com`
- No MCP servers (uses built-in Claude Code tools)
- Best for: Claude Sonnet 4.5 and other Anthropic models

### Z.AI (Alternative Provider)
```env
API_PROVIDER=z-ai
ZAI_API_KEY=your-zai-key-here
```
- Uses Z.AI's Anthropic-compatible API at `https://api.z.ai/api/anthropic`
- Includes MCP server for web search (`mcp__web-search-prime__search`)
- Best for: GLM 4.6 and other Z.AI models

**Provider Configuration**: The `configureProvider()` function in `server/providers.ts` dynamically sets `ANTHROPIC_BASE_URL` and `ANTHROPIC_API_KEY` environment variables based on the selected model's provider.

## Adding New Models

To add a new model, simply update `client/config/models.ts`:

```typescript
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'sonnet',
    name: 'Claude Sonnet 4.5',
    description: 'Anthropic\'s most intelligent model for complex agents and coding',
    apiModelId: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic', // or 'z-ai'
  },
  // Add new model here
];
```

**Note**: No need to update `server/server.ts` - the model mapping is built automatically from `AVAILABLE_MODELS` (server.ts:42-48). The provider determines which API endpoint and MCP servers to use.

## MCP Servers Integration

The application supports **Model Context Protocol (MCP) servers** on a per-provider basis. MCP servers are configured in `server/mcpServers.ts`.

### Provider-specific MCP Servers

- **Anthropic**: No MCP servers (uses built-in Claude Code tools like `WebSearch`, `WebFetch`, etc.)
- **Z.AI**: Includes `web-search-prime` MCP server for web search capabilities
  - Tool: `mcp__web-search-prime__search`
  - HTTP-based MCP server at `https://api.z.ai/api/mcp/web_search_prime/mcp`
  - Requires `ZAI_API_KEY` for authentication

### Adding New MCP Servers

To add an MCP server for a provider, update `server/mcpServers.ts`:

```typescript
export const MCP_SERVERS_BY_PROVIDER: Record<ProviderType, Record<string, McpServerConfig>> = {
  'z-ai': {
    'my-mcp-server': {
      type: 'http', // or 'stdio'
      url: 'https://api.example.com/mcp',
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
      },
    },
  },
};

// Add allowed tools
export function getAllowedMcpTools(provider: ProviderType): string[] {
  if (provider === 'z-ai') {
    return [
      'mcp__web-search-prime__search',
      'mcp__my-mcp-server__tool-name', // Format: mcp__{server}__{tool}
    ];
  }
  return [];
}
```

The MCP configuration is automatically passed to the SDK via `mcpServers` and `allowedTools` options (server.ts:132-135).

## Custom Agents System

The application extends Claude Code with **custom specialized agents** that can be spawned using the Task tool. Agents are defined in `server/agents.ts` and automatically registered with the Claude Agent SDK.

### Available Custom Agents

1. **researcher** - Expert at gathering information and analyzing data
2. **code-reviewer** - Reviews code for bugs, security issues, and best practices
3. **debugger** - Tracks down bugs systematically
4. **test-writer** - Creates comprehensive tests with high coverage
5. **documenter** - Writes clear documentation and examples

### Adding New Custom Agents

Add to `server/agents.ts`:

```typescript
export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  'my-agent': {
    description: 'Brief description shown in agent list',
    prompt: 'Detailed instructions for the agent\'s behavior...',
    tools: ['Read', 'Write', 'Grep'], // Optional: restrict tools
    model: 'sonnet', // Optional: override model
  },
};
```

The agent will automatically:
- Appear in the system prompt's agent list
- Be registered with the SDK via the `agents` option (server.ts:128)
- Be spawnable via Task tool with `subagent_type: 'my-agent'`

### Agent Nesting

The UI supports **nested tool visualization** - when a Task tool spawns sub-agents, their tool use is displayed nested under the parent Task. See `ChatContainer.tsx:146-227` for the nesting logic.

## Hot Reload System

The development server implements file watching and hot reload:

1. **Server side**: `fs.watch()` monitors `client/` directory (server.ts:28-39)
2. **Client side**: Hot reload WebSocket at `/hot-reload` receives reload signals
3. **Injection**: Hot reload script injected into HTML at runtime (server.ts:307-324)

When files change, all connected clients automatically reload.

## Key Technical Details

### Bun-specific Features
- **Runtime**: Bun serves as both runtime and bundler
- **TypeScript**: Direct `.ts`/`.tsx` execution without separate transpilation
- **SQLite**: Native `bun:sqlite` integration for zero-config database
- **Build**: `Bun.build()` for on-the-fly transpilation in dev mode (server.ts:370-382)
- **PostCSS**: Tailwind CSS processing with `@tailwindcss/postcss` (server.ts:340-361)

### State Management
- **WebSocket state**: `useWebSocket` hook with auto-reconnect (max 5 attempts, 3s delay)
- **Session state**: Local React state synchronized with database via REST API
- **Model selection**: Persisted to localStorage (`agent-boy-model` key)

### Message Streaming Pattern

Assistant responses are built incrementally with support for tool nesting:

1. First text delta creates new assistant message
2. Subsequent deltas append to last text block
3. Tool use blocks appended when received
4. Task tool spawns are detected and subsequent tools are nested under active Tasks
5. Round-robin distribution when multiple Tasks are active
6. Complete response saved to database when stream ends

See `ChatContainer.tsx:103-233` for full implementation including tool nesting logic.

### Session Title Auto-generation

When a user sends the first message to a "New Chat" session, the title is automatically generated from the first 60 characters of the message (database.ts:144-154). This provides better default session names than "New Chat".

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

1. **Port conflicts**: Port 3001 must be available before starting dev server (use `lsof -ti:3001 | xargs kill -9`)
2. **Provider API keys**: Ensure correct API key for selected provider:
   - Anthropic models require `ANTHROPIC_API_KEY`
   - Z.AI models require `ZAI_API_KEY`
3. **Database location**: Database auto-created at `./data/sessions.db` - ensure `data/` directory is writable
4. **Model configuration**: Models are auto-mapped from `AVAILABLE_MODELS` - no manual mapping needed
5. **WebSocket reconnection**: Maximum 5 reconnection attempts before manual intervention needed
6. **MCP tools**: Z.AI models use `mcp__web-search-prime__search`, not `WebSearch` or `WebFetch`
7. **Custom agents**: Agent names must match exactly in `AGENT_REGISTRY` for Task tool spawning to work
8. **Node.js requirement**: The Claude SDK subprocess requires Node.js v18+. Server runs on Bun, but SDK spawns Node processes. Auto-installed by launcher scripts if missing.
