# FILENAME: examples/tidal_test.flux
# Tidal Pool Test for Fluxus v4.0

# 1. Basic Tidal Pool Declaration
let counter = <|> 0

# 2. Stream that updates the pool
~ 5 | add(10) | to_pool(counter)

# 3. Stream that reads from the pool
counter -> print()

# 4. Multiple updates to same pool
~ 25 | multiply(2) | to_pool(counter)

# 5. Complex pool with arrays
let items = <|> [1, 2, 3]
~ "apple,banana,cherry" | break(",") | to_pool(items)
items -> print()

# 6. Pool with object state
let user = <|> { name: "guest", logged_in: false }
~ { name: "fluxus_user", logged_in: true } | to_pool(user)
user -> print()
