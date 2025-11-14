# discover.flux - See what operators work
~ "test" | print()
~ 123 | print() 
~ [1,2,3] | print()

# Math discovery
~ 5 | add(2) | print()
~ 10 | subtract(3) | print()

# String discovery  
~ "hello" | uppercase() | print()
~ "  spaces  " | trim() | print()

# Array discovery
~ [1,2,3] | length() | print()
~ [1,2,3] | sum() | print()
