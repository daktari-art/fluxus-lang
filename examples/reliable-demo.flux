# RELIABLE DEMO - Using only verified working operators

# String operations
~ "hello world" 
| to_upper 
| print()

~ "  spaced  " 
| trim 
| print()

~ "FLUXUS" 
| to_lower 
| print()

# Math operations
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

~ 4 
| pow(2) 
| print()

# Array operations (basic)
~ [1, 2, 3, 4, 5]
| map { x -> multiply(x, 2) }
| print()

~ [1, 2, 3, 4]
| reduce { acc, x -> add(acc, x) }
| print()
