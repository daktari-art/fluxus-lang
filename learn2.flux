# learn2.flux - Stream operations
# Source -> Transform -> Sink

# 1. Simple source to sink
~ "apple" | print()

# 2. Transform the data before printing
~ "banana" | uppercase() | print()

# 3. Multiple transformations
~ "hello world" | uppercase() | reverse() | print()

