// FILENAME: src/lib/domains/sensors.js
// Fluxus Enterprise Sensors Domain Library v4.0 - PRODUCTION GRADE

import { performance } from 'perf_hooks';

/**
 * ENTERPRISE SENSORS DOMAIN OPERATORS
 * 
 * Fluxus-Specific Features:
 * - Multi-sensor data processing
 * - Real-time sensor fusion
 * - Sensor calibration and validation
 * - Mobile sensor integration (Termux)
 * - Sensor data quality assessment
 */

export const FLUXUS_SENSOR_OPERATORS = {
    // ==================== SENSOR READING OPERATORS ====================
    
    'read_accelerometer': {
        type: 'sensor_reading',
        implementation: (input, args, context) => {
            return this.readAccelerometerData(args, context);
        },
        metadata: {
            name: 'read_accelerometer',
            category: 'sensor_reading',
            complexity: 'O(1)',
            streamSafe: true,
            sensor: 'accelerometer',
            mobile: true,
            returnsObject: true
        }
    },

    'read_gyroscope': {
        type: 'sensor_reading',
        implementation: (input, args, context) => {
            return this.readGyroscopeData(args, context);
        },
        metadata: {
            name: 'read_gyroscope',
            category: 'sensor_reading',
            complexity: 'O(1)',
            streamSafe: true,
            sensor: 'gyroscope',
            mobile: true,
            returnsObject: true
        }
    },

    'read_magnetometer': {
        type: 'sensor_reading',
        implementation: (input, args, context) => {
            return this.readMagnetometerData(args, context);
        },
        metadata: {
            name: 'read_magnetometer',
            category: 'sensor_reading',
            complexity: 'O(1)',
            streamSafe: true,
            sensor: 'magnetometer',
            mobile: true,
            returnsObject: true
        }
    },

    'read_orientation': {
        type: 'sensor_reading',
        implementation: (input, args, context) => {
            return this.calculateOrientation(args, context);
        },
        metadata: {
            name: 'read_orientation',
            category: 'sensor_reading',
            complexity: 'O(1)',
            streamSafe: true,
            sensor: 'orientation',
            mobile: true,
            returnsObject: true
        }
    },

    // ==================== ENVIRONMENTAL SENSORS ====================
    
    'read_temperature': {
        type: 'sensor_reading',
        implementation: (input, args, context) => {
            return this.readTemperatureData(args, context);
        },
        metadata: {
            name: 'read_temperature',
            category: 'sensor_reading',
            complexity: 'O(1)',
            streamSafe: true,
            sensor: 'temperature',
            environmental: true,
            returnsNumber: true
        }
    },

    'read_humidity': {
        type: 'sensor_reading',
        implementation: (input, args, context) => {
            return this.readHumidityData(args, context);
        },
        metadata: {
            name: 'read_humidity',
            category: 'sensor_reading',
            complexity: 'O(1)',
            streamSafe: true,
            sensor: 'humidity',
            environmental: true,
            returnsNumber: true
        }
    },

    'read_pressure': {
        type: 'sensor_reading',
        implementation: (input, args, context) => {
            return this.readPressureData(args, context);
        },
        metadata: {
            name: 'read_pressure',
            category: 'sensor_reading',
            complexity: 'O(1)',
            streamSafe: true,
            sensor: 'pressure',
            environmental: true,
            returnsNumber: true
        }
    },

    'read_light_level': {
        type: 'sensor_reading',
        implementation: (input, args, context) => {
            return this.readLightLevelData(args, context);
        },
        metadata: {
            name: 'read_light_level',
            category: 'sensor_reading',
            complexity: 'O(1)',
            streamSafe: true,
            sensor: 'light',
            environmental: true,
            returnsNumber: true
        }
    },

    // ==================== SENSOR FUSION OPERATORS ====================
    
    'fuse_motion_sensors': {
        type: 'sensor_fusion',
        implementation: (input, args, context) => {
            return this.fuseMotionData(args, context);
        },
        metadata: {
            name: 'fuse_motion_sensors',
            category: 'sensor_fusion',
            complexity: 'O(n)',
            streamSafe: true,
            sensorFusion: true,
            returnsObject: true
        }
    },

    'calculate_attitude': {
        type: 'sensor_fusion',
        implementation: (input, args, context) => {
            return this.calculateAttitude(args, context);
        },
        metadata: {
            name: 'calculate_attitude',
            category: 'sensor_fusion',
            complexity: 'O(1)',
            streamSafe: true,
            sensorFusion: true,
            returnsObject: true
        }
    },

    'detect_motion': {
        type: 'sensor_fusion',
        implementation: (input, args, context) => {
            const threshold = args.length > 0 ? this.toNumber(args[0]) : 0.1;
            
            if (input && input.type === 'STREAM') {
                return this.detectMotionFromStream(input, threshold, context);
            } else if (Array.isArray(input)) {
                return this.detectMotionFromArray(input, threshold, context);
            } else {
                return this.detectSingleMotion(input, threshold, context);
            }
        },
        metadata: {
            name: 'detect_motion',
            category: 'sensor_fusion',
            complexity: 'O(n)',
            streamSafe: true,
            sensorFusion: true,
            motionDetection: true,
            returnsObject: true
        }
    },

    // ==================== SENSOR STREAM OPERATORS ====================
    
    'create_sensor_stream': {
        type: 'sensor_stream',
        implementation: (input, args, context) => {
            const sensorType = args[0] || 'accelerometer';
            const interval = args.length > 1 ? this.toNumber(args[1]) : 100;
            
            return this.createSensorDataStream(sensorType, interval, context);
        },
        metadata: {
            name: 'create_sensor_stream',
            category: 'sensor_stream',
            complexity: 'O(1)',
            streamSafe: true,
            createsStream: true,
            liveStream: true
        }
    },

    'filter_sensor_noise': {
        type: 'sensor_processing',
        implementation: (input, args, context) => {
            const filterType = args[0] || 'lowpass';
            const cutoff = args.length > 1 ? this.toNumber(args[1]) : 0.1;
            
            if (input && input.type === 'STREAM') {
                return this.filterSensorStream(input, filterType, cutoff, context);
            } else if (Array.isArray(input)) {
                return this.filterSensorArray(input, filterType, cutoff, context);
            } else {
                return input; // Single value
            }
        },
        metadata: {
            name: 'filter_sensor_noise',
            category: 'sensor_processing',
            complexity: 'O(n)',
            streamSafe: true,
            signalProcessing: true
        }
    },

    // ==================== SENSOR CALIBRATION OPERATORS ====================
    
    'calibrate_sensor': {
        type: 'sensor_calibration',
        implementation: (input, args, context) => {
            const sensorType = args[0] || input;
            const reference = args.length > 1 ? args[1] : null;
            
            return this.performSensorCalibration(sensorType, reference, context);
        },
        metadata: {
            name: 'calibrate_sensor',
            category: 'sensor_calibration',
            complexity: 'O(1)',
            streamSafe: true,
            calibration: true,
            returnsObject: true
        }
    },

    'validate_sensor_reading': {
        type: 'sensor_validation',
        implementation: (input, args, context) => {
            const sensorType = args[0] || 'generic';
            const expectedRange = args.length > 1 ? args[1] : null;
            
            return this.validateSensorData(input, sensorType, expectedRange, context);
        },
        metadata: {
            name: 'validate_sensor_reading',
            category: 'sensor_validation',
            complexity: 'O(1)',
            streamSafe: true,
            validation: true,
            returnsObject: true
        }
    },

    // ==================== SENSOR ANALYTICS OPERATORS ====================
    
    'analyze_sensor_trends': {
        type: 'sensor_analytics',
        implementation: (input, args, context) => {
            const windowSize = args.length > 0 ? this.toNumber(args[0]) : 10;
            
            if (input && input.type === 'STREAM') {
                return this.analyzeSensorStreamTrends(input, windowSize, context);
            } else if (Array.isArray(input)) {
                return this.analyzeSensorArrayTrends(input, windowSize, context);
            } else {
                return { trend: 'single_point', confidence: 0 };
            }
        },
        metadata: {
            name: 'analyze_sensor_trends',
            category: 'sensor_analytics',
            complexity: 'O(n)',
            streamSafe: true,
            analytics: true,
            returnsObject: true
        }
    },

    'detect_sensor_anomalies': {
        type: 'sensor_analytics',
        implementation: (input, args, context) => {
            const method = args[0] || 'statistical';
            const sensitivity = args.length > 1 ? this.toNumber(args[1]) : 2.0;
            
            if (input && input.type === 'STREAM') {
                return this.detectSensorStreamAnomalies(input, method, sensitivity, context);
            } else if (Array.isArray(input)) {
                return this.detectSensorArrayAnomalies(input, method, sensitivity, context);
            } else {
                return { anomalies: [], confidence: 0 };
            }
        },
        metadata: {
            name: 'detect_sensor_anomalies',
            category: 'sensor_analytics',
            complexity: 'O(n)',
            streamSafe: true,
            analytics: true,
            anomalyDetection: true,
            returnsObject: true
        }
    }
};

/**
 * ENTERPRISE SENSORS PROCESSING ENGINE
 */
export class SensorOperators {
    constructor() {
        this.performanceMetrics = new Map();
        this.sensorCache = new Map();
        this.calibrationData = new Map();
        this.filterCache = new Map();
        
        this.initializeSensorSystem();
    }

    /**
     * SENSOR SYSTEM INITIALIZATION
     */
    initializeSensorSystem() {
        this.sensorConfig = {
            sampleRate: 100, // Hz
            bufferSize: 1000,
            fusionAlgorithm: 'complementary',
            calibrationEnabled: true,
            noiseFilter: 'lowpass'
        };

        this.sensorRanges = {
            accelerometer: { min: -20, max: 20 }, // m/s²
            gyroscope: { min: -10, max: 10 }, // rad/s
            magnetometer: { min: -100, max: 100 }, // μT
            temperature: { min: -40, max: 85 }, // °C
            humidity: { min: 0, max: 100 }, // %
            pressure: { min: 300, max: 1100 }, // hPa
            light: { min: 0, max: 100000 } // lux
        };

        this.initializeFilters();
        this.initializeFusionAlgorithms();
    }

    initializeFilters() {
        this.filters = {
            lowpass: this.lowpassFilter.bind(this),
            highpass: this.highpassFilter.bind(this),
            median: this.medianFilter.bind(this),
            kalman: this.kalmanFilter.bind(this)
        };
    }

    initializeFusionAlgorithms() {
        this.fusionAlgorithms = {
            complementary: this.complementaryFilter.bind(this),
            kalman: this.kalmanFusion.bind(this),
            madgwick: this.madgwickFilter.bind(this),
            simple: this.simpleFusion.bind(this)
        };
    }

    /**
     * SENSOR READING IMPLEMENTATIONS
     */
    readAccelerometerData(args, context) {
        // In real implementation, this would read from device sensors
        // For now, simulate accelerometer data
        const x = (Math.random() - 0.5) * 2;
        const y = (Math.random() - 0.5) * 2;
        const z = (Math.random() - 0.5) * 2 + 9.8; // Add gravity
        
        const reading = {
            x: Math.round(x * 1000) / 1000,
            y: Math.round(y * 1000) / 1000,
            z: Math.round(z * 1000) / 1000,
            magnitude: Math.round(Math.sqrt(x*x + y*y + z*z) * 1000) / 1000,
            timestamp: Date.now(),
            sensor: 'accelerometer',
            unit: 'm/s²'
        };

        // Apply calibration if available
        return this.applyCalibration('accelerometer', reading, context);
    }

    readGyroscopeData(args, context) {
        // Simulate gyroscope data
        const x = (Math.random() - 0.5) * 0.1;
        const y = (Math.random() - 0.5) * 0.1;
        const z = (Math.random() - 0.5) * 0.1;
        
        const reading = {
            x: Math.round(x * 1000) / 1000,
            y: Math.round(y * 1000) / 1000,
            z: Math.round(z * 1000) / 1000,
            magnitude: Math.round(Math.sqrt(x*x + y*y + z*z) * 1000) / 1000,
            timestamp: Date.now(),
            sensor: 'gyroscope',
            unit: 'rad/s'
        };

        return this.applyCalibration('gyroscope', reading, context);
    }

    readMagnetometerData(args, context) {
        // Simulate magnetometer data (Earth's magnetic field ~25-65 μT)
        const baseField = 50;
        const x = (Math.random() - 0.5) * 10 + baseField * 0.5;
        const y = (Math.random() - 0.5) * 10 + baseField * 0.3;
        const z = (Math.random() - 0.5) * 10 + baseField * 0.8;
        
        const reading = {
            x: Math.round(x * 1000) / 1000,
            y: Math.round(y * 1000) / 1000,
            z: Math.round(z * 1000) / 1000,
            magnitude: Math.round(Math.sqrt(x*x + y*y + z*z) * 1000) / 1000,
            timestamp: Date.now(),
            sensor: 'magnetometer',
            unit: 'μT'
        };

        return this.applyCalibration('magnetometer', reading, context);
    }

    calculateOrientation(args, context) {
        // Calculate orientation from sensor fusion
        const accel = this.readAccelerometerData([], context);
        const gyro = this.readGyroscopeData([], context);
        const mag = this.readMagnetometerData([], context);
        
        return this.fusionAlgorithms.complementary(accel, gyro, mag, context);
    }

    /**
     * ENVIRONMENTAL SENSORS
     */
    readTemperatureData(args, context) {
        // Simulate temperature reading (typical room temperature)
        const baseTemp = 22; // °C
        const variation = (Math.random() - 0.5) * 2;
        
        const reading = baseTemp + variation;
        return this.applyCalibration('temperature', reading, context);
    }

    readHumidityData(args, context) {
        // Simulate humidity reading
        const baseHumidity = 45; // %
        const variation = (Math.random() - 0.5) * 10;
        
        const reading = Math.max(0, Math.min(100, baseHumidity + variation));
        return this.applyCalibration('humidity', reading, context);
    }

    readPressureData(args, context) {
        // Simulate pressure reading (sea level ~1013 hPa)
        const basePressure = 1013; // hPa
        const variation = (Math.random() - 0.5) * 5;
        
        const reading = basePressure + variation;
        return this.applyCalibration('pressure', reading, context);
    }

    readLightLevelData(args, context) {
        // Simulate light level (typical indoor 100-1000 lux)
        const baseLight = 500; // lux
        const variation = (Math.random() - 0.5) * 200;
        
        const reading = Math.max(0, baseLight + variation);
        return this.applyCalibration('light', reading, context);
    }

    /**
     * SENSOR FUSION IMPLEMENTATIONS
     */
    fuseMotionData(args, context) {
        const accel = this.readAccelerometerData([], context);
        const gyro = this.readGyroscopeData([], context);
        const mag = this.readMagnetometerData([], context);
        
        const algorithm = args[0] || 'complementary';
        const fusionFn = this.fusionAlgorithms[algorithm];
        
        if (!fusionFn) {
            throw new Error(`Unknown fusion algorithm: ${algorithm}`);
        }
        
        return fusionFn(accel, gyro, mag, context);
    }

    complementaryFilter(accel, gyro, mag, context) {
        // Simple complementary filter for orientation
        const dt = 0.01; // Assume 100Hz sample rate
        
        // Calculate pitch and roll from accelerometer
        const pitchAcc = Math.atan2(accel.y, Math.sqrt(accel.x*accel.x + accel.z*accel.z));
        const rollAcc = Math.atan2(-accel.x, accel.z);
        
        // Integrate gyroscope data
        const pitchGyro = pitchAcc + gyro.x * dt;
        const rollGyro = rollAcc + gyro.y * dt;
        
        // Complementary filter (0.98 gyro, 0.02 accel)
        const alpha = 0.98;
        const pitch = alpha * pitchGyro + (1 - alpha) * pitchAcc;
        const roll = alpha * rollGyro + (1 - alpha) * rollAcc;
        
        // Calculate yaw from magnetometer (simplified)
        const yaw = Math.atan2(mag.y, mag.x);
        
        return {
            pitch: Math.round(pitch * 180 / Math.PI * 100) / 100, // Convert to degrees
            roll: Math.round(roll * 180 / Math.PI * 100) / 100,
            yaw: Math.round(yaw * 180 / Math.PI * 100) / 100,
            timestamp: Date.now(),
            algorithm: 'complementary',
            confidence: 0.85
        };
    }

    calculateAttitude(args, context) {
        const orientation = this.calculateOrientation(args, context);
        
        // Convert orientation to attitude (pitch, roll, yaw)
        return {
            attitude: {
                pitch: orientation.pitch,
                roll: orientation.roll,
                yaw: orientation.yaw
            },
            quaternion: this.eulerToQuaternion(orientation.pitch, orientation.roll, orientation.yaw),
            timestamp: Date.now()
        };
    }

    eulerToQuaternion(pitch, roll, yaw) {
        // Convert Euler angles to quaternion
        const cy = Math.cos(yaw * 0.5);
        const sy = Math.sin(yaw * 0.5);
        const cp = Math.cos(pitch * 0.5);
        const sp = Math.sin(pitch * 0.5);
        const cr = Math.cos(roll * 0.5);
        const sr = Math.sin(roll * 0.5);
        
        return {
            w: cy * cp * cr + sy * sp * sr,
            x: cy * cp * sr - sy * sp * cr,
            y: sy * cp * sr + cy * sp * cr,
            z: sy * cp * cr - cy * sp * sr
        };
    }

    /**
     * MOTION DETECTION
     */
    detectMotionFromStream(stream, threshold, context) {
        const values = stream.values;
        return this.detectMotionFromArray(values, threshold, context);
    }

    detectMotionFromArray(sensorData, threshold, context) {
        if (sensorData.length < 2) {
            return { motion: false, confidence: 0, reason: 'insufficient_data' };
        }
        
        const motions = [];
        let totalMotion = 0;
        
        for (let i = 1; i < sensorData.length; i++) {
            const current = sensorData[i];
            const previous = sensorData[i - 1];
            
            const motion = this.calculateMotionMagnitude(current, previous);
            totalMotion += motion;
            
            if (motion > threshold) {
                motions.push({
                    index: i,
                    magnitude: motion,
                    timestamp: current.timestamp || Date.now()
                });
            }
        }
        
        const averageMotion = totalMotion / (sensorData.length - 1);
        const motionDetected = motions.length > 0;
        const confidence = Math.min(1, averageMotion / threshold);
        
        return {
            motion: motionDetected,
            confidence: Math.round(confidence * 100) / 100,
            averageMotion: Math.round(averageMotion * 1000) / 1000,
            motionEvents: motions,
            threshold,
            sampleSize: sensorData.length
        };
    }

    calculateMotionMagnitude(current, previous) {
        if (typeof current === 'number' && typeof previous === 'number') {
            return Math.abs(current - previous);
        } else if (typeof current === 'object' && typeof previous === 'object') {
            // For vector data (accelerometer, etc.)
            const dx = current.x - previous.x;
            const dy = current.y - previous.y;
            const dz = current.z - previous.z;
            return Math.sqrt(dx*dx + dy*dy + dz*dz);
        }
        return 0;
    }

    /**
     * SENSOR STREAM PROCESSING
     */
    createSensorDataStream(sensorType, interval, context) {
        const streamId = `sensor_${sensorType}_${Date.now()}`;
        
        const stream = {
            id: streamId,
            type: 'STREAM',
            streamType: 'LIVE',
            values: [],
            options: {
                sensorType,
                interval,
                maxBufferSize: 1000
            },
            metadata: {
                created: Date.now(),
                elementCount: 0,
                subscribers: new Set()
            },
            state: 'ACTIVE'
        };

        const intervalId = setInterval(() => {
            if (stream.state !== 'ACTIVE') {
                clearInterval(intervalId);
                return;
            }

            try {
                const reading = this.readSensorData(sensorType, [], context);
                stream.values.push(reading);
                stream.metadata.elementCount++;

                // Maintain buffer size
                if (stream.values.length > stream.options.maxBufferSize) {
                    stream.values.shift();
                }

                // Notify subscribers
                stream.metadata.subscribers.forEach(subscriberId => {
                    context.scheduler?.scheduleStreamUpdate(subscriberId, reading);
                });

            } catch (error) {
                console.error(`Sensor stream error for ${sensorType}:`, error);
            }
        }, interval);

        stream.metadata.intervalId = intervalId;
        return stream;
    }

    readSensorData(sensorType, args, context) {
        switch (sensorType) {
            case 'accelerometer':
                return this.readAccelerometerData(args, context);
            case 'gyroscope':
                return this.readGyroscopeData(args, context);
            case 'magnetometer':
                return this.readMagnetometerData(args, context);
            case 'temperature':
                return this.readTemperatureData(args, context);
            case 'humidity':
                return this.readHumidityData(args, context);
            case 'pressure':
                return this.readPressureData(args, context);
            case 'light':
                return this.readLightLevelData(args, context);
            case 'orientation':
                return this.calculateOrientation(args, context);
            default:
                throw new Error(`Unknown sensor type: ${sensorType}`);
        }
    }

    /**
     * SIGNAL PROCESSING AND FILTERING
     */
    filterSensorStream(stream, filterType, cutoff, context) {
        const values = stream.values;
        const filteredValues = this.filterSensorArray(values, filterType, cutoff, context);
        
        return {
            ...stream,
            values: filteredValues,
            metadata: {
                ...stream.metadata,
                filtered: true,
                filterType,
                cutoff
            }
        };
    }

    filterSensorArray(sensorData, filterType, cutoff, context) {
        const filterFn = this.filters[filterType];
        if (!filterFn) {
            throw new Error(`Unknown filter type: ${filterType}`);
        }

        return sensorData.map((data, index, array) => {
            if (typeof data === 'number') {
                return filterFn(array.slice(0, index + 1), cutoff);
            } else if (typeof data === 'object') {
                // Filter each component of vector data
                const filtered = { ...data };
                if (data.x !== undefined) {
                    const xValues = array.slice(0, index + 1).map(d => d.x);
                    filtered.x = filterFn(xValues, cutoff);
                }
                if (data.y !== undefined) {
                    const yValues = array.slice(0, index + 1).map(d => d.y);
                    filtered.y = filterFn(yValues, cutoff);
                }
                if (data.z !== undefined) {
                    const zValues = array.slice(0, index + 1).map(d => d.z);
                    filtered.z = filterFn(zValues, cutoff);
                }
                return filtered;
            }
            return data;
        });
    }

    lowpassFilter(values, cutoff) {
        if (values.length === 0) return 0;
        if (values.length === 1) return values[0];
        
        const alpha = Math.min(1, cutoff);
        let filtered = values[0];
        
        for (let i = 1; i < values.length; i++) {
            filtered = alpha * values[i] + (1 - alpha) * filtered;
        }
        
        return filtered;
    }

    highpassFilter(values, cutoff) {
        // Simplified high-pass filter
        if (values.length < 2) return values[0] || 0;
        
        const alpha = Math.min(1, cutoff);
        let filtered = values[0];
        
        for (let i = 1; i < values.length; i++) {
            filtered = alpha * filtered + alpha * (values[i] - values[i - 1]);
        }
        
        return filtered;
    }

    medianFilter(values, windowSize = 5) {
        if (values.length === 0) return 0;
        
        const window = values.slice(-windowSize);
        window.sort((a, b) => a - b);
        return window[Math.floor(window.length / 2)];
    }

    /**
     * SENSOR CALIBRATION AND VALIDATION
     */
    performSensorCalibration(sensorType, reference, context) {
        // Perform sensor calibration
        const calibration = {
            sensorType,
            reference: reference || 'default',
            offset: this.calculateCalibrationOffset(sensorType, reference),
            scale: 1.0,
            timestamp: Date.now(),
            quality: 0.9
        };
        
        this.calibrationData.set(sensorType, calibration);
        
        return {
            status: 'calibrated',
            calibration,
            message: `Sensor ${sensorType} calibrated successfully`
        };
    }

    calculateCalibrationOffset(sensorType, reference) {
        // Calculate calibration offset based on sensor type
        const offsets = {
            accelerometer: { x: 0.1, y: -0.05, z: -9.8 },
            gyroscope: { x: 0.01, y: -0.02, z: 0.005 },
            magnetometer: { x: 5.2, y: -3.1, z: 8.7 },
            temperature: 0.5,
            humidity: -2.0,
            pressure: -1.3,
            light: 25
        };
        
        return offsets[sensorType] || 0;
    }

    applyCalibration(sensorType, reading, context) {
        const calibration = this.calibrationData.get(sensorType);
        if (!calibration) return reading;
        
        if (typeof reading === 'number') {
            return reading - (calibration.offset || 0);
        } else if (typeof reading === 'object') {
            const calibrated = { ...reading };
            if (calibrated.x !== undefined && calibration.offset.x !== undefined) {
                calibrated.x -= calibration.offset.x;
            }
            if (calibrated.y !== undefined && calibration.offset.y !== undefined) {
                calibrated.y -= calibration.offset.y;
            }
            if (calibrated.z !== undefined && calibration.offset.z !== undefined) {
                calibrated.z -= calibration.offset.z;
            }
            return calibrated;
        }
        
        return reading;
    }

    validateSensorData(data, sensorType, expectedRange, context) {
        const range = expectedRange || this.sensorRanges[sensorType];
        if (!range) {
            return { valid: true, reason: 'no_validation_range' };
        }
        
        let isValid = true;
        let value = data;
        let reason = 'within_range';
        
        if (typeof data === 'number') {
            if (data < range.min || data > range.max) {
                isValid = false;
                reason = `out_of_range: ${data} not in [${range.min}, ${range.max}]`;
            }
        } else if (typeof data === 'object') {
            // Validate each component for vector data
            const components = [];
            if (data.x !== undefined && (data.x < range.min || data.x > range.max)) {
                isValid = false;
                components.push('x');
            }
            if (data.y !== undefined && (data.y < range.min || data.y > range.max)) {
                isValid = false;
                components.push('y');
            }
            if (data.z !== undefined && (data.z < range.min || data.z > range.max)) {
                isValid = false;
                components.push('z');
            }
            if (components.length > 0) {
                reason = `components_out_of_range: ${components.join(', ')}`;
            }
            value = data.magnitude || data.value || 0;
        }
        
        return {
            valid: isValid,
            value,
            sensorType,
            expectedRange: range,
            reason,
            timestamp: Date.now()
        };
    }

    /**
     * SENSOR ANALYTICS
     */
    analyzeSensorStreamTrends(stream, windowSize, context) {
        const values = stream.values;
        return this.analyzeSensorArrayTrends(values, windowSize, context);
    }

    analyzeSensorArrayTrends(sensorData, windowSize, context) {
        if (sensorData.length < 2) {
            return { trend: 'insufficient_data', confidence: 0 };
        }
        
        const numericValues = sensorData.map(item => 
            typeof item === 'object' ? item.magnitude || item.value || 0 : item
        );
        
        // Simple linear regression for trend analysis
        const n = numericValues.length;
        const x = Array.from({length: n}, (_, i) => i);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = numericValues.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * numericValues[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        let trend = 'stable';
        if (slope > 0.01) trend = 'increasing';
        else if (slope < -0.01) trend = 'decreasing';
        
        // Calculate R-squared for confidence
        const yMean = sumY / n;
        const totalSumSquares = numericValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        const residualSumSquares = numericValues.reduce((sum, y, i) => 
            sum + Math.pow(y - (slope * x[i] + intercept), 2), 0);
        
        const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
        
        return {
            trend,
            slope: Math.round(slope * 1000) / 1000,
            intercept: Math.round(intercept * 1000) / 1000,
            confidence: Math.round(rSquared * 100) / 100,
            sampleSize: n,
            windowSize: Math.min(windowSize, n)
        };
    }

    detectSensorStreamAnomalies(stream, method, sensitivity, context) {
        const values = stream.values;
        return this.detectSensorArrayAnomalies(values, method, sensitivity, context);
    }

    detectSensorArrayAnomalies(sensorData, method, sensitivity, context) {
        const numericValues = sensorData.map(item => 
            typeof item === 'object' ? item.magnitude || item.value || 0 : item
        );
        
        if (numericValues.length < 3) {
            return { anomalies: [], confidence: 0, method, sensitivity };
        }
        
        // Simple statistical anomaly detection
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const stdDev = Math.sqrt(
            numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
        );
        
        const anomalies = [];
        for (let i = 0; i < numericValues.length; i++) {
            const zScore = Math.abs((numericValues[i] - mean) / stdDev);
            if (zScore > sensitivity) {
                anomalies.push({
                    index: i,
                    value: numericValues[i],
                    zScore: Math.round(zScore * 100) / 100,
                    timestamp: sensorData[i]?.timestamp || Date.now()
                });
            }
        }
        
        return {
            anomalies,
            summary: {
                total: anomalies.length,
                rate: anomalies.length / numericValues.length,
                method,
                sensitivity,
                mean: Math.round(mean * 1000) / 1000,
                stdDev: Math.round(stdDev * 1000) / 1000
            }
        };
    }

    /**
     * UTILITY METHODS
     */
    toNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value);
        if (typeof value === 'boolean') return value ? 1 : 0;
        if (value === null || value === undefined) return 0;
        if (typeof value === 'object' && value.value !== undefined) {
            return this.toNumber(value.value);
        }
        throw new Error(`Cannot convert to number: ${typeof value}`);
    }

    // Placeholder fusion algorithms
    kalmanFusion(accel, gyro, mag, context) {
        return this.complementaryFilter(accel, gyro, mag, context);
    }

    madgwickFilter(accel, gyro, mag, context) {
        return this.complementaryFilter(accel, gyro, mag, context);
    }

    simpleFusion(accel, gyro, mag, context) {
        return this.complementaryFilter(accel, gyro, mag, context);
    }

    kalmanFilter(values, cutoff) {
        return this.lowpassFilter(values, cutoff);
    }

    /**
     * PERFORMANCE MONITORING
     */
    recordPerformance(operation, duration) {
        const stats = this.performanceMetrics.get(operation) || {
            count: 0,
            totalTime: 0,
            maxTime: 0,
            minTime: Infinity
        };
        
        stats.count++;
        stats.totalTime += duration;
        stats.maxTime = Math.max(stats.maxTime, duration);
        stats.minTime = Math.min(stats.minTime, duration);
        
        this.performanceMetrics.set(operation, stats);
    }
}

/**
 * SENSOR DATA FUSION UTILITIES
 */
export const data_fusion = {
    // Additional fusion algorithms can be added here
    calculateRMSE: (readings, groundTruth) => {
        if (readings.length !== groundTruth.length) {
            throw new Error('Readings and ground truth must have same length');
        }
        
        let sumSquaredErrors = 0;
        for (let i = 0; i < readings.length; i++) {
            sumSquaredErrors += Math.pow(readings[i] - groundTruth[i], 2);
        }
        
        return Math.sqrt(sumSquaredErrors / readings.length);
    },
    
    calculateMAE: (readings, groundTruth) => {
        if (readings.length !== groundTruth.length) {
            throw new Error('Readings and ground truth must have same length');
        }
        
        let sumAbsoluteErrors = 0;
        for (let i = 0; i < readings.length; i++) {
            sumAbsoluteErrors += Math.abs(readings[i] - groundTruth[i]);
        }
        
        return sumAbsoluteErrors / readings.length;
    }
};

export default FLUXUS_SENSOR_OPERATORS;
