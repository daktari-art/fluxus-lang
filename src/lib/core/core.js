// FILENAME: src/lib/core/core.js
// Core Fluxus Language Operators

export const CORE_OPERATORS = {
    'print': (input, args, context) => {
        let output;
        if (args && args.length > 0) {
            const prefix = args[0];
            output = `${prefix}${input}`;
        } else {
            output = typeof input === 'object' ? JSON.stringify(input, null, 2) : String(input);
        }
        console.log(`✅ Fluxus Output: ${output}`);
        return input;
    },
    
    'to_pool': (input, args, context) => {
        if (!args || args.length === 0) {
            throw new Error('to_pool requires a pool name as an argument.');
        }
        context.engine.updatePool(args[0], input);
        return input;
    },
    
    'type_of': (input, args) => {
        if (Array.isArray(input)) return 'array';
        if (input === null) return 'null';
        return typeof input;
    },
    
    'to_string': (input, args) => String(input),
    
    'to_number': (input, args) => {
        const num = parseFloat(input);
        return isNaN(num) ? 0 : num;
    },
    
    'is_null': (input, args) => input === null,
    
    'is_defined': (input, args) => input !== undefined && input !== null,
    
    'identity': (input, args) => input,
    
    'tap': (input, args, context) => {
        console.log(`🔍 TAP: ${JSON.stringify(input)}`);
        return input;
    }
};
