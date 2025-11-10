// FILENAME: src/lib/network/mqtt.js
// Fluxus MQTT Protocol Operators for IoT and Messaging

/**
 * MQTT operators for Internet of Things (IoT) and real-time messaging
 * Provides MQTT client functionality for publish/subscribe patterns
 */

export const MQTT_OPERATORS = {
    /**
     * Connect to MQTT broker
     * @param {any} input - Connection configuration
     * @param {Array} args - [brokerUrl, options] MQTT broker URL and options
     * @param {Object} context - Execution context
     * @returns {Object} MQTT connection object
     */
    'mqtt_connect': (input, args, context) => {
        const brokerUrl = args[0] || 'ws://localhost:8883';
        const options = args[1] ? JSON.parse(args[1]) : {
            clientId: 'fluxus_client_' + Math.random().toString(16).substr(2, 8),
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000
        };
        
        // Mock implementation for browser/Node.js compatibility
        // In real implementation, this would use an MQTT library
        
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
            mock: true // Flag for mock implementation
        };
        
        context.engine._mqttConnections.set(connectionId, connection);
        
        // Simulate connection process
        setTimeout(() => {
            connection.connected = true;
            console.log(`🔗 MQTT connected to ${brokerUrl} (mock)`);
        }, 100);
        
        return {
            connectionId: connectionId,
            status: 'connecting',
            url: brokerUrl,
            clientId: options.clientId,
            mock: true
        };
    },
    
    /**
     * Subscribe to MQTT topic
     * @param {any} input - MQTT connection or topic
     * @param {Array} args - [topic, qos] Topic to subscribe to and QoS level
     * @param {Object} context - Execution context
     * @returns {Object} Subscription information
     */
    'mqtt_subscribe': (input, args, context) => {
        const topic = args[0];
        const qos = parseInt(args[1]) || 0;
        
        if (!context.engine._mqttConnections) {
            return { error: 'No MQTT connections available' };
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
            return { error: 'MQTT connection not found' };
        }
        
        if (!connection.connected) {
            return { error: 'MQTT connection not established' };
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
            connectionId: connection.id
        };
    },
    
    /**
     * Publish message to MQTT topic
     * @param {any} input - Message data
     * @param {Array} args - [topic, qos, retain] Publishing parameters
     * @param {Object} context - Execution context
     * @returns {Object} Publication result
     */
    'mqtt_publish': (input, args, context) => {
        const topic = args[0];
        const qos = parseInt(args[1]) || 0;
        const retain = args[2] === 'true';
        
        if (!topic) {
            return { error: 'Topic is required for MQTT publish' };
        }
        
        if (!context.engine._mqttConnections) {
            return { error: 'No MQTT connections available' };
        }
        
        let connection;
        
        // Find connection from input or use first available
        if (input && input.connectionId) {
            connection = context.engine._mqttConnections.get(input.connectionId);
        } else {
            connection = context.engine._mqttConnections.values().next().value;
        }
        
        if (!connection) {
            return { error: 'MQTT connection not found' };
        }
        
        if (!connection.connected) {
            return { error: 'MQTT connection not established' };
        }
        
        const message = {
            topic: topic,
            payload: input,
            qos: qos,
            retain: retain,
            timestamp: Date.now()
        };
        
        // In mock implementation, just log the message
        console.log(`📤 MQTT publish to ${topic}:`, input);
        
        // Simulate message delivery to subscribers
        if (connection.mock) {
            deliverMQTTMessage(connection, message, context);
        }
        
        return {
            published: true,
            topic: topic,
            messageId: 'msg_' + Date.now(),
            qos: qos,
            retain: retain,
            timestamp: message.timestamp
        };
    },
    
    /**
     * Unsubscribe from MQTT topic
     * @param {any} input - Subscription information
     * @param {Array} args - [topic] Topic to unsubscribe from
     * @param {Object} context - Execution context
     * @returns {Object} Unsubscription result
     */
    'mqtt_unsubscribe': (input, args, context) => {
        const topic = args[0];
        
        if (!context.engine._mqttConnections) {
            return { error: 'No MQTT connections available' };
        }
        
        let connection;
        
        if (input && input.connectionId) {
            connection = context.engine._mqttConnections.get(input.connectionId);
        } else {
            connection = context.engine._mqttConnections.values().next().value;
        }
        
        if (!connection) {
            return { error: 'MQTT connection not found' };
        }
        
        const wasSubscribed = connection.subscriptions.has(topic);
        connection.subscriptions.delete(topic);
        
        return {
            unsubscribed: wasSubscribed,
            topic: topic,
            connectionId: connection.id
        };
    },
    
    /**
     * Disconnect from MQTT broker
     * @param {any} input - Connection to disconnect
     * @param {Array} args - [connectionId] Specific connection to disconnect
     * @param {Object} context - Execution context
     * @returns {Object} Disconnection result
     */
    'mqtt_disconnect': (input, args, context) => {
        const connectionId = args[0] || (input && input.connectionId);
        
        if (!context.engine._mqttConnections) {
            return { error: 'No MQTT connections available' };
        }
        
        if (connectionId) {
            // Disconnect specific connection
            const connection = context.engine._mqttConnections.get(connectionId);
            if (connection) {
                connection.connected = false;
                context.engine._mqttConnections.delete(connectionId);
                
                return {
                    disconnected: true,
                    connectionId: connectionId,
                    subscriptions: connection.subscriptions.size
                };
            }
        } else {
            // Disconnect all connections
            const disconnected = [];
            context.engine._mqttConnections.forEach((connection, id) => {
                connection.connected = false;
                disconnected.push({
                    connectionId: id,
                    subscriptions: connection.subscriptions.size
                });
            });
            
            context.engine._mqttConnections.clear();
            
            return {
                disconnected: true,
                connections: disconnected,
                total: disconnected.length
            };
        }
        
        return { error: 'Connection not found' };
    },
    
    /**
     * Get MQTT connection status
     * @param {any} input - Connection to check
     * @param {Array} args - [connectionId] Specific connection to check
     * @param {Object} context - Execution context
     * @returns {Object} Connection status
     */
    'mqtt_status': (input, args, context) => {
        const connectionId = args[0] || (input && input.connectionId);
        
        if (!context.engine._mqttConnections) {
            return { connections: 0, status: 'no_connections' };
        }
        
        if (connectionId) {
            const connection = context.engine._mqttConnections.get(connectionId);
            if (connection) {
                return {
                    connectionId: connectionId,
                    connected: connection.connected,
                    url: connection.url,
                    subscriptions: Array.from(connection.subscriptions.keys()),
                    subscriptionCount: connection.subscriptions.size,
                    messageCount: connection.messageQueue.length
                };
            }
            return { error: 'Connection not found' };
        }
        
        // Return status of all connections
        const connections = [];
        context.engine._mqttConnections.forEach((connection, id) => {
            connections.push({
                connectionId: id,
                connected: connection.connected,
                url: connection.url,
                subscriptions: connection.subscriptions.size
            });
        });
        
        return {
            totalConnections: connections.length,
            connectedConnections: connections.filter(c => c.connected).length,
            connections: connections
        };
    },
    
    /**
     * Create MQTT message stream from topic
     * @param {any} input - Subscription configuration
     * @param {Array} args - [topic, transformLens] Topic and message transformation
     * @param {Object} context - Execution context
     * @returns {Object} Message stream configuration
     */
    'mqtt_stream': (input, args, context) => {
        const topic = args[0];
        const transformLens = args[1];
        
        if (!topic) {
            return { error: 'Topic is required for MQTT stream' };
        }
        
        // This would typically create a live stream of MQTT messages
        // For now, return a stream configuration object
        
        return {
            streamType: 'mqtt_topic',
            topic: topic,
            transform: transformLens,
            connected: true,
            mock: true,
            description: `MQTT message stream from topic: ${topic}`
        };
    }
};

// Helper functions for mock MQTT implementation
function simulateMQTTMessages(connection, topic, context) {
    // Simulate incoming MQTT messages for demonstration
    const messageTypes = {
        'sensors/temperature': () => ({
            temperature: 20 + Math.random() * 10,
            humidity: 40 + Math.random() * 30,
            timestamp: Date.now(),
            unit: 'celsius'
        }),
        'sensors/motion': () => ({
            motion: Math.random() > 0.7,
            intensity: Math.random(),
            timestamp: Date.now()
        }),
        'device/status': () => ({
            status: Math.random() > 0.1 ? 'online' : 'offline',
            battery: 20 + Math.random() * 80,
            uptime: Math.floor(Math.random() * 10000)
        })
    };
    
    const messageGenerator = messageTypes[topic] || (() => ({
        data: `Mock message for ${topic}`,
        value: Math.random(),
        timestamp: Date.now()
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
            qos: 0
        };
        
        // Store message
        connection.messageQueue.push(mqttMessage);
        
        // Notify subscribers (in real implementation, this would trigger stream updates)
        if (context.engine.debugMode) {
            console.log(`📨 MQTT message received on ${topic}:`, message);
        }
        
    }, 3000 + Math.random() * 7000); // Random interval between 3-10 seconds
    
    // Store interval for cleanup
    if (!connection.mockIntervals) {
        connection.mockIntervals = new Map();
    }
    connection.mockIntervals.set(topic, interval);
}

function deliverMQTTMessage(connection, message, context) {
    // In mock implementation, deliver to matching subscriptions
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
