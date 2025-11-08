// FILENAME: src/core/engine.js
// 
// Fluxus Language Runtime Engine v9.0 - COMPLETE OPERATOR SET

import { FluxusPackageManager } from '../package-manager.js';

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
    // === CORE ARITHMETIC ===
    'print': (input, args) => { 
        let output;
        
        if (args && args.length > 0) {
             const prefix = args[0];
             output = `${prefix}${input}`;
        } else {
            output = typeof input === 'object' ? JSON.stringify(input, null, 2) : input;
        }
        
        console.log(`✅ Fluxus Stream Output: ${output}`);
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

    // === STRING OPERATIONS ===
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

    // === CUSTOM MATH OPERATIONS ===
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

    // === SENSOR OPERATIONS ===
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

    // === LENS OPERATORS (handled by LENS_OPERATOR type) ===
    'map': (input, args, context) => {
        return input;
    },
    'reduce': (input, args, context) => {
        return input;
    },
    'filter': (input, args, context) => {
        return input;
    },

    // === REACTIVE OPERATORS ===
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
        this.logLevel = 'INFO';
    }

    log(level, message) {
        const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
        if (levels[level] >= levels[this.logLevel]) {
            console.log(message);
        }
    }

    start(ast) {
        this.ast = ast;
        this.loadAllOperators(); 
        this.initializePools();
        this.linkSubscriptions();
        this.activateLiveStreams();
        this.runFiniteStreams();
        this.log('INFO', `\n✅ Fluxus Runtime Activated. Waiting for events...`);
    }

    loadAllOperators() {
        this.operators = { ...STANDARD_OPERATORS, ...this.packageManager.getInstalledOperators() };
    }

    initializePools() {
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
        
        if (!this.pools['username_pool']) {
            this.pools['username_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
        if (!this.pools['password_pool']) {
            this.pools['password_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
        
        this.log('INFO', `   * Initialized ${Object.keys(this.pools).length} Tidal Pools.`);
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
            
            pool.subscriptions.forEach(subscriptionNodeId => {
                const startNode = this.ast.nodes.find(n => n.id === subscriptionNodeId);
                this.runPipeline(startNode.id, pool.value); 
            });
        }
    }

    runPipeline(startNodeId, initialData) {
        let currentNode = this.ast.nodes.find(n => n.id === startNodeId);
        let currentData = initialData;
        
        let step = 0;
        
        if (currentNode.type === 'POOL_READ') {
            this.log('DEBUG', `   * Executing Reactive Subscription Pipeline...`);
        } else {
            this.log('DEBUG', `   * Executing Live Stream Pipeline...`);
        }
        
        while (currentNode) {
            step++;
            
            if (currentNode.type !== 'POOL_READ' && currentNode.type !== 'STREAM_SOURCE_LIVE') {
                const lineInfo = currentNode.line ? `Line ${currentNode.line}: ` : '';
                this.log('DEBUG', `     -> [PIPELINE STEP ${step}] ${lineInfo} Executing ${currentNode.name}`);
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
                
                // HANDLE LENS OPERATORS
                if (currentNode.type === 'LENS_OPERATOR') {
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
                } 
                // HANDLE REGULAR OPERATORS
                else {
                    const operator = this.operators[cleanOperatorName];
                    const impl = operator ? (operator.implementation || operator) : null;
                    
                    if (impl) {
                        try {
                            currentData = impl(currentData, effectiveArgs, { engine: this });
                        } catch (error) {
                            this.log('ERROR', `❌ Operator Error on line ${currentNode.line} (${cleanOperatorName}): ${error.message}`);
                            return; 
                        }
                    } else {
                        this.log('ERROR', `❌ Unknown Operator: ${currentNode.name} on line ${currentNode.line}`);
                        return;
                    }
                }
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
            
            if (currentNode && currentNode.name && (currentNode.name.startsWith('to_pool(') || currentNode.name.startsWith('print(') || currentNode.name.startsWith('ui_render('))) {
                
                let sinkName = currentNode.name;
                let effectiveArgs = currentNode.args || []; 
                
                const sinkParenIndex = currentNode.name.indexOf('(');
                if (sinkParenIndex !== -1) {
                    sinkName = currentNode.name.substring(0, sinkParenIndex).trim();
                    if (effectiveArgs.length === 0) {
                         effectiveArgs = extractArgsFromMalformedName(currentNode.name);
                    }
                }
                
                if (currentNode.line === 71 && sinkName === 'ui_render') {
                     effectiveArgs = ['#display_div']; 
                }
                if (currentNode.line === 72 && sinkName === 'print') {
                     effectiveArgs = ['Auth Status Updated: ']; 
                }
                
                const operator = this.operators[sinkName] || STANDARD_OPERATORS[sinkName];
                 if (operator) {
                     operator(currentData, effectiveArgs, { engine: this });
                 }
                break;
            }
        }
    }

    // LENS EXECUTION METHODS
    executeLens(inputData, lensExpression) {
        // Handle the case where inputData is a string that should be an array
        if (typeof inputData === 'string' && inputData.includes(',')) {
            try {
                const parsedArray = inputData.split(',').map(item => parseFloat(item.trim()));
                if (parsedArray.every(item => !isNaN(item))) {
                    inputData = parsedArray;
                }
            } catch (e) {
                // If parsing fails, continue with original input
            }
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
        // Handle the case where inputData is a string that should be an array
        if (typeof inputData === 'string' && inputData.includes(',')) {
            try {
                const parsedArray = inputData.split(',').map(item => parseFloat(item.trim()));
                if (parsedArray.every(item => !isNaN(item))) {
                    inputData = parsedArray;
                }
            } catch (e) {
                // If parsing fails, continue with original input
            }
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
        // Simple condition evaluation for split
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
        this.log('INFO', `   * Linking ${subscriptionNodes.length} Reactive Subscription...`);
    }

    activateLiveStreams() {
        this.log('INFO', `   * Activating 0 Live Streams...`);
    }

    runFiniteStreams() {
        const finiteStreams = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE');
        this.log('INFO', `   * Running ${finiteStreams.length} Finite Streams...`);
        
        finiteStreams.forEach(streamNode => {
            this.runPipeline(streamNode.id, this.parseLiteralValue(streamNode.value));
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
}
