// FILENAME: src/frontend/ast/nodes/index.js
// AST Nodes Entry Point

import { ASTNode } from './ASTNode.js';

// Stream Nodes
import { 
    StreamSourceNode, 
    PipelineOperatorNode, 
    FunctionOperatorNode 
} from './StreamNodes.js';

// Pool Nodes
import { 
    PoolDeclarationNode, 
    PoolAccessNode, 
    TidalPoolNode 
} from './PoolNodes.js';

// Literal Nodes
import { 
    LiteralNode,
    NumberLiteralNode,
    StringLiteralNode, 
    BooleanLiteralNode,
    CollectionLiteralNode,
    NullLiteralNode
} from './LiteralNodes.js';

// Lens Nodes
import { 
    LensOperatorNode,
    MapLensNode,
    ReduceLensNode, 
    FilterLensNode
} from './LensNodes.js';

// Node Factory for convenience
class NodeFactory {
    static createStreamSource(type, value, position = null) {
        return new StreamSourceNode(type, value, position);
    }

    static createPipelineOperator(operator, args = [], position = null) {
        return new PipelineOperatorNode(operator, args, position);
    }

    static createPoolDeclaration(name, initialValue, position = null) {
        return new PoolDeclarationNode(name, initialValue, position);
    }

    static createNumberLiteral(value, position = null) {
        return new NumberLiteralNode(value, position);
    }

    static createStringLiteral(value, position = null) {
        return new StringLiteralNode(value, position);
    }
}

// Export all nodes
export {
    ASTNode,
    StreamSourceNode,
    PipelineOperatorNode,
    FunctionOperatorNode,
    PoolDeclarationNode,
    PoolAccessNode,
    TidalPoolNode,
    LiteralNode,
    NumberLiteralNode,
    StringLiteralNode,
    BooleanLiteralNode,
    CollectionLiteralNode,
    NullLiteralNode,
    LensOperatorNode,
    MapLensNode,
    ReduceLensNode,
    FilterLensNode,
    NodeFactory
};

export default {
    ASTNode,
    StreamSourceNode,
    PipelineOperatorNode,
    FunctionOperatorNode,
    PoolDeclarationNode,
    PoolAccessNode,
    TidalPoolNode,
    LiteralNode,
    NumberLiteralNode,
    StringLiteralNode,
    BooleanLiteralNode,
    CollectionLiteralNode,
    NullLiteralNode,
    LensOperatorNode,
    MapLensNode,
    ReduceLensNode,
    FilterLensNode,
    NodeFactory
};
