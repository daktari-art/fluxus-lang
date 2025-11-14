// FILENAME: src/intermediate/ir/StreamIRBuilder.js
// Fluxus Stream IR Builder - Production Grade

import { StreamInstructionSet } from './instructions/stream-instructions.js';

export class StreamIRBuilder {
    constructor(config = {}) {
        this.config = {
            enableOptimization: true,
            enableFusion: true,
            maxPipelineDepth: 10,
            ...config
        };

        this.instructionSet = new StreamInstructionSet(this);
        this.currentPipeline = [];
        this.streamCounter = 0;
        this.symbolTable = new Map();
    }

    buildFromAST(ast) {
        if (!ast || !ast.nodes) {
            throw new Error('Invalid AST: nodes missing');
        }

        const irProgram = {
            type: 'IR_PROGRAM',
            streams: [],
            pipelines: [],
            instructions: [],
            metadata: {
                source: ast.metadata?.sourceLines || 0,
                generatedAt: new Date().toISOString()
            }
        };

        // Process AST nodes into IR instructions
        for (const node of ast.nodes) {
            const instructions = this.buildNodeIR(node);
            irProgram.instructions.push(...instructions);
        }

        // Optimize the IR
        if (this.config.enableOptimization) {
            irProgram.instructions = this.optimizeIR(irProgram.instructions);
        }

        return irProgram;
    }

    buildNodeIR(node) {
        const instructions = [];

        switch (node.type) {
            case 'STREAM_SOURCE_FINITE':
                instructions.push(this.buildFiniteStreamSource(node));
                break;
            case 'STREAM_SOURCE_LIVE':
                instructions.push(this.buildLiveStreamSource(node));
                break;
            case 'FUNCTION_OPERATOR':
                instructions.push(this.buildFunctionOperator(node));
                break;
            case 'LENS_OPERATOR':
                instructions.push(...this.buildLensOperator(node));
                break;
            case 'POOL_READ':
                instructions.push(this.buildPoolRead(node));
                break;
            case 'POOL_DECLARATION':
                instructions.push(this.buildPoolDeclaration(node));
                break;
            default:
                console.warn(`Unhandled node type: ${node.type}`);
        }

        return instructions;
    }

    buildFiniteStreamSource(node) {
        const streamId = this.generateStreamId();
        
        return {
            type: 'STREAM_SOURCE',
            opcode: 'STREAM_SOURCE',
            operands: [
                this.parseStreamValue(node.value),
                { streamType: 'FINITE', source: 'LITERAL' }
            ],
            result: streamId,
            metadata: {
                nodeType: node.type,
                position: node.position,
                streamId: streamId
            }
        };
    }

    buildLiveStreamSource(node) {
        const streamId = this.generateStreamId();
        const isLive = node.value.startsWith('~?');
        const sourceValue = isLive ? node.value.substring(2) : node.value.substring(1);

        return {
            type: 'STREAM_SOURCE',
            opcode: 'LIVE_STREAM_SOURCE',
            operands: [
                this.createValueGenerator(sourceValue),
                100, // Default interval
                { streamType: 'LIVE', source: 'GENERATOR' }
            ],
            result: streamId,
            metadata: {
                nodeType: node.type,
                position: node.position,
                streamId: streamId,
                isLive: true
            }
        };
    }

    buildFunctionOperator(node) {
        return {
            type: 'STREAM_TRANSFORM',
            opcode: `STREAM_${node.name.toUpperCase()}_ADVANCED`,
            operands: [
                this.getLastStreamId(), // Input stream
                ...this.parseArguments(node.args)
            ],
            result: this.generateStreamId(),
            metadata: {
                nodeType: node.type,
                functionName: node.name,
                position: node.position
            }
        };
    }

    buildLensOperator(node) {
        const instructions = [];
        const lensContent = node.args[0];

        // Parse lens content like {.value | multiply(2)}
        if (lensContent.includes('|')) {
            const lensSteps = lensContent.split('|').map(step => step.trim());
            
            for (const step of lensSteps) {
                if (step.includes('(')) {
                    // Function call in lens
                    const match = step.match(/(\w+)\(([^)]*)\)/);
                    if (match) {
                        const [, funcName, argsStr] = match;
                        const args = argsStr.split(',').map(arg => arg.trim());
                        
                        instructions.push({
                            type: 'LENS_OPERATION',
                            opcode: `LENS_${funcName.toUpperCase()}`,
                            operands: [
                                this.getLastStreamId(),
                                ...args
                            ],
                            result: this.generateStreamId(),
                            metadata: {
                                lensStep: step,
                                functionName: funcName
                            }
                        });
                    }
                } else if (step.includes('.value')) {
                    // Value access in lens
                    instructions.push({
                        type: 'LENS_OPERATION',
                        opcode: 'LENS_VALUE_ACCESS',
                        operands: [this.getLastStreamId()],
                        result: this.generateStreamId(),
                        metadata: {
                            lensStep: step,
                            operation: 'value_access'
                        }
                    });
                }
            }
        }

        return instructions;
    }

    buildPoolRead(node) {
        return {
            type: 'POOL_OPERATION',
            opcode: 'POOL_READ',
            operands: [node.value],
            result: this.generateStreamId(),
            metadata: {
                nodeType: node.type,
                poolName: node.value,
                position: node.position
            }
        };
    }

    buildPoolDeclaration(node) {
        return {
            type: 'POOL_OPERATION',
            opcode: 'POOL_DECLARE',
            operands: [node.poolName, node.initialValue],
            result: node.poolName,
            metadata: {
                nodeType: node.type,
                poolName: node.poolName,
                position: node.position
            }
        };
    }

    // Utility methods
    parseStreamValue(value) {
        if (value.startsWith('[') && value.endsWith(']')) {
            try {
                return JSON.parse(value);
            } catch {
                return value.slice(1, -1).split(',').map(v => v.trim());
            }
        }
        return value;
    }

    createValueGenerator(sourceValue) {
        // Create a generator function based on source value
        if (sourceValue.includes('random')) {
            return () => Math.random() * 100;
        }
        return () => sourceValue;
    }

    parseArguments(args) {
        return args.map(arg => {
            if (typeof arg === 'string') {
                // Try to parse numbers
                const num = parseFloat(arg);
                if (!isNaN(num)) return num;
                
                // Remove quotes from strings
                if ((arg.startsWith("'") && arg.endsWith("'")) || 
                    (arg.startsWith('"') && arg.endsWith('"'))) {
                    return arg.slice(1, -1);
                }
            }
            return arg;
        });
    }

    generateStreamId() {
        return `stream_${this.streamCounter++}`;
    }

    getLastStreamId() {
        if (this.currentPipeline.length === 0) {
            return 'input_stream';
        }
        return this.currentPipeline[this.currentPipeline.length - 1].result;
    }

    optimizeIR(instructions) {
        if (!this.config.enableOptimization) {
            return instructions;
        }

        let optimized = [...instructions];
        
        // Apply stream fusion
        if (this.config.enableFusion) {
            optimized = this.instructionSet.optimizeStreamPipeline(optimized);
        }

        // Remove redundant operations
        optimized = this.removeRedundantOperations(optimized);

        // Constant folding
        optimized = this.constantFolding(optimized);

        return optimized;
    }

    removeRedundantOperations(instructions) {
        return instructions.filter((instr, index, array) => {
            // Remove identity mappings
            if (instr.opcode === 'STREAM_MAP_ADVANCED' && 
                instr.operands[1] === 'x => x') {
                return false;
            }
            return true;
        });
    }

    constantFolding(instructions) {
        return instructions.map(instr => {
            // Fold constant expressions where possible
            if (instr.opcode === 'STREAM_SOURCE' && 
                Array.isArray(instr.operands[0]) &&
                instr.operands[0].length === 1) {
                // Single value array can be simplified
                instr.operands[0] = instr.operands[0][0];
            }
            return instr;
        });
    }

    // Instruction set integration
    registerInstruction(opcode, definition) {
        this.instructionSet.registerInstruction(opcode, definition);
    }

    resolveOperands(operands, context) {
        return operands.map(operand => {
            if (typeof operand === 'string' && operand.startsWith('stream_')) {
                return context.streams?.[operand] || operand;
            }
            return operand;
        });
    }
}

export default StreamIRBuilder;
