// FILENAME: src/frontend/ast/nodes/PoolNodes.js
// Fluxus Tidal Pool AST Nodes - COMPATIBLE WITH EXISTING STRUCTURE
// Production-grade pool nodes that match your current architecture

import { ASTNode } from './ASTNode.js';

/**
 * PoolDeclarationNode - Compatible with your existing structure
 * Represents: let pool_name = <|> initial_value
 */
export class PoolDeclarationNode extends ASTNode {
    constructor(name, initialValue, position = null, id = null) {
        super('POOL_DECLARATION', position, id);
        this.name = name;
        this.initialValue = initialValue;
        this.poolName = name; // Alias for compatibility
        this.initial = initialValue; // Alias for compatibility
        this.isReactive = true;
        
        // Production enhancements
        this.valueType = this.inferValueType(initialValue);
        this.metadata = {
            declaredAt: Date.now(),
            isPublic: !name.startsWith('_'),
            category: this.classifyPoolCategory(name),
            version: '1.0'
        };
        
        this.validateDeclaration();
    }

    inferValueType(value) {
        const val = String(value).trim();
        if (val === 'null') return 'null';
        if (val === 'true' || val === 'false') return 'boolean';
        if (!isNaN(val) && val !== '') return 'number';
        if ((val.startsWith("'") && val.endsWith("'")) || 
            (val.startsWith('"') && val.endsWith('"'))) return 'string';
        if (val.startsWith('[') && val.endsWith(']')) return 'array';
        if (val.startsWith('{') && val.endsWith('}')) return 'object';
        return 'any';
    }

    classifyPoolCategory(name) {
        if (name.includes('_state') || name.includes('State')) return 'state';
        if (name.includes('_data') || name.includes('Data')) return 'data';
        if (name.includes('_config') || name.includes('Config')) return 'configuration';
        return 'general';
    }

    validateDeclaration() {
        if (!this.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.name)) {
            throw new Error(`Invalid pool name: '${this.name}'. Must be valid identifier.`);
        }
        
        const reserved = ['engine', 'system', 'global', 'fluxus'];
        if (reserved.includes(this.name.toLowerCase())) {
            throw new Error(`Pool name '${this.name}' is reserved for system use.`);
        }
    }

    toString() {
        return `PoolDeclaration(${this.name} = <|> ${this.initialValue})`;
    }

    toObject() {
        return {
            ...super.toObject(),
            name: this.name,
            initialValue: this.initialValue,
            poolName: this.poolName,
            initial: this.initial,
            valueType: this.valueType,
            metadata: this.metadata
        };
    }

    // Engine compatibility
    toEngineConfig() {
        return {
            name: this.name,
            initialValue: this.parseInitialValue(),
            type: this.valueType,
            isReactive: this.isReactive
        };
    }

    parseInitialValue() {
        const value = String(this.initialValue).trim();
        switch (this.valueType) {
            case 'null': return null;
            case 'boolean': return value === 'true';
            case 'number': return parseFloat(value);
            case 'string': return value.slice(1, -1).replace(/\\(.)/g, '$1');
            case 'array': 
                try { return JSON.parse(value); } catch { return [value]; }
            case 'object': 
                try { return JSON.parse(value); } catch { return { value: value }; }
            default: return value;
        }
    }
}

/**
 * PoolAccessNode - For reading from pools in streams
 * Represents: pool access in pipeline context
 */
export class PoolAccessNode extends ASTNode {
    constructor(poolName, accessType = 'read', position = null, id = null) {
        super('POOL_ACCESS', position, id);
        this.poolName = poolName;
        this.accessType = accessType; // 'read' or 'write'
        this.isSource = accessType === 'read';
        this.operation = accessType;
        
        this.metadata = {
            accessId: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lastAccessed: null
        };
        
        this.validatePoolReference();
    }

    validatePoolReference() {
        if (!this.poolName || typeof this.poolName !== 'string') {
            throw new Error('Pool access must reference a valid pool name');
        }
    }

    toString() {
        return `PoolAccess(${this.poolName} [${this.accessType}])`;
    }

    toObject() {
        return {
            ...super.toObject(),
            poolName: this.poolName,
            accessType: this.accessType,
            operation: this.operation,
            metadata: this.metadata
        };
    }

    markAccessed() {
        this.metadata.lastAccessed = Date.now();
    }
}

/**
 * TidalPoolNode - Main pool runtime representation
 * Represents the actual tidal pool with state and subscriptions
 */
export class TidalPoolNode extends ASTNode {
    constructor(poolName, initialValue, position = null, id = null) {
        super('TIDAL_POOL', position, id);
        this.poolName = poolName;
        this.initialValue = initialValue;
        this.currentValue = this.parseValue(initialValue);
        this.subscriptions = [];
        this.history = [this.currentValue];
        this.updateCount = 0;
        
        this.metadata = {
            created: Date.now(),
            lastUpdate: Date.now(),
            subscriptionCount: 0,
            maxHistory: 100 // Production: limit history size
        };
    }

    parseValue(value) {
        const strVal = String(value).trim();
        if (strVal === 'null') return null;
        if (strVal === 'true') return true;
        if (strVal === 'false') return false;
        if (!isNaN(strVal) && strVal !== '') return Number(strVal);
        if ((strVal.startsWith("'") && strVal.endsWith("'")) || 
            (strVal.startsWith('"') && strVal.endsWith('"'))) {
            return strVal.slice(1, -1);
        }
        return value;
    }

    addSubscription(subscriptionNode) {
        this.subscriptions.push(subscriptionNode);
        this.metadata.subscriptionCount++;
    }

    updateValue(newValue) {
        this.currentValue = newValue;
        this.updateCount++;
        this.metadata.lastUpdate = Date.now();
        
        // Manage history (circular buffer)
        this.history.push(newValue);
        if (this.history.length > this.metadata.maxHistory) {
            this.history.shift();
        }
        
        return this.currentValue;
    }

    toString() {
        return `TidalPool(${this.poolName} = ${JSON.stringify(this.currentValue)})`;
    }

    toObject() {
        return {
            ...super.toObject(),
            poolName: this.poolName,
            currentValue: this.currentValue,
            updateCount: this.updateCount,
            subscriptionCount: this.subscriptions.length,
            metadata: this.metadata
        };
    }
}

// Export for your existing index.js structure
export default {
    PoolDeclarationNode,
    PoolAccessNode,
    TidalPoolNode
};
