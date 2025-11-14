# COMPREHENSIVE WORKING DEMO - All operators used correctly

# === STRING OPERATIONS ===
~ "hello world" | to_upper | print()
~ "  spaced  " | trim | print()
~ "FLUXUS" | to_lower | print()
~ "fluxus" | capitalize | print()
~ "hello" | reverse | print()
~ "hello world" | replace("world", "fluxus") | print()
~ "hello world" | substring(0, 5) | print()
~ "hello" | contains("ell") | print()
~ "hello" | starts_with("he") | print()
~ "hello" | ends_with("lo") | print()
~ "line1\nline2" | split_lines | print()
~ "hi" | repeat(3) | print()
~ "test" | encode_base64 | print()
~ "dGVzdA==" | decode_base64 | print()
~ "hello" | length | print()

# === MATH OPERATIONS (with proper inputs) ===
~ 25 | add(17) | print()
~ 10 | subtract(3) | print()
~ 3.14 | multiply(2) | print()
~ 15 | divide(3) | print()
~ 2 | pow(3) | print()
~ 64 | sqrt | print()
~ 2.718 | log | print()
~ 1 | exp | print()
~ -5 | abs | print()
~ 3.7 | floor | print()
~ 3.2 | ceil | print()
~ 3.5 | round | print()
~ 100 | random | print()

# Math operations that need arrays
~ [10, 20, 30] | max | print()
~ [10, 20, 30] | min | print()
~ [1, 2, 3, 4, 5] | mean | print()
~ [1, 2, 3, 4, 5] | sum | print()
~ [1, 2, 3, 4, 5] | median | print()

# === ARRAY OPERATIONS ===
~ [1, 2, 3] | map { x -> multiply(x, 2) } | print()
~ [1, 2, 3, 4] | reduce { acc, x -> add(acc, x) } | print()
~ [1, 2, 3, 4, 5] | filter { x -> greater_than(x, 2) } | print()

# === TRIGONOMETRY ===
~ 0 | sin | print()
~ 0 | cos | print()
~ 0 | tan | print()

# === CHAINED OPERATIONS ===
~ 2 | add(3) | multiply(4) | subtract(5) | print()
