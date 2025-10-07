#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="KenKaiii/agent-girl"
APP_NAME="agent-girl"
INSTALL_DIR="$HOME/Applications/agent-girl-app"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Agent Girl Installer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
  x86_64)
    PLATFORM="macos-intel"
    ARCH_NAME="Intel (x86_64)"
    ;;
  arm64|aarch64)
    PLATFORM="macos-arm64"
    ARCH_NAME="Apple Silicon (ARM64)"
    ;;
  *)
    echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
    echo "This installer supports Intel (x86_64) and Apple Silicon (arm64) macOS only."
    exit 1
    ;;
esac

echo -e "${GREEN}✓${NC} Detected architecture: ${YELLOW}$ARCH_NAME${NC}"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo -e "${RED}❌ This installer is for macOS only${NC}"
  exit 1
fi

# Get latest release
echo -e "${BLUE}📡 Fetching latest release...${NC}"
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO/releases/latest")

if [[ -z "$LATEST_RELEASE" ]] || echo "$LATEST_RELEASE" | grep -q "Not Found"; then
  echo -e "${RED}❌ Failed to fetch release information${NC}"
  echo "Please check your internet connection and try again."
  exit 1
fi

VERSION=$(echo "$LATEST_RELEASE" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
DOWNLOAD_URL=$(echo "$LATEST_RELEASE" | grep "browser_download_url.*$PLATFORM.zip" | cut -d '"' -f 4)

if [[ -z "$DOWNLOAD_URL" ]]; then
  echo -e "${RED}❌ Could not find download URL for $PLATFORM${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Latest version: ${YELLOW}$VERSION${NC}"
echo ""

# Create install directory
echo -e "${BLUE}📁 Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"

# Download the release
DOWNLOAD_PATH="/tmp/$APP_NAME-$PLATFORM.zip"
echo -e "${BLUE}⬇️  Downloading Agent Girl $VERSION...${NC}"
echo -e "   ${YELLOW}$DOWNLOAD_URL${NC}"
echo ""

if ! curl -L -o "$DOWNLOAD_PATH" "$DOWNLOAD_URL" --progress-bar; then
  echo -e "${RED}❌ Download failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✓${NC} Download complete"
echo ""

# Extract the archive
echo -e "${BLUE}📦 Extracting...${NC}"
if ! unzip -q -o "$DOWNLOAD_PATH" -d "/tmp/"; then
  echo -e "${RED}❌ Extraction failed${NC}"
  rm "$DOWNLOAD_PATH"
  exit 1
fi

# Move files to installation directory
echo -e "${BLUE}📁 Installing to $INSTALL_DIR...${NC}"
rm -rf "$INSTALL_DIR"/*
mv "/tmp/$APP_NAME-$PLATFORM"/* "$INSTALL_DIR/"

# Set executable permissions
chmod +x "$INSTALL_DIR/$APP_NAME"

# Clean up
rm "$DOWNLOAD_PATH"
rm -rf "/tmp/$APP_NAME-$PLATFORM"

echo -e "${GREEN}✓${NC} Installation complete"
echo ""

# Check if API key is configured
if grep -q "your-anthropic-api-key-here" "$INSTALL_DIR/.env" 2>/dev/null || \
   grep -q "sk-ant-your-key-here" "$INSTALL_DIR/.env" 2>/dev/null; then
  echo -e "${YELLOW}⚠️  API Key Configuration Required${NC}"
  echo ""
  echo "Before running Agent Girl, you need to add your Anthropic API key:"
  echo ""
  echo "1. Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
  echo "2. Edit the .env file:"
  echo "   ${YELLOW}open -e \"$INSTALL_DIR/.env\"${NC}"
  echo "3. Replace ${YELLOW}sk-ant-your-key-here${NC} with your actual API key"
  echo ""
fi

# Create a launcher script in /usr/local/bin if it doesn't exist
LAUNCHER_PATH="/usr/local/bin/$APP_NAME"
if [[ ! -f "$LAUNCHER_PATH" ]]; then
  echo -e "${BLUE}🔗 Creating command-line launcher...${NC}"

  # Create launcher script
  cat > "$LAUNCHER_PATH" << EOF
#!/bin/bash
cd "$INSTALL_DIR" && ./$APP_NAME
EOF

  chmod +x "$LAUNCHER_PATH"
  echo -e "${GREEN}✓${NC} You can now run ${YELLOW}$APP_NAME${NC} from anywhere in the terminal"
  echo ""
fi

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Installation Successful! 🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To run Agent Girl:"
echo ""
echo "  ${YELLOW}1. From Finder:${NC}"
echo "     Open: ${BLUE}$INSTALL_DIR${NC}"
echo "     Double-click: ${YELLOW}$APP_NAME${NC}"
echo ""
echo "  ${YELLOW}2. From Terminal:${NC}"
echo "     Run: ${YELLOW}$APP_NAME${NC}"
echo ""
echo "The app will start at: ${BLUE}http://localhost:3001${NC}"
echo ""
echo "Installation location: ${BLUE}$INSTALL_DIR${NC}"
echo ""
