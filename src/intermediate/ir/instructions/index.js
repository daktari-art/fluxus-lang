// FILENAME: src/intermediate/ir/instructions/index.js
// IR Instructions Index

import { StreamInstructionSet } from './stream-instructions.js';

export const InstructionSets = {
    stream: StreamInstructionSet
};

export function getInstructionSet(type = 'stream') {
    const set = InstructionSets[type];
    if (!set) {
        throw new Error(`Unknown instruction set: ${type}`);
    }
    return set;
}

export function createInstruction(opcode, operands = [], metadata = {}) {
    return {
        opcode,
        operands,
        metadata,
        timestamp: Date.now()
    };
}

export const InstructionCategories = {
    STREAM_CREATION: [
        'STREAM_SOURCE',
        'LIVE_STREAM_SOURCE',
        'POOL_READ'
    ],
    STREAM_TRANSFORMATION: [
        'STREAM_MAP_ADVANCED',
        'STREAM_FILTER_ADVANCED',
        'STREAM_FLAT_MAP'
    ],
    STREAM_COMBINATION: [
        'STREAM_MERGE',
        'STREAM_ZIP'
    ],
    STREAM_CONTROL: [
        'STREAM_SPLIT',
        'STREAM_WINDOW'
    ],
    STREAM_TERMINAL: [
        'STREAM_COLLECT',
        'STREAM_FOR_EACH'
    ]
};

export default InstructionSets;
