// FILENAME: src/core/engine.js
// Fluxus Language Runtime Engine v13.8 - ASYNC FLOW FIX

import { FluxusPackageManager } from '../package-manager.js';
import { FluxusLibraryLoader } from '../lib/hybrid-loader.js';
import { OperatorsRegistry } from '../stdlib/core/operators/index.js'; 
import { EventEmitter } from 'events';

export class RuntimeEngine extends EventEmitter {
    constructor(userConfig = {}) {
        super();
        this.config = {
            maxExecutionSteps: 10000,
            enableMetrics: true,
            logLevel: 'INFO',
            quietMode: false,
            ...userConfig
        };
        // Core state management
        this.pools = new Map();
        this.activeStreams = new Set(); 
        this.ast = null;
        this.replMode = userConfig.replMode || false;

        // Enhanced systems
        this.operatorsRegistry = new OperatorsRegistry();
        this.operators = new Map(); 
        this.packageManager = new FluxusPackageManager();
        this.libraryLoader = new FluxusLibraryLoader(this);
        this.loadedLibraries = new Set();
        this.metrics = {
            startTime: Date.now(),
            operatorCalls: 0,
            pipelineExecutions: 0,
            valuesProcessed: 0,
            errors: 0,
            warnings: 0
        };

        this.initializeCoreOperators();

        if (!this.config.quietMode) {
            console.log('🚀 Fluxus Enterprise Engine Initialized');
            if (this.config.enableMetrics) {
                console.log('   📊 Metrics enabled');
            }
        }
    }

    // ==================== OPERATOR MANAGEMENT ====================

    initializeCoreOperators() {
        const allOperators = this.operatorsRegistry.getAllOperators();
        for (const [name, opDef] of Object.entries(allOperators)) {
            this.operators.set(name, this.createOperatorWrapper(name, opDef));
        }
    }

    createOperatorWrapper(name, operatorDef) {
        return (input, args = [], context = {}) => {
            this.metrics.operatorCalls++;
            this.metrics.valuesProcessed++;

            try {
                const enhancedContext = { engine: this, ...context };
                const libraryName = typeof operatorDef.library === 'string' ? operatorDef.library : 'core';

                // CRITICAL FIX: Corrected positional arguments
                const result = this.operatorsRegistry.executeOperator(
                    name,
                    input,
                    args,
                    enhancedContext, 
                    libraryName      
                );

                return result;

            } catch (error) {
                this.metrics.errors++;
                if (!this.config.quietMode) {
                    console.error(`❌ Operator '${name}' failed: ${error.message}`);
                }
                throw error;
            }
        };
    }
    
    // ==================== EXECUTION ENGINE (ASYNC) ====================

    async start(ast) {
        this.ast = ast;
        // Reset metrics for this execution
        this.metrics = { startTime: Date.now(), operatorCalls: 0, pipelineExecutions: 0, valuesProcessed: 0, errors: 0, warnings: 0 };
        try {
            if (!this.config.quietMode && !this.replMode) {
                console.log('🚀 Executing Fluxus Program...');
            }

            // 1. Load imports
            await this.loadImports();

            // 2. Initialize pools
            this.initializePools();

            // 3. Execute finite streams (runs immediately and collects promises)
            const finiteStreamPromises = this.runFiniteStreams(); // <-- NO AWAIT HERE

            // 4. Initialize and execute REACTIVE streams (the login flow)
            await this.executeInitialReactiveFlows(); 

            // 5. Initialize pool subscription sinks (pool ->)
            this.runPoolSubscriptions();
            
            // CRITICAL FIX: AWAIT ALL FIRE-AND-FORGET STREAMS HERE
            await Promise.all(finiteStreamPromises); 
            // ------------------------------------------------------------------
            
            const executionTime = Date.now() - this.metrics.startTime;

            if (!this.config.quietMode && !this.replMode) {
                // If there are errors in the async flow, report failure
                if (this.metrics.errors > 0) {
                     console.log('❌ Program completed with errors');
                } else {
                     console.log('✅ Program completed successfully');
                }

                if (this.config.enableMetrics) {
                    const successRate = this.metrics.operatorCalls > 0 ? ((this.metrics.operatorCalls - this.metrics.errors) / this.metrics.operatorCalls * 100) : 100;
                    console.log('   📊 Performance:', {
                        uptime: `${executionTime}ms`,
                        operatorCalls: this.metrics.operatorCalls,
                        pipelineExecutions: this.metrics.pipelineExecutions,
                        valuesProcessed: this.metrics.valuesProcessed,
                        errors: this.metrics.errors,
                        warnings: this.metrics.warnings,
                        opsPerSecond: (this.metrics.operatorCalls / (executionTime / 1000)).toFixed(1),
                        successRate: `${successRate.toFixed(1)}%`
                    });
                }
            }

        } catch (error) {
            this.metrics.errors++;
            if (!this.config.quietMode) {
                console.error('❌ Program execution failed:', error.message);
            }
            throw error;
        } finally {
            // Ensure shutdown is called after execution attempt
            if (!this.replMode) {
                await this.shutdown();
            }
        }
    }

    async loadImports() {
        if (!this.ast?.imports) return;
        for (const importName of this.ast.imports) {
            if (['ui', 'network', 'crypto'].includes(importName)) {
                 this.loadedLibraries.add(importName);
            } else {
                 // Mock library loading 
                 this.loadedLibraries.add(importName);
            }
        }
    }

    initializePools() {
        if (!this.ast?.pools) return;
        Object.entries(this.ast.pools).forEach(([poolName, poolDef]) => {
            const initialValue = this.parseLiteralValue(poolDef.initial);
            this.pools.set(poolName, {
                value: initialValue,
                subscriptions: new Set(),
                history: [initialValue],
                _updates: 0
            });
        });
    }

    runFiniteStreams() {
        if (!this.ast?.nodes) return []; // Return empty array if no AST or nodes
        const finiteStreams = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE');
        
        const streamPromises = finiteStreams.map(async streamNode => {
            try {
                this.metrics.pipelineExecutions++;
                const initialData = this.parseLiteralValue(streamNode.value);
                await this.executePipelineFromNode(streamNode, initialData);
            } catch (error) {
                this.metrics.errors++;
                if (!this.config.quietMode) {
                    console.error(`❌ Finite stream execution failed: ${error.message}`);
                }
                // Return a resolved promise on error so Promise.all can complete
                return null; 
            }
        });
        
        return streamPromises; // Return the array of promises
    }

    async executeInitialReactiveFlows() {
        if (!this.ast?.nodes) return;

        const reactiveStreams = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_REACTIVE');
        const valueStreamPromises = [];
        let clickStreamNode = null;
        let mockClickEvent = null;

        for (const streamNode of reactiveStreams) {
             const sourceName = this.cleanOperatorName(streamNode.name);
             const args = streamNode.args ? streamNode.args.map(arg => this.parseLiteralValue(arg)) : [];

             if (sourceName === 'ui_events') {
                const eventType = args.length > 1 ? this.parseLiteralValue(args[1]) : null;
                
                if (eventType === 'value') {
                    const elementId = args[0];
                    let mockEventPayload = null;
                    if (elementId === 'input#username') mockEventPayload = 'admin';
                    if (elementId === 'input#password') mockEventPayload = '12345';
                    
                    const connection = this.ast.connections.find(c => c.from === streamNode.id);
                    if (connection) {
                        const downstreamNode = this.ast.nodes.find(n => n.id === connection.to);
                        if (downstreamNode) {
                            this.metrics.pipelineExecutions++;
                            valueStreamPromises.push(this.executePipelineFromNode(downstreamNode, mockEventPayload));
                        }
                    }
                } else if (eventType === 'click') {
                     clickStreamNode = streamNode;
                     mockClickEvent = { source: args[0], event: eventType };
                     this.activeStreams.add(streamNode.id);
                }
             }
        }
        
        // Wait for input streams (to_pool) to complete 
        await Promise.all(valueStreamPromises);

        // Trigger the main login click flow
        if (clickStreamNode) {
            const connection = this.ast.connections.find(c => c.from === clickStreamNode.id);
            if (connection) {
                const downstreamNode = this.ast.nodes.find(n => n.id === connection.to);
                if (downstreamNode) {
                    this.metrics.pipelineExecutions++;
                    await this.executePipelineFromNode(downstreamNode, mockClickEvent);
                }
            }
        }
    }


    runPoolSubscriptions() {
        if (!this.ast?.nodes) return;
        const subscriptions = this.ast.nodes.filter(n => n.type === 'POOL_SUBSCRIPTION');

        subscriptions.forEach(subNode => {
            try {
                const poolName = subNode.poolName;
                const pool = this.pools.get(poolName);
                if (!pool) return;

                const subscriber = async (newPoolState) => {
                    const connection = this.ast.connections.find(c => c.from === subNode.id);
                    if (connection) {
                        const downstreamNode = this.ast.nodes.find(n => n.id === connection.to);
                        if (downstreamNode) {
                            this.metrics.pipelineExecutions++;
                            await this.executePipelineFromNode(downstreamNode, newPoolState.value); 
                        }
                    }
                };
                
                pool.subscriptions.add(subscriber);
                subscriber(pool); // Execute once immediately with the initial state
                
            } catch (error) {
                this.metrics.errors++;
                if (!this.config.quietMode) {
                    console.error(`❌ Pool subscription initialization failed: ${error.message}`);
                }
            }
        });
    }


    // ==================== ASYNC PIPELINE EXECUTION ====================

    async executePipelineFromNode(startNode, initialData) {
        let currentNode = startNode;
        let currentData = initialData;
        let stepCount = 0;
        let inBranch = null; 

        while (currentNode && stepCount < this.config.maxExecutionSteps) {
            stepCount++;
            
            // 1. Handle Branching Nodes (TRUE_FLOW / FALSE_FLOW)
            if (currentNode.type === 'TRUE_FLOW' || currentNode.type === 'FALSE_FLOW') {
                if (currentData.__split_condition !== undefined) {
                    const expectedCondition = currentNode.type === 'TRUE_FLOW';
                    const actualCondition = currentData.__split_condition;
                    
                    if (actualCondition !== expectedCondition) {
                        currentNode = this.findEndOfBranch(currentNode.id);
                        continue; 
                    }
                    delete currentData.__split_condition; 
                    inBranch = currentNode.type;
                } else if (inBranch !== currentNode.type) {
                     currentNode = this.findEndOfBranch(currentNode.id);
                     continue;
                }
            }
            
            // 2. Execute the current node (MUST AWAIT for async operators)
            currentData = await this.executeNode(currentNode, currentData); 

            // 3. Find next node
            if (this.isTerminalNode(currentNode)) break;

            const nextConnection = this.ast.connections.find(c => c.from === currentNode.id && c.type === 'PIPE_FLOW');
            if (!nextConnection) break;

            currentNode = this.ast.nodes.find(n => n.id === nextConnection.to);
            if (!currentNode) break;
        }

        return currentData;
    }
                                                                    
    async executeNode(node, inputData) {
        switch (node.type) {
            case 'STREAM_SOURCE_FINITE':
            case 'POOL_SOURCE':
            case 'STREAM_SOURCE_REACTIVE': 
            case 'TRUE_FLOW':
            case 'FALSE_FLOW':
                return inputData;                               
            case 'FUNCTION_OPERATOR':
                return await this.executeFunctionOperator(node, inputData);                                                           
            case 'LENS_OPERATOR':                                               
                return this.executeLensOperator(node, inputData);
            default:
                return inputData;
        }
    }

    async executeFunctionOperator(node, inputData) {
        const operatorName = this.cleanOperatorName(node.name);
        const args = node.args ? node.args.map(arg => this.parseLiteralValue(arg)) : [];

        const operatorWrapper = this.operators.get(operatorName);              
        if (!operatorWrapper) {
            throw new Error(`Unknown operator: ${operatorName}`);
        }

        // Await the result, which might be a Promise from an async operator (like fetch_url)
        return await operatorWrapper(inputData, args, { engine: this }); 
    }

    executeLensOperator(node, inputData) {
        // Correctly handle property access: .value, .status_code, etc.
        const property = this.cleanOperatorName(node.name).slice(1);
        if (typeof inputData === 'object' && inputData !== null && property in inputData) {
            return inputData[property];
        }
        return inputData;
    }                                                           
    
    // ==================== UTILITY METHODS (ESSENTIALS) ====================

    findEndOfBranch(startNodeId) {
        let currentId = startNodeId;
        while (true) {
            // CRITICAL CHECK: Ensure AST is not null before accessing connections
            if (!this.ast || !this.ast.connections) return null; 

            const nextConnection = this.ast.connections.find(c => c.from === currentId && c.type === 'PIPE_FLOW');
            if (!nextConnection) return null; 
            
            const nextNode = this.ast.nodes.find(n => n.id === nextConnection.to);
            if (!nextNode || (nextNode.type !== 'FUNCTION_OPERATOR' && nextNode.type !== 'LENS_OPERATOR' && nextNode.type !== 'STREAM_SOURCE_FINITE')) {
                 return nextNode;
            }
            currentId = nextNode.id;
        }
    }
    
    parseLiteralValue(value) {
        if (value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(value) && value.trim() !== '') return parseFloat(value);
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
            return value.slice(1, -1);
        }
        return value;
    }

    cleanOperatorName(nodeName) {
        const openParen = nodeName.indexOf('(');
        if (openParen !== -1) {
            return nodeName.substring(0, openParen).trim();
        }
        return nodeName.trim();
    }

    isTerminalNode(node) {
        const terminalOperators = ['print', 'to_pool', 'ui_render'];
        const operatorName = this.cleanOperatorName(node.name);
        return terminalOperators.includes(operatorName) || node.isTerminal;
    }
    
    // ==================== GRACEFUL SHUTDOWN ====================

    async shutdown() {
        this.pools.clear();
        this.operators.clear();
        this.loadedLibraries.clear();
        this.ast = null; // Cleared only when all execution is finished

        if (!this.config.quietMode) {
            console.log('🛑 Engine shutdown complete');
        }
    }
}
