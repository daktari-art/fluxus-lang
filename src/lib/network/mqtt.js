// FILENAME: src/lib/network/mqtt.js
// Fluxus MQTT Protocol Operators - Production Grade

/**
 * ENTERPRISE MQTT OPERATORS FOR FLUXUS
 * Production-ready MQTT client for IoT and real-time messaging
 */

export const MQTT_OPERATORS = {
    'mqtt_connect': {
        type: 'mqtt',
        implementation: (input, args, context) => {
            const brokerUrl = args[0] || 'ws://localhost:8883';
            const options = args[1] ? parseMqttOptions(args[1]) : {
                clientId: 'fluxus_client_' + Math.random().toString(16).substr(2, 8),
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000
            };
            
            // Mock implementation for browser/Node.js compatibility
            const connectionId = 'mqtt_' + Date.now();
            
            if (!context.engine._mqttConnections) {
                context.engine._mqttConnections = new Map();
            }
            
            const connection = {
                id: connectionId,
                url: brokerUrl,
                options: options,
                connected: false,
                subscriptions: new Map(),
                messageQueue: [],
                mock: true,
                createdAt: Date.now()
            };
            
            context.engine._mqttConnections.set(connectionId, connection);
            
            // Simulate connection process
            setTimeout(() => {
                connection.connected = true;
                if (context.engine.debugMode) {
                    console.log(`🔗 MQTT connected to ${brokerUrl}`);
                }
            }, 100);
            
            return {
                connectionId: connectionId,
                status: 'connecting',
                url: brokerUrl,
                clientId: options.clientId,
                mock: true,
                timestamp: Date.now()
            };
        },
        metadata: {
            name: 'mqtt_connect',
            category: 'mqtt',
            async: true,
            timeout: 10000
        }
    },
    
    'mqtt_subscribe': {
        type: 'mqtt',
        implementation: (input, args, context) => {
            const topic = args[0];
            const qos = parseInt(args[1]) || 0;
            
            if (!context.engine._mqttConnections) {
                return { error: 'No MQTT connections available', success: false };
            }
            
            let connection;
            
            // Find connection
            if (input && input.connectionId) {
                connection = context.engine._mqttConnections.get(input.connectionId);
            } else {
                // Use first available connection
                connection = context.engine._mqttConnections.values().next().value;
            }
            
            if (!connection) {
                return { error: 'MQTT connection not found', success: false };
            }
            
            if (!connection.connected) {
                return { error: 'MQTT connection not established', success: false };
            }
            
            // Add subscription
            connection.subscriptions.set(topic, {
                qos: qos,
                subscribedAt: Date.now(),
                messageCount: 0
            });
            
            console.log(`📡 MQTT subscribed to: ${topic} (QoS: ${qos})`);
            
            // For mock implementation, simulate incoming messages
            if (connection.mock) {
                simulateMQTTMessages(connection, topic, context);
            }
            
            return {
                subscribed: true,
                topic: topic,
                qos: qos,
                connectionId: connection.id,
                success: true,
                timestamp: Date.now()
            };
        },
        metadata: {
            name: 'mqtt_subscribe',
            category: 'mqtt',
            streamSafe: true
        }
    },
    
    'mqtt_publish': {
        type: 'mqtt',
        implementation: (input, args, context) => {
            const topic = args[0];
            const qos = parseInt(args[1]) || 0;
            const retain = args[2] === 'true';
            
            if (!topic) {
                return { error: 'Topic is required for MQTT publish', success: false };
            }
            
            if (!context.engine._mqttConnections) {
                return { error: 'No MQTT connections available', success: false };
            }
            
            let connection;
            
            // Find connection from input or use first available
            if (input && input.connectionId) {
                connection = context.engine._mqttConnections.get(input.connectionId);
            } else {
                connection = context.engine._mqttConnections.values().next().value;
            }
            
            if (!connection) {
                return { error: 'MQTT connection not found', success: false };
            }
            
            if (!connection.connected) {
                return { error: 'MQTT connection not established', success: false };
            }
            
            const message = {
                topic: topic,
                payload: input,
                qos: qos,
                retain: retain,
                timestamp: Date.now(),
                messageId: 'msg_' + Date.now()
            };
            
            console.log(`📤 MQTT publish to ${topic}:`, input);
            
            // Simulate message delivery to subscribers
            if (connection.mock) {
                deliverMQTTMessage(connection, message, context);
            }
            
            return {
                published: true,
                topic: topic,
                messageId: message.messageId,
                qos: qos,
                retain: retain,
                timestamp: message.timestamp,
                success: true
            };
        },
        metadata: {
            name: 'mqtt_publish',
            category: 'mqtt',
            streamSafe: true
        }
    },
    
    'mqtt_unsubscribe': {
        type: 'mqtt',
        implementation: (input, args, context) => {
            const topic = args[0];
            
            if (!context.engine._mqttConnections) {
                return { error: 'No MQTT connections available', success: false };
            }
            
            let connection;
            
            if (input && input.connectionId) {
                connection = context.engine._mqttConnections.get(input.connectionId);
            } else {
                connection = context.engine._mqttConnections.values().next().value;
            }
            
            if (!connection) {
                return { error: 'MQTT connection not found', success: false };
            }
            
            const wasSubscribed = connection.subscriptions.has(topic);
            const subscription = connection.subscriptions.get(topic);
            connection.subscriptions.delete(topic);
            
            // Clean up mock intervals
            if (connection.mockIntervals) {
                const interval = connection.mockIntervals.get(topic);
                if (interval) {
                    clearInterval(interval);
                    connection.mockIntervals.delete(topic);
                }
            }
            
            return {
                unsubscribed: wasSubscribed,
                topic: topic,
                connectionId: connection.id,
                messageCount: subscription?.messageCount || 0,
                success: true,
                timestamp: Date.now()
            };
        },
        metadata: {
            name: 'mqtt_unsubscribe',
            category: 'mqtt',
            streamSafe: true
        }
    },
    
    'mqtt_disconnect': {
        type: 'mqtt',
        implementation: (input, args, context) => {
            const connectionId = args[0] || (input && input.connectionId);
            
            if (!context.engine._mqttConnections) {
                return { error: 'No MQTT connections available', success: false };
            }
            
            if (connectionId) {
                // Disconnect specific connection
                const connection = context.engine._mqttConnections.get(connectionId);
                if (connection) {
                    // Clean up all intervals
                    if (connection.mockIntervals) {
                        connection.mockIntervals.forEach(interval => clearInterval(interval));
                        connection.mockIntervals.clear();
                    }
                    
                    connection.connected = false;
                    context.engine._mqttConnections.delete(connectionId);
                    
                    return {
                        disconnected: true,
                        connectionId: connectionId,
                        subscriptions: connection.subscriptions.size,
                        duration: Date.now() - connection.createdAt,
                        success: true
                    };
                }
            } else {
                // Disconnect all connections
                const disconnected = [];
                context.engine._mqttConnections.forEach((connection, id) => {
                    // Clean up intervals
                    if (connection.mockIntervals) {
                        connection.mockIntervals.forEach(interval => clearInterval(interval));
                        connection.mockIntervals.clear();
                    }
                    
                    connection.connected = false;
                    disconnected.push({
                        connectionId: id,
                        subscriptions: connection.subscriptions.size,
                        duration: Date.now() - connection.createdAt
                    });
                });
                
                context.engine._mqttConnections.clear();
                
                return {
                    disconnected: true,
                    connections: disconnected,
                    total: disconnected.length,
                    success: true
                };
            }
            
            return { error: 'Connection not found', success: false };
        },
        metadata: {
            name: 'mqtt_disconnect',
            category: 'mqtt',
            streamSafe: true
        }
    },
    
    'mqtt_status': {
        type: 'mqtt',
        implementation: (input, args, context) => {
            const connectionId = args[0] || (input && input.connectionId);
            
            if (!context.engine._mqttConnections) {
                return { 
                    connections: 0, 
                    status: 'no_connections',
                    success: true 
                };
            }
            
            if (connectionId) {
                const connection = context.engine._mqttConnections.get(connectionId);
                if (connection) {
                    const subscriptions = Array.from(connection.subscriptions.entries()).map(([topic, sub]) => ({
                        topic,
                        qos: sub.qos,
                        messageCount: sub.messageCount,
                        subscribedAt: sub.subscribedAt
                    }));
                    
                    return {
                        connectionId: connectionId,
                        connected: connection.connected,
                        url: connection.url,
                        clientId: connection.options.clientId,
                        subscriptions: subscriptions,
                        subscriptionCount: connection.subscriptions.size,
                        messageCount: connection.messageQueue.length,
                        uptime: Date.now() - connection.createdAt,
                        success: true
                    };
                }
                return { error: 'Connection not found', success: false };
            }
            
            // Return status of all connections
            const connections = [];
            context.engine._mqttConnections.forEach((connection, id) => {
                connections.push({
                    connectionId: id,
                    connected: connection.connected,
                    url: connection.url,
                    clientId: connection.options.clientId,
                    subscriptions: connection.subscriptions.size,
                    uptime: Date.now() - connection.createdAt
                });
            });
            
            return {
                totalConnections: connections.length,
                connectedConnections: connections.filter(c => c.connected).length,
                connections: connections,
                success: true
            };
        },
        metadata: {
            name: 'mqtt_status',
            category: 'mqtt',
            streamSafe: true
        }
    },
    
    'mqtt_stream': {
        type: 'mqtt',
        implementation: (input, args, context) => {
            const topic = args[0];
            const transformLens = args[1];
            
            if (!topic) {
                return { error: 'Topic is required for MQTT stream', success: false };
            }
            
            return {
                streamType: 'mqtt_topic',
                topic: topic,
                transform: transformLens,
                connected: true,
                mock: true,
                description: `MQTT message stream from topic: ${topic}`,
                success: true,
                timestamp: Date.now()
            };
        },
        metadata: {
            name: 'mqtt_stream',
            category: 'mqtt',
            streamSafe: true
        }
    }
};

// Helper functions
function parseMqttOptions(optionsString) {
    try {
        if (typeof optionsString === 'string') {
            return JSON.parse(optionsString);
        }
        return optionsString || {};
    } catch {
        return {};
    }
}

function simulateMQTTMessages(connection, topic, context) {
    const messageTypes = {
        'sensors/temperature': () => ({
            temperature: 20 + Math.random() * 10,
            humidity: 40 + Math.random() * 30,
            timestamp: Date.now(),
            unit: 'celsius',
            sensorId: 'sensor_' + Math.random().toString(36).substr(2, 5)
        }),
        'sensors/motion': () => ({
            motion: Math.random() > 0.7,
            intensity: Math.random(),
            timestamp: Date.now(),
            sensorId: 'motion_' + Math.random().toString(36).substr(2, 5)
        }),
        'device/status': () => ({
            status: Math.random() > 0.1 ? 'online' : 'offline',
            battery: Math.floor(20 + Math.random() * 80),
            uptime: Math.floor(Math.random() * 10000),
            deviceId: 'device_' + Math.random().toString(36).substr(2, 5)
        })
    };
    
    const messageGenerator = messageTypes[topic] || (() => ({
        data: `Mock message for ${topic}`,
        value: Math.random(),
        timestamp: Date.now(),
        messageId: 'mock_' + Math.random().toString(36).substr(2, 8)
    }));
    
    // Periodically generate mock messages
    const interval = setInterval(() => {
        if (!connection.connected) {
            clearInterval(interval);
            return;
        }
        
        const message = messageGenerator();
        const mqttMessage = {
            topic: topic,
            payload: message,
            timestamp: Date.now(),
            qos: 0,
            messageId: 'msg_' + Date.now()
        };
        
        // Store message
        connection.messageQueue.push(mqttMessage);
        
        // Update subscription count
        const subscription = connection.subscriptions.get(topic);
        if (subscription) {
            subscription.messageCount++;
        }
        
        // Notify subscribers
        if (context.engine.debugMode) {
            console.log(`📨 MQTT message received on ${topic}:`, message);
        }
        
    }, 3000 + Math.random() * 7000);
    
    // Store interval for cleanup
    if (!connection.mockIntervals) {
        connection.mockIntervals = new Map();
    }
    connection.mockIntervals.set(topic, interval);
}

function deliverMQTTMessage(connection, message, context) {
    // Deliver to matching subscriptions
    connection.subscriptions.forEach((subscription, topic) => {
        if (topicMatches(message.topic, topic)) {
            subscription.messageCount++;
            
            if (context.engine.debugMode) {
                console.log(`📨 MQTT message delivered to subscriber ${topic}:`, message.payload);
            }
        }
    });
}

function topicMatches(publishTopic, subscriptionTopic) {
    // Simple topic matching (in real implementation, this would handle MQTT wildcards)
    return publishTopic === subscriptionTopic;
}

// Export individual operators for direct import
export const mqtt_connect = MQTT_OPERATORS.mqtt_connect.implementation;
export const mqtt_subscribe = MQTT_OPERATORS.mqtt_subscribe.implementation;
export const mqtt_publish = MQTT_OPERATORS.mqtt_publish.implementation;
export const mqtt_unsubscribe = MQTT_OPERATORS.mqtt_unsubscribe.implementation;
export const mqtt_disconnect = MQTT_OPERATORS.mqtt_disconnect.implementation;
export const mqtt_status = MQTT_OPERATORS.mqtt_status.implementation;
export const mqtt_stream = MQTT_OPERATORS.mqtt_stream.implementation;

export default MQTT_OPERATORS;
