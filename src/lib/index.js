// FILENAME: src/lib/index.js
// Fluxus Standard Library Main Index - Production Grade

// Core libraries
export { CoreOperators } from './core/core.js';
export { TypeSystem } from './core/types/index.js';

// Domain libraries
export { HEALTH_OPERATORS } from './domains/health.js';
export { IOT_OPERATORS } from './domains/iot.js';
export { UI_OPERATORS } from './domains/ui.js';
export { ANALYTICS_OPERATORS } from './domains/analytics.js';
export { FLUXUS_SENSOR_OPERATORS } from './domains/sensors.js';

// Data and collections
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

// Main library loader
export class FluxusLibrary {
    constructor(config = {}) {
        this.config = config;
        this.loadedLibraries = new Set();
        this.operatorRegistry = new Map();
        
        this.initializeCoreLibraries();
    }

    initializeCoreLibraries() {
        // Load core libraries automatically
        this.loadLibrary('core');
        this.loadLibrary('math');
        this.loadLibrary('string');
        this.loadLibrary('time');
    }

    loadLibrary(libraryName) {
        if (this.loadedLibraries.has(libraryName)) {
            return true; // Already loaded
        }

        try {
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
        const libraries = {
            core: () => import('./core/core.js'),
            math: () => import('./math/math.js'),
            string: () => import('./text/string.js'),
            time: () => import('./time/time.js'),
            sensors: () => import('./domains/sensors.js'),
            analytics: () => import('./domains/analytics.js'),
            health: () => import('./domains/health.js'),
            iot: () => import('./domains/iot.js'),
            ui: () => import('./domains/ui.js')
        };

        const loader = libraries[libraryName];
        if (!loader) {
            throw new Error(`Unknown library: ${libraryName}`);
        }

        // In real implementation, this would dynamically import
        // For now, return the appropriate module
        return this.getStaticLibrary(libraryName);
    }

    getStaticLibrary(libraryName) {
        // Return the appropriate library module statically
        // This is simplified - real implementation would use dynamic imports
        const staticLibraries = {
            core: { getOperators: () => ({}) },
            math: { getOperators: () => ({}) },
            string: { getOperators: () => ({}) },
            time: { getOperators: () => ({}) }
        };

        return staticLibraries[libraryName];
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
        if (this.operatorRegistry.has(operatorName)) {
            // Handle operator conflicts
            const resolved = this.resolveOperatorConflict(operatorName, operatorDef, libraryName);
            if (!resolved) {
                console.warn(`Operator conflict for ${operatorName}, skipping registration`);
                return false;
            }
        }

        this.operatorRegistry.set(operatorName, {
            ...operatorDef,
            library: libraryName,
            registeredAt: Date.now()
        });

        return true;
    }

    resolveOperatorConflict(operatorName, newOperator, newLibrary) {
        const existing = this.operatorRegistry.get(operatorName);
        
        // Simple conflict resolution: prefer core libraries over domain libraries
        const priority = {
            'core': 100,
            'math': 90,
            'string': 90,
            'time': 90,
            'sensors': 80,
            'analytics': 80,
            'health': 80,
            'iot': 80,
            'ui': 80
        };

        const existingPriority = priority[existing.library] || 50;
        const newPriority = priority[newLibrary] || 50;

        if (newPriority > existingPriority) {
            // New operator has higher priority, replace existing
            console.log(`🔄 Replacing operator ${operatorName} from ${existing.library} with ${newLibrary}`);
            return true;
        } else if (newPriority === existingPriority) {
            // Same priority, keep both with namespacing
            const namespacedName = `${newLibrary}_${operatorName}`;
            this.operatorRegistry.set(namespacedName, {
                ...newOperator,
                library: newLibrary,
                namespaced: true,
                originalName: operatorName
            });
            console.log(`📝 Namespaced operator ${operatorName} as ${namespacedName}`);
            return false; // Don't replace original
        } else {
            // Existing operator has higher priority, keep it
            return false;
        }
    }

    getOperator(operatorName) {
        return this.operatorRegistry.get(operatorName);
    }

    executeOperator(operatorName, input, args = [], context = {}) {
        const operator = this.getOperator(operatorName);
        if (!operator) {
            throw new Error(`Unknown operator: ${operatorName}`);
        }

        try {
            return operator.implementation(input, args, context);
        } catch (error) {
            throw new Error(`Operator execution failed for ${operatorName}: ${error.message}`);
        }
    }

    getAvailableOperators() {
        const operators = {};
        
        for (const [name, operator] of this.operatorRegistry) {
            operators[name] = {
                name,
                library: operator.library,
                type: operator.type,
                description: operator.description
            };
        }
        
        return operators;
    }

    getLoadedLibraries() {
        return Array.from(this.loadedLibraries);
    }

    getLibraryInfo(libraryName) {
        const operators = [];
        
        for (const [name, operator] of this.operatorRegistry) {
            if (operator.library === libraryName) {
                operators.push(name);
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

export default Library;
