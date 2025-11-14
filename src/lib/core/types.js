// FILENAME: src/lib/core/types.js
// Fluxus Enterprise Type System v4.0 - PRODUCTION GRADE

import { performance } from 'perf_hooks';

/**
 * ENTERPRISE TYPE SYSTEM OPERATORS
 * 
 * Fluxus-Specific Features:
 * - Stream type inference
 * - Runtime type validation
 * - Type-safe reactive operations
 * - Automatic type coercion with safety
 * - Performance-optimized type checks
 */

export const FLUXUS_TYPES_OPERATORS = {
    // ==================== TYPE CHECKING OPERATORS ====================
    
    'is_number': {
        type: 'validation',
        implementation: (input, args, context) => {
            return typeof input === 'number' && !isNaN(input);
        },
        metadata: {
            name: 'is_number',
            category: 'type_check',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            safe: true
        }
    },

    'is_string': {
        type: 'validation',
        implementation: (input, args, context) => {
            return typeof input === 'string';
        },
        metadata: {
            name: 'is_string',
            category: 'type_check',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            safe: true
        }
    },

    'is_boolean': {
        type: 'validation',
        implementation: (input, args, context) => {
            return typeof input === 'boolean';
        },
        metadata: {
            name: 'is_boolean',
            category: 'type_check',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            safe: true
        }
    },

    'is_array': {
        type: 'validation',
        implementation: (input, args, context) => {
            return Array.isArray(input);
        },
        metadata: {
            name: 'is_array',
            category: 'type_check',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            safe: true
        }
    },

    'is_object': {
        type: 'validation',
        implementation: (input, args, context) => {
            return typeof input === 'object' && input !== null && !Array.isArray(input);
        },
        metadata: {
            name: 'is_object',
            category: 'type_check',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            safe: true
        }
    },

    'is_function': {
        type: 'validation',
        implementation: (input, args, context) => {
            return typeof input === 'function';
        },
        metadata: {
            name: 'is_function',
            category: 'type_check',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            safe: true
        }
    },

    'is_null': {
        type: 'validation',
        implementation: (input, args, context) => {
            return input === null;
        },
        metadata: {
            name: 'is_null',
            category: 'type_check',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            safe: true
        }
    },

    'is_undefined': {
        type: 'validation',
        implementation: (input, args, context) => {
            return input === undefined;
        },
        metadata: {
            name: 'is_undefined',
            category: 'type_check',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            safe: true
        }
    },

    // ==================== TYPE CONVERSION OPERATORS ====================
    
    'to_number': {
        type: 'conversion',
        implementation: (input, args, context) => {
            const result = Number(input);
            if (isNaN(result)) {
                throw new Error(`Cannot convert '${input}' to number`);
            }
            return result;
        },
        metadata: {
            name: 'to_number',
            category: 'type_conversion',
            complexity: 'O(1)',
            streamSafe: true,
            safe: true,
            validation: true
        }
    },

    'to_string': {
        type: 'conversion',
        implementation: (input, args, context) => {
            return String(input);
        },
        metadata: {
            name: 'to_string',
            category: 'type_conversion',
            complexity: 'O(1)',
            streamSafe: true,
            safe: true
        }
    },

    'to_boolean': {
        type: 'conversion',
        implementation: (input, args, context) => {
            return Boolean(input);
        },
        metadata: {
            name: 'to_boolean',
            category: 'type_conversion',
            complexity: 'O(1)',
            streamSafe: true,
            safe: true
        }
    },

    'to_array': {
        type: 'conversion',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                return input;
            } else if (input && typeof input === 'object') {
                return Object.values(input);
            }
            return [input];
        },
        metadata: {
            name: 'to_array',
            category: 'type_conversion',
            complexity: 'O(n)',
            streamSafe: true,
            safe: true
        }
    },

    // ==================== TYPE VALIDATION OPERATORS ====================
    
    'validate_type': {
        type: 'validation',
        implementation: (input, args, context) => {
            const expectedType = args[0];
            const strict = args[1] || false;
            
            return this.validateType(input, expectedType, strict);
        },
        metadata: {
            name: 'validate_type',
            category: 'type_validation',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true,
            configurable: true
        }
    },

    'assert_type': {
        type: 'validation',
        implementation: (input, args, context) => {
            const expectedType = args[0];
            const errorMessage = args[1] || `Expected type ${expectedType}, got ${typeof input}`;
            
            if (!this.validateType(input, expectedType, true)) {
                throw new Error(errorMessage);
            }
            return input;
        },
        metadata: {
            name: 'assert_type',
            category: 'type_validation',
            complexity: 'O(1)',
            streamSafe: true,
            safe: true,
            throwsOnError: true
        }
    },

    'coerce_type': {
        type: 'conversion',
        implementation: (input, args, context) => {
            const targetType = args[0];
            const fallback = args[1];
            
            try {
                return this.coerceToType(input, targetType);
            } catch (error) {
                if (fallback !== undefined) {
                    return fallback;
                }
                throw error;
            }
        },
        metadata: {
            name: 'coerce_type',
            category: 'type_conversion',
            complexity: 'O(1)',
            streamSafe: true,
            safe: true,
            fallbackSupport: true
        }
    },

    // ==================== ADVANCED TYPE OPERATIONS ====================
    
    'get_type': {
        type: 'inspection',
        implementation: (input, args, context) => {
            return this.getDetailedType(input);
        },
        metadata: {
            name: 'get_type',
            category: 'type_inspection',
            complexity: 'O(1)',
            streamSafe: true,
            returnsString: true
        }
    },

    'type_of': {
        type: 'inspection',
        implementation: (input, args, context) => {
            return typeof input;
        },
        metadata: {
            name: 'type_of',
            category: 'type_inspection',
            complexity: 'O(1)',
            streamSafe: true,
            returnsString: true
        }
    },

    'instance_of': {
        type: 'validation',
        implementation: (input, args, context) => {
            const constructorName = args[0];
            return this.isInstanceOf(input, constructorName);
        },
        metadata: {
            name: 'instance_of',
            category: 'type_validation',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true
        }
    },

    'has_property': {
        type: 'validation',
        implementation: (input, args, context) => {
            const property = args[0];
            return input && typeof input === 'object' && property in input;
        },
        metadata: {
            name: 'has_property',
            category: 'type_validation',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true
        }
    },

    // ==================== STREAM TYPE OPERATIONS ====================
    
    'stream_type': {
        type: 'inspection',
        implementation: (input, args, context) => {
            if (input && input.type === 'STREAM') {
                return {
                    type: 'stream',
                    streamType: input.streamType,
                    elementType: this.inferStreamElementType(input),
                    size: input.values?.length || 0
                };
            }
            return this.getDetailedType(input);
        },
        metadata: {
            name: 'stream_type',
            category: 'type_inspection',
            complexity: 'O(n)',
            streamSafe: true,
            streamAware: true
        }
    },

    'infer_type': {
        type: 'inspection',
        implementation: (input, args, context) => {
            return this.inferTypeWithConfidence(input);
        },
        metadata: {
            name: 'infer_type',
            category: 'type_inference',
            complexity: 'O(n)',
            streamSafe: true,
            probabilistic: true
        }
    }
};

/**
 * ENTERPRISE TYPE SYSTEM CORE
 */
export class TypeOperators {
    constructor() {
        this.typeRegistry = new Map();
        this.typeCache = new Map();
        this.performanceMetrics = new Map();
        
        this.initializeTypeSystem();
    }

    /**
     * TYPE SYSTEM INITIALIZATION
     */
    initializeTypeSystem() {
        // Register core types
        this.registerType('number', {
            validate: (value) => typeof value === 'number' && !isNaN(value),
            coerce: (value) => {
                const num = Number(value);
                return isNaN(num) ? null : num;
            },
            default: 0
        });

        this.registerType('string', {
            validate: (value) => typeof value === 'string',
            coerce: (value) => String(value),
            default: ''
        });

        this.registerType('boolean', {
            validate: (value) => typeof value === 'boolean',
            coerce: (value) => Boolean(value),
            default: false
        });

        this.registerType('array', {
            validate: (value) => Array.isArray(value),
            coerce: (value) => Array.isArray(value) ? value : [value],
            default: []
        });

        this.registerType('object', {
            validate: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
            coerce: (value) => {
                if (typeof value === 'object' && value !== null) return value;
                return { value };
            },
            default: {}
        });

        this.registerType('function', {
            validate: (value) => typeof value === 'function',
            coerce: null, // Cannot coerce to function
            default: () => {}
        });

        this.registerType('null', {
            validate: (value) => value === null,
            coerce: null, // Cannot coerce to null
            default: null
        });

        this.registerType('undefined', {
            validate: (value) => value === undefined,
            coerce: null, // Cannot coerce to undefined
            default: undefined
        });

        // Register stream types
        this.registerType('stream', {
            validate: (value) => value && value.type === 'STREAM',
            coerce: null,
            default: null
        });

        this.registerType('finite_stream', {
            validate: (value) => value && value.type === 'STREAM' && value.streamType === 'FINITE',
            coerce: null,
            default: null
        });

        this.registerType('live_stream', {
            validate: (value) => value && value.type === 'STREAM' && value.streamType === 'LIVE',
            coerce: null,
            default: null
        });
    }

    /**
     * TYPE REGISTRATION AND MANAGEMENT
     */
    registerType(typeName, definition) {
        this.typeRegistry.set(typeName, {
            name: typeName,
            ...definition,
            metadata: {
                registered: Date.now(),
                usageCount: 0
            }
        });
    }

    unregisterType(typeName) {
        return this.typeRegistry.delete(typeName);
    }

    getTypeDefinition(typeName) {
        return this.typeRegistry.get(typeName);
    }

    listRegisteredTypes() {
        return Array.from(this.typeRegistry.keys());
    }

    /**
     * TYPE VALIDATION IMPLEMENTATIONS
     */
    validateType(value, expectedType, strict = false) {
        const startTime = performance.now();
        
        try {
            const typeDef = this.typeRegistry.get(expectedType);
            if (!typeDef) {
                // Fallback to basic type checking
                return this.basicTypeCheck(value, expectedType);
            }

            typeDef.metadata.usageCount++;
            
            let isValid = typeDef.validate(value);
            
            if (!strict && !isValid && typeDef.coerce) {
                // In non-strict mode, check if value can be coerced
                const coerced = typeDef.coerce(value);
                isValid = coerced !== null && typeDef.validate(coerced);
            }
            
            this.recordPerformance('validate_type', performance.now() - startTime);
            return isValid;
            
        } catch (error) {
            this.recordPerformance('validate_type_error', performance.now() - startTime);
            return false;
        }
    }

    basicTypeCheck(value, expectedType) {
        switch (expectedType) {
            case 'number': return typeof value === 'number' && !isNaN(value);
            case 'string': return typeof value === 'string';
            case 'boolean': return typeof value === 'boolean';
            case 'array': return Array.isArray(value);
            case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'function': return typeof value === 'function';
            case 'null': return value === null;
            case 'undefined': return value === undefined;
            default: return false;
        }
    }

    /**
     * TYPE CONVERSION IMPLEMENTATIONS
     */
    coerceToType(value, targetType) {
        const startTime = performance.now();
        
        try {
            const typeDef = this.typeRegistry.get(targetType);
            if (!typeDef || !typeDef.coerce) {
                throw new Error(`Cannot coerce to type: ${targetType}`);
            }

            const result = typeDef.coerce(value);
            if (result === null) {
                throw new Error(`Coercion failed for value: ${value}`);
            }

            typeDef.metadata.usageCount++;
            this.recordPerformance('coerce_type', performance.now() - startTime);
            
            return result;
            
        } catch (error) {
            this.recordPerformance('coerce_type_error', performance.now() - startTime);
            throw error;
        }
    }

    safeCoerce(value, targetType, fallback = null) {
        try {
            return this.coerceToType(value, targetType);
        } catch (error) {
            return fallback;
        }
    }

    /**
     * TYPE INFERENCE AND ANALYSIS
     */
    getDetailedType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        
        const basicType = typeof value;
        
        if (basicType === 'object') {
            if (Array.isArray(value)) return 'array';
            if (value.type === 'STREAM') return 'stream';
            if (value.constructor && value.constructor.name !== 'Object') {
                return value.constructor.name.toLowerCase();
            }
            return 'object';
        }
        
        return basicType;
    }

    inferTypeWithConfidence(value) {
        const type = this.getDetailedType(value);
        let confidence = 1.0;
        
        // Adjust confidence based on value analysis
        if (type === 'number' && (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER)) {
            confidence = 0.8; // Possible bigint
        } else if (type === 'string' && this.looksLikeJSON(value)) {
            confidence = 0.7; // Possible JSON
        } else if (type === 'object' && this.looksLikeDate(value)) {
            confidence = 0.9; // Possible Date
        }
        
        return {
            type,
            confidence,
            value: value,
            suggestions: this.getTypeSuggestions(value, type)
        };
    }

    inferStreamElementType(stream) {
        if (!stream.values || stream.values.length === 0) {
            return 'unknown';
        }
        
        // Sample first few elements to infer type
        const sampleSize = Math.min(stream.values.length, 10);
        const types = new Set();
        
        for (let i = 0; i < sampleSize; i++) {
            types.add(this.getDetailedType(stream.values[i]));
        }
        
        if (types.size === 1) {
            return Array.from(types)[0];
        } else if (types.size > 1) {
            return 'mixed';
        }
        
        return 'unknown';
    }

    /**
     * STREAM-SPECIFIC TYPE OPERATIONS
     */
    validateStreamType(stream, expectedElementType) {
        if (!stream || stream.type !== 'STREAM') {
            return false;
        }
        
        if (!expectedElementType || expectedElementType === 'any') {
            return true;
        }
        
        // Check a sample of stream elements
        const sampleSize = Math.min(stream.values.length, 5);
        for (let i = 0; i < sampleSize; i++) {
            if (!this.validateType(stream.values[i], expectedElementType)) {
                return false;
            }
        }
        
        return true;
    }

    getStreamTypeSignature(stream) {
        return {
            type: 'stream',
            streamType: stream.streamType,
            elementType: this.inferStreamElementType(stream),
            size: stream.values?.length || 0,
            metadata: stream.metadata
        };
    }

    /**
     * UTILITY METHODS
     */
    looksLikeJSON(value) {
        if (typeof value !== 'string') return false;
        
        try {
            JSON.parse(value);
            return true;
        } catch {
            return false;
        }
    }

    looksLikeDate(value) {
        if (typeof value !== 'object' || value === null) return false;
        return value instanceof Date || 
               (typeof value.getTime === 'function' && 
                typeof value.toISOString === 'function');
    }

    isInstanceOf(value, constructorName) {
        return value && 
               value.constructor && 
               value.constructor.name === constructorName;
    }

    getTypeSuggestions(value, detectedType) {
        const suggestions = [];
        
        if (detectedType === 'string') {
            if (this.looksLikeJSON(value)) suggestions.push('json');
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) suggestions.push('date_string');
            if (/^https?:\/\//.test(value)) suggestions.push('url');
        } else if (detectedType === 'number') {
            if (Number.isInteger(value)) suggestions.push('integer');
            if (value > 1000000) suggestions.push('large_number');
        } else if (detectedType === 'object') {
            if (this.looksLikeDate(value)) suggestions.push('date');
            if (value.type === 'STREAM') suggestions.push('stream');
        }
        
        return suggestions;
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

    getPerformanceReport() {
        const report = {};
        
        for (const [operation, stats] of this.performanceMetrics) {
            report[operation] = {
                averageTime: stats.totalTime / stats.count,
                maxTime: stats.maxTime,
                minTime: stats.minTime,
                totalCalls: stats.count
            };
        }
        
        return report;
    }

    /**
     * TYPE SYSTEM DIAGNOSTICS
     */
    getTypeSystemStats() {
        return {
            registeredTypes: this.typeRegistry.size,
            typeCacheSize: this.typeCache.size,
            performanceMetrics: Object.fromEntries(this.performanceMetrics),
            mostUsedTypes: this.getMostUsedTypes(5)
        };
    }

    getMostUsedTypes(count = 10) {
        const types = Array.from(this.typeRegistry.values())
            .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
            .slice(0, count)
            .map(typeDef => ({
                type: typeDef.name,
                usageCount: typeDef.metadata.usageCount
            }));
        
        return types;
    }

    clearCache() {
        this.typeCache.clear();
    }

    resetMetrics() {
        this.performanceMetrics.clear();
    }
}

/**
 * ENTERPRISE TYPE GUARDS AND PREDICATES
 */
export const type_checks = {
    isNumber: (value) => typeof value === 'number' && !isNaN(value),
    isString: (value) => typeof value === 'string',
    isBoolean: (value) => typeof value === 'boolean',
    isArray: (value) => Array.isArray(value),
    isObject: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
    isFunction: (value) => typeof value === 'function',
    isNull: (value) => value === null,
    isUndefined: (value) => value === undefined,
    isPrimitive: (value) => value === null || typeof value !== 'object',
    isTruthy: (value) => Boolean(value),
    isFalsy: (value) => !value,
    
    // Stream-specific type guards
    isStream: (value) => value && value.type === 'STREAM',
    isFiniteStream: (value) => value && value.type === 'STREAM' && value.streamType === 'FINITE',
    isLiveStream: (value) => value && value.type === 'STREAM' && value.streamType === 'LIVE',
    isEmptyStream: (value) => value && value.type === 'STREAM' && (!value.values || value.values.length === 0),
    
    // Advanced type guards
    isInteger: (value) => Number.isInteger(value),
    isFloat: (value) => typeof value === 'number' && !Number.isInteger(value),
    isPositive: (value) => typeof value === 'number' && value > 0,
    isNegative: (value) => typeof value === 'number' && value < 0,
    isEven: (value) => Number.isInteger(value) && value % 2 === 0,
    isOdd: (value) => Number.isInteger(value) && value % 2 === 1
};

export default FLUXUS_TYPES_OPERATORS;
