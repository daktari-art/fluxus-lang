# learn3.flux - Multiple values in streams
# Using arrays as sources

~ [1, 2, 3, 4, 5] | print()

# Process each number
~ [10, 20, 30] | multiply(2) | print()

# String array
~ ["alice", "bob", "charlie"] | uppercase() | print()
