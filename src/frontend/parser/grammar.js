// LL(1) Grammar Definition for Fluxus Parser
import { ParserError } from '../errors.js';

export class Grammar {
    constructor() {
        this.productions = this.buildProductions();
        this.parsingTable = this.buildParsingTable();
        this.firstSets = this.buildFirstSets();
        this.followSets = this.buildFollowSets();
    }

    buildProductions() {
        return {
            'Program': [['Statement*']],
            'Statement': [
                ['ImportDecl'],
                ['PoolDecl'], 
                ['StreamExpr'],
                ['FunctionDecl'],
                ['ExpressionStmt']
            ],
            'ImportDecl': [['FLOW', 'QualifiedName']],
            'PoolDecl': [['LET', 'Identifier', 'TypeAnnotation?', 'EQUAL', 'POOL_OPERATOR', 'Expression']],
            'FunctionDecl': [['FUNC', 'Identifier', 'LPAREN', 'Parameters?', 'RPAREN', 'TypeAnnotation?', 'Block']],
            'StreamExpr': [['StreamSource', 'OperatorChain?']],
            'StreamSource': [
                ['STREAM_FINITE', 'Expression'],
                ['STREAM_LIVE', 'Expression']
            ],
            'OperatorChain': [['PIPE', 'Operator', 'OperatorChain?']],
            'Operator': [
                ['Identifier', 'Arguments?'],
                ['LensExpr']
            ],
            'LensExpr': [['LBRACE', 'LensPipeline', 'RBRACE']],
            'LensPipeline': [['LensStep', 'LensPipelineRest?']],
            'LensPipelineRest': [['PIPE', 'LensStep', 'LensPipelineRest?']],
            
            // Expressions
            'Expression': [['Assignment']],
            'Assignment': [['LogicalOr', 'AssignmentRest?']],
            'AssignmentRest': [['EQUAL', 'Assignment']],
            'LogicalOr': [['LogicalAnd', 'LogicalOrRest?']],
            'LogicalOrRest': [['OR', 'LogicalAnd', 'LogicalOrRest?']],
            'LogicalAnd': [['Equality', 'LogicalAndRest?']],
            'LogicalAndRest': [['AND', 'Equality', 'LogicalAndRest?']],
            'Equality': [['Comparison', 'EqualityRest?']],
            'EqualityRest': [['EqualityOp', 'Comparison', 'EqualityRest?']],
            'EqualityOp': [['EQUAL_EQUAL'], ['BANG_EQUAL']],
            'Comparison': [['Term', 'ComparisonRest?']],
            'ComparisonRest': [['ComparisonOp', 'Term', 'ComparisonRest?']],
            'ComparisonOp': [['LESS'], ['LESS_EQUAL'], ['GREATER'], ['GREATER_EQUAL']],
            'Term': [['Factor', 'TermRest?']],
            'TermRest': [['TermOp', 'Factor', 'TermRest?']],
            'TermOp': [['PLUS'], ['MINUS']],
            'Factor': [['Unary', 'FactorRest?']],
            'FactorRest': [['FactorOp', 'Unary', 'FactorRest?']],
            'FactorOp': [['STAR'], ['SLASH']],
            'Unary': [['UnaryOp', 'Unary'], ['Call']],
            'UnaryOp': [['BANG'], ['MINUS']],
            'Call': [['Primary', 'CallRest?']],
            'CallRest': [['CallSuffix', 'CallRest?']],
            'CallSuffix': [
                ['LPAREN', 'Arguments?', 'RPAREN'],
                ['DOT', 'Identifier']
            ],
            'Primary': [
                ['TRUE'],
                ['FALSE'], 
                ['NULL'],
                ['NUMBER'],
                ['STRING'],
                ['Identifier'],
                ['LPAREN', 'Expression', 'RPAREN'],
                ['ArrayLiteral'],
                ['ObjectLiteral']
            ],
            
            // Types
            'TypeAnnotation': [['COLON', 'Type']],
            'Type': [
                ['TYPE_STREAM', 'LESS', 'Type', 'GREATER'],
                ['TYPE_POOL', 'LESS', 'Type', 'GREATER'],
                ['TYPE_ARRAY', 'LESS', 'Type', 'GREATER'],
                ['TYPE_OBJECT', 'LBRACE', 'FieldTypes?', 'RBRACE'],
                ['BasicType']
            ],
            'BasicType': [
                ['TYPE_NUMBER'],
                ['TYPE_STRING'],
                ['TYPE_BOOLEAN'],
                ['TYPE_ANY']
            ],
            
            // Utility
            'QualifiedName': [['Identifier', 'QualifiedNameRest?']],
            'QualifiedNameRest': [['DOT', 'Identifier', 'QualifiedNameRest?']],
            'Parameters': [['Parameter', 'ParametersRest?']],
            'ParametersRest': [['COMMA', 'Parameter', 'ParametersRest?']],
            'Parameter': [['Identifier', 'TypeAnnotation?']],
            'Arguments': [['Expression', 'ArgumentsRest?']],
            'ArgumentsRest': [['COMMA', 'Expression', 'ArgumentsRest?']],
            'FieldTypes': [['FieldType', 'FieldTypesRest?']],
            'FieldTypesRest': [['COMMA', 'FieldType', 'FieldTypesRest?']],
            'FieldType': [['Identifier', 'COLON', 'Type']],
            'ArrayLiteral': [['LBRACKET', 'ArrayElements?', 'RBRACKET']],
            'ArrayElements': [['Expression', 'ArrayElementsRest?']],
            'ArrayElementsRest': [['COMMA', 'Expression', 'ArrayElementsRest?']],
            'ObjectLiteral': [['LBRACE', 'ObjectFields?', 'RBRACE']],
            'ObjectFields': [['ObjectField', 'ObjectFieldsRest?']],
            'ObjectFieldsRest': [['COMMA', 'ObjectField', 'ObjectFieldsRest?']],
            'ObjectField': [['Identifier', 'COLON', 'Expression']],
            'Block': [['LBRACE', 'Statement*', 'RBRACE']],
            'ExpressionStmt': [['Expression', 'SEMICOLON?']]
        };
    }

    buildParsingTable() {
        // Simplified parsing table for demo
        // In production, this would be generated from FIRST/FOLLOW sets
        const table = new Map();
        
        // Program level
        this.addProduction(table, 'Program::FLOW', ['Statement*']);
        this.addProduction(table, 'Program::LET', ['Statement*']);
        this.addProduction(table, 'Program::FUNC', ['Statement*']);
        this.addProduction(table, 'Program::STREAM_FINITE', ['Statement*']);
        this.addProduction(table, 'Program::STREAM_LIVE', ['Statement*']);
        this.addProduction(table, 'Program::EOF', ['Statement*']);
        
        // Statements
        this.addProduction(table, 'Statement::FLOW', ['ImportDecl']);
        this.addProduction(table, 'Statement::LET', ['PoolDecl']);
        this.addProduction(table, 'Statement::FUNC', ['FunctionDecl']);
        this.addProduction(table, 'Statement::STREAM_FINITE', ['StreamExpr']);
        this.addProduction(table, 'Statement::STREAM_LIVE', ['StreamExpr']);
        this.addProduction(table, 'Statement::IDENTIFIER', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::TRUE', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::FALSE', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::NULL', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::NUMBER', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::STRING', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::LPAREN', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::LBRACKET', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::LBRACE', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::BANG', ['ExpressionStmt']);
        this.addProduction(table, 'Statement::MINUS', ['ExpressionStmt']);
        
        // Expressions
        this.addProduction(table, 'Expression::IDENTIFIER', ['Assignment']);
        this.addProduction(table, 'Expression::TRUE', ['Assignment']);
        this.addProduction(table, 'Expression::FALSE', ['Assignment']);
        this.addProduction(table, 'Expression::NULL', ['Assignment']);
        this.addProduction(table, 'Expression::NUMBER', ['Assignment']);
        this.addProduction(table, 'Expression::STRING', ['Assignment']);
        this.addProduction(table, 'Expression::LPAREN', ['Assignment']);
        this.addProduction(table, 'Expression::LBRACKET', ['Assignment']);
        this.addProduction(table, 'Expression::LBRACE', ['Assignment']);
        this.addProduction(table, 'Expression::BANG', ['Assignment']);
        this.addProduction(table, 'Expression::MINUS', ['Assignment']);
        
        return table;
    }

    addProduction(table, key, production) {
        table.set(key, production);
    }

    buildFirstSets() {
        // FIRST sets for predictive parsing
        const first = new Map();
        
        // Terminals
        this.addFirstSet(first, 'FLOW', ['FLOW']);
        this.addFirstSet(first, 'LET', ['LET']);
        this.addFirstSet(first, 'FUNC', ['FUNC']);
        this.addFirstSet(first, 'STREAM_FINITE', ['STREAM_FINITE']);
        this.addFirstSet(first, 'STREAM_LIVE', ['STREAM_LIVE']);
        this.addFirstSet(first, 'IDENTIFIER', ['IDENTIFIER']);
        this.addFirstSet(first, 'TRUE', ['TRUE']);
        this.addFirstSet(first, 'FALSE', ['FALSE']);
        this.addFirstSet(first, 'NULL', ['NULL']);
        this.addFirstSet(first, 'NUMBER', ['NUMBER']);
        this.addFirstSet(first, 'STRING', ['STRING']);
        
        return first;
    }

    buildFollowSets() {
        // FOLLOW sets for error recovery
        const follow = new Map();
        
        this.addFollowSet(follow, 'Program', ['EOF']);
        this.addFollowSet(follow, 'Statement', ['EOF', 'FLOW', 'LET', 'FUNC', 'STREAM_FINITE', 'STREAM_LIVE', 'RBRACE']);
        
        return follow;
    }

    addFirstSet(sets, symbol, first) {
        sets.set(symbol, new Set(first));
    }

    addFollowSet(sets, symbol, follow) {
        sets.set(symbol, new Set(follow));
    }

    getProduction(nonTerminal, tokenType) {
        const key = `${nonTerminal}::${tokenType}`;
        const production = this.parsingTable.get(key);
        
        if (!production) {
            // Try to find a suitable recovery or default production
            const fallback = this.getFallbackProduction(nonTerminal, tokenType);
            if (fallback) {
                return fallback;
            }
            
            throw new ParserError(
                `Syntax error: Unexpected ${tokenType} in ${nonTerminal}`,
                null, null, null
            );
        }
        
        return production;
    }

    getFallbackProduction(nonTerminal, tokenType) {
        // Simple fallback strategy for error recovery
        const fallbacks = {
            'Statement': ['ExpressionStmt'],
            'Expression': ['Primary'],
            'Primary': ['Identifier']
        };
        
        return fallbacks[nonTerminal];
    }

    isTerminal(symbol) {
        return !this.productions[symbol] && symbol !== 'ε';
    }

    isNullable(nonTerminal) {
        const productions = this.productions[nonTerminal];
        if (!productions) return false;
        
        return productions.some(production => 
            production.length === 1 && production[0] === 'ε'
        );
    }
}

export default Grammar;
