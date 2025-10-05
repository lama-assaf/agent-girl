# Calculator Unit Tests

This directory contains comprehensive unit tests for a simple calculator implementation using Python's unittest framework.

## Structure

```
python_tests/
├── calculator/
│   └── __init__.py          # Calculator class implementation
├── test_calculator.py       # Comprehensive test suite
├── __init__.py              # Package initialization
└── README.md               # This file
```

## Calculator Implementation

The `Calculator` class provides four basic arithmetic operations:
- `add(a, b)`: Add two numbers
- `subtract(a, b)`: Subtract second number from first
- `multiply(a, b)`: Multiply two numbers
- `divide(a, b)`: Divide first number by second

All methods include proper type checking and raise appropriate exceptions for invalid inputs.

## Test Coverage

The test suite includes 40 test cases covering:

### Normal Operations
- Positive integers
- Negative integers
- Mixed sign integers
- Floating point numbers
- Mixed integer/float operations

### Edge Cases
- Division by zero (raises ZeroDivisionError)
- Division by very small numbers
- Zero as operand
- Identity elements (0 for addition, 1 for multiplication)

### Boundary Conditions
- Very large numbers (10^18 scale)
- Very small floating point numbers (10^-15 scale)
- Extreme negative numbers
- Floating point precision issues

### Type Checking
- Invalid types (strings, lists, None, etc.)
- Boolean values (handled as integers)
- Complex numbers

### Mathematical Properties
- Commutative property of addition
- Associative property of addition
- Distributive property
- Identity properties
- Inverse properties

## Running the Tests

To run the test suite:

```bash
cd python_tests
python test_calculator.py
```

For verbose output:
```bash
python test_calculator.py -v
```

To run specific test methods:
```bash
python -m unittest test_calculator.TestCalculator.test_add_positive_integers
```

## Test Design Principles

The tests follow these best practices:

1. **AAA Pattern**: Each test follows Arrange-Act-Assert structure
2. **Descriptive Names**: Test method names clearly describe what they test
3. **Single Responsibility**: Each test focuses on one specific scenario
4. **Deterministic**: Tests produce consistent results
5. **Isolation**: Tests don't depend on each other
6. **Comprehensive Coverage**: Tests cover normal, edge, and boundary cases
7. **Error Testing**: Proper exception testing with context
8. **Documentation**: Docstrings explain test purpose

## Example Test

```python
def test_add_positive_integers(self):
    """
    Test adding two positive integers.
    """
    result = Calculator.add(2, 3)
    self.assertEqual(result, 5)
```

This simple test demonstrates the AAA pattern:
- **Arrange**: Implicit (no setup needed)
- **Act**: Call the method being tested
- **Assert**: Verify the result matches expectations