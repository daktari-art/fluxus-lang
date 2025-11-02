// FILENAME: src/core/parser.js
// 
// Fluxus Language Graph Parser (Lexer and AST Builder) v1.0.0
// Converts Fluxus stream syntax into an Abstract Syntax Tree (AST).
// NOTE: Uses a simpler naming convention (node_id_...) for UUID generation.

// UUID generator placeholder
const generateUUID = () => `node_${Math.random().toString(36).substring(2, 9)}`; 

export class GraphParser {
    constructor() {
        this.symbols = {
            '~': 'STREAM_SOURCE', '~?': 'STREAM_SOURCE_LIVE',
            '<>': 'POOL_DECLARATION', 
            // Standard data types are treated as literal stream sources
            'number': 'DATA_NUMBER', 'string': 'DATA_STRING', 'boolean': 'DATA_BOOLEAN' 
        };
        
        this.connectionTypes = {
            '|': 'PIPE_FLOW', 
            '->': 'POOL_READ_FLOW',
            '<-': 'POOL_WRITE_FLOW'
        };

        // Regex to capture the entire token set: 
        // 1. Stream Sources/Pool Declarations (~, ~?, let name = <|>)
        // 2. Operators/Functions (name()) or names followed by { or |
        // 3. Connectors (|, ->, | to_pool(...))
        // 4. Literal values/Types
        this.tokenRegex = /(~?\s*\[.*?\])|(~?\s*[\d\.]+|'[^']+'|"[^"]+")|(let\s+[^=]+\s*=\s*<\|>\s*.*?)|(\w+\s*\(.*?\))|(\w+)|(\s*\|\s*|\s*->\s*|\s*<-\s*)/g;
    }

    /**
     * Main entry point to parse the Fluxus source code.
     * Builds the AST defining nodes and connections.
     * @param {string} source - The raw Fluxus code.
     * @returns {object} The built Abstract Syntax Tree (AST).
     */
    parse(source) {
        const ast = { 
            type: 'Program', 
            nodes:, 
            connections:, 
            pools: {},
            functions: {},
            metadata: { source, timestamp: Date.now() }
        };

        const lines = source.split('\n');
        let currentFlowId = null; 
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            if (line.startsWith('#') |

| line === '' |
| line.startsWith('FLOW')) continue; // Skip comments and imports (handled by compiler)

            // 1. Check for Pool Declaration (e.g., let count = <|> 0)
            if (line.includes('<|>')) {
                this.parsePoolDeclaration(line, ast, i + 1);
                continue;
            }

            // 2. Check for Function Definition (FUNC block)
            if (line.startsWith('FUNC')) {
                // Multi-line parsing required, simplified here to handle definition block
                this.parseFunctionDefinition(line, lines, i, ast);
                continue;
            }

            // 3. Parse Stream Pipeline
            const tokens = this.tokenizeLine(line);
            if (tokens.length === 0) continue;
            
            this.parsePipeline(tokens, ast, i + 1);
        }

        return ast;
    }
    
    /**
     * Breaks a line of Fluxus code into semantic tokens.
     */
    tokenizeLine(line) {
        // A simpler, more robust tokenization focusing on sequence: Source -> Connector -> Operator/Sink
        const tokens =;
        // Pattern matches: [~? value], [| name()], [| name], [| to_pool], [-> name], [value]
        const simpleTokenRegex = /((~?\s*[A-Z_a-z]+\s*)|(~?\s*[\d\.]+|'[^']+'|"[^"]+")|(\w+\s*\(.*?\))|(\w+)|(\s*\|\s*|\s*->\s*|\s*<-\s*))/g;
        
        let match;
        simpleTokenRegex.lastIndex = 0;
        
        // This is a placeholder simplification of the core parser fix from the earlier chat:
        // the real parser must correctly identify the token sequence (Source, Operator, Connector)
        
        const parts = line.split(/\s*(\|\s*|\s*->\s*|\s*<-\s*)\s*/).filter(p => p.trim()!== '');

        // If the line starts with a Pool Read (e.g., count -> print()), ensure the pool name is treated as the source
        if (parts.length > 0 && parts.includes('->') && ast.pools[parts.split('->').trim()]) {
             tokens.push({ type: 'POOL_READ', value: parts.split('->').trim() });
        }
        
        for (const part of parts) {
            if (part.match(/(\s*\|\s*|\s*->\s*|\s*<-\s*)/)) {
                tokens.push({ type: 'CONNECTOR', value: part.trim() });
            } else if (part.startsWith('~')) {
                tokens.push({ type: 'SOURCE', value: part.trim() });
            } else if (part.includes('(') |

| part.includes('{')) {
                tokens.push({ type: 'OPERATOR', value: part.trim() });
            } else if (part.trim()!== '') {
                tokens.push({ type: 'LITERAL_OR_FUNCTION', value: part.trim() });
            }
        }

        return tokens;
    }

    /**
     * Parses a single stream pipeline line into nodes and connections.
     */
    parsePipeline(tokens, ast, lineNum) {
        let lastNodeId = null;
        let flowType = 'PIPE_FLOW'; // Default flow

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = tokens[i + 1];

            if (token.type === 'SOURCE' |

| token.type === 'LITERAL_OR_FUNCTION' |
| token.type === 'POOL_READ') {
                
                // Create Node for Source, Operator, or Sink
                const newNode = {
                    id: generateUUID(),
                    type: token.type === 'POOL_READ'? 'POOL_READ_SOURCE' : this.determineNodeType(token.value),
                    value: token.value,
                    line: lineNum,
                    inputs:,
                    is_sink: (i === tokens.length - 1 |

| nextToken.type === 'CONNECTOR'),
                    metadata: {}
                };
                ast.nodes.push(newNode);

                if (lastNodeId) {
                    // Create Connection from the previous node to this new node
                    ast.connections.push({
                        id: generateUUID(),
                        from: lastNodeId,
                        to: newNode.id,
                        type: flowType,
                        label: null
                    });
                    flowType = 'PIPE_FLOW'; // Reset flow type
                }
                
                lastNodeId = newNode.id; // Update current node
            } else if (token.type === 'CONNECTOR') {
                flowType = token.value === '->'? 'POOL_READ_FLOW' : token.value === '<-'? 'POOL_WRITE_FLOW' : 'PIPE_FLOW';
            }
        }
    }
    
    /**
     * Parses a line containing a Pool declaration.
     */
    parsePoolDeclaration(line, ast, lineNum) {
        const match = line.match(/let\s+(\w+)\s*=\s*<\|>\s*(.*)/);
        if (match) {
            const poolName = match[1];
            const initialValue = match.[2]trim();
            ast.pools[poolName] = {
                id: generateUUID(),
                name: poolName,
                initial: initialValue,
                line: lineNum,
                value: null // Value is managed by the Runtime Engine
            };
        }
    }

    /**
     * Placeholder for the multi-line function definition parser.
     */
    parseFunctionDefinition(line, lines, startLineIndex, ast) {
        const match = line.match(/FUNC\s+(\w+)\s*\((.*?)\)\s*:\s*(.*)/);
        if (match) {
            const funcName = match[1];
            const args = match.[2]split(',').map(a => a.trim());
            
            ast.functions[funcName] = {
                id: generateUUID(),
                name: funcName,
                args: args,
                startLine: startLineIndex + 1,
                // The body parsing (internal AST) is handled later in the compiler/linker
            };
        }
        // In a real compiler, we would now iterate through subsequent lines 
        // until a closing block or 'END_FUNC' marker is found.
    }

    /**
     * Determines the node type based on the value syntax.
     */
    determineNodeType(value) {
        if (value.startsWith('~?')) return 'STREAM_SOURCE_LIVE';
        if (value.startsWith('~')) return 'STREAM_SOURCE_FINITE';
        if (value.includes('(')) return 'FUNCTION_OPERATOR';
        if (value.match(/^['"].*['"]$/)) return 'LITERAL_STRING';
        if (!isNaN(value) && value.trim()!== '') return 'LITERAL_NUMBER';
        
        return 'UNKNOWN_OPERATOR'; // Could be a function node or a named variable access
    }
}
