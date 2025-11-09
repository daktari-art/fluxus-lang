// FILENAME: src/lib/core/index.js
// Core library exports

import { CORE_OPERATORS } from './core.js';
import { TYPE_OPERATORS } from './types.js';
import { COLLECTION_OPERATORS } from './collections.js';

export const CORE_LIBRARY = {
    ...CORE_OPERATORS,
    ...TYPE_OPERATORS, 
    ...COLLECTION_OPERATORS
};

export { CORE_OPERATORS, TYPE_OPERATORS, COLLECTION_OPERATORS };
