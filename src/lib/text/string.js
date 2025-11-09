// FILENAME: src/lib/text/string.js
// String manipulation

export const STRING_OPERATORS = {
    'trim': (input, args) => String(input).trim(),
    
    'to_upper': (input, args) => String(input).toUpperCase(),
    
    'to_lower': (input, args) => String(input).toLowerCase(),
    
    'concat': (input, args) => String(input) + args.join(''),
    
    'break': (input, args) => {
        const delimiter = args && args.length > 0 ? args[0] : ' ';
        return String(input).split(delimiter);
    },
    
    'join': (input, args) => {
        if (!Array.isArray(input)) return input;
        const delimiter = args && args.length > 0 ? args[0] : ',';
        return input.join(delimiter);
    },
    
    'replace': (input, args) => {
        const search = args[0] || '';
        const replacement = args[1] || '';
        return String(input).replace(new RegExp(search, 'g'), replacement);
    },
    
    'substring': (input, args) => {
        const start = parseInt(args[0]) || 0;
        const end = parseInt(args[1]) || String(input).length;
        return String(input).substring(start, end);
    },
    
    'length': (input, args) => String(input).length,
    
    'contains': (input, args) => String(input).includes(args[0]),
    
    'starts_with': (input, args) => String(input).startsWith(args[0]),
    
    'ends_with': (input, args) => String(input).endsWith(args[0]),
    
    'split_lines': (input, args) => String(input).split('\n'),
    
    'pad_left': (input, args) => {
        const length = parseInt(args[0]) || 0;
        const char = args[1] || ' ';
        return String(input).padStart(length, char);
    },
    
    'pad_right': (input, args) => {
        const length = parseInt(args[0]) || 0;
        const char = args[1] || ' ';
        return String(input).padEnd(length, char);
    }
};
