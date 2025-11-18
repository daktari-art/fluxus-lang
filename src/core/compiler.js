// FILENAME: src/core/compiler.js
// Fluxus Language Compiler v4.4 - SMART ENGINE INTEGRATION

import { OperatorsRegistry } from '../stdlib/core/operators/index.js';

export class Compiler {
    constructor() {
        this.operatorsRegistry = new OperatorsRegistry();
        this.operatorSignature = this.buildOperatorSignature();
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

        // Enhanced library mapping for Smart Engine
        this.libraryMap = {
            'core': ['add', 'subtract', 'multiply', 'divide', 'print', 'to_pool'],
            'math_advanced': ['sin', 'cos', 'tan', 'sqrt', 'pow', 'log', 'exp', 'abs', 'floor', 'ceil', 'round',
                            'max', 'min', 'random', 'mean', 'median', 'sum', 'stddev', 'variance'],
            'string': ['capitalize', 'reverse', 'replace', 'substring', 'contains', 'starts_with',
                      'ends_with', 'split_lines', 'pad_left', 'pad_right', 'length', 'match', 'test',
                      'repeat', 'encode_base64', 'decode_base64', 'escape_html', 'sanitize'],
            'collections': ['map', 'filter', 'reduce', 'group_by', 'sort_by', 'aggregate'],
            'time': ['delay', 'schedule', 'timestamp'],
            'reactive': ['lens_transform', 'pool_subscribe', 'stream_combine']
        };

        this.compiledProgram = {
            version: '4.4.0',
            libraries: new Set(),
            operators: [],
            typeChecks: [],
            warnings: [],
            smartEngine: true
        };
    }

    buildOperatorSignature() {
        const allOperators = this.operatorsRegistry.getAllOperators();
        const signature = {};

        for (const [name, op] of Object.entries(allOperators)) {
            signature[name] = op.signature;
        }

        // Enhanced signatures for Smart Engine
        signature['max'] = { input: 'Array', output: 'Number', args: [] };
        signature['min'] = { input: 'Array', output: 'Number', args: [] };
        signature['mean'] = { input: 'Array', output: 'Number', args: [] };
        signature['sum'] = { input: 'Array', output: 'Number', args: [] };
        signature['median'] = { input: 'Array', output: 'Number', args: [] };

        return signature;
    }

    compile(ast) {
        console.log('🔧 Compiling Fluxus program with Smart Engine...');

        this.compiledProgram = {
            version: '4.4.0',
            libraries: new Set(),
            operators: [],
            typeChecks: [],
            warnings: [],
            smartEngine: true
        };

        this.resolveLibraries(ast);
        this.compileNodes(ast);
        this.optimizePipeline();
        
        // Add Smart Engine recommendations
        this.addSmartEngineRecommendations();

        return this.compiledProgram;
    }

    resolveLibraries(ast) {
        const libraryImports = ast.nodes?.filter(node =>
            node.type === 'IMPORT_STATEMENT' && node.libraryName
        ) || [];

        for (const importNode of libraryImports) {
            const libName = importNode.libraryName;
            if (this.libraryMap[libName]) {
                this.compiledProgram.libraries.add(libName);
                console.log(`📚 Imported library: ${libName}`);
            } else {
                this.compiledProgram.warnings.push(`Unknown library: ${libName}`);
            }
        }

        // Auto-detect library usage for Smart Engine
        this.autoDetectLibraries(ast);
    }

    autoDetectLibraries(ast) {
        const detectedLibs = new Set();
        
        if (ast.nodes) {
            ast.nodes.forEach(node => {
                if (node.type === 'FUNCTION_OPERATOR') {
                    const opName = node.name.split('(')[0].trim();
                    
                    for (const [lib, operators] of Object.entries(this.libraryMap)) {
                        if (operators.includes(opName) && !this.compiledProgram.libraries.has(lib)) {
                            detectedLibs.add(lib);
                        }
                    }
                }
            });
        }

        if (detectedLibs.size > 0) {
            console.log(`🔍 Smart Engine detected libraries: ${Array.from(detectedLibs).join(', ')}`);
        }
    }

    compileNodes(ast) {
        if (!ast.nodes) return;

        for (const node of ast.nodes) {
            switch (node.type) {
                case 'STREAM_SOURCE_FINITE':
                case 'STREAM_SOURCE_LIVE':
                    this.compileStreamSource(node);
                    break;
                case 'PIPELINE_OPERATOR':
                    this.compilePipelineOperator(node);
                    break;
                case 'POOL_DECLARATION':
                    this.compilePoolDeclaration(node);
                    break;
                case 'POOL_ACCESS':
                    this.compilePoolAccess(node);
                    break;
                case 'FUNCTION_OPERATOR':
                    this.compileFunctionOperator(node);
                    break;
                case 'LENS_OPERATOR':
                    this.compileLensOperator(node);
                    break;
                default:
                    this.compiledProgram.warnings.push(`Unhandled node type: ${node.type}`);
            }
        }
    }

    compileStreamSource(node) {
        const operator = {
            type: 'stream-source',
            sourceType: node.type === 'STREAM_SOURCE_LIVE' ? 'live' : 'finite',
            value: node.value,
            position: node.position
        };

        this.compiledProgram.operators.push(operator);
    }

    compilePipelineOperator(node) {
        if (this.knownLibraryOperators.has(node.operator)) {
            const signature = this.operatorSignature[node.operator];
            const operator = {
                type: 'transformation',
                name: node.operator,
                signature: signature,
                args: node.args || [],
                position: node.position,
                library: this.findOperatorLibrary(node.operator),
                complexity: this.calculateOperatorComplexity(node.operator, signature)
            };

            // Add type check for this operator
            if (signature.input !== 'Any') {
                this.compiledProgram.typeChecks.push({
                    operator: node.operator,
                    expectedInput: signature.input,
                    position: node.position
                });
            }

            this.compiledProgram.operators.push(operator);
        } else {
            this.compiledProgram.warnings.push(`Unknown operator: ${node.operator}`);
        }
    }

    compilePoolDeclaration(node) {
        const operator = {
            type: 'pool-declaration',
            name: node.poolName,
            initialValue: node.initialValue,
            position: node.position
        };

        this.compiledProgram.operators.push(operator);
    }

    compilePoolAccess(node) {
        const operator = {
            type: 'pool-access',
            poolName: node.poolName,
            operation: node.operation,
            args: node.args || [],
            position: node.position
        };

        this.compiledProgram.operators.push(operator);
    }

    compileFunctionOperator(node) {
        if (this.knownLibraryOperators.has(node.name)) {
            const signature = this.operatorSignature[node.name];
            const operator = {
                type: 'function-call',
                name: node.name,
                signature: signature,
                args: node.args || [],
                position: node.position,
                library: this.findOperatorLibrary(node.name),
                complexity: this.calculateOperatorComplexity(node.name, signature)
            };

            this.compiledProgram.operators.push(operator);
        } else {
            this.compiledProgram.warnings.push(`Unknown function: ${node.name}`);
        }
    }

    compileLensOperator(node) {
        const operator = {
            type: 'lens-operator',
            lensType: node.lensType,
            expression: node.expression,
            position: node.position
        };

        this.compiledProgram.operators.push(operator);
    }

    calculateOperatorComplexity(operatorName, signature) {
        // Simple complexity scoring for Smart Engine
        let score = 1;
        
        if (signature.input === 'Array') score += 1;
        if (signature.output === 'Array') score += 1;
        if (operatorName.includes('map') || operatorName.includes('reduce') || operatorName.includes('filter')) score += 2;
        if (operatorName.startsWith('sin') || operatorName.startsWith('cos') || operatorName.startsWith('tan')) score += 2;
        if (operatorName.includes('analyze') || operatorName.includes('predict')) score += 3;
        
        return Math.min(score, 5); // Scale to 1-5
    }

    optimizePipeline() {
        const optimizedOperators = [];

        for (let i = 0; i < this.compiledProgram.operators.length; i++) {
            const current = this.compiledProgram.operators[i];
            const next = this.compiledProgram.operators[i + 1];

            // Skip no-op transformations
            if (current.type === 'transformation' && current.name === 'identity') {
                continue;
            }

            // Combine consecutive maps
            if (current.type === 'lens-operator' && next?.type === 'lens-operator' &&
                current.lensType === 'map' && next.lensType === 'map') {
                const mergedOperator = {
                    ...current,
                    expression: `(${current.expression}).then(${next.expression})`
                };
                optimizedOperators.push(mergedOperator);
                i++;
                continue;
            }

            optimizedOperators.push(current);
        }

        this.compiledProgram.operators = optimizedOperators;

        if (optimizedOperators.length < this.compiledProgram.operators.length) {
            console.log(`⚡ Optimized pipeline: ${this.compiledProgram.operators.length} → ${optimizedOperators.length} operators`);
        }
    }

    addSmartEngineRecommendations() {
        const recommendations = [];
        const operatorCounts = {};
        
        this.compiledProgram.operators.forEach(op => {
            if (op.library) {
                operatorCounts[op.library] = (operatorCounts[op.library] || 0) + 1;
            }
        });

        if (operatorCounts['math_advanced'] > 3) {
            recommendations.push('Heavy math usage detected - Smart Engine will use advanced math library');
        }

        if (recommendations.length > 0) {
            console.log('💡 Smart Engine Recommendations:');
            recommendations.forEach(rec => console.log(`   ${rec}`));
        }
    }

    validateTypeCompatibility(operatorName, inputType, expectedType) {
        if (expectedType === 'Any') return true;
        if (inputType === 'Any') return true;

        const compatibility = {
            'Number': ['Number'],
            'String': ['String'],
            'Boolean': ['Boolean'],
            'Array': ['Array', 'Collection'],
            'Object': ['Object'],
            'Stream': ['Stream', 'Event'],
            'PoolName': ['PoolName']
        };

        const allowedTypes = compatibility[expectedType] || [expectedType];
        return allowedTypes.includes(inputType);
    }

    getOperatorDocumentation(operatorName) {
        try {
            return this.operatorsRegistry.generateDocumentation()[operatorName];
        } catch (error) {
            return null;
        }
    }

    findOperatorLibrary(operatorName) {
        for (const [lib, operators] of Object.entries(this.libraryMap)) {
            if (operators.includes(operatorName)) {
                return lib;
            }
        }
        return 'core';
    }

    generateRuntimeCode(compiledProgram) {
        const lines = [];

        lines.push('// Generated Fluxus Runtime Code - Smart Engine');
        lines.push(`// Version: ${compiledProgram.version}`);
        lines.push(`// Smart Engine: ${compiledProgram.smartEngine ? 'Enabled' : 'Disabled'}`);
        lines.push(`// Libraries: ${Array.from(compiledProgram.libraries).join(', ')}`);
        lines.push('');

        // Add library imports
        if (compiledProgram.libraries.size > 0) {
            lines.push('// Imported Libraries:');
            for (const lib of compiledProgram.libraries) {
                lines.push(`import * as ${lib} from './lib/${lib}.js';`);
            }
            lines.push('');
        }

        // Generate operator sequence
        lines.push('// Operator Pipeline:');
        for (const op of compiledProgram.operators) {
            switch (op.type) {
                case 'stream-source':
                    lines.push(`const stream = Fluxus.${op.sourceType}Stream(${JSON.stringify(op.value)});`);
                    break;
                case 'transformation':
                    lines.push(`stream.pipe(Fluxus.${op.name}(${op.args.map(arg => JSON.stringify(arg)).join(', ')}));`);
                    break;
                case 'pool-declaration':
                    lines.push(`const ${op.name} = Fluxus.createPool(${JSON.stringify(op.initialValue)});`);
                    break;
                case 'pool-access':
                    lines.push(`${op.poolName}.${op.operation}(${op.args.map(arg => JSON.stringify(arg)).join(', ')});`);
                    break;
            }
        }

        return lines.join('\n');
    }

    // New method: Get operator catalog for CLI
    getOperatorCatalog() {
        return this.operatorsRegistry.generateDocumentation();
    }

    // New method: Validate program against operator signatures
    validateProgram(ast) {
        const errors = [];
        const warnings = [];

        if (!ast.nodes) return { errors, warnings, isValid: errors.length === 0 };

        for (const node of ast.nodes) {
            if (node.type === 'PIPELINE_OPERATOR' || node.type === 'FUNCTION_OPERATOR') {
                const operatorName = node.operator || node.functionName;

                if (!this.knownLibraryOperators.has(operatorName)) {
                    errors.push({
                        message: `Unknown operator: ${operatorName}`,
                        position: node.position,
                        node: node
                    });
                    continue;
                }

                const signature = this.operatorSignature[operatorName];

                // Basic signature validation
                if (signature.args && node.args && node.args.length > 0) {
                    // Could add more detailed argument validation here
                    console.log(`🔍 Validating ${operatorName} with args:`, node.args);
                }
            }
        }

        return {
            errors,
            warnings,
            isValid: errors.length === 0,
            summary: {
                totalOperators: ast.nodes.filter(n => n.type === 'PIPELINE_OPERATOR' || n.type === 'FUNCTION_OPERATOR').length,
                validationErrors: errors.length,
                validationWarnings: warnings.length
            }
        };
    }

    // New method: Get Smart Engine recommendations
    getSmartEngineRecommendations(ast) {
        const recommendations = [];
        const complexityScore = this.calculateProgramComplexity(ast);
        
        if (complexityScore > 7) {
            recommendations.push('High complexity program - Smart Engine will prefer advanced libraries');
        }
        
        return recommendations;
    }

    calculateProgramComplexity(ast) {
        let score = 0;
        
        if (ast.nodes) {
            ast.nodes.forEach(node => {
                if (node.type === 'FUNCTION_OPERATOR') {
                    const opName = node.name.split('(')[0].trim();
                    const signature = this.operatorSignature[opName];
                    if (signature) {
                        score += this.calculateOperatorComplexity(opName, signature);
                    }
                }
            });
        }
        
        return Math.min(score, 10);
    }
}

export default Compiler;
