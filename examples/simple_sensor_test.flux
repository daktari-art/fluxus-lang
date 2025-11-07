# Simple sensor test using current Fluxus capabilities
# This uses finite streams to simulate sensor data

let sensor_data = <|> {x: 0, y: 0, z: 0}
let step_count = <|> 0

# Simulate sensor data with finite streams
~ {x: 1.2, y: 0.5, z: 9.8} | to_pool(sensor_data)
~ {x: -0.3, y: 1.8, z: 9.7} | to_pool(sensor_data) 
~ {x: 0.8, y: -0.2, z: 10.1} | to_pool(sensor_data)

# Process the sensor data
~? sensor_data
| detect_steps()
| to_pool(step_count)

# Display results
step_count -> print('Steps: ' | concat(.value))
sensor_data -> print('Sensor: ' | concat(.x) | concat(', ') | concat(.y) | concat(', ') | concat(.z))

OPERATION detect_steps() {
  let lastZ = 0;
  let steps = 0;
  
  return (data) => {
    if (Math.abs(data.z - lastZ) > 0.3) {
      steps++;
      console.log('🚶 Step detected!');
    }
    lastZ = data.z;
    return steps;
  };
}
