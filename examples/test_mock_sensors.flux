# Test mock sensors in Fluxus
FLOW sensors-mock

let accel_data = <|> {x: 0, y: 0, z: 0}
let step_count = <|> 0

# Mock accelerometer stream
~? accelerometer(200)      # 200ms interval
| to_pool(accel_data)

# Simple step detection from mock data
~? accel_data
| detect_mock_steps()
| to_pool(step_count)

# Display the data
accel_data -> print('Accel: ' | concat(.x) | concat(', ') | concat(.y) | concat(', ') | concat(.z))
step_count -> print('Steps: ' | concat(.value))

OPERATION detect_mock_steps() {
  let lastZ = 0;
  let steps = 0;
  
  return (data) => {
    // Simple step detection: count when z-axis changes significantly
    if (Math.abs(data.z - lastZ) > 0.5) {
      steps++;
      lastZ = data.z;
      return steps;
    }
    lastZ = data.z;
    return null;
  };
}
