// Production Error Handling System for Fluxus Frontend

/**
 * Base Error Class for Fluxus Compilation Errors
 */
export class FluxusError extends Error {
    constructor(message, filename, line, column) {
        super(message);
        this.name = this.constructor.name;
        this.filename = filename || '<anonymous>';
        this.line = line || 1;
        this.column = column || 1;
        this.isFluxusError = true;
        
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toString() {
        return `${this.filename}:${this.line}:${this.column} - ${this.name}: ${this.message}`;
    }

    toJSON() {
        return {
            type: this.name,
            message: this.message,
            filename: this.filename,
            line: this.line,
            column: this.column,
            stack: this.stack
        };
    }
}

/**
 * Lexical Analysis Errors
 */
export class LexerError extends FluxusError {
    constructor(message, filename, line, column) {
        super(message, filename, line, column);
        this.phase = 'lexer';
    }
}

/**
 * Syntax Analysis Errors  
 */
export class ParserError extends FluxusError {
    constructor(message, filename, line, column) {
        super(message, filename, line, column);
        this.phase = 'parser';
    }
}

/**
 * Syntax Error with Context
 */
export class SyntaxError extends ParserError {
    constructor(message, filename, line, column, token = null) {
        super(message, filename, line, column);
        this.token = token;
    }
}

/**
 * Type System Errors
 */
export class TypeError extends FluxusError {
    constructor(message, filename, line, column, typeContext = null) {
        super(message, filename, line, column);
        this.phase = 'typechecker';
        this.typeContext = typeContext;
    }
}

/**
 * Semantic Analysis Errors
 */
export class SemanticError extends FluxusError {
    constructor(message, filename, line, column, symbol = null) {
        super(message, filename, line, column);
        this.phase = 'semantic';
        this.symbol = symbol;
    }
}

/**
 * Error Recovery and Reporting System
 */
export class ErrorReporter {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.maxErrors = 100;
        this.errorCount = 0;
    }

    reportError(error) {
        if (this.errorCount < this.maxErrors) {
            this.errors.push(error);
            this.errorCount++;
        }
        
        if (this.errorCount >= this.maxErrors) {
            this.reportError(new FluxusError(
                'Too many errors, stopping compilation',
                null, null, null
            ));
        }
    }

    reportWarning(message, filename, line, column) {
        this.warnings.push({
            type: 'Warning',
            message,
            filename,
            line,
            column
        });
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    hasWarnings() {
        return this.warnings.length > 0;
    }

    clear() {
        this.errors = [];
        this.warnings = [];
        this.errorCount = 0;
    }

    formatErrors() {
        return this.errors.map(error => error.toString()).join('\n');
    }

    formatWarnings() {
        return this.warnings.map(warning => 
            `${warning.filename}:${warning.line}:${warning.column} - Warning: ${warning.message}`
        ).join('\n');
    }

    getSummary() {
        return {
            errors: this.errors.length,
            warnings: this.warnings.length,
            hasErrors: this.hasErrors(),
            hasWarnings: this.hasWarnings()
        };
    }
}

/**
 * Error Factory for Consistent Error Creation
 */
export const ErrorFactory = {
    lexer: {
        unexpectedCharacter: (char, filename, line, column) => 
            new LexerError(`Unexpected character: '${char}'`, filename, line, column),
        
        unterminatedString: (filename, line, column) =>
            new LexerError('Unterminated string', filename, line, column),
        
        invalidEscape: (sequence, filename, line, column) =>
            new LexerError(`Invalid escape sequence: \\${sequence}`, filename, line, column),
        
        unicodeEscape: (filename, line, column) =>
            new LexerError('Invalid Unicode escape sequence', filename, line, column)
    },

    parser: {
        expectedToken: (expected, found, filename, line, column) =>
            new ParserError(`Expected ${expected}, but found '${found}'`, filename, line, column),
        
        unexpectedToken: (token, filename, line, column) =>
            new ParserError(`Unexpected token: '${token}'`, filename, line, column),
        
        invalidAssignment: (filename, line, column) =>
            new ParserError('Invalid assignment target', filename, line, column),
        
        missingSemicolon: (filename, line, column) =>
            new ParserError('Expected semicolon', filename, line, column)
    },

    type: {
        mismatch: (expected, actual, filename, line, column) =>
            new TypeError(`Type mismatch: expected ${expected}, got ${actual}`, filename, line, column),
        
        undefinedVariable: (name, filename, line, column) =>
            new TypeError(`Undefined variable: '${name}'`, filename, line, column),
        
        invalidOperation: (operation, types, filename, line, column) =>
            new TypeError(`Invalid ${operation} operation between ${types.join(' and ')}`, filename, line, column)
    },

    semantic: {
        duplicateDeclaration: (name, filename, line, column) =>
            new SemanticError(`Duplicate declaration: '${name}'`, filename, line, column),
        
        undefinedFunction: (name, filename, line, column) =>
            new SemanticError(`Undefined function: '${name}'`, filename, line, column),
        
        invalidStreamOperator: (operator, filename, line, column) =>
            new SemanticError(`Invalid stream operator: '${operator}'`, filename, line, column)
    }
};

/**
 * Error Recovery Strategies
 */
export const RecoveryStrategies = {
    skipToNextStatement(tokens, current) {
        // Skip to next likely statement start
        while (current < tokens.length) {
            const token = tokens[current];
            if (token.type === 'SEMICOLON' || 
                token.type === 'NEWLINE' ||
                token.type === 'EOF') {
                return current + 1;
            }
            
            // Statement starters
            if (token.type === 'LET' || 
                token.type === 'FLOW' || 
                token.type === 'FUNC' ||
                token.type === 'STREAM_FINITE' ||
                token.type === 'STREAM_LIVE') {
                return current;
            }
            
            current++;
        }
        return current;
    },

    skipToNextLine(tokens, current) {
        // Skip to next line
        while (current < tokens.length && tokens[current].type !== 'NEWLINE') {
            current++;
        }
        return current + 1; // Skip the newline too
    },

    skipToBalanced(tokens, current, open, close) {
        // Skip to balanced bracket/brace/paren
        let depth = 1;
        while (current < tokens.length && depth > 0) {
            const token = tokens[current];
            if (token.type === open) depth++;
            if (token.type === close) depth--;
            current++;
        }
        return current;
    }
};

export default {
    FluxusError,
    LexerError, 
    ParserError,
    SyntaxError,
    TypeError,
    SemanticError,
    ErrorReporter,
    ErrorFactory,
    RecoveryStrategies
};
