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

# API Key Configuration - Interactive
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   API Key Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Which API provider(s) do you want to use?"
echo ""
echo "  ${YELLOW}1)${NC} Anthropic API only (Claude models)"
echo "  ${YELLOW}2)${NC} Z.AI API only (GLM models)"
echo "  ${YELLOW}3)${NC} Both APIs (full model access)"
echo "  ${YELLOW}4)${NC} Skip (configure later)"
echo ""
read -p "Enter choice [1-4]: " api_choice

ANTHROPIC_KEY=""
ZAI_KEY=""

case $api_choice in
  1)
    echo ""
    echo -e "${BLUE}📝 Anthropic API Setup${NC}"
    echo "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
    echo ""
    read -p "Enter your Anthropic API key: " ANTHROPIC_KEY
    ;;
  2)
    echo ""
    echo -e "${BLUE}📝 Z.AI API Setup${NC}"
    echo "Get your API key from: ${BLUE}https://z.ai${NC}"
    echo ""
    read -p "Enter your Z.AI API key: " ZAI_KEY
    ;;
  3)
    echo ""
    echo -e "${BLUE}📝 Anthropic API Setup${NC}"
    echo "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
    echo ""
    read -p "Enter your Anthropic API key: " ANTHROPIC_KEY
    echo ""
    echo -e "${BLUE}📝 Z.AI API Setup${NC}"
    echo "Get your API key from: ${BLUE}https://z.ai${NC}"
    echo ""
    read -p "Enter your Z.AI API key: " ZAI_KEY
    ;;
  4)
    echo ""
    echo -e "${YELLOW}⚠️  Skipping API configuration${NC}"
    echo "You'll need to edit ${YELLOW}$INSTALL_DIR/.env${NC} before running Agent Girl"
    ;;
  *)
    echo ""
    echo -e "${RED}Invalid choice. Skipping API configuration.${NC}"
    ;;
esac

# Update .env with actual keys
if [[ -n "$ANTHROPIC_KEY" ]] || [[ -n "$ZAI_KEY" ]]; then
  # Set defaults if not provided
  [[ -z "$ANTHROPIC_KEY" ]] && ANTHROPIC_KEY="sk-ant-your-key-here"
  [[ -z "$ZAI_KEY" ]] && ZAI_KEY="your-zai-key-here"

  # Update the .env file
  cat > "$INSTALL_DIR/.env" << EOF
# =============================================================================
# Anthropic Configuration (Claude Models)
# =============================================================================
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=$ANTHROPIC_KEY

# =============================================================================
# Z.AI Configuration (GLM Models)
# =============================================================================
# Get your API key from: https://z.ai
# The server automatically configures the endpoint when you select a GLM model
ZAI_API_KEY=$ZAI_KEY
EOF

  echo ""
  echo -e "${GREEN}✓${NC} API keys configured"
fi
echo ""

# Create global launcher - try without sudo first, then offer sudo option
LAUNCHER_PATH="/usr/local/bin/$APP_NAME"
if [[ ! -f "$LAUNCHER_PATH" ]]; then
  echo -e "${BLUE}🔗 Setting up global command...${NC}"

  # Create launcher script content
  LAUNCHER_SCRIPT="#!/bin/bash
cd \"$INSTALL_DIR\" && ./$APP_NAME \"\$@\"
"

  # Try to create without sudo
  if echo "$LAUNCHER_SCRIPT" > "$LAUNCHER_PATH" 2>/dev/null && chmod +x "$LAUNCHER_PATH" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} You can now run ${YELLOW}$APP_NAME${NC} from anywhere"
  else
    # Needs sudo - ask user
    echo -e "${YELLOW}⚠️  Creating global command requires admin permissions${NC}"
    read -p "Create global launcher with sudo? [y/N]: " use_sudo

    if [[ "$use_sudo" =~ ^[Yy]$ ]]; then
      echo "$LAUNCHER_SCRIPT" | sudo tee "$LAUNCHER_PATH" > /dev/null
      sudo chmod +x "$LAUNCHER_PATH"
      echo -e "${GREEN}✓${NC} Global launcher created - you can now run ${YELLOW}$APP_NAME${NC} from anywhere"
    else
      echo -e "${YELLOW}⚠️  Skipped global launcher${NC}"
      echo "You can still run: ${YELLOW}$INSTALL_DIR/$APP_NAME${NC}"
    fi
  fi
  echo ""
fi

# License notification
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   License Information${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Agent Girl is free and open source software${NC}"
echo -e "Licensed under ${YELLOW}GNU AGPL-3.0${NC} (Affero General Public License)"
echo ""
echo "This means:"
echo "  • You can use, modify, and distribute this software"
echo "  • If you modify and run it as a service, you must share your changes"
echo "  • Full license text available at: ${BLUE}$INSTALL_DIR/LICENSE${NC}"
echo ""
echo "By using this software, you agree to the AGPL-3.0 terms."
echo "Learn more: ${BLUE}https://www.gnu.org/licenses/agpl-3.0.html${NC}"
echo ""

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Installation Successful! 🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}How to start Agent Girl:${NC}"
echo ""

# Check if global launcher was created
if [[ -f "$LAUNCHER_PATH" ]]; then
  echo "  ${YELLOW}→ Just type:${NC} ${GREEN}$APP_NAME${NC}"
  echo ""
  echo "  The app will start at ${BLUE}http://localhost:3001${NC}"
else
  echo "  ${YELLOW}Option 1 - From Finder:${NC}"
  echo "    Open ${BLUE}$INSTALL_DIR${NC}"
  echo "    Double-click ${YELLOW}$APP_NAME${NC}"
  echo ""
  echo "  ${YELLOW}Option 2 - From Terminal:${NC}"
  echo "    Run ${YELLOW}$INSTALL_DIR/$APP_NAME${NC}"
  echo ""
  echo "  The app will start at ${BLUE}http://localhost:3001${NC}"
fi

echo ""
echo -e "${BLUE}Installed to:${NC} $INSTALL_DIR"
echo ""
