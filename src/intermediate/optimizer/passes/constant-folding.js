// FILENAME: src/intermediate/optimizer/passes/constant-folding.js
// Constant Folding Optimization Pass

export class ConstantFoldingOptimizer {
    constructor(config = {}) {
        this.config = {
            aggressive: config.aggressive || false,
            maxIterations: config.maxIterations || 10,
            ...config
        };
        
        this.constantCache = new Map();
    }

    optimize(irProgram) {
        let changed = true;
        let iterations = 0;
        let currentIR = { ...irProgram };

        while (changed && iterations < this.config.maxIterations) {
            changed = false;
            iterations++;

            const newInstructions = [];
            
            for (const instruction of currentIR.instructions) {
                const folded = this.foldConstants(instruction, currentIR);
                
                if (folded !== instruction) {
                    changed = true;
                    newInstructions.push(folded);
                } else {
                    newInstructions.push(instruction);
                }
            }

            currentIR.instructions = newInstructions;
        }

        return {
            ...currentIR,
            metadata: {
                ...currentIR.metadata,
                optimizations: {
                    constantFolding: {
                        iterations,
                        constantsFolded: this.constantCache.size
                    }
                }
            }
        };
    }

    foldConstants(instruction, irProgram) {
        switch (instruction.opcode) {
            case 'APPLY_OPERATOR':
                return this.foldOperator(instruction);
            case 'LENS_STEP':
                return this.foldLensStep(instruction);
            case 'CREATE_STREAM':
                return this.foldStreamCreation(instruction);
            default:
                return instruction;
        }
    }

    foldOperator(instruction) {
        const [input, operator, ...args] = instruction.operands;
        
        // Check if all operands are constants
        if (this.isConstant(input) && args.every(arg => this.isConstant(arg))) {
            try {
                const result = this.evaluateOperator(operator, input, args);
                
                if (result !== undefined) {
                    this.constantCache.set(instruction.result, result);
                    
                    return {
                        opcode: 'CONSTANT',
                        operands: [result],
                        result: instruction.result,
                        metadata: {
                            ...instruction.metadata,
                            folded: true,
                            originalOpcode: instruction.opcode
                        }
                    };
                }
            } catch (error) {
                // If evaluation fails, keep original instruction
                console.warn(`Constant folding failed for ${operator}:`, error.message);
            }
        }

        return instruction;
    }

    foldLensStep(instruction) {
        const [input, operation, ...args] = instruction.operands;
        
        if (this.isConstant(input) && args.every(arg => this.isConstant(arg))) {
            try {
                const result = this.evaluateLensOperation(operation, input, args);
                
                if (result !== undefined) {
                    this.constantCache.set(instruction.result, result);
                    
                    return {
                        opcode: 'CONSTANT',
                        operands: [result],
                        result: instruction.result,
                        metadata: {
                            ...instruction.metadata,
                            folded: true,
                            originalOpcode: instruction.opcode
                        }
                    };
                }
            } catch (error) {
                console.warn(`Lens constant folding failed for ${operation}:`, error.message);
            }
        }

        return instruction;
    }

    foldStreamCreation(instruction) {
        const [values, streamType] = instruction.operands;
        
        // Fold constant array streams
        if (Array.isArray(values) && values.every(v => this.isConstant(v))) {
            // For finite streams with constant values, we can pre-compute
            if (streamType === 'FINITE') {
                this.constantCache.set(instruction.result, values);
            }
        }

        return instruction;
    }

    isConstant(value) {
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
            return true;
        }
        
        if (Array.isArray(value)) {
            return value.every(item => this.isConstant(item));
        }
        
        if (typeof value === 'string' && value.startsWith('sym_')) {
            return this.constantCache.has(value);
        }
        
        return false;
    }

    evaluateOperator(operator, input, args) {
        const inputValue = this.getConstantValue(input);
        
        switch (operator) {
            case 'add':
                return inputValue + this.getConstantValue(args[0]);
            case 'subtract':
                return inputValue - this.getConstantValue(args[0]);
            case 'multiply':
                return inputValue * this.getConstantValue(args[0]);
            case 'divide':
                const divisor = this.getConstantValue(args[0]);
                if (divisor === 0) throw new Error('Division by zero');
                return inputValue / divisor;
            case 'to_upper':
                return String(inputValue).toUpperCase();
            case 'to_lower':
                return String(inputValue).toLowerCase();
            case 'trim':
                return String(inputValue).trim();
            default:
                return undefined;
        }
    }

    evaluateLensOperation(operation, input, args) {
        const inputValue = this.getConstantValue(input);
        
        switch (operation) {
            case 'value_access':
                return inputValue && typeof inputValue === 'object' ? inputValue.value : inputValue;
            default:
                return undefined;
        }
    }

    getConstantValue(value) {
        if (typeof value === 'string' && value.startsWith('sym_')) {
            return this.constantCache.get(value);
        }
        return value;
    }

    getOptimizationReport() {
        return {
            type: 'constant_folding',
            constantsFolded: this.constantCache.size,
            cache: Object.fromEntries(this.constantCache)
        };
    }
}

export default ConstantFoldingOptimizer;
