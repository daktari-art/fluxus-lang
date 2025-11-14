// FILENAME: src/frontend/ast/nodes/LensNodes.js
// Lens Operation AST Nodes

import { ASTNode } from './ASTNode.js';

export class LensOperatorNode extends ASTNode {
    constructor(lensType, expression, position = null) {
        super('LENS_OPERATOR', position);
        this.lensType = lensType; // 'map', 'reduce', 'filter', etc.
        this.expression = expression;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            lensType: this.lensType,
            expression: this.expression
        };
    }
}

export class MapLensNode extends LensOperatorNode {
    constructor(expression, position = null) {
        super('map', expression, position);
    }
}

export class ReduceLensNode extends LensOperatorNode {
    constructor(expression, initialValue, position = null) {
        super('reduce', expression, position);
        this.initialValue = initialValue;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            initialValue: this.initialValue
        };
    }
}

export class FilterLensNode extends LensOperatorNode {
    constructor(expression, position = null) {
        super('filter', expression, position);
    }
}

export default {
    LensOperatorNode,
    MapLensNode,
    ReduceLensNode,
    FilterLensNode
};
