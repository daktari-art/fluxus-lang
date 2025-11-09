// FILENAME: src/lib/time/time.js
// Time-based operations

export const TIME_OPERATORS = {
    'timestamp': (input, args) => Date.now(),
    
    'delay': async (input, args, context) => {
        const ms = parseInt(args[0]) || 1000;
        await new Promise(resolve => setTimeout(resolve, ms));
        return input;
    },
    
    'format_time': (input, args) => {
        const date = new Date(parseFloat(input) || Date.now());
        const format = args[0] || 'iso';
        
        switch (format) {
            case 'iso': return date.toISOString();
            case 'local': return date.toLocaleString();
            case 'time': return date.toTimeString();
            case 'date': return date.toDateString();
            default: return date.toString();
        }
    },
    
    'parse_time': (input, args) => {
        const date = new Date(input);
        return date.getTime();
    },
    
    'add_milliseconds': (input, args) => {
        const timestamp = parseFloat(input) || Date.now();
        const ms = parseInt(args[0]) || 0;
        return timestamp + ms;
    },
    
    'add_seconds': (input, args) => {
        const timestamp = parseFloat(input) || Date.now();
        const seconds = parseInt(args[0]) || 0;
        return timestamp + (seconds * 1000);
    },
    
    'add_minutes': (input, args) => {
        const timestamp = parseFloat(input) || Date.now();
        const minutes = parseInt(args[0]) || 0;
        return timestamp + (minutes * 60 * 1000);
    },
    
    'time_diff': (input, args) => {
        const time1 = parseFloat(input) || Date.now();
        const time2 = parseFloat(args[0]) || Date.now();
        return Math.abs(time1 - time2);
    }
};
