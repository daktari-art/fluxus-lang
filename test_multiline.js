import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';

// Test the problematic multi-line pipeline from arithmetic.flux
const code = `~ 10

| multiply(4)  # 10 * 4 = 40
| subtract(15) # 40 - 15 = 25
| print()`;

console.log('Testing multi-line pipeline:');
console.log('Code:', code);

const parser = new GraphParser();
const ast = parser.parse(code);

console.log('\nNodes:');
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
