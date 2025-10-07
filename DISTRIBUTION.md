# Agent Girl Distribution Guide

This document explains how to create and distribute notarized releases of Agent Girl.

## Overview

Agent Girl uses **Apple Notarization** and **automated GitHub Actions** to create secure, signed releases that macOS users can install easily without security warnings.

## Prerequisites

All Apple Developer credentials are already configured in GitHub Secrets:
- ✅ `APPLE_CERTIFICATE` - Base64 encoded P12 certificate
- ✅ `APPLE_CERTIFICATE_PASSWORD` - Certificate password
- ✅ `APPLE_SIGNING_IDENTITY` - Developer ID Application identity
- ✅ `APPLE_TEAM_ID` - Apple Team ID
- ✅ `APPLE_ID` - Apple ID email
- ✅ `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password for notarization

## Creating a Release

### Option 1: Create a Git Tag (Recommended)

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

This automatically triggers the GitHub Actions workflow to:
1. Build binaries for macOS ARM64 and Intel
2. Sign both binaries with your Developer ID
3. Notarize both binaries with Apple
4. Create a GitHub Release
5. Upload the signed, notarized binaries

### Option 2: Manual Workflow Dispatch

1. Go to: **Actions** → **Build, Sign & Notarize Release**
2. Click **Run workflow**
3. Enter version tag (e.g., `v1.0.0`)
4. Click **Run workflow**

## What Happens During Release

The GitHub Actions workflow (`.github/workflows/release.yml`):

1. **Build** - Compiles binaries for both architectures using Bun
2. **Sign** - Signs binaries with `codesign` using Developer ID certificate
3. **Notarize** - Submits signed binaries to Apple for notarization via `xcrun notarytool`
4. **Release** - Creates GitHub release with both signed binaries

**Build time**: ~5-10 minutes per release

## User Installation

### One-Line Install (Recommended)

Users can install with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/UnstableMind/agent-boy2/master/install.sh | bash
```

The install script:
- ✅ Detects user's architecture (Intel vs ARM64)
- ✅ Downloads the correct binary from latest GitHub release
- ✅ Extracts to `~/Applications/agent-girl-app/`
- ✅ Sets executable permissions
- ✅ Creates a global command-line launcher
- ✅ Reminds user to configure API key

### Manual Download

Users can also download directly:

1. Go to: https://github.com/UnstableMind/agent-boy2/releases/latest
2. Download:
   - `agent-girl-macos-arm64.zip` (Apple Silicon)
   - `agent-girl-macos-intel.zip` (Intel)
3. Extract and run

## Repository Visibility

**Q: Does the repo need to be public?**

**A:** For the easiest installation experience, **yes**. Here's why:

- ✅ **Public repo** → GitHub releases are publicly downloadable → curl install works seamlessly
- ❌ **Private repo** → Releases require authentication → users need GitHub tokens

**Your backend code is safe** because it's compiled into the binary. The source visibility doesn't expose your backend logic.

## Distribution Methods

### 1. **curl Install** (Recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/UnstableMind/agent-boy2/master/install.sh | bash
```
- ✅ One-line installation
- ✅ Auto-detects architecture
- ✅ Always downloads latest version

### 2. **Direct Download**
Link users to: https://github.com/UnstableMind/agent-boy2/releases/latest
- ✅ Simple for users
- ✅ GitHub hosts the files

### 3. **Homebrew** (Future Enhancement)
Create a Homebrew tap for even easier installation:
```bash
brew tap UnstableMind/agent-girl
brew install agent-girl
```

## Updating Your Installation Instructions

Update your README or documentation with:

```markdown
## Installation

### macOS (One-Line Install)

```bash
curl -fsSL https://raw.githubusercontent.com/UnstableMind/agent-boy2/master/install.sh | bash
```

Or download manually from [Releases](https://github.com/UnstableMind/agent-boy2/releases/latest).

Supports:
- ✅ macOS 11+ (Big Sur or later)
- ✅ Apple Silicon (M1/M2/M3)
- ✅ Intel (x86_64)
```

## Files Created

- `.github/workflows/release.yml` - Automated build, sign, and notarization workflow
- `install.sh` - User-facing installation script with architecture detection

## Security Notes

- ✅ Binaries are code-signed with Developer ID
- ✅ Binaries are notarized by Apple
- ✅ No Gatekeeper warnings for users
- ✅ Backend code is compiled and hidden
- ✅ GitHub secrets are encrypted and secure

## Troubleshooting

### Notarization Fails

Check the GitHub Actions logs. Common issues:
- Invalid credentials (check secrets)
- Certificate expired (renew in Apple Developer Portal)
- Team ID mismatch

### Users Get Security Warnings

This shouldn't happen with notarized binaries. If it does:
- Verify notarization succeeded in GitHub Actions logs
- Check certificate is valid: `codesign --verify --verbose binary-name`

### Install Script Fails

- Ensure repo is public (or releases are public)
- Check latest release exists: https://github.com/UnstableMind/agent-boy2/releases/latest
- Verify architecture is supported (macOS Intel or ARM64 only)

## Next Steps

1. **Make repo public** (if you want curl install to work)
2. **Create your first release**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. **Test the install script** (wait for Actions to complete):
   ```bash
   curl -fsSL https://raw.githubusercontent.com/UnstableMind/agent-boy2/master/install.sh | bash
   ```
4. **Update your README** with installation instructions

## Cost

- Apple Developer Program: **$99/year**
- GitHub hosting: **Free** (for public repos)
- Total annual cost: **$99/year**

Your users get:
- ✅ No security warnings
- ✅ One-line installation
- ✅ Automatic architecture detection
- ✅ Professional distribution experience
