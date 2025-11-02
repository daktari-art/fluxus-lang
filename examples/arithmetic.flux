# FILENAME: examples/arithmetic.flux
# 
# Demonstrates fundamental stream initialization, chaining, and N-ary operation handling,
# proving the core functional integrity of the Fluxus engine.

# === 1. BASIC ADDITION ===
# A simple stream: 5 flows into the add operator with argument 3.
~ 5 | add(3) | print()
# Output: 8


# === 2. SEQUENTIAL TRANSFORMATION CHAIN ===
# Data flows through multiple pure operators sequentially.
~ 10 

| multiply(4)  # 10 * 4 = 40
| subtract(15) # 40 - 15 = 25
| print()
# Output: 25


# === 3. N-ARY OPERATION (Chained Subtraction) ===
# This demonstrates the fixed logic for multi-argument operations:
# The first value starts the stream (100), and all subsequent arguments are subtracted sequentially.
~ 100 | subtract(10, 5) | print() 
# Output: 85 (100 - 10 - 5)


# === 4. COLLECTION PROCESSING (ITERATION and REDUCTION) ===
# The list is streamed, and operators run on each item before the final reduction.
~ [1, 2, 3] 

| map {.value | multiply(10) } # Stream emits: 10, then 20, then 30
| reduce { + }                   # Sums the entire stream result
| print()
# Output: 60


# === 5. CONDITIONAL MATH (SPLIT OPERATOR) ===
# Shows how conditional branching works, which replaces traditional 'if/else' statements.
let input_val = ~ 50 
input_val | split {.value > 40 } # Condition is TRUE

| TRUE_FLOW # Executed if the value is > 40
| map {.value | subtract(10) } # 50 - 10 = 40
| print('TRUE: ')

| FALSE_FLOW # Executed if the value is <= 40
| map {.value | add(10) }
| print('FALSE: ')
# Output: TRUE: 40
