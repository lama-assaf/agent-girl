// Debug test file for calculateTotal function

function calculateTotal(prices, tax) {
  let total = 0;
  for (let i = 0; i < prices.length; i++) {
    total += prices[i];
  }
  return total + (total * tax);
}

// Test cases to reproduce the issue
console.log("=== Testing calculateTotal function ===");

// Test case 1: Working case from description
console.log("\n1. Testing with [10, 20, 30] and tax 0.1:");
const result1 = calculateTotal([10, 20, 30], 0.1);
console.log("Result:", result1);
console.log("Is NaN:", isNaN(result1));

// Test case 2: Empty array
console.log("\n2. Testing with [] and tax 0.1:");
const result2 = calculateTotal([], 0.1);
console.log("Result:", result2);
console.log("Is NaN:", isNaN(result2));

// Test case 3: Single item array
console.log("\n3. Testing with [10] and tax 0.1:");
const result3 = calculateTotal([10], 0.1);
console.log("Result:", result3);
console.log("Is NaN:", isNaN(result3));

// Test case 4: Two items
console.log("\n4. Testing with [10, 20] and tax 0.1:");
const result4 = calculateTotal([10, 20], 0.1);
console.log("Result:", result4);
console.log("Is NaN:", isNaN(result4));

// Debug the loop behavior
console.log("\n=== Debugging loop behavior ===");

function debugLoop(prices) {
  console.log(`Debugging array: [${prices}]`);
  console.log(`Array length: ${prices.length}`);

  let total = 0;
  for (let i = 0; i < prices.length; i++) {
    console.log(`Iteration ${i}: prices[${i}] = ${prices[i]}`);
    total += prices[i];
    console.log(`Total after iteration ${i}: ${total}`);
  }
  return total;
}

console.log("\nDebugging empty array:");
debugLoop([]);

console.log("\nDebugging single item array:");
debugLoop([10]);

console.log("\nDebugging multi-item array:");
debugLoop([10, 20, 30]);