# Agent Girl - Linux

A modern chat interface powered by the Claude Agent SDK.

## Installation

### Quick Start

1. Run the setup script:
   ```bash
   bash setup.sh
   ```

2. Start Agent Girl:
   ```bash
   ./agent-girl
   ```

3. Open your browser to `http://localhost:3001`

### Manual Setup

If the setup script doesn't work, run these commands manually:

```bash
chmod +x ./agent-girl
./agent-girl
```

## Troubleshooting

### Permission Denied

Run:
```bash
chmod +x ./agent-girl
```

### Port Already in Use

If port 3001 is already in use, kill the process:
```bash
lsof -ti:3001 | xargs kill -9
```

Or use `fuser`:
```bash
fuser -k 3001/tcp
```

### Missing Dependencies

Agent Girl is built with Bun and should include all dependencies. If you encounter errors, ensure you have:
- glibc 2.31 or later
- OpenSSL 1.1 or later

## Configuration

Agent Girl uses environment variables for configuration. Edit the `.env` file:

```env
# Required: Choose your API provider
API_PROVIDER=anthropic

# Required: Add your API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Change the port (default: 3001)
PORT=3001
```

## Requirements

- Linux (x64)
- glibc 2.31+
- Internet connection for API access

## Support

For issues and support, visit: https://github.com/yourusername/agent-girl
