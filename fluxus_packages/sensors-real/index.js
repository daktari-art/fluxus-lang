import { spawn } from 'child_process';

class TermuxSensorStream {
  constructor(sensorName, interval = 1000) {
    this.sensorName = sensorName;
    this.interval = interval;
    this.running = false;
  }

  async *[Symbol.asyncIterator]() {
    this.running = true;
    
    while (this.running) {
      try {
        const sensorData = await this.readSensor();
        yield sensorData;
        await this.delay(this.interval);
      } catch (error) {
        yield { error: error.message, sensor: this.sensorName };
      }
    }
  }

  readSensor() {
    return new Promise((resolve, reject) => {
      const sensor = spawn('termux-sensor', [
        '-s', this.sensorName,
        '-d', '1'
      ]);

      let output = '';
      let errorOutput = '';

      sensor.stdout.on('data', (data) => {
        output += data.toString();
      });

      sensor.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      sensor.on('close', (code) => {
        if (code === 0 && output.trim()) {
          try {
            const parsed = JSON.parse(output.trim());
            resolve(parsed);
          } catch (e) {
            resolve({ raw: output.trim() });
          }
        } else {
          reject(new Error(`Sensor ${this.sensorName} failed: ${errorOutput || code}`));
        }
      });

      // Timeout after 3 seconds
      setTimeout(() => {
        if (sensor) sensor.kill();
        reject(new Error('Sensor timeout'));
      }, 3000);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.running = false;
  }
}

export const SENSORS_OPERATORS = {
  accelerometer: {
    name: 'accelerometer',
    description: 'Real accelerometer data from device',
    implementation: (interval = 100) => new TermuxSensorStream('Accelerometer', interval)
  },
  
  gps: {
    name: 'gps', 
    description: 'Real GPS location data',
    implementation: (interval = 5000) => new TermuxSensorStream('GPS', interval)
  },
  
  proximity: {
    name: 'proximity',
    description: 'Real proximity sensor data',
    implementation: (interval = 1000) => new TermuxSensorStream('Proximity', interval)
  }
};
