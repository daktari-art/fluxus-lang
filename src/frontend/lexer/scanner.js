// Production Lexer with Unicode & Comprehensive Error Recovery
import { LexerError } from '../errors.js';

export class Scanner {
    constructor(source, filename = '<anonymous>') {
        this.source = source;
        this.filename = filename;
        this.tokens = [];
        this.errors = [];
        
        // Scanning state
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.column = 1;
        this.indentation = [0]; // For Python-style indentation tracking
        
        // Context tracking
        this.inTemplate = false;
        this.braceDepth = 0;
        this.parenDepth = 0;
    }

    scanTokens() {
        try {
            while (!this.isAtEnd()) {
                this.start = this.current;
                this.scanToken();
            }
            
            // Add final tokens
            this.addToken('EOF', null);
            
            return {
                tokens: this.tokens,
                errors: this.errors,
                hasErrors: this.errors.length > 0
            };
            
        } catch (error) {
            this.error(`Lexer crashed: ${error.message}`);
            return { tokens: [], errors: this.errors, hasErrors: true };
        }
    }

    scanToken() {
        const char = this.advance();
        
        switch (char) {
            // Single-character tokens
            case '~': 
                this.addToken(this.match('?') ? 'STREAM_LIVE' : 'STREAM_FINITE');
                break;
            case '|': this.addToken('PIPE'); break;
            case '(': this.addToken('LPAREN'); this.parenDepth++; break;
            case ')': this.addToken('RPAREN'); this.parenDepth--; break;
            case '{': this.addToken('LBRACE'); this.braceDepth++; break;
            case '}': this.addToken('RBRACE'); this.braceDepth--; break;
            case '[': this.addToken('LBRACKET'); break;
            case ']': this.addToken('RBRACKET'); break;
            case ',': this.addToken('COMMA'); break;
            case '.': this.addToken('DOT'); break;
            case ':': this.addToken('COLON'); break;
            case ';': this.addToken('SEMICOLON'); break;
            
            // Multi-character tokens
            case '=':
                this.addToken(this.match('=') ? 'EQUAL_EQUAL' : 'EQUAL');
                break;
            case '!':
                this.addToken(this.match('=') ? 'BANG_EQUAL' : 'BANG');
                break;
            case '<':
                if (this.match('|')) {
                    if (this.match('>')) {
                        this.addToken('POOL_OPERATOR');
                    } else {
                        this.error('Expected ">" after "<|"');
                    }
                } else {
                    this.addToken(this.match('=') ? 'LESS_EQUAL' : 'LESS');
                }
                break;
            case '>':
                this.addToken(this.match('=') ? 'GREATER_EQUAL' : 'GREATER');
                break;
            case '&':
                this.addToken(this.match('&') ? 'AND' : 'BIT_AND');
                break;
            case '|':
                this.addToken(this.match('|') ? 'OR' : 'BIT_OR');
                break;
            case '+':
                this.addToken(this.match('=') ? 'PLUS_EQUAL' : 'PLUS');
                break;
            case '-':
                this.addToken(this.match('=') ? 'MINUS_EQUAL' : 'MINUS');
                break;
            case '*':
                this.addToken(this.match('=') ? 'STAR_EQUAL' : 'STAR');
                break;
            case '/':
                if (this.match('/')) {
                    // Line comment
                    while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
                } else if (this.match('*')) {
                    // Block comment
                    this.blockComment();
                } else {
                    this.addToken(this.match('=') ? 'SLASH_EQUAL' : 'SLASH');
                }
                break;
                
            // Whitespace
            case ' ':
            case '\r':
            case '\t':
                break;
                
            case '\n':
                this.handleNewline();
                break;
                
            // String literals
            case '"':
            case "'":
                this.string(char);
                break;
                
            case '`':
                this.templateString();
                break;
                
            // Numbers
            default:
                if (this.isDigit(char)) {
                    this.number();
                } else if (this.isAlpha(char)) {
                    this.identifier();
                } else {
                    this.error(`Unexpected character: '${char}'`);
                }
                break;
        }
    }

    // Token production methods
    identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        
        const text = this.source.substring(this.start, this.current);
        const type = KEYWORDS.get(text) || 'IDENTIFIER';
        this.addToken(type);
    }

    number() {
        // Integer part
        while (this.isDigit(this.peek())) this.advance();

        // Fractional part
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance(); // Consume '.'
            while (this.isDigit(this.peek())) this.advance();
        }

        // Scientific notation
        if (this.peek().toLowerCase() === 'e') {
            this.advance(); // Consume 'e'
            if (this.peek() === '+' || this.peek() === '-') {
                this.advance(); // Consume sign
            }
            while (this.isDigit(this.peek())) this.advance();
        }

        const value = parseFloat(this.source.substring(this.start, this.current));
        this.addToken('NUMBER', value);
    }

    string(quote) {
        while (this.peek() !== quote && !this.isAtEnd()) {
            if (this.peek() === '\n') {
                this.line++;
                this.column = 1;
            } else if (this.peek() === '\\') {
                this.advance(); // Consume backslash
                this.escapeSequence();
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            this.error('Unterminated string');
            return;
        }

        this.advance(); // Closing quote
        
        // Extract string value (without quotes)
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken('STRING', value);
    }

    templateString() {
        this.inTemplate = true;
        
        while ((this.peek() !== '`' || this.peekPrevious() === '\\') && !this.isAtEnd()) {
            if (this.peek() === '\n') {
                this.line++;
                this.column = 1;
            } else if (this.peek() === '$' && this.peekNext() === '{') {
                // Template interpolation
                this.advance(); // Consume '$'
                this.advance(); // Consume '{'
                this.addToken('TEMPLATE_START');
                return; // Return to scan expression
            } else if (this.peek() === '\\') {
                this.advance(); // Consume backslash
                this.escapeSequence();
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            this.error('Unterminated template string');
            return;
        }

        this.advance(); // Closing backtick
        this.inTemplate = false;
        
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken('TEMPLATE_STRING', value);
    }

    blockComment() {
        let depth = 1;
        
        while (depth > 0 && !this.isAtEnd()) {
            if (this.peek() === '\n') {
                this.line++;
                this.column = 1;
            } else if (this.peek() === '/' && this.peekNext() === '*') {
                this.advance(); // Consume '/'
                this.advance(); // Consume '*'
                depth++;
            } else if (this.peek() === '*' && this.peekNext() === '/') {
                this.advance(); // Consume '*'
                this.advance(); // Consume '/'
                depth--;
            } else {
                this.advance();
            }
        }

        if (depth > 0) {
            this.error('Unterminated block comment');
        }
    }

    escapeSequence() {
        const escapeChar = this.peek();
        switch (escapeChar) {
            case 'n': case 'r': case 't': case '\\': case '"': case "'": case '`':
                this.advance();
                break;
            case 'u':
                // Unicode escape
                this.advance();
                for (let i = 0; i < 4; i++) {
                    if (!this.isHexDigit(this.peek())) {
                        this.error('Invalid Unicode escape sequence');
                        break;
                    }
                    this.advance();
                }
                break;
            default:
                this.error(`Invalid escape sequence: \\${escapeChar}`);
                break;
        }
    }

    handleNewline() {
        this.line++;
        this.column = 1;
        
        // Handle indentation (Python-style)
        let indent = 0;
        while (this.peek() === ' ' && !this.isAtEnd()) {
            this.advance();
            indent++;
        }
        
        if (this.peek() === '\t') {
            this.error('Tabs are not allowed for indentation');
        }
        
        const currentIndent = this.indentation[this.indentation.length - 1];
        if (indent > currentIndent) {
            this.addToken('INDENT');
            this.indentation.push(indent);
        } else if (indent < currentIndent) {
            while (this.indentation.length > 1 && this.indentation[this.indentation.length - 1] > indent) {
                this.addToken('DEDENT');
                this.indentation.pop();
            }
            if (this.indentation[this.indentation.length - 1] !== indent) {
                this.error('Indentation mismatch');
            }
        }
    }

    // Utility methods
    isAtEnd() { return this.current >= this.source.length; }
    advance() { 
        this.column++;
        return this.source[this.current++]; 
    }
    peek() { return this.isAtEnd() ? '\0' : this.source[this.current]; }
    peekNext() { return this.current + 1 >= this.source.length ? '\0' : this.source[this.current + 1]; }
    peekPrevious() { return this.current === 0 ? '\0' : this.source[this.current - 1]; }
    
    match(expected) {
        if (this.isAtEnd() || this.source[this.current] !== expected) return false;
        this.current++;
        this.column++;
        return true;
    }
    
    isDigit(char) { return char >= '0' && char <= '9'; }
    isAlpha(char) { 
        return (char >= 'a' && char <= 'z') || 
               (char >= 'A' && char <= 'Z') || 
               char === '_' || 
               char === '$' ||
               (char.charCodeAt(0) > 127); // Unicode identifiers
    }
    isAlphaNumeric(char) { return this.isAlpha(char) || this.isDigit(char); }
    isHexDigit(char) {
        return (char >= '0' && char <= '9') ||
               (char >= 'a' && char <= 'f') ||
               (char >= 'A' && char <= 'F');
    }

    addToken(type, literal = null) {
        const text = this.source.substring(this.start, this.current);
        const token = {
            type,
            lexeme: text,
            literal,
            line: this.line,
            column: this.column - text.length,
            filename: this.filename
        };
        this.tokens.push(token);
    }

    error(message) {
        const error = new LexerError(
            message,
            this.filename,
            this.line,
            this.column - (this.current - this.start)
        );
        this.errors.push(error);
        
        // Error recovery: skip to next line
        while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
        }
    }
}

// Comprehensive keyword table
const KEYWORDS = new Map([
    // Declarations
    ['let', 'LET'],
    ['FLOW', 'FLOW'],
    ['FUNC', 'FUNC'],
    
    // Control flow
    ['if', 'IF'],
    ['else', 'ELSE'],
    ['match', 'MATCH'],
    ['for', 'FOR'],
    ['while', 'WHILE'],
    ['break', 'BREAK'],
    ['continue', 'CONTINUE'],
    ['return', 'RETURN'],
    
    // Stream control
    ['TRUE_FLOW', 'TRUE_FLOW'],
    ['FALSE_FLOW', 'FALSE_FLOW'],
    ['RESULT', 'RESULT'],
    ['END', 'END'],
    
    // Literals
    ['true', 'TRUE'],
    ['false', 'FALSE'],
    ['null', 'NULL'],
    
    // Types
    ['Number', 'TYPE_NUMBER'],
    ['String', 'TYPE_STRING'],
    ['Boolean', 'TYPE_BOOLEAN'],
    ['Stream', 'TYPE_STREAM'],
    ['Pool', 'TYPE_POOL'],
    ['Array', 'TYPE_ARRAY'],
    ['Object', 'TYPE_OBJECT'],
    ['Any', 'TYPE_ANY']
]);

export default Scanner;
