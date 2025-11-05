// Simple test to see if map/reduce works in isolation
import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';

const code = '~ [1, 2, 3] | map {.value | multiply(2)} | reduce {+} | print()';
console.log('Testing:', code);

const parser = new GraphParser();
const ast = parser.parse(code);

const engine = new RuntimeEngine();
engine.start(ast); // This should execute the pipeline
