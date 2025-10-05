# Top 5 Most Common Runtime Errors in Python Applications

This comprehensive analysis covers the most frequent runtime errors encountered in Python applications, including their causes, symptoms, debugging strategies, and prevention techniques.

---

## 1. TypeError: Mismatched Data Types

### Causes
- Attempting operations between incompatible data types
- Passing wrong argument types to functions
- Implicit type conversion failures
- Incorrect method calls on objects

### Common Symptoms
- `TypeError: unsupported operand type(s) for +: 'int' and 'str'`
- `TypeError: 'str' object is not callable`
- `TypeError: list indices must be integers or slices, not str`

### Code Examples

**Example 1: Operand Type Mismatch**
```python
def calculate_total(price, tax_rate):
    return price + (price * tax_rate)  # Error if price is string

# Problematic usage
result = calculate_total("100", 0.08)  # TypeError
```

**Example 2: Incorrect Method Call**
```python
def process_data(data):
    if data.isnumeric():  # Error if data is not string
        return int(data) * 2

# Problematic usage
result = process_data(123)  # TypeError: 'int' object has no attribute 'isnumeric'
```

### Debugging Strategies
1. **Type Checking with `type()` and `isinstance()`**:
   ```python
   def safe_operation(a, b):
       if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
           raise TypeError("Both arguments must be numeric")
       return a + b
   ```

2. **Use `try-except` blocks for graceful handling**:
   ```python
   def robust_calculate_total(price, tax_rate):
       try:
           return float(price) + (float(price) * float(tax_rate))
       except (TypeError, ValueError) as e:
           print(f"Conversion error: {e}")
           return None
   ```

3. **Leverage `logging` for detailed error information**:
   ```python
   import logging

   def debug_operation(data):
       logging.info(f"Operating on data of type: {type(data)}")
       return data.upper()  # Will fail if data is not string
   ```

### Prevention Best Practices
- **Use type hints** (Python 3.5+):
  ```python
  def calculate_total(price: float, tax_rate: float) -> float:
      return price + (price * tax_rate)
  ```
- **Validate input parameters** at function entry points
- **Use static type checkers** like `mypy` or `pyright`
- **Document expected types** in docstrings

---

## 2. AttributeError: Missing Attributes or Methods

### Causes
- Calling methods that don't exist on an object
- Accessing attributes that haven't been defined
- Object is None when expecting a different type
- Module import issues

### Common Symptoms
- `AttributeError: 'NoneType' object has no attribute 'method_name'`
- `AttributeError: 'module' object has no attribute 'function'`
- `AttributeError: 'dict' object has no attribute 'append'`

### Code Examples

**Example 1: None Object Access**
```python
def get_user_name(user_id):
    user = find_user(user_id)  # Returns None if not found
    return user.name  # AttributeError if user is None

def find_user(user_id):
    # Simulating user not found
    return None
```

**Example 2: Wrong Method Call**
```python
def process_items(items):
    for item in items:
        item.add_to_cart()  # Error if item doesn't have this method

# Problematic usage
process_items([1, 2, 3])  # integers don't have add_to_cart method
```

### Debugging Strategies
1. **Check for None before accessing attributes**:
   ```python
   def safe_get_user_name(user_id):
       user = find_user(user_id)
       if user is not None:
           return user.name
       return "User not found"
   ```

2. **Use `hasattr()` to check attribute existence**:
   ```python
   def safe_process_items(items):
       for item in items:
           if hasattr(item, 'add_to_cart'):
               item.add_to_cart()
           else:
               print(f"Item {item} doesn't support add_to_cart")
   ```

3. **Debug with `dir()` to inspect available attributes**:
   ```python
   def debug_object(obj):
       print(f"Object type: {type(obj)}")
       print(f"Available attributes: {dir(obj)}")
       return obj
   ```

### Prevention Best Practices
- **Initialize object attributes** in `__init__` methods
- **Use property decorators** with validation
- **Implement `__getattr__` for dynamic attribute access**
- **Write unit tests** for object interactions

---

## 3. KeyError: Dictionary Access Issues

### Causes
- Accessing dictionary keys that don't exist
- Case-sensitive key mismatches
- Using wrong data types as keys
- Nested dictionary access without checking intermediate keys

### Common Symptoms
- `KeyError: 'missing_key'`
- `KeyError: 0` (when expecting string keys)
- Cascading failures in nested dictionary operations

### Code Examples

**Example 1: Direct Key Access**
```python
def get_user_info(user_data, user_id):
    return user_data[user_id]  # KeyError if user_id doesn't exist

# Problematic usage
users = {"1": {"name": "Alice"}, "2": {"name": "Bob"}}
result = get_user_info(users, "3")  # KeyError
```

**Example 2: Nested Dictionary Access**
```python
def extract_nested_value(data, outer_key, inner_key):
    return data[outer_key][inner_key]  # Multiple potential KeyError points

# Problematic usage
config = {"database": {"host": "localhost"}}
result = extract_nested_value(config, "cache", "redis")  # KeyError
```

### Debugging Strategies
1. **Use `.get()` method with default values**:
   ```python
   def safe_get_user_info(user_data, user_id):
       return user_data.get(user_id, {"name": "Unknown"})
   ```

2. **Check key existence before access**:
   ```python
   def safe_nested_access(data, outer_key, inner_key):
       if outer_key in data and inner_key in data[outer_key]:
           return data[outer_key][inner_key]
       return None
   ```

3. **Use `try-except` with specific error handling**:
   ```python
   def robust_extract(data, keys):
       current = data
       for key in keys:
           try:
               current = current[key]
           except KeyError:
               print(f"Missing key: {key}")
               return None
           except TypeError:
               print(f"Cannot index {type(current)} with key {key}")
               return None
       return current
   ```

4. **Debug with dictionary introspection**:
   ```python
   def debug_dict_access(d, key):
       print(f"Available keys: {list(d.keys())}")
       print(f"Looking for key: {repr(key)}")
       print(f"Key types in dict: {[type(k) for k in d.keys()]}")
       return d.get(key, "KEY_NOT_FOUND")
   ```

### Prevention Best Practices
- **Use defaultdict** from collections module
- **Create wrapper functions** for common access patterns
- **Validate dictionary structure** before processing
- **Use dataclasses** or Pydantic models for structured data

```python
from collections import defaultdict
from dataclasses import dataclass

@dataclass
class UserInfo:
    name: str
    email: str = "unknown@example.com"

def safe_user_dict():
    return defaultdict(lambda: UserInfo("Unknown"))
```

---

## 4. IndexError: List/Sequence Access Issues

### Causes
- Accessing indices that are out of bounds
- Off-by-one errors in loops
- Empty sequence access
- Negative indexing misunderstandings

### Common Symptoms
- `IndexError: list index out of range`
- `IndexError: string index out of range`
- `IndexError: tuple index out of range`

### Code Examples

**Example 1: Direct Index Access**
```python
def get_nth_element(items, n):
    return items[n]  # IndexError if n >= len(items)

# Problematic usage
numbers = [1, 2, 3]
result = get_nth_element(numbers, 5)  # IndexError
```

**Example 2: Loop Boundary Issues**
```python
def process_pairs(items):
    result = []
    for i in range(len(items) + 1):  # Off-by-one error
        if i < len(items):
            result.append(items[i] + items[i+1])  # IndexError on last iteration
    return result
```

**Example 3: Empty Sequence Handling**
```python
def get_last_item(sequence):
    return sequence[-1]  # IndexError if sequence is empty

# Problematic usage
empty_list = []
result = get_last_item(empty_list)  # IndexError
```

### Debugging Strategies
1. **Validate index bounds before access**:
   ```python
   def safe_get_nth_element(items, n):
       if 0 <= n < len(items):
           return items[n]
       raise IndexError(f"Index {n} out of range for sequence of length {len(items)}")
   ```

2. **Use slicing with bounds checking**:
   ```python
   def safe_get_range(items, start, end):
       length = len(items)
       safe_start = max(0, min(start, length))
       safe_end = max(0, min(end, length))
       return items[safe_start:safe_end]
   ```

3. **Debug with detailed logging**:
   ```python
   def debug_sequence_access(seq, index):
       print(f"Sequence length: {len(seq)}")
       print(f"Requested index: {index}")
       print(f"Index valid: {0 <= index < len(seq)}")
       if len(seq) > 0:
           print(f"First item: {seq[0]}")
           print(f"Last item: {seq[-1]}")
       return seq[index] if 0 <= index < len(seq) else None
   ```

4. **Use enumerate for safe iteration**:
   ```python
   def safe_process_pairs(items):
       result = []
       for i, item in enumerate(items[:-1]):  # Automatically bounds-checked
           result.append(item + items[i+1])
       return result
   ```

### Prevention Best Practices
- **Use list comprehensions** instead of manual indexing when possible
- **Implement defensive programming** with input validation
- **Use `try-except` blocks** around index operations
- **Consider using `collections.deque`** for queue-like operations
- **Add assertions** for development-time checks

```python
def defensive_index_access(items, index):
    assert isinstance(items, (list, tuple, str)), "Expected sequence type"
    assert isinstance(index, int), "Expected integer index"
    assert 0 <= index < len(items), f"Index {index} out of bounds"
    return items[index]
```

---

## 5. ValueError: Invalid Function Arguments

### Causes
- Passing values with correct type but invalid content
- Invalid string-to-number conversions
- Range violations
- Format mismatches

### Common Symptoms
- `ValueError: invalid literal for int() with base 10`
- `ValueError: math domain error`
- `ValueError: could not convert string to float`

### Code Examples

**Example 1: String to Number Conversion**
```python
def calculate_age(birth_year_str):
    current_year = 2024
    birth_year = int(birth_year_str)  # ValueError for non-numeric strings
    return current_year - birth_year

# Problematic usage
age = calculate_age("twenty")  # ValueError
```

**Example 2: Mathematical Domain Errors**
```python
def calculate_sqrt(value):
    import math
    return math.sqrt(value)  # ValueError for negative numbers

# Problematic usage
result = calculate_sqrt(-4)  # ValueError: math domain error
```

**Example 3: Invalid Enum Values**
```python
def set_status(status):
    valid_statuses = ["active", "inactive", "pending"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status: {status}")
    return f"Status set to {status}"

# Problematic usage
result = set_status("unknown")  # ValueError
```

### Debugging Strategies
1. **Use `try-except` with specific error messages**:
   ```python
   def safe_calculate_age(birth_year_str):
       try:
           birth_year = int(birth_year_str)
           return 2024 - birth_year
       except ValueError as e:
           print(f"Invalid birth year '{birth_year_str}': {e}")
           return None
   ```

2. **Validate input before conversion**:
   ```python
   def safe_int_conversion(value):
       if isinstance(value, str) and value.isdigit():
           return int(value)
       elif isinstance(value, (int, float)):
           return int(value)
       else:
           raise ValueError(f"Cannot convert {value} to integer")
   ```

3. **Use regular expressions for pattern validation**:
   ```python
   import re

   def validate_numeric_string(s):
       pattern = r'^-?\d+$'
       return bool(re.match(pattern, s))

   def safe_int_from_string(s):
       if validate_numeric_string(s):
           return int(s)
       raise ValueError(f"'{s}' is not a valid integer string")
   ```

4. **Implement comprehensive input validation**:
   ```python
   def robust_sqrt(value):
       import math
       if not isinstance(value, (int, float)):
           raise ValueError(f"Expected numeric value, got {type(value)}")
       if value < 0:
           raise ValueError(f"Cannot calculate square root of negative number: {value}")
       return math.sqrt(value)
   ```

### Prevention Best Practices
- **Use schema validation** libraries like Pydantic or marshmallow
- **Implement input sanitization** functions
- **Use type hints with validation decorators**
- **Create custom exception classes** for domain-specific errors
- **Document valid input ranges** in function docstrings

```python
from typing import Union, Optional
import re

def validate_input(func):
    def wrapper(*args, **kwargs):
        # Add validation logic based on function annotations
        return func(*args, **kwargs)
    return wrapper

@validate_input
def safe_percentage(part: Union[int, float], whole: Union[int, float]) -> Optional[float]:
    if whole == 0:
        raise ValueError("Cannot calculate percentage with zero denominator")
    if not isinstance(part, (int, float)) or not isinstance(whole, (int, float)):
        raise ValueError("Both arguments must be numeric")
    return (part / whole) * 100
```

---

## General Debugging and Prevention Strategies

### Comprehensive Error Handling Framework

```python
import logging
import traceback
from functools import wraps
from typing import Any, Callable, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def handle_errors(error_types: tuple = (Exception,),
                 default_return: Any = None,
                 log_errors: bool = True):
    """
    Decorator for comprehensive error handling
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except error_types as e:
                if log_errors:
                    logger.error(f"Error in {func.__name__}: {str(e)}")
                    logger.debug(f"Traceback: {traceback.format_exc()}")
                return default_return
        return wrapper
    return decorator

# Usage examples
@handle_errors((TypeError, ValueError), default_return=0)
def safe_divide(a: float, b: float) -> float:
    return a / b

@handle_errors((KeyError, IndexError), default_return=None)
def safe_nested_access(data: dict, keys: list) -> Any:
    current = data
    for key in keys:
        current = current[key]
    return current
```

### Defensive Programming Checklist

1. **Input Validation**
   - Check types and ranges
   - Validate string patterns
   - Handle edge cases (empty, None, zero)

2. **Error Propagation**
   - Use specific exception types
   - Preserve original error context
   - Provide meaningful error messages

3. **Logging and Monitoring**
   - Log errors with context
   - Monitor error rates
   - Set up alerts for critical errors

4. **Testing Strategy**
   - Write unit tests for error cases
   - Use property-based testing
   - Test boundary conditions

5. **Documentation**
   - Document expected inputs and outputs
   - Include error conditions in docstrings
   - Provide usage examples

### Best Practices Summary

1. **Always validate inputs** before processing
2. **Use specific exception types** rather than generic `Exception`
3. **Implement proper logging** for debugging and monitoring
4. **Write comprehensive tests** including edge cases
5. **Use type hints** and static analysis tools
6. **Apply the EAFP principle** (Easier to Ask for Forgiveness than Permission) when appropriate
7. **Create custom exception classes** for domain-specific errors
8. **Implement retry mechanisms** for transient errors
9. **Use circuit breakers** for external service calls
10. **Document error handling strategies** in code and documentation

By understanding these common runtime errors and implementing robust error handling strategies, you can build more reliable and maintainable Python applications.