// Quick debug to see what the parser produces for hello.flux
import { GraphParser } from './src/core/parser.js';
import fs from 'fs';

const source = fs.readFileSync('./examples/hello.flux', 'utf-8');
const parser = new GraphParser();
const ast = parser.parse(source);

console.log('=== PARSED AST ===');
console.log('Nodes:', ast.nodes.map(n => ({ type: n.type, value: n.value })));
console.log('Connections:', ast.connections);
console.log('Finite sources:', ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE'));
