#!/bin/bash
# Test script to validate WSL Bun detection logic

echo "🧪 Testing WSL Bun Detection Logic"
echo "=================================="
echo

# Test function that simulates the launcher logic
test_bun_detection() {
    local test_name=$1
    local bun_path=$2
    local expected_result=$3

    echo "Test: $test_name"
    echo "  Bun path: $bun_path"

    # Simulate the detection logic
    NEED_INSTALL=false

    if [ -z "$bun_path" ]; then
        NEED_INSTALL=true
    elif [[ "$bun_path" == *.exe ]] || [[ "$bun_path" == *"/mnt/c/"* ]] || [[ "$bun_path" == *"\\wsl"* ]]; then
        NEED_INSTALL=true
    fi

    # Check result
    if [ "$NEED_INSTALL" = "$expected_result" ]; then
        echo "  ✅ PASS: NEED_INSTALL=$NEED_INSTALL (expected: $expected_result)"
    else
        echo "  ❌ FAIL: NEED_INSTALL=$NEED_INSTALL (expected: $expected_result)"
        return 1
    fi
    echo
}

# Run test cases
FAILED=0

# Test 1: No bun installed
test_bun_detection "No Bun installed" "" "true" || FAILED=$((FAILED + 1))

# Test 2: Windows Bun with .exe extension
test_bun_detection "Windows Bun (.exe)" "C:\\Users\\user\\AppData\\Roaming\\npm\\node_modules\\bun\\bin\\bun.exe" "true" || FAILED=$((FAILED + 1))

# Test 3: Windows Bun via /mnt/c/ path
test_bun_detection "Windows Bun (/mnt/c/)" "/mnt/c/Users/user/.bun/bin/bun.exe" "true" || FAILED=$((FAILED + 1))

# Test 4: Windows Bun via WSL UNC path
test_bun_detection "Windows Bun (UNC path)" "\\wsl.localhost\\Ubuntu-22.04\\home\\user\\.bun\\bin\\bun" "true" || FAILED=$((FAILED + 1))

# Test 5: Native Linux Bun (should NOT trigger install)
test_bun_detection "Native Linux Bun" "/home/user/.bun/bin/bun" "false" || FAILED=$((FAILED + 1))

# Test 6: Native macOS Bun (should NOT trigger install)
test_bun_detection "Native macOS Bun" "/Users/user/.bun/bin/bun" "false" || FAILED=$((FAILED + 1))

# Test 7: System Bun (should NOT trigger install)
test_bun_detection "System Bun" "/usr/local/bin/bun" "false" || FAILED=$((FAILED + 1))

# Summary
echo "=================================="
if [ $FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ $FAILED test(s) failed"
    exit 1
fi
