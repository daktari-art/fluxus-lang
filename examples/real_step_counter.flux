# REAL step counter using actual device sensors
FLOW sensors-real

let step_count = <|> 0
let raw_accel = <|> {x: 0, y: 0, z: 0}

# Real accelerometer data stream
~? accelerometer(100)      # 100ms sampling
| to_pool(raw_accel)       # Store raw data

# Step detection algorithm  
~? raw_accel
| detect_steps()
| to_pool(step_count)

# Display results
step_count -> print('Steps: ' | concat(.value))
raw_accel -> print('Accel: ' | concat(.x) | concat(', ') | concat(.y) | concat(', ') | concat(.z))

OPERATION detect_steps() {
  let lastMagnitude = 0;
  let stepCount = 0;
  let lastStepTime = 0;
  
  return (accelData) => {
    if (!accelData || accelData.error) return null;
    
    const x = accelData.x || accelData.values?.[0] || 0;
    const y = accelData.y || accelData.values?.[1] || 0; 
    const z = accelData.z || accelData.values?.[2] || 0;
    
    const magnitude = Math.sqrt(x*x + y*y + z*z);
    const delta = magnitude - lastMagnitude;
    
    // Step detection algorithm
    if (Math.abs(delta) > 1.2 && Date.now() - lastStepTime > 300) {
      stepCount++;
      lastStepTime = Date.now();
      console.log(`🚶 Step detected! Total: ${stepCount}`);
      return stepCount;
    }
    
    lastMagnitude = magnitude;
    return null;
  };
}
