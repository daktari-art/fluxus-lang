// Production Parser with Predictive Parsing and Comprehensive Error Recovery
import { Grammar } from './grammar.js';
import { ParserError, SyntaxError } from '../errors.js';

export class Parser {
    constructor(tokens, filename = '<anonymous>') {
        this.tokens = tokens;
        this.filename = filename;
        this.current = 0;
        this.errors = [];
        
        this.grammar = new Grammar();
        this.recoveryModes = new Set();
        
        // Context tracking
        this.inStreamContext = false;
        this.inLensContext = false;
        this.currentFunction = null;
    }

    parse() {
        const program = {
            type: 'Program',
            statements: [],
            location: this.getLocation(0)
        };
        
        try {
            while (!this.isAtEnd()) {
                try {
                    const statement = this.statement();
                    if (statement) {
                        program.statements.push(statement);
                    }
                } catch (error) {
                    if (error instanceof ParserError) {
                        this.errors.push(error);
                        this.synchronize();
                    } else {
                        throw error; // Re-throw internal errors
                    }
                }
            }
            
            return {
                ast: program,
                errors: this.errors,
                hasErrors: this.errors.length > 0
            };
            
        } catch (fatalError) {
            this.errors.push(new ParserError(
                `Parser fatal error: ${fatalError.message}`,
                this.filename,
                this.peek().line,
                this.peek().column
            ));
            return { ast: program, errors: this.errors, hasErrors: true };
        }
    }

    // Statement parsing
    statement() {
        try {
            if (this.match('FLOW')) return this.importDeclaration();
            if (this.match('LET')) return this.poolDeclaration();
            if (this.match('FUNC')) return this.functionDeclaration();
            if (this.check('STREAM_FINITE') || this.check('STREAM_LIVE')) {
                return this.streamExpression();
            }
            
            // Expression statement
            const expr = this.expression();
            if (expr) {
                return {
                    type: 'ExpressionStatement',
                    expression: expr,
                    location: this.getLocation(this.current - 1)
                };
            }
            
            throw this.error('Expected statement');
            
        } catch (error) {
            if (this.isRecoveryMode()) {
                this.synchronize();
                return null;
            }
            throw error;
        }
    }

    importDeclaration() {
        const importToken = this.previous();
        const library = this.consume('IDENTIFIER', 'Expected library name after FLOW');
        
        return {
            type: 'ImportDeclaration',
            library: library.lexeme,
            location: this.getLocation(importToken)
        };
    }

    poolDeclaration() {
        const letToken = this.previous();
        const name = this.consume('IDENTIFIER', 'Expected pool name after let');
        
        // Optional type annotation
        let typeAnnotation = null;
        if (this.match('COLON')) {
            typeAnnotation = this.typeAnnotation();
        }
        
        this.consume('EQUAL', "Expected '=' after pool name");
        this.consume('POOL_OPERATOR', "Expected '<|>' after '='");
        
        const initializer = this.expression();
        
        return {
            type: 'PoolDeclaration',
            name: name.lexeme,
            typeAnnotation,
            initializer,
            location: this.getLocation(letToken)
        };
    }

    functionDeclaration() {
        const funcToken = this.previous();
        const name = this.consume('IDENTIFIER', 'Expected function name after FUNC');
        
        this.consume('LPAREN', "Expected '(' after function name");
        
        const parameters = [];
        if (!this.check('RPAREN')) {
            do {
                parameters.push(this.parameter());
            } while (this.match('COMMA'));
        }
        
        this.consume('RPAREN', "Expected ')' after parameters");
        
        // Optional return type
        let returnType = null;
        if (this.match('COLON')) {
            returnType = this.typeAnnotation();
        }
        
        const body = this.block();
        
        return {
            type: 'FunctionDeclaration',
            name: name.lexeme,
            parameters,
            returnType,
            body,
            location: this.getLocation(funcToken)
        };
    }

    streamExpression() {
        const streamToken = this.previous();
        const isLive = streamToken.type === 'STREAM_LIVE';
        
        const previousContext = this.inStreamContext;
        this.inStreamContext = true;
        
        try {
            const source = this.expression();
            const operators = [];
            
            while (this.match('PIPE')) {
                operators.push(this.operator());
            }
            
            return {
                type: 'StreamExpression',
                source,
                operators,
                isLive,
                location: this.getLocation(streamToken)
            };
        } finally {
            this.inStreamContext = previousContext;
        }
    }

    operator() {
        if (this.match('LBRACE')) {
            return this.lensExpression();
        }
        
        const name = this.consume('IDENTIFIER', 'Expected operator name');
        let args = [];
        
        if (this.match('LPAREN')) {
            if (!this.check('RPAREN')) {
                do {
                    args.push(this.expression());
                } while (this.match('COMMA'));
            }
            this.consume('RPAREN', "Expected ')' after arguments");
        }
        
        return {
            type: 'Operator',
            name: name.lexeme,
            arguments: args,
            location: this.getLocation(name)
        };
    }

    lensExpression() {
        const previousContext = this.inLensContext;
        this.inLensContext = true;
        
        try {
            const steps = [];
            
            if (!this.check('RBRACE')) {
                do {
                    steps.push(this.lensStep());
                } while (this.match('PIPE'));
            }
            
            this.consume('RBRACE', "Expected '}' after lens expression");
            
            return {
                type: 'LensExpression',
                steps,
                location: this.getLocation(this.previous())
            };
        } finally {
            this.inLensContext = previousContext;
        }
    }

    lensStep() {
        if (this.match('DOT')) {
            const field = this.consume('IDENTIFIER', 'Expected field name after dot');
            return {
                type: 'FieldAccess',
                field: field.lexeme,
                location: this.getLocation(field)
            };
        }
        
        // Function call in lens
        const name = this.consume('IDENTIFIER', 'Expected function name in lens');
        this.consume('LPAREN', "Expected '(' after function name in lens");
        
        const args = [];
        if (!this.check('RPAREN')) {
            do {
                args.push(this.expression());
            } while (this.match('COMMA'));
        }
        
        this.consume('RPAREN', "Expected ')' after lens function arguments");
        
        return {
            type: 'FunctionCall',
            name: name.lexeme,
            arguments: args,
            location: this.getLocation(name)
        };
    }

    // Expression parsing (recursive descent)
    expression() {
        return this.assignment();
    }

    assignment() {
        const expr = this.or();
        
        if (this.match('EQUAL')) {
            const equals = this.previous();
            const value = this.assignment();
            
            if (expr.type === 'Variable') {
                return {
                    type: 'Assignment',
                    name: expr.name,
                    value,
                    location: this.getLocation(equals)
                };
            }
            
            throw this.error('Invalid assignment target');
        }
        
        return expr;
    }

    or() {
        let expr = this.and();
        
        while (this.match('OR')) {
            const operator = this.previous();
            const right = this.and();
            expr = {
                type: 'LogicalExpression',
                operator: operator.lexeme,
                left: expr,
                right,
                location: this.getLocation(operator)
            };
        }
        
        return expr;
    }

    and() {
        let expr = this.equality();
        
        while (this.match('AND')) {
            const operator = this.previous();
            const right = this.equality();
            expr = {
                type: 'LogicalExpression',
                operator: operator.lexeme,
                left: expr,
                right,
                location: this.getLocation(operator)
            };
        }
        
        return expr;
    }

    equality() {
        let expr = this.comparison();
        
        while (this.match('EQUAL_EQUAL', 'BANG_EQUAL')) {
            const operator = this.previous();
            const right = this.comparison();
            expr = {
                type: 'BinaryExpression',
                operator: operator.lexeme,
                left: expr,
                right,
                location: this.getLocation(operator)
            };
        }
        
        return expr;
    }

    comparison() {
        let expr = this.term();
        
        while (this.match('GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL')) {
            const operator = this.previous();
            const right = this.term();
            expr = {
                type: 'BinaryExpression',
                operator: operator.lexeme,
                left: expr,
                right,
                location: this.getLocation(operator)
            };
        }
        
        return expr;
    }

    term() {
        let expr = this.factor();
        
        while (this.match('PLUS', 'MINUS')) {
            const operator = this.previous();
            const right = this.factor();
            expr = {
                type: 'BinaryExpression',
                operator: operator.lexeme,
                left: expr,
                right,
                location: this.getLocation(operator)
            };
        }
        
        return expr;
    }

    factor() {
        let expr = this.unary();
        
        while (this.match('STAR', 'SLASH')) {
            const operator = this.previous();
            const right = this.unary();
            expr = {
                type: 'BinaryExpression',
                operator: operator.lexeme,
                left: expr,
                right,
                location: this.getLocation(operator)
            };
        }
        
        return expr;
    }

    unary() {
        if (this.match('BANG', 'MINUS')) {
            const operator = this.previous();
            const right = this.unary();
            return {
                type: 'UnaryExpression',
                operator: operator.lexeme,
                argument: right,
                location: this.getLocation(operator)
            };
        }
        
        return this.call();
    }

    call() {
        let expr = this.primary();
        
        while (true) {
            if (this.match('LPAREN')) {
                expr = this.finishCall(expr);
            } else if (this.match('DOT')) {
                const name = this.consume('IDENTIFIER', 'Expected property name after dot');
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: name.lexeme,
                    computed: false,
                    location: this.getLocation(name)
                };
            } else {
                break;
            }
        }
        
        return expr;
    }

    finishCall(callee) {
        const args = [];
        if (!this.check('RPAREN')) {
            do {
                args.push(this.expression());
            } while (this.match('COMMA'));
        }
        
        const paren = this.consume('RPAREN', "Expected ')' after arguments");
        
        return {
            type: 'CallExpression',
            callee,
            arguments: args,
            location: this.getLocation(paren)
        };
    }

    primary() {
        if (this.match('FALSE')) return { type: 'BooleanLiteral', value: false, location: this.getLocation(this.previous()) };
        if (this.match('TRUE')) return { type: 'BooleanLiteral', value: true, location: this.getLocation(this.previous()) };
        if (this.match('NULL')) return { type: 'NullLiteral', value: null, location: this.getLocation(this.previous()) };
        
        if (this.match('NUMBER', 'STRING')) {
            return {
                type: this.previous().type === 'NUMBER' ? 'NumberLiteral' : 'StringLiteral',
                value: this.previous().literal,
                location: this.getLocation(this.previous())
            };
        }
        
        if (this.match('IDENTIFIER')) {
            return {
                type: 'Variable',
                name: this.previous().lexeme,
                location: this.getLocation(this.previous())
            };
        }
        
        if (this.match('LPAREN')) {
            const expr = this.expression();
            this.consume('RPAREN', "Expected ')' after expression");
            return {
                type: 'GroupedExpression',
                expression: expr,
                location: this.getLocation(this.previous())
            };
        }
        
        throw this.error('Expected expression');
    }

    // Type system
    typeAnnotation() {
        return this.type();
    }

    type() {
        if (this.match('TYPE_STREAM')) {
            this.consume('LESS', "Expected '<' after Stream");
            const elementType = this.type();
            this.consume('GREATER', "Expected '>' after stream element type");
            return { type: 'StreamType', elementType };
        }
        
        if (this.match('TYPE_POOL')) {
            this.consume('LESS', "Expected '<' after Pool");
            const elementType = this.type();
            this.consume('GREATER', "Expected '>' after pool element type");
            return { type: 'PoolType', elementType };
        }
        
        if (this.match('TYPE_ARRAY')) {
            this.consume('LESS', "Expected '<' after Array");
            const elementType = this.type();
            this.consume('GREATER', "Expected '>' after array element type");
            return { type: 'ArrayType', elementType };
        }
        
        if (this.match('TYPE_OBJECT')) {
            this.consume('LBRACE', "Expected '{' after Object");
            const fields = this.fieldTypes();
            this.consume('RBRACE', "Expected '}' after object fields");
            return { type: 'ObjectType', fields };
        }
        
        // Basic types
        const basicTypes = ['TYPE_NUMBER', 'TYPE_STRING', 'TYPE_BOOLEAN', 'TYPE_ANY'];
        for (const type of basicTypes) {
            if (this.match(type)) {
                return { type: 'BasicType', name: this.previous().lexeme };
            }
        }
        
        // Type variable
        if (this.match('IDENTIFIER')) {
            return { type: 'TypeVariable', name: this.previous().lexeme };
        }
        
        throw this.error('Expected type annotation');
    }

    fieldTypes() {
        const fields = new Map();
        
        if (!this.check('RBRACE')) {
            do {
                const name = this.consume('IDENTIFIER', 'Expected field name');
                this.consume('COLON', "Expected ':' after field name");
                const fieldType = this.type();
                fields.set(name.lexeme, fieldType);
            } while (this.match('COMMA'));
        }
        
        return fields;
    }

    // Utility methods
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();
        throw this.error(message);
    }

    isAtEnd() {
        return this.peek().type === 'EOF';
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    error(message) {
        const token = this.peek();
        return new ParserError(message, this.filename, token.line, token.column);
    }

    getLocation(token) {
        if (typeof token === 'number') {
            token = this.tokens[token];
        }
        return {
            filename: this.filename,
            line: token.line,
            column: token.column,
            start: token.start, // Would need start/end in token
            end: token.end
        };
    }

    // Error recovery
    synchronize() {
        this.advance();
        
        while (!this.isAtEnd()) {
            if (this.previous().type === 'SEMICOLON') return;
            
            switch (this.peek().type) {
                case 'FUNC':
                case 'LET':
                case 'FLOW':
                case 'STREAM_FINITE':
                case 'STREAM_LIVE':
                case 'IF':
                case 'FOR':
                case 'WHILE':
                case 'RETURN':
                    return;
            }
            
            this.advance();
        }
    }

    enterRecoveryMode(mode) {
        this.recoveryModes.add(mode);
    }

    exitRecoveryMode(mode) {
        this.recoveryModes.delete(mode);
    }

    isRecoveryMode() {
        return this.recoveryModes.size > 0;
    }

    parameter() {
        const name = this.consume('IDENTIFIER', 'Expected parameter name');
        let typeAnnotation = null;
        
        if (this.match('COLON')) {
            typeAnnotation = this.typeAnnotation();
        }
        
        return {
            type: 'Parameter',
            name: name.lexeme,
            typeAnnotation,
            location: this.getLocation(name)
        };
    }

    block() {
        const brace = this.consume('LBRACE', "Expected '{' before function body");
        const statements = [];
        
        while (!this.check('RBRACE') && !this.isAtEnd()) {
            statements.push(this.statement());
        }
        
        this.consume('RBRACE', "Expected '}' after function body");
        
        return {
            type: 'Block',
            statements,
            location: this.getLocation(brace)
        };
    }
}

export default Parser;
