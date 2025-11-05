# Array Processing
~ [1, 2, 3, 4, 5] 
| map {.value | multiply(2)} 
| filter {.value > 5} 
| print()