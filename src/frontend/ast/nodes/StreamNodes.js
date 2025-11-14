// FILENAME: src/frontend/ast/nodes/StreamNodes.js
// Stream-related AST Nodes

import { ASTNode } from './ASTNode.js';

export class StreamSourceNode extends ASTNode {
    constructor(sourceType, value, position = null) {
        super(`STREAM_SOURCE_${sourceType.toUpperCase()}`, position);
        this.sourceType = sourceType; // 'finite' or 'live'
        this.value = value;
        this.isLive = sourceType === 'live';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            sourceType: this.sourceType,
            value: this.value,
            isLive: this.isLive
        };
    }
}

export class PipelineOperatorNode extends ASTNode {
    constructor(operator, args = [], position = null) {
        super('PIPELINE_OPERATOR', position);
        this.operator = operator;
        this.args = args;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operator: this.operator,
            args: this.args
        };
    }
}

export class FunctionOperatorNode extends ASTNode {
    constructor(functionName, args = [], position = null) {
        super('FUNCTION_OPERATOR', position);
        this.functionName = functionName;
        this.args = args;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            functionName: this.functionName,
            args: this.args
        };
    }
}

export default {
    StreamSourceNode,
    PipelineOperatorNode,
    FunctionOperatorNode
};
