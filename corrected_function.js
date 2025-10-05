// Corrected and improved versions of calculateTotal function

// 1. Simple fix - corrected loop condition
function calculateTotalFixed(prices, tax) {
  let total = 0;
  for (let i = 0; i < prices.length; i++) {
    total += prices[i];
  }
  return total + (total * tax);
}

// 2. Using reduce method (more functional approach)
function calculateTotalReduce(prices, tax) {
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  return subtotal + (subtotal * tax);
}

// 3. Defensive programming version with input validation
function calculateTotalDefensive(prices, tax) {
  // Input validation
  if (!Array.isArray(prices)) {
    throw new TypeError('prices must be an array');
  }

  if (typeof tax !== 'number' || isNaN(tax)) {
    throw new TypeError('tax must be a valid number');
  }

  // Handle empty array gracefully
  if (prices.length === 0) {
    return 0;
  }

  // Validate all price values
  for (let i = 0; i < prices.length; i++) {
    if (typeof prices[i] !== 'number' || isNaN(prices[i])) {
      throw new TypeError(`Invalid price at index ${i}: ${prices[i]}`);
    }
  }

  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  return subtotal + (subtotal * tax);
}

// 4. Comprehensive version with type checking and edge case handling
function calculateTotalRobust(prices, tax = 0) {
  // Default values and type coercion
  const safePrices = Array.isArray(prices) ? prices : [];
  const safeTax = typeof tax === 'number' && !isNaN(tax) ? tax : 0;

  // Filter out non-numeric values
  const numericPrices = safePrices.filter(price =>
    typeof price === 'number' && !isNaN(price)
  );

  // Calculate subtotal
  const subtotal = numericPrices.reduce((sum, price) => sum + price, 0);

  // Calculate total with tax
  return subtotal + (subtotal * safeTax);
}

// Test all versions
console.log("=== Testing Corrected Functions ===");

const testCases = [
  { prices: [10, 20, 30], tax: 0.1 },
  { prices: [], tax: 0.1 },
  { prices: [10], tax: 0.1 },
  { prices: [10, 20], tax: 0.15 },
  { prices: [0, 0, 0], tax: 0.2 }
];

testCases.forEach((testCase, index) => {
  console.log(`\nTest Case ${index + 1}: prices=[${testCase.prices}], tax=${testCase.tax}`);

  console.log("Simple fix:", calculateTotalFixed(testCase.prices, testCase.tax));
  console.log("Reduce method:", calculateTotalReduce(testCase.prices, testCase.tax));
  console.log("Defensive:", calculateTotalDefensive(testCase.prices, testCase.tax));
  console.log("Robust:", calculateTotalRobust(testCase.prices, testCase.tax));
});

// Test edge cases
console.log("\n=== Testing Edge Cases ===");

// Test with invalid inputs
try {
  console.log("Testing with non-array prices:");
  console.log(calculateTotalDefensive("not an array", 0.1));
} catch (error) {
  console.log("Caught error:", error.message);
}

try {
  console.log("\nTesting with NaN tax:");
  console.log(calculateTotalDefensive([10, 20], NaN));
} catch (error) {
  console.log("Caught error:", error.message);
}

try {
  console.log("\nTesting with invalid price in array:");
  console.log(calculateTotalDefensive([10, "invalid", 30], 0.1));
} catch (error) {
  console.log("Caught error:", error.message);
}

// Test robust version with invalid inputs
console.log("\nTesting robust version with invalid inputs:");
console.log("Non-array:", calculateTotalRobust("not an array", 0.1));
console.log("NaN tax:", calculateTotalRobust([10, 20], NaN));
console.log("Mixed array:", calculateTotalRobust([10, "invalid", null, undefined, 30], 0.1));
console.log("No tax provided:", calculateTotalRobust([10, 20, 30]));