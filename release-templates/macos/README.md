# Agent Girl - macOS

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
xattr -d com.apple.quarantine ./agent-girl
chmod +x ./agent-girl
./agent-girl
```

## Troubleshooting

### "File is damaged" Error

This error occurs because the binary is not code-signed. The `setup.sh` script fixes this automatically by removing the quarantine attribute that macOS adds to downloaded files.

If you still see this error:
1. Run `bash setup.sh` again
2. If that fails, run manually: `xattr -d com.apple.quarantine ./agent-girl`
3. Then: `chmod +x ./agent-girl`
4. Finally: `./agent-girl`

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

- macOS 11.0 or later
- Internet connection for API access

## Support

For issues and support, visit: https://github.com/yourusername/agent-girl
