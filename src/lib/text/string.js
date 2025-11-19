// FILENAME: src/lib/text/string.js
// Fluxus Enterprise String Library v4.0 - STREAM-OPTIMIZED

/**
 * ENTERPRISE STRING OPERATORS FOR FLUXUS
 * 
 * Fluxus Integration Features:
 * - Stream-aware string processing
 * - Reactive string transformations  
 * - Lens-compatible string operations
 * - Memory-efficient for mobile (Termux)
 * - Unicode-safe for international text
 * - Security-focused string handling
 */

export const FLUXUS_STRING_OPERATORS = {
    // ==================== BASIC STRING OPERATIONS ====================
    
    'trim': {
        type: 'transformation',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                return input.map(str => String(str).trim());
            }
            return String(input).trim();
        },
        description: 'Removes whitespace from both ends of a string',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true
    },

    'to_upper': {
        type: 'transformation', 
        implementation: (input, args, context) => {
            const locale = args[0];
            if (Array.isArray(input)) {
                return input.map(str => 
                    locale ? String(str).toLocaleUpperCase(locale) : String(str).toUpperCase()
                );
            }
            return locale ? 
                String(input).toLocaleUpperCase(locale) : String(input).toUpperCase();
        },
        description: 'Converts string to uppercase',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true,
        unicodeAware: true
    },

    'to_lower': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const locale = args[0];
            if (Array.isArray(input)) {
                return input.map(str =>
                    locale ? String(str).toLocaleLowerCase(locale) : String(str).toLowerCase()
                );
            }
            return locale ?
                String(input).toLocaleLowerCase(locale) : String(input).toLowerCase();
        },
        description: 'Converts string to lowercase', 
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true,
        unicodeAware: true
    },

    'concat': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const separator = args[0] || '';
            
            if (Array.isArray(input)) {
                // Handle array concatenation
                if (args.length > 1) {
                    const additionalItems = args.slice(1);
                    return [...input, ...additionalItems].join(separator);
                }
                return input.join(separator);
            }
            
            // Handle string concatenation  
            if (args.length > 1) {
                return String(input) + separator + args.slice(1).join(separator);
            }
            return String(input);
        },
        description: 'Concatenates strings with optional separator',
        inputType: 'Any',
        outputType: 'String',
        streamSafe: true,
        memoryEfficient: true
    },

    // ==================== PATTERN MATCHING OPERATIONS ====================
    
    'split': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const delimiter = args[0] || ' ';
            const limit = args[1] ? parseInt(args[1]) : undefined;
            
            if (Array.isArray(input)) {
                return input.flatMap(str => String(str).split(delimiter, limit));
            }
            return String(input).split(delimiter, limit);
        },
        description: 'Splits string into array by delimiter',
        inputType: 'String|Array',
        outputType: 'Array',
        streamSafe: true
    },

    'match': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const pattern = args[0];
            const flags = args[1] || '';
            
            try {
                const regex = new RegExp(pattern, flags);
                const str = String(input);
                const matches = str.match(regex);
                
                if (!matches) return null;
                
                return {
                    matches: matches,
                    index: matches.index,
                    input: matches.input,
                    groups: matches.groups || {}
                };
            } catch (error) {
                throw new Error(`Invalid regex pattern: ${error.message}`);
            }
        },
        description: 'Matches string against regular expression',
        inputType: 'String',
        outputType: 'Object|null',
        streamSafe: true
    },

    'test': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const pattern = args[0];
            const flags = args[1] || '';
            
            try {
                const regex = new RegExp(pattern, flags);
                return regex.test(String(input));
            } catch (error) {
                throw new Error(`Invalid regex pattern: ${error.message}`);
            }
        },
        description: 'Tests if string matches regular expression',
        inputType: 'String',
        outputType: 'Boolean',
        streamSafe: true
    },

    // ==================== STRING ANALYSIS OPERATIONS ====================
    
    'length': {
        type: 'transformation',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                return input.map(str => String(str).length);
            }
            return String(input).length;
        },
        description: 'Returns length of string',
        inputType: 'String|Array',
        outputType: 'Number|Array',
        streamSafe: true,
        unicodeAware: true
    },

    'contains': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const searchStr = args[0];
            if (Array.isArray(input)) {
                return input.map(str => String(str).includes(searchStr));
            }
            return String(input).includes(searchStr);
        },
        description: 'Checks if string contains substring',
        inputType: 'String|Array',
        outputType: 'Boolean|Array',
        streamSafe: true
    },

    'starts_with': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const searchStr = args[0];
            const position = args[1] ? parseInt(args[1]) : 0;
            
            if (Array.isArray(input)) {
                return input.map(str => String(str).startsWith(searchStr, position));
            }
            return String(input).startsWith(searchStr, position);
        },
        description: 'Checks if string starts with substring',
        inputType: 'String|Array',
        outputType: 'Boolean|Array',
        streamSafe: true
    },

    'ends_with': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const searchStr = args[0];
            const length = args[1] ? parseInt(args[1]) : undefined;
            
            if (Array.isArray(input)) {
                return input.map(str => String(str).endsWith(searchStr, length));
            }
            return String(input).endsWith(searchStr, length);
        },
        description: 'Checks if string ends with substring',
        inputType: 'String|Array',
        outputType: 'Boolean|Array',
        streamSafe: true
    },

    // ==================== ADVANCED TEXT PROCESSING ====================
    
    'substring': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const start = parseInt(args[0]);
            const end = args[1] ? parseInt(args[1]) : undefined;
            
            if (Array.isArray(input)) {
                return input.map(str => String(str).substring(start, end));
            }
            return String(input).substring(start, end);
        },
        description: 'Extracts substring between indices',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true
    },

    'replace': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const searchValue = args[0];
            const replaceValue = args[1] || '';
            
            if (Array.isArray(input)) {
                return input.map(str => {
                    if (searchValue instanceof RegExp) {
                        return String(str).replace(searchValue, replaceValue);
                    }
                    return String(str).replaceAll(searchValue, replaceValue);
                });
            }
            
            if (searchValue instanceof RegExp) {
                return String(input).replace(searchValue, replaceValue);
            }
            return String(input).replaceAll(searchValue, replaceValue);
        },
        description: 'Replaces occurrences of search string with replacement',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true
    },

    'repeat': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const count = parseInt(args[0]);
            
            if (Array.isArray(input)) {
                return input.map(str => String(str).repeat(count));
            }
            return String(input).repeat(count);
        },
        description: 'Repeats string specified number of times',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true
    },

    // ==================== ENCODING OPERATIONS ====================
    
    'encode_base64': {
        type: 'transformation',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                return input.map(str => Buffer.from(String(str), 'utf8').toString('base64'));
            }
            return Buffer.from(String(input), 'utf8').toString('base64');
        },
        description: 'Encodes string to base64',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true
    },

    'decode_base64': {
        type: 'transformation',
        implementation: (input, args, context) => {
            try {
                if (Array.isArray(input)) {
                    return input.map(encoded => 
                        Buffer.from(String(encoded), 'base64').toString('utf8')
                    );
                }
                return Buffer.from(String(input), 'base64').toString('utf8');
            } catch (error) {
                throw new Error('Invalid base64 encoding');
            }
        },
        description: 'Decodes base64 string to UTF-8',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true
    },

    // ==================== SECURITY OPERATIONS ====================
    
    'escape_html': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '/': '&#x2F;'
            };
            
            const escapeHtml = (str) => {
                return String(str).replace(/[&<>"'/]/g, char => escapeMap[char]);
            };
            
            if (Array.isArray(input)) {
                return input.map(escapeHtml);
            }
            return escapeHtml(input);
        },
        description: 'Escapes HTML special characters',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true,
        securityCritical: true
    },

    'sanitize': {
        type: 'transformation',
        implementation: (input, args, context) => {
            // Basic sanitization - remove potentially dangerous characters
            const dangerousPattern = /[<>{}[\]\\]/g;
            
            if (Array.isArray(input)) {
                return input.map(str => String(str).replace(dangerousPattern, ''));
            }
            return String(input).replace(dangerousPattern, '');
        },
        description: 'Sanitizes string by removing dangerous characters',
        inputType: 'String|Array',
        outputType: 'String|Array',
        streamSafe: true,
        securityCritical: true
    }
};

/**
 * ENTERPRISE STRING UTILITIES FOR FLUXUS LENSES
 * These utilities are designed to work within Lens blocks {}
 */
export const STRING_LENS_UTILITIES = {
    // Lens-compatible string operations
    trim: (str) => String(str).trim(),
    toUpper: (str) => String(str).toUpperCase(),
    toLower: (str) => String(str).toLowerCase(),
    length: (str) => String(str).length,
    substring: (str, start, end) => String(str).substring(start, end),
    replace: (str, search, replacement) => String(str).replaceAll(search, replacement)
};

export const StringOperators = FLUXUS_STRING_OPERATORS;

export default FLUXUS_STRING_OPERATORS;
