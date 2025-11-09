// FILENAME: src/lib/math/math.js
// Mathematical operations

export const MATH_OPERATORS = {
    'add': (input, args) => {
        const result = args.reduce((acc, arg) => acc + parseFloat(arg), parseFloat(input));
        return result;
    },
    
    'subtract': (input, args) => {
        let result = parseFloat(input);
        args.forEach(arg => {
            result -= parseFloat(arg);
        });
        return result;
    },
    
    'multiply': (input, args) => {
        const result = args.reduce((acc, arg) => acc * parseFloat(arg), parseFloat(input));
        return result;
    },
    
    'divide': (input, args) => {
        let result = parseFloat(input);
        args.forEach(arg => {
            const divisor = parseFloat(arg);
            if (divisor === 0) throw new Error('Division by zero');
            result /= divisor;
        });
        return result;
    },
    
    'sin': (input, args) => Math.sin(parseFloat(input)),
    
    'cos': (input, args) => Math.cos(parseFloat(input)),
    
    'tan': (input, args) => Math.tan(parseFloat(input)),
    
    'sqrt': (input, args) => Math.sqrt(parseFloat(input)),
    
    'pow': (input, args) => Math.pow(parseFloat(input), parseFloat(args[0])),
    
    'log': (input, args) => Math.log(parseFloat(input)),
    
    'exp': (input, args) => Math.exp(parseFloat(input)),
    
    'abs': (input, args) => Math.abs(parseFloat(input)),
    
    'floor': (input, args) => Math.floor(parseFloat(input)),
    
    'ceil': (input, args) => Math.ceil(parseFloat(input)),
    
    'round': (input, args) => Math.round(parseFloat(input)),
    
    'max': (input, args) => Math.max(parseFloat(input), ...args.map(Number)),
    
    'min': (input, args) => Math.min(parseFloat(input), ...args.map(Number)),
    
    'random': (input, args) => {
        const max = parseFloat(args[0]) || 1;
        const min = parseFloat(args[1]) || 0;
        return Math.random() * (max - min) + min;
    },
    
    'pi': (input, args) => Math.PI,
    
    'e': (input, args) => Math.E
};
