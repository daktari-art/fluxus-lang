// FILENAME: src/core/engine.js
// 
// Fluxus Language Runtime Engine v4.0 - Enhanced Error Recovery & Debugging

export class RuntimeEngine {
    constructor() {
        this.pools = {};
        this.subscriptions = {};
        this.liveStreams = {};
        this.ast = null;
        this.debugMode = false;
    }

    start(ast) {
        this.ast = ast;
        this.initializePools();
        this.linkSubscriptions();
        this.activateLiveStreams();
        this.runFiniteStreams();
        console.log(`\n✅ Fluxus Runtime Activated. Waiting for events...`);
    }

    initializePools() {
        for (const poolName in this.ast.pools) {
            const poolDef = this.ast.pools[poolName];
            try {
                this.pools[poolName] = {
                    value: this.parseLiteralValue(poolDef.initial), 
                    subscriptions: new Set(),
                    history: [this.parseLiteralValue(poolDef.initial)], // Enhanced: Track history
                    _updates: 0
                };
            } catch (error) {
                console.error(`❌ Failed to initialize pool '${poolName}': ${error.message}`);
                this.pools[poolName] = {
                    value: null,
                    subscriptions: new Set(),
                    history: [],
                    _updates: 0,
                    error: error.message
                };
            }
        }
        console.log(`   * Initialized ${Object.keys(this.pools).length} Tidal Pools.`);
    }
    
    linkSubscriptions() {
        console.log(`   * Linking reactive subscriptions...`);
        let subscriptionCount = 0;
        
        this.ast.nodes.forEach(node => {
            if (node.value && node.value.includes('->')) {
                const poolMatch = node.value.match(/(\w+)\s*->/);
                if (poolMatch) {
                    const poolName = poolMatch[1];
                    if (!this.subscriptions[poolName]) {
                        this.subscriptions[poolName] = new Set();
                    }
                    this.subscriptions[poolName].add(node.id);
                    subscriptionCount++;
                }
            }
        });
        console.log(`   * Linked ${subscriptionCount} subscription(s)`);
    }

    activateLiveStreams() {
        const liveSources = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_LIVE');
        console.log(`   * Activated ${liveSources.length} live stream(s)`);
        liveSources.forEach(source => {
            console.log(`     - ${source.value}`);
        });
    }

    runFiniteStreams() {
        const finiteSources = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE');
        finiteSources.forEach(sourceNode => {
            try {
                const rawValue = sourceNode.value.replace(/^~+\s*/, '').trim();
                const initialData = this.parseLiteralValue(rawValue);
                const pipelineId = this.findPipelineId(sourceNode.id); 
                if (pipelineId) {
                    this.runPipeline(pipelineId, initialData); 
                }
            } catch (error) {
                console.error(`❌ Failed to run stream from node ${sourceNode.id}: ${error.message}`);
            }
        });
    }

    runPipeline(startNodeId, initialData) {
        let currentNode = this.ast.nodes.find(n => n.id === startNodeId);
        let currentData = initialData;
        
        while (currentNode) {
            try {
                const connection = this.ast.connections.find(c => c.from === currentNode.id);
                if (!connection) break;
                
                const nextNode = this.ast.nodes.find(n => n.id === connection.to);
                const processedResult = this.processNode(nextNode, currentData);
                
                if (this.isPoolWriteSink(nextNode)) {
                    const poolName = this.extractPoolName(nextNode.value);
                    this.updatePool(poolName, processedResult);
                    return;
                }
                
                currentData = processedResult;
                currentNode = nextNode;
            } catch (error) {
                console.error(`❌ Pipeline error at node ${currentNode.id} (${currentNode.name}): ${error.message}`);
                break;
            }
        }
    }
    
    executeLensPipeline(lensValue, item) {
        let currentData = item;
        const parts = lensValue.split('|').map(p => p.trim()).filter(p => p !== '');

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === 0 && part.startsWith('.')) continue;
            
            const funcMatch = part.match(/^(\w+)\s*\((.*)\)$/);
            if (funcMatch) {
                const name = funcMatch[1];
                const argsString = funcMatch[2].trim();
                const args = argsString.split(',').map(a => a.trim()).filter(a => a !== '');
                const tempNode = { name, args, value: part, line: 0 };
                currentData = this.processNode(tempNode, currentData);
            } else if (part.match(/^[+\-*\/%]$/)) {
                return item;
            } else {
                currentData = this.parseLiteralValue(part);
            }
        }
        return currentData;
    }
    
    processNode(node, inputData) {
        // Enhanced: Debug logging
        if (this.debugMode) {
            console.log(`   🔍 Processing: ${node.name} with input:`, inputData);
        }

        if (node.value && node.value.includes('print(')) {
            const outputValue = typeof inputData === 'object' ? JSON.stringify(inputData) : inputData;
            console.log(`Output: ${outputValue}`);
            return inputData;
        }
        
        if (['add', 'subtract', 'multiply', 'divide'].includes(node.name)) {
            let result = typeof inputData === 'number' ? inputData : parseFloat(inputData);
            if (isNaN(result)) {
                throw new Error(`Input stream data is not numeric for operator '${node.name}'`);
            }

            for (const arg of node.args) {
                const numArg = parseFloat(arg);
                if (isNaN(numArg)) {
                    throw new Error(`Argument '${arg}' for '${node.name}' must be a number`);
                }
                
                switch (node.name) {
                    case 'add': result += numArg; break;
                    case 'subtract': result -= numArg; break;
                    case 'multiply': result *= numArg; break;
                    case 'divide': 
                        if (numArg === 0) {
                            throw new Error('Division by zero detected');
                        }
                        result /= numArg; 
                        break;
                }
            }
            return result;
        }

        if (['trim', 'to_upper', 'to_lower', 'concat', 'break', 'separate', 'word_count', 'join'].includes(node.name)) {
            let result = typeof inputData === 'string' ? inputData : String(inputData);
            switch (node.name) {
                case 'trim': return result.trim();
                case 'to_upper': return result.toUpperCase();
                case 'to_lower': return result.toLowerCase();
                case 'concat':
                    const argToConcat = node.args.length > 0 ? node.args[0].replace(/['"]/g, '') : '';
                    return result + argToConcat;
                case 'break':
                case 'separate':
                    const separator = node.args.length > 0 ? node.args[0].replace(/['"]/g, '') : ' ';
                    return result.split(separator);
                case 'word_count':
                    if (result.trim() === '') return 0;
                    return result.trim().split(/\s+/).length;
                case 'join':
                    if (!Array.isArray(inputData)) {
                        throw new Error(`'join' expects an Array input, got ${typeof inputData}`);
                    }
                    const joinSeparator = node.args.length > 0 ? node.args[0].replace(/['"]/g, '') : '';
                    return inputData.join(joinSeparator);
            }
        }

        if (node.name === 'map' || node.name === 'reduce') {
            if (!Array.isArray(inputData)) {
                throw new Error(`'${node.name}' expects an Array input, got ${typeof inputData}`);
            }
            const lensValue = node.args[0].replace(/^{|}$/g, '').trim(); 
            if (node.name === 'map') {
                return inputData.map(item => this.executeLensPipeline(lensValue, item));
            }
            if (node.name === 'reduce') {
                if (lensValue.trim() === '+') {
                    return inputData.reduce((acc, item) => acc + item, 0); 
                }
                if (lensValue.includes('|')) {
                     const mappedArray = inputData.map(item => this.executeLensPipeline(lensValue, item));
                     return mappedArray.reduce((acc, val) => acc + val, 0); 
                }
                return 0;
            }
        }
        
        return inputData; 
    }
    
    findPipelineId(startNodeId) {
        return startNodeId;
    }

    isPoolWriteSink(node) {
        return node.value && node.value.startsWith('to_pool');
    }

    extractPoolName(value) {
        const match = value.match(/to_pool\((\w+)\)/);
        return match ? match[1] : null;
    }

    updatePool(poolName, newValue) {
        if (this.pools[poolName]) {
            this.pools[poolName].value = newValue;
            this.pools[poolName]._updates = (this.pools[poolName]._updates || 0) + 1;
            
            // Enhanced: Maintain history
            if (this.pools[poolName].history) {
                this.pools[poolName].history.push(newValue);
                // Keep only last 10 history entries
                if (this.pools[poolName].history.length > 10) {
                    this.pools[poolName].history.shift();
                }
            }
            
            console.log(`   * Updated pool '${poolName}': ${newValue}`);

            // Trigger reactive subscriptions
            if (this.subscriptions[poolName]) {
                this.subscriptions[poolName].forEach(nodeId => {
                    const subscriptionNode = this.ast.nodes.find(n => n.id === nodeId);
                    if (subscriptionNode && subscriptionNode.type === 'POOL_READ') {
                        const connection = this.ast.connections.find(c => c.from === nodeId);
                        if (connection) {
                            const nextNode = this.ast.nodes.find(n => n.id === connection.to);
                            if (nextNode) {
                                const poolValue = this.pools[poolName].value;
                                this.runPipeline(nodeId, poolValue);
                            }
                        }
                    }
                });
            }
        } else {
            console.error(`❌ Pool '${poolName}' not found for update`);
        }
    }

    parseLiteralValue(value) {
        // Handle array literals like [1, 2, 3]
        if (value.startsWith('[') && value.endsWith(']')) {
            try {
                const arrayString = value.replace(/'/g, '"');
                return JSON.parse(arrayString);
            } catch (e) {
                throw new Error(`Invalid array format: ${e.message}`);
            }
        }
        
        // Handle object literals like {key: value}
        if (value.startsWith('{') && value.endsWith('}')) {
            try {
                return JSON.parse(value.replace(/'/g, '"'));
            } catch (e) {
                return value;
            }
        }
        
        // Standard numerical and string handling
        if (!isNaN(value) && value.trim() !== '') return parseFloat(value);
        if (value.startsWith(`'`) && value.endsWith(`'`)) return value.slice(1, -1);
        if (value.startsWith(`"`) && value.endsWith(`"`)) return value.slice(1, -1);
        
        return value;
    }

    // Enhanced: Debug methods
    enableDebug() {
        this.debugMode = true;
        console.log('🔧 Engine debug mode enabled');
    }

    disableDebug() {
        this.debugMode = false;
        console.log('🔧 Engine debug mode disabled');
    }

    // Enhanced: Get pool statistics
    getPoolStats() {
        const stats = {};
        Object.keys(this.pools).forEach(poolName => {
            const pool = this.pools[poolName];
            stats[poolName] = {
                value: pool.value,
                updates: pool._updates || 0,
                historyLength: pool.history ? pool.history.length : 0,
                type: Array.isArray(pool.value) ? 'Array' : typeof pool.value
            };
        });
        return stats;
    }
}
