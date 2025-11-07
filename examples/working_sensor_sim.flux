# Working sensor simulation using current Fluxus capabilities
# This uses the built-in map operator with inline logic

let sensor_data = <|> {x: 0, y: 0, z: 9.8}
let step_count = <|> 0

# Simulate sensor readings as separate finite streams
~ {x: 1.2, y: 0.5, z: 10.1} | to_pool(sensor_data)
~ {x: -0.3, y: 1.8, z: 9.7} | to_pool(sensor_data)
~ {x: 0.8, y: -0.2, z: 10.3} | to_pool(sensor_data)
~ {x: 0.1, y: 0.9, z: 9.6} | to_pool(sensor_data)

# Process using built-in map with step counting logic
# We'll use a simple approach that works with current engine
~? sensor_data
| map { 
  let current_z = .value.z;
  let last_z = 9.8; // Starting value
  let steps = 0;
  
  // Simple step detection: count when z changes significantly
  if (Math.abs(current_z - last_z) > 0.3) {
    steps = 1;
  }
  steps
}
| to_pool(step_count)

# Display the data
sensor_data -> print('Sensor: ' | concat(.x) | concat(', ') | concat(.y) | concat(', ') | concat(.z))
step_count -> print('Steps detected: ' | concat(.value))
