"""
Comprehensive unit tests for the Calculator class.

This test suite covers:
- Normal operations with various number types
- Edge cases (division by zero, etc.)
- Boundary conditions (large numbers, zero, negatives)
- Type checking and error handling
"""

import unittest
import sys
import os

# Add the calculator module to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'calculator'))

from calculator import Calculator


class TestCalculator(unittest.TestCase):
    """
    Test cases for the Calculator class.
    """

    def setUp(self):
        """
        Set up test fixtures before each test method.
        """
        self.calculator = Calculator()

    # ==================== ADDITION TESTS ====================

    def test_add_positive_integers(self):
        """
        Test adding two positive integers.
        """
        result = Calculator.add(2, 3)
        self.assertEqual(result, 5)

    def test_add_negative_integers(self):
        """
        Test adding two negative integers.
        """
        result = Calculator.add(-2, -3)
        self.assertEqual(result, -5)

    def test_add_mixed_sign_integers(self):
        """
        Test adding integers with different signs.
        """
        result = Calculator.add(5, -3)
        self.assertEqual(result, 2)

    def test_add_floats(self):
        """
        Test adding two floating point numbers.
        """
        result = Calculator.add(2.5, 3.7)
        self.assertAlmostEqual(result, 6.2, places=7)

    def test_add_integer_and_float(self):
        """
        Test adding an integer and a float.
        """
        result = Calculator.add(5, 2.5)
        self.assertAlmostEqual(result, 7.5, places=7)

    def test_add_zero(self):
        """
        Test adding zero to various numbers.
        """
        self.assertEqual(Calculator.add(5, 0), 5)
        self.assertEqual(Calculator.add(0, 5), 5)
        self.assertEqual(Calculator.add(0, 0), 0)

    # ==================== SUBTRACTION TESTS ====================

    def test_subtract_positive_integers(self):
        """
        Test subtracting two positive integers.
        """
        result = Calculator.subtract(5, 3)
        self.assertEqual(result, 2)

    def test_subtract_negative_integers(self):
        """
        Test subtracting two negative integers.
        """
        result = Calculator.subtract(-5, -3)
        self.assertEqual(result, -2)

    def test_subtract_mixed_sign_integers(self):
        """
        Test subtracting integers with different signs.
        """
        result = Calculator.subtract(5, -3)
        self.assertEqual(result, 8)

    def test_subtract_floats(self):
        """
        Test subtracting two floating point numbers.
        """
        result = Calculator.subtract(5.7, 2.3)
        self.assertAlmostEqual(result, 3.4, places=7)

    def test_subtract_same_numbers(self):
        """
        Test subtracting a number from itself.
        """
        result = Calculator.subtract(5, 5)
        self.assertEqual(result, 0)

    # ==================== MULTIPLICATION TESTS ====================

    def test_multiply_positive_integers(self):
        """
        Test multiplying two positive integers.
        """
        result = Calculator.multiply(3, 4)
        self.assertEqual(result, 12)

    def test_multiply_negative_integers(self):
        """
        Test multiplying two negative integers.
        """
        result = Calculator.multiply(-3, -4)
        self.assertEqual(result, 12)

    def test_multiply_mixed_sign_integers(self):
        """
        Test multiplying integers with different signs.
        """
        result = Calculator.multiply(3, -4)
        self.assertEqual(result, -12)

    def test_multiply_floats(self):
        """
        Test multiplying two floating point numbers.
        """
        result = Calculator.multiply(2.5, 4.0)
        self.assertAlmostEqual(result, 10.0, places=7)

    def test_multiply_by_zero(self):
        """
        Test multiplying by zero.
        """
        self.assertEqual(Calculator.multiply(5, 0), 0)
        self.assertEqual(Calculator.multiply(0, 5), 0)
        self.assertEqual(Calculator.multiply(0, 0), 0)

    def test_multiply_by_one(self):
        """
        Test multiplying by one.
        """
        self.assertEqual(Calculator.multiply(5, 1), 5)
        self.assertEqual(Calculator.multiply(1, 5), 5)

    # ==================== DIVISION TESTS ====================

    def test_divide_positive_integers(self):
        """
        Test dividing two positive integers.
        """
        result = Calculator.divide(12, 3)
        self.assertEqual(result, 4)

    def test_divide_negative_integers(self):
        """
        Test dividing two negative integers.
        """
        result = Calculator.divide(-12, -3)
        self.assertEqual(result, 4)

    def test_divide_mixed_sign_integers(self):
        """
        Test dividing integers with different signs.
        """
        result = Calculator.divide(12, -3)
        self.assertEqual(result, -4)

    def test_divide_floats(self):
        """
        Test dividing two floating point numbers.
        """
        result = Calculator.divide(5.0, 2.0)
        self.assertAlmostEqual(result, 2.5, places=7)

    def test_divide_resulting_in_float(self):
        """
        Test division that results in a floating point number.
        """
        result = Calculator.divide(5, 2)
        self.assertAlmostEqual(result, 2.5, places=7)

    # ==================== EDGE CASE TESTS ====================

    def test_divide_by_zero_raises_error(self):
        """
        Test that dividing by zero raises a ZeroDivisionError.
        """
        with self.assertRaises(ZeroDivisionError) as context:
            Calculator.divide(5, 0)
        self.assertEqual(str(context.exception), "Cannot divide by zero")

    def test_divide_zero_by_nonzero(self):
        """
        Test dividing zero by a non-zero number.
        """
        result = Calculator.divide(0, 5)
        self.assertEqual(result, 0)

    def test_divide_by_small_number(self):
        """
        Test division by a very small number.
        """
        result = Calculator.divide(1, 0.001)
        self.assertAlmostEqual(result, 1000, places=7)

    # ==================== BOUNDARY CONDITION TESTS ====================

    def test_large_numbers(self):
        """
        Test operations with very large numbers.
        """
        large_num1 = 10**18
        large_num2 = 10**15

        # Test addition
        result = Calculator.add(large_num1, large_num2)
        self.assertEqual(result, 10**18 + 10**15)

        # Test multiplication
        result = Calculator.multiply(10**6, 10**6)
        self.assertEqual(result, 10**12)

    def test_very_small_numbers(self):
        """
        Test operations with very small floating point numbers.
        """
        small_num1 = 1e-10
        small_num2 = 1e-15

        # Test addition
        result = Calculator.add(small_num1, small_num2)
        self.assertAlmostEqual(result, 1.00001e-10, places=20)

        # Test multiplication
        result = Calculator.multiply(small_num1, small_num2)
        self.assertAlmostEqual(result, 1e-25, places=30)

    def test_extreme_negative_numbers(self):
        """
        Test operations with extreme negative numbers.
        """
        extreme_negative = -10**15

        # Test addition
        result = Calculator.add(extreme_negative, -extreme_negative)
        self.assertEqual(result, 0)

        # Test multiplication
        result = Calculator.multiply(extreme_negative, 2)
        self.assertEqual(result, -2 * 10**15)

    def test_floating_point_precision(self):
        """
        Test floating point precision in various operations.
        """
        # Test known floating point precision issues
        result = Calculator.add(0.1, 0.2)
        self.assertAlmostEqual(result, 0.3, places=7)

        result = Calculator.subtract(1.0, 0.9)
        self.assertAlmostEqual(result, 0.1, places=7)

    # ==================== TYPE CHECKING TESTS ====================

    def test_add_with_invalid_types(self):
        """
        Test that add() raises TypeError for non-numeric inputs.
        """
        with self.assertRaises(TypeError):
            Calculator.add("5", 3)

        with self.assertRaises(TypeError):
            Calculator.add(5, "3")

        with self.assertRaises(TypeError):
            Calculator.add([1, 2], 3)

        with self.assertRaises(TypeError):
            Calculator.add(None, 3)

    def test_subtract_with_invalid_types(self):
        """
        Test that subtract() raises TypeError for non-numeric inputs.
        """
        with self.assertRaises(TypeError):
            Calculator.subtract("5", 3)

        with self.assertRaises(TypeError):
            Calculator.subtract(5, "3")

        with self.assertRaises(TypeError):
            Calculator.subtract(None, 3)

    def test_multiply_with_invalid_types(self):
        """
        Test that multiply() raises TypeError for non-numeric inputs.
        """
        with self.assertRaises(TypeError):
            Calculator.multiply("5", 3)

        with self.assertRaises(TypeError):
            Calculator.multiply(5, "3")

        with self.assertRaises(TypeError):
            Calculator.multiply([], 3)

    def test_divide_with_invalid_types(self):
        """
        Test that divide() raises TypeError for non-numeric inputs.
        """
        with self.assertRaises(TypeError):
            Calculator.divide("5", 3)

        with self.assertRaises(TypeError):
            Calculator.divide(5, "3")

        with self.assertRaises(TypeError):
            Calculator.divide({}, 3)

    # ==================== BOOLEAN AND SPECIAL TYPE TESTS ====================

    def test_operations_with_booleans(self):
        """
        Test operations with boolean values (True=1, False=0 in Python).
        """
        # In Python, bool is a subclass of int, so these should work
        self.assertEqual(Calculator.add(True, False), 1)
        self.assertEqual(Calculator.multiply(True, 5), 5)
        self.assertEqual(Calculator.multiply(False, 5), 0)
        self.assertEqual(Calculator.divide(True, True), 1)

    def test_operations_with_complex_numbers(self):
        """
        Test operations with complex numbers.
        """
        complex_num1 = complex(2, 3)
        complex_num2 = complex(1, 1)

        result = Calculator.add(complex_num1, complex_num2)
        self.assertEqual(result, complex(3, 4))

        result = Calculator.multiply(complex_num1, 2)
        self.assertEqual(result, complex(4, 6))

    # ==================== COMPREHENSIVE PROPERTY-BASED TESTS ====================

    def test_commutative_property_addition(self):
        """
        Test that addition is commutative (a + b = b + a).
        """
        test_cases = [
            (5, 3),
            (-5, 3),
            (2.5, 3.7),
            (-2.5, 3.7),
            (0, 5),
            (10**12, 10**6)
        ]

        for a, b in test_cases:
            with self.subTest(a=a, b=b):
                result1 = Calculator.add(a, b)
                result2 = Calculator.add(b, a)
                self.assertEqual(result1, result2)

    def test_associative_property_addition(self):
        """
        Test that addition is associative (a + (b + c) = (a + b) + c).
        """
        test_cases = [
            (1, 2, 3),
            (1.5, 2.5, 3.5),
            (-1, 2, -3),
            (0, 5, 10)
        ]

        for a, b, c in test_cases:
            with self.subTest(a=a, b=b, c=c):
                result1 = Calculator.add(a, Calculator.add(b, c))
                result2 = Calculator.add(Calculator.add(a, b), c)
                self.assertAlmostEqual(result1, result2, places=7)

    def test_identity_property(self):
        """
        Test identity properties for basic operations.
        """
        # Addition identity: a + 0 = a
        test_values = [5, -3, 2.5, 0, 10**6]
        for value in test_values:
            with self.subTest(value=value):
                self.assertEqual(Calculator.add(value, 0), value)
                self.assertEqual(Calculator.add(0, value), value)

        # Multiplication identity: a * 1 = a
        for value in test_values:
            with self.subTest(value=value):
                self.assertEqual(Calculator.multiply(value, 1), value)
                self.assertEqual(Calculator.multiply(1, value), value)

    def test_inverse_property(self):
        """
        Test inverse properties for basic operations.
        """
        # Additive inverse: a + (-a) = 0
        test_values = [5, -3, 2.5, 10**6]
        for value in test_values:
            with self.subTest(value=value):
                result = Calculator.add(value, -value)
                self.assertAlmostEqual(result, 0, places=7)

        # Multiplicative inverse: a * (1/a) = 1 (for non-zero a)
        for value in [1, 2, 0.5, 10, -1, -2]:
            with self.subTest(value=value):
                if value != 0:
                    result = Calculator.multiply(value, 1/value)
                    self.assertAlmostEqual(result, 1, places=7)

    def test_distributive_property(self):
        """
        Test distributive property: a * (b + c) = a * b + a * c.
        """
        test_cases = [
            (2, 3, 4),
            (1.5, 2.5, 3.5),
            (-2, 3, -4),
            (0, 5, 10)
        ]

        for a, b, c in test_cases:
            with self.subTest(a=a, b=b, c=c):
                result1 = Calculator.multiply(a, Calculator.add(b, c))
                result2 = Calculator.add(Calculator.multiply(a, b), Calculator.multiply(a, c))
                self.assertAlmostEqual(result1, result2, places=7)


if __name__ == '__main__':
    # Run the tests with verbose output
    unittest.main(verbosity=2)