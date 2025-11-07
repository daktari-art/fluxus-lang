# FILENAME: examples/login.flux
# 
# Demonstrates a full, non-blocking, asynchronous login flow in Fluxus.
# Key Concepts: Live Streams (~?), Tidal Pools (<|>), Asynchronous Operators, and Split/Branching.

# === 1. FLOW IMPORTS: Required External Libraries ===
FLOW ui       # Provides streams for user interactions (e.g., ui_events)
FLOW network  # Provides asynchronous communication (e.g., fetch_url)
FLOW crypto   # Provides security functions (e.g., hash_sha256)


# === 2. STATE MANAGEMENT: The Auth Tidal Pool (<|>) ===
# The central source of truth for the application's authentication state.
let auth_state = <|> { status: 'logged_out', user: null, token: null, error: null }


# === 3. HELPER POOLS: Live Form Data ===
# Stores the current value of input fields as the user types.
# FIX: Explicitly declare helper pools for the parser to find them.
let username_pool = <|> "" 
let password_pool = <|> ""
~? ui_events('input#username', 'value') | to_pool(username_pool) 
~? ui_events('input#password', 'value') | to_pool(password_pool) 


# === 4. THE CORE REACTIVE PIPELINE (Triggered by Click) ===
# The stream starts only when the login button is clicked.
~? ui_events('button#login', 'click') 

# 4a. Combine Click with Latest Form Values
| combine_latest(username_pool, password_pool)
# Output stream: { click_event, username: "...", password: "..." }

# 4b. Security Transformation: Hash the password locally
| map { data -> { 
    username: data.username, 
    # Use the imported crypto operator
    password_hash: data.password | hash_sha256 
} } 

# 4c. Asynchronous Network Call (The stream manages the promise)
| fetch_url('https://api.auth.com/login', method: 'POST', body: .value) 

# 4d. Conditional Branching based on HTTP Status Code
| split { .status_code == 200 } 


# === 5. SUCCESS FLOW (The TRUE_FLOW branch) ===
| TRUE_FLOW 
# Transform the API response body into the final SUCCESS state
| map { response -> { 
    status: 'logged_in', 
    user: response.body.user_data, 
    token: response.body.session_token, 
    error: null 
} } 
| to_pool(auth_state) # Commit the successful state


# === 6. FAILURE FLOW (The FALSE_FLOW branch) ===
| FALSE_FLOW 
# Transform the API response body into an ERROR state
| map { response -> { 
    status: 'error', 
    user: null, 
    token: null, 
    error: response.body.message 
} }
| to_pool(auth_state) # Commit the error state


# === 7. THE REACTIVE SINKS (Subscriptions) ===
# These runs when the 'auth_state' pool changes (on program start, success, or failure)
# 7a. UI Rendering (Renders the new state)
auth_state -> ui_render('#display_div')

# 7b. Console Log (Prints the new state to terminal)
auth_state -> print('Auth Status Updated: ' | concat(.status))
