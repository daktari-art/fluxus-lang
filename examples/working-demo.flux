# WORKING DEMO - Using only available operators

# Simple stream transformations
~ "hello world" 
| to_upper 
| print()

~ "  spaced  " 
| trim 
| print()

~ 25 
| add(17) 
| print()

~ 3.14 
| multiply(2) 
| print()

~ "fluxus" 
| capitalize 
| print()

# Working with arrays
~ [1, 2, 3, 4, 5]
| map { x -> multiply(x, 2) }
| print()

~ [10, 20, 30, 40]
| filter { x -> greater_than(x, 25) }
| print()

~ [1, 2, 3, 4]
| reduce { acc, x -> add(acc, x) }
| print()
