// FILENAME: src/core/parser.js
// 
// Fluxus Language Graph Parser - FIXED Stream Source with Pipe Handling

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
        const cleanedCode = sourceCode
            .split('\n')
            .map(line => {
                const commentIndex = line.indexOf('#');
                if (commentIndex !== -1) {
                    return line.substring(0, commentIndex).trim();
                }
                return line.trim();
            })
            .filter(line => line.length > 0)
            .join('\n');

        const lines = cleanedCode.split('\n');
        let previousNodeId = null;

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum].trim();
            if (!line) continue;

            // Handle pool declarations
            if (line.includes('<|>')) {
                this.parsePoolDeclaration(line, lineNum + 1, ast);
                continue;
            }

            // SPECIAL FIX: Handle stream sources and parse the entire pipeline
            if (line.startsWith('~')) {
                previousNodeId = this.parseStreamPipeline(line, lineNum + 1, ast);
                continue;
            }

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
     * FIXED: Parse entire stream pipelines including pipes
     * Example: ~ "Hello, World!" | print()
     */
    parseStreamPipeline(line, lineNum, ast) {
        // Extract everything after the ~
        const pipelineContent = line.substring(1).trim();
        
        // Tokenize the pipeline content to handle pipes
        const tokens = this.tokenizeLine(pipelineContent);
        if (tokens.length === 0) return null;

        let previousNodeId = null;
        let currentConnection = null;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (this.connectionTypes[token]) {
                currentConnection = token;
                continue;
            }

            // First token is the stream data, create as stream source
            if (i === 0) {
                const streamNode = {
                    id: generateUUID(),
                    type: 'STREAM_SOURCE_FINITE',
                    name: 'STREAM_SOURCE_FINITE', 
                    value: token,  // The actual stream data
                    args: [],
                    line: lineNum
                };
                ast.nodes.push(streamNode);
                previousNodeId = streamNode.id;
            } else {
                // Subsequent tokens are operators
                const newNode = this.parseNode(token, lineNum);
                if (newNode) {
                    ast.nodes.push(newNode);

                    if (currentConnection && previousNodeId) {
                        ast.connections.push({
                            id: generateUUID(),
                            type: this.connectionTypes[currentConnection],
                            from: previousNodeId,
                            to: newNode.id,
                            line: lineNum
                        });
                    }

                    previousNodeId = newNode.id;
                    currentConnection = null;
                }
            }
        }

        return previousNodeId;
    }

    tokenizeLine(line) {
        const tokens = [];
        let current = '';
        let inString = false;
        let inBrace = 0;
        let inParen = 0;
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
            } else if (char === '(') {
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
            else if ((char === '|' || char === '-' || char === '<') && inBrace === 0 && inParen === 0) {
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
            else if (char === ' ' && inBrace === 0 && inParen === 0) {
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
            const match = token.match(/^(\w+)\((.*)\)$/);
            if (match) {
                name = match[1];
                const argsString = match[2];
                args = this.splitArgs(argsString);
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
        if (value.match(/^\w+\(.*\)$/)) return 'FUNCTION_OPERATOR';
        if (value.match(/^['"].*['"]$/)) return 'LITERAL_STRING';
        if (value.startsWith('[') && value.endsWith(']')) return 'LITERAL_COLLECTION';
        if (value.startsWith('{') && value.endsWith('}')) return 'LITERAL_COLLECTION';
        if (!isNaN(value) && value.trim() !== '') return 'LITERAL_NUMBER';
        if (value === 'true' || value === 'false') return 'LITERAL_BOOLEAN';
        
        return 'UNKNOWN_OPERATOR';
    }
}
