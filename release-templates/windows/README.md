# Agent Girl - Windows

A modern chat interface powered by the Claude Agent SDK.

## Installation

### Quick Start

1. Double-click `agent-girl.exe` to start the application
2. Open your browser to `http://localhost:3001`

### Windows SmartScreen Warning

When you first run the application, you may see a **"Windows protected your PC"** warning. This is normal for unsigned applications.

**To run the application:**

1. Click **"More info"**
2. Click **"Run anyway"**

This warning appears because the binary is not code-signed with a Microsoft certificate. The application is safe to run.

## Troubleshooting

### SmartScreen Keeps Blocking

If SmartScreen continues to block the application:

1. Right-click `agent-girl.exe`
2. Select **Properties**
3. Check **"Unblock"** at the bottom
4. Click **Apply** then **OK**
5. Double-click `agent-girl.exe` again

### Port Already in Use

If port 3001 is already in use, find and kill the process:

```cmd
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

Replace `<PID>` with the process ID from the first command.

### Firewall Warning

Windows Firewall may ask for permission. Click **"Allow access"** to let Agent Girl communicate on your local network.

## Configuration

Agent Girl uses environment variables for configuration. Edit the `.env` file in Notepad:

```env
# Required: Choose your API provider
API_PROVIDER=anthropic

# Required: Add your API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Change the port (default: 3001)
PORT=3001
```

## Requirements

- Windows 10 or later (64-bit)
- Internet connection for API access

## Support

For issues and support, visit: https://github.com/yourusername/agent-girl
