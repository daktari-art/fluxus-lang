// FILENAME: src/core/parser.js
// 
// Fluxus Language Graph Parser - FIXED Stream Source Node Creation

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
            functions: {}
        };

        // Remove ALL comments first
        const cleanedLines = sourceCode
            .split('\n')
            .map(line => {
                const commentIndex = line.indexOf('#');
                if (commentIndex !== -1) {
                    return line.substring(0, commentIndex).trim();
                }
                return line.trim();
            })
            .filter(line => line.length > 0);

        let currentPipelineId = null;
        let previousNodeId = null;

        for (let lineNum = 0; lineNum < cleanedLines.length; lineNum++) {
            const line = cleanedLines[lineNum];
            if (!line) continue;

            // Handle pool declarations
            if (line.includes('<|>')) {
                this.parsePoolDeclaration(line, lineNum + 1, ast);
                continue;
            }

            // Handle new stream sources - start a new pipeline
            if (line.startsWith('~')) {
                const result = this.parseStreamPipeline(line, lineNum + 1, ast);
                currentPipelineId = result.pipelineId;
                previousNodeId = result.lastNodeId;
                continue;
            }

            // Handle pipeline continuations (lines starting with |)
            if (line.startsWith('|') && previousNodeId) {
                previousNodeId = this.parsePipelineContinuation(line, lineNum + 1, previousNodeId, ast);
                continue;
            }

            // Handle other lines (like variable assignments, etc.)
            const tokens = this.tokenizeLine(line);
            if (tokens.length === 0) continue;

            let currentConnection = null;
            
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                
                if (this.connectionTypes[token]) {
                    currentConnection = token;
                    continue;
                }

                const newNode = this.parseNode(token, lineNum + 1);
                if (newNode) {
                    ast.nodes.push(newNode);

                    if (currentConnection && previousNodeId) {
                        ast.connections.push({
                            id: generateUUID(),
                            type: this.connectionTypes[currentConnection],
                            from: previousNodeId,
                            to: newNode.id,
                            line: lineNum + 1
                        });
                    }

                    previousNodeId = newNode.id;
                    currentConnection = null;
                }
            }
        }

        return ast;
    }

    /**
     * Parse entire stream pipelines including pipes
     * Returns: { pipelineId, lastNodeId }
     */
    parseStreamPipeline(line, lineNum, ast) {
        const pipelineContent = line.substring(1).trim();
        const processedContent = this.preprocessMapReduce(pipelineContent);
        const tokens = this.tokenizeLine(processedContent);
        
        if (tokens.length === 0) return { pipelineId: null, lastNodeId: null };

        let pipelineId = null;
        let lastNodeId = null;
        let currentConnection = null;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (this.connectionTypes[token]) {
                currentConnection = token;
                continue;
            }

            const newNode = this.parseNode(token, lineNum);
            if (newNode) {
                ast.nodes.push(newNode);

                if (i === 0) {
                    // First token is the stream source - create as STREAM_SOURCE_FINITE
                    const streamNode = {
                        id: newNode.id, // Use same ID
                        type: 'STREAM_SOURCE_FINITE',
                        name: 'STREAM_SOURCE_FINITE',
                        value: newNode.value, // The actual data
                        args: [],
                        line: lineNum
                    };
                    // Replace the node in the array
                    const nodeIndex = ast.nodes.findIndex(n => n.id === newNode.id);
                    ast.nodes[nodeIndex] = streamNode;
                    pipelineId = streamNode.id;
                    lastNodeId = streamNode.id;
                } else if (currentConnection && lastNodeId) {
                    // Connect to previous node in pipeline
                    ast.connections.push({
                        id: generateUUID(),
                        type: this.connectionTypes[currentConnection],
                        from: lastNodeId,
                        to: newNode.id,
                        line: lineNum
                    });
                    lastNodeId = newNode.id;
                }

                currentConnection = null;
            }
        }

        return { pipelineId, lastNodeId };
    }

    /**
     * Parse pipeline continuation lines (lines starting with |)
     */
    parsePipelineContinuation(line, lineNum, previousNodeId, ast) {
        const pipelineContent = line.substring(1).trim();
        const processedContent = this.preprocessMapReduce(pipelineContent);
        const tokens = this.tokenizeLine(processedContent);
        
        if (tokens.length === 0) return previousNodeId;

        let currentConnection = '|';
        let lastNodeId = previousNodeId;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (this.connectionTypes[token]) {
                currentConnection = token;
                continue;
            }

            const newNode = this.parseNode(token, lineNum);
            if (newNode) {
                ast.nodes.push(newNode);

                if (currentConnection && lastNodeId) {
                    ast.connections.push({
                        id: generateUUID(),
                        type: this.connectionTypes[currentConnection],
                        from: lastNodeId,
                        to: newNode.id,
                        line: lineNum
                    });
                }

                lastNodeId = newNode.id;
                currentConnection = null;
            }
        }

        return lastNodeId;
    }

    /**
     * PREPROCESS: Convert map/reduce with lenses into function calls
     */
    preprocessMapReduce(content) {
        content = content.replace(/(map|reduce)\s*\{([^}]+)\}/g, (match, operator, lens) => {
            return `${operator}_LENS(${lens.trim()})`;
        });
        return content;
    }

    tokenizeLine(line) {
        const tokens = [];
        let current = '';
        let inString = false;
        let inBrace = 0;
        let inParen = 0;
        let inBracket = 0;
        let stringChar = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if ((char === '"' || char === "'") && !inString) {
                inString = true;
                stringChar = char;
                current += char;
            } else if (inString && char === stringChar) {
                inString = false;
                current += char;
                tokens.push(current);
                current = '';
            } else if (inString) {
                current += char;
            }
            else if (char === '{') {
                inBrace++;
                current += char;
            } else if (char === '}') {
                inBrace--;
                current += char;
                if (inBrace === 0) {
                    tokens.push(current);
                    current = '';
                }
            }
            else if (char === '[') {
                inBracket++;
                current += char;
            } else if (char === ']') {
                inBracket--;
                current += char;
                if (inBracket === 0) {
                    tokens.push(current);
                    current = '';
                }
            }
            else if (char === '(') {
                inParen++;
                current += char;
            } else if (char === ')') {
                inParen--;
                current += char;
                if (inParen === 0) {
                    tokens.push(current);
                    current = '';
                }
            }
            else if ((char === '|' || char === '-' || char === '<') && inBrace === 0 && inParen === 0 && inBracket === 0) {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
                if (char === '-' && nextChar === '>') {
                    tokens.push('->');
                    i++;
                } else if (char === '<' && nextChar === '-') {
                    tokens.push('<-');
                    i++;
                } else if (char === '|') {
                    tokens.push('|');
                }
            }
            else if (char === ' ' && inBrace === 0 && inParen === 0 && inBracket === 0) {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            tokens.push(current.trim());
        }

        return tokens;
    }

    parseNode(token, lineNum) {
        if (!token || token === '#' || token.startsWith('#')) {
            return null;
        }

        let type = this.determineNodeType(token);
        let name = type;
        let value = token;
        let args = [];

        if (type === 'FUNCTION_OPERATOR') {
            const match = token.match(/^(\w+)_LENS\((.*)\)$/);
            if (match) {
                name = match[1];
                const lensContent = match[2];
                args = [lensContent];
                value = `${name} {${lensContent}}`;
            } else {
                const standardMatch = token.match(/^(\w+)\((.*)\)$/);
                if (standardMatch) {
                    name = standardMatch[1];
                    const argsString = standardMatch[2];
                    args = this.splitArgs(argsString);
                }
            }
        }

        return {
            id: generateUUID(),
            type,
            name,
            value,
            args,
            line: lineNum
        };
    }

    splitArgs(argsString) {
        if (!argsString.trim()) return [];
        
        const args = [];
        let current = '';
        let depth = 0;

        for (let i = 0; i < argsString.length; i++) {
            const char = argsString[i];
            
            if (char === '(' || char === '[' || char === '{') depth++;
            else if (char === ')' || char === ']' || char === '}') depth--;
            else if (char === ',' && depth === 0) {
                args.push(current.trim());
                current = '';
                continue;
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
        }
    }

    determineNodeType(value) {
        if (value.startsWith('~?')) return 'STREAM_SOURCE_LIVE';
        if (value.startsWith('~')) return 'STREAM_SOURCE_FINITE';
        if (value.match(/^\w+_LENS\(.*\)$/)) return 'FUNCTION_OPERATOR';
        if (value.match(/^\w+\(.*\)$/)) return 'FUNCTION_OPERATOR';
        if (value.match(/^['"].*['"]$/)) return 'LITERAL_STRING';
        if (value.startsWith('[') && value.endsWith(']')) return 'LITERAL_COLLECTION';
        if (value.startsWith('{') && value.endsWith('}')) return 'LITERAL_COLLECTION';
        if (!isNaN(value) && value.trim() !== '') return 'LITERAL_NUMBER';
        if (value === 'true' || value === 'false') return 'LITERAL_BOOLEAN';
        
        return 'UNKNOWN_OPERATOR';
    }
}
