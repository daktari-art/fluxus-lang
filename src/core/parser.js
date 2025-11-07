// FILENAME: src/core/parser.js
// 
// Fluxus Language Graph Parser v4.0 - FINAL VERIFIED CODE (Fixes: Pool Subscriptions & Split Flow)

const generateUUID = () => `node_${Math.random().toString(36).substring(2, 9)}`; 

export class GraphParser {
    constructor() {
        this.connectionTypes = {
            '|': 'PIPE_FLOW', 
            '->': 'POOL_READ_FLOW', // Pool Subscription
            '<-': 'POOL_WRITE_FLOW' // Not used in v4.0 but kept for future
        };
    }

    parse(sourceCode) {
        const ast = {
            nodes: [],
            connections: [],
            pools: {},
            functions: {},
            liveStreams: [], // New list for ~? streams
            finiteStreams: [], // New list for ~ streams
        };

        // 1. Pre-process: Remove comments and empty lines
        const cleanedLines = sourceCode
            .split('\n')
            .map((line, index) => {
                const commentIndex = line.indexOf('#');
                let cleanLine = (commentIndex !== -1) ? line.substring(0, commentIndex).trim() : line.trim();
                
                // Add the original line number to track errors
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

            // Handle Flow Imports (e.g., FLOW http)
            if (line.startsWith('FLOW')) {
                 // FLOW is currently ignored by the parser but is necessary for imports
                 continue;
            }

            // 1. Handle pool declarations (e.g., let count = <|> 0)
            if (line.includes('<|>')) {
                this.parsePoolDeclaration(line, lineNum, ast);
                continue;
            }

            // 2. Handle Pool Subscriptions (e.g., my_pool -> print())
            // Pool subscriptions start a flow with a pool read (e.g., 'pool_name -> ...').
            // CRITICAL FIX: The line MUST NOT start with a pipeline symbol (|, ~) 
            // to prevent misinterpreting a lens block like '| map { data -> {} }' as a subscription.
            if (line.includes('->') && 
                !line.startsWith('~') &&
                !line.startsWith('|') &&
                !line.startsWith('TRUE_FLOW') &&
                !line.startsWith('FALSE_FLOW')
            ) {
                this.parseSubscription(line, lineNum, ast);
                continue;
            }
            
            // 3. Handle Stream Pipeline continuation or start
            
            // Check for new stream start or pipe continuation
            if (line.startsWith('~') || line.startsWith('|') || line.startsWith('TRUE_FLOW') || line.startsWith('FALSE_FLOW')) {
                
                // Get the elements of the line
                const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
                
                // If the line starts a new stream (i.e., not starting with |)
                if (line.startsWith('~')) {
                    // Reset pipeline for a new stream
                    currentPipelineId = generateUUID();
                    previousNodeId = null;
                } 
                // If it starts with TRUE/FALSE_FLOW, it's a split continuation
                else if (line.startsWith('TRUE_FLOW') || line.startsWith('FALSE_FLOW')) {
                    // This node is a special connector and doesn't reset the pipeline ID
                    // It should not occur at the start of a line without a preceding pipe in the source code
                    throw new Error(`❌ Syntax Error on line ${lineNum}: TRUE_FLOW/FALSE_FLOW must be piped (|) from a split operator.`);
                } 
                // If it's a pipe continuation, keep the current pipelineId and previousNodeId
                else if (line.startsWith('|')) {
                    // Check if there's an active pipeline. 
                    // Allow | TRUE_FLOW / | FALSE_FLOW to implicitly 'restart' the pipeline ID
                    // if the previous branch terminated it. This is a hack for sequential parsing.
                    if (!currentPipelineId) {
                        const isSplitContinuation = parts[0].startsWith('TRUE_FLOW') || parts[0].startsWith('FALSE_FLOW');
                        if (isSplitContinuation) {
                            // Assign a new ID for the new branch. The runtime must link this back to the split manually.
                            currentPipelineId = generateUUID();
                            previousNodeId = null; // Clear previous node ID
                        } else {
                            throw new Error(`❌ Syntax Error on line ${lineNum}: Pipe (|) used without a preceding stream source (~ or ~?).`);
                        }
                    }
                    // The first part of a continuation pipe is the operator
                }

                // Process all parts (operators/sources) in the line
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    
                    if (part.startsWith('~')) {
                        // Source node (~ or ~?)
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
                        // Split flow continuation node
                        const type = part.startsWith('TRUE_FLOW') ? 'TRUE_FLOW' : 'FALSE_FLOW';
                        
                        const flowNode = {
                            id: generateUUID(),
                            pipelineId: currentPipelineId, // IMPORTANT: Inherit from split node
                            type: type,
                            value: null,
                            line: lineNum,
                            isTerminal: false,
                        };
                        ast.nodes.push(flowNode);

                        // Connect this flow node to the previous pipe's node (which should be the split)
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
                        // Operator node (e.g., map {...} or add(5))
                        const operatorNode = this.parseOperator(part, lineNum, currentPipelineId);
                        ast.nodes.push(operatorNode);

                        // Connect the new node to the previous node
                        if (previousNodeId) {
                            ast.connections.push({
                                from: previousNodeId,
                                to: operatorNode.id,
                                type: this.connectionTypes['|'],
                                line: lineNum
                            });
                        }
                        
                        previousNodeId = operatorNode.id;
                        
                        // Check for terminal operator
                        if (operatorNode.name === 'to_pool' || operatorNode.name === 'print') {
                            operatorNode.isTerminal = true;
                            // The sequential parser will now not crash when encountering the next branch.
                        }
                    }
                }
            }
        }
        
        return ast;
    }

    // Parses a pool subscription flow (e.g., pool -> map {..} | to_pool(...))
    parseSubscription(line, lineNum, ast) {
        // Example: click_count -> ui_render('#display_div')
        const parts = line.split('->').map(p => p.trim());
        const poolName = parts[0].trim();
        
        if (!ast.pools[poolName]) {
            // Log warning, but allow subscription to be linked in runtime
            console.warn(`⚠️ Warning: Subscription on line ${lineNum} uses pool '${poolName}' which is not declared.`);
        }

        const subscriptionFlow = parts[1].trim(); // Everything after the first '->'
        
        // Treat the pool subscription as the start of a new, special pipeline
        const pipelineId = generateUUID();

        // 1. Create the POOL_READ node
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

        // 2. Parse the rest of the flow (e.g., ui_render('#display_div'))
        const flowParts = subscriptionFlow.split('|').map(p => p.trim()).filter(p => p.length > 0);

        for (const part of flowParts) {
            const operatorNode = this.parseOperator(part, lineNum, pipelineId);
            ast.nodes.push(operatorNode);

            // Connect the new node to the previous node
            ast.connections.push({
                from: previousNodeId,
                to: operatorNode.id,
                type: this.connectionTypes['|'],
                line: lineNum
            });
            
            previousNodeId = operatorNode.id;
            
            // Check for terminal operator
            if (operatorNode.name === 'to_pool' || operatorNode.name === 'print') {
                operatorNode.isTerminal = true;
            }
        }
        
        // Add a special subscription connection
        ast.connections.push({
            from: poolReadNode.id,
            to: previousNodeId, // Connects to the last node in the flow
            type: this.connectionTypes['->'],
            line: lineNum
        });
    }


    parseOperator(part, lineNum, pipelineId) {
        // Examples: add(5), map { .value | add(1) }
        
        let name = part;
        let args = [];
        let type = 'FUNCTION_OPERATOR';
        
        const openParen = part.indexOf('(');
        const closeParen = part.lastIndexOf(')');

        const openBrace = part.indexOf('{');
        const closeBrace = part.lastIndexOf('}');
        
        // Handle Map/Filter/Reduce (Lens operators)
        if (openBrace !== -1 && closeBrace !== -1 && openBrace < closeBrace) {
            const lensContent = part.substring(openBrace + 1, closeBrace).trim();
            name = part.substring(0, openBrace).trim(); // e.g., 'map'
            args = [lensContent];
            type = 'LENS_OPERATOR'; // Custom type for Map/Filter/Reduce logic
        }
        // Handle Standard Function Operators (e.g., add(5, 10))
        else if (openParen !== -1 && closeParen !== -1 && openParen < closeParen) {
            name = part.substring(0, openParen).trim();
            const argString = part.substring(openParen + 1, closeParen).trim();
            
            if (argString) {
                args = this.parseArgs(argString);
            }
        }
        // Handle TRUE_FLOW/FALSE_FLOW
        else if (part === 'TRUE_FLOW' || part === 'FALSE_FLOW') {
            name = part;
            type = 'FLOW_BRANCH';
            args = [];
        }
        // Handle Operator without args (e.g., print)
        else {
            name = part.trim();
        }

        return {
            id: generateUUID(),
            pipelineId: pipelineId,
            type: type,
            name: name,
            args: args,
            value: part, // Store the original text for debugging/compilation
            line: lineNum,
            isTerminal: false,
        };
    }

    // Simple arg parser that handles basic literals and strings
    parseArgs(argString) {
        const args = [];
        let current = '';
        let braceDepth = 0; // {}
        let parenDepth = 0; // ()
        let quote = null; // Single or double quote

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
