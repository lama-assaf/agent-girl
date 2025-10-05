# Defensive Programming Practices to Prevent Similar Issues

## 1. Input Validation

Always validate function inputs:

```javascript
function safeFunction(prices, tax) {
  // Check array type
  if (!Array.isArray(prices)) {
    throw new TypeError('prices must be an array');
  }

  // Check number type
  if (typeof tax !== 'number' || isNaN(tax)) {
    throw new TypeError('tax must be a valid number');
  }

  // Check for empty arrays
  if (prices.length === 0) {
    return 0; // Handle gracefully
  }
}
```

## 2. Array Bounds Safety

Prevent out-of-bounds access:

```javascript
// ✅ Safe: Use < instead of <=
for (let i = 0; i < array.length; i++) {
  // Safe access: array[i] will always be valid
}

// ✅ Alternative: Use forEach
array.forEach((item, index) => {
  // No manual index management needed
});

// ✅ Alternative: Use for...of
for (const item of array) {
  // No index access needed
}
```

## 3. Use Modern JavaScript Methods

Prefer built-in methods over manual loops:

```javascript
// ✅ Better: Use reduce
const subtotal = prices.reduce((sum, price) => sum + price, 0);

// ✅ Even better: Add validation
const subtotal = prices
  .filter(price => typeof price === 'number' && !isNaN(price))
  .reduce((sum, price) => sum + price, 0);
```

## 4. Type Checking and Coercion

Handle type-related edge cases:

```javascript
function robustFunction(prices, tax = 0) {
  // Safe defaults
  const safePrices = Array.isArray(prices) ? prices : [];
  const safeTax = typeof tax === 'number' && !isNaN(tax) ? tax : 0;

  // Filter invalid values
  const validPrices = safePrices.filter(price =>
    typeof price === 'number' && !isNaN(price) && price >= 0
  );

  return validPrices.reduce((sum, price) => sum + price, 0);
}
```

## 5. Early Returns and Guard Clauses

Handle edge cases early:

```javascript
function calculateTotal(prices, tax) {
  // Guard clauses
  if (!Array.isArray(prices)) return 0;
  if (prices.length === 0) return 0;
  if (typeof tax !== 'number' || isNaN(tax)) tax = 0;

  // Main logic
  return prices.reduce((sum, price) => sum + price, 0) * (1 + tax);
}
```

## 6. Unit Testing

Test edge cases systematically:

```javascript
const testCases = [
  { input: [[10, 20, 30], 0.1], expected: 66 },
  { input: [[], 0.1], expected: 0 },
  { input: [[10], 0.1], expected: 11 },
  { input: [[10, 20], 0.15], expected: 34.5 },
  { input: [[0, 0, 0], 0.2], expected: 0 },
  { input: [[-10, 20], 0.1], expected: 11 }, // Test negative numbers
  { input: [[10, null, 30], 0.1], expected: 44 }, // Test null/undefined
];

testCases.forEach(({input, expected}, index) => {
  const result = calculateTotal(...input);
  if (result !== expected) {
    console.error(`Test ${index} failed: expected ${expected}, got ${result}`);
  }
});
```

## 7. Error Handling

Provide meaningful error messages:

```javascript
function calculateTotalWithErrors(prices, tax) {
  if (!Array.isArray(prices)) {
    throw new TypeError(`Expected array for prices, got ${typeof prices}`);
  }

  if (typeof tax !== 'number' || isNaN(tax)) {
    throw new TypeError(`Expected number for tax, got ${typeof tax}: ${tax}`);
  }

  // Check for invalid prices
  const invalidPrices = prices
    .map((price, index) => ({ price, index }))
    .filter(({ price }) => typeof price !== 'number' || isNaN(price));

  if (invalidPrices.length > 0) {
    throw new Error(`Invalid prices at indices: ${invalidPrices.map(({ index }) => index).join(', ')}`);
  }

  // Continue with calculation...
}
```

## 8. Logging and Debugging

Add logging for debugging:

```javascript
function debuggableCalculateTotal(prices, tax) {
  console.log('Input:', { prices, tax });
  console.log('Array length:', prices.length);

  let total = 0;
  for (let i = 0; i < prices.length; i++) {
    console.log(`Processing index ${i}: ${prices[i]}`);
    total += prices[i];
    console.log(`Running total: ${total}`);
  }

  const result = total + (total * tax);
  console.log('Final result:', result);
  return result;
}
```

## 9. TypeScript for Type Safety

Consider using TypeScript:

```typescript
interface CalculateTotalParams {
  prices: number[];
  tax: number;
}

function calculateTotalTyped({ prices, tax }: CalculateTotalParams): number {
  return prices.reduce((sum, price) => sum + price, 0) * (1 + tax);
}

// Usage with type checking
const result = calculateTotalTyped({ prices: [10, 20, 30], tax: 0.1 });
```

## 10. Performance Considerations

For large arrays, consider performance:

```javascript
// ✅ Efficient for large arrays
function fastCalculateTotal(prices, tax) {
  let subtotal = 0;
  for (let i = 0, len = prices.length; i < len; i++) {
    subtotal += prices[i] || 0; // Handle undefined/null
  }
  return subtotal + (subtotal * tax);
}

// ✅ Parallel processing for very large arrays (Node.js)
async function parallelCalculateTotal(prices, tax) {
  const chunkSize = 1000;
  const chunks = [];

  for (let i = 0; i < prices.length; i += chunkSize) {
    chunks.push(prices.slice(i, i + chunkSize));
  }

  const sums = await Promise.all(
    chunks.map(chunk => chunk.reduce((sum, price) => sum + price, 0))
  );

  const subtotal = sums.reduce((sum, chunkSum) => sum + chunkSum, 0);
  return subtotal + (subtotal * tax);
}
```