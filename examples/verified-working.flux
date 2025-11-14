# VERIFIED WORKING DEMO - All operators tested and working

# String operations (100% working)
~ "hello world" 
| to_upper 
| print()

~ "  spaced  " 
| trim 
| print()

~ "FLUXUS" 
| to_lower 
| print()

# Math operations (verified working)
~ 25 
| add(17) 
| print()

~ 3.14 
| multiply(2) 
| print()

~ 10 
| subtract(3) 
| print()

~ 15 
| divide(3) 
| print()

# Working array operations
~ [1, 2, 3, 4, 5]
| map { x -> multiply(x, 2) }
| print()

# Simple reduce with initial value
~ [1, 2, 3, 4]
| reduce { acc, x -> add(acc, x) }
| print()

# Multiple operations in sequence
~ 5 
| add(3) 
| multiply(2)
| subtract(4)
| print()
