// FILENAME: src/lib/math/stats.js
// Statistical functions - ENHANCED TO MATCH ADVANCED MATH STRUCTURE

export const STATS_OPERATORS = {
    'mean': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                const sum = input.reduce((acc, val) => acc + context.engine.mathUtils.toNumber(val), 0);
                return sum / input.length;
            }
            return context.engine.mathUtils.toNumber(input);
        },
        metadata: {
            name: 'mean',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    },
    
    'median': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                
                const sorted = [...input].map(val => context.engine.mathUtils.toNumber(val)).sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                
                if (sorted.length % 2 === 0) {
                    return (sorted[mid - 1] + sorted[mid]) / 2;
                } else {
                    return sorted[mid];
                }
            }
            return context.engine.mathUtils.toNumber(input);
        },
        metadata: {
            name: 'median',
            category: 'statistical',
            complexity: 'O(n log n)',
            streamSafe: true
        }
    },
    
    'sum': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                return input.reduce((acc, val) => acc + context.engine.mathUtils.toNumber(val), 0);
            }
            return context.engine.mathUtils.toNumber(input);
        },
        metadata: {
            name: 'sum',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    },
    
    'stddev': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                
                const mean = input.reduce((acc, val) => acc + context.engine.mathUtils.toNumber(val), 0) / input.length;
                const squareDiffs = input.map(val => {
                    const diff = context.engine.mathUtils.toNumber(val) - mean;
                    return diff * diff;
                });
                const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / input.length;
                return Math.sqrt(avgSquareDiff);
            }
            return 0;
        },
        metadata: {
            name: 'stddev',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    },
    
    'variance': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                
                const mean = input.reduce((acc, val) => acc + context.engine.mathUtils.toNumber(val), 0) / input.length;
                const squareDiffs = input.map(val => {
                    const diff = context.engine.mathUtils.toNumber(val) - mean;
                    return diff * diff;
                });
                return squareDiffs.reduce((acc, val) => acc + val, 0) / input.length;
            }
            return 0;
        },
        metadata: {
            name: 'variance',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    },
    
    'average': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                const sum = input.reduce((acc, val) => acc + context.engine.mathUtils.toNumber(val), 0);
                return sum / input.length;
            }
            return context.engine.mathUtils.toNumber(input);
        },
        metadata: {
            name: 'average',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    },
    
    'max_value': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return null;
                return Math.max(...input.map(val => context.engine.mathUtils.toNumber(val)));
            }
            return context.engine.mathUtils.toNumber(input);
        },
        metadata: {
            name: 'max_value',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    },
    
    'min_value': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return null;
                return Math.min(...input.map(val => context.engine.mathUtils.toNumber(val)));
            }
            return context.engine.mathUtils.toNumber(input);
        },
        metadata: {
            name: 'min_value',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    },
    
    'range': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                const values = input.map(val => context.engine.mathUtils.toNumber(val));
                return Math.max(...values) - Math.min(...values);
            }
            return 0;
        },
        metadata: {
            name: 'range',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    }
};
