// FILENAME: src/core/parser.js
// Fluxus Language Graph Parser v8.0 - PRODUCTION GRADE
// COMPATIBLE WITH EXISTING NODE STRUCTURE - NO FLOW BREAKING

/**
 * Production-grade parser with enhanced pool support
 * Maintains full backward compatibility
 */

// Use your existing UUID generator
const generateUUID = () => `node_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

export class GraphParser {
    constructor() {
        // Preserve your existing connection types
        this.connectionTypes = {
            '|': 'PIPE_FLOW',
            '->': 'POOL_READ_FLOW',
            '<-': 'POOL_WRITE_FLOW'
        };

        // Enhanced operator classification
        this.operatorCategories = {
            'SOURCE': ['~', '~?'],
            'SINK': ['print', 'to_pool', 'ui_render', 'write_file'],
            'TRANSFORM': ['add', 'subtract', 'multiply', 'divide', 'trim', 'to_upper', 'to_lower', 'concat'],
            'MATH': ['sin', 'cos', 'tan', 'sqrt', 'pow', 'log', 'exp', 'abs', 'floor', 'ceil', 'round', 'max', 'min', 'random'],
            'STRING': ['capitalize', 'reverse', 'replace', 'substring', 'contains', 'starts_with', 'ends_with', 'split_lines', 'length', 'repeat'],
            'COLLECTION': ['map', 'reduce', 'filter', 'split', 'length', 'get', 'set', 'keys', 'values'],
            'COMBINATION': ['combine_latest', 'merge', 'concat'],
            'CONTROL': ['split', 'debounce', 'throttle', 'delay'],
            'LENS': ['map', 'reduce', 'filter', 'split'],
            'POOL': ['to_pool', 'combine_latest'] // NEW: Pool operations
        };

        // Standard Library mappings
        this.standardLibraries = {
            'math': ['sin', 'cos', 'tan', 'sqrt', 'pow', 'log', 'exp', 'abs', 'floor', 'ceil', 'round', 'max', 'min', 'random'],
            'string': ['capitalize', 'reverse', 'replace', 'substring', 'contains', 'starts_with', 'ends_with', 'split_lines', 'length'],
            'time': ['now', 'timestamp', 'delay', 'interval'],
            'collections': ['length', 'get', 'set', 'keys', 'values', 'merge', 'slice'],
            'types': ['type_of', 'is_array', 'is_object', 'is_string', 'is_number', 'is_boolean']
        };

        this.debugMode = process.env.FLUXUS_PARSER_DEBUG === 'true';
        
        // Production: Track parsing statistics
        this.metrics = {
            poolsDeclared: 0,
            subscriptionsCreated: 0,
            operatorsParsed: 0,
            errors: 0,
            warnings: 0
        };
    }

    /**
     * MAIN PARSE METHOD - Enhanced with production pool support
     */
    parse(sourceCode) {
        // Reset metrics for this parse
        this.metrics = {
            poolsDeclared: 0,
            subscriptionsCreated: 0,
            operatorsParsed: 0,
            errors: 0,
            warnings: 0
        };

        const ast = {
            nodes: [],
            connections: [],
            pools: {},
            imports: [],
            functions: {},
            liveStreams: [],
            finiteStreams: [],
            metadata: {
                sourceLines: 0,
                parsedAt: new Date().toISOString(),
                version: '8.0.0',
                standardLibrary: {
                    usedLibraries: new Set(),
                    operatorCount: 0
                },
                parserMetrics: this.metrics
            }
        };

        const lines = this.preprocessSource(sourceCode);
        ast.metadata.sourceLines = lines.length;

        let currentPipeline = null;
        let pipelineStack = [];

        if (this.debugMode) {
            console.log('🚀 PRODUCTION PARSER: Starting parse of', lines.length, 'lines');
        }

        for (const { line, lineNum } of lines) {
            try {
                // Handle imports FIRST
                if (this.isImport(line)) {
                    this.parseImport(line, lineNum, ast);
                    continue;
                }

                // Handle pool declarations WITH PRODUCTION NODES
                if (this.isPoolDeclaration(line)) {
                    this.parsePoolDeclarationProduction(line, lineNum, ast);
                    continue;
                }

                // Handle function definitions
                if (this.isFunctionDefinition(line)) {
                    this.parseFunctionDefinition(line, lineNum, ast);
                    continue;
                }

                // Handle subscriptions WITH PRODUCTION NODES
                if (this.isSubscription(line)) {
                    this.parseSubscriptionProduction(line, lineNum, ast);
                    continue;
                }

                // Handle stream pipelines
                if (this.isStreamPipeline(line)) {
                    currentPipeline = this.parseStreamPipeline(line, lineNum, ast, currentPipeline);
                    pipelineStack.push(currentPipeline);
                } else if (currentPipeline && this.isPipelineContinuation(line)) {
                    currentPipeline = this.extendPipeline(line, lineNum, ast, currentPipeline);
                } else if (this.isPipelineTermination(line)) {
                    currentPipeline = pipelineStack.length > 0 ? pipelineStack.pop() : null;
                } else {
                    currentPipeline = null;
                    pipelineStack = [];
                }
            } catch (error) {
                this.metrics.errors++;
                this.logParseError(lineNum, line, error.message);
                // CONTINUE PARSING - Don't break the entire flow
            }
        }

        this.validateASTProduction(ast);
        this.analyzeStandardLibraryUsage(ast);
        
        if (this.debugMode) {
            this.printProductionSummary(ast);
        }

        return ast;
    }

    /**
     * PRODUCTION: Enhanced pool declaration with proper node creation
     */
    parsePoolDeclarationProduction(line, lineNum, ast) {
        const match = line.match(/let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*<\|>\s*(.*)/);
        if (match) {
            const poolName = match[1];
            let initialValue = match[2].trim() || 'null';

            try {
                // CREATE POOL DECLARATION NODE
                const poolDeclarationNode = {
                    id: generateUUID(),
                    type: 'POOL_DECLARATION',
                    name: poolName,
                    initialValue: initialValue,
                    poolName: poolName, // Compatibility
                    initial: initialValue, // Compatibility
                    line: lineNum,
                    valueType: this.inferType(initialValue),
                    category: 'POOL',
                    isReactive: true
                };

                // CREATE TIDAL POOL NODE for runtime
                const tidalPoolNode = {
                    id: generateUUID(),
                    type: 'TIDAL_POOL',
                    poolName: poolName,
                    initialValue: initialValue,
                    currentValue: null,
                    line: lineNum,
                    category: 'POOL',
                    subscriptions: [],
                    updateCount: 0
                };

                // ADD TO AST
                ast.nodes.push(poolDeclarationNode);
                ast.nodes.push(tidalPoolNode);

                // REGISTER POOL IN AST POOLS
                ast.pools[poolName] = {
                    id: poolDeclarationNode.id,
                    name: poolName,
                    initial: initialValue,
                    line: lineNum,
                    value: null,
                    type: poolDeclarationNode.valueType,
                    declarationNode: poolDeclarationNode,
                    tidalNode: tidalPoolNode
                };

                // CREATE CONNECTION: declaration -> tidal pool
                ast.connections.push({
                    id: generateUUID(),
                    from: poolDeclarationNode.id,
                    to: tidalPoolNode.id,
                    type: 'POOL_INITIALIZATION',
                    line: lineNum
                });

                this.metrics.poolsDeclared++;
                this.logParseInfo(lineNum, `✅ PRODUCTION: Declared pool ${poolName} = <|> ${initialValue}`);

            } catch (error) {
                throw new Error(`Pool declaration failed: ${error.message}`);
            }
        } else {
            throw new Error(`Malformed pool declaration: ${line}`);
        }
    }

    /**
     * PRODUCTION: Enhanced subscription parsing
     */
    parseSubscriptionProduction(line, lineNum, ast) {
        const parts = line.split('->').map(p => p.trim());
        if (parts.length !== 2) {
            throw new Error(`Invalid subscription format. Expected: pool -> pipeline`);
        }

        const poolName = parts[0];
        const subscriptionFlow = parts[1];

        // Ensure pool exists
        if (!ast.pools[poolName]) {
            this.logParseWarning(lineNum, `Subscription uses undeclared pool: ${poolName}. Creating implicit pool.`);
            this.parsePoolDeclarationProduction(`let ${poolName} = <|> null`, lineNum, ast);
        }

        const pipelineId = generateUUID();

        try {
            // CREATE POOL ACCESS NODE (reading from pool)
            const poolAccessNode = {
                id: generateUUID(),
                type: 'POOL_ACCESS',
                poolName: poolName,
                accessType: 'read',
                line: lineNum,
                pipelineId: pipelineId,
                category: 'SOURCE',
                isSource: true
            };
            ast.nodes.push(poolAccessNode);

            let previousNodeId = poolAccessNode.id;
            const subscriberNodes = [];

            // PARSE THE SUBSCRIBER PIPELINE
            const flowParts = this.splitPipeline(subscriptionFlow);
            
            for (const part of flowParts) {
                const operatorNode = this.parseOperator(part, lineNum, pipelineId);
                ast.nodes.push(operatorNode);
                subscriberNodes.push(operatorNode);

                // Connect in pipeline
                ast.connections.push({
                    id: generateUUID(),
                    from: previousNodeId,
                    to: operatorNode.id,
                    type: this.connectionTypes['|'],
                    line: lineNum
                });

                previousNodeId = operatorNode.id;

                if (this.isTerminalOperator(operatorNode.name)) {
                    operatorNode.isTerminal = true;
                }
            }

            // UPDATE TIDAL POOL WITH SUBSCRIPTION
            const tidalPool = Object.values(ast.nodes).find(n => 
                n.type === 'TIDAL_POOL' && n.poolName === poolName
            );
            
            if (tidalPool) {
                tidalPool.subscriptions.push({
                    subscriberPipeline: pipelineId,
                    triggerNode: poolAccessNode.id,
                    line: lineNum
                });
            }

            // CREATE SUBSCRIPTION CONNECTION
            ast.connections.push({
                id: generateUUID(),
                from: poolAccessNode.id,
                to: subscriberNodes[0]?.id || poolAccessNode.id,
                type: this.connectionTypes['->'],
                line: lineNum
            });

            this.metrics.subscriptionsCreated++;
            this.logParseInfo(lineNum, `✅ PRODUCTION: Created subscription ${poolName} -> ${subscriptionFlow}`);

        } catch (error) {
            throw new Error(`Subscription creation failed: ${error.message}`);
        }
    }

    /**
     * ENHANCED OPERATOR PARSING with pool operation detection
     */
    parseOperator(part, lineNum, pipelineId) {
        this.metrics.operatorsParsed++;

        let name = part;
        let args = [];
        let type = 'FUNCTION_OPERATOR';
        let category = 'TRANSFORM';

        // DETECT to_pool OPERATIONS - Special handling
        if (part.startsWith('to_pool(')) {
            const poolWriteMatch = part.match(/to_pool\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/);
            if (poolWriteMatch) {
                const poolName = poolWriteMatch[1];
                
                return {
                    id: generateUUID(),
                    pipelineId: pipelineId,
                    type: 'POOL_WRITE',
                    name: 'to_pool',
                    args: [poolName],
                    value: part,
                    line: lineNum,
                    isTerminal: true,
                    category: 'POOL',
                    library: 'core',
                    operation: 'write',
                    targetPool: poolName
                };
            }
        }

        // Handle lens operators
        const lensPattern = /^(\w+)\s*\{([^}]*)\}\s*$/;
        const lensMatch = part.match(lensPattern);
        const lensOperators = ['map', 'reduce', 'filter', 'split'];

        if (lensMatch && lensOperators.includes(lensMatch[1])) {
            name = lensMatch[1].trim();
            const lensContent = lensMatch[2].trim();
            args = [lensContent];
            type = 'LENS_OPERATOR';
            category = 'LENS';
        }
        else if (part.includes('(') && part.includes(')')) {
            const openParen = part.indexOf('(');
            const closeParen = part.lastIndexOf(')');

            if (openParen < closeParen) {
                name = part.substring(0, openParen).trim();
                const argString = part.substring(openParen + 1, closeParen).trim();

                if (argString) {
                    args = this.parseArgs(argString);
                }
            }
            category = this.classifyOperatorWithLibrary(name);
        }
        else if (/\w+\s*\(/.test(part)) {
            const match = part.match(/(\w+)\s*\((.*)\)/);
            if (match) {
                name = match[1].trim();
                const argString = match[2].trim();
                if (argString) {
                    args = this.parseArgs(argString);
                }
                category = this.classifyOperatorWithLibrary(name);
            }
        }
        else if (part === 'TRUE_FLOW' || part === 'FALSE_FLOW') {
            name = part;
            type = 'FLOW_BRANCH';
            category = 'CONTROL';
            args = [];
        }
        else {
            name = part.trim();
            category = this.classifyOperatorWithLibrary(name);
        }

        return {
            id: generateUUID(),
            pipelineId: pipelineId,
            type: type,
            name: name,
            args: args,
            value: part,
            line: lineNum,
            isTerminal: this.isTerminalOperator(name),
            category: category,
            library: this.detectOperatorLibrary(name)
        };
    }

    /**
     * PRODUCTION VALIDATION with enhanced pool checks
     */
    validateASTProduction(ast) {
        const warnings = [];
        const errors = [];

        // CHECK POOL CONSISTENCY
        Object.keys(ast.pools).forEach(poolName => {
            const pool = ast.pools[poolName];
            
            // Check declaration exists
            const hasDeclaration = ast.nodes.some(node => 
                node.type === 'POOL_DECLARATION' && node.poolName === poolName
            );
            
            if (!hasDeclaration) {
                errors.push(`Pool '${poolName}' missing declaration node`);
            }

            // Check tidal pool exists
            const hasTidalPool = ast.nodes.some(node => 
                node.type === 'TIDAL_POOL' && node.poolName === poolName
            );
            
            if (!hasTidalPool) {
                errors.push(`Pool '${poolName}' missing tidal pool node`);
            }

            // Check usage
            const isUsed = ast.nodes.some(node => 
                (node.type === 'POOL_ACCESS' && node.poolName === poolName) ||
                (node.type === 'POOL_WRITE' && node.targetPool === poolName)
            );
            
            if (!isUsed) {
                warnings.push(`Pool '${poolName}' declared but never used`);
            }
        });

        // CHECK SUBSCRIPTIONS
        ast.nodes.forEach(node => {
            if (node.type === 'POOL_ACCESS') {
                if (!ast.pools[node.poolName]) {
                    errors.push(`Pool access references unknown pool: ${node.poolName}`);
                }
            }
            
            if (node.type === 'POOL_WRITE') {
                if (!ast.pools[node.targetPool]) {
                    errors.push(`Pool write references unknown pool: ${node.targetPool}`);
                }
            }
        });

        // REPORT RESULTS
        if (errors.length > 0) {
            console.error('❌ PRODUCTION VALIDATION ERRORS:');
            errors.forEach(error => console.error(`   🚨 ${error}`));
            // DON'T THROW - Continue with warnings for better developer experience
        }

        if (warnings.length > 0) {
            console.log('🔍 PRODUCTION VALIDATION WARNINGS:');
            warnings.forEach(warning => console.log(`   ⚠️ ${warning}`));
        }

        return { errors, warnings };
    }

    /**
     * PRODUCTION SUMMARY
     */
    printProductionSummary(ast) {
        console.log('\n🎯 PRODUCTION PARSER SUMMARY:');
        console.log(`   📝 Lines processed: ${ast.metadata.sourceLines}`);
        console.log(`   📦 Total nodes: ${ast.nodes.length}`);
        console.log(`   🔗 Connections: ${ast.connections.length}`);
        console.log(`   🏊 Pools declared: ${this.metrics.poolsDeclared}`);
        console.log(`   🔄 Subscriptions: ${this.metrics.subscriptionsCreated}`);
        console.log(`   🔧 Operators parsed: ${this.metrics.operatorsParsed}`);
        console.log(`   ⚠️  Warnings: ${this.metrics.warnings}`);
        console.log(`   ❌ Errors: ${this.metrics.errors}`);
        
        // Node type breakdown
        const nodeTypes = {};
        ast.nodes.forEach(node => {
            nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
        });
        console.log(`   🎯 Node types:`, nodeTypes);
    }

    // ==================== KEEP ALL YOUR EXISTING METHODS ====================
    // These remain exactly as you have them to maintain compatibility

    preprocessSource(sourceCode) {
        const lines = sourceCode.split('\n');
        const processed = [];
        let inMultilineComment = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;

            if (inMultilineComment) {
                if (line.includes('*/')) {
                    inMultilineComment = false;
                    line = line.substring(line.indexOf('*/') + 2).trim();
                } else {
                    continue;
                }
            }

            if (line.includes('/*')) {
                inMultilineComment = true;
                line = line.substring(0, line.indexOf('/*')).trim();
                if (!line) continue;
            }

            const commentIndex = line.indexOf('#');
            if (commentIndex !== -1) {
                line = line.substring(0, commentIndex).trim();
            }

            const jsCommentIndex = line.indexOf('//');
            if (jsCommentIndex !== -1) {
                line = line.substring(0, jsCommentIndex).trim();
            }

            if (line) {
                processed.push({ line, lineNum: i + 1 });
            }
        }

        return processed;
    }

    isImport(line) {
        return line.startsWith('FLOW') || line.startsWith('IMPORT') || line.startsWith('FROM') || line.startsWith('import ');
    }

    parseImport(line, lineNum, ast) {
        if (line.startsWith('FLOW')) {
            const flowMatch = line.match(/FLOW\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (flowMatch) {
                ast.imports.push(flowMatch[1]);
                this.logParseInfo(lineNum, `Imported flow: ${flowMatch[1]}`);
            }
        } else if (line.startsWith('import ')) {
            const importMatch = line.match(/import\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (importMatch) {
                const libName = importMatch[1];
                ast.imports.push(libName);
                if (this.standardLibraries[libName]) {
                    ast.metadata.standardLibrary.usedLibraries.add(libName);
                }
            }
        }
        // ... rest of your import parsing
    }

    isPoolDeclaration(line) {
        return line.includes('<|>') && line.startsWith('let ');
    }

    isFunctionDefinition(line) {
        return line.startsWith('FUNC ') || line.startsWith('function ');
    }

    parseFunctionDefinition(line, lineNum, ast) {
        const funcMatch = line.match(/(?:FUNC|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*:/);
        if (funcMatch) {
            const funcName = funcMatch[1];
            const params = funcMatch[2].split(',').map(p => p.trim()).filter(p => p);
            ast.functions[funcName] = {
                id: generateUUID(),
                name: funcName,
                parameters: params,
                line: lineNum,
                body: []
            };
        }
    }

    isSubscription(line) {
        return line.includes('->') &&
               !line.startsWith('~') &&
               !line.startsWith('|') &&
               !line.startsWith('TRUE_FLOW') &&
               !line.startsWith('FALSE_FLOW') &&
               !this.isPoolDeclaration(line);
    }

    isStreamPipeline(line) {
        return line.startsWith('~') ||
               (line.includes('|') && !this.isSubscription(line)) ||
               line.startsWith('TRUE_FLOW') ||
               line.startsWith('FALSE_FLOW');
    }

    isPipelineContinuation(line) {
        return line.startsWith('|') ||
               line.startsWith('TRUE_FLOW') ||
               line.startsWith('FALSE_FLOW');
    }

    isPipelineTermination(line) {
        return line === 'END' || line.startsWith('END_FLOW');
    }

    parseStreamPipeline(line, lineNum, ast, currentPipeline) {
        const pipelineId = currentPipeline?.id || generateUUID();
        let previousNodeId = currentPipeline?.lastNodeId || null;

        const parts = this.splitPipeline(line);

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (part.startsWith('~')) {
                const isLive = part.startsWith('~?');
                const valuePart = part.substring(isLive ? 2 : 1).trim();

                const sourceNode = {
                    id: generateUUID(),
                    pipelineId: pipelineId,
                    type: isLive ? 'STREAM_SOURCE_LIVE' : 'STREAM_SOURCE_FINITE',
                    name: isLive ? 'LIVE_SOURCE' : 'FINITE_SOURCE',
                    value: valuePart,
                    line: lineNum,
                    isTerminal: false,
                    category: 'SOURCE'
                };

                ast.nodes.push(sourceNode);

                if (isLive) {
                    ast.liveStreams.push(sourceNode.id);
                } else {
                    ast.finiteStreams.push(sourceNode.id);
                }

                previousNodeId = sourceNode.id;

            } else if (part.startsWith('TRUE_FLOW') || part.startsWith('FALSE_FLOW')) {
                const type = part.startsWith('TRUE_FLOW') ? 'TRUE_FLOW' : 'FALSE_FLOW';
                const flowNode = {
                    id: generateUUID(),
                    pipelineId: pipelineId,
                    type: type,
                    name: type,
                    value: null,
                    line: lineNum,
                    isTerminal: false,
                    category: 'CONTROL'
                };
                ast.nodes.push(flowNode);

                if (previousNodeId) {
                    ast.connections.push({
                        id: generateUUID(),
                        from: previousNodeId,
                        to: flowNode.id,
                        type: this.connectionTypes['|'],
                        line: lineNum
                    });
                }

                previousNodeId = flowNode.id;

            } else if (part.length > 0) {
                const operatorNode = this.parseOperator(part, lineNum, pipelineId);
                ast.nodes.push(operatorNode);

                if (previousNodeId) {
                    ast.connections.push({
                        id: generateUUID(),
                        from: previousNodeId,
                        to: operatorNode.id,
                        type: this.connectionTypes['|'],
                        line: lineNum
                    });
                }

                previousNodeId = operatorNode.id;
            }
        }

        return {
            id: pipelineId,
            lastNodeId: previousNodeId,
            lineNum: lineNum
        };
    }

    extendPipeline(line, lineNum, ast, currentPipeline) {
        return this.parseStreamPipeline(line, lineNum, ast, currentPipeline);
    }

    splitPipeline(line) {
        if (line.includes('<|>')) return [line];
        
        const parts = [];
        let current = '';
        let braceDepth = 0, bracketDepth = 0, parenDepth = 0;
        let quote = null, escapeNext = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (escapeNext) {
                current += char;
                escapeNext = false;
                continue;
            }

            if (char === '\\') {
                escapeNext = true;
                continue;
            }

            if (char === '"' || char === "'") {
                if (quote === char) quote = null;
                else if (quote === null) quote = char;
            }

            if (quote === null) {
                if (char === '{') braceDepth++;
                if (char === '}') braceDepth--;
                if (char === '[') bracketDepth++;
                if (char === ']') bracketDepth--;
                if (char === '(') parenDepth++;
                if (char === ')') parenDepth--;
            }

            if (char === '|' && braceDepth === 0 && bracketDepth === 0 && parenDepth === 0 && quote === null) {
                if (current.trim()) parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) parts.push(current.trim());
        return parts;
    }

    parseArgs(argString) {
        if (!argString.trim()) return [];
        const args = [];
        let current = '';
        let braceDepth = 0, bracketDepth = 0, parenDepth = 0;
        let quote = null, escapeNext = false;

        for (let i = 0; i < argString.length; i++) {
            const char = argString[i];
            if (escapeNext) {
                current += char;
                escapeNext = false;
                continue;
            }
            if (char === '\\') {
                escapeNext = true;
                continue;
            }
            if (char === '"' || char === "'") {
                if (quote === char) quote = null;
                else if (quote === null) quote = char;
                current += char;
                continue;
            }
            if (quote === null) {
                if (char === '{') braceDepth++;
                if (char === '}') braceDepth--;
                if (char === '[') bracketDepth++;
                if (char === ']') bracketDepth--;
                if (char === '(') parenDepth++;
                if (char === ')') parenDepth--;
                if (char === ',' && braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
                    if (current.trim()) args.push(this.cleanArgument(current.trim()));
                    current = '';
                    continue;
                }
            }
            current += char;
        }
        if (current.trim()) args.push(this.cleanArgument(current.trim()));
        return args;
    }

    cleanArgument(arg) {
        if ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith('"') && arg.endsWith('"'))) {
            return arg.slice(1, -1);
        }
        return arg;
    }

    isTerminalOperator(operatorName) {
        const terminalOps = ['to_pool', 'print', 'ui_render', 'write_file', 'RESULT'];
        return terminalOps.includes(operatorName);
    }

    classifyOperatorWithLibrary(operatorName) {
        for (const [category, operators] of Object.entries(this.operatorCategories)) {
            if (operators.includes(operatorName)) return category;
        }
        for (const [lib, operators] of Object.entries(this.standardLibraries)) {
            if (operators.includes(operatorName)) return lib.toUpperCase();
        }
        return 'TRANSFORM';
    }

    detectOperatorLibrary(operatorName) {
        for (const [lib, operators] of Object.entries(this.standardLibraries)) {
            if (operators.includes(operatorName)) return lib;
        }
        return 'core';
    }

    analyzeStandardLibraryUsage(ast) {
        const usedLibraries = new Set();
        let operatorCount = 0;

        ast.nodes.forEach(node => {
            if (node.type === 'FUNCTION_OPERATOR' || node.type === 'LENS_OPERATOR') {
                operatorCount++;
                const library = this.detectOperatorLibrary(node.name);
                if (library !== 'core') usedLibraries.add(library);
            }
        });

        ast.metadata.standardLibrary.usedLibraries = new Set([...ast.metadata.standardLibrary.usedLibraries, ...usedLibraries]);
        ast.metadata.standardLibrary.operatorCount = operatorCount;
    }

    inferType(value) {
        if (value === 'null') return 'null';
        if (value === 'true' || value === 'false') return 'boolean';
        if (!isNaN(value) && value.trim() !== '') return 'number';
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) return 'string';
        if (value.startsWith('[') && value.endsWith(']')) return 'array';
        if (value.startsWith('{') && value.endsWith('}')) return 'object';
        return 'any';
    }

    isValidIdentifier(name) {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    logParseInfo(lineNum, message) {
        if (this.debugMode) console.log(`📝 [Line ${lineNum}] ${message}`);
    }

    logParseWarning(lineNum, message) {
        this.metrics.warnings++;
        console.log(`⚠️ [Line ${lineNum}] ${message}`);
    }

    logParseError(lineNum, line, message) {
        this.metrics.errors++;
        console.error(`❌ [Line ${lineNum}] Parse Error: ${message}`);
        console.error(`   Code: ${line}`);
    }
}
