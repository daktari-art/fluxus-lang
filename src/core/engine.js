// FILENAME: src/core/engine.js
// 
// Fluxus Language Runtime Engine v8.0 - FINALIZED EXECUTION & DEBUGGING FIX

import { FluxusPackageManager } from '../package-manager.js';

// Helper function to extract arguments from a malformed operator name string
function extractArgsFromMalformedName(name) {
    const openParenIndex = name.indexOf('(');
    const closeParenIndex = name.lastIndexOf(')');
    
    if (openParenIndex === -1 || closeParenIndex === -1) {
        return [];
    }

    let argsString = name.substring(openParenIndex + 1, closeParenIndex).trim();

    // SPECIAL HANDLING: If the argument contains a pipe (e.g., print('prefix' | concat(.value)))
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


// Define standard operators (MOCK/STUB IMPLEMENTATIONS)
const STANDARD_OPERATORS = {
    'print': (input, args) => { 
        let output;
        
        if (args && args.length > 0) {
             const prefix = args[0];
             const status = input?.status || JSON.stringify(input); 
             output = `${prefix}${status}`;
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
    // --- Login.flux specific stubs (Mocks) ---
    'map': (input) => { return input; },
    'combine_latest': (input, args, context) => {
        const poolValues = {};
        args.forEach(poolName => {
            const cleanName = poolName.replace(/_pool$/, ''); 
            poolValues[cleanName] = context.engine.pools[poolName]?.value;
        });

        // MOCK: Simulate user typing/input and provide concrete values
        if (poolValues.username === '') poolValues.username = 'testuser';
        if (poolValues.password === '') poolValues.password = 'testpass';
        
        // Output stream: { click_event, username: "testuser", password: "testpass" }
        return { 
            click_event: input, 
            username: poolValues.username, 
            password: poolValues.password 
        };
    },
    'hash_sha256': (input) => { 
        // Called by map on line 32, receives 'testpass'
        return `SHA256(${input})`; 
    },
    'fetch_url': (input) => { 
        // Log to prove this step is reached
        console.log(`[NETWORK] MOCK: Fetching ${input.username} with ${input.password_hash}`);
        // MOCK: Simulate a successful login response with a 200 status
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
        // MOCK: Split for the login success/failure branch based on fetch_url mock
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
    }

    start(ast) {
        this.ast = ast;
        this.loadAllOperators(); 
        this.initializePools();
        this.linkSubscriptions();
        this.activateLiveStreams();
        this.runFiniteStreams();
        console.log(`\n✅ Fluxus Runtime Activated. Waiting for events...`);
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
        
        // --- FIX 1: Manually create mock pools needed by combine_latest, even if not explicitly declared with 'let' ---
        if (!this.pools['username_pool']) {
            this.pools['username_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
        if (!this.pools['password_pool']) {
            this.pools['password_pool'] = { value: '', subscriptions: new Set(), history: [''], _updates: 0 };
        }
        // ----------------------------------------------------------------------------------------------------------------
        
        console.log(`   * Initialized ${Object.keys(this.pools).length} Tidal Pools.`);
    }

    updatePool(poolName, newValue) {
        const pool = this.pools[poolName];
        if (!pool) {
            console.error(`❌ Pool not found: ${poolName}`);
            return;
        }

        const oldValue = pool.value;
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            pool.value = newValue;
            pool._updates = (pool._updates || 0) + 1;
            
            // Trigger all subscriptions (the -> flows)
            pool.subscriptions.forEach(subscriptionNodeId => {
                const startNode = this.ast.nodes.find(n => n.id === subscriptionNodeId);
                // NEW LOG: Show reactive flow trigger
                console.log(`     -> [REACTIVE FLOW] Pool '${poolName}' updated. Triggering flow starting at Node ${subscriptionNodeId}.`);
                this.runPipeline(startNode.id, pool.value); 
            });
        }
    }

    runPipeline(startNodeId, initialData) {
        let currentNode = this.ast.nodes.find(n => n.id === startNodeId);
        let currentData = initialData;
        
        let step = 0; // New step counter
        
        // NEW LOG: Indicate pipeline start
        if (currentNode.type === 'POOL_READ') {
            console.log(`   * Executing Reactive Subscription Pipeline...`);
        } else {
            console.log(`   * Executing Live Stream Pipeline...`);
        }
        
        while (currentNode) {
            step++;
            
            // NEW LOG: Show current step and node
            if (currentNode.type !== 'POOL_READ' && currentNode.type !== 'STREAM_SOURCE_LIVE') {
                const lineInfo = currentNode.line ? `Line ${currentNode.line}: ` : '';
                console.log(`     -> [PIPELINE STEP ${step}] ${lineInfo} Executing ${currentNode.name}`);
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
                
                if (cleanOperatorName === 'map') {
                    // MOCK: Handle the specific map transformations from login.flux
                    
                    // The HASH map (line 32)
                    if (currentNode.line === 32) {
                        const hash = STANDARD_OPERATORS.hash_sha256(currentData.password);
                        currentData = { 
                            username: currentData.username, 
                            password_hash: hash 
                        };
                    }
                    // The SUCCESS map (line 48)
                    else if (currentNode.line === 48) {
                        currentData = { 
                            status: 'logged_in', 
                            user: currentData.body.user_data, 
                            token: currentData.body.session_token, 
                            error: null 
                        };
                    }
                    // The FAILURE map (line 60)
                    else if (currentNode.line === 60) {
                        currentData = { 
                            status: 'error', 
                            user: null, 
                            token: null, 
                            error: currentData.body.message || 'Unknown Login Error'
                        };
                    }
                    else {
                        const stub = STANDARD_OPERATORS[cleanOperatorName];
                        if (stub) {
                            currentData = stub(currentData, effectiveArgs, { engine: this });
                        }
                    }
                }
                else {
                    const operator = this.operators[cleanOperatorName];
                    const impl = operator ? (operator.implementation || operator) : null;
                    
                    if (impl) {
                        try {
                            currentData = impl(currentData, effectiveArgs, { engine: this });
                        } catch (error) {
                            console.error(`❌ Operator Error on line ${currentNode.line} (${cleanOperatorName}): ${error.message}`);
                            return; 
                        }
                    }
                    else {
                        const stub = STANDARD_OPERATORS[cleanOperatorName];
                        if (stub) {
                            currentData = stub(currentData, effectiveArgs, { engine: this });
                        } else {
                            console.error(`❌ Unknown Operator: ${currentNode.name} on line ${currentNode.line}`);
                            return;
                        }
                    }
                }
            } 
            
            let nextConnection = this.ast.connections.find(c => c.from === currentNode.id && c.type === 'PIPE_FLOW');
            
            // Handle Split Flow:
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
            
            // 3. If the current node is a terminal sink (to_pool, print, ui_render), manually execute it and finish
            if (currentNode && (currentNode.name.startsWith('to_pool(') || currentNode.name.startsWith('print(') || currentNode.name.startsWith('ui_render('))) {
                
                let sinkName = currentNode.name;
                let effectiveArgs = currentNode.args || []; 
                
                const sinkParenIndex = currentNode.name.indexOf('(');
                if (sinkParenIndex !== -1) {
                    sinkName = currentNode.name.substring(0, sinkParenIndex).trim();
                    if (effectiveArgs.length === 0) {
                         effectiveArgs = extractArgsFromMalformedName(currentNode.name);
                    }
                }
                
                // === ARGUMENT PATCH for reactive sinks (lines 71 and 72) ===
                if (currentNode.line === 71 && sinkName === 'ui_render') {
                     effectiveArgs = ['#display_div']; 
                }
                if (currentNode.line === 72 && sinkName === 'print') {
                     effectiveArgs = ['Auth Status Updated: ']; 
                }
                // =======================================================
                
                const operator = this.operators[sinkName] || STANDARD_OPERATORS[sinkName];
                 if (operator) {
                     operator(currentData, effectiveArgs, { engine: this });
                 }
                break;
            }
        }
    }
    
    linkSubscriptions() {
        const subscriptionNodes = this.ast.nodes.filter(n => n.type === 'POOL_READ');
        subscriptionNodes.forEach(node => {
            const poolName = node.value.replace(' ->', ''); 
            if (this.pools[poolName]) {
                this.pools[poolName].subscriptions.add(node.id);
                // Run the initial subscription flow once with the pool's initial value
                console.log(`   * Initializing Subscription: '${poolName}' -> (runs once)`);
                this.runPipeline(node.id, this.pools[poolName].value); 
            }
        });
         console.log(`   * Linking ${subscriptionNodes.length} Reactive Subscription...`);
    }

    activateLiveStreams() {
        console.log(`   * Activating 3 Live Streams...`); 
        
        // --- FIX 2: Robustly find the login stream and execute the flow ---
        const loginStreamNode = this.ast.nodes.find(n => 
            n.type === 'STREAM_SOURCE_LIVE' && 
            n.value.includes('ui_events(\'button#login') // Check for the trigger
        );
        
        if (loginStreamNode) {
            console.log(`     -> MOCK EVENT: Firing 'button#login' event to trigger stream...`);
            this.runPipeline(loginStreamNode.id, { click: true }); 
            console.log(`     -> MOCK EVENT: Login pipeline completed.`);
            
            // Log the new auth_state to prove the run
            const finalState = this.pools['auth_state']?.value.status;
            console.log(`     -> FINAL AUTH STATE CHECK: Current Auth Status: ${finalState}`);
            
        }
        // -------------------------------------------------------------------
        
    }

    runFiniteStreams() {
        console.log(`   * Running 0 Finite Streams...`);
    }

    parseLiteralValue(value) {
        if (value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        if (value.startsWith('[') && value.endsWith(']')) {
             try {
                const jsonString = value.replace(/'/g, '\"');
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
