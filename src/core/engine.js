// FILENAME: src/core/engine.js
// 
// Fluxus Language Runtime Engine v1.0.0
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
        
        console.log(`\n✅ Fluxus Runtime Activated. Waiting for events...`);
    }

    /**
     * Initializes all Tidal Pools from the AST declaration and runs initial subscriptions.
     */
    initializePools() {
        for (const poolName in this.ast.pools) {
            const poolDef = this.ast.pools[poolName];
            
            // NOTE: In a complete implementation, initialValue parsing (e.g., "500", "{a: 1}") would occur here.
            this.pools[poolName] = {
                value: this.parseLiteralValue(poolDef.initial), 
                subscriptions: new Set()
            };
        }
        console.log(`   * Initialized ${Object.keys(this.pools).length} Tidal Pools.`);
    }
    
    /**
     * Finds pipelines that start with a Pool Read (e.g., auth_state -> print()) 
     * and links them to the pool's subscription list.
     */
    linkSubscriptions() {
        const reactiveSinks = this.ast.nodes.filter(n => n.type === 'POOL_READ_SOURCE');
        
        reactiveSinks.forEach(sourceNode => {
            const poolName = sourceNode.value; // The name of the pool being read
            
            if (this.pools[poolName]) {
                // Get the ID of the pipeline starting at this node
                const pipelineId = this.findPipelineId(sourceNode.id); 
                
                // Add the entire pipeline as a subscription to the pool
                this.pools[poolName].subscriptions.add(pipelineId);
                
                // Run the subscription once on startup (initial display/log)
                this.runPipeline(pipelineId, this.pools[poolName].value); 
            }
        });
        console.log(`   * Initialized ${reactiveSinks.length} reactive sinks.`);
    }
    
    /**
     * Starts continuous listening loops (e.g., button clicks, clock ticks).
     */
    activateLiveStreams() {
        const liveSources = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_LIVE');
        
        liveSources.forEach(sourceNode => {
            // Placeholder: This is where external event handlers (UI, timer) would be hooked up.
            // When an event fires, it calls this.triggerPipeline(pipelineId, eventData).
            console.log(`   * Hooked up live stream: ${sourceNode.value}`);
        });
    }

    /**
     * Executes a specific pipeline identified by its starting node.
     * This method simulates stream processing through the pipes.
     * @param {string} startNodeId - The ID of the node initiating the flow.
     * @param {*} initialData - The data that starts the stream (e.g., the pool's new value).
     */
    runPipeline(startNodeId, initialData) {
        let currentNode = this.ast.nodes.find(n => n.id === startNodeId);
        let currentData = initialData;
        
        // Simple sequential flow simulation:
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
     * Updates a Tidal Pool and triggers all subscribed pipelines.
     * @param {string} poolName - Name of the pool to update.
     * @param {*} newValue - The new value to commit.
     */
    updatePool(poolName, newValue) {
        if (!this.pools[poolName]) {
            console.error(`Runtime Error: Attempted to update unknown pool '${poolName}'.`);
            return;
        }
        
        // Check if the value actually changed (optimization)
        if (this.pools[poolName].value === newValue) return;
        
        this.pools[poolName].value = newValue;
        console.log(`   '${poolName}' updated to: ${newValue}`);
        
        // --- REACTIVITY TRIGGER ---
        // Reruns all pipelines subscribed to this pool
        this.pools[poolName].subscriptions.forEach(pipelineId => {
            // The pipeline reruns using the *new* committed value
            this.runPipeline(pipelineId, newValue); 
        });
    }
    
    // --- UTILITIES (Stubbed for core logic) ---

    processNode(node, inputData) {
        // Placeholder for applying the operator logic (map, filter, add, fetch_url, print)
        if (node.value.includes('print(')) {
            console.log(` Output: ${inputData}`);
            return inputData;
        }
        
        // FIX: Implement N-ary Subtraction Logic (as per test-run.js specification)
        // Checks the 'name' and 'args' fields that were added in the parser.
        if (node.name === 'subtract' && node.args && node.args.length > 0) {
            let result = inputData;
            for (const arg of node.args) {
                // Convert argument to a number for calculation
                const numArg = parseFloat(arg);
                if (isNaN(numArg)) {
                    console.error(`Runtime Error: 'subtract' argument must be a number, got '${arg}'.`);
                    return inputData; 
                }
                result -= numArg;
            }
            return result;
        }

        // Existing add(1) stub: needs to be more robust, but kept for minimal change
        if (node.value.includes('add(1)')) {
             // Simulates the calculation for the counter example
             return inputData + 1;
        }
        
        return inputData; 
    }
    
    isPoolWriteSink(node) {
        return node.value.startsWith('to_pool');
    }

    extractPoolName(value) {
        const match = value.match(/to_pool\((.*?)\)/);
        return match? match[1] : null;
    }

    findPipelineId(startNodeId) {
        // In a complex graph, a pipeline ID would track the entire flow path.
        // For simplicity, we use the start node ID as the pipeline ID.
        return startNodeId; 
    }
    
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
