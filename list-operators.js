import { RuntimeEngine } from './src/core/engine.js';

const engine = new RuntimeEngine({ quietMode: true });
const operators = Object.keys(engine.operators).sort();

console.log('Available operators (' + operators.length + '):');
console.log(operators.join(', '));
