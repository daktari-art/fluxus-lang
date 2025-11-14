// FILENAME: src/intermediate/ir/stream-ir.js
// Main Stream IR Export

export { StreamIRBuilder } from './StreamIRBuilder.js';
export { StreamInstructionSet } from './instructions/stream-instructions.js';
export { IRBuilder } from './builder/IRBuilder.js';
export { IRInstructions } from './builder/IRInstructions.js';

export function createStreamIRBuilder(config = {}) {
    return new StreamIRBuilder(config);
}

export function createIRBuilder(config = {}) {
    return new IRBuilder(config);
}

export default {
    createStreamIRBuilder,
    createIRBuilder,
    StreamIRBuilder,
    IRBuilder
};
