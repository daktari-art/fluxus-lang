# FILENAME: examples/counter.flux
# 
# This file is the "Hello World" of Fluxus: it demonstrates how mutable state 
# is managed by a Tidal Pool and updated by an event stream, triggering an 
# automatic reactive output.

# === 1. FLOW IMPORT: Required External Libraries ===
FLOW ui # Imports streams for user interaction (e.g., button_clicks)


# === 2. STATE DECLARATION: The Tidal Pool (<|>) ===
# 'click_count' is the single source of truth. It is the only mutable data.
let click_count = <|> 0 


# === 3. THE LIVE STREAM AND FEEDBACK LOOP ===
# The entire loop runs non-stop, waiting for an event.

# 3a. Source: Start a Live Stream on the button click event.
~? ui_events('button#increment', 'click') 

# 3b. Transformation: Read the current count, add 1, and produce a new value stream.

| map { 
    # Read the pool's current value and perform the calculation purely
    click_count -> add(1) 
}

# 3c. Sink: Commit the new value back into the Pool. 
# This "write" operation automatically triggers all subscribers (step 4).

| to_pool(click_count) 


# === 4. THE REACTIVE SINK (Subscription) ===
# This flow *subscribes* to the pool. It runs immediately on program start
# and automatically reruns every single time 'click_count' is updated.
click_count -> ui_render('#display_div') 
click_count -> print('New Count: ' | concat(.value)) # Console logging the change
