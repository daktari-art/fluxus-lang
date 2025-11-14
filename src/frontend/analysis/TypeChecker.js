// FILENAME: src/frontend/analysis/TypeChecker.js
// Advanced Type Checker for Fluxus

import { SymbolTable } from './SymbolTable.js';

export class TypeChecker {
    constructor(compiler) {
        this.compiler = compiler;
        this.symbolTable = new SymbolTable();
        this.errors = [];
        this.warnings = [];
        this.typeInference = new Map();
    }

    checkProgram(ast) {
        this.errors = [];
        this.warnings = [];
        this.symbolTable.clear();
        this.typeInference.clear();

        this.buildSymbolTable(ast);
        this.checkTypes(ast);
        this.checkUnusedSymbols();
        
        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            symbols: this.symbolTable.toJSON()
        };
    }

    buildSymbolTable(ast) {
        if (!ast.nodes) return;

        for (const node of ast.nodes) {
            switch (node.type) {
                case 'POOL_DECLARATION':
                    this.symbolTable.addSymbol(
                        node.poolName,
                        'pool',
                        node,
                        { isPool: true, definedAt: node.position }
                    );
                    break;

                case 'STREAM_SOURCE_FINITE':
                case 'STREAM_SOURCE_LIVE':
                    const streamName = `stream_${node.position?.line || 'unknown'}`;
                    this.symbolTable.addSymbol(
                        streamName,
                        'stream',
                        node,
                        { isStream: true, definedAt: node.position }
                    );
                    break;

                case 'FUNCTION_OPERATOR':
                    // Track function usage
                    if (node.functionName) {
                        this.symbolTable.markReferenced(node.functionName);
                    }
                    break;
            }
        }
    }

    checkTypes(ast) {
        if (!ast.nodes) return;

        for (const node of ast.nodes) {
            try {
                this.checkNodeTypes(node);
            } catch (error) {
                this.errors.push({
                    message: error.message,
                    node: node,
                    position: node.position
                });
            }
        }
    }

    checkNodeTypes(node) {
        switch (node.type) {
            case 'PIPELINE_OPERATOR':
                this.checkPipelineOperator(node);
                break;

            case 'FUNCTION_OPERATOR':
                this.checkFunctionOperator(node);
                break;

            case 'POOL_ACCESS':
                this.checkPoolAccess(node);
                break;

            case 'LENS_OPERATOR':
                this.checkLensOperator(node);
                break;
        }
    }

    checkPipelineOperator(node) {
        const operator = node.operator;
        const signature = this.compiler.operatorSignature[operator];
        
        if (!signature) {
            throw new Error(`Unknown operator: ${operator}`);
        }

        // Check argument types
        if (signature.args && node.arguments) {
            this.checkArguments(node.arguments, signature.args, operator);
        }

        // Check input/output type compatibility would go here
        // This is simplified - real implementation would track types through pipeline
    }

    checkFunctionOperator(node) {
        const functionName = node.functionName;
        const signature = this.compiler.operatorSignature[functionName];
        
        if (!signature) {
            throw new Error(`Unknown function: ${functionName}`);
        }

        if (signature.args && node.arguments) {
            this.checkArguments(node.arguments, signature.args, functionName);
        }
    }

    checkPoolAccess(node) {
        const poolSymbol = this.symbolTable.getSymbol(node.poolName);
        if (!poolSymbol) {
            throw new Error(`Undefined pool: ${node.poolName}`);
        }

        // Mark pool as referenced
        this.symbolTable.markReferenced(node.poolName);

        // Check pool operation validity
        const validOperations = ['get', 'set', 'subscribe', 'add', 'subtract'];
        if (!validOperations.includes(node.operation)) {
            this.warnings.push({
                message: `Uncommon pool operation: ${node.operation}`,
                node: node,
                position: node.position
            });
        }
    }

    checkLensOperator(node) {
        // Lens operators have specific type requirements
        const validLensTypes = ['map', 'reduce', 'filter', 'find'];
        if (!validLensTypes.includes(node.lensType)) {
            throw new Error(`Invalid lens type: ${node.lensType}`);
        }
    }

    checkArguments(args, expectedType, operator) {
        // Simplified argument type checking
        // Real implementation would validate each argument against expectedType
        if (expectedType === 'Number' && args.some(arg => isNaN(Number(arg)))) {
            this.warnings.push({
                message: `Operator ${operator} expects numeric arguments`,
                arguments: args
            });
        }
    }

    checkUnusedSymbols() {
        const unreferenced = this.symbolTable.getUnreferencedSymbols();
        for (const symbol of unreferenced) {
            this.warnings.push({
                message: `Unused ${symbol.type}: ${symbol.name}`,
                symbol: symbol,
                position: symbol.definedAt
            });
        }
    }

    inferType(node) {
        // Type inference logic
        switch (node.type) {
            case 'LITERAL_NUMBER':
                return 'Number';
            case 'LITERAL_STRING':
                return 'String';
            case 'LITERAL_COLLECTION':
                return 'Array';
            case 'POOL_ACCESS':
                return 'PoolValue';
            default:
                return 'Any';
        }
    }

    getTypeCompatibility(type1, type2) {
        const compatibilityMatrix = {
            'Number': ['Number'],
            'String': ['String'],
            'Array': ['Array', 'Collection'],
            'Any': ['Number', 'String', 'Array', 'Boolean', 'Object'],
            'PoolValue': ['Number', 'String', 'Array', 'Boolean']
        };

        const allowed = compatibilityMatrix[type1] || [type1];
        return allowed.includes(type2);
    }

    generateReport() {
        return {
            summary: {
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length,
                symbolsCount: this.symbolTable.getAllSymbols().length,
                poolsCount: this.symbolTable.getPools().length,
                streamsCount: this.symbolTable.getStreams().length
            },
            errors: this.errors,
            warnings: this.warnings,
            symbols: this.symbolTable.getAllSymbols()
        };
    }
}

export default TypeChecker;
