import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';

const mapReduceCode = '~ [1, 2, 3] | map {.value | multiply(2)} | reduce {+} | print()';
const parser = new GraphParser();
const ast = parser.parse(mapReduceCode);

console.log('=== RUNTIME EXECUTION DEBUG ===');

const engine = new RuntimeEngine();

// Test the runFiniteStreams method
console.log('Finite sources found:', ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE').length);

const finiteSource = ast.nodes.find(n => n.type === 'STREAM_SOURCE_FINITE');
console.log('Stream source value:', finiteSource.value);
console.log('Parsed literal value:', engine.parseLiteralValue(finiteSource.value));

// Test pipeline finding
const pipelineId = engine.findPipelineId(finiteSource.id);
console.log('Pipeline ID found:', pipelineId);

// Test if the pipeline would execute
console.log('\nTesting pipeline execution:');
try {
  engine.runFiniteStreams.call({ 
    ast, 
    runPipeline: engine.runPipeline.bind(engine),
    findPipelineId: engine.findPipelineId.bind(engine),
    parseLiteralValue: engine.parseLiteralValue.bind(engine)
  });
  console.log('Pipeline executed successfully!');
} catch (error) {
  console.log('Pipeline execution error:', error.message);
}
