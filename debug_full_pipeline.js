import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';

const mapReduceCode = '~ [1, 2, 3] | map {.value | multiply(2)} | reduce {+} | print()';
const parser = new GraphParser();
const ast = parser.parse(mapReduceCode);

console.log('=== FULL PIPELINE DEBUG ===');

// Test the complete pipeline execution
const engine = new RuntimeEngine();

// Manually simulate the pipeline
const streamNode = ast.nodes.find(n => n.type === 'STREAM_SOURCE_FINITE');
const mapNode = ast.nodes.find(n => n.name === 'map');
const reduceNode = ast.nodes.find(n => n.name === 'reduce');
const printNode = ast.nodes.find(n => n.name === 'print');

console.log('Pipeline nodes:');
console.log('  Stream:', streamNode.value);
console.log('  Map:', mapNode.value);
console.log('  Reduce:', reduceNode.value);
console.log('  Print:', printNode.value);

// Execute step by step
console.log('\nStep-by-step execution:');
const arrayData = [1, 2, 3];
console.log('1. Input array:', arrayData);

const mapResult = engine.processNode(mapNode, arrayData);
console.log('2. After map:', mapResult);

const reduceResult = engine.processNode(reduceNode, mapResult);
console.log('3. After reduce:', reduceResult);

const printResult = engine.processNode(printNode, reduceResult);
console.log('4. After print:', printResult);
