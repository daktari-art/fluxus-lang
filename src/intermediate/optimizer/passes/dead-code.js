// FILENAME: src/intermediate/optimizer/passes/dead-code.js
// Dead Code Elimination Optimization Pass

export class DeadCodeEliminator {
    constructor(config = {}) {
        this.config = {
            removeUnusedPools: config.removeUnusedPools !== false,
            removeUnusedStreams: config.removeUnusedStreams !== false,
            aggressive: config.aggressive || false,
            ...config
        };
        
        this.usedSymbols = new Set();
        this.removedCount = 0;
    }

    optimize(irProgram) {
        this.usedSymbols.clear();
        this.removedCount = 0;

        // First pass: mark used symbols
        this.markUsedSymbols(irProgram);

        // Second pass: remove dead code
        const optimizedInstructions = this.removeDeadCode(irProgram.instructions);

        return {
            ...irProgram,
            instructions: optimizedInstructions,
            metadata: {
                ...irProgram.metadata,
                optimizations: {
                    deadCodeElimination: {
                        removedInstructions: this.removedCount,
                        usedSymbols: this.usedSymbols.size
                    }
                }
            }
        };
    }

    markUsedSymbols(irProgram) {
        // Mark all symbols that are used as operands
        for (const instruction of irProgram.instructions) {
            this.markInstructionOperands(instruction);
        }

        // Mark terminal operations as used (they produce output)
        this.markTerminalOperations(irProgram.instructions);
    }

    markInstructionOperands(instruction) {
        for (const operand of instruction.operands) {
            if (this.isSymbol(operand)) {
                this.usedSymbols.add(operand);
            } else if (Array.isArray(operand)) {
                this.markArrayOperands(operand);
            } else if (typeof operand === 'object' && operand !== null) {
                this.markObjectOperands(operand);
            }
        }
    }

    markArrayOperands(array) {
        for (const item of array) {
            if (this.isSymbol(item)) {
                this.usedSymbols.add(item);
            }
        }
    }

    markObjectOperands(obj) {
        for (const value of Object.values(obj)) {
            if (this.isSymbol(value)) {
                this.usedSymbols.add(value);
            } else if (Array.isArray(value)) {
                this.markArrayOperands(value);
            }
        }
    }

    markTerminalOperations(instructions) {
        // Mark the last instruction's result as used (program output)
        if (instructions.length > 0) {
            const lastInstruction = instructions[instructions.length - 1];
            if (lastInstruction.result) {
                this.usedSymbols.add(lastInstruction.result);
            }
        }

        // Mark sink operations as used
        for (const instruction of instructions) {
            if (this.isSinkOperation(instruction)) {
                if (instruction.result) {
                    this.usedSymbols.add(instruction.result);
                }
            }
        }
    }

    removeDeadCode(instructions) {
        const liveInstructions = [];
        const symbolDefinitions = new Map();

        // First pass: build definition map
        for (const instruction of instructions) {
            if (instruction.result) {
                symbolDefinitions.set(instruction.result, instruction);
            }
        }

        // Second pass: keep only live instructions
        for (const instruction of instructions) {
            if (this.isInstructionLive(instruction, symbolDefinitions)) {
                liveInstructions.push(instruction);
            } else {
                this.removedCount++;
            }
        }

        return liveInstructions;
    }

    isInstructionLive(instruction, symbolDefinitions) {
        // Always keep these instruction types
        if (this.isAlwaysLive(instruction)) {
            return true;
        }

        // Keep if result is used
        if (instruction.result && this.usedSymbols.has(instruction.result)) {
            return true;
        }

        // Keep if it has side effects
        if (this.hasSideEffects(instruction)) {
            return true;
        }

        // Keep if it's a pool declaration (stateful)
        if (instruction.opcode === 'DECLARE_POOL') {
            return true;
        }

        // Keep if aggressive mode is off and it's a stream operation
        if (!this.config.aggressive && instruction.opcode.startsWith('CREATE_')) {
            return true;
        }

        return false;
    }

    isAlwaysLive(instruction) {
        const alwaysLiveOpcodes = [
            'PRINT',
            'TO_POOL',
            'UI_RENDER',
            'WRITE_FILE'
        ];

        return alwaysLiveOpcodes.includes(instruction.opcode);
    }

    hasSideEffects(instruction) {
        const sideEffectOpcodes = [
            'PRINT',
            'TO_POOL',
            'UI_RENDER',
            'WRITE_FILE',
            'CREATE_LIVE_STREAM',
            'DECLARE_POOL'
        ];

        return sideEffectOpcodes.includes(instruction.opcode);
    }

    isSinkOperation(instruction) {
        const sinkOpcodes = [
            'PRINT',
            'TO_POOL',
            'UI_RENDER',
            'WRITE_FILE'
        ];

        return sinkOpcodes.includes(instruction.opcode);
    }

    isSymbol(value) {
        return typeof value === 'string' && 
               (value.startsWith('sym_') || 
                value.startsWith('stream_') || 
                value.startsWith('pool_'));
    }

    getOptimizationReport() {
        return {
            type: 'dead_code_elimination',
            removedInstructions: this.removedCount,
            usedSymbols: this.usedSymbols.size
        };
    }
}

export default DeadCodeEliminator;
