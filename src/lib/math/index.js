// FILENAME: src/lib/math/index.js
// Math library exports - FIXED FOR ENGINE INTEGRATION

import { FLUXUS_MATH_OPERATORS } from './math.js';
import { STATS_OPERATORS } from './stats.js';

// Combine all math operators
export const MATH_OPERATORS = {
    ...FLUXUS_MATH_OPERATORS,
    ...STATS_OPERATORS
};

// Export for domain registration
export const getOperators = () => {
    const operators = {};
    
    // Convert FLUXUS_MATH_OPERATORS format to simple functions
    for (const [name, operator] of Object.entries(FLUXUS_MATH_OPERATORS)) {
        operators[name] = operator.implementation;
    }
    
    // Add stats operators
    for (const [name, implementation] of Object.entries(STATS_OPERATORS)) {
        operators[name] = implementation;
    }
    
    return operators;
};

// Domain registration function
export const registerWithEngine = (engine) => {
    const operators = getOperators();
    let count = 0;
    
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

export { FLUXUS_MATH_OPERATORS, STATS_OPERATORS };
export default MATH_OPERATORS;
