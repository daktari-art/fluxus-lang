// Core Library Index - Exports all core operators
import { CoreOperators } from './core.js';
import { TypeOperators } from './types.js';
import { CollectionOperators } from './collections.js';

export default {
    ...CoreOperators,
    ...TypeOperators,
    ...CollectionOperators
};
