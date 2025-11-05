import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';

const mapReduceCode = '~ [1, 2, 3] | map {.value | multiply(2)} | reduce {+} | print()';
const parser = new GraphParser();
const ast = parser.parse(mapReduceCode);

console.log('=== ENGINE DEBUG ===');
console.log('AST nodes with args:');
ast.nodes.forEach(node => {
  if (node.type === 'FUNCTION_OPERATOR') {
    console.log(`  ${node.name}(${JSON.stringify(node.args)})`);
  }
});

// Test engine processing
const engine = new RuntimeEngine();
console.log('\nTesting map processing:');
const mapNode = ast.nodes.find(n => n.name === 'map');
const arrayData = [1, 2, 3];
console.log('Input array:', arrayData);
console.log('Map node:', mapNode);

// Manually test the processNode method
try {
  const result = engine.processNode(mapNode, arrayData);
  console.log('Map result:', result);
} catch (error) {
  console.log('Map processing error:', error.message);
}
