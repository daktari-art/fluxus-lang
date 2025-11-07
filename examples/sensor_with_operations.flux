# Sensor processing with custom operations
OPERATION detect_steps() {
  let lastZ = 9.8
  let steps = 0
  
  return (data) => {
    if (Math.abs(data.z - lastZ) > 0.3) {
      steps = steps + 1
      console.log('🚶 Step detected! Total: ' + steps)
    }
    lastZ = data.z
    return steps
  }
}

OPERATION calculate_magnitude() {
  return Math.sqrt(.value.x * .value.x + .value.y * .value.y + .value.z * .value.z)
}

let sensor_data = <|> {x: 0, y: 0, z: 9.8}
let step_count = <|> 0
let accel_magnitude = <|> 0

# Simulate sensor data
~ {x: 1.2, y: 0.5, z: 10.1} | to_pool(sensor_data)
~ {x: -0.3, y: 1.8, z: 9.7} | to_pool(sensor_data)
~ {x: 0.8, y: -0.2, z: 10.3} | to_pool(sensor_data)

# Process sensor data with custom operations
~? sensor_data 
| detect_steps() 
| to_pool(step_count)

~? sensor_data
| calculate_magnitude()
| to_pool(accel_magnitude)

# Display results
step_count -> print('Steps: ' | concat(.value))
accel_magnitude -> print('Magnitude: ' | concat(.value))
sensor_data -> print('Sensor: ' | concat(.x) | concat(', ') | concat(.y) | concat(', ') | concat(.z))
