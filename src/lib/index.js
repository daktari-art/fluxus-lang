// FILENAME: src/lib/index.js - CORRECTED TO MATCH ACTUAL EXPORTS
// Fluxus Standard Library Main Index

// ==================== DOMAIN LIBRARIES ====================
export { default as HEALTH_OPERATORS } from './domains/health.js';
export { default as IOT_OPERATORS } from './domains/iot.js';
export { default as UI_OPERATORS } from './domains/ui.js';
export { default as ANALYTICS_OPERATORS } from './domains/analytics.js';
export { default as FLUXUS_SENSOR_OPERATORS } from './domains/sensors.js';

// ==================== DATA AND COLLECTIONS ====================
export { DataStreams } from './data/streams.js';
export { DataAggregators } from './data/aggregators.js';
export { DataTransducers } from './data/transducers.js';

// ==================== MATH LIBRARIES ====================
export {
  FLUXUS_MATH_OPERATORS,
  MathUtils,
  sin, cos, tan,
  trigonometry,
  statistics
} from './math/math.js';

export {
  Statistics,
  STATS_INDEX,
  mean, median, sum, stddev, variance, average, max_value, min_value
} from './math/stats/index.js';

export {
  Trigonometry,
  TRIG_INDEX,
  asin, acos, atan, atan2
} from './math/trig/index.js';

// ==================== TEXT UTILITIES ====================
export { default as TextFormatting } from './text/format/index.js';
export {
  RegexUtils,
  Validators,
  Extractors
} from './text/regex/index.js';
export {
  FLUXUS_STRING_OPERATORS as StringOperators,
  STRING_LENS_UTILITIES
} from './text/string.js';

// ==================== TIME UTILITIES ====================
export {
  default as DateTimeUtils,
  DateConstants
} from './time/date/index.js';

export {
  default as TimeScheduler,
  Debouncer,
  Throttler
} from './time/scheduler/index.js';

export {
  FLUXUS_TIME_OPERATORS as TimeOperators,
  scheduling
} from './time/time.js';

// ==================== NETWORK UTILITIES ====================
export {
  HTTP_OPERATORS,
  HTTPClient
} from './network/http.js';

export {
  default as MQTT_OPERATORS,
  mqtt_connect, mqtt_subscribe, mqtt_publish, mqtt_unsubscribe,
  mqtt_disconnect, mqtt_status, mqtt_stream
} from './network/mqtt.js';

export { WEBSOCKET_OPERATORS } from './network/websocket.js';

// ==================== REACTIVE SYSTEM ====================
export { ReactiveLenses } from './reactive/lenses.js';
export { ReactivePools } from './reactive/pools.js';
export { ReactiveSubscriptions } from './reactive/subscriptions.js';

// ==================== SECURITY ====================
export {
  SecurityManager,
  securityManager,
  TrustLevels,
  Permissions,
  SecurityError
} from './security-manager.js';

// ==================== HYBRID MOBILE ====================
export { default as HybridBridge } from './hybrid/index.js';

// ==================== FLUX ARCHITECTURE ====================
export {
  FluxStore,
  FluxActions,
  combineReducers,
  createMiddleware,
  loggerMiddleware,
  thunkMiddleware,
  crashReporterMiddleware,
  analyticsMiddleware,
  throttleMiddleware,
  debounceMiddleware
} from './flux/index.js';

// ==================== LIBRARY CONFLICT RESOLUTION ====================
export {
  resolveLibraryConflict,
  conflictResolver
} from './library-conflict-resolver.js';

export {
  resolveOperatorConflict
} from './conflict-resolver.js';

// ==================== CORE FUNCTIONALITY ====================
import { performance } from 'perf_hooks';

export class OperatorsRegistry {
    constructor() {
        this.operators = new Map();
        this.categories = new Map();
        this.domains = new Map();
        this.initialized = false;
        this.typeSystem = this.createTypeSystem();
    }

    createTypeSystem() {
        return {
            isString: (val) => typeof val === 'string',
            isNumber: (val) => typeof val === 'number' && !isNaN(val),
            isArray: (val) => Array.isArray(val),
            isObject: (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
            getType: (val) => {
                if (val === null) return 'null';
                if (val === undefined) return 'undefined';
                if (Array.isArray(val)) return 'array';
                return typeof val;
            }
        };
    }

    registerCoreOperators() {
        this.registerOperator('is_string',
            (input) => this.typeSystem.isString(input),
            { category: 'core', description: 'Check if value is a string', domain: 'core' }
        );

        this.registerOperator('is_number',
            (input) => this.typeSystem.isNumber(input),
            { category: 'core', description: 'Check if value is a number', domain: 'core' }
        );

        this.registerOperator('length',
            (input) => {
                if (this.typeSystem.isArray(input) || this.typeSystem.isString(input)) {
                    return input.length;
                }
                if (this.typeSystem.isObject(input)) {
                    return Object.keys(input).length;
                }
                return 0;
            },
            { category: 'core', description: 'Get length of array, string, or object', domain: 'core' }
        );

        this.registerOperator('print',
            (input, args, context) => {
                const message = args.length > 0 ? args[0] : input;
                console.log('📝', message);
                return message;
            },
            { category: 'core', description: 'Print value to console', domain: 'core' }
        );

        console.log('✅ Core operators registered');
    }

    initialize() {
        if (this.initialized) return;
        this.registerCategory('core', 'Core operations');
        this.registerCategory('math', 'Mathematical operations');
        this.registerCoreOperators();
        this.initialized = true;
    }

    registerOperator(name, implementation, metadata = {}) {
        if (this.operators.has(name)) {
            throw new Error(`Operator already registered: ${name}`);
        }
        const operator = {
            name,
            implementation,
            metadata: { 
                category: metadata.category || 'general', 
                domain: metadata.domain || 'core',
                ...metadata 
            }
        };
        this.operators.set(name, operator);

        if (!this.categories.has(operator.metadata.category)) {
            this.categories.set(operator.metadata.category, new Set());
        }
        this.categories.get(operator.metadata.category).add(name);
        
        if (!this.domains.has(operator.metadata.domain)) {
            this.domains.set(operator.metadata.domain, new Set());
        }
        this.domains.get(operator.metadata.domain).add(name);
        
        return operator;
    }

    getOperator(name) {
        const operator = this.operators.get(name);
        if (!operator) throw new Error(`Operator not found: ${name}`);
        return operator;
    }

    executeOperator(name, input, args = [], context = {}) {
        const operator = this.getOperator(name);
        return operator.implementation(input, args, context);
    }

    registerCategory(name, description) {
        if (!this.categories.has(name)) {
            this.categories.set(name, new Set());
        }
        return { name, description };
    }

    getAllOperators() {
        return Array.from(this.operators.values());
    }

    getDomains() {
        const domains = new Set();
        for (const operator of this.operators.values()) {
            if (operator.metadata.domain) {
                domains.add(operator.metadata.domain);
            }
        }
        return Array.from(domains);
    }

    getOperatorsByDomain(domain) {
        const operators = [];
        for (const operator of this.operators.values()) {
            if (operator.metadata.domain === domain) {
                operators.push(operator);
            }
        }
        return operators;
    }
// ADD THIS TO OperatorsRegistry class:

getDomainOperators(domainName) {
    const operators = {};
    for (const operator of this.operators.values()) {
        if (operator.metadata.domain === domainName) {
            operators[operator.name] = {
                implementation: operator.implementation,
                metadata: operator.metadata
            };
        }
    }
    return operators;
}
}

export class FluxusLibrary {
    constructor(config = {}) {
        this.config = config;
        this.loadedLibraries = new Set();
        this.operatorsRegistry = new OperatorsRegistry();
        this.operatorsRegistry.initialize();
        console.log('📚 FluxusLibrary initialized');
    }

    loadLibrary(libraryName) {
        if (this.loadedLibraries.has(libraryName)) return true;
        this.loadedLibraries.add(libraryName);
        return true;
    }

    getOperator(operatorName) {
        return this.operatorsRegistry.getOperator(operatorName);
    }

    executeOperator(operatorName, input, args = [], context = {}) {
        return this.operatorsRegistry.executeOperator(operatorName, input, args, context);
    }
}

export const operatorsRegistry = new OperatorsRegistry();
operatorsRegistry.initialize();

export const Library = new FluxusLibrary();
export default Library;
