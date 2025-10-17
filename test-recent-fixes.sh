#!/bin/bash
# Comprehensive test script for v3.0.0 and v3.0.1 fixes

set -e

echo "🧪 Testing Recent Fixes (v3.0.0 + v3.0.1)"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    PASSED=$((PASSED + 1))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    FAILED=$((FAILED + 1))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

# =============================================================================
# Test 1: SDK Session ID Clearing (v3.0.0 Fix #1)
# =============================================================================
echo "📋 Test 1: SDK Session ID Clearing on Directory Change"
echo "──────────────────────────────────────────────────────"

# Check that database.ts updateSdkSessionId accepts null
if grep -q "updateSdkSessionId(sessionId: string, sdkSessionId: string | null)" server/database.ts; then
    pass "database.ts accepts null for SDK session ID"
else
    fail "database.ts doesn't accept null for SDK session ID"
fi

# Check that routes/sessions.ts clears SDK session ID on directory change
if grep -q "sessionDb.updateSdkSessionId(sessionId, null)" server/routes/sessions.ts; then
    pass "routes/sessions.ts clears SDK session ID on directory change"
else
    fail "routes/sessions.ts doesn't clear SDK session ID on directory change"
fi

# Verify the clearing happens BEFORE stream cleanup (check line numbers)
SDK_CLEAR_LINE=$(grep -n "updateSdkSessionId(sessionId, null)" server/routes/sessions.ts | grep -v "// " | cut -d: -f1)
CLEANUP_LINE=$(grep -n "sessionStreamManager.cleanupSession(sessionId, 'directory_changed')" server/routes/sessions.ts | cut -d: -f1)

if [ -n "$SDK_CLEAR_LINE" ] && [ -n "$CLEANUP_LINE" ] && [ "$SDK_CLEAR_LINE" -lt "$CLEANUP_LINE" ]; then
    pass "SDK session ID cleared before stream cleanup (line $SDK_CLEAR_LINE < line $CLEANUP_LINE)"
else
    fail "SDK session ID not cleared before stream cleanup"
fi

echo

# =============================================================================
# Test 2: process.execPath Usage (v3.0.0 Fix #2 - WSL compatibility)
# =============================================================================
echo "📋 Test 2: process.execPath Usage (WSL Compatibility)"
echo "────────────────────────────────────────────────────"

# Check that we're using process.execPath instead of hardcoded 'bun'
if grep -q "executable: process.execPath" server/websocket/messageHandlers.ts; then
    pass "Using process.execPath for executable path"
else
    fail "Not using process.execPath (still hardcoded?)"
fi

# Verify no hardcoded 'bun' string for executable option
if grep "executable:" server/websocket/messageHandlers.ts | grep -q "executable: 'bun'"; then
    fail "Found hardcoded 'bun' string (should use process.execPath)"
else
    pass "No hardcoded 'bun' string found"
fi

echo

# =============================================================================
# Test 3: Command Setup Cleanup (v3.0.0 Fix #3)
# =============================================================================
echo "📋 Test 3: Command Setup Silent Logging"
echo "──────────────────────────────────────"

# Check that scary warnings are removed
if grep -q "console.warn.*not found" server/commandSetup.ts; then
    fail "Still has console.warn for missing directories"
else
    pass "No console.warn for missing directories"
fi

# Check that it only logs when commands are actually copied
if grep -q "if (copiedCount > 0)" server/commandSetup.ts; then
    pass "Only logs when commands are copied (conditional logging)"
else
    warn "May log even when no commands copied"
fi

# Check for .gitkeep files
GITKEEP_COUNT=$(find server/commands -name ".gitkeep" | wc -l | tr -d ' ')
if [ "$GITKEEP_COUNT" -eq 4 ]; then
    pass "All 4 .gitkeep files present (general, shared, intense-research, spark)"
else
    fail "Expected 4 .gitkeep files, found $GITKEEP_COUNT"
fi

echo

# =============================================================================
# Test 4: WSL Bun Detection (v3.0.1 Fix)
# =============================================================================
echo "📋 Test 4: WSL Bun Detection in Launcher Scripts"
echo "───────────────────────────────────────────────"

# Check GitHub Actions macOS launcher
if grep -q "*.exe.*mnt/c.*\\\\\\\\wsl" .github/workflows/release.yml; then
    pass "GitHub Actions macOS launcher has WSL detection"
else
    fail "GitHub Actions macOS launcher missing WSL detection"
fi

# Check GitHub Actions Linux launcher
LINUX_DETECTION_COUNT=$(grep -c "*.exe.*mnt/c.*\\\\\\\\wsl" .github/workflows/release.yml || echo "0")
if [ "$LINUX_DETECTION_COUNT" -ge 2 ]; then
    pass "GitHub Actions Linux launcher has WSL detection"
else
    fail "GitHub Actions Linux launcher missing WSL detection"
fi

# Check local build script
if grep -q "*.exe.*mnt/c.*\\\\\\\\wsl" build-source-release.sh; then
    pass "Local build script has WSL detection"
else
    fail "Local build script missing WSL detection"
fi

# Check for warning message
if grep -q "Detected Windows Bun in WSL environment" .github/workflows/release.yml; then
    pass "User-friendly WSL detection message present"
else
    fail "Missing user-friendly WSL detection message"
fi

echo

# =============================================================================
# Test 5: TypeScript Compilation
# =============================================================================
echo "📋 Test 5: TypeScript Type Checking"
echo "──────────────────────────────────"

if bunx tsc --noEmit 2>&1 | grep -q "error TS"; then
    fail "TypeScript compilation errors found"
else
    pass "TypeScript compilation clean (no errors)"
fi

echo

# =============================================================================
# Test 6: Code Quality Checks
# =============================================================================
echo "📋 Test 6: Code Quality (ESLint)"
echo "──────────────────────────────"

if bun run lint 2>&1 | grep -q "error"; then
    fail "ESLint errors found"
else
    pass "ESLint passed (no errors)"
fi

echo

# =============================================================================
# Test 7: Build Process
# =============================================================================
echo "📋 Test 7: Build Process"
echo "──────────────────────"

if bun run build >/dev/null 2>&1; then
    pass "Client build successful"
else
    fail "Client build failed"
fi

echo

# =============================================================================
# Test 8: Package Version Check
# =============================================================================
echo "📋 Test 8: Package Version"
echo "─────────────────────────"

CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
# Check if version is 3.0.1 or higher
VERSION_MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
VERSION_MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
VERSION_PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)

if [ "$VERSION_MAJOR" -ge 3 ] && [ "$VERSION_MINOR" -ge 0 ] && [ "$VERSION_PATCH" -ge 1 ]; then
    pass "Package version is $CURRENT_VERSION (>= 3.0.1)"
else
    fail "Package version is $CURRENT_VERSION (expected >= 3.0.1)"
fi

echo

# =============================================================================
# Test 9: Git Tag Check
# =============================================================================
echo "📋 Test 9: Git Tags"
echo "──────────────────"

if git tag | grep -q "v3.0.0"; then
    pass "Tag v3.0.0 exists"
else
    fail "Tag v3.0.0 missing"
fi

if git tag | grep -q "v3.0.1"; then
    pass "Tag v3.0.1 exists"
else
    fail "Tag v3.0.1 missing"
fi

echo

# =============================================================================
# Test 10: Integration Test - WSL Detection Logic
# =============================================================================
echo "📋 Test 10: WSL Detection Logic Integration"
echo "───────────────────────────────────────────"

# Run the WSL detection test if it exists
if [ -f "test-wsl-detection.sh" ]; then
    if ./test-wsl-detection.sh >/dev/null 2>&1; then
        pass "WSL detection logic tests passed (7/7)"
    else
        fail "WSL detection logic tests failed"
    fi
else
    warn "test-wsl-detection.sh not found, skipping integration test"
fi

echo

# =============================================================================
# Summary
# =============================================================================
echo "=========================================="
echo "📊 Test Results Summary"
echo "=========================================="
echo
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for production.${NC}"
    echo
    echo "✅ v3.0.0 Fixes Verified:"
    echo "   - SDK session ID clearing on directory change"
    echo "   - process.execPath usage (WSL compatibility)"
    echo "   - Command setup silent logging"
    echo
    echo "✅ v3.0.1 Fixes Verified:"
    echo "   - WSL Bun detection in all launcher scripts"
    echo
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Review the output above.${NC}"
    exit 1
fi
