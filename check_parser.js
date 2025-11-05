import { GraphParser } from './src/core/parser.js';

// Test with the working examples
const helloCode = '~ "Hello, Fluxus World!" | print()';
const arithmeticCode = '~ 5 | add(3) | print()';
const arrayCode = '~ [1, 2, 3] | print()';

const parser = new GraphParser();

console.log('=== CURRENT PARSER STATUS ===');
console.log('Hello.flux AST nodes:', parser.parse(helloCode).nodes.map(n => ({type: n.type, value: n.value})));
console.log('Arithmetic AST nodes:', parser.parse(arithmeticCode).nodes.map(n => ({type: n.type, value: n.value})));
console.log('Array AST nodes:', parser.parse(arrayCode).nodes.map(n => ({type: n.type, value: n.value})));
