# Test Network Library
FLOW network

~ "https://api.example.com/data" 
| http_get() 
| parse_json()
| print("API Response: ")

~ { user: "fluxus", action: "login" }
| http_post("https://api.example.com/users")
| print("POST Response: ")
