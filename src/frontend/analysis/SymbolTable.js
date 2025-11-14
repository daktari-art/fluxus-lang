// FILENAME: src/frontend/analysis/SymbolTable.js
// Symbol Table for Fluxus Program Analysis

export class SymbolTable {
    constructor() {
        this.symbols = new Map();
        this.scopes = [new Map()]; // Stack of scopes
        this.currentScope = 0;
    }

    enterScope() {
        this.scopes.push(new Map());
        this.currentScope++;
    }

    exitScope() {
        if (this.scopes.length > 1) {
            this.scopes.pop();
            this.currentScope--;
        }
    }

    addSymbol(name, type, node, options = {}) {
        const symbol = {
            name,
            type,
            node,
            scope: this.currentScope,
            isConstant: options.isConstant || false,
            isStream: options.isStream || false,
            isPool: options.isPool || false,
            referenced: false,
            definedAt: options.definedAt || null
        };

        this.scopes[this.currentScope].set(name, symbol);
        this.symbols.set(name, symbol);
        
        return symbol;
    }

    getSymbol(name) {
        // Search from current scope outward
        for (let i = this.currentScope; i >= 0; i--) {
            const symbol = this.scopes[i].get(name);
            if (symbol) {
                return symbol;
            }
        }
        return null;
    }

    markReferenced(name) {
        const symbol = this.getSymbol(name);
        if (symbol) {
            symbol.referenced = true;
        }
    }

    getUnreferencedSymbols() {
        const unreferenced = [];
        for (const [name, symbol] of this.symbols) {
            if (!symbol.referenced && !symbol.isPool) {
                unreferenced.push(symbol);
            }
        }
        return unreferenced;
    }

    getAllSymbols() {
        return Array.from(this.symbols.values());
    }

    getSymbolsByType(type) {
        return this.getAllSymbols().filter(symbol => symbol.type === type);
    }

    getPools() {
        return this.getSymbolsByType('pool');
    }

    getStreams() {
        return this.getSymbolsByType('stream');
    }

    clear() {
        this.symbols.clear();
        this.scopes = [new Map()];
        this.currentScope = 0;
    }

    toJSON() {
        return {
            symbols: this.getAllSymbols(),
            scopes: this.scopes.length,
            currentScope: this.currentScope
        };
    }
}

export default SymbolTable;
