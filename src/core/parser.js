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
            'number': 'DATA_NUMBER', 'string': 'DATA_STRING', 'boolean': 'DATA_BOOLEAN' 
        };
        
        this.connectionTypes = {
            '|': 'PIPE_FLOW', 
            '->': 'POOL_READ_FLOW',
            '<-': 'POOL_WRITE_FLOW'
        };
    }

    /**
     * Main entry point: Parses the entire Fluxus source code.
     * @param {string} sourceCode - The raw Fluxus source.
     * @returns {object} The Abstract Syntax Tree (AST).
     */
    parse(sourceCode) {
        const ast = {
            nodes: [],
            connections: [],
            pools: {},
            functions: {}
        };

        const lines = sourceCode.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('#'));
        let previousNodeId = null;
        let lineNum = 0;

        for (const line of lines) {
            lineNum++;
            // FIX: Use robust, single-regex tokenization
            const tokens = this.tokenize(line);
            
            if (tokens.length === 0) continue;

            // --- 1. POOL DECLARATION ---
            if (line.includes('<|>')) {
                this.parsePoolDeclaration(line, lineNum, ast);
                continue;
            }

            // --- 2. FUNCTION DEFINITION (Stub) ---
            if (line.startsWith('FUNC ')) {
                this.parseFunctionDefinition(line, lineNum, ast);
                continue;
            }
            
            // --- 3. STREAM AND FLOW ---
            let currentConnectionToken = null;
            let currentTokenIndex = 0;

            while (currentTokenIndex < tokens.length) {
                const token = tokens[currentTokenIndex];

                if (this.connectionTypes[token]) {
                    currentConnectionToken = token;
                    currentTokenIndex++;
                    continue;
                }

                // Parse the Node
                const newNode = this.parseNode(token, lineNum);
                ast.nodes.push(newNode);

                // --- CONNECTION LOGIC ---
                if (currentConnectionToken && previousNodeId) {
                    ast.connections.push({
                        id: generateUUID(),
                        type: this.connectionTypes[currentConnectionToken],
                        from: previousNodeId,
                        to: newNode.id,
                        line: lineNum
                    });
                } else if (newNode.type.startsWith('STREAM_SOURCE')) {
                    // This is the start of a pipeline
                }
                
                previousNodeId = newNode.id;
                currentConnectionToken = null;
                currentTokenIndex++;
            }
        }

        return ast;
    }

    /**
     * Tokenizes a line into meaningful parts, preserving full function calls and complex literals.
     * @param {string} line - A single line of Fluxus code.
     * @returns {string[]} An array of tokens.
     */
    tokenize(line) {
        // Regex to match tokens: 
        // 1. Literal Strings ('...' or "...")
        // 2. Complex Literals (Arrays: [...], Objects/Lenses: {...}) - CRITICAL for map/reduce
        // 3. Functions/Operators (word(...)) or Pool Sinks (to_pool(...))
        // 4. Symbols (|, ->, <-, ~)
        // 5. Everything else (numbers, words, etc.)
        const regex = /('[^']*'|"[^"]*"|\{.*?\}|\[.*?\]|to_pool\s*\(.*?\)|->|<-|\||\S+)/g;
        return line.match(regex) || [];
    }

    /**
     * Parses a single token into an AST Node object.
     */
    parseNode(token, lineNum) {
        let type = this.determineNodeType(token);
        let name = type;
        let value = token;
        let args = [];

        if (type === 'FUNCTION_OPERATOR') {
            const match = token.match(/^(\w+)\s*\((.*)\)$/);
            if (match) {
                name = match[1];
                const argsString = match[2];
                // FIX: Correctly split N-ary arguments
                args = argsString.split(',').map(a => a.trim()).filter(a => a.length > 0);
            }
        } else if (type === 'STREAM_SOURCE_FINITE' || type === 'STREAM_SOURCE_LIVE') {
            value = token.replace(/^~+\s*/, '').trim(); 
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

    /**
     * Parses a Tidal Pool Declaration: `let name = <|> initial_value`
     */
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

    /**
     * Placeholder for the function definition parser.
     */
    parseFunctionDefinition(line, lineNum, ast) {
        const match = line.match(/FUNC\s+(\w+)\s*\((.*?)\)\s*:\s*(.*)/);
        if (match) {
            const funcName = match[1];
            const args = match[2].split(',').map(a => a.trim()).filter(a => a.length > 0);
            
            ast.functions[funcName] = {
                id: generateUUID(),
                name: funcName,
                args: args,
                startLine: lineNum,
            };
        }
    }

    /**
     * Determines the node type based on the value syntax.
     */
    determineNodeType(value) {
        if (value.startsWith('~?')) return 'STREAM_SOURCE_LIVE';
        if (value.startsWith('~')) return 'STREAM_SOURCE_FINITE';
        if (value.includes('(')) return 'FUNCTION_OPERATOR';
        if (value.match(/^['"].*['"]$/)) return 'LITERAL_STRING';
        // Correctly handles Array and Object/Lens literals
        if (value.startsWith('[') || value.startsWith('{')) return 'LITERAL_COLLECTION'; 
        if (!isNaN(value) && value.trim() !== '') return 'LITERAL_NUMBER';
        
        return 'UNKNOWN_OPERATOR';
    }
}
