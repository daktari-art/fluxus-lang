import { GraphParser } from './src/core/parser.js';

const code = '~ [1, 2, 3] | print()';
const parser = new GraphParser();
const ast = parser.parse(code);

console.log('=== ARRAY PARSING DEBUG ===');
console.log('AST:', JSON.stringify(ast, null, 2));

const arrayNode = ast.nodes.find(n => n.value === '[1, 2, 3]');
console.log('Array node:', arrayNode);
