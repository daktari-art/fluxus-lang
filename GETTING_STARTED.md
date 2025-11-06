# 🚀 Getting Started with Fluxus Language v4.0

This guide is designed to get you writing non-blocking, reactive programs immediately. Fluxus is simple: **everything is a stream that either ends or lives forever.**

### Installation

```bash
# Install globally (Assumes you have Node.js 18+ installed)
npm install -g @fluxus-lang/core

# Verify installation
fluxus --version
# Output: 🌊 Fluxus Language v4.0.0

Day 1: Streams and Pipes (The Data Flow)
On Day 1, you learn the ~ (Source), | (Pipe), and {} (Lens) symbols.
1. Simple Data Transformation
Define a single value stream and pipe it through a chain of transformations.
# FILENAME: day1_pipeline.flux

# 1. Start a finite stream with the value " hello world "
~ " hello world " 

# 2. Pipe to the 'trim' operator to remove whitespace
| trim() 

# 3. Pipe to the 'to_upper' operator
| to_upper() 

# 4. Pipe to a Lens to append an exclamation mark
| map { .value | concat("!") } 

# 5. Sink the final result to the console
| print()

# EXPECTED OUTPUT: HELLO WORLD!

2. Multi-Value Streams
The ~ source can initiate a stream of multiple values, which will be processed sequentially.
# FILENAME: day1_list.flux
~ [10, 20, 30] 
| map { .value | multiply(2) } # Doubles each number (10->20, 20->40, 30->60)
| filter { .value > 40 }       # Only the result 60 passes the filter
| print()

# EXPECTED OUTPUT: 60

Day 2: Reactivity and State (Tidal Pools)
On Day 2, you introduce the Live Stream (~?) and the Tidal Pool (<|>) to build a responsive counter.
1. Declaring and Subscribing to State
The Tidal Pool is the only mutable variable. Anything reading it becomes a subscriber that reruns when the pool is updated.
# FILENAME: day2_counter.flux

# 1. Declare the mutable state pool with an initial value of 0.
let count = <|> 0 

# 2. Start a Live Stream on the button click event.
~? ui_events('button#clicker', 'click') 

# 3. Logic: Read the *current* count, add 1, and commit the new value.
# The 'count -> add(1)' expression reads the pool's value at the time of the click.
| map { count -> add(1) }
| to_pool(count) # This updates the 'count' pool

# 4. Reactive Sink: This flow automatically re-runs every time the 'count' pool is updated.
count -> print() # Displays the updated counter value.

# EXECUTION: 
# - Program runs: prints 0 (initial state)
# - User clicks: prints 1
# - User clicks: prints 2

Day 3: Control Flow and Asynchronicity
On Day 3, you combine inputs and handle real-world complexity without blocking the flow.
1. Combining Inputs (combine_latest)
This operator is essential for forms, ensuring an action (like a button click) uses the most recent data from other streams (like form fields).
# Imports the UI library
FLOW ui 

let username_pool = <|> ""
let password_pool = <|> ""

# Live stream: Updates the username pool as the user types
~? ui_events('input#user', 'value') | to_pool(username_pool) 
# Live stream: Updates the password pool as the user types
~? ui_events('input#pass', 'value') | to_pool(password_pool) 

# Core Stream: Triggered by the button click
~? ui_events('button#login', 'click') 
| combine_latest(username_pool, password_pool) # Event now carries { username, password }
| print()

2. Asynchronous Branching (split)
Use split to manage success and failure paths, such as network calls.
# Imports the Network library
FLOW network

# Assume login_stream carries the API response { status_code: 200, body: {...} }
~ login_stream 
| split { .status_code == 200 } 

# If the condition is TRUE (HTTP 200)
| TRUE_FLOW 
| map { .body | to_object } 
| print_success()

# If the condition is FALSE (Error code)
| FALSE_FLOW 
| print_error()

🛠️ Next Steps
 * Explore examples/: Run the login.flux example to see the full architecture in action.
 * Reference: Check the SPECIFICATION.md for a complete list of built-in operators and syntax rules.

