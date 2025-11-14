// FILENAME: src/core/engine.js
// Fluxus Language Runtime Engine v11.4 - FIXED PIPELINE EXECUTION

import { FluxusPackageManager } from '../package-manager.js';
import { FluxusLibraryLoader } from '../lib/hybrid-loader.js';
import { OperatorsRegistry } from '../stdlib/core/operators/index.js';

// ==================== CORE LANGUAGE PRIMITIVES ====================

class FluxusValue {
    constructor(value, metadata = {}) {
        this.value = value;
        this.metadata = {
            type: this._detectType(value),
            timestamp: Date.now(),
            source: metadata.source || 'unknown',
            ...metadata
        };
    }

    _detectType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    equals(other) {
        return JSON.stringify(this.value) === JSON.stringify(other?.value ?? other);
    }

    clone() {
        return new FluxusValue(
            JSON.parse(JSON.stringify(this.value)),
            { ...this.metadata, timestamp: Date.now() }
        );
    }
}

// ==================== STANDARD LIBRARY INTEGRATION ====================

export class RuntimeEngine {
    constructor(config = {}) {
        // Core state management
        this.pools = {};
        this.subscriptions = {};
        this.ast = null;
        this.replMode = config.replMode || false;

        // Configuration
        this.debugMode = config.debugMode || false;
        this.logLevel = config.logLevel || 'ERROR';
        this.quietMode = config.quietMode !== false;
        this.performanceTracking = config.performanceTracking !== false;

        // Enhanced Systems
        this.operatorsRegistry = new OperatorsRegistry();
        this.operators = this.initializeStandardOperators();
        this.packageManager = new FluxusPackageManager();
        this.libraryLoader = new FluxusLibraryLoader(this);
        this.loadedLibraries = new Set();

        // Performance tracking
        this.performance = {
            totalOperatorCalls: 0,
            startTime: Date.now(),
            uptime: 0
        };

        // Initialize core libraries after loader is ready
        this.initializeCoreLibraries();

        if (!this.replMode && !this.quietMode) {
            this.cleanOutput('🚀 Fluxus Engine Initialized');
        }
    }

    // Initialize operators from Standard Library
    initializeStandardOperators() {
        const operators = {};
        const allOperators = this.operatorsRegistry.getAllOperators();

        for (const [name, op] of Object.entries(allOperators)) {
            operators[name] = (input, args = [], context = {}) => {
                try {
                    this.performance.totalOperatorCalls++;
                    return this.operatorsRegistry.executeOperator(name, input, args, op.library || 'core');
                } catch (error) {
                    throw new Error(`Operator ${name} failed: ${error.message}`);
                }
            };
        }

        return operators;
    }

    async initializeCoreLibraries() {
        const coreLibraries = ['core', 'types', 'collections', 'math', 'string', 'time'];

        for (const libName of coreLibraries) {
            try {
                await this.importLibrary(libName);
            } catch (error) {
                // Silent fail for core libraries
            }
        }
    }

    // ==================== CLEAN OUTPUT SYSTEM ====================

    cleanOutput(message, data = null) {
        if (this.quietMode) return;

        if (message.includes('Initialized')) {
            console.log(`⚛️ ${message}`);
        } else if (message.includes('Loading')) {
            console.log(`📚 ${message}`);
        } else if (message.includes('Loaded')) {
            console.log(`   📊 ${message}`);
        } else if (message.includes('Linking') || message.includes('Activating') || message.includes('Running')) {
            console.log(`   * ${message}`);
        } else if (message.includes('Activated')) {
            if (data) {
                console.log(`✅ ${message}`, data);
            } else {
                console.log(`✅ ${message}`);
            }
        } else if (message.includes('Fluxus Output:')) {
            console.log(message);
        } else {
            console.log(message);
        }
    }

    log(level, message, metadata = {}) {
        if (this.quietMode) {
            if (message.includes('✅ Fluxus Output:')) {
                console.log(message);
            } else if (level === 'ERROR') {
                console.error(`❌ Fluxus Error: ${message}`);
                if (metadata.error) {
                    console.error(`   Details: ${metadata.error}`);
                }
            }
            return;
        }

        if (this.debugMode) {
            this.cleanOutput(`${level}: ${message}`, metadata);
            return;
        }

        const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
        if (levels[level] >= levels[this.logLevel]) {
            if (level === 'ERROR') {
                console.error(`❌ ${message}`);
                if (metadata.error) {
                    console.error(`   Details: ${metadata.error}`);
                }
            } else if (level === 'WARN') {
                console.log(`⚠️ ${message}`);
            } else if (message.includes('✅ Fluxus Output:')) {
                console.log(message);
            } else {
                this.cleanOutput(message, metadata);
            }
        }
    }

    // ==================== LIBRARY SYSTEM ====================

    async importLibrary(libraryName) {
        if (this.loadedLibraries.has(libraryName)) {
            return true;
        }

        try {
            const libraryOperators = await this.libraryLoader.loadLibrary(libraryName);

            if (libraryOperators && typeof libraryOperators === 'object') {
                Object.keys(libraryOperators).forEach(opName => {
                    const operator = libraryOperators[opName];

                    if (operator && typeof operator === 'object' && operator.implementation) {
                        this.operators[opName] = operator.implementation;
                    }
                    else if (typeof operator === 'function') {
                        this.operators[opName] = operator;
                    }
                    else {
                        this.operators[opName] = operator;
                    }
                });

                this.loadedLibraries.add(libraryName);
                return true;
            }
            return false;

        } catch (error) {
            if (!this.quietMode) {
                this.log('ERROR', `Failed to import library`, { library: libraryName, error: error.message });
            }
            return false;
        }
    }

    async handleFlowImport(flowName) {
        const libraryMap = {
            'ui': 'ui', 'network': 'http', 'crypto': 'crypto', 'sensors': 'sensors',
            'math': 'math', 'time': 'time', 'text': 'string', 'data': 'data',
            'streams': 'streams', 'aggregators': 'aggregators', 'reactive': 'reactive'
        };

        const libraryName = libraryMap[flowName] || flowName;
        return await this.importLibrary(libraryName);
    }

    // ==================== EXECUTION ENGINE ====================

    async start(ast) {
        const startTime = Date.now();
        this.ast = ast;

        try {
            if (!this.quietMode && !this.replMode) {
                this.cleanOutput('🚀 Executing Fluxus Program...');
            }

            if (ast.imports && ast.imports.length > 0) {
                for (const importName of ast.imports) {
                    await this.handleFlowImport(importName);
                }
            }

            this.loadAllOperators();
            this.initializePools();
            this.linkSubscriptions();
            this.runFiniteStreams();

            const executionTime = Date.now() - startTime;
            const libs = this.getLoadedLibraries().length;
            const totalOps = Object.keys(this.operators).length;

            if (!this.quietMode && !this.replMode) {
                this.cleanOutput('✅ Fluxus Runtime Activated', {
                    executionTime: `${executionTime}ms`,
                    libraries: libs,
                    operators: totalOps,
                    pools: Object.keys(this.pools).length
                });
            }

        } catch (error) {
            this.log('ERROR', 'Failed to start engine', { error: error.message });
            throw error;
        }
    }

    loadAllOperators() {
        const packageOperators = this.packageManager.getInstalledOperators();
        this.operators = { ...this.operators, ...packageOperators };
    }

    initializePools() {
        if (!this.ast || !this.ast.pools) return;

        for (const poolName in this.ast.pools) {
            const poolDef = this.ast.pools[poolName];
            try {
                let initialValue = this.parseLiteralValue(poolDef.initial);

                this.pools[poolName] = {
                    value: initialValue,
                    subscriptions: new Set(),
                    history: [initialValue],
                    _updates: 0
                };

            } catch (error) {
                this.pools[poolName] = {
                    value: null,
                    subscriptions: new Set(),
                    history: [],
                    _updates: 0,
                    error: error.message
                };
            }
        }

        if (!this.pools['username_pool']) {
            this.pools['username_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
        if (!this.pools['password_pool']) {
            this.pools['password_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
    }

    // 🎯 CRITICAL FIX: Enhanced runPipeline with proper sink operator handling
    runPipeline(startNodeId, initialData) {
        let currentNode = this.ast.nodes.find(n => n.id === startNodeId);
        let currentData = initialData;

        if (!currentNode) {
            this.log('ERROR', 'Pipeline node not found', { node: startNodeId });
            return;
        }

        let step = 0;

        while (currentNode && step < 1000) {
            step++;

            // 🎯 FIX: Check for sink operators BEFORE processing current node
            if (currentNode.name && this.isSinkOperator(currentNode.name)) {
                this.executeSinkOperator(currentNode, currentData);
                break;
            }

            if (currentNode.type === 'FUNCTION_OPERATOR' || currentNode.type === 'LENS_OPERATOR') {
                let cleanOperatorName = currentNode.name;
                let effectiveArgs = currentNode.args || [];

                const openParenIndex = currentNode.name.indexOf('(');
                if (openParenIndex !== -1) {
                    cleanOperatorName = currentNode.name.substring(0, openParenIndex).trim();
                    if (effectiveArgs.length === 0) {
                         effectiveArgs = this.extractArgsFromMalformedName(currentNode.name);
                    }
                }

                const operator = this.operators[cleanOperatorName];

                if (operator) {
                    try {
                        const impl = typeof operator === 'function' ? operator : (operator.implementation || operator);
                        currentData = impl(currentData, effectiveArgs, { engine: this });
                        this.performance.totalOperatorCalls++;
                    } catch (error) {
                        this.log('ERROR', 'Operator execution failed', {
                            operator: cleanOperatorName,
                            line: currentNode.line,
                            error: error.message
                        });
                        return;
                    }
                } else if (currentNode.type === 'LENS_OPERATOR') {
                    try {
                        if (cleanOperatorName === 'map') {
                            currentData = this.executeLens(currentData, effectiveArgs[0]);
                        } else if (cleanOperatorName === 'reduce') {
                            currentData = this.executeReduce(currentData, effectiveArgs[0]);
                        } else if (cleanOperatorName === 'filter') {
                            currentData = this.executeFilter(currentData, effectiveArgs[0]);
                        } else if (cleanOperatorName === 'split') {
                            currentData = this.executeSplit(currentData, effectiveArgs[0]);
                        }
                        this.performance.totalOperatorCalls++;
                    } catch (error) {
                        this.log('ERROR', 'Lens execution failed', {
                            lens: cleanOperatorName,
                            line: currentNode.line,
                            error: error.message
                        });
                        return;
                    }
                } else {
                    this.log('ERROR', 'Unknown operator', { operator: currentNode.name, line: currentNode.line });
                    return;
                }
            }

            if (currentNode.isTerminal) {
                break;
            }

            let nextConnection = this.ast.connections.find(c => c.from === currentNode.id && c.type === 'PIPE_FLOW');

            if (currentNode.name === 'split') {
                let branchName = currentData.isTrue ? 'TRUE_FLOW' : 'FALSE_FLOW';

                let flowConn = this.ast.connections.find(c =>
                    c.from === currentNode.id &&
                    this.ast.nodes.find(n => n.id === c.to)?.name === branchName
                );

                nextConnection = flowConn;
                currentData = currentData.data;
            }

            currentNode = nextConnection ? this.ast.nodes.find(n => n.id === nextConnection.to) : null;
        }
    }

    // 🎯 NEW: Check if operator is a sink (should break pipeline after execution)
    isSinkOperator(operatorName) {
        const sinkOperators = ['print', 'to_pool', 'ui_render'];
        const cleanName = operatorName.split('(')[0].trim();
        return sinkOperators.includes(cleanName);
    }

    // 🎯 NEW: Execute sink operator properly
    executeSinkOperator(node, data) {
        let operatorName = node.name;
        let effectiveArgs = node.args || [];

        const openParenIndex = node.name.indexOf('(');
        if (openParenIndex !== -1) {
            operatorName = node.name.substring(0, openParenIndex).trim();
            if (effectiveArgs.length === 0) {
                effectiveArgs = this.extractArgsFromMalformedName(node.name);
            }
        }

        const operator = this.operators[operatorName];
        if (operator) {
            try {
                const impl = typeof operator === 'function' ? operator : (operator.implementation || operator);
                impl(data, effectiveArgs, { engine: this });
                this.performance.totalOperatorCalls++;
            } catch (error) {
                this.log('ERROR', 'Sink operator execution failed', {
                    operator: operatorName,
                    line: node.line,
                    error: error.message
                });
            }
        } else {
            this.log('ERROR', 'Unknown sink operator', { operator: node.name, line: node.line });
        }
    }

    linkSubscriptions() {
        if (!this.ast || !this.ast.nodes) return;

        const subscriptionNodes = this.ast.nodes.filter(n => n.type === 'POOL_READ');

        if (!this.quietMode && !this.replMode && subscriptionNodes.length > 0) {
            this.cleanOutput(`   * Linking ${subscriptionNodes.length} Reactive Subscription${subscriptionNodes.length !== 1 ? 's' : ''}...`);
        }

        subscriptionNodes.forEach(node => {
            const poolName = node.value.replace(' ->', '');
            if (this.pools[poolName]) {
                this.pools[poolName].subscriptions.add(node.id);
                this.runPipeline(node.id, this.pools[poolName].value);
            }
        });
    }

    runFiniteStreams() {
        if (!this.ast || !this.ast.nodes) return;

        const finiteStreams = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE');

        if (!this.quietMode && !this.replMode && finiteStreams.length > 0) {
            this.cleanOutput(`   * Running ${finiteStreams.length} Finite Stream${finiteStreams.length !== 1 ? 's' : ''}...`);
        }

        finiteStreams.forEach(streamNode => {
            const initialData = this.parseLiteralValue(streamNode.value);
            this.runPipeline(streamNode.id, initialData);
        });
    }

    // ==================== UTILITIES ====================

    extractArgsFromMalformedName(name) {
        const openParenIndex = name.indexOf('(');
        const closeParenIndex = name.lastIndexOf(')');
        if (openParenIndex === -1 || closeParenIndex === -1) {
            return [];
        }

        let argsString = name.substring(openParenIndex + 1, closeParenIndex).trim();
        if (argsString.includes('|')) {
            argsString = argsString.split('|')[0].trim();
        }

        if (argsString.startsWith(`'`) && argsString.endsWith(`'`)) {
            return [argsString.slice(1, -1)];
        }
        if (argsString.startsWith(`"`) && argsString.endsWith(`"`)) {
            return [argsString.slice(1, -1)];
        }
        if (argsString) {
            return argsString.split(',').map(a => a.trim());
        }

        return [];
    }

    parseLiteralValue(value) {
        if (value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;

        if (value.startsWith('[') && value.endsWith(']')) {
            try {
                const jsonString = value.replace(/'/g, '"');
                return JSON.parse(jsonString);
            } catch (e) {
                const arrayContent = value.slice(1, -1).split(',').map(item => this.parseLiteralValue(item.trim()));
                return arrayContent;
            }
        }

        if (value.startsWith('{') && value.endsWith('}')) {
            try {
                const jsonString = value
                    .replace(/(\w+)\s*:/g, '"$1":')
                    .replace(/'/g, '"');
                return JSON.parse(jsonString);
            } catch (e) {
                return value;
            }
        }

        if (!isNaN(value) && value.trim() !== '') return parseFloat(value);
        if (value.startsWith(`'`) && value.endsWith(`'`)) return value.slice(1, -1);
        if (value.startsWith(`"`) && value.endsWith(`"`)) return value.slice(1, -1);

        return value;
    }

    getLoadedLibraries() {
        return Array.from(this.loadedLibraries);
    }

    // ==================== GRACEFUL SHUTDOWN ====================

    async shutdown() {
        if (!this.quietMode) {
            this.cleanOutput('Shutting down Fluxus Engine...');
        }

        this.pools = {};
        this.operators = this.initializeStandardOperators();
        this.loadedLibraries.clear();
        this.ast = null;

        if (!this.quietMode) {
            this.cleanOutput('Fluxus Engine shutdown complete');
        }
    }
}
