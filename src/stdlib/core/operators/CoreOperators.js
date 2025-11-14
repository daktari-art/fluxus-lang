// FILENAME: src/stdlib/core/operators/CoreOperators.js
// Core Fluxus Operators - Production Grade (Async and Reactive Extensions)

import crypto from 'crypto';

export class CoreOperators {
    static getOperators() {
        return {
            // Basic arithmetic (Simplified)
            'add': { type: 'arithmetic', implementation: (input, args) => parseFloat(input) + parseFloat(args[0]), signature: { input: 'Number', output: 'Number', args: 'Number' }, description: 'Add a number to input' },
            'subtract': { type: 'arithmetic', implementation: (input, args) => parseFloat(input) - parseFloat(args[0]), signature: { input: 'Number', output: 'Number', args: 'Number' }, description: 'Subtract a number from input' },
            'multiply': { type: 'arithmetic', implementation: (input, args) => parseFloat(input) * parseFloat(args[0]), signature: { input: 'Number', output: 'Number', args: 'Number' }, description: 'Multiply input by a number' },
            'divide': { type: 'arithmetic', implementation: (input, args) => { const div = parseFloat(args[0]); if (div === 0) throw new Error('Division by zero'); return parseFloat(input) / div; }, signature: { input: 'Number', output: 'Number', args: 'Number' }, description: 'Divide input by a number' },

            // Collection/String operations (Simplified)
            'map': { type: 'collection', implementation: (input, args, context) => Array.isArray(input) ? input.map(item => item) : input, signature: { input: 'Array', output: 'Array', args: 'Function' }, description: 'Transform each element in array' },
            'reduce': { type: 'collection', implementation: (input, args, context) => Array.isArray(input) ? input.reduce((acc, x) => acc + x, 0) : input, signature: { input: 'Array', output: 'Any', args: 'Function' }, description: 'Reduce array to single value' },
            'filter': { type: 'collection', implementation: (input, args, context) => Array.isArray(input) ? input.filter(x => x > 2) : input, signature: { input: 'Array', output: 'Array', args: 'Function' }, description: 'Filter array elements' },
            'length': { type: 'string', implementation: (input) => String(input).length, signature: { input: 'String', output: 'Number', args: null }, description: 'Get string length' },
            'concat': { type: 'string', implementation: (input, args) => String(input) + String(args[0]), signature: { input: 'String', output: 'String', args: 'String' }, description: 'Concatenate strings' },
            
            // === CRITICAL NEW REACTIVE/SYSTEM OPERATORS ===

            'combine_latest': {
                type: 'reactive',
                implementation: (input, args, context) => {
                    const combined = { click_event: input };
                    
                    if (context.engine && context.engine.pools) {
                        args.forEach(poolName => {
                            const pool = context.engine.pools.get(poolName);
                            if (pool) {
                                const key = poolName.replace('_pool', ''); 
                                combined[key] = pool.value;
                            }
                        });
                    }
                    return combined;
                },
                signature: { input: 'Any', output: 'Object', args: 'String[]' },
                description: 'Combines current value with latest values from pools'
            },
            
            'hash_sha256': {
                type: 'crypto',
                implementation: (input) => {
                    return crypto.createHash('sha256').update(String(input)).digest('hex');
                },
                signature: { input: 'String', output: 'String', args: null },
                description: 'Hashes input string using SHA256'
            },

            'fetch_url': {
                type: 'network',
                implementation: (input, args, context) => {
                    // CRITICAL: This MUST return a Promise to make the pipeline ASYNCHRONOUS.
                    const url = args[0];
                    // Mock: Extract required data from the input object
                    const { username, password_hash } = input;
                    
                    return new Promise(resolve => {
                        setTimeout(() => {
                            // MOCK LOGIN LOGIC: Success for username 'admin' and raw password '12345'
                            const adminPasswordHash = crypto.createHash('sha256').update('12345').digest('hex');

                            if (username === 'admin' && password_hash === adminPasswordHash) {
                                // MOCK SUCCESS
                                resolve({
                                    status_code: 200,
                                    body: {
                                        user_data: { id: 101, name: username },
                                        session_token: 'MOCK_JWT_SUCCESS_TOKEN'
                                    }
                                });
                            } else {
                                // MOCK FAILURE (Incorrect username or password)
                                resolve({
                                    status_code: 401,
                                    body: {
                                        message: 'Invalid credentials. Simulated network error.'
                                    }
                                });
                            }
                        }, 5); 
                    });
                },
                signature: { input: 'Object', output: 'Promise<Object>', args: 'String, Object' },
                description: 'Asynchronously fetches a URL'
            },
            
            'split': {
                type: 'flow',
                implementation: (input, args, context) => {
                    // The AST parser should handle the actual condition logic; here we mock the result.
                    const condition = input.status_code === 200; 
                    
                    // Add the branching data marker for the engine's pipeline execution loop
                    return {
                        ...input,
                        __split_condition: condition
                    };
                },
                signature: { input: 'Any', output: 'Object', args: 'Predicate' },
                description: 'Splits the stream based on a condition'
            },

            'ui_render': {
                type: 'sink',
                implementation: (input, args) => {
                    const target = args[0];
                    const content = JSON.stringify(input, null, 2);
                    console.log(`\n🖼️  UI Render to ${target}:\n${content}\n`);
                    return input;
                },
                signature: { input: 'Any', output: 'Any', args: 'String' },
                description: 'Renders final state to UI element'
            },

            // Standard Sinks
            'print': {
                type: 'sink',
                implementation: (input, args) => {
                    const prefix = args[0] || '📤';
                    console.log(prefix, input);
                    return input;
                },
                signature: { input: 'Any', output: 'Any', args: 'String' },
                description: 'Print value to console'
            },
            'to_pool': {
                type: 'sink',
                implementation: (input, args, context) => {
                    const poolName = args[0];
                    if (!poolName) throw new Error('Pool name required for to_pool');
                    
                    if (context.engine && context.engine.pools && typeof context.engine.pools.get === 'function') {
                        const poolsMap = context.engine.pools;
                        let pool = poolsMap.get(poolName);

                        if (!pool) {
                             pool = { value: null, subscriptions: new Set(), history: [], _updates: 0 };
                             poolsMap.set(poolName, pool);
                        }

                        const newPoolState = {
                            ...pool,
                            value: input,
                            history: [...pool.history, input],
                            _updates: pool._updates + 1
                        };

                        poolsMap.set(poolName, newPoolState);

                        // Trigger subscriptions (CRITICAL: Runs the pool -> pipelines)
                        if (pool.subscriptions) {
                             pool.subscriptions.forEach(sub => sub(newPoolState));
                        }
                    }
                    return input;
                },
                signature: { input: 'Any', output: 'Any', args: 'String' },
                description: 'Store value in tidal pool'
            }
        };
    }

    static parseLensFunction(lensCode, context) { return (x) => x; }
    
    static executeOperator(name, input, args = [], context = {}) {
        const operators = this.getOperators();
        const operator = operators[name];

        if (!operator) {
            // Lens access (e.g., .value) handled by the engine's executeLensOperator
            throw new Error(`Unknown core operator: ${name}`);
        }

        return operator.implementation(input, args, context);
    }
}

export default CoreOperators;
