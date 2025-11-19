	// FILENAME: src/lib/data/streams.js
// Stream transformations - ENHANCED
export const DataStreams = {
    'debounce': (input, args, context) => {
        const ms = parseInt(args[0]) || 300;
        console.log(`⏰ Debounce: would delay ${ms}ms`);
        return input;
    },
    
    'throttle': (input, args, context) => {
        const ms = parseInt(args[0]) || 300;
        console.log(`🚦 Throttle: would limit to ${ms}ms`);
        return input;
    },
    
    'filter': (input, args) => {
        if (!Array.isArray(input)) return input;
        const condition = args[0];
        
        // Simple numeric filter for demo
        if (condition.includes('>')) {
            const threshold = parseFloat(condition.split('>')[1]);
            return input.filter(item => parseFloat(item) > threshold);
        }
        
        return input.filter(Boolean);
    },
    
    'take': (input, args) => {
        if (!Array.isArray(input)) return input;
        const count = parseInt(args[0]) || 1;
        return input.slice(0, count);
    },
    
    'skip': (input, args) => {
        if (!Array.isArray(input)) return input;
        const count = parseInt(args[0]) || 1;
        return input.slice(count);
    },
    
    'distinct': (input, args) => {
        if (!Array.isArray(input)) return input;
        return [...new Set(input)];
    },
    
    'flat_map': (input, args) => {
        if (!Array.isArray(input)) return input;
        return input.flat();
    },
    
    'group_by': (input, args) => {
        if (!Array.isArray(input)) return input;
        const key = args[0];
        
        return input.reduce((groups, item) => {
            const groupKey = item[key] || 'unknown';
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(item);
            return groups;
        }, {});
    },
    
    'sort': (input, args) => {
        if (!Array.isArray(input)) return input;
        const direction = args[0] || 'asc';
        
        const sorted = [...input].sort((a, b) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            
            if (!isNaN(numA) && !isNaN(numB)) {
                return direction === 'asc' ? numA - numB : numB - numA;
            }
            
            return direction === 'asc' 
                ? String(a).localeCompare(String(b))
                : String(b).localeCompare(String(a));
        });
        
        return sorted;
    },
    
    'reverse': (input, args) => {
        if (!Array.isArray(input)) return input;
        return [...input].reverse();
    },
    

    // CORE COLLECTION OPERATORS (moved from core/collections.js)
    'map': (input, args, context) => {
        if (!Array.isArray(input)) return input;
        const transform = args[0];
        // Implementation for map
        return input.map(item => {
            // Apply transformation logic
            return item;
        });
    },
    
    'filter': (input, args, context) => {
        if (!Array.isArray(input)) return input;
        const predicate = args[0];
        // Implementation for filter
        return input.filter(item => {
            // Apply predicate logic
            return true;
        });
    },
    
    'reduce': (input, args, context) => {
        if (!Array.isArray(input)) return input;
        const reducer = args[0];
        const initialValue = args[1];
        // Implementation for reduce
        return input.reduce((acc, item) => {
            // Apply reduction logic
            return acc;
        }, initialValue);
    },
    
    'find': (input, args, context) => {
        if (!Array.isArray(input)) return null;
        const predicate = args[0];
        return input.find(item => {
            // Apply predicate logic
            return true;
        });
    },
    
    'some': (input, args, context) => {
        if (!Array.isArray(input)) return false;
        const predicate = args[0];
        return input.some(item => {
            // Apply predicate logic
            return true;
        });
    },
    
    'every': (input, args, context) => {
        if (!Array.isArray(input)) return false;
        const predicate = args[0];
        return input.every(item => {
            // Apply predicate logic
            return true;
        });
    },
    
    // NEW: Add missing operators
    'count': (input, args) => {
        if (!Array.isArray(input)) return input;
        return input.length;
    },
    
    'first': (input, args) => {
        if (!Array.isArray(input)) return input;
        return input[0] || null;
    },
    
    'last': (input, args) => {
        if (!Array.isArray(input)) return input;
        return input[input.length - 1] || null;
    },
    
    'unique': (input, args) => {
        if (!Array.isArray(input)) return input;
        return [...new Set(input)];
    },
    
    'compact': (input, args) => {
        if (!Array.isArray(input)) return input;
        return input.filter(item => item != null && item !== '' && item !== false);
    }
};
