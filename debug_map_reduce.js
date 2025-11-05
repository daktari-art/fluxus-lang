import { GraphParser } from './src/core/parser.js';

const mapReduceCode = '~ [1, 2, 3] | map {.value | multiply(2) } | reduce { + } | print()';
const parser = new GraphParser();
const ast = parser.parse(mapReduceCode);

console.log('=== MAP/REDUCE PARSING DEBUG ===');
console.log('Nodes:');
ast.nodes.forEach(node => {
  console.log(`  ${node.type}: "${node.value}"`);
});
console.log('Connections:');
ast.connections.forEach(conn => {
  const fromNode = ast.nodes.find(n => n.id === conn.from);
  const toNode = ast.nodes.find(n => n.id === conn.to);
  console.log(`  ${fromNode.value} -> ${toNode.value}`);
});
