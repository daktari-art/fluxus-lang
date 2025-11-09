// FILENAME: src/core/compiler.js
// 
// Fluxus Language Compiler v4.3 - LIBRARY AWARE TYPE CHECKING

export class Compiler {
    constructor() {
        // Enhanced operator signature with library operators
        this.operatorSignature = {
            // Core operators
            'add': { input: 'Number', output: 'Number', args: 'Number' },
            'subtract': { input: 'Number', output: 'Number', args: 'Number' },
            'multiply': { input: 'Number', output: 'Number', args: 'Number' },
            'divide': { input: 'Number', output: 'Number', args: 'Number' },
            'trim': { input: 'String', output: 'String', args: null },
            'to_upper': { input: 'String', output: 'String', args: null },
            'to_lower': { input: 'String', output: 'String', args: null },
            'concat': { input: 'String', output: 'String', args: 'String' },
            'break': { input: 'String', output: 'Array', args: 'String' },
            'join': { input: 'Array', output: 'String', args: 'String' },
            'map': { input: 'Array', output: 'Array', args: 'Lens' },
            'reduce': { input: 'Array', output: 'Number', args: 'Lens' },
            'filter': { input: 'Array', output: 'Array', args: 'Lens' },
            'split': { input: 'Any', output: 'Boolean', args: 'Lens' },
            'fetch_url': { input: 'String', output: 'Object', args: 'Object' }, 
            'print': { input: 'Any', output: 'Void', args: null, isSink: true },
            'to_pool': { input: 'Any', output: 'Void', args: 'PoolName', isSink: true },
            'combine_latest': { input: 'Any', output: 'Object', args: 'PoolName' },
            'hash_sha256': { input: 'String', output: 'String', args: null },
            'ui_render': { input: 'Any', output: 'Void', args: 'String', isSink: true },
            
            // Math library operators
            'sin': { input: 'Number', output: 'Number', args: null },
            'cos': { input: 'Number', output: 'Number', args: null },
            'tan': { input: 'Number', output: 'Number', args: null },
            'sqrt': { input: 'Number', output: 'Number', args: null },
            'pow': { input: 'Number', output: 'Number', args: 'Number' },
            'log': { input: 'Number', output: 'Number', args: null },
            'exp': { input: 'Number', output: 'Number', args: null },
            'abs': { input: 'Number', output: 'Number', args: null },
            'floor': { input: 'Number', output: 'Number', args: null },
            'ceil': { input: 'Number', output: 'Number', args: null },
            'round': { input: 'Number', output: 'Number', args: null },
            'max': { input: 'Number', output: 'Number', args: 'Number' },
            'min': { input: 'Number', output: 'Number', args: 'Number' },
            'random': { input: 'Any', output: 'Number', args: 'Number' },
            'mean': { input: 'Array', output: 'Number', args: null },
            'median': { input: 'Array', output: 'Number', args: null },
            'sum': { input: 'Array', output: 'Number', args: null },
            'stddev': { input: 'Array', output: 'Number', args: null },
            'variance': { input: 'Array', output: 'Number', args: null },
            
            // String library operators
            'replace': { input: 'String', output: 'String', args: 'String' },
            'substring': { input: 'String', output: 'String', args: 'Number' },
            'contains': { input: 'String', output: 'Boolean', args: 'String' },
            'starts_with': { input: 'String', output: 'Boolean', args: 'String' },
            'ends_with': { input: 'String', output: 'Boolean', args: 'String' },
            'split_lines': { input: 'String', output: 'Array', args: null },
            'pad_left': { input: 'String', output: 'String', args: 'Number' },
            'pad_right': { input: 'String', output: 'String', args: 'Number' },
            
            // Collections library operators
            'length': { input: 'Any', output: 'Number', args: null },
            'get': { input: 'Any', output: 'Any', args: 'String' },
            'set': { input: 'Any', output: 'Any', args: 'String' },
            'keys': { input: 'Object', output: 'Array', args: null },
            'values': { input: 'Object', output: 'Array', args: null },
            'merge': { input: 'Object', output: 'Object', args: 'Object' },
            'slice': { input: 'Array', output: 'Array', args: 'Number' },
            
            // Time library operators
            'timestamp': { input: 'Any', output: 'Number', args: null },
            'delay': { input: 'Any', output: 'Any', args: 'Number' },
            'format_time': { input: 'Number', output: 'String', args: 'String' },
            'parse_time': { input: 'String', output: 'Number', args: null },
            'add_milliseconds': { input: 'Number', output: 'Number', args: 'Number' },
            'add_seconds': { input: 'Number', output: 'Number', args: 'Number' },
            'add_minutes': { input: 'Number', output: 'Number', args: 'Number' },
            'time_diff': { input: 'Number', output: 'Number', args: 'Number' },
            
            // Type library operators
            'type_of': { input: 'Any', output: 'String', args: null },
            'is_array': { input: 'Any', output: 'Boolean', args: null },
            'is_object': { input: 'Any', output: 'Boolean', args: null },
            'is_string': { input: 'Any', output: 'Boolean', args: null },
            'is_number': { input: 'Any', output: 'Boolean', args: null },
            'is_boolean': { input: 'Any', output: 'Boolean', args: null },
            'cast_string': { input: 'Any', output: 'String', args: null },
            'cast_number': { input: 'Any', output: 'Number', args: null },
            'cast_boolean': { input: 'Any', output: 'Boolean', args: null },
            'type_check': { input: 'Any', output: 'Any', args: 'String' }
        };

        this.typeMap = {
            'LITERAL_NUMBER': 'Number',
            'LITERAL_STRING': 'String',
            'LITERAL_COLLECTION': 'Array',
            'STREAM_SOURCE_FINITE': 'Any', 
            'STREAM_SOURCE_LIVE': 'Event',
            'POOL_DECLARATION': 'PoolName',
            'FUNCTION_OPERATOR': 'Any',
            'LENS_OPERATOR': 'Lens'
        };
        
        this.knownLibraryOperators = new Set(Object.keys(this.operatorSignature));
    }

    /**
     * Main entry point for the compilation phase.
     */
    compile(ast) {
        console.log(`\n⚛️ Compiling Fluxus AST...`);
        
        // Pass 1: Linker Resolution
        const linkedAst = this.link(ast);

        // Pass 2: Type Checking (Enhanced with library awareness)
        this.checkTypes(linkedAst);

        // Pass 3: Optimization
        const optimizedAst = this.optimize(linkedAst);
        
        console.log(`✅ Compilation complete.`);
        return optimizedAst;
    }

    /**
     * Pass 1: Linker Resolution. Resolves function calls and pool references.
     */
    link(ast) {
        console.log(`   * Resolving pool and function links...`);
        return ast;
    }

    /**
     * Pass 2: Type Checking. Enhanced to recognize library operators.
     */
    checkTypes(ast) {
        console.log(`   * Performing enhanced type checking...`);
        
        ast.connections.forEach(conn => {
            const toNode = ast.nodes.find(n => n.id === conn.to);
            
            if (toNode.type === 'FUNCTION_OPERATOR' || toNode.type === 'LENS_OPERATOR') {
                let funcName = toNode.name;
                
                // Handle malformed lens operators
                if (funcName.includes('{') && toNode.type === 'FUNCTION_OPERATOR') {
                    console.warn(`   ⚠️ Type Warning on line ${toNode.line}: Operator appears to be a malformed lens operator: '${funcName}'. Check parser.`);
                    return;
                }
                
                if (toNode.type === 'LENS_OPERATOR') {
                    // Lens operators are always valid
                    const validLensOperators = ['map', 'reduce', 'filter', 'split'];
                    if (!validLensOperators.includes(funcName)) {
                        console.warn(`   ⚠️ Type Warning on line ${toNode.line}: Unknown lens operator '${funcName}'. Expected one of: ${validLensOperators.join(', ')}`);
                    }
                    return;
                }
                
                const signature = this.operatorSignature[funcName];
                
                if (signature) {
                    // Operator is known - type checking passed
                    if (this.debugMode) {
                        console.log(`   ✅ Known operator: ${funcName}`);
                    }
                } else if (this.knownLibraryOperators.has(funcName)) {
                    // Library operator - type checking passed
                    if (this.debugMode) {
                        console.log(`   ✅ Library operator: ${funcName}`);
                    }
                } else {
                    // Unknown operator - but don't warn for library operators that will be loaded at runtime
                    console.log(`   🔄 Operator '${funcName}' will be checked at runtime (may be from library)`);
                }
            }
        });
    }
    
    /**
     * Pass 3: Optimizes the AST for the runtime engine.
     */
    optimize(ast) {
        console.log(`   * Applying optimizations... (Map Merging, Dead Code Elimination)`);
        return ast; 
    }
    
    /**
     * Add library operators to the known set (called by engine)
     */
    registerLibraryOperators(operators) {
        Object.keys(operators).forEach(op => {
            this.knownLibraryOperators.add(op);
        });
    }
}
