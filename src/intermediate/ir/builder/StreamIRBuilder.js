// FILENAME: src/intermediate/ir/builder/StreamIRBuilder.js
// Stream-specific IR Builder

class IRBuilder {
    // Temporary minimal implementation for testing
    constructor() {
        this.instructions = [];
        this.symbolTable = new Map();
        this.nextTempId = 0;
    }

    createInstruction(type, operands = [], metadata = {}) {
        return {
            id: this.instructions.length,
            type,
            operands,
            metadata: { timestamp: Date.now(), ...metadata }
        };
    }

    addSymbol(name, info) {
        this.symbolTable.set(name, { ...info, id: this.symbolTable.size, referenced: false });
    }

    getSymbol(name) {
        return this.symbolTable.get(name);
    }

    markSymbolReferenced(name) {
        const symbol = this.getSymbol(name);
        if (symbol) symbol.referenced = true;
    }

    createTempVariable() {
        return `_temp${this.nextTempId++}`;
    }
}

export class StreamIRBuilder extends IRBuilder {
    constructor() {
        super();
        this.streamCounter = 0;
        this.poolCounter = 0;
        this.activeStreams = new Map();
    }

    buildSTREAM_SOURCE_FINITE(node) {
        const streamId = this.createStreamId();
        const value = this.processValue(node.value);
        
        this.addSymbol(streamId, {
            type: 'stream',
            streamType: 'finite',
            value: node.value,
            position: node.position
        });

        return this.createInstruction('CREATE_STREAM', [
            streamId,
            'finite',
            value
        ], {
            source: 'STREAM_SOURCE_FINITE',
            position: node.position
        });
    }

    buildSTREAM_SOURCE_LIVE(node) {
        const streamId = this.createStreamId();
        
        this.addSymbol(streamId, {
            type: 'stream',
            streamType: 'live',
            value: node.value,
            position: node.position
        });

        return this.createInstruction('CREATE_STREAM', [
            streamId,
            'live',
            node.value
        ], {
            source: 'STREAM_SOURCE_LIVE',
            position: node.position
        });
    }

    buildPIPELINE_OPERATOR(node) {
        const inputStream = this.getLastStreamId();
        if (!inputStream) {
            throw new Error('No input stream for pipeline operator');
        }

        const outputStream = this.createStreamId();
        const args = (node.args || []).map(arg => this.processValue(arg));

        this.markSymbolReferenced(inputStream);
        this.addSymbol(outputStream, {
            type: 'stream',
            operator: node.operator,
            input: inputStream,
            position: node.position
        });

        return this.createInstruction('APPLY_OPERATOR', [
            outputStream,
            inputStream,
            node.operator,
            ...args
        ], {
            source: 'PIPELINE_OPERATOR',
            position: node.position
        });
    }

    buildPOOL_DECLARATION(node) {
        const poolId = this.createPoolId();
        const initialValue = this.processValue(node.initialValue);
        
        this.addSymbol(node.poolName, {
            type: 'pool',
            poolId: poolId,
            initialValue: node.initialValue,
            position: node.position
        });

        return this.createInstruction('CREATE_POOL', [
            poolId,
            node.poolName,
            initialValue
        ], {
            source: 'POOL_DECLARATION',
            position: node.position
        });
    }

    createStreamId() {
        return `stream_${this.streamCounter++}`;
    }

    createPoolId() {
        return `pool_${this.poolCounter++}`;
    }

    getLastStreamId() {
        for (let i = this.instructions.length - 1; i >= 0; i--) {
            const instruction = this.instructions[i];
            if (instruction.type === 'CREATE_STREAM' || 
                instruction.type === 'APPLY_OPERATOR') {
                return instruction.operands[0];
            }
        }
        return null;
    }

    processValue(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return JSON.stringify(value);
        return String(value);
    }
}

export default StreamIRBuilder;
