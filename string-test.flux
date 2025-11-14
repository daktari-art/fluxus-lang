# string-test.flux - Testing string capabilities
~ "hello" | uppercase() | print()      # HELLO
~ "WORLD" | lowercase() | print()      # world
~ "fluxus" | capitalize() | print()    # Fluxus

# Multiple string transforms
~ " hello world " | trim() | uppercase() | print()  # HELLO WORLD
