// FILENAME: src/frontend/ast/nodes/ASTNode.js
// Base AST Node Class

export class ASTNode {
    constructor(type, position = null) {
        this.type = type;
        this.position = position;
        this.parent = null;
        this.children = [];
        this.metadata = new Map();
    }

    addChild(node) {
        if (node instanceof ASTNode) {
            node.parent = this;
            this.children.push(node);
        }
        return this;
    }

    setMetadata(key, value) {
        this.metadata.set(key, value);
        return this;
    }

    getMetadata(key) {
        return this.metadata.get(key);
    }

    accept(visitor) {
        return visitor.visit(this);
    }

    toString(indent = 0) {
        const spaces = ' '.repeat(indent);
        let result = `${spaces}${this.type}`;
        
        for (const child of this.children) {
            result += '\n' + child.toString(indent + 2);
        }
        
        return result;
    }

    toJSON() {
        return {
            type: this.type,
            position: this.position,
            children: this.children.map(child => child.toJSON()),
            metadata: Object.fromEntries(this.metadata)
        };
    }
}

export default ASTNode;
