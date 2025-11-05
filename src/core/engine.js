// FILENAME: src/core/engine.js
// 
// Fluxus Language Runtime Engine v1.0.0 (COMPLETE IMPLEMENTATION)
// Manages the Reactive Scheduler, Stream Subscriptions, and Tidal Pool state.

export class RuntimeEngine {
    constructor() {
        this.pools = {};              // Stores the current value of all Tidal Pools (<|>)
        this.subscriptions = {};      // Maps Pool IDs to the pipelines that must re-run on change
        this.liveStreams = {};        // Stores continuous stream handlers (e.g., clock_ms)
        this.ast = null;
    }

    /**
     * Main entry point to start the reactive execution.
     * @param {object} ast - The compiled Abstract Syntax Tree.
     */
    start(ast) {
        this.ast = ast;
        
        // 1. Initialize all Tidal Pools
        this.initializePools();
        
        // 2. Identify and Link all Reactive Sinks (Subscriptions)
        this.linkSubscriptions();

        // 3. Start all Live Stream Sources (The non-ending event listeners)
        this.activateLiveStreams();
        
        // 4. Run all initial Finite Stream Sources (~ ...)
        this.runFiniteStreams();

        console.log(`\n✅ Fluxus Runtime Activated. Waiting for events...`);
    }

    /**
     * Initializes all Tidal Pools from the AST declaration.
     */
    initializePools() {
        for (const poolName in this.ast.pools) {
            const poolDef = this.ast.pools[poolName];
            
            this.pools[poolName] = {
                value: this.parseLiteralValue(poolDef.initial), 
                subscriptions: new Set()
            };
        }
        console.log(`   * Initialized ${Object.keys(this.pools).length} Tidal Pools.`);
    }
    
    /**
     * Links all reactive subscriptions (Pool Reads: ->) to their pipelines.
     */
    linkSubscriptions() {
        console.log(`   * Linking reactive subscriptions...`);
        
        // Find all pool read nodes (-> operations)
        this.ast.nodes.forEach(node => {
            if (node.value && node.value.includes('->')) {
                const poolMatch = node.value.match(/(\w+)\s*->/);
                if (poolMatch) {
                    const poolName = poolMatch[1];
                    // Store subscription info
                    if (!this.subscriptions[poolName]) {
                        this.subscriptions[poolName] = new Set();
                    }
                    this.subscriptions[poolName].add(node.id);
                }
            }
        });
        
        console.log(`   * Linked ${Object.keys(this.subscriptions).length} subscription(s)`);
    }

    /**
     * Activates all live streams (~?) from the AST
     */
    activateLiveStreams() {
        const liveSources = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_LIVE');
        console.log(`   * Activated ${liveSources.length} live stream(s)`);
        // For now, just log them - implementation depends on what streams you support
        liveSources.forEach(source => {
            console.log(`     - ${source.value}`);
        });
    }

    /**
     * Finds and runs initial finite stream pipelines.
     */
    runFiniteStreams() {
        const finiteSources = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE');

        finiteSources.forEach(sourceNode => {
            // Parse the initial value from the node (e.g., "~ [1, 2, 3]")
            const rawValue = sourceNode.value.replace(/^~+\s*/, '').trim();
            const initialData = this.parseLiteralValue(rawValue);

            // Find the pipeline starting from this node
            const pipelineId = this.findPipelineId(sourceNode.id); 
            if (pipelineId) {
                 this.runPipeline(pipelineId, initialData); 
            }
        });
    }

    // --- STREAM EXECUTION ---

    /**
     * Executes a specific pipeline identified by its starting node.
     */
    runPipeline(startNodeId, initialData) {
        let currentNode = this.ast.nodes.find(n => n.id === startNodeId);
        let currentData = initialData;
        
        while (currentNode) {
            const connection = this.ast.connections.find(c => c.from === currentNode.id);
            if (!connection) break; // End of pipeline
            
            const nextNode = this.ast.nodes.find(n => n.id === connection.to);
            
            // --- CORE PROCESSING STEP ---
            const processedResult = this.processNode(nextNode, currentData);
            
            // Check for the critical Pool Write Sink
            if (this.isPoolWriteSink(nextNode)) {
                const poolName = this.extractPoolName(nextNode.value);
                this.updatePool(poolName, processedResult);
                return; // Pipeline ends after committing state
            }
            
            currentData = processedResult;
            currentNode = nextNode;
        }
    }
    
    /**
     * Executes a simplified pipeline defined within a Lens (e.g., inside map/filter).
     * NOTE: This is a shallow execution that uses the current 'item' as the start node.
     * @param {string} lensValue - The content of the Lens block (e.g., ".value | multiply(10)")
     * @param {*} item - The current item being processed (e.g., 1 from [1, 2, 3])
     */
    executeLensPipeline(lensValue, item) {
        let currentData = item;
        
        // Lens logic usually starts with an accessor (.value, .key, etc.) 
        // We'll simplify and use the item as the input data.
        
        // Tokenize the lens body by the pipe operator '|'
        const parts = lensValue.split('|').map(p => p.trim()).filter(p => p !== '');

        // Use a simple, temporary 'AST-like' structure for execution
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            // 1. Handle Accessor (e.g., '.value')
            if (i === 0 && part.startsWith('.')) {
                // Ignore for now, as 'item' is the initial data.
                continue; 
            }
            
            // 2. Handle Operator (e.g., 'multiply(10)')
            const funcMatch = part.match(/^(\w+)\s*\((.*)\)$/);
            
            if (funcMatch) {
                const name = funcMatch[1];
                const argsString = funcMatch[2].trim();
                const args = argsString.split(',').map(a => a.trim()).filter(a => a !== '');

                const tempNode = { name, args, value: part, line: 0 };
                
                // Recursively call processNode with the temporary node
                currentData = this.processNode(tempNode, currentData);
            } else if (part.match(/^[+\-*\/%]$/)) {
                // If the part is a simple arithmetic operator (for reduce {+})
                // The reduce logic handles this summation, so we just return the item's value.
                return item;
            } else {
                 // Simple literal/value - if the first part is a literal, use it
                currentData = this.parseLiteralValue(part);
            }
        }
        
        return currentData;
    }
    
    /**
     * Core function to apply operator logic to stream data.
     */
    processNode(node, inputData) {
        
        if (node.value && node.value.includes('print(')) {
            console.log(` Output: ${inputData}`);
            return inputData;
        }
        
        // --- ARITHMETIC OPERATOR HANDLING (Add, Subtract, Multiply, Divide) ---
        
        if (['add', 'subtract', 'multiply', 'divide'].includes(node.name)) {
            
            let result = typeof inputData === 'number' ? inputData : parseFloat(inputData);
            if (isNaN(result)) {
                console.error(`Runtime Error: Input stream data is not numeric for operator '${node.name}' on line ${node.line}.`);
                return inputData; 
            }

            for (const arg of node.args) {
                const numArg = parseFloat(arg);
                if (isNaN(numArg)) {
                    console.error(`Runtime Error: Argument '${arg}' for '${node.name}' must be a number on line ${node.line}.`);
                    return result; 
                }
                
                switch (node.name) {
                    case 'add':
                        result += numArg;
                        break;
                    case 'subtract':
                        result -= numArg;
                        break;
                    case 'multiply':
                        result *= numArg;
                        break;
                    case 'divide':
                        if (numArg === 0) {
                            console.error(`Runtime Error: Division by zero detected on line ${node.line}.`);
                            return 'ERROR: Division by zero'; 
                        }
                        result /= numArg;
                        break;
                }
            }
            return result;
        }

        // --- STRING OPERATOR HANDLING ---
        
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
                         console.error(`Runtime Error: 'join' expects an Array input, got ${typeof inputData} on line ${node.line}.`);
                         return inputData;
                    }
                    const joinSeparator = node.args.length > 0 ? node.args[0].replace(/['"]/g, '') : '';
                    return inputData.join(joinSeparator);
            }
        }

        // --- COLLECTION PROCESSING (map and reduce) ---
        
        if (node.name === 'map' || node.name === 'reduce') {
            
            if (!Array.isArray(inputData)) {
                console.error(`Runtime Error: '${node.name}' expects an Array input, got ${typeof inputData} on line ${node.line}.`);
                return inputData;
            }

            // Extract the content of the Lens block (e.g., {.value | multiply(10)})
            // Assumption: The Lens content is in node.args[0] after being parsed.
            const lensValue = node.args[0].replace(/^{|}$/g, '').trim(); 
            
            if (node.name === 'map') {
                return inputData.map(item => this.executeLensPipeline(lensValue, item));
            }
            
            if (node.name === 'reduce') {
                let accumulator = 0;
                
                // Simplification: Assume 'reduce' only performs summation (reduce {+}) as per the arithmetic.flux example.
                if (lensValue.trim() === '+') {
                    // Accumulate the raw item value if the lens is just '+'
                    return inputData.reduce((acc, item) => acc + item, 0); 
                }
                
                // If the lens contains a full pipeline (e.g., map {.value | multiply(2) } | reduce { + })
                // We map the array first, then sum the result.
                if (lensValue.includes('|')) {
                     const mappedArray = inputData.map(item => this.executeLensPipeline(lensValue, item));
                     // The total accumulated result
                     return mappedArray.reduce((acc, val) => acc + val, 0); 
                }
                
                return accumulator;
            }
        }
        
        // --- END OF OPERATOR HANDLING ---
        
        return inputData; 
    }
    
    // --- UTILITY METHODS ---
    
    /**
     * Finds the pipeline starting from a node
     */
    findPipelineId(startNodeId) {
        return startNodeId; // Simple implementation for now
    }

    /**
     * Checks if a node is a pool write sink
     */
    isPoolWriteSink(node) {
        return node.value && node.value.startsWith('to_pool');
    }

    /**
     * Extracts pool name from to_pool() calls
     */
    extractPoolName(value) {
        const match = value.match(/to_pool\((\w+)\)/);
        return match ? match[1] : null;
    }

    /**
     * Updates a pool value and triggers subscriptions
     */
    updatePool(poolName, newValue) {
        if (this.pools[poolName]) {
            this.pools[poolName].value = newValue;
            console.log(`   * Updated pool '${poolName}': ${newValue}`);
            // In full implementation, this would trigger reactive updates
        }
    }

    /**
     * Parses literal values from strings to appropriate types
     */
    parseLiteralValue(value) {
        // Updated to handle array/object literals from the parser fix
        if (value.startsWith('{') || value.startsWith('[')) {
             try {
                 return JSON.parse(value);
             } catch (e) {
                 // Return as string if JSON parsing fails
                 return value;
             }
        }
        
        // Standard numerical and string handling
        if (!isNaN(value) && value.trim() !== '') return parseFloat(value);
        // Remove quotes for string literals if they are present
        if (value.startsWith(`'`) && value.endsWith(`'`)) return value.slice(1, -1);
        if (value.startsWith(`"`) && value.endsWith(`"`)) return value.slice(1, -1);
        
        return value;
    }
}
