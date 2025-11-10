// FILENAME: src/lib/math/trig/index.js
// Fluxus Math Trigonometry Library Index

// Re-export from main math library
export { 
    sin, cos, tan, asin, acos, atan, atan2 
} from '../math.js';

export const TRIG_INDEX = {
    name: 'fluxus_trigonometry', 
    version: '4.0.0',
    description: 'Trigonometric functions for Fluxus',
    operators: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2']
};
