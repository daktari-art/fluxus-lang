# FILENAME: examples/hello.flux
# 
# The minimal "Hello World" program.
# Demonstrates the simplest, single-pass stream flow: Source -> Sink.

# 1. Source: Start a stream with a string literal value.
~ "Hello, Fluxus World!" 

# 2. Sink: Pipe the stream value directly to the print operator.

| print()

# EXPECTED CONSOLE OUTPUT: Hello, Fluxus World!


# Example 2: Simple numerical stream
~ 2025 | print()
# EXPECTED CONSOLE OUTPUT: 2025
