// FILENAME: src/lib/math/trig/index.js
// Fluxus Math Trigonometry Library Index

import { trigonometry } from '../math.js';

// Export trigonometry functions
export const sin = (input, args, context) => Math.sin(context.engine.mathUtils.toNumber(input));
export const cos = (input, args, context) => Math.cos(context.engine.mathUtils.toNumber(input));
export const tan = (input, args, context) => Math.tan(context.engine.mathUtils.toNumber(input));
export const asin = trigonometry.asin;
export const acos = trigonometry.acos;
export const atan = trigonometry.atan;
export const atan2 = trigonometry.atan2;

export const TRIG_INDEX = {
    name: 'fluxus_trigonometry', 
    version: '4.0.0',
    description: 'Trigonometric functions for Fluxus',
    operators: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2']
};

export const Trigonometry = trigonometry;
