// FILENAME: src/frontend/analysis/symbol-table.js  
// Fluxus Enterprise Symbol Table v4.0 - PRODUCTION GRADE

import { performance } from 'perf_hooks';

/**
 * ENTERPRISE SYMBOL TABLE
 * Features:
 * - Hierarchical scoping with lexical environments
 * - Symbol versioning and lifecycle management
 * - Dependency tracking between symbols
 * - Garbage collection of unused symbols
 * - Concurrent access patterns
 * - Symbol resolution caching
 */
export class SymbolTable {
    constructor(config = {}) {
        this.config = {
            maxScopes: 1000,
            gcThreshold: 10000,
            enableCaching: true,
            performanceTracking: true,
            debugMode: false,
            ...config
        };

        // Enterprise state management
        this.scopes = [this.createScope('global')];
        this.currentScope = 0;
        this.symbolRegistry = new Map();
        this.dependencyGraph = new DependencyGraph();
        this.resolutionCache = new Map();
        
        // Performance metrics
        this.metrics = {
            resolutions: 0,
            cacheHits: 0,
            definitions: 0,
            scopeChanges: 0,
            startTime: performance.now()
        };

        // Garbage collection
        this.symbolAccessCount = new Map();
        this.lastAccessTime = new Map();
        
        this.initializeSymbolTable();
    }

    /**
     * ENTERPRISE SCOPE MANAGEMENT
     */
    createScope(name, parent = null) {
        return {
            id: `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            parent,
            symbols: new Map(),
            children: [],
            created: Date.now(),
            metadata: {
                type: 'lexical',
                depth: parent ? parent.metadata.depth + 1 : 0
            }
        };
    }

    enterScope(name = 'anonymous') {
        if (this.scopes.length >= this.config.maxScopes) {
            throw new Error('Scope depth limit exceeded');
        }

        const parentScope = this.scopes[this.scopes.length - 1];
        const newScope = this.createScope(name, parentScope);
        
        parentScope.children.push(newScope);
        this.scopes.push(newScope);
        this.currentScope++;
        this.metrics.scopeChanges++;

        if (this.config.debugMode) {
            console.log(`🔍 Entering scope: ${name} (depth: ${this.currentScope})`);
        }

        return newScope.id;
    }

    exitScope() {
        if (this.scopes.length <= 1) {
            throw new Error('Cannot exit global scope');
        }

        const exitedScope = this.scopes.pop();
        this.currentScope--;
        this.metrics.scopeChanges++;

        // Clear resolution cache for scoped symbols
        this.clearScopeFromCache(exitedScope.id);

        if (this.config.debugMode) {
            console.log(`🔍 Exiting scope: ${exitedScope.name}`);
        }

        return exitedScope;
    }

    /**
     * ENTERPRISE SYMBOL DEFINITION
     */
    define(symbolInfo) {
        const { name, kind, type, location, attributes = {} } = symbolInfo;
        
        this.validateSymbolDefinition(name, kind, location);

        const currentScope = this.scopes[this.scopes.length - 1];
        const symbolId = this.generateSymbolId(name, currentScope.id);

        const enterpriseSymbol = {
            id: symbolId,
            name,
            kind,
            type: type || new TypeVariable(`T_${name}`),
            scope: currentScope.id,
            location,
            attributes: {
                mutability: attributes.mutability || 'immutable',
                visibility: attributes.visibility || 'private',
                stability: attributes.stability || 'stable',
                version: '1.0.0',
                ...attributes
            },
            metadata: {
                definedAt: Date.now(),
                accessCount: 0,
                lastAccessed: Date.now(),
                dependencies: new Set(),
                dependents: new Set()
            }
        };

        // Register in current scope and global registry
        currentScope.symbols.set(name, enterpriseSymbol);
        this.symbolRegistry.set(symbolId, enterpriseSymbol);
        this.metrics.definitions++;

        // Update dependency graph
        this.dependencyGraph.addNode(symbolId, enterpriseSymbol);

        if (this.config.debugMode) {
            console.log(`📝 Defined symbol: ${name} (${kind}) in scope ${currentScope.name}`);
        }

        return enterpriseSymbol;
    }

    /**
     * ENTERPRISE SYMBOL RESOLUTION
     */
    resolve(name, options = {}) {
        this.metrics.resolutions++;
        
        // Check cache first
        const cacheKey = this.generateCacheKey(name, options);
        if (this.config.enableCaching && this.resolutionCache.has(cacheKey)) {
            this.metrics.cacheHits++;
            const cached = this.resolutionCache.get(cacheKey);
            this.updateAccessMetrics(cached.id);
            return cached;
        }

        // Hierarchical resolution with lexical scoping
        let resolutionPath = [];
        let resolvedSymbol = null;

        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const symbol = scope.symbols.get(name);
            
            if (symbol) {
                resolutionPath.push(scope.id);
                resolvedSymbol = symbol;
                
                // Check visibility and accessibility
                if (this.isSymbolAccessible(symbol, options)) {
                    break;
                } else {
                    resolvedSymbol = null; // Reset if not accessible
                }
            }
        }

        if (resolvedSymbol) {
            this.updateAccessMetrics(resolvedSymbol.id);
            
            // Cache the resolution
            if (this.config.enableCaching) {
                this.resolutionCache.set(cacheKey, resolvedSymbol);
            }

            if (this.config.debugMode && options.verbose) {
                console.log(`🔍 Resolved ${name} via path: ${resolutionPath.join(' -> ')}`);
            }
        }

        return resolvedSymbol;
    }

    /**
     * SPECIALIZED SYMBOL DEFINITIONS
     */
    definePool(name, typeInfo, location, attributes = {}) {
        return this.define({
            name,
            kind: 'pool',
            type: new PoolType(typeInfo.type || new TypeVariable('T')),
            location,
            attributes: {
                mutability: 'mutable',
                category: 'reactive',
                initialValue: typeInfo.initialValue,
                ...attributes
            }
        });
    }

    defineFunction(name, parameters, returnType, location, attributes = {}) {
        const paramTypes = parameters.map(param => 
            param.typeAnnotation || new TypeVariable(`T_param_${param.name}`)
        );

        return this.define({
            name,
            kind: 'function',
            type: new FunctionType(paramTypes, returnType || new TypeVariable(`T_return_${name}`)),
            location,
            attributes: {
                mutability: 'immutable',
                category: 'computation',
                parameters,
                purity: 'unknown',
                ...attributes
            }
        });
    }

    defineStream(name, elementType, isLive, location, attributes = {}) {
        return this.define({
            name,
            kind: 'stream',
            type: new StreamType(elementType || new TypeVariable('T')),
            location,
            attributes: {
                mutability: 'immutable',
                category: 'reactive',
                isLive: isLive || false,
                ...attributes
            }
        });
    }

    defineImport(name, source, location, attributes = {}) {
        return this.define({
            name,
            kind: 'import',
            type: new ModuleType(source),
            location,
            attributes: {
                mutability: 'immutable',
                category: 'external',
                source,
                ...attributes
            }
        });
    }

    defineType(name, typeDefinition, location, attributes = {}) {
        return this.define({
            name,
            kind: 'type',
            type: typeDefinition,
            location,
            attributes: {
                mutability: 'immutable',
                category: 'type_system',
                ...attributes
            }
        });
    }

    /**
     * ENTERPRISE QUERY SYSTEM
     */
    querySymbols(predicate = () => true) {
        const results = [];
        
        for (const scope of this.scopes) {
            for (const symbol of scope.symbols.values()) {
                if (predicate(symbol)) {
                    results.push(symbol);
                }
            }
        }
        
        return results;
    }

    getSymbolsByKind(kind) {
        return this.querySymbols(symbol => symbol.kind === kind);
    }

    getSymbolsByCategory(category) {
        return this.querySymbols(symbol => symbol.attributes.category === category);
    }

    getSymbolsInScope(scopeId) {
        const scope = this.findScopeById(scopeId);
        return scope ? Array.from(scope.symbols.values()) : [];
    }

    /**
     * ENTERPRISE DEPENDENCY MANAGEMENT
     */
    addDependency(fromSymbolId, toSymbolId) {
        this.dependencyGraph.addEdge(fromSymbolId, toSymbolId);
        
        const fromSymbol = this.symbolRegistry.get(fromSymbolId);
        const toSymbol = this.symbolRegistry.get(toSymbolId);
        
        if (fromSymbol && toSymbol) {
            fromSymbol.metadata.dependencies.add(toSymbolId);
            toSymbol.metadata.dependents.add(fromSymbolId);
        }
    }

    getDependencies(symbolId) {
        return this.dependencyGraph.getDependencies(symbolId);
    }

    getDependents(symbolId) {
        return this.dependencyGraph.getDependents(symbolId);
    }

    /**
     * ENTERPRISE GARBAGE COLLECTION
     */
    collectGarbage() {
        const now = Date.now();
        const garbage = [];
        const accessThreshold = 30 * 60 * 1000; // 30 minutes
        
        for (const [symbolId, lastAccess] of this.lastAccessTime) {
            if (now - lastAccess > accessThreshold) {
                const symbol = this.symbolRegistry.get(symbolId);
                if (symbol && this.canCollectSymbol(symbol)) {
                    garbage.push(symbol);
                }
            }
        }
        
        garbage.forEach(symbol => this.removeSymbol(symbol.id));
        
        if (this.config.debugMode && garbage.length > 0) {
            console.log(`🗑️ Collected ${garbage.length} unused symbols`);
        }
        
        return garbage.length;
    }

    /**
     * ENTERPRISE VALIDATION AND INTEGRITY
     */
    validateSymbolDefinition(name, kind, location) {
        if (!name || typeof name !== 'string') {
            throw new Error('Symbol name must be a non-empty string');
        }

        if (!this.isValidIdentifier(name)) {
            throw new Error(`Invalid symbol name: ${name}`);
        }

        const existing = this.resolve(name, { currentScopeOnly: true });
        if (existing) {
            throw new Error(`Symbol '${name}' already defined in current scope`);
        }

        if (!location || !location.line) {
            throw new Error('Symbol definition requires location information');
        }
    }

    isValidIdentifier(name) {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    isSymbolAccessible(symbol, options) {
        // Implement visibility rules, module boundaries, etc.
        return true; // Simplified for now
    }

    canCollectSymbol(symbol) {
        return symbol.metadata.dependents.size === 0 && 
               symbol.attributes.mutability !== 'immutable' &&
               symbol.kind !== 'import';
    }

    /**
     * ENTERPRISE UTILITIES
     */
    generateSymbolId(name, scopeId) {
        return `sym_${scopeId}_${name}_${Date.now()}`;
    }

    generateCacheKey(name, options) {
        return `${name}_${this.currentScope}_${JSON.stringify(options)}`;
    }

    updateAccessMetrics(symbolId) {
        const symbol = this.symbolRegistry.get(symbolId);
        if (symbol) {
            symbol.metadata.accessCount++;
            symbol.metadata.lastAccessed = Date.now();
            this.lastAccessTime.set(symbolId, Date.now());
        }
    }

    clearScopeFromCache(scopeId) {
        for (const [key, symbol] of this.resolutionCache) {
            if (symbol.scope === scopeId) {
                this.resolutionCache.delete(key);
            }
        }
    }

    findScopeById(scopeId) {
        return this.scopes.find(scope => scope.id === scopeId);
    }

    removeSymbol(symbolId) {
        const symbol = this.symbolRegistry.get(symbolId);
        if (symbol) {
            const scope = this.findScopeById(symbol.scope);
            if (scope) {
                scope.symbols.delete(symbol.name);
            }
            this.symbolRegistry.delete(symbolId);
            this.resolutionCache.forEach((value, key) => {
                if (value.id === symbolId) {
                    this.resolutionCache.delete(key);
                }
            });
        }
    }

    /**
     * ENTERPRISE INITIALIZATION
     */
    initializeSymbolTable() {
        // Define built-in types and operators
        this.defineBuiltInSymbols();
        
        // Start garbage collection interval
        if (this.config.gcThreshold > 0) {
            setInterval(() => this.collectGarbage(), 60000); // Every minute
        }

        if (this.config.debugMode) {
            console.log('🔧 Enterprise Symbol Table initialized');
        }
    }

    defineBuiltInSymbols() {
        // Define core language symbols
        const coreSymbols = [
            { name: 'Number', kind: 'type', type: new NumberType() },
            { name: 'String', kind: 'type', type: new StringType() },
            { name: 'Boolean', kind: 'type', type: new BooleanType() },
            { name: 'Stream', kind: 'type', type: new TypeVariable('T') },
            { name: 'Pool', kind: 'type', type: new TypeVariable('T') }
        ];

        coreSymbols.forEach(symbol => {
            this.define({
                ...symbol,
                location: { line: 0, column: 0 },
                attributes: { category: 'builtin', mutability: 'immutable' }
            });
        });
    }

    /**
     * ENTERPRISE METRICS AND REPORTING
     */
    getMetrics() {
        const now = performance.now();
        return {
            uptime: now - this.metrics.startTime,
            totalSymbols: this.symbolRegistry.size,
            scopes: this.scopes.length,
            resolutions: this.metrics.resolutions,
            cacheHitRate: this.metrics.resolutions > 0 ? 
                (this.metrics.cacheHits / this.metrics.resolutions * 100).toFixed(1) + '%' : '0%',
            definitions: this.metrics.definitions,
            scopeChanges: this.metrics.scopeChanges,
            memoryUsage: process.memoryUsage().heapUsed
        };
    }

    generateReport() {
        const metrics = this.getMetrics();
        const symbolsByKind = this.getSymbolDistributionByKind();
        
        console.log('\n📊 Enterprise Symbol Table Report:');
        console.log(`   📦 Total symbols: ${metrics.totalSymbols}`);
        console.log(`   🔍 Scopes: ${metrics.scopes} (current: ${this.currentScope})`);
        console.log(`   📈 Resolutions: ${metrics.resolutions} (${metrics.cacheHitRate} cache hit rate)`);
        console.log(`   📝 Definitions: ${metrics.definitions}`);
        console.log(`   📊 Symbol distribution:`, symbolsByKind);
        console.log(`   ⏱️ Uptime: ${metrics.uptime.toFixed(2)}ms`);
    }

    getSymbolDistributionByKind() {
        const distribution = {};
        this.symbolRegistry.forEach(symbol => {
            distribution[symbol.kind] = (distribution[symbol.kind] || 0) + 1;
        });
        return distribution;
    }

    /**
     * SERIALIZATION FOR DEBUGGING AND PERSISTENCE
     */
    serialize() {
        return {
            scopes: this.scopes.map(scope => ({
                id: scope.id,
                name: scope.name,
                symbols: Array.from(scope.symbols.entries()),
                metadata: scope.metadata
            })),
            currentScope: this.currentScope,
            metrics: this.getMetrics(),
            dependencyGraph: this.dependencyGraph.serialize()
        };
    }

    exportSymbols() {
        const exportData = {};
        
        this.symbolRegistry.forEach((symbol, id) => {
            exportData[id] = {
                name: symbol.name,
                kind: symbol.kind,
                type: symbol.type.toString(),
                scope: symbol.scope,
                location: symbol.location,
                attributes: symbol.attributes,
                metadata: {
                    accessCount: symbol.metadata.accessCount,
                    lastAccessed: symbol.metadata.lastAccessed,
                    dependencies: Array.from(symbol.metadata.dependencies),
                    dependents: Array.from(symbol.metadata.dependents)
                }
            };
        });
        
        return exportData;
    }
}

/**
 * ENTERPRISE DEPENDENCY GRAPH
 */
class DependencyGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.reverseEdges = new Map();
    }

    addNode(id, data) {
        this.nodes.set(id, data);
        this.edges.set(id, new Set());
        this.reverseEdges.set(id, new Set());
    }

    addEdge(from, to) {
        if (!this.edges.has(from)) this.edges.set(from, new Set());
        if (!this.reverseEdges.has(to)) this.reverseEdges.set(to, new Set());
        
        this.edges.get(from).add(to);
        this.reverseEdges.get(to).add(from);
    }

    getDependencies(nodeId) {
        return Array.from(this.edges.get(nodeId) || []);
    }

    getDependents(nodeId) {
        return Array.from(this.reverseEdges.get(nodeId) || []);
    }

    serialize() {
        return {
            nodes: Object.fromEntries(this.nodes),
            edges: Object.fromEntries(
                Array.from(this.edges.entries()).map(([k, v]) => [k, Array.from(v)])
            )
        };
    }
}

// Re-export type system classes for consistency
export { 
    TypeVariable, 
    FunctionType, 
    StreamType, 
    PoolType, 
    NumberType, 
    StringType, 
    BooleanType,
    ModuleType 
} from './type-checker.js';

export default SymbolTable;
