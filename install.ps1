# Agent Girl Windows Installer
# Run with: iwr -useb https://raw.githubusercontent.com/KenKaiii/agent-girl/master/install.ps1 | iex

$ErrorActionPreference = "Stop"

# Colors
function Write-Color($text, $color = "White") {
    Write-Host $text -ForegroundColor $color
}

Write-Color "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-Color "   Agent Girl Installer" "Cyan"
Write-Color "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" "Cyan"

# Configuration
$REPO = "KenKaiii/agent-girl"
$APP_NAME = "agent-girl"
$INSTALL_DIR = "$env:LOCALAPPDATA\Programs\agent-girl-app"

# Detect architecture
$ARCH = $env:PROCESSOR_ARCHITECTURE
if ($ARCH -eq "AMD64") {
    $PLATFORM = "windows-x64"
    $ARCH_NAME = "x64"
} else {
    Write-Color "❌ Unsupported architecture: $ARCH" "Red"
    Write-Host "This installer supports x64 Windows only."
    exit 1
}

Write-Color "✓ Detected architecture: $ARCH_NAME" "Green"
Write-Host ""

# Get latest release
Write-Color "📡 Fetching latest release..." "Cyan"
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest"
    $VERSION = $release.tag_name
    $asset = $release.assets | Where-Object { $_.name -like "*$PLATFORM.zip" }
    $DOWNLOAD_URL = $asset.browser_download_url
} catch {
    Write-Color "❌ Failed to fetch release information" "Red"
    Write-Host "Please check your internet connection and try again."
    exit 1
}

if (-not $DOWNLOAD_URL) {
    Write-Color "❌ Could not find download URL for $PLATFORM" "Red"
    exit 1
}

Write-Color "✓ Latest version: $VERSION" "Green"
Write-Host ""

# Create install directory
Write-Color "📁 Creating installation directory..." "Cyan"
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null

# Download the release
$DOWNLOAD_PATH = "$env:TEMP\$APP_NAME-$PLATFORM.zip"
Write-Color "⬇️  Downloading Agent Girl $VERSION..." "Cyan"
Write-Color "   $DOWNLOAD_URL" "Yellow"
Write-Host ""

try {
    Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $DOWNLOAD_PATH
} catch {
    Write-Color "❌ Download failed" "Red"
    exit 1
}

Write-Host ""
Write-Color "✓ Download complete" "Green"
Write-Host ""

# Extract the archive
Write-Color "📦 Extracting..." "Cyan"
try {
    Expand-Archive -Path $DOWNLOAD_PATH -DestinationPath "$env:TEMP" -Force
} catch {
    Write-Color "❌ Extraction failed" "Red"
    Remove-Item $DOWNLOAD_PATH -Force
    exit 1
}

# Move files to installation directory
Write-Color "📁 Installing to $INSTALL_DIR..." "Cyan"
Remove-Item "$INSTALL_DIR\*" -Recurse -Force -ErrorAction SilentlyContinue
Move-Item "$env:TEMP\$APP_NAME-$PLATFORM\*" $INSTALL_DIR -Force

# Clean up
Remove-Item $DOWNLOAD_PATH -Force
Remove-Item "$env:TEMP\$APP_NAME-$PLATFORM" -Recurse -Force -ErrorAction SilentlyContinue

Write-Color "✓ Installation complete" "Green"
Write-Host ""

# API Key Configuration
Write-Color "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-Color "   API Key Setup" "Cyan"
Write-Color "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" "Cyan"
Write-Host "Which API provider(s) do you want to use?"
Write-Host ""
Write-Color "  1) " "Yellow" -NoNewline; Write-Host "Anthropic API only (Claude models)"
Write-Color "  2) " "Yellow" -NoNewline; Write-Host "Z.AI API only (GLM models)"
Write-Color "  3) " "Yellow" -NoNewline; Write-Host "Both APIs (full model access)"
Write-Color "  4) " "Yellow" -NoNewline; Write-Host "Skip (configure later)"
Write-Host ""
$api_choice = Read-Host "Enter choice [1-4]"

$ANTHROPIC_KEY = ""
$ZAI_KEY = ""

switch ($api_choice) {
    "1" {
        Write-Host ""
        Write-Color "📝 Anthropic API Setup" "Cyan"
        Write-Host "Get your API key from: https://console.anthropic.com/"
        Write-Host ""
        $ANTHROPIC_KEY = Read-Host "Enter your Anthropic API key"
    }
    "2" {
        Write-Host ""
        Write-Color "📝 Z.AI API Setup" "Cyan"
        Write-Host "Get your API key from: https://z.ai"
        Write-Host ""
        $ZAI_KEY = Read-Host "Enter your Z.AI API key"
    }
    "3" {
        Write-Host ""
        Write-Color "📝 Anthropic API Setup" "Cyan"
        Write-Host "Get your API key from: https://console.anthropic.com/"
        Write-Host ""
        $ANTHROPIC_KEY = Read-Host "Enter your Anthropic API key"
        Write-Host ""
        Write-Color "📝 Z.AI API Setup" "Cyan"
        Write-Host "Get your API key from: https://z.ai"
        Write-Host ""
        $ZAI_KEY = Read-Host "Enter your Z.AI API key"
    }
    "4" {
        Write-Host ""
        Write-Color "⚠️  Skipping API configuration" "Yellow"
        Write-Host "You'll need to edit $INSTALL_DIR\.env before running Agent Girl"
    }
    default {
        Write-Host ""
        Write-Color "Invalid choice. Skipping API configuration." "Red"
    }
}

# Update .env with actual keys
if ($ANTHROPIC_KEY -or $ZAI_KEY) {
    if (-not $ANTHROPIC_KEY) { $ANTHROPIC_KEY = "sk-ant-your-key-here" }
    if (-not $ZAI_KEY) { $ZAI_KEY = "your-zai-key-here" }

    @"
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
"@ | Out-File -FilePath "$INSTALL_DIR\.env" -Encoding UTF8

    Write-Host ""
    Write-Color "✓ API keys configured" "Green"
}
Write-Host ""

# Add to PATH
Write-Color "🔗 Adding to PATH..." "Cyan"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$INSTALL_DIR*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$INSTALL_DIR", "User")
    Write-Color "✓ Added to PATH" "Green"
    $NEEDS_RESTART = $true
} else {
    Write-Color "✓ Already in PATH" "Green"
    $NEEDS_RESTART = $false
}
Write-Host ""

# License notification
Write-Color "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-Color "   License Information" "Cyan"
Write-Color "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" "Cyan"
Write-Color "Agent Girl is free and open source software" "Yellow"
Write-Host "Licensed under GNU AGPL-3.0 (Affero General Public License)"
Write-Host ""
Write-Host "This means:"
Write-Host "  • You can use, modify, and distribute this software"
Write-Host "  • If you modify and run it as a service, you must share your changes"
Write-Host "  • Full license text available at: $INSTALL_DIR\LICENSE"
Write-Host ""
Write-Host "By using this software, you agree to the AGPL-3.0 terms."
Write-Host "Learn more: https://www.gnu.org/licenses/agpl-3.0.html"
Write-Host ""

# Success message
Write-Color "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Green"
Write-Color "   Installation Successful! 🎉" "Green"
Write-Color "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" "Green"
Write-Color "How to start Agent Girl:" "Cyan"
Write-Host ""

if ($NEEDS_RESTART) {
    Write-Color "  → Restart PowerShell, then type: " "Yellow" -NoNewline
    Write-Color "agent-girl" "Green"
} else {
    Write-Color "  → Just type: " "Yellow" -NoNewline
    Write-Color "agent-girl" "Green"
}

Write-Host ""
Write-Host "  The app will start at http://localhost:3001"
Write-Host ""
Write-Color "Installed to: " "Cyan" -NoNewline
Write-Host $INSTALL_DIR
Write-Host ""
