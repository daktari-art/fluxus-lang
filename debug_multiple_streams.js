import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';

// Test with multiple streams like arithmetic.flux
const code = `~ 5 | add(3) | print()
~ 10 | multiply(4) | subtract(15) | print()
~ [1, 2, 3] | map {.value | multiply(10)} | reduce {+} | print()`;

console.log('Testing multiple streams:');
const parser = new GraphParser();
const ast = parser.parse(code);

console.log('Finite sources found:', ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE').length);
ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE').forEach(source => {
  console.log(`  - ${source.value}`);
});

const engine = new RuntimeEngine();
engine.start(ast);
