import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';
import fs from 'fs';

// Read the actual arithmetic.flux file
const code = fs.readFileSync('./examples/arithmetic.flux', 'utf-8');
console.log('=== ARITHMETIC.FUX FULL DEBUG ===');

const parser = new GraphParser();
const ast = parser.parse(code);

console.log('Finite sources:', ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE').length);
ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE').forEach((source, i) => {
  console.log(`  ${i + 1}. ${source.value}`);
});

console.log('\nAll nodes:');
ast.nodes.forEach(node => {
  if (node.type === 'FUNCTION_OPERATOR') {
    console.log(`  ${node.name}: ${node.value}`);
  }
});

console.log('\nConnections:');
ast.connections.forEach(conn => {
  const fromNode = ast.nodes.find(n => n.id === conn.from);
  const toNode = ast.nodes.find(n => n.id === conn.to);
  console.log(`  ${fromNode.value} -> ${toNode.value}`);
});

const engine = new RuntimeEngine();
engine.start(ast);
