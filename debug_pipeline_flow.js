import { GraphParser } from './src/core/parser.js';
import { RuntimeEngine } from './src/core/engine.js';

const mapReduceCode = '~ [1, 2, 3] | map {.value | multiply(2)} | reduce {+} | print()';
const parser = new GraphParser();
const ast = parser.parse(mapReduceCode);

console.log('=== PIPELINE FLOW DEBUG ===');

const engine = new RuntimeEngine();
engine.ast = ast; // Set the AST manually

// Check pipeline connections from the stream source
const streamSource = ast.nodes.find(n => n.type === 'STREAM_SOURCE_FINITE');
console.log('Stream source ID:', streamSource.id);

// Find connections from this stream source
const connectionsFromSource = ast.connections.filter(c => c.from === streamSource.id);
console.log('Connections from stream source:', connectionsFromSource.length);

if (connectionsFromSource.length > 0) {
  connectionsFromSource.forEach(conn => {
    const toNode = ast.nodes.find(n => n.id === conn.to);
    console.log(`  -> ${toNode.name}: ${toNode.value}`);
  });
  
  // Test running the actual pipeline
  console.log('\nRunning actual pipeline:');
  const initialData = engine.parseLiteralValue(streamSource.value);
  engine.runPipeline(streamSource.id, initialData);
} else {
  console.log('ERROR: No connections from stream source!');
  console.log('All connections:', ast.connections);
}
