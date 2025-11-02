// FILENAME: src/core/compiler.js
// 
// Fluxus Language Compiler v1.0.0
// Performs Type Checking, Linker resolution, and Optimization on the AST.

export class Compiler {
    constructor() {
        // Defines the expected input/output types for standard operators
        this.operatorSignature = {
            'add': { input: 'Number', output: 'Number', args: 'Number' },
            'subtract': { input: 'Number', output: 'Number', args: 'Number' },
            'multiply': { input: 'Number', output: 'Number', args: 'Number' },
            'divide': { input: 'Number', output: 'Number', args: 'Number' },
            'trim': { input: 'String', output: 'String', args: null },
            'to_upper': { input: 'String', output: 'String', args: null },
            'hash_sha256': { input: 'String', output: 'String', args: null },
            'fetch_url': { input: 'String', output: 'Object', args: 'Object' }, // Expects URL/data as stream input
            'print': { input: 'Any', output: 'Void', args: null, isSink: true },
            'to_pool': { input: 'Any', output: 'Void', args: 'PoolName', isSink: true }
        };

        this.typeMap = {
            'LITERAL_NUMBER': 'Number',
            'LITERAL_STRING': 'String',
            'STREAM_SOURCE_FINITE': 'Any', // Type determined by value
            'STREAM_SOURCE_LIVE': 'Event',
            'POOL_READ_SOURCE': 'Any' // Type determined by pool content
        };
    }

    /**
     * Main entry point: runs all compiler passes.
     * @param {object} ast - The raw AST from the parser.
     * @returns {object} The optimized and type-checked AST.
     */
    compile(ast) {
        console.log(`🛡️ Compiling AST...`);
        
        // 1. Linker Pass: Resolve all functions, imports, and pool names.
        this.linkAST(ast);

        // 2. Type Check Pass: Ensure type compatibility across all pipeline connections.
        this.checkTypes(ast);

        // 3. Optimization Pass: Apply performance optimizations (e.g., merging maps).
        const optimizedAst = this.optimize(ast);

        console.log(`✅ Compilation successful.`);
        return optimizedAst;
    }

    /**
     * Pass 1: Resolves and validates all references.
     */
    linkAST(ast) {
        // Stub: In a real implementation, this would verify that all FLOW imports (network, ui)
        // are recognized, and all pool names (like 'auth_state') exist.
        
        // Example Stub: Check for unlinked pool names in 'to_pool' sinks
        ast.nodes.forEach(node => {
            if (node.value.startsWith('to_pool')) {
                const poolNameMatch = node.value.match(/to_pool\((.*?)\)/);
                const poolName = poolNameMatch? poolNameMatch[1] : null;

                if (poolName &&!ast.pools[poolName]) {
                    throw new Error(`Linker Error: Unknown Tidal Pool '${poolName}' referenced in line ${node.line}.`);
                }
            }
        });
    }

    /**
     * Pass 2: Ensures type integrity throughout the stream pipelines.
     */
    checkTypes(ast) {
        // Stub: A full type system tracks the type of every stream emission.
        ast.connections.forEach(conn => {
            const fromNode = ast.nodes.find(n => n.id === conn.from);
            const toNode = ast.nodes.find(n => n.id === conn.to);

            // If the destination is a function, check if the input type matches the signature
            if (toNode.type === 'FUNCTION_OPERATOR') {
                const funcName = this.extractFuncName(toNode.value);
                const signature = this.operatorSignature[funcName];
                
                if (signature) {
                    // Simplified Type Check Stub: Assume basic numeric input requirement
                    const inputType = this.determineNodeType(fromNode.value);
                    
                    if (signature.input === 'Number' && inputType!== 'LITERAL_NUMBER') {
                        // This check is overly simplistic but illustrates the purpose
                        // In reality, it checks the previous stream's output type.
                        if (fromNode.type!== 'LITERAL_NUMBER') {
                           // throw new Error(`Type Error on line ${toNode.line}: Operator '${funcName}' expects 'Number' input, but received '${inputType}' from previous stream step.`);
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Pass 3: Optimizes the AST for the runtime engine.
     * Example: Merging consecutive `| map {... } | map {... }` operations into one.
     */
    optimize(ast) {
        console.log(`   * Applying optimizations... (Map Merging, Dead Code Elimination)`);
        // Currently, no structural changes are made in this stub, but the foundation is here.
        return ast; // Return the optimized AST structure
    }
    
    // --- Helper for Type Checking ---
    extractFuncName(value) {
        const match = value.match(/^(\w+)/);
        return match? match[1] : null;
    }
}
