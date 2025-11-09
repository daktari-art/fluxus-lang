// FILENAME: src/lib/core/collections.js
// Array and Object operations

export const COLLECTION_OPERATORS = {
    'length': (input, args) => {
        if (Array.isArray(input)) return input.length;
        if (typeof input === 'object' && input !== null) return Object.keys(input).length;
        if (typeof input === 'string') return input.length;
        return 0;
    },
    
    'get': (input, args) => {
        const key = args[0];
        if (Array.isArray(input)) return input[parseInt(key)];
        if (typeof input === 'object' && input !== null) return input[key];
        return undefined;
    },
    
    'set': (input, args) => {
        const key = args[0];
        const value = args[1];
        
        if (Array.isArray(input)) {
            const newArray = [...input];
            newArray[parseInt(key)] = value;
            return newArray;
        }
        
        if (typeof input === 'object' && input !== null) {
            return { ...input, [key]: value };
        }
        
        return input;
    },
    
    'keys': (input, args) => {
        if (typeof input === 'object' && input !== null) {
            return Object.keys(input);
        }
        return [];
    },
    
    'values': (input, args) => {
        if (typeof input === 'object' && input !== null) {
            return Object.values(input);
        }
        return [];
    },
    
    'merge': (input, args) => {
        if (typeof input === 'object' && input !== null && typeof args[0] === 'object') {
            return { ...input, ...args[0] };
        }
        return input;
    },
    
    'slice': (input, args) => {
        if (Array.isArray(input)) {
            const start = parseInt(args[0]) || 0;
            const end = parseInt(args[1]) || input.length;
            return input.slice(start, end);
        }
        if (typeof input === 'string') {
            const start = parseInt(args[0]) || 0;
            const end = parseInt(args[1]) || input.length;
            return input.slice(start, end);
        }
        return input;
    }
};
