// FILENAME: src/lib/index-impl.js
// Fluxus Library Implementation Re-exports - Production Grade

// Core libraries re-exports
export { CoreOperators } from './core/core.js';
export { TypeSystem, TYPES } from './core/types/index.js';
export { Collections } from './core/collections.js';

// Math libraries re-exports
export { FLUXUS_MATH_OPERATORS } from './math/math.js';
export { MathOperators, MathUtils } from './math/math.js';
export { STATS_OPERATORS as Statistics } from './math/stats.js';
export { trigonometry as Trigonometry } from './math/math.js';

// Text libraries re-exports
export { FLUXUS_STRING_OPERATORS } from './text/string.js';
export { StringOperators } from './text/string.js';
export { TextFormatting } from './text/format/index.js';
export { RegexUtils, Validators, Extractors } from './text/regex/index.js';

// Time libraries re-exports
export { TimeOperators } from './time/time.js';
export { DateTimeUtils, DateConstants } from './time/date/index.js';
export { TimeScheduler, Debouncer, Throttler } from './time/scheduler/index.js';

// Network libraries re-exports
export { HTTP_OPERATORS } from './network/http.js';
export { HTTPClient } from './network/http.js';
export { WEBSOCKET_OPERATORS } from './network/websocket.js';
export { WebSocketClient } from './network/websocket.js';
export { MQTT_OPERATORS } from './network/mqtt.js';
export { MQTTClient } from './network/mqtt.js';
export { NETWORK_OPERATORS, NetworkManager, NetworkUtils } from './network/index.js';

// Data processing re-exports
export { STREAM_OPERATORS as DataStreams } from './data/streams.js';
export { AGGREGATOR_OPERATORS as DataAggregators } from './data/aggregators.js';
export { TRANSDUCER_OPERATORS as DataTransducers } from './data/transducers.js';

// Domain libraries re-exports
export { FLUXUS_SENSOR_OPERATORS } from './domains/sensors.js';
export { HEALTH_OPERATORS } from './domains/health.js';
export { IOT_OPERATORS } from './domains/iot.js';
export { UI_OPERATORS } from './domains/ui.js';
export { ANALYTICS_OPERATORS } from './domains/analytics.js';

// Reactive system re-exports
export { ReactiveLenses } from './reactive/lenses.js';
export { ReactivePools } from './reactive/pools.js';
export { ReactiveSubscriptions } from './reactive/subscriptions.js';

// IO libraries re-exports
export { FileSystem } from './io/fs.js';
export { PathUtils } from './io/path.js';

// Security re-exports
export { SecurityManager, securityManager, TrustLevels, Permissions } from './security-manager.js';

// Hybrid mobile re-exports
export { HybridBridge } from './hybrid/index.js';

// Flux architecture re-exports
export { 
    FluxStore, 
    FluxActions, 
    FluxDispatcher,
    combineReducers, 
    createMiddleware,
    createStore,
    applyMiddleware,
    bindActionCreators,
    loggerMiddleware,
    thunkMiddleware,
    throttleMiddleware,
    debounceMiddleware,
    batchMiddleware,
    retryMiddleware,
    crashReporterMiddleware,
    analyticsMiddleware
} from './flux/index.js';

// Conflict resolution re-exports
export { 
    LibraryConflictResolver, 
    resolveLibraryConflict, 
    resolveOperatorConflict 
} from './conflict-resolver.js';

// Additional utility exports
export const LibraryConstants = {
    VERSION: '4.0.0',
    API_LEVEL: 4,
    SUPPORTED_PLATFORMS: ['node', 'browser', 'mobile'],
    DEFAULT_CONFIG: {
        enableSecurity: true,
        enablePerformanceMonitoring: true,
        maxOperators: 1000,
        cacheSize: 100
    }
};

// Operator categories for organization
export const OperatorCategories = {
    MATH: 'math',
    STRING: 'string',
    NETWORK: 'network',
    TIME: 'time',
    DATA: 'data',
    COLLECTIONS: 'collections',
    REACTIVE: 'reactive',
    DOMAINS: 'domains',
    SECURITY: 'security',
    CORE: 'core',
    FLUX: 'flux'
};

// Performance monitoring utilities
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.enabled = true;
    }

    startMeasurement(operation) {
        if (!this.enabled) return null;
        
        const measurement = {
            startTime: performance.now(),
            operation,
            id: `${operation}_${Date.now()}`
        };
        
        this.metrics.set(measurement.id, measurement);
        return measurement.id;
    }

    endMeasurement(measurementId) {
        if (!this.enabled || !this.metrics.has(measurementId)) return null;
        
        const measurement = this.metrics.get(measurementId);
        const endTime = performance.now();
        const duration = endTime - measurement.startTime;
        
        const result = {
            operation: measurement.operation,
            duration,
            startTime: measurement.startTime,
            endTime
        };
        
        this.metrics.delete(measurementId);
        return result;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    clear() {
        this.metrics.clear();
    }
}

// Export a default performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Library validation utilities
export const LibraryValidator = {
    validateOperator(operator) {
        const errors = [];
        const warnings = [];

        if (!operator.name) {
            errors.push('Operator must have a name');
        }

        if (typeof operator.implementation !== 'function') {
            errors.push('Operator must have a function implementation');
        }

        if (!operator.metadata) {
            warnings.push('Operator should have metadata');
        } else {
            if (!operator.metadata.category) {
                warnings.push('Operator should have a category');
            }
            if (!operator.metadata.description) {
                warnings.push('Operator should have a description');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    },

    validateLibrary(library) {
        const errors = [];
        const warnings = [];

        if (!library.name) {
            errors.push('Library must have a name');
        }

        if (!library.version) {
            warnings.push('Library should have a version');
        }

        if (!library.operators || Object.keys(library.operators).length === 0) {
            warnings.push('Library should have operators');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
};

// Export everything as a single object for easy importing
export default {
    // Core
    CoreOperators,
    TypeSystem,
    Collections,
    
    // Math
    FLUXUS_MATH_OPERATORS,
    MathOperators,
    MathUtils,
    Statistics,
    Trigonometry,
    
    // Text
    FLUXUS_STRING_OPERATORS,
    StringOperators,
    TextFormatting,
    RegexUtils,
    Validators,
    Extractors,
    
    // Time
    TimeOperators,
    DateTimeUtils,
    DateConstants,
    TimeScheduler,
    Debouncer,
    Throttler,
    
    // Network
    HTTP_OPERATORS,
    HTTPClient,
    WEBSOCKET_OPERATORS,
    WebSocketClient,
    MQTT_OPERATORS,
    MQTTClient,
    NETWORK_OPERATORS,
    NetworkManager,
    NetworkUtils,
    
    // Data
    DataStreams,
    DataAggregators,
    DataTransducers,
    
    // Domains
    FLUXUS_SENSOR_OPERATORS,
    HEALTH_OPERATORS,
    IOT_OPERATORS,
    UI_OPERATORS,
    ANALYTICS_OPERATORS,
    
    // Reactive
    ReactiveLenses,
    ReactivePools,
    ReactiveSubscriptions,
    
    // Security
    SecurityManager,
    securityManager,
    TrustLevels,
    Permissions,
    
    // Flux
    FluxStore,
    FluxActions,
    FluxDispatcher,
    
    // Utilities
    LibraryConstants,
    OperatorCategories,
    performanceMonitor,
    PerformanceMonitor,
    LibraryValidator
};
