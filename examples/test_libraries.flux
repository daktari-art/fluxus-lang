# FILENAME: examples/test_libraries.flux
# Test library system with CONFIRMED operators

FLOW math
FLOW time

# Test CONFIRMED math operators
~ 5 | sin() | print("Sine of 5: ")
~ 25 | sqrt() | print("Square root: ")

# Test CONFIRMED time operators  
~ timestamp() | format_time("local") | print("Current time: ")

# Test CONFIRMED string operators
~ "  hello world  " | trim() | to_upper() | print("Trimmed and upper: ")

# Test basic array
~ [1,2,3,4,5] | print("Array: ")
