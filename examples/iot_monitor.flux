// Fluxus IoT Monitor - Distributed Sensor Network
// Uses iot and sensors-real libraries

FLOW iot
FLOW sensors-real

// Device pools
let sensor_data_pool = <|> []
let device_status_pool = <|> "online"
let network_quality_pool = <|> "good"

// Sensor data collection with timestamps
~? accelerometer_real(50)
| add_timestamp
| to_pool(sensor_data_pool)

~? gps_location()
| add_timestamp  
| to_pool(sensor_data_pool)

~? environment_sensors()
| add_timestamp
| to_pool(sensor_data_pool)

// Real-time analytics at edge
~? sensor_data_pool
| window_count(5)  // Smaller window for demo
| calculate_moving_averages
| detect_sensor_anomalies
| print()

// Device health monitoring
~? interval(5000)  // Every 5 seconds for demo
| health_check
| print()

// Multi-sensor fusion demo
~? combine_latest(accelerometer_real(50), gps_location(), environment_sensors())
| add_timestamp
| print()

// System status
~ "🏠 IoT Monitor Started - Mobile Edge Computing" | print()
~ "📡 Sensors: Accelerometer, GPS, Environment" | print()
~ "⚡ Analytics: Moving Averages, Anomaly Detection" | print()
~ "🌐 Architecture: Mobile → Edge → Cloud Ready" | print()
