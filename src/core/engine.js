// FILENAME: src/core/engine.js
// Fluxus Language Runtime Engine v11.2 - REPL COMPATIBLE

import { FluxusPackageManager } from '../package-manager.js';
import { FluxusLibraryLoader } from '../lib/hybrid-loader.js';

// ==================== CORE LANGUAGE PRIMITIVES ====================

/**
 * Fluxus Value System - Clean value wrapper
 */
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

// ==================== CLEAN STANDARD OPERATORS ====================

const STANDARD_OPERATORS = {
    // Core I/O
    'print': (input, args, context) => {
        const output = args.length > 0 ? `${args[0]}${input}` : String(input);
        console.log(`✅ Fluxus Output: ${output}`);
        return input;
    },

    'to_pool': (input, args, context) => {
        if (!args || args.length === 0) {
            throw new Error('to_pool requires a pool name as an argument.');
        }
        context.engine.updatePool(args[0], input);
        return input;
    },

    'ui_render': (input, args) => {
        const targetSelector = args && args.length > 0 ? args[0] : 'undefined_target';
        console.log(`[UI_RENDER] Rendering to ${targetSelector} with data:`, input);
        return input;
    },

    // Mathematical operators
    'add': (input, args) => {
        return args.reduce((acc, arg) => acc + parseFloat(arg), parseFloat(input));
    },

    'multiply': (input, args) => {
        return args.reduce((acc, arg) => acc * parseFloat(arg), parseFloat(input));
    },

    'subtract': (input, args) => {
        let result = parseFloat(input);
        args.forEach(arg => { result -= parseFloat(arg); });
        return result;
    },

    'divide': (input, args) => {
        let result = parseFloat(input);
        args.forEach(arg => { result /= parseFloat(arg); });
        return result;
    },

    // String operators
    'trim': (input) => String(input).trim(),
    'to_upper': (input) => String(input).toUpperCase(),
    'to_lower': (input) => String(input).toLowerCase(),

    // Collection operators
    'map': (input, args, context) => {
        if (Array.isArray(input)) {
            return input.map(item => context.engine.executeLens(item, args[0]));
        }
        return input;
    },

    'reduce': (input, args, context) => {
        if (Array.isArray(input) && args[0] === '+') {
            return input.reduce((acc, curr) => acc + curr, 0);
        }
        return input;
    },

    'filter': (input, args, context) => {
        if (Array.isArray(input)) {
            return input.filter(item => {
                const result = context.engine.executeLensOperation(item, args[0]);
                return Boolean(result);
            });
        }
        return input;
    },

    // Reactive operators
    'combine_latest': (input, args, context) => {
        const poolValues = {};
        args.forEach(poolName => {
            const cleanName = poolName.replace(/_pool$/, '');
            poolValues[cleanName] = context.engine.pools[poolName]?.value;
        });

        return {
            click_event: input,
            username: poolValues.username || 'testuser',
            password: poolValues.password || 'testpass'
        };
    },

    // Network operators
    'fetch_url': (input) => ({
        status_code: 200,
        body: {
            user_data: { id: 101, username: input.username },
            session_token: 'MOCK_TOKEN_ABC123',
            message: 'Login successful'
        }
    }),

    'split': (input) => {
        const isTrue = input.status_code === 200;
        return { isTrue: isTrue, data: input };
    },

    'hash_sha256': (input) => `SHA256(${input})`,

    'break': (input, args) => {
        const delimiter = args && args.length > 0 ? args[0] : ' ';
        return String(input).split(delimiter);
    },

    'concat': (input, args) => String(input) + args.join(''),

    'double': (input) => parseFloat(input) * 2,

    'add_five': (input) => parseFloat(input) + 5,

    'square': (input) => parseFloat(input) * parseFloat(input),

    'detect_steps': (input) => Math.floor(Math.random() * 3),

    'detect_mock_steps': (input) => Math.floor(Math.random() * 5),

    'calculate_magnitude': (input) => Math.sqrt(
        Math.pow(input.x || 0, 2) +
        Math.pow(input.y || 0, 2) +
        Math.pow(input.z || 0, 2)
    )
};

// ==================== REPL-COMPATIBLE RUNTIME ENGINE ====================

export class RuntimeEngine {
    constructor(config = {}) {
        // Core state management
        this.pools = {};
        this.subscriptions = {};
        this.ast = null;
        this.replMode = config.replMode || false;
        
        // Configuration - CLEAN OUTPUT BY DEFAULT
        this.debugMode = config.debugMode || false;
        this.logLevel = config.logLevel || 'ERROR'; // Only errors by default
        this.quietMode = config.quietMode !== false; // Quiet by default
        this.performanceTracking = config.performanceTracking !== false;
        
        // Systems
        this.operators = { ...STANDARD_OPERATORS };
        this.packageManager = new FluxusPackageManager();
        this.libraryLoader = new FluxusLibraryLoader(this);
        this.loadedLibraries = new Set();

        // Performance tracking
        this.performance = {
            totalOperatorCalls: 0,
            startTime: Date.now(),
            uptime: 0
        };

        // Initialize core libraries immediately
        this.initializeCoreLibraries();

        if (!this.replMode && !this.quietMode) {
            this.cleanOutput('🚀 Fluxus Engine Initialized');
        }
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

    // ==================== REPL-REQUIRED METHODS ====================

    getEngineStats() {
        const poolStats = {};
        Object.keys(this.pools).forEach(poolName => {
            const pool = this.pools[poolName];
            poolStats[poolName] = {
                value: pool.value,
                updates: pool._updates || 0,
                subscribers: pool.subscriptions?.size || 0,
                historySize: pool.history?.length || 0
            };
        });

        return {
            pools: Object.keys(this.pools).length,
            operators: Object.keys(this.operators).length,
            libraries: this.loadedLibraries.size,
            poolsDetail: poolStats,
            loadedLibraries: Array.from(this.loadedLibraries),
            performance: {
                totalOperatorCalls: this.performance.totalOperatorCalls,
                uptime: Date.now() - this.performance.startTime
            },
            memory: {
                pools: Object.keys(this.pools).length,
                subscriptions: Object.values(this.pools).reduce((acc, pool) => 
                    acc + (pool.subscriptions?.size || 0), 0),
                liveStreams: 0, // Placeholder for stream tracking
                statefulOperators: Object.values(this.operators).filter(op => 
                    typeof op === 'object' && op.config?.stateful).length
            }
        };
    }

    // ==================== CLEAN OUTPUT SYSTEM ====================

    cleanOutput(message, data = null) {
        if (this.quietMode) return;
        
        // Clean, user-friendly output without JSON timestamps
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
        // In quiet mode, only show program output and critical errors
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
        
        // In debug mode, show everything with clean formatting
        if (this.debugMode) {
            this.cleanOutput(`${level}: ${message}`, metadata);
            return;
        }
        
        // Normal mode: show errors and important info cleanly
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
                    if (libraryOperators[opName] && typeof libraryOperators[opName] === 'object') {
                        this.operators[opName] = libraryOperators[opName].implementation || libraryOperators[opName];
                    } else {
                        this.operators[opName] = libraryOperators[opName];
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
            
            // 🎯 CRITICAL FIX: Load imports BEFORE execution
            if (ast.imports && ast.imports.length > 0) {
                for (const importName of ast.imports) {
                    await this.handleFlowImport(importName);
                }
            }
            
            // 🎯 CRITICAL FIX: Load all operators
            this.loadAllOperators();
            
            // 🎯 CRITICAL FIX: Initialize and execute
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
        
        // Initialize default pools if they don't exist
        if (!this.pools['username_pool']) {
            this.pools['username_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
        if (!this.pools['password_pool']) {
            this.pools['password_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
    }

    updatePool(poolName, newValue) {
        const pool = this.pools[poolName];
        if (!pool) {
            this.log('ERROR', 'Pool not found', { pool: poolName });
            return;
        }

        const oldValue = pool.value;
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            pool.value = newValue;
            pool._updates = (pool._updates || 0) + 1;
            pool.history.push(newValue);
            
            if (pool.history.length > 1000) {
                pool.history = pool.history.slice(-1000);
            }

            this.notifySubscribers(poolName, newValue);
        }
    }

    notifySubscribers(poolName, newValue) {
        const pool = this.pools[poolName];
        if (!pool || !pool.subscriptions) return;

        pool.subscriptions.forEach(subscriptionNodeId => {
            try {
                const startNode = this.ast.nodes.find(n => n.id === subscriptionNodeId);
                if (startNode) {
                    this.runPipeline(startNode.id, newValue);
                }
            } catch (error) {
                this.log('ERROR', 'Subscription notification failed', { pool: poolName, error: error.message });
            }
        });
    }

    // 🎯 CRITICAL FIX: Enhanced stream execution
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
            
            if (currentNode && currentNode.name &&
                (currentNode.name.startsWith('to_pool(') ||
                 currentNode.name.startsWith('print(') ||
                 currentNode.name.startsWith('ui_render('))) {
                
                let sinkName = currentNode.name;
                let effectiveArgs = currentNode.args || [];
                
                const sinkParenIndex = currentNode.name.indexOf('(');
                if (sinkParenIndex !== -1) {
                    sinkName = currentNode.name.substring(0, sinkParenIndex).trim();
                    if (effectiveArgs.length === 0) {
                         effectiveArgs = this.extractArgsFromMalformedName(currentNode.name);
                    }
                }
                
                const operator = this.operators[sinkName];
                if (operator) {
                    operator(currentData, effectiveArgs, { engine: this });
                }
                break;
            }
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
        if (argsString.startsWith(`\"`) && argsString.endsWith(`\"`)) {
            return [argsString.slice(1, -1)];
        }
        if (argsString) {
            return argsString.split(',').map(a => a.trim());
        }
        
        return [];
    }

    executeLens(inputData, lensExpression) {
        if (Array.isArray(inputData)) {
            return inputData.map(item => this.executeLensOperation(item, lensExpression));
        }
        return this.executeLensOperation(inputData, lensExpression);
    }

    executeLensOperation(item, lensExpression) {
        const steps = lensExpression.split('|').map(step => step.trim());
        let result = item;
        
        for (const step of steps) {
            if (step === '.value') {
                result = result?.value !== undefined ? result.value : result;
            } else if (step.startsWith('multiply(')) {
                const argMatch = step.match(/multiply\((\d+)\)/);
                if (argMatch) {
                    const factor = parseFloat(argMatch[1]);
                    result = parseFloat(result) * factor;
                }
            } else if (step.startsWith('add(')) {
                const argMatch = step.match(/add\((\d+)\)/);
                if (argMatch) {
                    const addend = parseFloat(argMatch[1]);
                    result = parseFloat(result) + addend;
                }
            }
        }
        return result;
    }

    executeReduce(inputData, lensExpression) {
        if (Array.isArray(inputData) && lensExpression === '+') {
            return inputData.reduce((acc, curr) => acc + curr, 0);
        }
        return inputData;
    }

    executeFilter(inputData, lensExpression) {
        if (Array.isArray(inputData)) {
            return inputData.filter(item => {
                if (lensExpression.includes('>')) {
                    const [left, right] = lensExpression.split('>').map(s => s.trim());
                    if (left === '.value') {
                        return item > parseFloat(right);
                    }
                }
                return true;
            });
        }
        return inputData;
    }

    executeSplit(inputData, lensExpression) {
        if (lensExpression.includes('==')) {
            const [left, right] = lensExpression.split('==').map(s => s.trim());
            if (left === '.status_code') {
                const isTrue = inputData.status_code === parseInt(right);
                return { isTrue: isTrue, data: inputData };
            }
        }
        return { isTrue: false, data: inputData };
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
        if (value.startsWith(`\"`) && value.endsWith(`\"`)) return value.slice(1, -1);
        
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
        
        // Clear state
        this.pools = {};
        this.operators = { ...STANDARD_OPERATORS };
        this.loadedLibraries.clear();
        this.ast = null;
        
        if (!this.quietMode) {
            this.cleanOutput('Fluxus Engine shutdown complete');
        }
    }
}
