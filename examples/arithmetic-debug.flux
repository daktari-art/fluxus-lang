# FILENAME: examples/arithmetic-debug.flux
# 
# Debug version with step-by-step output

# === 1. BASIC ADDITION ===
~ 5 | add(3) | print()
# Expected: 8


# === 2. SEQUENTIAL TRANSFORMATION CHAIN ===
~ 10 
| multiply(4)  # 10 * 4 = 40
| subtract(15) # 40 - 15 = 25
| print()
# Expected: 25


# === 3. N-ARY OPERATION (Chained Subtraction) ===
~ 100 | subtract(10, 5) | print() 
# Expected: 85 (100 - 10 - 5)


# === 4. COLLECTION PROCESSING (ITERATION and REDUCTION) ===
# Let's debug this step by step
~ [1, 2, 3] | print("Original array: ")

~ [1, 2, 3] 
| map {.value | multiply(10) } | print("After map: ")
# Expected: [10, 20, 30]

~ [1, 2, 3] 
| map {.value | multiply(10) } 
| reduce { + } | print("After reduce: ")
# Expected: 60

# Debug individual steps
~ 1 | multiply(10) | print("Element 1 mapped: ")
~ 2 | multiply(10) | print("Element 2 mapped: ")  
~ 3 | multiply(10) | print("Element 3 mapped: ")

# Test reduce separately
~ [10, 20, 30] | reduce { + } | print("Reduce test: ")


# === 5. CONDITIONAL MATH (SPLIT OPERATOR) ===
let input_val = ~ 50 
input_val | split {.value > 40 } 

| TRUE_FLOW 
| map {.value | subtract(10) } | print('TRUE: ')

| FALSE_FLOW 
| map {.value | add(10) } | print('FALSE: ')
