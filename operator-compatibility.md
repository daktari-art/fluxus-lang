# Fluxus Operator Compatibility

## ✅ VERIFIED WORKING OPERATORS:

### String Operations:
- `print()` - Outputs to console
- `to_upper()` - Converts to uppercase  
- `to_lower()` - Converts to lowercase
- `trim()` - Removes whitespace

### Math Operations:
- `add(n)` - Addition
- `subtract(n)` - Subtraction
- `multiply(n)` - Multiplication
- `divide(n)` - Division
- `pow(n)` - Power

### Array Operations:
- `map { expression }` - Transform array elements
- `reduce { expression }` - Reduce array to single value

## ❌ BROKEN/NOT IMPLEMENTED:
- `capitalize()` - Listed but not implemented
- `filter` - Syntax issues
- Pool reactive syntax (`pool -> .value`)

## USAGE PATTERNS:
```flux
~ "text" | to_upper() | print()
~ 5 | add(3) | print()  
~ [1,2,3] | map { x -> multiply(x, 2) } | print()
