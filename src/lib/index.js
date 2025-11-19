// FILENAME: src/lib/index.js
// Fluxus Standard Library Main Index - Production Grade (Core-Free)

// Domain libraries
export { HEALTH_OPERATORS } from './domains/health.js';
export { IOT_OPERATORS } from './domains/iot.js';
export { UI_OPERATORS } from './domains/ui.js';
export { ANALYTICS_OPERATORS } from './domains/analytics.js';
export { FLUXUS_SENSOR_OPERATORS } from './domains/sensors.js';

// Data and collections (includes core functionality)
export { DataStreams } from './data/streams.js';
export { DataAggregators } from './data/aggregators.js';
export { DataTransducers } from './data/transducers.js';

// Math libraries
export { MathUtils } from './math/math.js';
export { Statistics } from './math/stats/index.js';
export { Trigonometry } from './math/trig/index.js';

// Text utilities
export { TextFormatting } from './text/format/index.js';
export { RegexUtils, Validators, Extractors } from './text/regex/index.js';
export { StringOperators } from './text/string.js';

// Time utilities
export { DateTimeUtils, DateConstants } from './time/date/index.js';
export { TimeScheduler, Debouncer, Throttler } from './time/scheduler/index.js';
export { TimeOperators } from './time/time.js';

// Network utilities
export { HTTPClient } from './network/http.js';
export { MQTTClient } from './network/mqtt.js';
export { WebSocketClient } from './network/websocket.js';

// Reactive system
export { ReactiveLenses } from './reactive/lenses.js';
export { ReactivePools } from './reactive/pools.js';
export { ReactiveSubscriptions } from './reactive/subscriptions.js';

// Security
export { SecurityManager } from './security-manager.js';

// Hybrid mobile
export { HybridBridge } from './hybrid/index.js';

// Flux architecture
export { 
    FluxStore, 
    FluxActions, 
    combineReducers, 
    createMiddleware,
    loggerMiddleware,
    throttleMiddleware 
} from './flux/index.js';

// Library conflict resolution
export { resolveLibraryConflict } from './library-conflict-resolver.js';
export { resolveOperatorConflict } from './conflict-resolver.js';

// ENHANCED OperatorsRegistry with Core Functionality
export class OperatorsRegistry {
    constructor() {
        this.operators = new Map();
        this.categories = new Map();
        this.aliases = new Map();
        this.performance = new Map();
        this.initialized = false;
        
        // Integrated type system (replaces core/types)
        this.typeSystem = this.createTypeSystem();
    }

    createTypeSystem() {
        return {
            // Type checking
            isString: (val) => typeof val === 'string',
            isNumber: (val) => typeof val === 'number' && !isNaN(val),
            isBoolean: (val) => typeof val === 'boolean',
            isArray: (val) => Array.isArray(val),
            isObject: (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
            isFunction: (val) => typeof val === 'function',
            isNull: (val) => val === null,
            isUndefined: (val) => val === undefined,
            
            // Type coercion
            coerceString: (val) => String(val),
            coerceNumber: (val) => Number(val),
            coerceBoolean: (val) => Boolean(val),
            coerceArray: (val) => Array.isArray(val) ? val : [val],
            
            // Type information
            getType: (val) => {
                if (val === null) return 'null';
                if (val === undefined) return 'undefined';
                if (Array.isArray(val)) return 'array';
                return typeof val;
            },
            
            // Validation
            validateType: (val, expectedType) => {
                const validators = {
                    'string': (v) => typeof v === 'string',
                    'number': (v) => typeof v === 'number' && !isNaN(v),
                    'boolean': (v) => typeof v === 'boolean',
                    'array': (v) => Array.isArray(v),
                    'object': (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
                    'function': (v) => typeof v === 'function',
                    'null': (v) => v === null,
                    'undefined': (v) => v === undefined,
                    'any': () => true
                };
                return validators[expectedType] ? validators[expectedType](val) : false;
            }
        };
    }

    // CORE OPERATORS (replaces core/core.js)
    registerCoreOperators() {
        // === TYPE CHECKING OPERATORS ===
        this.registerOperator('is_string', 
            (input) => this.typeSystem.isString(input),
            { category: 'core', description: 'Check if value is a string', returnsBoolean: true }
        );
        
        this.registerOperator('is_number', 
            (input) => this.typeSystem.isNumber(input),
            { category: 'core', description: 'Check if value is a number', returnsBoolean: true }
        );
        
        this.registerOperator('is_boolean', 
            (input) => this.typeSystem.isBoolean(input),
            { category: 'core', description: 'Check if value is a boolean', returnsBoolean: true }
        );
        
        this.registerOperator('is_array', 
            (input) => this.typeSystem.isArray(input),
            { category: 'core', description: 'Check if value is an array', returnsBoolean: true }
        );
        
        this.registerOperator('is_object', 
            (input) => this.typeSystem.isObject(input),
            { category: 'core', description: 'Check if value is an object', returnsBoolean: true }
        );
        
        this.registerOperator('is_function', 
            (input) => this.typeSystem.isFunction(input),
            { category: 'core', description: 'Check if value is a function', returnsBoolean: true }
        );
        
        this.registerOperator('is_null', 
            (input) => this.typeSystem.isNull(input),
            { category: 'core', description: 'Check if value is null', returnsBoolean: true }
        );
        
        this.registerOperator('type_of', 
            (input) => this.typeSystem.getType(input),
            { category: 'core', description: 'Get type of value as string' }
        );

        // === TYPE COERCION OPERATORS ===
        this.registerOperator('to_string', 
            (input) => this.typeSystem.coerceString(input),
            { category: 'core', description: 'Convert value to string' }
        );
        
        this.registerOperator('to_number', 
            (input) => this.typeSystem.coerceNumber(input),
            { category: 'core', description: 'Convert value to number' }
        );
        
        this.registerOperator('to_boolean', 
            (input) => this.typeSystem.coerceBoolean(input),
            { category: 'core', description: 'Convert value to boolean' }
        );
        
        this.registerOperator('to_array', 
            (input) => this.typeSystem.coerceArray(input),
            { category: 'core', description: 'Convert value to array' }
        );

        // === COLLECTION OPERATORS (replaces core/collections.js) ===
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
            { category: 'core', description: 'Get length of array, string, or object' }
        );

        this.registerOperator('keys', 
            (input) => {
                if (this.typeSystem.isObject(input)) {
                    return Object.keys(input);
                }
                return [];
            },
            { category: 'core', description: 'Get keys of an object as array' }
        );

        this.registerOperator('values', 
            (input) => {
                if (this.typeSystem.isObject(input)) {
                    return Object.values(input);
                }
                return [];
            },
            { category: 'core', description: 'Get values of an object as array' }
        );

        this.registerOperator('entries', 
            (input) => {
                if (this.typeSystem.isObject(input)) {
                    return Object.entries(input);
                }
                return [];
            },
            { category: 'core', description: 'Get key-value pairs of an object as array' }
        );

        this.registerOperator('has_key', 
            (input, args) => {
                const key = args[0];
                if (this.typeSystem.isObject(input) && key) {
                    return key in input;
                }
                return false;
            },
            { category: 'core', description: 'Check if object has specified key', returnsBoolean: true }
        );

        this.registerOperator('get', 
            (input, args) => {
                const key = args[0];
                const defaultValue = args[1];
                if (this.typeSystem.isObject(input) && key) {
                    return input[key] !== undefined ? input[key] : defaultValue;
                }
                return defaultValue;
            },
            { category: 'core', description: 'Get value from object by key with optional default' }
        );

        // === UTILITY OPERATORS ===
        this.registerOperator('identity', 
            (input) => input,
            { category: 'core', description: 'Return input unchanged' }
        );

        this.registerOperator('constant', 
            (input, args) => args[0],
            { category: 'core', description: 'Return constant value from arguments' }
        );

        this.registerOperator('throw_error', 
            (input, args) => {
                const message = args[0] || 'Error thrown by operator';
                throw new Error(message);
            },
            { category: 'core', description: 'Throw an error with specified message' }
        );

        this.registerOperator('try_catch', 
            async (input, args, context) => {
                const tryOperator = args[0];
                const catchOperator = args[1];
                
                try {
                    if (tryOperator && this.operators.has(tryOperator)) {
                        return await this.executeOperator(tryOperator, input, args.slice(2), context);
                    }
                    return input;
                } catch (error) {
                    if (catchOperator && this.operators.has(catchOperator)) {
                        return await this.executeOperator(catchOperator, error, args.slice(2), context);
                    }
                    throw error;
                }
            },
            { category: 'core', description: 'Try an operator and catch errors with another operator', async: true }
        );

        console.log('✅ Registered core operators: type checking, coercion, collections, and utilities');
    }

    // ORIGINAL OperatorsRegistry METHODS
    initialize() {
        if (this.initialized) return;

        // Register categories
        this.registerCategory('core', 'Core operations and type system');
        this.registerCategory('math', 'Mathematical operations');
        this.registerCategory('string', 'String manipulation');
        this.registerCategory('network', 'Network operations');
        this.registerCategory('data', 'Data processing and streams');
        this.registerCategory('flux', 'Flux architecture');
        this.registerCategory('security', 'Security operations');
        this.registerCategory('time', 'Time operations');
        this.registerCategory('domains', 'Domain-specific operations');

        // Register all core operators
        this.registerCoreOperators();

        this.initialized = true;
        console.log('🎯 OperatorsRegistry initialized with core functionality');
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
                description: metadata.description || '',
                version: metadata.version || '1.0.0',
                async: metadata.async || false,
                streamSafe: metadata.streamSafe || false,
                memorySafe: metadata.memorySafe || true,
                returnsBoolean: metadata.returnsBoolean || false,
                ...metadata
            },
            registeredAt: Date.now(),
            callCount: 0,
            lastCalled: null
        };

        this.operators.set(name, operator);

        // Add to category
        if (!this.categories.has(operator.metadata.category)) {
            this.categories.set(operator.metadata.category, new Set());
        }
        this.categories.get(operator.metadata.category).add(name);

        // Register aliases if provided
        if (metadata.aliases) {
            metadata.aliases.forEach(alias => {
                this.aliases.set(alias, name);
            });
        }

        return operator;
    }

    getOperator(name) {
        const actualName = this.aliases.get(name) || name;
        const operator = this.operators.get(actualName);
        if (!operator) {
            throw new Error(`Operator not found: ${name}`);
        }
        return operator;
    }

    executeOperator(name, input, args = [], context = {}) {
        const operator = this.getOperator(name);
        
        try {
            operator.callCount++;
            operator.lastCalled = Date.now();
            this.recordPerformance(name, 'execution_start');

            const startTime = performance.now();
            const result = operator.implementation(input, args, context);
            const duration = performance.now() - startTime;

            this.recordPerformance(name, 'execution_end', duration);

            return result;

        } catch (error) {
            this.recordPerformance(name, 'execution_error');
            throw new Error(`Operator execution failed: ${name} - ${error.message}`);
        }
    }

    async executeOperatorAsync(name, input, args = [], context = {}) {
        const operator = this.getOperator(name);
        
        if (!operator.metadata.async) {
            throw new Error(`Operator ${name} is not asynchronous`);
        }

        try {
            operator.callCount++;
            operator.lastCalled = Date.now();
            this.recordPerformance(name, 'async_execution_start');

            const startTime = performance.now();
            const result = await operator.implementation(input, args, context);
            const duration = performance.now() - startTime;

            this.recordPerformance(name, 'async_execution_end', duration);

            return result;

        } catch (error) {
            this.recordPerformance(name, 'async_execution_error');
            throw new Error(`Async operator execution failed: ${name} - ${error.message}`);
        }
    }

    registerCategory(name, description) {
        if (!this.categories.has(name)) {
            this.categories.set(name, new Set());
        }
        
        return {
            name,
            description,
            operatorCount: this.categories.get(name).size
        };
    }

    getOperatorsByCategory(category) {
        const operatorNames = this.categories.get(category);
        if (!operatorNames) {
            return [];
        }
        return Array.from(operatorNames).map(name => this.operators.get(name));
    }

    getAllOperators() {
        return Array.from(this.operators.values());
    }

    getOperatorCount() {
        return this.operators.size;
    }

    getCategories() {
        return Array.from(this.categories.entries()).map(([name, operators]) => ({
            name,
            operatorCount: operators.size,
            operators: Array.from(operators)
        }));
    }

    searchOperators(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const operator of this.operators.values()) {
            if (
                operator.name.toLowerCase().includes(lowerQuery) ||
                operator.metadata.description.toLowerCase().includes(lowerQuery) ||
                operator.metadata.category.toLowerCase().includes(lowerQuery)
            ) {
                results.push(operator);
            }
        }
        return results;
    }

    registerAlias(operatorName, alias) {
        if (this.aliases.has(alias)) {
            throw new Error(`Alias already registered: ${alias}`);
        }
        if (!this.operators.has(operatorName)) {
            throw new Error(`Cannot create alias for unknown operator: ${operatorName}`);
        }
        this.aliases.set(alias, operatorName);
        return alias;
    }

    unregisterOperator(name) {
        const operator = this.operators.get(name);
        if (!operator) {
            throw new Error(`Operator not found: ${name}`);
        }

        // Remove from categories
        if (this.categories.has(operator.metadata.category)) {
            this.categories.get(operator.metadata.category).delete(name);
        }

        // Remove aliases
        for (const [alias, opName] of this.aliases.entries()) {
            if (opName === name) {
                this.aliases.delete(alias);
            }
        }

        // Remove operator
        this.operators.delete(name);
        return operator;
    }

    recordPerformance(operatorName, event, duration = null) {
        if (!this.performance.has(operatorName)) {
            this.performance.set(operatorName, {
                executions: 0,
                totalTime: 0,
                averageTime: 0,
                errors: 0,
                lastExecution: null
            });
        }

        const stats = this.performance.get(operatorName);
        switch (event) {
            case 'execution_start':
            case 'async_execution_start':
                stats.lastExecution = Date.now();
                break;
            case 'execution_end':
            case 'async_execution_end':
                stats.executions++;
                stats.totalTime += duration;
                stats.averageTime = stats.totalTime / stats.executions;
                break;
            case 'execution_error':
            case 'async_execution_error':
                stats.errors++;
                break;
        }
        this.performance.set(operatorName, stats);
    }

    getPerformanceReport(operatorName = null) {
        if (operatorName) {
            return this.performance.get(operatorName) || null;
        }
        const report = {};
        for (const [name, stats] of this.performance.entries()) {
            report[name] = stats;
        }
        return report;
    }

    clearPerformanceData() {
        this.performance.clear();
    }

    validateOperator(name) {
        const operator = this.getOperator(name);
        const validation = {
            name: operator.name,
            valid: true,
            issues: [],
            warnings: []
        };

        if (!operator.metadata.description) {
            validation.warnings.push('Missing operator description');
        }
        if (!operator.metadata.category) {
            validation.warnings.push('Missing operator category');
        }
        if (typeof operator.implementation !== 'function') {
            validation.valid = false;
            validation.issues.push('Implementation must be a function');
        }

        return validation;
    }

    batchRegister(operators) {
        const results = {
            registered: 0,
            failed: 0,
            errors: []
        };

        for (const [name, config] of Object.entries(operators)) {
            try {
                this.registerOperator(name, config.implementation, config.metadata);
                results.registered++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    operator: name,
                    error: error.message
                });
            }
        }
        return results;
    }
}

// Create and export default instances
export const operatorsRegistry = new OperatorsRegistry();
operatorsRegistry.initialize();

// Enhanced FluxusLibrary
export class FluxusLibrary {
    constructor(config = {}) {
        this.config = config;
        this.loadedLibraries = new Set();
        this.operatorsRegistry = operatorsRegistry; // Use global registry
        
        this.initializeCoreLibraries();
    }

    initializeCoreLibraries() {
        // Core operators are already registered in OperatorsRegistry
        // Load other essential libraries
        const essentialLibraries = ['math', 'string', 'time', 'data', 'network'];
        essentialLibraries.forEach(lib => this.loadLibrary(lib));
        
        console.log('📚 FluxusLibrary initialized with core functionality');
    }

    loadLibrary(libraryName) {
        if (this.loadedLibraries.has(libraryName)) {
            return true;
        }

        try {
            // Simulate library loading - in real implementation would dynamically import
            const library = this.getLibraryModule(libraryName);
            this.registerLibraryOperators(libraryName, library);
            this.loadedLibraries.add(libraryName);
            
            console.log(`📚 Loaded library: ${libraryName}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load library ${libraryName}:`, error.message);
            return false;
        }
    }

    getLibraryModule(libraryName) {
        // Simplified - real implementation would use dynamic imports
        const libraryModules = {
            math: { getOperators: () => ({}) },
            string: { getOperators: () => ({}) },
            time: { getOperators: () => ({}) },
            data: { getOperators: () => ({}) },
            network: { getOperators: () => ({}) }
        };
        return libraryModules[libraryName] || { getOperators: () => ({}) };
    }

    registerLibraryOperators(libraryName, libraryModule) {
        if (libraryModule.getOperators) {
            const operators = libraryModule.getOperators();
            for (const [operatorName, operatorDef] of Object.entries(operators)) {
                this.registerOperator(operatorName, operatorDef, libraryName);
            }
        }
    }

    registerOperator(operatorName, operatorDef, libraryName) {
        return this.operatorsRegistry.registerOperator(operatorName, operatorDef.implementation, {
            ...operatorDef.metadata,
            library: libraryName
        });
    }

    getOperator(operatorName) {
        return this.operatorsRegistry.getOperator(operatorName);
    }

    executeOperator(operatorName, input, args = [], context = {}) {
        return this.operatorsRegistry.executeOperator(operatorName, input, args, context);
    }

    getAvailableOperators() {
        const operators = {};
        for (const operator of this.operatorsRegistry.getAllOperators()) {
            operators[operator.name] = {
                name: operator.name,
                library: operator.metadata.library || 'core',
                category: operator.metadata.category,
                description: operator.metadata.description
            };
        }
        return operators;
    }

    getLoadedLibraries() {
        return Array.from(this.loadedLibraries);
    }

    getLibraryInfo(libraryName) {
        const operators = [];
        for (const operator of this.operatorsRegistry.getAllOperators()) {
            if (operator.metadata.library === libraryName) {
                operators.push(operator.name);
            }
        }
        return {
            name: libraryName,
            operators,
            operatorCount: operators.length
        };
    }
}

// Global library instance
export const Library = new FluxusLibrary();

// Export core functionality from other files
export { 
    // Core operators from data/streams.js
    STREAM_OPERATORS as CoreOperators,
    
    // From existing files
    FLUXUS_MATH_OPERATORS as MathOperators,
    FLUXUS_STRING_OPERATORS,
    AGGREGATOR_OPERATORS as DataAggregators,
    TRANSDUCER_OPERATORS as DataTransducers,
    HTTP_OPERATORS,
    WEBSOCKET_OPERATORS,
    MQTT_OPERATORS,
    NETWORK_OPERATORS
} from './index-impl.js';

export default Library;
