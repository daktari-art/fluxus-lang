// FILENAME: src/core/parser.js
// Fluxus Language Graph Parser v6.0 - CLEAN VERSION (No Debug Logs)

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
            imports: [],
            functions: {},
            liveStreams: [],
            finiteStreams: [],
        };

        const lines = this.preprocessSource(sourceCode);
        let currentPipeline = null;

        for (const { line, lineNum } of lines) {
            // Handle imports
            if (this.isImport(line)) {
                this.parseImport(line, lineNum, ast);
                continue;
            }

            // Handle pool declarations
            if (this.isPoolDeclaration(line)) {
                this.parsePoolDeclaration(line, lineNum, ast);
                continue;
            }

            // Handle subscriptions
            if (this.isSubscription(line)) {
                this.parseSubscription(line, lineNum, ast);
                continue;
            }

            // Handle stream pipelines
            if (this.isStreamPipeline(line)) {
                currentPipeline = this.parseStreamPipeline(line, lineNum, ast, currentPipeline);
            } else if (currentPipeline && this.isPipelineContinuation(line)) {
                // Continue existing pipeline
                this.extendPipeline(line, lineNum, ast, currentPipeline);
            } else {
                // Reset pipeline if we hit a non-pipeline line
                currentPipeline = null;
            }
        }

        return ast;
    }

    preprocessSource(sourceCode) {
        const lines = sourceCode.split('\n');
        const processed = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            if (line.startsWith('#')) continue;

            const commentIndex = line.indexOf('#');
            if (commentIndex !== -1) {
                line = line.substring(0, commentIndex).trim();
            }

            if (line) {
                processed.push({ line, lineNum: i + 1 });
            }
        }

        return processed;
    }

    isImport(line) {
        return line.startsWith('FLOW') || line.startsWith('IMPORT');
    }

    parseImport(line, lineNum, ast) {
        if (line.startsWith('FLOW')) {
            const flowMatch = line.match(/FLOW\s+(\w+)/);
            if (flowMatch) {
                ast.imports.push(flowMatch[1]);
            }
        } else if (line.startsWith('IMPORT')) {
            const importMatch = line.match(/IMPORT\s+(\w+)\s+FROM\s+"([^"]+)"/);
            if (importMatch) {
                ast.imports.push({
                    alias: importMatch[1],
                    path: importMatch[2]
                });
            }
        }
    }

    isPoolDeclaration(line) {
        return line.includes('<|>');
    }

    parsePoolDeclaration(line, lineNum, ast) {
        const match = line.match(/let\s+(\w+)\s*=\s*<\|>\s*(.*)/);
        if (match) {
            const poolName = match[1];
            let initialValue = match[2].trim() || 'null';
            
            ast.pools[poolName] = {
                id: generateUUID(),
                name: poolName,
                initial: initialValue,
                line: lineNum,
                value: null
            };
        }
    }

    isSubscription(line) {
        return line.includes('->') && 
               !line.startsWith('~') && 
               !line.startsWith('|') &&
               !line.startsWith('TRUE_FLOW') && 
               !line.startsWith('FALSE_FLOW');
    }

    parseSubscription(line, lineNum, ast) {
        const parts = line.split('->').map(p => p.trim());
        const poolName = parts[0].trim();
        
        if (!ast.pools[poolName]) {
            console.warn(`⚠️ Subscription uses undeclared pool: ${poolName}`);
        }

        const subscriptionFlow = parts[1].trim();
        const pipelineId = generateUUID();

        const poolReadNode = {
            id: generateUUID(),
            pipelineId: pipelineId,
            type: 'POOL_READ',
            name: 'POOL_READ',
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
            
            if (this.isTerminalOperator(operatorNode.name)) {
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

    isStreamPipeline(line) {
        return line.startsWith('~') || 
               (line.includes('|') && !this.isSubscription(line));
    }

    isPipelineContinuation(line) {
        return line.startsWith('|') || 
               line.startsWith('TRUE_FLOW') || 
               line.startsWith('FALSE_FLOW');
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
                const operatorNode = this.parseOperator(part, lineNum, pipelineId);
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
                
                if (this.isTerminalOperator(operatorNode.name)) {
                    operatorNode.isTerminal = true;
                }
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

    parseOperator(part, lineNum, pipelineId) {
        let name = part;
        let args = [];
        let type = 'FUNCTION_OPERATOR';

        const lensOperators = ['map', 'reduce', 'filter', 'split'];
        const lensPattern = /^(\w+)\s*\{([^}]*)\}\s*$/;
        const lensMatch = part.match(lensPattern);
        
        if (lensMatch && lensOperators.includes(lensMatch[1])) {
            name = lensMatch[1].trim();
            const lensContent = lensMatch[2].trim();
            args = [lensContent];
            type = 'LENS_OPERATOR';
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
        }
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
        else if (part === 'TRUE_FLOW' || part === 'FALSE_FLOW') {
            name = part;
            type = 'FLOW_BRANCH';
            args = [];
        }
        else {
            name = part.trim();
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

    splitPipeline(line) {
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

    isTerminalOperator(operatorName) {
        return operatorName === 'to_pool' || 
               operatorName === 'print' || 
               operatorName === 'ui_render';
    }
}
