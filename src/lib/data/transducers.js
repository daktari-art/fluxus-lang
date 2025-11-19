// FILENAME: src/lib/data/transducers.js
// Fluxus Transducer Operators for Efficient Data Transformation Pipelines

/**
 * Transducer operators for composing efficient, reusable transformation pipelines
 * Transducers separate transformation logic from iteration for better performance
 */

export const DataTransducers = {
    /**
     * Compose multiple transducers into a single transformation pipeline
     * @param {any} input - Stream input
     * @param {Array} args - [transducer1, transducer2, ...] Transducers to compose
     * @param {Object} context - Execution context
     * @returns {Function} Composed transducer function
     */
    'compose_transducers': (input, args, context) => {
        if (!args || args.length === 0) {
            return input;
        }
        
        // For direct execution, apply composed transducers to input
        const transducers = args.map(transducerName => 
            TRANSDUCER_OPERATORS[transducerName]
        ).filter(Boolean);
        
        if (transducers.length === 0) {
            return input;
        }
        
        let result = input;
        for (const transducer of transducers) {
            result = transducer(result, [], context);
        }
        return result;
    },
    
    /**
     * Map transducer for efficient array transformation
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [transformLens] Transformation to apply to each element
     * @param {Object} context - Execution context
     * @returns {Array} Transformed array
     */
    't_map': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const transformLens = args[0];
        if (!transformLens) {
            return input;
        }
        
        return input.map(item => {
            try {
                // Use lens evaluation for transformation
                const lensOps = context.engine.operators['compose_lenses'];
                if (lensOps) {
                    return lensOps(item, [transformLens], context);
                }
                return item;
            } catch (error) {
                console.warn(`⚠️ Map transducer failed:`, error.message);
                return item;
            }
        });
    },
    
    /**
     * Filter transducer for efficient array filtering
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [predicateLens] Filter condition
     * @param {Object} context - Execution context
     * @returns {Array} Filtered array
     */
    't_filter': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const predicateLens = args[0];
        if (!predicateLens) {
            return input;
        }
        
        return input.filter(item => {
            try {
                const lensOps = context.engine.operators['compose_lenses'];
                if (lensOps) {
                    const result = lensOps(item, [predicateLens], context);
                    return Boolean(result);
                }
                return true;
            } catch (error) {
                console.warn(`⚠️ Filter transducer failed:`, error.message);
                return false;
            }
        });
    },
    
    /**
     * Remove null/undefined values from stream
     * @param {any} input - Stream input
     * @param {Array} args - [includeEmptyStrings] Whether to include empty strings
     * @param {Object} context - Execution context
     * @returns {any} Filtered value or array
     */
    't_compact': (input, args, context) => {
        const includeEmptyStrings = args[0] === 'true';
        
        if (Array.isArray(input)) {
            return input.filter(item => 
                item !== null && 
                item !== undefined && 
                (includeEmptyStrings || item !== '')
            );
        }
        
        if (input === null || input === undefined || (!includeEmptyStrings && input === '')) {
            return undefined;
        }
        
        return input;
    },
    
    /**
     * Flatten nested arrays
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [depth] Flattening depth
     * @param {Object} context - Execution context
     * @returns {Array} Flattened array
     */
    't_flatten': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const depth = parseInt(args[0]) || 1;
        
        const flatten = (arr, currentDepth) => {
            if (currentDepth >= depth) {
                return arr;
            }
            
            return arr.reduce((acc, val) => 
                acc.concat(Array.isArray(val) ? flatten(val, currentDepth + 1) : val), []);
        };
        
        return flatten(input, 0);
    },
    
    /**
     * Remove duplicate values from array
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [keyLens] Key for object comparison
     * @param {Object} context - Execution context
     * @returns {Array} Array with duplicates removed
     */
    't_distinct': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const keyLens = args[0];
        
        if (keyLens) {
            // Distinct by key
            const seen = new Set();
            return input.filter(item => {
                try {
                    const lensOps = context.engine.operators['compose_lenses'];
                    if (lensOps) {
                        const key = lensOps(item, [keyLens], context);
                        if (seen.has(key)) {
                            return false;
                        }
                        seen.add(key);
                        return true;
                    }
                    return true;
                } catch (error) {
                    return true;
                }
            });
        } else {
            // Simple distinct
            return [...new Set(input)];
        }
    },
    
    /**
     * Take first N elements from array
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [count] Number of elements to take
     * @param {Object} context - Execution context
     * @returns {Array} First N elements
     */
    't_take': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const count = parseInt(args[0]) || 1;
        return input.slice(0, count);
    },
    
    /**
     * Skip first N elements from array
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [count] Number of elements to skip
     * @param {Object} context - Execution context
     * @returns {Array} Remaining elements
     */
    't_drop': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const count = parseInt(args[0]) || 1;
        return input.slice(count);
    },
    
    /**
     * Partition array into chunks
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [chunkSize] Size of each chunk
     * @param {Object} context - Execution context
     * @returns {Array} Array of chunks
     */
    't_partition': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const chunkSize = parseInt(args[0]) || 1;
        const result = [];
        
        for (let i = 0; i < input.length; i += chunkSize) {
            result.push(input.slice(i, i + chunkSize));
        }
        
        return result;
    },
    
    /**
     * Interleave multiple arrays
     * @param {Array} input - Stream input (array of arrays)
     * @param {Array} args - [arrays...] Additional arrays to interleave
     * @param {Object} context - Execution context
     * @returns {Array} Interleaved array
     */
    't_interleave': (input, args, context) => {
        const arrays = Array.isArray(input) ? [input, ...args.map(a => {
            try {
                return JSON.parse(a);
            } catch {
                return a;
            }
        })] : args.map(a => {
            try {
                return JSON.parse(a);
            } catch {
                return [a];
            }
        });
        
        const maxLength = Math.max(...arrays.map(arr => arr.length));
        const result = [];
        
        for (let i = 0; i < maxLength; i++) {
            for (const arr of arrays) {
                if (i < arr.length) {
                    result.push(arr[i]);
                }
            }
        }
        
        return result;
    },
    
    /**
     * Deduplicate array while preserving order
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [comparator] Custom comparator function
     * @param {Object} context - Execution context
     * @returns {Array} Deduplicated array
     */
    't_dedupe': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const seen = new Set();
        const result = [];
        
        for (const item of input) {
            const key = typeof item === 'object' ? JSON.stringify(item) : item;
            if (!seen.has(key)) {
                seen.add(key);
                result.push(item);
            }
        }
        
        return result;
    },
    
    /**
     * Transducer for sorting arrays
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [keyLens, direction] Sort key and direction
     * @param {Object} context - Execution context
     * @returns {Array} Sorted array
     */
    't_sort': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const keyLens = args[0];
        const direction = args[1] || 'asc';
        const multiplier = direction === 'desc' ? -1 : 1;
        
        if (!keyLens || keyLens === '.') {
            // Simple sort
            return [...input].sort((a, b) => {
                if (a < b) return -1 * multiplier;
                if (a > b) return 1 * multiplier;
                return 0;
            });
        }
        
        // Sort by key
        const lensOps = context.engine.operators['compose_lenses'];
        if (!lensOps) {
            return input;
        }
        
        return [...input].sort((a, b) => {
            try {
                const aKey = lensOps(a, [keyLens], context);
                const bKey = lensOps(b, [keyLens], context);
                
                if (aKey < bKey) return -1 * multiplier;
                if (aKey > bKey) return 1 * multiplier;
                return 0;
            } catch (error) {
                return 0;
            }
        });
    },
    
    /**
     * Group array elements by key
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [keyLens] Key to group by
     * @param {Object} context - Execution context
     * @returns {Object} Grouped object
     */
    't_group_by': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const keyLens = args[0];
        if (!keyLens) {
            return input;
        }
        
        const lensOps = context.engine.operators['compose_lenses'];
        if (!lensOps) {
            return input;
        }
        
        const groups = {};
        
        for (const item of input) {
            try {
                const key = lensOps(item, [keyLens], context);
                const keyStr = String(key);
                
                if (!groups[keyStr]) {
                    groups[keyStr] = [];
                }
                groups[keyStr].push(item);
            } catch (error) {
                // Skip items that cause errors
            }
        }
        
        return groups;
    },
    
    /**
     * Transducer for sampling array elements
     * @param {Array} input - Stream input (array)
     * @param {Array} args - [sampleRate] Sampling rate (0-1)
     * @param {Object} context - Execution context
     * @returns {Array} Sampled array
     */
    't_sample': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        const sampleRate = parseFloat(args[0]) || 0.1;
        
        return input.filter(() => Math.random() < sampleRate);
    },
    
    /**
     * Transducer for array reversal
     * @param {Array} input - Stream input (array)
     * @param {Array} args - Arguments (unused)
     * @param {Object} context - Execution context
     * @returns {Array} Reversed array
     */
    't_reverse': (input, args, context) => {
        if (!Array.isArray(input)) {
            return input;
        }
        
        return [...input].reverse();
    }
};
