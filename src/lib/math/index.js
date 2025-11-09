// FILENAME: src/lib/math/index.js
// Math library exports

import { MATH_OPERATORS } from './math.js';
import { STATS_OPERATORS } from './stats.js';

export const MATH_LIBRARY = {
    ...MATH_OPERATORS,
    ...STATS_OPERATORS
};

export { MATH_OPERATORS, STATS_OPERATORS };
