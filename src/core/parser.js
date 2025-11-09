// FILENAME: src/core/parser.js
// 
// Fluxus Language Graph Parser v5.4 - UNRESTRICTED MULTI-LINE SUPPORT

const generateUUID = () => `node_${Math.random().toString(36).substring(2, 9)}`; 

export class GraphParser {
    constructor() {
        this.connectionTypes = {
            '|': 'PIPE_FLOW', 
            '->': 'POOL_READ_FLOW',
            '<-': 'POOL_WRITE_FLOW'
        };
    }

    parse(sourceCode) {
        const ast = {
            nodes: [],
            connections: [],
            pools: {},
            functions: {},
            liveStreams: [],
            finiteStreams: [],
        };

        // STEP 1: PRE-PROCESS - Reconstruct multi-line expressions
        const reconstructedLines = this.reconstructMultiLineExpressions(sourceCode);
        
        // STEP 2: Remove comments and empty lines
        const cleanedLines = reconstructedLines
            .map((line, index) => {
                const commentIndex = line.indexOf('#');
                let cleanLine = (commentIndex !== -1) ? line.substring(0, commentIndex).trim() : line.trim();
                
                if (cleanLine.length > 0) {
                    return { line: cleanLine, lineNum: index + 1 };
                }
                return null;
            })
            .filter(item => item !== null);

        let currentPipelineId = null;
        let previousNodeId = null;

        // STEP 3: Parse each complete line
        for (const item of cleanedLines) {
            const { line, lineNum } = item;

            if (line.startsWith('FLOW')) {
                 continue;
            }

            // 🎯 CRITICAL FIX: Handle pool declarations FIRST - preserve existing logic
            if (line.includes('<|>')) {
                this.parsePoolDeclaration(line, lineNum, ast);
                continue;
            }

            // 🎯 CRITICAL FIX: Handle subscriptions - preserve existing logic
            if (line.includes('->') && 
                !line.startsWith('~') &&
                !line.startsWith('|') &&
                !line.startsWith('TRUE_FLOW') &&
                !line.startsWith('FALSE_FLOW')
            ) {
                this.parseSubscription(line, lineNum, ast);
                continue;
            }
            
            // 🎯 CRITICAL FIX: Handle stream pipelines (including REPL-style)
            // Preserve ALL existing pipeline logic while adding REPL support
            if (line.startsWith('~') || line.startsWith('|') || 
                line.startsWith('TRUE_FLOW') || line.startsWith('FALSE_FLOW') ||
                // REPL ENHANCEMENT: Also handle lines that are just operators without ~ prefix
                this.looksLikePipeline(line)) {
                
                const parts = this.splitPipeline(line);
                
                // PRESERVE EXISTING PIPELINE LOGIC
                if (line.startsWith('~')) {
                    currentPipelineId = generateUUID();
                    previousNodeId = null;
                } else if (line.startsWith('TRUE_FLOW') || line.startsWith('FALSE_FLOW')) {
                    throw new Error(`❌ Syntax Error on line ${lineNum}: TRUE_FLOW/FALSE_FLOW must be piped (|) from a split operator.`);
                } else if (line.startsWith('|')) {
                    if (!currentPipelineId) {
                        const isSplitContinuation = parts[0].startsWith('TRUE_FLOW') || parts[0].startsWith('FALSE_FLOW');
                        if (isSplitContinuation) {
                            currentPipelineId = generateUUID();
                            previousNodeId = null;
                        } else {
                            throw new Error(`❌ Syntax Error on line ${lineNum}: Pipe (|) used without a preceding stream source (~ or ~?).`);
                        }
                    }
                } else {
                    // 🎯 REPL ENHANCEMENT: Handle lines that look like pipelines but don't start with ~
                    currentPipelineId = generateUUID();
                    previousNodeId = null;
                    
                    // If it's a simple value or operator, treat as finite stream
                    if (!line.startsWith('~') && this.looksLikePipeline(line)) {
                        parts.unshift(`~ ${this.extractInitialValue(parts[0])}`);
                    }
                }

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    
                    // PRESERVE EXISTING STREAM SOURCE LOGIC
                    if (part.startsWith('~')) {
                        const isLive = part.startsWith('~?');
                        const valuePart = part.substring(isLive ? 2 : 1).trim();
                        
                        const sourceNode = {
                            id: generateUUID(),
                            pipelineId: currentPipelineId,
                            type: isLive ? 'STREAM_SOURCE_LIVE' : 'STREAM_SOURCE_FINITE',
                            value: valuePart,
                            line: lineNum,
                            isTerminal: false,
                        };
                        ast.nodes.push(sourceNode);
                        previousNodeId = sourceNode.id;

                        if (isLive) {
                            ast.liveStreams.push(sourceNode.id);
                        } else {
                            ast.finiteStreams.push(sourceNode.id);
                        }

                    } else if (part.startsWith('TRUE_FLOW') || part.startsWith('FALSE_FLOW')) {
                        // PRESERVE EXISTING FLOW BRANCH LOGIC
                        const type = part.startsWith('TRUE_FLOW') ? 'TRUE_FLOW' : 'FALSE_FLOW';
                        
                        const flowNode = {
                            id: generateUUID(),
                            pipelineId: currentPipelineId,
                            type: type,
                            value: null,
                            line: lineNum,
                            isTerminal: false,
                        };
                        ast.nodes.push(flowNode);

                        if (previousNodeId) {
                            ast.connections.push({
                                from: previousNodeId,
                                to: flowNode.id,
                                type: this.connectionTypes['|'],
                                line: lineNum
                            });
                        }
                        
                        previousNodeId = flowNode.id;

                    } else if (part.length > 0) {
                        // PRESERVE EXISTING OPERATOR PARSING LOGIC
                        const operatorNode = this.parseOperator(part, lineNum, currentPipelineId);
                        ast.nodes.push(operatorNode);

                        if (previousNodeId) {
                            ast.connections.push({
                                from: previousNodeId,
                                to: operatorNode.id,
                                type: this.connectionTypes['|'],
                                line: lineNum
                            });
                        }
                        
                        previousNodeId = operatorNode.id;
                        
                        // PRESERVE EXISTING TERMINAL NODE LOGIC
                        if (operatorNode.name === 'to_pool' || operatorNode.name === 'print' || operatorNode.name === 'ui_render') {
                            operatorNode.isTerminal = true;
                        }
                    }
                }
            }
        }
        
        return ast;
    }

// In the GraphParser class, replace the reconstructMultiLineExpressions method:

reconstructMultiLineExpressions(sourceCode) {
    const lines = sourceCode.split('\n');
    const reconstructed = [];
    let currentExpression = '';
    let inMultiLine = false;

    // 🎯 DETECT REPL-STYLE MULTI-LINE: Check if we have pipe continuations
    const hasPipeContinuations = lines.some((line, i) => 
        i > 0 && line.trim().startsWith('|')
    );

    if (hasPipeContinuations) {
        // 🎯 REPL MODE: Join all lines into a single expression
        const joinedExpression = lines.map(line => {
            const trimmed = line.trim();
            // Remove leading pipe from continuation lines
            if (trimmed.startsWith('|')) {
                return trimmed.substring(1).trim();
            }
            return trimmed;
        }).join(' ').trim();
        
        reconstructed.push(joinedExpression);
        return reconstructed;
    }

    // 🎯 REGULAR FILE MODE: Original logic for .flux files
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (line.startsWith('#')) {
            if (inMultiLine) {
                currentExpression += ' ' + line;
            } else {
                reconstructed.push(line);
            }
            continue;
        }
        
        const commentIndex = line.indexOf('#');
        if (commentIndex !== -1) {
            line = line.substring(0, commentIndex).trim();
        }
        
        if (line.length === 0) {
            if (inMultiLine) {
                currentExpression += ' ';
            } else {
                reconstructed.push('');
            }
            continue;
        }

        if (inMultiLine) {
            currentExpression += ' ' + line;
            
            try {
                this.parseInternal(currentExpression);
                reconstructed.push(currentExpression);
                currentExpression = '';
                inMultiLine = false;
            } catch (e) {
                continue;
            }
        } else {
            currentExpression = line;
            inMultiLine = true;
            
            if (this.isObviouslyComplete(line)) {
                reconstructed.push(currentExpression);
                currentExpression = '';
                inMultiLine = false;
            } else {
                try {
                    this.parseInternal(currentExpression);
                    reconstructed.push(currentExpression);
                    currentExpression = '';
                    inMultiLine = false;
                } catch (e) {
                    continue;
                }
            }
        }
    }

    if (inMultiLine && currentExpression) {
        reconstructed.push(currentExpression);
    }

    return reconstructed;
}

// 🎯 ENHANCE: Better completion detection
isObviouslyComplete(line) {
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(line)) return true;
    
    if (line.includes('let') && line.includes('<|>') && !line.trim().endsWith('<|>')) {
        const parts = line.split('<|>');
        return parts.length === 2 && parts[1].trim() !== '';
    }
    
    if (/^[0-9]+$/.test(line)) return true;
    if (/^"[^"]*"$/.test(line)) return true;
    if (/^'[^']*'$/.test(line)) return true;
    
    // 🎯 FIX: Complete pipelines are complete
    if (line.includes('|') && !line.endsWith('|')) {
        return true;
    }
    
    return false;
}

    // 🎯 NEW: Internal parse method for completeness testing
    parseInternal(sourceCode) {
        const testAST = {
            nodes: [],
            connections: [],
            pools: {},
            functions: {},
            liveStreams: [],
            finiteStreams: [],
        };

        const lines = sourceCode.split('\n').map(line => {
            const commentIndex = line.indexOf('#');
            return (commentIndex !== -1) ? line.substring(0, commentIndex).trim() : line.trim();
        }).filter(line => line.length > 0);

        for (const line of lines) {
            if (line.includes('<|>')) {
                this.parsePoolDeclaration(line, 0, testAST);
            } else if (line.includes('->') && !line.startsWith('~') && !line.startsWith('|')) {
                this.parseSubscription(line, 0, testAST);
            }
            // Basic validation - if we can identify any structure, consider it valid
        }

        return testAST;
    }

    // 🎯 NEW: Check if line is obviously complete without full parsing
    isObviouslyComplete(line) {
        // Single pool inspection
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(line)) return true;
        
        // Complete pool declaration
        if (line.includes('let') && line.includes('<|>') && !line.trim().endsWith('<|>')) return true;
        
        // Simple values
        if (/^[0-9]+$/.test(line)) return true;
        if (/^"[^"]*"$/.test(line)) return true;
        if (/^'[^']*'$/.test(line)) return true;
        
        return false;
    }

    // 🎯 NEW: Check if a line looks like a pipeline (for REPL support)
    looksLikePipeline(line) {
        return line.includes('|') || 
               this.isOperator(line) || 
               line.startsWith('"') || 
               line.startsWith("'") ||
               line.startsWith('[') ||
               line.startsWith('{') ||
               !isNaN(parseFloat(line)) ||
               line.includes('(');
    }

    // 🎯 NEW: Check if a line contains an operator (preserves all existing operators)
    isOperator(line) {
        const operators = [
            'add', 'multiply', 'subtract', 'divide', 'print', 'to_pool', 'ui_render',
            'trim', 'to_upper', 'to_lower', 'concat', 'break', 'map', 'reduce', 
            'filter', 'split', 'combine_latest', 'fetch_url', 'hash_sha256',
            'double', 'add_five', 'square', 'detect_steps', 'detect_mock_steps', 
            'calculate_magnitude'
        ];
        return operators.some(op => line.includes(op));
    }

    // 🎯 NEW: Extract initial value for implicit stream sources (backward compatible)
    extractInitialValue(part) {
        if (part.startsWith('"') && part.endsWith('"')) return part;
        if (part.startsWith("'") && part.endsWith("'")) return part;
        if (part.startsWith('[') && part.endsWith(']')) return part;
        if (part.startsWith('{') && part.endsWith('}')) return part;
        if (!isNaN(parseFloat(part))) return part;
        
        // Default to empty string for operators - preserves existing behavior
        return '""';
    }

    // PRESERVE EXISTING PIPELINE SPLITTING LOGIC
    splitPipeline(line) {
        // 🎯 FIX: Handle pool declarations separately - preserve existing behavior
        if (line.includes('<|>')) {
            return [line];
        }
        
        const parts = [];
        let current = '';
        let braceDepth = 0;
        let parenDepth = 0;
        let quote = null;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '\'' || char === '"') {
                if (quote === char) {
                    quote = null;
                } else if (quote === null) {
                    quote = char;
                }
            }
            
            if (quote === null) {
                if (char === '{') braceDepth++;
                if (char === '}') braceDepth--;
                if (char === '(') parenDepth++;
                if (char === ')') parenDepth--;
            }
            
            if (char === '|' && braceDepth === 0 && parenDepth === 0 && quote === null) {
                if (current.trim()) {
                    parts.push(current.trim());
                }
                current = '';
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            parts.push(current.trim());
        }
        
        return parts;
    }

    // PRESERVE EXISTING SUBSCRIPTION PARSING LOGIC
    parseSubscription(line, lineNum, ast) {
        const parts = line.split('->').map(p => p.trim());
        const poolName = parts[0].trim();
        
        if (!ast.pools[poolName]) {
            console.warn(`⚠️ Warning: Subscription on line ${lineNum} uses pool '${poolName}' which is not declared.`);
        }

        const subscriptionFlow = parts[1].trim();
        const pipelineId = generateUUID();

        const poolReadNode = {
            id: generateUUID(),
            pipelineId: pipelineId,
            type: 'POOL_READ',
            value: poolName,
            line: lineNum,
            isTerminal: false,
        };
        ast.nodes.push(poolReadNode);
        
        let previousNodeId = poolReadNode.id;

        const flowParts = this.splitPipeline(subscriptionFlow);

        for (const part of flowParts) {
            const operatorNode = this.parseOperator(part, lineNum, pipelineId);
            ast.nodes.push(operatorNode);

            ast.connections.push({
                from: previousNodeId,
                to: operatorNode.id,
                type: this.connectionTypes['|'],
                line: lineNum
            });
            
            previousNodeId = operatorNode.id;
            
            if (operatorNode.name === 'to_pool' || operatorNode.name === 'print' || operatorNode.name === 'ui_render') {
                operatorNode.isTerminal = true;
            }
        }
        
        ast.connections.push({
            from: poolReadNode.id,
            to: previousNodeId,
            type: this.connectionTypes['->'],
            line: lineNum
        });
    }

    // PRESERVE EXISTING OPERATOR PARSING LOGIC
    parseOperator(part, lineNum, pipelineId) {
        let name = part;
        let args = [];
        let type = 'FUNCTION_OPERATOR';
        
        // EXTENDED LENS DETECTION - Support both syntaxes (PRESERVE EXISTING)
        const lensOperators = ['map', 'reduce', 'filter', 'split'];
        
        // Pattern 1: Arrow function syntax (map { data -> { ... } })
        const arrowPattern = /^(map)\s*\{([^{}]+)->\s*\{([^}]+)\}\s*\}$/;
        const arrowMatch = part.match(arrowPattern);
        
        if (arrowMatch && lensOperators.includes(arrowMatch[1])) {
            name = arrowMatch[1].trim();
            const param = arrowMatch[2].trim();
            const body = arrowMatch[3].trim();
            args = [param, body]; // Store both parameter and body
            type = 'LENS_OPERATOR';
        }
        // Pattern 2: Simple pipe syntax (map { .value | multiply(10) })
        else {
            const lensPattern = /^(\w+)\s*\{([^}]*)\}\s*$/;
            const lensMatch = part.match(lensPattern);
            
            if (lensMatch && lensOperators.includes(lensMatch[1])) {
                name = lensMatch[1].trim();
                const lensContent = lensMatch[2].trim();
                args = [lensContent];
                type = 'LENS_OPERATOR';
            }
            // Handle standard function operators (PRESERVE EXISTING)
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
            }
            // 🎯 ADD: Handle operators with spaces before parentheses
            else if (/\w+\s*\(/.test(part)) {
                const match = part.match(/(\w+)\s*\((.*)\)/);
                if (match) {
                    name = match[1].trim();
                    const argString = match[2].trim();
                    if (argString) {
                        args = this.parseArgs(argString);
                    }
                }
            }
            // Handle flow branches (PRESERVE EXISTING)
            else if (part === 'TRUE_FLOW' || part === 'FALSE_FLOW') {
                name = part;
                type = 'FLOW_BRANCH';
                args = [];
            }
            // Handle plain operators (PRESERVE EXISTING)
            else {
                name = part.trim();
            }
        }

        return {
            id: generateUUID(),
            pipelineId: pipelineId,
            type: type,
            name: name,
            args: args,
            value: part,
            line: lineNum,
            isTerminal: false,
        };
    }

    // PRESERVE EXISTING ARGUMENT PARSING LOGIC
    parseArgs(argString) {
        const args = [];
        let current = '';
        let braceDepth = 0;
        let parenDepth = 0;
        let quote = null;

        for (let i = 0; i < argString.length; i++) {
            const char = argString[i];

            if (char === ',' && braceDepth === 0 && parenDepth === 0 && quote === null) {
                if (current.trim()) {
                    args.push(current.trim());
                }
                current = '';
                continue;
            }

            if (char === '{' && quote === null) braceDepth++;
            if (char === '}' && quote === null) braceDepth--;
            if (char === '(' && quote === null) parenDepth++;
            if (char === ')' && quote === null) parenDepth--;

            if (char === '\'' || char === '"') {
                if (quote === char) {
                    quote = null;
                } else if (quote === null) {
                    quote = char;
                }
            }
            
            current += char;
        }

        if (current.trim()) {
            args.push(current.trim());
        }

        return args;
    }

    // 🎯 ENHANCED POOL DECLARATION PARSING (preserves existing logic)
    parsePoolDeclaration(line, lineNum, ast) {
        // 🎯 CRITICAL FIX: Better pool declaration parsing while preserving existing behavior
        const match = line.match(/let\s+(\w+)\s*=\s*<\|>\s*(.*)/);
        if (match) {
            const poolName = match[1];
            let initialValue = match[2].trim();
            
            // Handle empty initial value - preserve existing behavior
            if (!initialValue) {
                initialValue = 'null';
            }
            
            // PRESERVE EXISTING POOL DECLARATION LOGIC
            ast.pools[poolName] = {
                id: generateUUID(),
                name: poolName,
                initial: initialValue,
                line: lineNum,
                value: null
            };
            
            // 🎯 FIX: Also create a pool node for visualization (NEW but compatible)
            const poolNode = {
                id: generateUUID(),
                pipelineId: 'pool_declaration',
                type: 'POOL_DECLARATION',
                name: poolName,
                value: initialValue,
                line: lineNum,
                isTerminal: true,
            };
            ast.nodes.push(poolNode);
            
        } else {
             // PRESERVE EXISTING ERROR HANDLING
             throw new Error(`❌ Syntax Error on line ${lineNum}: Invalid pool declaration format. Expected 'let name = <|> initial_value'.`);
        }
    }
}
