// FILENAME: src/stdlib/core/operators/MathOperators.js
// Mathematical Operators Library

export class MathOperators {
    static getOperators() {
        return {
            // Basic math
            'sin': {
                type: 'math',
                implementation: (x) => Math.sin(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Sine function'
            },
            'cos': {
                type: 'math',
                implementation: (x) => Math.cos(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Cosine function'
            },
            'tan': {
                type: 'math',
                implementation: (x) => Math.tan(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Tangent function'
            },
            'sqrt': {
                type: 'math',
                implementation: (x) => Math.sqrt(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Square root'
            },
            'pow': {
                type: 'math',
                implementation: (x, y) => Math.pow(x, y),
                signature: { input: 'Number', output: 'Number', args: 'Number' },
                description: 'Power function'
            },
            'log': {
                type: 'math',
                implementation: (x) => Math.log(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Natural logarithm'
            },
            'exp': {
                type: 'math',
                implementation: (x) => Math.exp(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Exponential function'
            },

            // Advanced math
            'abs': {
                type: 'math',
                implementation: (x) => Math.abs(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Absolute value'
            },
            'floor': {
                type: 'math',
                implementation: (x) => Math.floor(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Floor function'
            },
            'ceil': {
                type: 'math',
                implementation: (x) => Math.ceil(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Ceiling function'
            },
            'round': {
                type: 'math',
                implementation: (x) => Math.round(x),
                signature: { input: 'Number', output: 'Number', args: null },
                description: 'Round to nearest integer'
            },
            'max': {
                type: 'math',
                implementation: (x, y) => Math.max(x, y),
                signature: { input: 'Number', output: 'Number', args: 'Number' },
                description: 'Maximum of two numbers'
            },
            'min': {
                type: 'math',
                implementation: (x, y) => Math.min(x, y),
                signature: { input: 'Number', output: 'Number', args: 'Number' },
                description: 'Minimum of two numbers'
            },
            'random': {
                type: 'math',
                implementation: (max = 1) => Math.random() * max,
                signature: { input: 'Any', output: 'Number', args: 'Number' },
                description: 'Random number generation'
            },

            // Statistical operators
            'mean': {
                type: 'math',
                implementation: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
                signature: { input: 'Array', output: 'Number', args: null },
                description: 'Mean/average of array'
            },
            'sum': {
                type: 'math',
                implementation: (arr) => arr.reduce((a, b) => a + b, 0),
                signature: { input: 'Array', output: 'Number', args: null },
                description: 'Sum of array elements'
            },
            'median': {
                type: 'math',
                implementation: (arr) => {
                    const sorted = [...arr].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                },
                signature: { input: 'Array', output: 'Number', args: null },
                description: 'Median of array'
            }
        };
    }

    static executeOperator(name, input, args = []) {
        const operators = this.getOperators();
        const operator = operators[name];
        
        if (!operator) {
            throw new Error(`Unknown math operator: ${name}`);
        }

        return operator.implementation(input, ...args);
    }

    static validateMathOperation(name, input) {
        if (typeof input !== 'number' && !Array.isArray(input)) {
            throw new Error(`Math operator ${name} requires number or array input`);
        }
        return true;
    }
}

export default MathOperators;
