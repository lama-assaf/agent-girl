#!/bin/bash
set -e

echo "🚀 Building Agent Girl Release..."

# Clean previous build
rm -rf release/
mkdir -p release/agent-girl-app

# Pre-build CSS (required for standalone binary)
echo "📦 Pre-building CSS..."
bun run build:css

# Build the binary
echo "📦 Building binary..."
bun run build:binary

# Move binary to release folder
mv agent-girl release/agent-girl-app/

# Copy client files
echo "📁 Copying client files..."
cp -r client/ release/agent-girl-app/client/

# Replace raw globals.css with processed version from dist
echo "📁 Copying processed CSS..."
cp dist/globals.css release/agent-girl-app/client/globals.css

# Copy icons
cp -r client/icons/ release/agent-girl-app/icons/ 2>/dev/null || true

# Copy Claude Code CLI
echo "📁 Copying Claude Code CLI..."
cp node_modules/@anthropic-ai/claude-code/cli.js release/agent-girl-app/
cp node_modules/@anthropic-ai/claude-code/yoga.wasm release/agent-girl-app/
cp -r node_modules/@anthropic-ai/claude-code/vendor release/agent-girl-app/

# Create .env file with placeholders
cat > release/agent-girl-app/.env << 'EOF'
# API Configuration
# Choose your provider: anthropic or z-ai
API_PROVIDER=anthropic

# Anthropic API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Z.AI API Key (get from https://z.ai/)
# Only needed if using API_PROVIDER=z-ai
ZAI_API_KEY=your-zai-api-key-here
EOF

# Create README
cat > release/agent-girl-app/README.txt << 'EOF'
Agent Girl Application
======================

Setup (First Time):
1. Open the .env file in a text editor
2. Add your Anthropic API key (get from https://console.anthropic.com/)
   Replace: ANTHROPIC_API_KEY=your-anthropic-api-key-here
   With: ANTHROPIC_API_KEY=sk-ant-your-actual-key

To Run:
- Double-click the 'agent-girl' file
- The app will start at http://localhost:3001
- Your browser should open automatically

Data Storage:
- Sessions stored in ~/Documents/agent-girl-app/
- All your conversations are saved locally

Requirements:
- macOS (ARM64 / Apple Silicon)
- Anthropic API key (for Claude models)
- No other dependencies needed!

Troubleshooting:
- If port 3001 is busy, kill the process: lsof -ti:3001 | xargs kill -9
- Make sure .env file has your real API key

Enjoy!
EOF

echo "✅ Release built successfully!"
echo "📦 Location: ./release/agent-girl-app/"
echo ""
echo "To distribute, zip the folder:"
echo "  cd release && zip -r agent-girl-macos-arm64.zip agent-girl-app/"
