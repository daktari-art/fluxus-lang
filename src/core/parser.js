// FILENAME: src/core/parser.js
// 
// Fluxus Language Graph Parser v4.4 - FIXED LENS SPLITTING

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

        // Pre-process: Remove comments and empty lines
        const cleanedLines = sourceCode
            .split('\n')
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

        for (const item of cleanedLines) {
            const { line, lineNum } = item;

            if (line.startsWith('FLOW')) {
                 continue;
            }

            if (line.includes('<|>')) {
                this.parsePoolDeclaration(line, lineNum, ast);
                continue;
            }

            if (line.includes('->') && 
                !line.startsWith('~') &&
                !line.startsWith('|') &&
                !line.startsWith('TRUE_FLOW') &&
                !line.startsWith('FALSE_FLOW')
            ) {
                this.parseSubscription(line, lineNum, ast);
                continue;
            }
            
            if (line.startsWith('~') || line.startsWith('|') || line.startsWith('TRUE_FLOW') || line.startsWith('FALSE_FLOW')) {
                
                // FIXED: Split by pipe but preserve lens expressions
                const parts = this.splitPipeline(line);
                
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
                }

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    
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
                        
                        if (operatorNode.name === 'to_pool' || operatorNode.name === 'print') {
                            operatorNode.isTerminal = true;
                        }
                    }
                }
            }
        }
        
        return ast;
    }

    // NEW: Smart pipeline splitting that preserves lens expressions
    splitPipeline(line) {
        const parts = [];
        let current = '';
        let braceDepth = 0;
        let inLens = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '{') {
                braceDepth++;
                inLens = true;
            } else if (char === '}') {
                braceDepth--;
                if (braceDepth === 0) {
                    inLens = false;
                }
            }
            
            // Split on pipe only when not inside a lens
            if (char === '|' && braceDepth === 0 && !inLens) {
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
            
            if (operatorNode.name === 'to_pool' || operatorNode.name === 'print') {
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

    parseOperator(part, lineNum, pipelineId) {
        let name = part;
        let args = [];
        let type = 'FUNCTION_OPERATOR';
        
        // FIXED: Better lens detection
        const lensMatch = part.match(/^(map|reduce|filter)\s*\{([^}]+)\}\s*$/);
        if (lensMatch) {
            name = lensMatch[1].trim();
            const lensContent = lensMatch[2].trim();
            args = [lensContent];
            type = 'LENS_OPERATOR';
        }
        // Handle standard function operators with parentheses
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
        // Handle flow branches
        else if (part === 'TRUE_FLOW' || part === 'FALSE_FLOW') {
            name = part;
            type = 'FLOW_BRANCH';
            args = [];
        }
        // Handle plain operators
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

    parsePoolDeclaration(line, lineNum, ast) {
        const match = line.match(/let\s+(\w+)\s*=\s*<\|>\s*(.*)/);
        if (match) {
            const poolName = match[1];
            const initialValue = match[2].trim();
            
            ast.pools[poolName] = {
                id: generateUUID(),
                name: poolName,
                initial: initialValue,
                line: lineNum,
                value: null
            };
        } else {
             throw new Error(`❌ Syntax Error on line ${lineNum}: Invalid pool declaration format. Expected 'let name = <|> initial_value'.`);
        }
    }
}
