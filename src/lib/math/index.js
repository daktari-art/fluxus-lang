// FILENAME: src/lib/math/index.js
// Math library exports - UPDATED FOR ADVANCED MATH INTEGRATION

import { FLUXUS_MATH_OPERATORS, MathOperators, trigonometry, statistics } from './math.js';
import { STATS_OPERATORS } from './stats.js';

// Create math utilities instance
const mathUtils = new MathOperators();

// Combine all math operators into flat implementation functions
export const getOperators = () => {
    const operators = {};
    
    // Convert FLUXUS_MATH_OPERATORS format to simple functions
    for (const [name, operator] of Object.entries(FLUXUS_MATH_OPERATORS)) {
        operators[name] = operator.implementation;
    }
    
    // Convert STATS_OPERATORS format to simple functions
    for (const [name, operator] of Object.entries(STATS_OPERATORS)) {
        operators[name] = operator.implementation;
    }
    
    // Add trigonometry functions
    operators['asin'] = trigonometry.asin;
    operators['acos'] = trigonometry.acos;
    operators['atan'] = trigonometry.atan;
    operators['atan2'] = trigonometry.atan2;
    
    // Add additional math functions
    operators['log'] = (input, args, context) => Math.log(mathUtils.toNumber(input));
    operators['exp'] = (input, args, context) => Math.exp(mathUtils.toNumber(input));
    operators['max'] = (input, args, context) => {
        if (Array.isArray(input)) {
            return Math.max(...input.map(val => mathUtils.toNumber(val)));
        }
        return mathUtils.toNumber(input);
    };
    operators['min'] = (input, args, context) => {
        if (Array.isArray(input)) {
            return Math.min(...input.map(val => mathUtils.toNumber(val)));
        }
        return mathUtils.toNumber(input);
    };
    
    // Aliases for compatibility
    operators['pow'] = operators['power'];
    operators['std_dev'] = operators['stddev'];
    operators['stream_average'] = operators['mean'];
    operators['stream_sum'] = operators['sum'];
    
    return operators;
};

// Domain registration function
export const registerWithEngine = (engine) => {
    const operators = getOperators();
    let count = 0;
    
    // Add mathUtils to engine context for operator use
    engine.mathUtils = mathUtils;
    
    for (const [name, implementation] of Object.entries(operators)) {
        if (!engine.operators.has(name)) {
            engine.operators.set(name, engine.createProductionOperatorWrapper(name, {
                implementation,
                library: 'math',
                type: 'math',
                domain: 'math'
            }));
            count++;
        }
    }
    
    console.log(`   🧮 Math domain registered: ${count} operators`);
    return count;
};

// Export everything for modules that need direct access
export { 
    FLUXUS_MATH_OPERATORS, 
    STATS_OPERATORS, 
    MathOperators,
    trigonometry,
    statistics 
};

// Export math utils for external use
export const MathUtils = mathUtils;

export default getOperators();
