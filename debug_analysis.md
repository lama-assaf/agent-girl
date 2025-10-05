# Debug Analysis: calculateTotal Function Bug

## Root Cause Identified

The bug is in the for loop condition: `for (let i = 0; i <= prices.length; i++)`

**Problem:** The loop uses `<=` instead of `<`, causing it to iterate one extra time beyond the array bounds.

## Why It Causes NaN

When the loop accesses `prices[prices.length]`, it returns `undefined` because:
- JavaScript arrays are zero-indexed
- Valid indices are 0 to (length - 1)
- Accessing index equal to length is out of bounds

When `undefined` is added to a number using `+=`, JavaScript performs type coercion:
- `undefined` is converted to `NaN`
- Any arithmetic operation with `NaN` results in `NaN`
- Once `total` becomes `NaN`, all subsequent operations keep it as `NaN`

## Test Results Summary

All test cases fail with NaN:
- `[10, 20, 30]` → NaN (iteration goes to index 3)
- `[]` → NaN (iteration goes to index 0)
- `[10]` → NaN (iteration goes to index 1)
- `[10, 20]` → NaN (iteration goes to index 2)

## The Loop Behavior

For array `[10, 20, 30]` with length 3:
- Iteration 0: prices[0] = 10 ✓
- Iteration 1: prices[1] = 20 ✓
- Iteration 2: prices[2] = 30 ✓
- Iteration 3: prices[3] = undefined ✗ ← BUG HERE