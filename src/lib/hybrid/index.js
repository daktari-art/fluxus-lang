// FILENAME: src/lib/hybrid/index.js
// Hybrid Mobile-Native Integration - Production Grade

export class HybridBridge {
    constructor(config = {}) {
        this.config = {
            enableNativeCalls: config.enableNativeCalls !== false,
            enableWebCalls: config.enableWebCalls !== false,
            timeout: config.timeout || 5000,
            ...config
        };

        this.callbacks = new Map();
        this.messageId = 0;
        this.isNative = this.detectNativeEnvironment();
        
        this.initializeBridge();
    }

    detectNativeEnvironment() {
        // Detect if running in native mobile environment
        return typeof window !== 'undefined' && 
               (window.webkit && window.webkit.messageHandlers || 
                window.Android || 
                window.ReactNativeWebView);
    }

    initializeBridge() {
        if (typeof window === 'undefined') return;

        // Set up message listener for web-to-native communication
        if (this.config.enableNativeCalls) {
            window.addEventListener('message', this.handleMessage.bind(this));
        }

        // Set up native message handler for native-to-web communication
        if (this.isNative && this.config.enableWebCalls) {
            this.setupNativeMessageHandler();
        }
    }

    // Call native functions from web
    async callNative(method, data = {}) {
        if (!this.config.enableNativeCalls) {
            throw new Error('Native calls are disabled');
        }

        return new Promise((resolve, reject) => {
            const messageId = this.generateMessageId();
            
            // Store callback for response
            this.callbacks.set(messageId, { resolve, reject });

            // Send message to native
            this.sendToNative({
                id: messageId,
                method,
                data,
                timestamp: Date.now()
            });

            // Set timeout for response
            setTimeout(() => {
                if (this.callbacks.has(messageId)) {
                    this.callbacks.delete(messageId);
                    reject(new Error(`Native call timeout: ${method}`));
                }
            }, this.config.timeout);
        });
    }

    // Call web functions from native
    async callWeb(method, data = {}) {
        if (!this.config.enableWebCalls) {
            throw new Error('Web calls are disabled');
        }

        return new Promise((resolve, reject) => {
            const messageId = this.generateMessageId();
            
            this.callbacks.set(messageId, { resolve, reject });

            // Send message to web context
            this.sendToWeb({
                id: messageId,
                method,
                data,
                timestamp: Date.now()
            });

            setTimeout(() => {
                if (this.callbacks.has(messageId)) {
                    this.callbacks.delete(messageId);
                    reject(new Error(`Web call timeout: ${method}`));
                }
            }, this.config.timeout);
        });
    }

    // Handle incoming messages
    handleMessage(event) {
        try {
            const message = event.data;
            
            if (message && message.type === 'hybrid_response') {
                this.handleResponse(message);
            } else if (message && message.type === 'hybrid_request') {
                this.handleRequest(message);
            }
        } catch (error) {
            console.error('Error handling hybrid message:', error);
        }
    }

    handleResponse(message) {
        const callback = this.callbacks.get(message.id);
        if (!callback) return;

        this.callbacks.delete(message.id);

        if (message.success) {
            callback.resolve(message.data);
        } else {
            callback.reject(new Error(message.error));
        }
    }

    async handleRequest(message) {
        try {
            const result = await this.executeMethod(message.method, message.data);
            
            this.sendResponse(message.id, {
                success: true,
                data: result
            });
        } catch (error) {
            this.sendResponse(message.id, {
                success: false,
                error: error.message
            });
        }
    }

    // Method execution
    async executeMethod(method, data) {
        // This would be extended with registered methods
        const methods = {
            'getDeviceInfo': this.getDeviceInfo.bind(this),
            'getAppVersion': this.getAppVersion.bind(this),
            'showToast': this.showToast.bind(this),
            'vibrate': this.vibrate.bind(this)
        };

        const handler = methods[method];
        if (!handler) {
            throw new Error(`Unknown method: ${method}`);
        }

        return handler(data);
    }

    // Native method implementations
    getDeviceInfo() {
        return {
            platform: this.getPlatform(),
            version: this.getOSVersion(),
            model: this.getDeviceModel(),
            uuid: this.getDeviceUUID(),
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    getAppVersion() {
        // This would be provided by the native side
        return '1.0.0';
    }

    showToast(message) {
        // Show native toast
        if (this.isIOS()) {
            return this.callNative('showToast', { message });
        } else if (this.isAndroid()) {
            return this.callNative('showToast', { message });
        } else {
            // Fallback to web notification
            console.log('Toast:', message);
        }
    }

    vibrate(duration = 200) {
        // Trigger device vibration
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        } else {
            return this.callNative('vibrate', { duration });
        }
    }

    // Platform detection
    getPlatform() {
        if (this.isIOS()) return 'ios';
        if (this.isAndroid()) return 'android';
        if (this.isWeb()) return 'web';
        return 'unknown';
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    isWeb() {
        return !this.isNative;
    }

    getOSVersion() {
        // Simplified version detection
        const ua = navigator.userAgent;
        if (this.isIOS()) {
            const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
            return match ? match[0].replace('_', '.') : 'unknown';
        }
        if (this.isAndroid()) {
            const match = ua.match(/Android (\d+\.\d+)/);
            return match ? match[1] : 'unknown';
        }
        return 'unknown';
    }

    getDeviceModel() {
        const ua = navigator.userAgent;
        if (this.isIOS()) {
            const match = ua.match(/iPhone|iPad|iPod/);
            return match ? match[0] : 'iOS Device';
        }
        if (this.isAndroid()) {
            const match = ua.match(/Android.*Build\/([^\)]+)/);
            return match ? match[1] : 'Android Device';
        }
        return 'Web Browser';
    }

    getDeviceUUID() {
        // Generate a persistent UUID for the device
        let uuid = localStorage.getItem('device_uuid');
        if (!uuid) {
            uuid = this.generateUUID();
            localStorage.setItem('device_uuid', uuid);
        }
        return uuid;
    }

    // Message sending
    sendToNative(message) {
        if (this.isIOS() && window.webkit && window.webkit.messageHandlers) {
            window.webkit.messageHandlers.fluxus.postMessage(message);
        } else if (this.isAndroid() && window.Android) {
            window.Android.postMessage(JSON.stringify(message));
        } else if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } else {
            throw new Error('No native bridge available');
        }
    }

    sendToWeb(message) {
        if (typeof window !== 'undefined') {
            window.postMessage({
                type: 'hybrid_response',
                ...message
            }, '*');
        }
    }

    sendResponse(messageId, response) {
        this.sendToWeb({
            id: messageId,
            type: 'hybrid_response',
            ...response
        });
    }

    // Utility methods
    generateMessageId() {
        return `msg_${this.messageId++}_${Date.now()}`;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Cleanup
    dispose() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.handleMessage.bind(this));
        }
        this.callbacks.clear();
    }
}

export default HybridBridge;
