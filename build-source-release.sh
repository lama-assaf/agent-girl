#!/bin/bash
set -e

echo "🔨 Building Agent Girl (Source Distribution)"
echo

# Detect platform
ARCH=$(uname -m)
case $ARCH in
  x86_64)
    PLATFORM="macos-intel"
    ;;
  arm64)
    PLATFORM="macos-arm64"
    ;;
  *)
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

echo "📦 Platform: $PLATFORM"

# Clean and create release directory
rm -rf release
mkdir -p release/agent-girl-$PLATFORM

# Build client bundle
echo "🏗️  Building client..."
bun run build

# Copy source files
echo "📂 Copying source files..."
cp -r server release/agent-girl-$PLATFORM/
cp -r client release/agent-girl-$PLATFORM/
cp -r dist release/agent-girl-$PLATFORM/
cp package.json release/agent-girl-$PLATFORM/
cp bun.lockb release/agent-girl-$PLATFORM/ 2>/dev/null || true
cp LICENSE release/agent-girl-$PLATFORM/
cp tailwind.config.js release/agent-girl-$PLATFORM/ 2>/dev/null || true
cp postcss.config.mjs release/agent-girl-$PLATFORM/ 2>/dev/null || true
cp tsconfig.json release/agent-girl-$PLATFORM/ 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
cd release/agent-girl-$PLATFORM
bun install --production
cd ../..

# Create .env template
cat > release/agent-girl-$PLATFORM/.env << 'EOF'
# =============================================================================
# Anthropic Configuration (Claude Models)
# =============================================================================
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# =============================================================================
# Z.AI Configuration (GLM Models)
# =============================================================================
# Get your API key from: https://z.ai
# The server automatically configures the endpoint when you select a GLM model
ZAI_API_KEY=your-zai-key-here
EOF

# Create launcher script
cat > release/agent-girl-$PLATFORM/agent-girl << 'EOF'
#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🔧 Installing Bun..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    curl -fsSL https://bun.sh/install | bash

    # Add bun to PATH for this session
    export PATH="$HOME/.bun/bin:$PATH"

    echo
    echo "✅ Bun installed successfully!"
    echo
fi

# Start the server (pass all arguments through)
if [[ "$1" == "--setup" ]]; then
    # Don't show "Starting Agent Girl" banner for setup
    exec bun run server/server.ts "$@"
else
    echo "🚀 Starting Agent Girl..."
    echo
    exec bun run server/server.ts "$@"
fi
EOF

chmod +x release/agent-girl-$PLATFORM/agent-girl

# Create README
cat > release/agent-girl-$PLATFORM/README.txt << 'EOF'
Agent Girl Application - macOS
==============================

Setup (First Time):
1. Open the .env file in a text editor
2. Add your Anthropic API key (get from https://console.anthropic.com/)
   Replace: ANTHROPIC_API_KEY=sk-ant-your-key-here
   With: ANTHROPIC_API_KEY=sk-ant-your-actual-key

To Run:
- Double-click the 'agent-girl' file
- Or run from terminal: ./agent-girl
- The app will start at http://localhost:3001
- Your browser should open automatically

First Run:
- On first launch, Bun runtime will be auto-installed (takes ~5 seconds)
- Subsequent launches are instant

Data Storage:
- Sessions stored in ~/Documents/agent-girl-app/
- All your conversations are saved locally

Requirements:
- macOS 11+ (Big Sur or later)
- Anthropic API key (for Claude models)
- Internet connection (for first-time Bun install)

Troubleshooting:
- If port 3001 is busy, kill the process: lsof -ti:3001 | xargs kill -9
- Make sure .env file has your real API key

Enjoy!
EOF

# Create zip
cd release
zip -r agent-girl-$PLATFORM.zip agent-girl-$PLATFORM/
cd ..

echo
echo "✅ Build complete!"
echo "📦 Package: release/agent-girl-$PLATFORM.zip"
echo "📁 Size: $(du -sh release/agent-girl-$PLATFORM.zip | cut -f1)"
