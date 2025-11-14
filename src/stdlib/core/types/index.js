// FILENAME: src/stdlib/core/types/index.js
// Fluxus Type System

export class FluxusTypeSystem {
    constructor() {
        this.types = new Map();
        this.typeRegistry = new Map();
        this.initializeCoreTypes();
    }

    initializeCoreTypes() {
        this.registerType('Number', {
            validate: (value) => typeof value === 'number' && !isNaN(value),
            coerce: (value) => parseFloat(value),
            description: 'Numeric value'
        });

        this.registerType('String', {
            validate: (value) => typeof value === 'string',
            coerce: (value) => String(value),
            description: 'Text value'
        });

        this.registerType('Boolean', {
            validate: (value) => typeof value === 'boolean',
            coerce: (value) => Boolean(value),
            description: 'True/False value'
        });

        this.registerType('Array', {
            validate: (value) => Array.isArray(value),
            coerce: (value) => Array.isArray(value) ? value : [value],
            description: 'Collection of values'
        });

        this.registerType('Object', {
            validate: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
            coerce: (value) => typeof value === 'object' ? value : { value },
            description: 'Key-value pairs'
        });

        this.registerType('Stream', {
            validate: (value) => value && typeof value === 'object' && value.type === 'STREAM',
            description: 'Reactive data stream'
        });

        this.registerType('Pool', {
            validate: (value) => value && typeof value === 'object' && value._updates !== undefined,
            description: 'Tidal pool reference'
        });

        this.registerType('Any', {
            validate: () => true,
            coerce: (value) => value,
            description: 'Any value type'
        });
    }

    registerType(typeName, definition) {
        this.types.set(typeName, definition);
        this.typeRegistry.set(typeName, definition);
    }

    validateType(value, typeName) {
        const typeDef = this.types.get(typeName);
        if (!typeDef) {
            throw new Error(`Unknown type: ${typeName}`);
        }

        return typeDef.validate(value);
    }

    coerceValue(value, typeName) {
        const typeDef = this.types.get(typeName);
        if (!typeDef) {
            return value; // Return as-is for unknown types
        }

        return typeDef.coerce ? typeDef.coerce(value) : value;
    }

    inferType(value) {
        if (value === null || value === undefined) return 'Any';
        if (typeof value === 'number') return 'Number';
        if (typeof value === 'string') return 'String';
        if (typeof value === 'boolean') return 'Boolean';
        if (Array.isArray(value)) return 'Array';
        if (value && value.type === 'STREAM') return 'Stream';
        if (value && value._updates !== undefined) return 'Pool';
        if (typeof value === 'object') return 'Object';
        return 'Any';
    }

    getTypeCompatibility(sourceType, targetType) {
        if (sourceType === targetType) return true;
        if (targetType === 'Any') return true;
        
        const compatibility = {
            'Number': ['String', 'Boolean'],
            'String': ['Number', 'Boolean'],
            'Boolean': ['Number', 'String'],
            'Array': ['Object'],
            'Object': ['Array']
        };

        return compatibility[sourceType]?.includes(targetType) || false;
    }

    getTypeSignature(operatorName, library = 'core') {
        // This would integrate with the operator system
        // For now, return a basic signature
        return {
            input: 'Any',
            output: 'Any',
            args: []
        };
    }
}

export const TypeSystem = new FluxusTypeSystem();
export default TypeSystem;
