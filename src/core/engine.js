// FILENAME: src/core/engine.js
// Fluxus Language Runtime Engine v9.2 - FIXED STREAM EXECUTION

import { FluxusPackageManager } from '../package-manager.js';
import { FluxusLibraryLoader } from '../lib/hybrid-loader.js';

function extractArgsFromMalformedName(name) {
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

const STANDARD_OPERATORS = {
    'print': (input, args) => { 
        let output;
        
        if (args && args.length > 0) {
             const prefix = args[0];
             output = `${prefix}${input}`;
        } else {
            output = typeof input === 'object' ? JSON.stringify(input, null, 2) : String(input);
        }
        
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
        console.log(`[UI_RENDER] Rendering to ${targetSelector} with Auth Status: ${input.status}`); 
        return input; 
    },
    'add': (input, args) => {
        const result = args.reduce((acc, arg) => acc + parseFloat(arg), parseFloat(input));
        console.log(`→ add: ${input} + ${args.join(' + ')} = ${result}`);
        return result;
    },
    'multiply': (input, args) => {
        const result = args.reduce((acc, arg) => acc * parseFloat(arg), parseFloat(input));
        console.log(`→ multiply: ${input} * ${args.join(' * ')} = ${result}`);
        return result;
    },
    'subtract': (input, args) => {
        let result = parseFloat(input);
        args.forEach(arg => {
            result -= parseFloat(arg);
        });
        console.log(`→ subtract: ${input} - ${args.join(' - ')} = ${result}`);
        return result;
    },
    'divide': (input, args) => {
        let result = parseFloat(input);
        args.forEach(arg => {
            result /= parseFloat(arg);
        });
        console.log(`→ divide: ${input} / ${args.join(' / ')} = ${result}`);
        return result;
    },
    'trim': (input, args) => {
        const result = String(input).trim();
        console.log(`→ trim: "${input}" -> "${result}"`);
        return result;
    },
    'break': (input, args) => {
        const delimiter = args && args.length > 0 ? args[0] : ' ';
        const result = String(input).split(delimiter);
        console.log(`→ break: "${input}" by "${delimiter}" ->`, result);
        return result;
    },
    'concat': (input, args) => {
        const result = String(input) + args.join('');
        console.log(`→ concat: "${input}" + "${args.join('')}" -> "${result}"`);
        return result;
    },
    'to_upper': (input, args) => {
        const result = String(input).toUpperCase();
        console.log(`→ to_upper: "${input}" -> "${result}"`);
        return result;
    },
    'to_lower': (input, args) => {
        const result = String(input).toLowerCase();
        console.log(`→ to_lower: "${input}" -> "${result}"`);
        return result;
    },
    'double': (input, args) => {
        const result = parseFloat(input) * 2;
        console.log(`→ double: ${input} * 2 = ${result}`);
        return result;
    },
    'add_five': (input, args) => {
        const result = parseFloat(input) + 5;
        console.log(`→ add_five: ${input} + 5 = ${result}`);
        return result;
    },
    'square': (input, args) => {
        const result = parseFloat(input) * parseFloat(input);
        console.log(`→ square: ${input}² = ${result}`);
        return result;
    },
    'detect_steps': (input, args) => {
        const mockSteps = Math.floor(Math.random() * 3);
        console.log(`→ detect_steps: simulated ${mockSteps} steps from sensor data`);
        return mockSteps;
    },
    'detect_mock_steps': (input, args) => {
        const mockSteps = Math.floor(Math.random() * 5);
        console.log(`→ detect_mock_steps: simulated ${mockSteps} steps`);
        return mockSteps;
    },
    'calculate_magnitude': (input, args) => {
        const magnitude = Math.sqrt(
            Math.pow(input.x || 0, 2) + 
            Math.pow(input.y || 0, 2) + 
            Math.pow(input.z || 0, 2)
        );
        console.log(`→ calculate_magnitude: (${input.x}, ${input.y}, ${input.z}) -> ${magnitude.toFixed(2)}`);
        return magnitude;
    },
    'map': (input, args, context) => {
        return input;
    },
    'reduce': (input, args, context) => {
        return input;
    },
    'filter': (input, args, context) => {
        return input;
    },
    'combine_latest': (input, args, context) => {
        const poolValues = {};
        args.forEach(poolName => {
            const cleanName = poolName.replace(/_pool$/, ''); 
            poolValues[cleanName] = context.engine.pools[poolName]?.value;
        });

        if (poolValues.username === '') poolValues.username = 'testuser';
        if (poolValues.password === '') poolValues.password = 'testpass';
        
        return { 
            click_event: input, 
            username: poolValues.username, 
            password: poolValues.password 
        };
    },
    'hash_sha256': (input) => { 
        return `SHA256(${input})`; 
    },
    'fetch_url': (input) => { 
        console.log(`[NETWORK] MOCK: Fetching ${input.username} with ${input.password_hash}`);
        return { 
            status_code: 200, 
            body: { 
                user_data: { id: 101, username: input.username }, 
                session_token: 'MOCK_TOKEN_ABC123',
                message: 'Login successful'
            } 
        }; 
    },
    'split': (input) => {
        const isTrue = input.status_code === 200;
        return { isTrue: isTrue, data: input };
    },
};


export class RuntimeEngine {
    constructor() {
        this.pools = {};
        this.subscriptions = {};
        this.liveStreams = {};
        this.ast = null;
        this.debugMode = false;
        this.operators = {}; 
        this.packageManager = new FluxusPackageManager(); 
        this.libraryLoader = new FluxusLibraryLoader(this);
        this.loadedLibraries = new Set();
        this.logLevel = 'INFO';
        this.replMode = false;
        this.realStreams = new Map();
        
        this.initializeCoreLibraries();
    }

    async initializeCoreLibraries() {
        const coreLibraries = ['core', 'types', 'collections', 'math', 'string', 'time'];
        
        for (const libName of coreLibraries) {
            try {
                await this.importLibrary(libName);
            } catch (error) {
                console.warn(`⚠️ Could not load core library: ${libName}`, error.message);
            }
        }
    }

    async importLibrary(libraryName) {
        if (this.loadedLibraries.has(libraryName)) {
            return true;
        }
        
        try {
            const libraryOperators = await this.libraryLoader.loadLibrary(libraryName);
            
            // 🎯 CRITICAL FIX: Proper operator registration
            if (libraryOperators && typeof libraryOperators === 'object') {
                Object.keys(libraryOperators).forEach(opName => {
                    if (libraryOperators[opName] && typeof libraryOperators[opName] === 'object') {
                        this.operators[opName] = libraryOperators[opName].implementation || libraryOperators[opName];
                    } else {
                        this.operators[opName] = libraryOperators[opName];
                    }
                });
                
                this.loadedLibraries.add(libraryName);
                
                if (this.debugMode) {
                    const opCount = Object.keys(libraryOperators).length;
                    console.log(`📚 Library registered: ${libraryName} (${opCount} operators)`);
                }
                
                return true;
            } else {
                console.log(`   ⚠️ No operators found in library: ${libraryName}`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ Failed to import library ${libraryName}:`, error.message);
            return false;
        }
    }

    async handleFlowImport(flowName) {
        const libraryMap = {
            'ui': 'dom',
            'network': 'http',
            'crypto': 'crypto',
            'sensors': 'sensors',
            'math': 'math',
            'time': 'time',
            'text': 'string'
        };
        
        const libraryName = libraryMap[flowName] || flowName;
        return await this.importLibrary(libraryName);
    }

    log(level, message) {
        const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
        if (levels[level] >= levels[this.logLevel]) {
            console.log(message);
        }
    }

    startRepl(ast) {
        this.replMode = true;
        this.start(ast);
    }

    async start(ast) {
        this.ast = ast;
        
        if (ast.imports && ast.imports.length > 0) {
            if (!this.replMode) {
                console.log('\n📦 Loading libraries...');
            }
            for (const importName of ast.imports) {
                await this.handleFlowImport(importName);
            }
        }
        
        this.loadAllOperators();
        this.initializePools();
        this.linkSubscriptions();
        this.activateLiveStreams();
        this.runFiniteStreams();
        
        if (!this.replMode) {
            const libs = this.getLoadedLibraries().join(', ');
            this.log('INFO', `\n✅ Fluxus Runtime Activated. Libraries: ${libs || 'none'}`);
        }
    }

    loadAllOperators() {
        const packageOperators = this.packageManager.getInstalledOperators();
        this.operators = { ...STANDARD_OPERATORS, ...this.operators, ...packageOperators };
        
        if (this.debugMode) {
            this.log('DEBUG', `📦 Loaded ${Object.keys(packageOperators).length} package operators`);
            this.log('DEBUG', `📚 Loaded ${this.loadedLibraries.size} libraries`);
            this.log('DEBUG', `🔧 Loaded ${Object.keys(STANDARD_OPERATORS).length} standard operators`);
        }
    }

    initializePools() {
        for (const poolName in this.ast.pools) {
            const poolDef = this.ast.pools[poolName];
            try {
                let initialValue = this.parseLiteralValue(poolDef.initial);
                
                if (this.replMode && this.pools[poolName]) {
                    this.log('DEBUG', `   * Preserving existing pool '${poolName}' with value: ${this.pools[poolName].value}`);
                    continue;
                }
                
                this.pools[poolName] = {
                    value: initialValue, 
                    subscriptions: new Set(),
                    history: [initialValue], 
                    _updates: 0
                };
                
                if (this.debugMode) {
                    this.log('DEBUG', `   * Initialized pool '${poolName}' = ${initialValue}`);
                }
            } catch (error) {
                this.log('ERROR', `❌ Failed to initialize pool '${poolName}': ${error.message}`);
                this.pools[poolName] = {
                    value: null,
                    subscriptions: new Set(),
                    history: [],
                    _updates: 0,
                    error: error.message
                };
            }
        }
        
        if (!this.replMode || !this.pools['username_pool']) {
            this.pools['username_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
        if (!this.replMode || !this.pools['password_pool']) {
            this.pools['password_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
        
        if (!this.replMode) {
            this.log('INFO', `   * Initialized ${Object.keys(this.pools).length} Tidal Pools.`);
        }
    }

    updatePool(poolName, newValue) {
        const pool = this.pools[poolName];
        if (!pool) {
            this.log('ERROR', `❌ Pool not found: ${poolName}`);
            return;
        }

        const oldValue = pool.value;
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            pool.value = newValue;
            pool._updates = (pool._updates || 0) + 1;
            pool.history.push(newValue);
            
            if (this.replMode) {
                console.log(`🔄 Updated pool '${poolName}' to ${this.formatValueForDisplay(newValue)}`);
            } else {
                this.log('INFO', `🔄 Updated pool '${poolName}' to ${this.formatValueForDisplay(newValue)}`);
            }
            
            pool.subscriptions.forEach(subscriptionNodeId => {
                const startNode = this.ast.nodes.find(n => n.id === subscriptionNodeId);
                this.runPipeline(startNode.id, pool.value); 
            });
        }
    }

    formatValueForDisplay(value) {
        if (Array.isArray(value)) {
            return `[${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}]`;
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '');
        }
        return String(value);
    }

    // 🎯 CRITICAL FIX: Enhanced stream execution
    runPipeline(startNodeId, initialData) {
        let currentNode = this.ast.nodes.find(n => n.id === startNodeId);
        let currentData = initialData;
        
        if (!currentNode) {
            this.log('ERROR', `❌ Pipeline node not found: ${startNodeId}`);
            return;
        }
        
        let step = 0;
        
        if (this.debugMode) {
            const nodeType = currentNode.type === 'POOL_READ' ? 'Reactive Subscription' : 'Stream';
            this.log('DEBUG', `   * Executing ${nodeType} Pipeline from: ${currentNode.value}`);
        }
        
        while (currentNode) {
            step++;
            
            if (currentNode.type !== 'POOL_READ' && currentNode.type !== 'STREAM_SOURCE_LIVE' && currentNode.type !== 'STREAM_SOURCE_FINITE') {
                const lineInfo = currentNode.line ? `Line ${currentNode.line}: ` : '';
                if (this.debugMode) {
                    this.log('DEBUG', `     -> [STEP ${step}] ${lineInfo}${currentNode.name}`);
                }
            }

            if (currentNode.type === 'FUNCTION_OPERATOR' || currentNode.type === 'LENS_OPERATOR') {
                
                let cleanOperatorName = currentNode.name;
                let effectiveArgs = currentNode.args || [];
                
                const openParenIndex = currentNode.name.indexOf('(');
                if (openParenIndex !== -1) {
                    cleanOperatorName = currentNode.name.substring(0, openParenIndex).trim();
                    if (effectiveArgs.length === 0) {
                         effectiveArgs = extractArgsFromMalformedName(currentNode.name);
                    }
                }
                
                const operator = this.operators[cleanOperatorName];
                
                if (operator) {
                    try {
                        const impl = typeof operator === 'function' ? operator : (operator.implementation || operator);
                        currentData = impl(currentData, effectiveArgs, { engine: this });
                        
                        if (this.debugMode) {
                            this.log('DEBUG', `       Result: ${this.formatValueForDisplay(currentData)}`);
                        }
                    } catch (error) {
                        this.log('ERROR', `❌ Operator Error on line ${currentNode.line} (${cleanOperatorName}): ${error.message}`);
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
                    } catch (error) {
                        this.log('ERROR', `❌ Lens Error on line ${currentNode.line} (${cleanOperatorName}): ${error.message}`);
                        return;
                    }
                } else {
                    this.log('ERROR', `❌ Unknown Operator: ${currentNode.name} on line ${currentNode.line}`);
                    return;
                }
            } 
            
            if (currentNode.isTerminal) {
                if (this.debugMode) {
                    this.log('DEBUG', `     -> [TERMINAL] Pipeline completed`);
                }
                break;
            }
            
            let nextConnection = this.ast.connections.find(c => c.from === currentNode.id && c.type === 'PIPE_FLOW');
            
            if (currentNode.name === 'split') {
                let branchName = currentData.isTrue ? 'TRUE_FLOW' : 'FALSE_FLOW';
                
                let flowConn = this.ast.connections.find(c => 
                    c.from === currentNode.id && 
                    this.ast.nodes.find(n => n.id === c.to).name === branchName
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
                         effectiveArgs = extractArgsFromMalformedName(currentNode.name);
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

    executeLens(inputData, lensExpression) {
        if (typeof inputData === 'string' && inputData.includes(',')) {
            try {
                const parsedArray = inputData.split(',').map(item => parseFloat(item.trim()));
                if (parsedArray.every(item => !isNaN(item))) {
                    inputData = parsedArray;
                }
            } catch (e) {}
        }
        
        if (Array.isArray(inputData)) {
            const result = inputData.map(item => this.executeLensOperation(item, lensExpression));
            return result;
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
            } else if (step.startsWith('subtract(')) {
                const argMatch = step.match(/subtract\((\d+)\)/);
                if (argMatch) {
                    const subtrahend = parseFloat(argMatch[1]);
                    result = parseFloat(result) - subtrahend;
                }
            } else if (step.startsWith('double(')) {
                result = parseFloat(result) * 2;
            } else if (step.startsWith('add_five(')) {
                result = parseFloat(result) + 5;
            }
        }
        
        return result;
    }

    executeReduce(inputData, lensExpression) {
        if (typeof inputData === 'string' && inputData.includes(',')) {
            try {
                const parsedArray = inputData.split(',').map(item => parseFloat(item.trim()));
                if (parsedArray.every(item => !isNaN(item))) {
                    inputData = parsedArray;
                }
            } catch (e) {}
        }
        
        if (!Array.isArray(inputData)) {
            return inputData;
        }
        
        if (lensExpression === '+') {
            const result = inputData.reduce((acc, curr) => acc + curr, 0);
            return result;
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
    
    linkSubscriptions() {
        const subscriptionNodes = this.ast.nodes.filter(n => n.type === 'POOL_READ');
        subscriptionNodes.forEach(node => {
            const poolName = node.value.replace(' ->', ''); 
            if (this.pools[poolName]) {
                this.pools[poolName].subscriptions.add(node.id);
                this.runPipeline(node.id, this.pools[poolName].value); 
            }
        });
        
        if (!this.replMode) {
            this.log('INFO', `   * Linking ${subscriptionNodes.length} Reactive Subscription...`);
        }
    }

    activateLiveStreams() {
        const liveSources = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_LIVE');
        
        if (this.debugMode) {
            this.log('DEBUG', `   * Found ${liveSources.length} live stream sources`);
        }
        
        if (!this.replMode) {
            this.log('INFO', `   * Activating ${liveSources.length} Live Streams...`);
        }
    }

    // 🎯 CRITICAL FIX: Enhanced finite stream execution
    runFiniteStreams() {
        const finiteStreams = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE');
        
        if (!this.replMode) {
            this.log('INFO', `   * Running ${finiteStreams.length} Finite Streams...`);
        }
        
        finiteStreams.forEach(streamNode => {
            if (this.debugMode) {
                this.log('DEBUG', `   * Executing finite stream: ${streamNode.value}`);
            }
            const initialData = this.parseLiteralValue(streamNode.value);
            this.runPipeline(streamNode.id, initialData);
        });
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

    isRealStreamSource(source) {
        return source.value && source.value.includes('sensors.') && this.realStreams.has(source.value);
    }

    activateRealStream(source) {
        if (this.debugMode) {
            this.log('DEBUG', `   * Activating real stream: ${source.value}`);
        }
    }

    activateMockStream(source) {
        if (this.debugMode) {
            this.log('DEBUG', `   * Activating mock stream: ${source.value}`);
        }
    }

    getLoadedLibraries() {
        return Array.from(this.loadedLibraries);
    }
}
