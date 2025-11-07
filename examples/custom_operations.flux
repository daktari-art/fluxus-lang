# Test custom operations with enhanced parser
OPERATION double() { return .value * 2 }
OPERATION add_five() { return .value + 5 }

let result = <|> 0

~ 10 | double() | add_five() | to_pool(result)
result -> print('Result: ' | concat(.value))
