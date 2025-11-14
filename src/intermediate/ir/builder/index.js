// FILENAME: src/intermediate/ir/builder/index.js
// IR Builder Index

export { StreamIRBuilder } from '../StreamIRBuilder.js';
export { IRBuilder } from './IRBuilder.js';
export { IRInstructions } from './IRInstructions.js';

export function createIRBuilder(type = 'stream', config = {}) {
    switch (type) {
        case 'stream':
            return new StreamIRBuilder(config);
        default:
            throw new Error(`Unknown IR builder type: ${type}`);
    }
}

export default {
    createIRBuilder,
    StreamIRBuilder
};
