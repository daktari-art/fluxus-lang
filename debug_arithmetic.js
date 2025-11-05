import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';

// Test the exact map/reduce line from arithmetic.flux
const code = `~ [1, 2, 3] 

| map {.value | multiply(10) } # Stream emits: 10, then 20, then 30
| reduce { + }                   # Sums the entire stream result
| print()`;

console.log('Testing arithmetic.flux map/reduce:');
console.log('Code:', code);

const parser = new GraphParser();
const ast = parser.parse(code);

console.log('\nAST nodes:');
ast.nodes.forEach(node => {
  console.log(`  ${node.type}: "${node.value}"`);
});

console.log('\nConnections:');
ast.connections.forEach(conn => {
  const fromNode = ast.nodes.find(n => n.id === conn.from);
  const toNode = ast.nodes.find(n => n.id === conn.to);
  console.log(`  ${fromNode.value} -> ${toNode.value}`);
});

const engine = new RuntimeEngine();
engine.start(ast);
