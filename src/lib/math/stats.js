// FILENAME: src/lib/math/stats.js
// Statistical functions - ENHANCED

export const STATS_OPERATORS = {
    'mean': (input, args) => {
        if (!Array.isArray(input)) return input;
        if (input.length === 0) return 0;
        const sum = input.reduce((acc, val) => acc + parseFloat(val), 0);
        return sum / input.length;
    },
    
    'median': (input, args) => {
        if (!Array.isArray(input)) return input;
        if (input.length === 0) return 0;
        
        const sorted = [...input].sort((a, b) => parseFloat(a) - parseFloat(b));
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (parseFloat(sorted[mid - 1]) + parseFloat(sorted[mid])) / 2;
        }
        return parseFloat(sorted[mid]);
    },
    
    'sum': (input, args) => {
        if (!Array.isArray(input)) return input;
        return input.reduce((acc, val) => acc + parseFloat(val), 0);
    },
    
    'stddev': (input, args) => {
        if (!Array.isArray(input)) return input;
        if (input.length === 0) return 0;
        
        const mean = input.reduce((acc, val) => acc + parseFloat(val), 0) / input.length;
        const squareDiffs = input.map(val => {
            const diff = parseFloat(val) - mean;
            return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / input.length;
        return Math.sqrt(avgSquareDiff);
    },
    
    'variance': (input, args) => {
        if (!Array.isArray(input)) return input;
        if (input.length === 0) return 0;
        
        const mean = input.reduce((acc, val) => acc + parseFloat(val), 0) / input.length;
        const squareDiffs = input.map(val => {
            const diff = parseFloat(val) - mean;
            return diff * diff;
        });
        return squareDiffs.reduce((acc, val) => acc + val, 0) / input.length;
    },
    
    // NEW: Add missing operators
    'average': (input, args) => {
        if (!Array.isArray(input)) return input;
        if (input.length === 0) return 0;
        const sum = input.reduce((acc, val) => acc + parseFloat(val), 0);
        return sum / input.length;
    },
    
    'max_value': (input, args) => {
        if (!Array.isArray(input)) return input;
        if (input.length === 0) return null;
        return Math.max(...input.map(val => parseFloat(val)));
    },
    
    'min_value': (input, args) => {
        if (!Array.isArray(input)) return input;
        if (input.length === 0) return null;
        return Math.min(...input.map(val => parseFloat(val)));
    }
};
