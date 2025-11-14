// FILENAME: src/frontend/ast/nodes/PoolNodes.js
// Pool-related AST Nodes

import { ASTNode } from './ASTNode.js';

export class PoolDeclarationNode extends ASTNode {
    constructor(poolName, initialValue, position = null) {
        super('POOL_DECLARATION', position);
        this.poolName = poolName;
        this.initialValue = initialValue;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            poolName: this.poolName,
            initialValue: this.initialValue
        };
    }
}

export class PoolAccessNode extends ASTNode {
    constructor(poolName, operation, args = [], position = null) {
        super('POOL_ACCESS', position);
        this.poolName = poolName;
        this.operation = operation; // 'get', 'set', 'subscribe', etc.
        this.args = args;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            poolName: this.poolName,
            operation: this.operation,
            args: this.args
        };
    }
}

export class TidalPoolNode extends ASTNode {
    constructor(poolName, initialValue, position = null) {
        super('TIDAL_POOL', position);
        this.poolName = poolName;
        this.initialValue = initialValue;
        this.subscribers = [];
    }

    addSubscriber(subscriberNode) {
        this.subscribers.push(subscriberNode);
        return this;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            poolName: this.poolName,
            initialValue: this.initialValue,
            subscribers: this.subscribers.map(sub => sub.toJSON())
        };
    }
}

export default {
    PoolDeclarationNode,
    PoolAccessNode,
    TidalPoolNode
};
