export const SENSORS_OPERATORS = {
  accelerometer: {
    name: 'accelerometer',
    description: 'Mock accelerometer data',
    implementation: (interval = 100) => mockSensorStream('accelerometer', interval)
  },
  
  gps: {
    name: 'gps',
    description: 'Mock GPS location data', 
    implementation: (interval = 5000) => mockSensorStream('gps', interval)
  },
  
  proximity: {
    name: 'proximity',
    description: 'Mock proximity sensor data',
    implementation: (interval = 1000) => mockSensorStream('proximity', interval)
  }
};

function mockSensorStream(sensorType, interval) {
  let count = 0;
  
  return {
    async *[Symbol.asyncIterator]() {
      while (true) {
        let data;
        
        switch(sensorType) {
          case 'accelerometer':
            data = {
              x: Math.sin(count * 0.1) * 2 + (Math.random() - 0.5),
              y: Math.cos(count * 0.1) * 2 + (Math.random() - 0.5),
              z: Math.sin(count * 0.2) * 1 + (Math.random() - 0.5),
              mock: true
            };
            break;
            
          case 'gps':
            data = {
              latitude: 40.7128 + (Math.random() - 0.5) * 0.001,
              longitude: -74.0060 + (Math.random() - 0.5) * 0.001,
              accuracy: 5 + Math.random() * 10,
              mock: true
            };
            break;
            
          case 'proximity':
            data = {
              distance: count % 10 < 5 ? 2 : 8, // Alternates between near/far
              near: count % 10 < 5,
              mock: true  
            };
            break;
        }
        
        count++;
        yield data;
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    },
    
    stop() {
      // Cleanup if needed
    }
  };
}
