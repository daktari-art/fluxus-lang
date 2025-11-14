// FILENAME: src/intermediate/ir/builder/IRBuilder.js
// Main IR Builder - Production Grade

export class IRBuilder {
    constructor(config = {}) {
        this.config = {
            optimizationLevel: config.optimizationLevel || 1,
            enableValidation: config.enableValidation !== false,
            ...config
        };

        this.instructions = [];
        this.symbolTable = new Map();
        this.labelCounter = 0;
        this.currentSection = 'main';
    }

    build(ast) {
        this.instructions = [];
        this.symbolTable.clear();

        if (!ast || !ast.nodes) {
            throw new Error('Invalid AST for IR building');
        }

        // Build IR from AST nodes
        this.buildSection('main', ast.nodes);

        // Apply optimizations
        if (this.config.optimizationLevel > 0) {
            this.optimize();
        }

        return this.getIRProgram();
    }

    buildSection(sectionName, nodes) {
        this.currentSection = sectionName;
        
        for (const node of nodes) {
            try {
                this.buildNode(node);
            } catch (error) {
                console.error(`Error building IR for node:`, node);
                throw error;
            }
        }
    }

    buildNode(node) {
        const nodeHandler = this.getNodeHandler(node.type);
        if (nodeHandler) {
            nodeHandler.call(this, node);
        } else {
            this.buildGenericNode(node);
        }
    }

    getNodeHandler(nodeType) {
        const handlers = {
            'STREAM_SOURCE_FINITE': this.buildStreamSource,
            'STREAM_SOURCE_LIVE': this.buildLiveStreamSource,
            'FUNCTION_OPERATOR': this.buildFunctionOperator,
            'LENS_OPERATOR': this.buildLensOperator,
            'POOL_READ': this.buildPoolRead,
            'POOL_DECLARATION': this.buildPoolDeclaration
        };

        return handlers[nodeType];
    }

    buildStreamSource(node) {
        const streamId = this.generateSymbol('stream');
        
        this.addInstruction('CREATE_STREAM', [
            this.parseValue(node.value),
            'FINITE'
        ], streamId, { nodeType: node.type, position: node.position });

        this.symbolTable.set(streamId, {
            type: 'stream',
            valueType: this.inferType(node.value),
            definedAt: node.position
        });
    }

    buildLiveStreamSource(node) {
        const streamId = this.generateSymbol('live_stream');
        const isLiveQuery = node.value.startsWith('~?');
        const sourceValue = isLiveQuery ? node.value.substring(2) : node.value.substring(1);

        this.addInstruction('CREATE_LIVE_STREAM', [
            this.createGenerator(sourceValue),
            100, // Default interval
            { isLiveQuery }
        ], streamId, { nodeType: node.type, position: node.position });
    }

    buildFunctionOperator(node) {
        const inputSymbol = this.getLastSymbol() || 'input';
        const resultSymbol = this.generateSymbol('result');

        this.addInstruction('APPLY_OPERATOR', [
            inputSymbol,
            node.name,
            ...this.parseArguments(node.args)
        ], resultSymbol, {
            operator: node.name,
            nodeType: node.type
        });
    }

    buildLensOperator(node) {
        const lensContent = node.args[0];
        const inputSymbol = this.getLastSymbol() || 'input';

        // Parse lens pipeline
        const steps = this.parseLensPipeline(lensContent);
        
        let currentSymbol = inputSymbol;
        for (const step of steps) {
            const resultSymbol = this.generateSymbol('lens_step');
            
            this.addInstruction('LENS_STEP', [
                currentSymbol,
                step.operation,
                ...step.arguments
            ], resultSymbol, {
                lensStep: step.raw
            });

            currentSymbol = resultSymbol;
        }
    }

    buildPoolRead(node) {
        const resultSymbol = this.generateSymbol('pool_read');
        
        this.addInstruction('READ_POOL', [
            node.value
        ], resultSymbol, {
            poolName: node.value,
            nodeType: node.type
        });

        this.symbolTable.set(node.value, {
            type: 'pool',
            accessed: true
        });
    }

    buildPoolDeclaration(node) {
        this.addInstruction('DECLARE_POOL', [
            node.poolName,
            this.parseValue(node.initialValue)
        ], null, {
            poolName: node.poolName,
            nodeType: node.type
        });

        this.symbolTable.set(node.poolName, {
            type: 'pool',
            definedAt: node.position,
            initialValue: node.initialValue
        });
    }

    buildGenericNode(node) {
        // Fallback for unhandled node types
        this.addInstruction('GENERIC_NODE', [
            node.type,
            node.value || JSON.stringify(node)
        ], this.generateSymbol('generic'), {
            nodeType: node.type,
            raw: node
        });
    }

    // Utility methods
    addInstruction(opcode, operands, result = null, metadata = {}) {
        const instruction = {
            opcode,
            operands,
            result,
            section: this.currentSection,
            metadata: {
                ...metadata,
                timestamp: Date.now(),
                instructionId: this.instructions.length
            }
        };

        this.instructions.push(instruction);
        return instruction;
    }

    generateSymbol(prefix = 'sym') {
        const symbol = `${prefix}_${this.labelCounter++}`;
        return symbol;
    }

    getLastSymbol() {
        if (this.instructions.length === 0) return null;
        
        const lastInstr = this.instructions[this.instructions.length - 1];
        return lastInstr.result;
    }

    parseValue(value) {
        if (typeof value === 'string') {
            // Try to parse as number
            const num = parseFloat(value);
            if (!isNaN(num)) return num;

            // Try to parse as array
            if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    return JSON.parse(value);
                } catch {
                    return value.slice(1, -1).split(',').map(v => this.parseValue(v.trim()));
                }
            }

            // Remove quotes from strings
            if ((value.startsWith("'") && value.endsWith("'")) || 
                (value.startsWith('"') && value.endsWith('"'))) {
                return value.slice(1, -1);
            }
        }

        return value;
    }

    parseArguments(args) {
        return args.map(arg => this.parseValue(arg));
    }

    parseLensPipeline(lensContent) {
        const steps = [];
        
        if (lensContent.includes('|')) {
            const parts = lensContent.split('|').map(part => part.trim());
            
            for (const part of parts) {
                if (part.includes('(') && part.includes(')')) {
                    // Function call
                    const match = part.match(/(\w+)\(([^)]*)\)/);
                    if (match) {
                        const [, funcName, argsStr] = match;
                        const args = argsStr.split(',').map(arg => arg.trim());
                        
                        steps.push({
                            operation: funcName,
                            arguments: args.map(arg => this.parseValue(arg)),
                            raw: part
                        });
                    }
                } else if (part.includes('.value')) {
                    // Value access
                    steps.push({
                        operation: 'value_access',
                        arguments: [],
                        raw: part
                    });
                } else {
                    // Unknown operation
                    steps.push({
                        operation: 'unknown',
                        arguments: [part],
                        raw: part
                    });
                }
            }
        }

        return steps;
    }

    createGenerator(sourceValue) {
        // Create appropriate generator based on source
        if (sourceValue.includes('random')) {
            return () => Math.random();
        }
        if (sourceValue.includes('time')) {
            return () => Date.now();
        }
        return () => sourceValue;
    }

    inferType(value) {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string') return 'string';
        if (Array.isArray(value)) return 'array';
        if (value === null || value === undefined) return 'any';
        return 'unknown';
    }

    // Optimization
    optimize() {
        if (this.config.optimizationLevel === 0) return;

        this.constantFolding();
        this.deadCodeElimination();
        
        if (this.config.optimizationLevel >= 2) {
            this.inlineExpressions();
        }
    }

    constantFolding() {
        this.instructions = this.instructions.map(instr => {
            // Fold constant expressions where possible
            if (instr.opcode === 'APPLY_OPERATOR' && 
                instr.operands.length >= 2) {
                const operator = instr.operands[1];
                const args = instr.operands.slice(2);

                // Simple constant folding for arithmetic
                if (operator === 'add' && args.length === 1 && 
                    typeof instr.operands[0] === 'number' && 
                    typeof args[0] === 'number') {
                    return {
                        ...instr,
                        opcode: 'CONSTANT',
                        operands: [instr.operands[0] + args[0]],
                        metadata: {
                            ...instr.metadata,
                            folded: true
                        }
                    };
                }
            }
            return instr;
        });
    }

    deadCodeElimination() {
        const usedSymbols = new Set();
        
        // Mark all result symbols that are used
        this.instructions.forEach(instr => {
            instr.operands.forEach(operand => {
                if (typeof operand === 'string' && operand.startsWith('sym_')) {
                    usedSymbols.add(operand);
                }
            });
        });

        // Remove instructions with unused results
        this.instructions = this.instructions.filter(instr => {
            if (instr.result && !usedSymbols.has(instr.result)) {
                return false; // Remove unused result
            }
            return true;
        });
    }

    inlineExpressions() {
        // Simple inlining for very basic cases
        const symbolValues = new Map();
        
        this.instructions = this.instructions.filter(instr => {
            if (instr.opcode === 'CONSTANT' && instr.operands.length === 1) {
                symbolValues.set(instr.result, instr.operands[0]);
                return false; // Remove constant declaration
            }
            
            // Replace symbol usage with constant values
            instr.operands = instr.operands.map(operand => {
                return symbolValues.get(operand) || operand;
            });
            
            return true;
        });
    }

    getIRProgram() {
        return {
            type: 'IR_PROGRAM',
            instructions: this.instructions,
            symbols: Array.from(this.symbolTable.entries()),
            metadata: {
                instructionCount: this.instructions.length,
                symbolCount: this.symbolTable.size,
                generatedAt: new Date().toISOString(),
                optimizationLevel: this.config.optimizationLevel
            }
        };
    }
}

export default IRBuilder;
