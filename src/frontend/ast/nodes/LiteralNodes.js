// FILENAME: src/frontend/ast/nodes/LiteralNodes.js
// Literal Value AST Nodes

import { ASTNode } from './ASTNode.js';

export class LiteralNode extends ASTNode {
    constructor(type, value, position = null) {
        super(type, position);
        this.value = value;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            value: this.value
        };
    }
}

export class NumberLiteralNode extends LiteralNode {
    constructor(value, position = null) {
        super('LITERAL_NUMBER', value, position);
    }
}

export class StringLiteralNode extends LiteralNode {
    constructor(value, position = null) {
        super('LITERAL_STRING', value, position);
    }
}

export class BooleanLiteralNode extends LiteralNode {
    constructor(value, position = null) {
        super('LITERAL_BOOLEAN', value, position);
    }
}

export class CollectionLiteralNode extends LiteralNode {
    constructor(value, position = null) {
        super('LITERAL_COLLECTION', value, position);
    }
}

export class NullLiteralNode extends LiteralNode {
    constructor(position = null) {
        super('LITERAL_NULL', null, position);
    }
}

export default {
    LiteralNode,
    NumberLiteralNode,
    StringLiteralNode,
    BooleanLiteralNode,
    CollectionLiteralNode,
    NullLiteralNode
};
