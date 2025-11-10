// FILENAME: src/lib/domains/sensors.js
// Fluxus Sensor Data Processing and IoT Domain Operators

/**
 * Domain-specific operators for sensor data processing and IoT applications
 * Provides real and simulated sensor data streams with processing capabilities
 */

export const SENSOR_OPERATORS = {
    /**
     * Simulate accelerometer data stream for testing
     * @param {any} input - Stream input (ignored for source operators)
     * @param {Array} args - [frequencyHz] Data generation frequency
     * @param {Object} context - Execution context
     * @returns {Object} Simulated accelerometer data {x, y, z, timestamp}
     */
    'accelerometer_sim': (input, args, context) => {
        const frequency = parseInt(args[0]) || 10; // Default 10Hz
        
        // Generate realistic accelerometer data
        const baseNoise = 0.1;
        const now = Date.now();
        
        // Simulate device movement patterns
        const timeFactor = now / 1000;
        const walkPattern = Math.sin(timeFactor * 2 * Math.PI); // ~1Hz walking pattern
        
        return {
            x: (Math.random() - 0.5) * baseNoise + walkPattern * 0.5,
            y: (Math.random() - 0.5) * baseNoise + Math.sin(timeFactor * 4 * Math.PI) * 0.2,
            z: (Math.random() - 0.5) * baseNoise + 9.8, // Gravity
            timestamp: now,
            frequency: frequency,
            accuracy: 0.95,
            simulated: true
        };
    },
    
    /**
     * Detect steps from accelerometer data using peak detection
     * @param {Object} input - Accelerometer data {x, y, z}
     * @param {Array} args - [sensitivity] Step detection sensitivity
     * @param {Object} context - Execution context
     * @returns {Object|number} Step detection result or step count
     */
    'detect_steps': (input, args, context) => {
        const sensitivity = parseFloat(args[0]) || 1.5;
        
        if (!context.engine._stepDetectors) {
            context.engine._stepDetectors = new Map();
        }
        
        const detectorId = 'default_step_detector';
        let detector = context.engine._stepDetectors.get(detectorId);
        
        if (!detector) {
            detector = {
                history: [],
                stepCount: 0,
                lastStepTime: 0,
                minStepInterval: 300, // ms between steps
                threshold: sensitivity,
                lastMagnitude: 0
            };
            context.engine._stepDetectors.set(detectorId, detector);
        }
        
        // Calculate magnitude of acceleration vector
        const magnitude = Math.sqrt(
            Math.pow(input.x || 0, 2) + 
            Math.pow(input.y || 0, 2) + 
            Math.pow(input.z || 0, 2)
        );
        
        const now = Date.now();
        
        // Peak detection algorithm
        detector.history.push({ magnitude, timestamp: now });
        
        // Keep only recent history (2 seconds)
        detector.history = detector.history.filter(h => 
            now - h.timestamp < 2000
        );
        
        // Detect step when magnitude crosses threshold and we have a peak
        if (detector.history.length >= 3) {
            const current = magnitude;
            const previous = detector.lastMagnitude;
            
            // Simple peak detection: current > threshold and current > previous
            if (current > detector.threshold && current > previous) {
                // Check minimum time between steps
                if (now - detector.lastStepTime > detector.minStepInterval) {
                    detector.stepCount++;
                    detector.lastStepTime = now;
                    
                    return {
                        steps: detector.stepCount,
                        timestamp: now,
                        confidence: Math.min(1.0, (current - detector.threshold) / 2.0),
                        magnitude: current,
                        isStep: true
                    };
                }
            }
        }
        
        detector.lastMagnitude = magnitude;
        
        return {
            steps: detector.stepCount,
            timestamp: now,
            confidence: 0,
            magnitude: magnitude,
            isStep: false
        };
    },
    
    /**
     * Calculate magnitude from 3-axis sensor data
     * @param {Object} input - Sensor data with x, y, z properties
     * @param {Array} args - [includeGravity] Whether to include gravity in calculation
     * @param {Object} context - Execution context
     * @returns {number} Calculated magnitude
     */
    'calculate_magnitude': (input, args, context) => {
        const includeGravity = args[0] !== 'false';
        
        let x = input.x || 0;
        let y = input.y || 0;
        let z = input.z || 0;
        
        if (!includeGravity) {
            // Remove gravity component (assuming device is mostly upright)
            z -= 9.8;
        }
        
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        
        return {
            magnitude: magnitude,
            timestamp: input.timestamp || Date.now(),
            components: { x, y, z },
            includesGravity: includeGravity
        };
    },
    
    /**
     * Apply low-pass filter to smooth sensor data
     * @param {Object|number} input - Sensor data or value
     * @param {Array} args - [alpha] Filter smoothing factor (0-1)
     * @param {Object} context - Execution context
     * @returns {Object|number} Filtered sensor data
     */
    'low_pass_filter': (input, args, context) => {
        const alpha = parseFloat(args[0]) || 0.8; // Default strong smoothing
        
        if (!context.engine._sensorFilters) {
            context.engine._sensorFilters = new Map();
        }
        
        const filterId = `low_pass_${args.join('_')}`;
        let filter = context.engine._sensorFilters.get(filterId);
        
        // Handle different input types
        if (typeof input === 'number') {
            if (!filter) {
                filter = { value: input };
                context.engine._sensorFilters.set(filterId, filter);
            } else {
                filter.value = alpha * filter.value + (1 - alpha) * input;
            }
            return filter.value;
        }
        else if (typeof input === 'object' && input !== null) {
            if (!filter) {
                filter = { 
                    x: input.x || 0,
                    y: input.y || 0, 
                    z: input.z || 0
                };
                context.engine._sensorFilters.set(filterId, filter);
            } else {
                if (input.x !== undefined) filter.x = alpha * filter.x + (1 - alpha) * input.x;
                if (input.y !== undefined) filter.y = alpha * filter.y + (1 - alpha) * input.y;
                if (input.z !== undefined) filter.z = alpha * filter.z + (1 - alpha) * input.z;
            }
            
            return {
                ...input,
                x: filter.x,
                y: filter.y,
                z: filter.z,
                filtered: true,
                alpha: alpha
            };
        }
        
        return input;
    },
    
    /**
     * Detect device orientation from accelerometer data
     * @param {Object} input - Accelerometer data {x, y, z}
     * @param {Array} args - [precision] Orientation detection precision
     * @param {Object} context - Execution context
     * @returns {Object} Orientation information
     */
    'detect_orientation': (input, args, context) => {
        const precision = parseInt(args[0]) || 2; // Decimal places
        
        const x = input.x || 0;
        const y = input.y || 0;
        const z = input.z || 0;
        
        // Calculate orientation angles (simplified)
        const roll = Math.atan2(y, z) * (180 / Math.PI);
        const pitch = Math.atan2(-x, Math.sqrt(y*y + z*z)) * (180 / Math.PI);
        
        // Determine orientation label
        let orientation = 'unknown';
        const absPitch = Math.abs(pitch);
        const absRoll = Math.abs(roll);
        
        if (absPitch < 30 && absRoll < 30) {
            orientation = 'flat';
        } else if (pitch > 45) {
            orientation = 'portrait';
        } else if (pitch < -45) {
            orientation = 'portrait-upside-down';
        } else if (roll > 45) {
            orientation = 'landscape-left';
        } else if (roll < -45) {
            orientation = 'landscape-right';
        }
        
        return {
            orientation: orientation,
            roll: parseFloat(roll.toFixed(precision)),
            pitch: parseFloat(pitch.toFixed(precision)),
            confidence: 0.8,
            timestamp: input.timestamp || Date.now(),
            raw: { x, y, z }
        };
    },
    
    /**
     * Simulate heart rate data for health applications
     * @param {any} input - Stream input
     * @param {Array} args - [baselineBPM, variability] Heart rate parameters
     * @param {Object} context - Execution context
     * @returns {Object} Simulated heart rate data
     */
    'heart_rate_sim': (input, args, context) => {
        const baseline = parseInt(args[0]) || 72; // Default resting heart rate
        const variability = parseInt(args[1]) || 5; // BPM variability
        
        // Simulate realistic heart rate with some variability
        const noise = (Math.random() - 0.5) * 2 * variability;
        const activityFactor = Math.sin(Date.now() / 10000) * 10; // Slow variation
        const heartRate = Math.max(40, Math.min(180, baseline + noise + activityFactor));
        
        return {
            bpm: Math.round(heartRate),
            confidence: 0.85 + Math.random() * 0.1,
            timestamp: Date.now(),
            status: heartRate < 60 ? 'bradycardia' : 
                   heartRate > 100 ? 'tachycardia' : 'normal',
            variability: variability,
            simulated: true
        };
    },
    
    /**
     * Process GPS location data with accuracy filtering
     * @param {Object} input - GPS data {latitude, longitude, accuracy}
     * @param {Array} args - [minAccuracy] Minimum required accuracy in meters
     * @param {Object} context - Execution context
     * @returns {Object|null} Filtered GPS data or null if inaccurate
     */
    'filter_gps': (input, args, context) => {
        const minAccuracy = parseFloat(args[0]) || 50; // Default 50 meters
        
        if (!input.latitude || !input.longitude) {
            return null;
        }
        
        const accuracy = input.accuracy || 1000; // Assume poor accuracy if not provided
        
        if (accuracy > minAccuracy) {
            return null; // Too inaccurate
        }
        
        return {
            ...input,
            filtered: true,
            acceptableAccuracy: accuracy <= minAccuracy,
            timestamp: input.timestamp || Date.now()
        };
    },
    
    /**
     * Calculate distance between GPS coordinates using Haversine formula
     * @param {Object} input - Current GPS data
     * @param {Array} args - [previousLat, previousLng] Previous coordinates
     * @param {Object} context - Execution context
     * @returns {Object} Distance calculation result
     */
    'calculate_distance': (input, args, context) => {
        if (args.length < 2) {
            return { distance: 0, unit: 'meters', valid: false };
        }
        
        const prevLat = parseFloat(args[0]);
        const prevLng = parseFloat(args[1]);
        const currLat = input.latitude;
        const currLng = input.longitude;
        
        if (!currLat || !currLng || isNaN(prevLat) || isNaN(prevLng)) {
            return { distance: 0, unit: 'meters', valid: false };
        }
        
        // Haversine formula for great-circle distance
        const R = 6371000; // Earth radius in meters
        const dLat = (currLat - prevLat) * Math.PI / 180;
        const dLng = (currLng - prevLng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(prevLat * Math.PI / 180) * Math.cos(currLat * Math.PI / 180) *
                 Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return {
            distance: parseFloat(distance.toFixed(2)),
            unit: 'meters',
            valid: true,
            from: { latitude: prevLat, longitude: prevLng },
            to: { latitude: currLat, longitude: currLng },
            timestamp: input.timestamp || Date.now()
        };
    },
    
    /**
     * Sensor fusion combining multiple sensor inputs
     * @param {Object} input - Combined sensor data
     * @param {Array} args - [fusionType] Type of sensor fusion to apply
     * @param {Object} context - Execution context
     * @returns {Object} Fused sensor data
     */
    'sensor_fusion': (input, args, context) => {
        const fusionType = args[0] || 'basic';
        
        // Simple sensor fusion example
        // In real implementation, this would use Kalman filters or similar
        
        const now = Date.now();
        let fusedData = {
            timestamp: now,
            fusionType: fusionType,
            sensors: {}
        };
        
        // Copy all sensor data
        if (input.accelerometer) {
            fusedData.sensors.accelerometer = input.accelerometer;
            fusedData.acceleration = input.accelerometer;
        }
        
        if (input.gyroscope) {
            fusedData.sensors.gyroscope = input.gyroscope;
            fusedData.rotation = input.gyroscope;
        }
        
        if (input.magnetometer) {
            fusedData.sensors.magnetometer = input.magnetometer;
            fusedData.heading = this.calculateHeading(input.magnetometer);
        }
        
        // Add derived metrics
        if (fusedData.acceleration) {
            fusedData.movement = this.assessMovement(fusedData.acceleration);
        }
        
        return fusedData;
    },
    
    // Helper methods
    calculateHeading(magnetometer) {
        // Simplified heading calculation from magnetometer
        if (!magnetometer.x || !magnetometer.y) return 0;
        
        const heading = Math.atan2(magnetometer.y, magnetometer.x) * (180 / Math.PI);
        return (heading + 360) % 360; // Normalize to 0-360
    },
    
    assessMovement(acceleration) {
        const magnitude = Math.sqrt(
            acceleration.x * acceleration.x +
            acceleration.y * acceleration.y + 
            acceleration.z * acceleration.z
        );
        
        if (magnitude < 1.5) return 'stationary';
        if (magnitude < 3.0) return 'walking';
        if (magnitude < 6.0) return 'running';
        return 'high_activity';
    }
};
