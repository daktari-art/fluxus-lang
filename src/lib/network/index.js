// FILENAME: src/lib/network/index.js
// Fluxus Network Library - Production Grade

export { HTTP_OPERATORS } from './http.js';
export { WEBSOCKET_OPERATORS } from './websocket.js';
export { MQTT_OPERATORS } from './mqtt.js';

// Combined network operators
export const NETWORK_OPERATORS = {
    ...HTTP_OPERATORS,
    ...WEBSOCKET_OPERATORS,
    ...MQTT_OPERATORS
};

// Domain registration for Fluxus engine
export const registerNetworkDomain = (engine) => {
    const operators = NETWORK_OPERATORS;
    let registeredCount = 0;
    
    for (const [name, implementation] of Object.entries(operators)) {
        if (!engine.operators.has(name)) {
            engine.operators.set(name, engine.createProductionOperatorWrapper(name, {
                implementation,
                library: 'network',
                type: 'network',
                domain: 'network',
                async: true, // Most network ops are async
                timeout: 30000 // 30 second default timeout
            }));
            registeredCount++;
        }
    }
    
    console.log(`   🌐 Network domain registered: ${registeredCount} operators`);
    return registeredCount;
};

// Export for backward compatibility
export const HTTPClient = HTTP_OPERATORS;
export const WebSocketClient = WEBSOCKET_OPERATORS;
export const MQTTClient = MQTT_OPERATORS;

// Network utilities
export const NetworkUtils = {
    validateUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    parseHeaders: (headersString) => {
        const headers = {};
        if (typeof headersString === 'string') {
            headersString.split('\n').forEach(line => {
                const [key, value] = line.split(':').map(s => s.trim());
                if (key && value) headers[key] = value;
            });
        }
        return headers;
    },
    
    generateRequestId: () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    
    sanitizeUrl: (url) => {
        try {
            const urlObj = new URL(url);
            // Remove sensitive data from URL
            if (urlObj.password) urlObj.password = '***';
            return urlObj.toString();
        } catch {
            return url;
        }
    }
};
export const NetworkManager = NETWORK_OPERATORS;

export default NETWORK_OPERATORS;
