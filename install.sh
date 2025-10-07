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

# Detect OS
OS=$(uname -s)
case $OS in
  Darwin)
    OS_NAME="macOS"
    OS_PREFIX="macos"
    INSTALL_DIR="$HOME/Applications/agent-girl-app"
    ;;
  Linux)
    OS_NAME="Linux"
    OS_PREFIX="linux"
    INSTALL_DIR="$HOME/.local/share/agent-girl-app"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    OS_NAME="Windows"
    OS_PREFIX="windows"
    INSTALL_DIR="$LOCALAPPDATA/Programs/agent-girl-app"
    ;;
  *)
    echo -e "${RED}❌ Unsupported OS: $OS${NC}"
    echo "This installer supports macOS, Linux, and Windows only."
    exit 1
    ;;
esac

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
  x86_64|amd64)
    if [[ "$OS_PREFIX" == "macos" ]]; then
      PLATFORM="macos-intel"
      ARCH_NAME="Intel (x86_64)"
    elif [[ "$OS_PREFIX" == "windows" ]]; then
      PLATFORM="windows-x64"
      ARCH_NAME="x64"
    else
      PLATFORM="linux-x64"
      ARCH_NAME="x86_64"
    fi
    ;;
  arm64|aarch64)
    if [[ "$OS_PREFIX" == "macos" ]]; then
      PLATFORM="macos-arm64"
      ARCH_NAME="Apple Silicon (ARM64)"
    else
      PLATFORM="linux-arm64"
      ARCH_NAME="ARM64"
    fi
    ;;
  *)
    echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
    echo "This installer supports x86_64 and ARM64 only."
    exit 1
    ;;
esac

echo -e "${GREEN}✓${NC} Detected OS: ${YELLOW}$OS_NAME${NC}"
echo -e "${GREEN}✓${NC} Detected architecture: ${YELLOW}$ARCH_NAME${NC}"
echo ""

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
echo -e "  ${YELLOW}1)${NC} Anthropic API only (Claude models)"
echo -e "  ${YELLOW}2)${NC} Z.AI API only (GLM models)"
echo -e "  ${YELLOW}3)${NC} Both APIs (full model access)"
echo -e "  ${YELLOW}4)${NC} Skip (configure later)"
echo ""
read -p "Enter choice [1-4]: " api_choice < /dev/tty

ANTHROPIC_KEY=""
ZAI_KEY=""

case $api_choice in
  1)
    echo ""
    echo -e "${BLUE}📝 Anthropic API Setup${NC}"
    echo -e "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
    echo ""
    read -p "Enter your Anthropic API key: " ANTHROPIC_KEY < /dev/tty
    ;;
  2)
    echo ""
    echo -e "${BLUE}📝 Z.AI API Setup${NC}"
    echo -e "Get your API key from: ${BLUE}https://z.ai${NC}"
    echo ""
    read -p "Enter your Z.AI API key: " ZAI_KEY < /dev/tty
    ;;
  3)
    echo ""
    echo -e "${BLUE}📝 Anthropic API Setup${NC}"
    echo -e "Get your API key from: ${BLUE}https://console.anthropic.com/${NC}"
    echo ""
    read -p "Enter your Anthropic API key: " ANTHROPIC_KEY < /dev/tty
    echo ""
    echo -e "${BLUE}📝 Z.AI API Setup${NC}"
    echo -e "Get your API key from: ${BLUE}https://z.ai${NC}"
    echo ""
    read -p "Enter your Z.AI API key: " ZAI_KEY < /dev/tty
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

# Create global launcher (skip on Windows - use direct path or PowerShell installer instead)
LAUNCHER_PATH=""
NEEDS_RESTART=false

if [[ "$OS_PREFIX" != "windows" ]]; then
  LAUNCHER_PATH="/usr/local/bin/$APP_NAME"

  if [[ ! -f "$LAUNCHER_PATH" ]]; then
    echo -e "${BLUE}🔗 Setting up global command...${NC}"

    # Create launcher script content
    LAUNCHER_SCRIPT="#!/bin/bash
cd \"$INSTALL_DIR\" && ./$APP_NAME \"\$@\"
"

    # Try to create without sudo
    if echo "$LAUNCHER_SCRIPT" > "$LAUNCHER_PATH" 2>/dev/null && chmod +x "$LAUNCHER_PATH" 2>/dev/null; then
      echo -e "${GREEN}✓${NC} Global launcher created at $LAUNCHER_PATH"
    else
      # Needs sudo - ask user
      echo -e "${YELLOW}⚠️  Creating global command requires admin permissions${NC}"
      read -p "Create global launcher with sudo? [y/N]: " use_sudo < /dev/tty

      if [[ "$use_sudo" =~ ^[Yy]$ ]]; then
        echo "$LAUNCHER_SCRIPT" | sudo tee "$LAUNCHER_PATH" > /dev/null
        sudo chmod +x "$LAUNCHER_PATH"
        echo -e "${GREEN}✓${NC} Global launcher created at $LAUNCHER_PATH"
      else
        echo -e "${YELLOW}⚠️  Skipped global launcher${NC}"
        echo "You can still run: ${YELLOW}$INSTALL_DIR/$APP_NAME${NC}"
        LAUNCHER_PATH=""  # Clear path so we don't show the global command instructions
      fi
    fi

    # Add /usr/local/bin to PATH if not already there
    if [[ -n "$LAUNCHER_PATH" ]] && [[ ":$PATH:" != *":/usr/local/bin:"* ]]; then
      echo ""
      echo -e "${BLUE}Adding /usr/local/bin to PATH...${NC}"

      if [[ "$SHELL" == *"zsh"* ]]; then
        SHELL_RC="$HOME/.zshrc"
      else
        SHELL_RC="$HOME/.bash_profile"
      fi

      # Add PATH export if it doesn't already exist in the file
      if ! grep -q 'export PATH="/usr/local/bin:$PATH"' "$SHELL_RC" 2>/dev/null; then
        echo 'export PATH="/usr/local/bin:$PATH"' >> "$SHELL_RC"
        echo -e "${GREEN}✓${NC} Added /usr/local/bin to PATH"
        NEEDS_RESTART=true
      else
        echo -e "${GREEN}✓${NC} /usr/local/bin already in PATH"
      fi
    fi
    echo ""
  fi
else
  # Windows (Git Bash/WSL) - skip global launcher
  echo -e "${YELLOW}ℹ️  On Windows, run directly from install directory or use Start Menu${NC}"
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
echo -e "  • Full license text available at: ${BLUE}$INSTALL_DIR/LICENSE${NC}"
echo ""
echo "By using this software, you agree to the AGPL-3.0 terms."
echo -e "Learn more: ${BLUE}https://www.gnu.org/licenses/agpl-3.0.html${NC}"
echo ""

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Installation Successful! 🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}How to start Agent Girl:${NC}"
echo ""

# Platform-specific launch instructions
if [[ "$OS_PREFIX" == "windows" ]]; then
  echo -e "  ${YELLOW}Option 1 - Double-click:${NC}"
  echo -e "    Open ${BLUE}$INSTALL_DIR${NC} in File Explorer"
  echo -e "    Double-click ${YELLOW}agent-girl.exe${NC}"
  echo ""
  echo -e "  ${YELLOW}Option 2 - From terminal:${NC}"
  echo -e "    Run ${YELLOW}\"$INSTALL_DIR/agent-girl.exe\"${NC}"
  echo ""
  echo -e "  ${YELLOW}Tip:${NC} Use PowerShell installer for better Windows integration"
elif [[ -f "$LAUNCHER_PATH" ]]; then
  if [[ "$NEEDS_RESTART" == "true" ]]; then
    echo -e "  ${YELLOW}→ Restart your terminal, then type:${NC} ${GREEN}$APP_NAME${NC}"
  else
    echo -e "  ${YELLOW}→ Just type:${NC} ${GREEN}$APP_NAME${NC}"
  fi
  echo ""
  echo -e "  The app will start at ${BLUE}http://localhost:3001${NC}"
else
  if [[ "$OS_PREFIX" == "macos" ]]; then
    echo -e "  ${YELLOW}Option 1 - From Finder:${NC}"
    echo -e "    Open ${BLUE}$INSTALL_DIR${NC}"
    echo -e "    Double-click ${YELLOW}$APP_NAME${NC}"
  else
    echo -e "  ${YELLOW}Option 1 - From file manager:${NC}"
    echo -e "    Navigate to ${BLUE}$INSTALL_DIR${NC}"
    echo -e "    Run ${YELLOW}$APP_NAME${NC}"
  fi
  echo ""
  echo -e "  ${YELLOW}Option 2 - From Terminal:${NC}"
  echo -e "    Run ${YELLOW}$INSTALL_DIR/$APP_NAME${NC}"
  echo ""
  echo -e "  The app will start at ${BLUE}http://localhost:3001${NC}"
fi

echo ""
echo -e "${BLUE}Installed to:${NC} $INSTALL_DIR"
echo ""
