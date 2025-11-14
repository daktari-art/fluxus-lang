// FILENAME: src/lib/math/math.js
// Fluxus Enterprise Math Library v4.0 - PRODUCTION GRADE

import { performance } from 'perf_hooks';

/**
 * ENTERPRISE MATH OPERATORS
 * 
 * Fluxus-Specific Features:
 * - Stream-aware mathematical operations
 * - Reactive math transformations
 * - Memory-efficient numerical algorithms
 * - Mobile-optimized calculations
 * - Statistical stream analysis
 */

export const FLUXUS_MATH_OPERATORS = {
    // ==================== BASIC ARITHMETIC OPERATORS ====================
    
    'add': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            const startTime = performance.now();
            
            try {
                let result;
                
                if (Array.isArray(input)) {
                    // Sum all elements in array
                    result = input.reduce((sum, num) => sum + this.toNumber(num), 0);
                    // Add any additional arguments
                    result += args.reduce((sum, arg) => sum + this.toNumber(arg), 0);
                } else {
                    // Single value addition
                    result = this.toNumber(input);
                    result += args.reduce((sum, arg) => sum + this.toNumber(arg), 0);
                }
                
                this.recordPerformance('add', performance.now() - startTime);
                return result;
                
            } catch (error) {
                throw new Error(`Addition failed: ${error.message}`);
            }
        },
        metadata: {
            name: 'add',
            category: 'arithmetic',
            complexity: 'O(n)',
            streamSafe: true,
            associative: true,
            commutative: true
        }
    },

    'subtract': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            const startTime = performance.now();
            
            try {
                let result = this.toNumber(input);
                
                // Subtract all arguments
                for (const arg of args) {
                    result -= this.toNumber(arg);
                }
                
                this.recordPerformance('subtract', performance.now() - startTime);
                return result;
                
            } catch (error) {
                throw new Error(`Subtraction failed: ${error.message}`);
            }
        },
        metadata: {
            name: 'subtract',
            category: 'arithmetic',
            complexity: 'O(n)',
            streamSafe: true
        }
    },

    'multiply': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            const startTime = performance.now();
            
            try {
                let result;
                
                if (Array.isArray(input)) {
                    // Product of all elements in array
                    result = input.reduce((product, num) => product * this.toNumber(num), 1);
                    // Multiply by any additional arguments
                    result *= args.reduce((product, arg) => product * this.toNumber(arg), 1);
                } else {
                    // Single value multiplication
                    result = this.toNumber(input);
                    result *= args.reduce((product, arg) => product * this.toNumber(arg), 1);
                }
                
                this.recordPerformance('multiply', performance.now() - startTime);
                return result;
                
            } catch (error) {
                throw new Error(`Multiplication failed: ${error.message}`);
            }
        },
        metadata: {
            name: 'multiply',
            category: 'arithmetic',
            complexity: 'O(n)',
            streamSafe: true,
            associative: true,
            commutative: true
        }
    },

    'divide': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            const startTime = performance.now();
            
            try {
                let result = this.toNumber(input);
                
                // Divide by all arguments
                for (const arg of args) {
                    const divisor = this.toNumber(arg);
                    if (divisor === 0) {
                        throw new Error('Division by zero');
                    }
                    result /= divisor;
                }
                
                this.recordPerformance('divide', performance.now() - startTime);
                return result;
                
            } catch (error) {
                throw new Error(`Division failed: ${error.message}`);
            }
        },
        metadata: {
            name: 'divide',
            category: 'arithmetic',
            complexity: 'O(n)',
            streamSafe: true,
            safe: true // Includes zero-check
        }
    },

    // ==================== ADVANCED MATH OPERATORS ====================
    
    'square': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            const num = this.toNumber(input);
            return num * num;
        },
        metadata: {
            name: 'square',
            category: 'arithmetic',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'sqrt': {
        type: 'transcendental',
        implementation: (input, args, context) => {
            const num = this.toNumber(input);
            if (num < 0) {
                throw new Error('Square root of negative number');
            }
            return Math.sqrt(num);
        },
        metadata: {
            name: 'sqrt',
            category: 'transcendental',
            complexity: 'O(1)',
            streamSafe: true,
            safe: true
        }
    },

    'power': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            const base = this.toNumber(input);
            const exponent = args.length > 0 ? this.toNumber(args[0]) : 2;
            return Math.pow(base, exponent);
        },
        metadata: {
            name: 'power',
            category: 'arithmetic',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    // ==================== TRIGONOMETRIC OPERATORS ====================
    
    'sin': {
        type: 'trigonometric',
        implementation: (input, args, context) => {
            const angle = this.toNumber(input);
            return Math.sin(angle);
        },
        metadata: {
            name: 'sin',
            category: 'trigonometric',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'cos': {
        type: 'trigonometric',
        implementation: (input, args, context) => {
            const angle = this.toNumber(input);
            return Math.cos(angle);
        },
        metadata: {
            name: 'cos',
            category: 'trigonometric',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'tan': {
        type: 'trigonometric',
        implementation: (input, args, context) => {
            const angle = this.toNumber(input);
            return Math.tan(angle);
        },
        metadata: {
            name: 'tan',
            category: 'trigonometric',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    // ==================== STATISTICAL OPERATORS ====================
    
    'mean': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                const sum = input.reduce((acc, val) => acc + this.toNumber(val), 0);
                return sum / input.length;
            }
            return this.toNumber(input);
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
                
                const sorted = [...input].map(this.toNumber).sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                
                if (sorted.length % 2 === 0) {
                    return (sorted[mid - 1] + sorted[mid]) / 2;
                } else {
                    return sorted[mid];
                }
            }
            return this.toNumber(input);
        },
        metadata: {
            name: 'median',
            category: 'statistical',
            complexity: 'O(n log n)',
            streamSafe: true
        }
    },

    'std_dev': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                
                const mean = this.mean(input);
                const squaredDiffs = input.map(val => {
                    const diff = this.toNumber(val) - mean;
                    return diff * diff;
                });
                const variance = this.mean(squaredDiffs);
                
                return Math.sqrt(variance);
            }
            return 0;
        },
        metadata: {
            name: 'std_dev',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true
        }
    },

    // ==================== COMPARISON OPERATORS ====================
    
    'greater_than': {
        type: 'comparison',
        implementation: (input, args, context) => {
            const value = this.toNumber(input);
            const comparison = args.length > 0 ? this.toNumber(args[0]) : 0;
            return value > comparison;
        },
        metadata: {
            name: 'greater_than',
            category: 'comparison',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true
        }
    },

    'less_than': {
        type: 'comparison',
        implementation: (input, args, context) => {
            const value = this.toNumber(input);
            const comparison = args.length > 0 ? this.toNumber(args[0]) : 0;
            return value < comparison;
        },
        metadata: {
            name: 'less_than',
            category: 'comparison',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true
        }
    },

    'equal_to': {
        type: 'comparison',
        implementation: (input, args, context) => {
            const value = this.toNumber(input);
            const comparison = args.length > 0 ? this.toNumber(args[0]) : 0;
            return value === comparison;
        },
        metadata: {
            name: 'equal_to',
            category: 'comparison',
            complexity: 'O(1)',
            streamSafe: true,
            returnsBoolean: true
        }
    },

    // ==================== UTILITY MATH OPERATORS ====================
    
    'abs': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            return Math.abs(this.toNumber(input));
        },
        metadata: {
            name: 'abs',
            category: 'arithmetic',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'round': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            const num = this.toNumber(input);
            const decimals = args.length > 0 ? this.toNumber(args[0]) : 0;
            
            if (decimals === 0) return Math.round(num);
            
            const factor = Math.pow(10, decimals);
            return Math.round(num * factor) / factor;
        },
        metadata: {
            name: 'round',
            category: 'arithmetic',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'ceil': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            return Math.ceil(this.toNumber(input));
        },
        metadata: {
            name: 'ceil',
            category: 'arithmetic',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'floor': {
        type: 'arithmetic',
        implementation: (input, args, context) => {
            return Math.floor(this.toNumber(input));
        },
        metadata: {
            name: 'floor',
            category: 'arithmetic',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    // ==================== RANDOM OPERATORS ====================
    
    'random': {
        type: 'random',
        implementation: (input, args, context) => {
            const min = args.length > 0 ? this.toNumber(args[0]) : 0;
            const max = args.length > 1 ? this.toNumber(args[1]) : 1;
            
            return Math.random() * (max - min) + min;
        },
        metadata: {
            name: 'random',
            category: 'random',
            complexity: 'O(1)',
            streamSafe: true,
            stateful: true
        }
    },

    'random_int': {
        type: 'random',
        implementation: (input, args, context) => {
            const min = args.length > 0 ? Math.floor(this.toNumber(args[0])) : 0;
            const max = args.length > 1 ? Math.floor(this.toNumber(args[1])) : 100;
            
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        metadata: {
            name: 'random_int',
            category: 'random',
            complexity: 'O(1)',
            streamSafe: true,
            stateful: true
        }
    },

    // ==================== STREAM MATH OPERATORS ====================
    
    'stream_sum': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (input && input.type === 'STREAM') {
                return input.values.reduce((sum, val) => sum + this.toNumber(val), 0);
            } else if (Array.isArray(input)) {
                return input.reduce((sum, val) => sum + this.toNumber(val), 0);
            }
            return this.toNumber(input);
        },
        metadata: {
            name: 'stream_sum',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true,
            streamAware: true
        }
    },

    'stream_average': {
        type: 'statistical',
        implementation: (input, args, context) => {
            if (input && input.type === 'STREAM') {
                if (input.values.length === 0) return 0;
                const sum = input.values.reduce((acc, val) => acc + this.toNumber(val), 0);
                return sum / input.values.length;
            } else if (Array.isArray(input)) {
                if (input.length === 0) return 0;
                const sum = input.reduce((acc, val) => acc + this.toNumber(val), 0);
                return sum / input.length;
            }
            return this.toNumber(input);
        },
        metadata: {
            name: 'stream_average',
            category: 'statistical',
            complexity: 'O(n)',
            streamSafe: true,
            streamAware: true
        }
    }
};

/**
 * ENTERPRISE MATH UTILITIES
 */
export class MathOperators {
    constructor() {
        this.performanceMetrics = new Map();
        this.mathCache = new Map();
        this.precision = 10; // Decimal places for calculations
        
        this.initializeMathConstants();
    }

    /**
     * MATH CONSTANTS AND CONFIGURATION
     */
    initializeMathConstants() {
        this.constants = {
            PI: Math.PI,
            E: Math.E,
            SQRT2: Math.SQRT2,
            SQRT1_2: Math.SQRT1_2,
            LN2: Math.LN2,
            LN10: Math.LN10,
            LOG2E: Math.LOG2E,
            LOG10E: Math.LOG10E
        };
    }

    /**
     * TYPE-SAFE NUMBER CONVERSION
     */
    toNumber(value) {
        if (typeof value === 'number') {
            return value;
        } else if (typeof value === 'string') {
            const num = parseFloat(value);
            if (isNaN(num)) {
                throw new Error(`Cannot convert '${value}' to number`);
            }
            return num;
        } else if (typeof value === 'boolean') {
            return value ? 1 : 0;
        } else if (value === null || value === undefined) {
            return 0;
        } else if (typeof value === 'object' && value.value !== undefined) {
            // Handle FluxusValue objects
            return this.toNumber(value.value);
        } else {
            throw new Error(`Unsupported type for number conversion: ${typeof value}`);
        }
    }

    /**
     * PERFORMANCE-OPTIMIZED IMPLEMENTATIONS
     */
    optimizedSum(values) {
        // Kahan summation algorithm for better numerical stability
        let sum = 0;
        let compensation = 0;
        
        for (const value of values) {
            const num = this.toNumber(value);
            const y = num - compensation;
            const t = sum + y;
            compensation = (t - sum) - y;
            sum = t;
        }
        
        return sum;
    }

    optimizedMean(values) {
        if (values.length === 0) return 0;
        
        // Use Welford's algorithm for numerical stability
        let mean = 0;
        for (let i = 0; i < values.length; i++) {
            const num = this.toNumber(values[i]);
            mean += (num - mean) / (i + 1);
        }
        
        return mean;
    }

    optimizedVariance(values) {
        if (values.length < 2) return 0;
        
        // Use Welford's algorithm for variance
        let mean = 0;
        let M2 = 0;
        
        for (let i = 0; i < values.length; i++) {
            const num = this.toNumber(values[i]);
            const delta = num - mean;
            mean += delta / (i + 1);
            M2 += delta * (num - mean);
        }
        
        return M2 / (values.length - 1); // Sample variance
    }

    /**
     * ADVANCED MATHEMATICAL FUNCTIONS
     */
    factorial(n) {
        if (n < 0) throw new Error('Factorial of negative number');
        if (n === 0 || n === 1) return 1;
        
        // Use cache for performance
        const cacheKey = `factorial_${n}`;
        if (this.mathCache.has(cacheKey)) {
            return this.mathCache.get(cacheKey);
        }
        
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        
        this.mathCache.set(cacheKey, result);
        return result;
    }

    gcd(a, b) {
        a = Math.abs(this.toNumber(a));
        b = Math.abs(this.toNumber(b));
        
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        
        return a;
    }

    lcm(a, b) {
        a = Math.abs(this.toNumber(a));
        b = Math.abs(this.toNumber(b));
        
        return (a * b) / this.gcd(a, b);
    }

    /**
     * STATISTICAL FUNCTIONS
     */
    percentile(values, p) {
        if (!Array.isArray(values) || values.length === 0) {
            return 0;
        }
        
        const sorted = [...values].map(this.toNumber).sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        
        if (Number.isInteger(index)) {
            return sorted[index];
        } else {
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index - lower;
            return sorted[lower] * (1 - weight) + sorted[upper] * weight;
        }
    }

    correlation(xValues, yValues) {
        if (!Array.isArray(xValues) || !Array.isArray(yValues) || 
            xValues.length !== yValues.length || xValues.length === 0) {
            return 0;
        }
        
        const n = xValues.length;
        const xMean = this.optimizedMean(xValues);
        const yMean = this.optimizedMean(yValues);
        
        let numerator = 0;
        let xVariance = 0;
        let yVariance = 0;
        
        for (let i = 0; i < n; i++) {
            const xDiff = this.toNumber(xValues[i]) - xMean;
            const yDiff = this.toNumber(yValues[i]) - yMean;
            
            numerator += xDiff * yDiff;
            xVariance += xDiff * xDiff;
            yVariance += yDiff * yDiff;
        }
        
        if (xVariance === 0 || yVariance === 0) return 0;
        
        return numerator / Math.sqrt(xVariance * yVariance);
    }

    /**
     * STREAM-ANALYTICS FUNCTIONS
     */
    analyzeStream(stream) {
        if (!stream || stream.type !== 'STREAM') {
            throw new Error('Expected a stream for analysis');
        }
        
        const values = stream.values.map(this.toNumber);
        
        return {
            count: values.length,
            sum: this.optimizedSum(values),
            mean: this.optimizedMean(values),
            min: Math.min(...values),
            max: Math.max(...values),
            variance: this.optimizedVariance(values),
            stdDev: Math.sqrt(this.optimizedVariance(values)),
            median: this.median(values),
            q1: this.percentile(values, 25),
            q3: this.percentile(values, 75)
        };
    }

    movingAverage(stream, windowSize = 5) {
        if (!stream || stream.type !== 'STREAM') {
            throw new Error('Expected a stream for moving average');
        }
        
        const values = stream.values.map(this.toNumber);
        const result = [];
        
        for (let i = 0; i <= values.length - windowSize; i++) {
            const window = values.slice(i, i + windowSize);
            result.push(this.optimizedMean(window));
        }
        
        return result;
    }

    /**
     * PERFORMANCE MONITORING
     */
    recordPerformance(operation, duration) {
        const stats = this.performanceMetrics.get(operation) || {
            count: 0,
            totalTime: 0,
            maxTime: 0,
            minTime: Infinity
        };
        
        stats.count++;
        stats.totalTime += duration;
        stats.maxTime = Math.max(stats.maxTime, duration);
        stats.minTime = Math.min(stats.minTime, duration);
        
        this.performanceMetrics.set(operation, stats);
    }

    getPerformanceReport() {
        const report = {};
        
        for (const [operation, stats] of this.performanceMetrics) {
            report[operation] = {
                averageTime: stats.totalTime / stats.count,
                maxTime: stats.maxTime,
                minTime: stats.minTime,
                totalCalls: stats.count
            };
        }
        
        return report;
    }

    /**
     * MEMORY MANAGEMENT
     */
    clearCache() {
        this.mathCache.clear();
    }

    setPrecision(decimalPlaces) {
        this.precision = Math.max(0, Math.min(20, decimalPlaces));
    }

    roundToPrecision(value) {
        const factor = Math.pow(10, this.precision);
        return Math.round(value * factor) / factor;
    }
}

/**
 * TRIGONOMETRY AND ADVANCED MATH
 */
export const trigonometry = {
    degreesToRadians: (degrees) => degrees * (Math.PI / 180),
    radiansToDegrees: (radians) => radians * (180 / Math.PI),
    
    sinh: (x) => (Math.exp(x) - Math.exp(-x)) / 2,
    cosh: (x) => (Math.exp(x) + Math.exp(-x)) / 2,
    tanh: (x) => (Math.exp(2 * x) - 1) / (Math.exp(2 * x) + 1),
    
    asin: (x) => Math.asin(x),
    acos: (x) => Math.acos(x),
    atan: (x) => Math.atan(x),
    atan2: (y, x) => Math.atan2(y, x)
};

/**
 * STATISTICS AND PROBABILITY
 */
export const statistics = {
    normalPDF: (x, mean = 0, stdDev = 1) => {
        const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
        return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    },
    
    normalCDF: (x, mean = 0, stdDev = 1) => {
        // Approximation of normal CDF
        const t = 1 / (1 + 0.2316419 * Math.abs((x - mean) / stdDev));
        const d = 0.3989423 * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        let probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.3302744))));
        
        if ((x - mean) / stdDev > 0) {
            probability = 1 - probability;
        }
        
        return probability;
    },
    
    binomialProbability: (n, k, p) => {
        const combinations = Math.exp(
            Math.lgamma(n + 1) - Math.lgamma(k + 1) - Math.lgamma(n - k + 1)
        );
        return combinations * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }
};

// Polyfill for lgamma if not available
if (typeof Math.lgamma === 'undefined') {
    Math.lgamma = function(z) {
        // Lanczos approximation for log gamma
        const g = 7;
        const p = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        
        if (z < 0.5) {
            return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - Math.lgamma(1 - z);
        }
        
        z -= 1;
        let x = p[0];
        for (let i = 1; i < p.length; i++) {
            x += p[i] / (z + i);
        }
        const t = z + g + 0.5;
        
        return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
    };
}

export default FLUXUS_MATH_OPERATORS;
