# Agent Girl

A powerful desktop chat interface powered by Anthropic's Claude Agent SDK. Built with React, TypeScript, and Bun for blazing-fast performance and seamless AI interactions.

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Bun-Latest-black?logo=bun" alt="Bun">
  <img src="https://img.shields.io/badge/Claude-Sonnet_4.5-8B5CF6" alt="Claude">
  <img src="https://img.shields.io/badge/License-ISC-green" alt="License">
</p>

## ✨ Features

### 🤖 **Powered by Claude Agent SDK**
- Direct integration with Anthropic's official Agent SDK
- Access to Claude Sonnet 4.5 - Anthropic's most intelligent model
- Specialized sub-agents for research, code review, debugging, testing, and documentation
- Full tool access with bypass permissions mode

### 💬 **Real-time Streaming**
- WebSocket-based streaming for instant responses
- Live message updates as Claude types
- Seamless tool use visualization with nested sub-agent support

### 🗂️ **Session Management**
- Persistent chat sessions with SQLite database
- Session isolation with per-session working directories
- Auto-generated session titles
- Full conversation history

### 🎨 **Modern UI/UX**
- Clean, responsive interface built with Radix UI
- Dark mode support
- Virtual scrolling for performance
- Smooth animations with Framer Motion
- Syntax highlighting for code blocks

### ⚡ **Developer Experience**
- Hot module reloading in development
- TypeScript for type safety
- Bun for ultra-fast builds and runtime
- Zero-config SQLite for data persistence

### 🌐 **Multi-Provider Support**
- **Anthropic**: Direct Claude API access
- **Z.AI**: Alternative provider with GLM models and web search MCP
- Easy provider switching via model selector

## 📦 Installation

### One-Line Install (macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/UnstableMind/agent-boy2/master/install.sh | bash
```

The installer automatically:
- ✅ Detects your Mac's architecture (Intel vs Apple Silicon)
- ✅ Downloads the latest notarized release
- ✅ Installs to `~/Applications/agent-girl-app/`
- ✅ Creates a global `agent-girl` command
- ✅ No Gatekeeper warnings (app is code-signed and notarized by Apple)

### Manual Download

Download the latest release for your platform:

**macOS:**
- [macOS Apple Silicon (M1/M2/M3)](https://github.com/UnstableMind/agent-boy2/releases/latest/download/agent-girl-macos-arm64.zip)
- [macOS Intel (x86_64)](https://github.com/UnstableMind/agent-boy2/releases/latest/download/agent-girl-macos-intel.zip)

**Or browse all releases:** [https://github.com/UnstableMind/agent-boy2/releases/latest](https://github.com/UnstableMind/agent-boy2/releases/latest)

## 🚀 Quick Start

### 1. **Configure API Key**

Before first run, add your Anthropic API key:

```bash
# Open the .env file
open -e ~/Applications/agent-girl-app/.env
```

Replace `sk-ant-your-key-here` with your actual API key from [console.anthropic.com](https://console.anthropic.com/).

### 2. **Run the App**

**From Finder:**
1. Navigate to `~/Applications/agent-girl-app/`
2. Double-click `agent-girl`

**From Terminal:**
```bash
agent-girl
```

The app starts at **http://localhost:3001** and opens automatically in your browser.

### 3. **Start Chatting**

- Create a new session with the **"New Chat"** button
- Select a working directory (or use default `~/Documents/agent-girl-app/`)
- Choose your model (Claude Sonnet 4.5 recommended)
- Start chatting!

## 🛠️ Development Setup

Want to build from source or contribute? Here's how:

### Prerequisites

- [Bun](https://bun.sh/) v1.0.0+
- Node.js 18+ (optional, for compatibility)
- macOS, Linux, or WSL

### Local Development

```bash
# Clone the repository
git clone https://github.com/UnstableMind/agent-boy2.git
cd agent-boy2

# Install dependencies
bun install

# Create .env file
cat > .env << EOF
API_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
EOF

# Start development server
bun run dev
```

Development server runs at **http://localhost:3001** with hot reload enabled.

### Build Release

Build for your current platform:

```bash
# Build for current platform
./build-release.sh

# Build for all platforms (macOS ARM64, Intel, Windows, Linux)
./build-release-all.sh
```

Binaries are output to `./release/`.

## 📚 Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Radix UI for accessible components
- Tailwind CSS 4 for styling
- Framer Motion for animations
- React Virtual for performance
- React Markdown for message rendering

**Backend:**
- Bun runtime for high performance
- Claude Agent SDK for AI interactions
- SQLite for session persistence
- WebSocket for real-time streaming
- MCP (Model Context Protocol) for extensibility

### Project Structure

```
agent-boy2/
├── client/                 # React frontend
│   ├── components/
│   │   ├── chat/          # ChatContainer, MessageList, ChatInput
│   │   ├── message/       # Message renderers (text, code, tool use)
│   │   ├── sidebar/       # Session sidebar
│   │   └── header/        # Header, model selector, about modal
│   ├── hooks/             # useWebSocket, useSessionAPI
│   ├── config/            # Model and provider configuration
│   └── index.tsx          # App entry point
├── server/
│   ├── server.ts          # Main server, WebSocket, SDK integration
│   ├── database.ts        # Session and message persistence
│   ├── providers.ts       # Multi-provider configuration
│   ├── agents.ts          # Custom agent registry
│   ├── mcpServers.ts      # MCP server configuration
│   └── systemPrompt.ts    # Dynamic system prompt generation
├── .github/workflows/     # GitHub Actions for releases
├── build-release.sh       # Build script for single platform
├── build-release-all.sh   # Build script for all platforms
└── install.sh             # One-line installer for users
```

## 🎮 Usage

### Session Management

**Create a Session:**
- Click **"New Chat"** in the sidebar
- Select a working directory (default: `~/Documents/agent-girl-app/`)
- Directory isolation ensures file operations stay organized

**Rename a Session:**
- Click the pencil icon next to session name
- Enter new name and press Enter

**Delete a Session:**
- Click the trash icon next to session name
- Confirm deletion (permanent)

### Model Selection

Agent Girl supports multiple models and providers:

**Anthropic Models:**
- **Claude Sonnet 4.5** (recommended) - Most intelligent, best for complex tasks
- Uses direct Anthropic API access

**Z.AI Models:**
- **GLM 4.6** - Alternative model with web search capabilities
- Includes MCP-based web search tool

Switch models using the dropdown in the header.

### Custom Agents

Claude can spawn specialized sub-agents using the Task tool:

- **researcher** - Expert at gathering information and analyzing data
- **code-reviewer** - Reviews code for bugs, security, and best practices
- **debugger** - Systematically tracks down bugs
- **test-writer** - Creates comprehensive test suites
- **documenter** - Writes clear documentation and examples

Sub-agent tool use is displayed nested under the parent Task for clarity.

### Working Directories

Each session has an isolated working directory:

- **Default:** `~/Documents/agent-girl-app/{session-id}/`
- **Custom:** Choose any directory when creating a session
- All file operations (Read, Write, Edit) are scoped to this directory
- Prevents accidental file modifications outside the session

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the app directory:

```env
# Anthropic Configuration (Claude Models)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Z.AI Configuration (GLM Models, optional)
ZAI_API_KEY=your-zai-key-here
```

### Advanced Configuration

**System Prompt Customization:**
Edit `server/systemPrompt.ts` to customize Claude's behavior.

**Custom Agents:**
Add new agents to `server/agents.ts`:

```typescript
export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  'my-agent': {
    description: 'Brief description for agent list',
    prompt: 'Detailed instructions for agent behavior...',
    tools: ['Read', 'Write', 'Grep'], // Optional: restrict tools
    model: 'sonnet', // Optional: override model
  },
};
```

**MCP Servers:**
Configure MCP servers per provider in `server/mcpServers.ts`.

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly:** `bun test`
5. **Commit your changes:** `git commit -m 'Add amazing feature'`
6. **Push to your fork:** `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- **TypeScript:** Use strict typing
- **Code Style:** Follow existing patterns
- **Testing:** Add tests for new features
- **Documentation:** Update README and code comments

## 🐛 Troubleshooting

### Port Already in Use

If port 3001 is busy:

```bash
lsof -ti:3001 | xargs kill -9
```

### API Key Issues

1. Verify `.env` file exists in app directory
2. Check API key format: `sk-ant-...` for Anthropic
3. Restart the app after changing `.env`

### Database Issues

Reset the database:

```bash
rm -rf ~/Documents/agent-girl-app/
```

Or for development:

```bash
rm -rf data/
mkdir data
```

### macOS Security Warnings

**First time opening the app:**
1. Right-click the `agent-girl` binary
2. Select **"Open"**
3. Click **"Open"** in the security dialog

Or via System Preferences:
1. Go to **System Preferences** → **Security & Privacy**
2. Click **"Open Anyway"**

**Note:** Released versions are notarized by Apple and shouldn't show warnings.

## 📖 API Reference

### WebSocket Endpoints

**Chat WebSocket:**
- **URL:** `ws://localhost:3001/ws`
- **Purpose:** Real-time chat communication

**Hot Reload (Dev Only):**
- **URL:** `ws://localhost:3001/hot-reload`
- **Purpose:** Development hot reload

### REST API

**Sessions:**
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create session (body: `{title?, workingDirectory?}`)
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/:id/messages` - Get session messages
- `PATCH /api/sessions/:id` - Rename session (body: `{title}`)
- `DELETE /api/sessions/:id` - Delete session

**Utilities:**
- `POST /api/validate-directory` - Validate directory path (body: `{directory}`)
- `POST /api/pick-directory` - Open directory picker

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for the Claude Agent SDK
- **Bun** team for the amazing runtime
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/UnstableMind/agent-boy2/issues)
- **Discussions:** [GitHub Discussions](https://github.com/UnstableMind/agent-boy2/discussions)
- **Documentation:** [Distribution Guide](DISTRIBUTION.md)

## 🚢 Releases

Agent Girl uses **automated releases** with GitHub Actions:

- **Code-signed** and **notarized** by Apple
- No Gatekeeper warnings for users
- Automatic architecture detection (Intel vs ARM64)
- See [DISTRIBUTION.md](DISTRIBUTION.md) for release process details

---

**Built with ❤️ using Claude Agent SDK**
