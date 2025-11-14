// FILENAME: src/intermediate/ir/builder/IRInstructions.js
// IR Instructions Utility

export class IRInstructions {
    static createInstruction(opcode, operands = [], result = null, metadata = {}) {
        return {
            opcode,
            operands,
            result,
            metadata: {
                ...metadata,
                instructionId: this.generateId(),
                timestamp: Date.now()
            }
        };
    }

    static generateId() {
        return `instr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static validateInstruction(instruction) {
        const required = ['opcode', 'operands'];
        for (const field of required) {
            if (!(field in instruction)) {
                throw new Error(`Instruction missing required field: ${field}`);
            }
        }

        if (!Array.isArray(instruction.operands)) {
            throw new Error('Instruction operands must be an array');
        }

        return true;
    }

    static getInstructionCategory(opcode) {
        const categories = {
            // Stream operations
            'CREATE_STREAM': 'STREAM_CREATION',
            'CREATE_LIVE_STREAM': 'STREAM_CREATION',
            'APPLY_OPERATOR': 'STREAM_TRANSFORMATION',
            'LENS_STEP': 'STREAM_TRANSFORMATION',
            
            // Pool operations
            'READ_POOL': 'POOL_OPERATION',
            'DECLARE_POOL': 'POOL_OPERATION',
            
            // Control flow
            'CONDITIONAL_BRANCH': 'CONTROL_FLOW',
            'LOOP_START': 'CONTROL_FLOW',
            
            // Constants
            'CONSTANT': 'CONSTANT_DECLARATION',
            
            // Generic
            'GENERIC_NODE': 'GENERIC'
        };

        return categories[opcode] || 'UNKNOWN';
    }

    static getOperandTypes(opcode) {
        const signatures = {
            'CREATE_STREAM': ['value', 'streamType'],
            'CREATE_LIVE_STREAM': ['generator', 'interval', 'options'],
            'APPLY_OPERATOR': ['input', 'operator', '...args'],
            'READ_POOL': ['poolName'],
            'DECLARE_POOL': ['poolName', 'initialValue']
        };

        return signatures[opcode] || [];
    }

    static formatInstruction(instruction) {
        const { opcode, operands, result } = instruction;
        const operandsStr = operands.map(op => 
            typeof op === 'string' ? `"${op}"` : JSON.stringify(op)
        ).join(', ');

        if (result) {
            return `${result} = ${opcode}(${operandsStr})`;
        } else {
            return `${opcode}(${operandsStr})`;
        }
    }

    static analyzeInstructionComplexity(instruction) {
        const complexityWeights = {
            'CREATE_STREAM': 1,
            'CREATE_LIVE_STREAM': 3,
            'APPLY_OPERATOR': 2,
            'LENS_STEP': 2,
            'READ_POOL': 1,
            'DECLARE_POOL': 1,
            'CONDITIONAL_BRANCH': 3,
            'LOOP_START': 4
        };

        const baseComplexity = complexityWeights[instruction.opcode] || 1;
        const operandComplexity = instruction.operands.length * 0.5;
        
        return baseComplexity + operandComplexity;
    }
}

export default IRInstructions;
