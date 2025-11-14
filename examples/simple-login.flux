# SIMPLIFIED LOGIN EXAMPLE - Actually runnable in CLI

# Create pools with initial values
let username_pool = <|> "testuser"
let password_pool = <|> "password123" 
let auth_state = <|> { status: 'initial', user: null }

# Print initial state
auth_state -> print()

# Simulate a login attempt with finite data
~ "login_attempt"

# Create login data (using direct values since pool syntax is complex)
| map { _ -> {
    username: "testuser",
    password: "password123" 
} }

# Simple authentication check
| map { data -> 
    data.username == "testuser" && data.password == "password123" 
        ? { status: 'success', user: data.username }
        : { status: 'failed', user: null }
}

| to_pool(auth_state)

# Print the final result
auth_state -> print()
