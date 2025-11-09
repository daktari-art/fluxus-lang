// FILENAME: src/lib/core/types.js
// Type checking and conversion utilities

export const TYPE_OPERATORS = {
    'is_array': (input, args) => Array.isArray(input),
    
    'is_object': (input, args) => typeof input === 'object' && input !== null && !Array.isArray(input),
    
    'is_string': (input, args) => typeof input === 'string',
    
    'is_number': (input, args) => typeof input === 'number' || !isNaN(parseFloat(input)),
    
    'is_boolean': (input, args) => typeof input === 'boolean',
    
    'cast_string': (input, args) => String(input),
    
    'cast_number': (input, args) => {
        const num = parseFloat(input);
        return isNaN(num) ? (args[0] || 0) : num;
    },
    
    'cast_boolean': (input, args) => Boolean(input),
    
    'type_check': (input, args, context) => {
        const expectedType = args[0];
        let actualType;
        
        if (Array.isArray(input)) actualType = 'array';
        else if (input === null) actualType = 'null';
        else actualType = typeof input;
        
        if (actualType !== expectedType) {
            throw new Error(`TypeError: Expected ${expectedType}, got ${actualType}`);
        }
        return input;
    }
};
