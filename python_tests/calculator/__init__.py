"""
Simple Calculator Module

A basic calculator that can add, subtract, multiply, and divide two numbers.
This module demonstrates proper error handling and type checking.
"""

class Calculator:
    """
    A simple calculator class that performs basic arithmetic operations.
    """

    @staticmethod
    def add(a, b):
        """
        Add two numbers together.

        Args:
            a: First number (int or float)
            b: Second number (int or float)

        Returns:
            Sum of a and b

        Raises:
            TypeError: If inputs are not numbers
        """
        if not isinstance(a, (int, float, complex)) or not isinstance(b, (int, float, complex)):
            raise TypeError("Both inputs must be numbers")
        return a + b

    @staticmethod
    def subtract(a, b):
        """
        Subtract second number from first number.

        Args:
            a: First number (int or float)
            b: Second number (int or float)

        Returns:
            Difference of a and b (a - b)

        Raises:
            TypeError: If inputs are not numbers
        """
        if not isinstance(a, (int, float, complex)) or not isinstance(b, (int, float, complex)):
            raise TypeError("Both inputs must be numbers")
        return a - b

    @staticmethod
    def multiply(a, b):
        """
        Multiply two numbers.

        Args:
            a: First number (int or float)
            b: Second number (int or float)

        Returns:
            Product of a and b

        Raises:
            TypeError: If inputs are not numbers
        """
        if not isinstance(a, (int, float, complex)) or not isinstance(b, (int, float, complex)):
            raise TypeError("Both inputs must be numbers")
        return a * b

    @staticmethod
    def divide(a, b):
        """
        Divide first number by second number.

        Args:
            a: Numerator (int or float)
            b: Denominator (int or float)

        Returns:
            Quotient of a and b

        Raises:
            TypeError: If inputs are not numbers
            ZeroDivisionError: If denominator is zero
        """
        if not isinstance(a, (int, float, complex)) or not isinstance(b, (int, float, complex)):
            raise TypeError("Both inputs must be numbers")
        if b == 0:
            raise ZeroDivisionError("Cannot divide by zero")
        return a / b