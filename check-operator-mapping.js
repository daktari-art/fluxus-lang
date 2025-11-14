import { RuntimeEngine } from './src/core/engine.js';

const engine = new RuntimeEngine({ quietMode: true });
const allOps = engine.operatorsRegistry.getAllOperators();

console.log('📋 OPERATOR LIBRARY MAPPING:');

// Group by library
const byLibrary = {};
Object.entries(allOps).forEach(([name, op]) => {
    const lib = op.library || 'core';
    if (!byLibrary[lib]) byLibrary[lib] = [];
    byLibrary[lib].push(name);
});

Object.entries(byLibrary).forEach(([lib, ops]) => {
    console.log(`\n${lib.toUpperCase()} LIBRARY (${ops.length} operators):`);
    console.log(ops.slice(0, 10).join(', '));
    if (ops.length > 10) console.log(`... and ${ops.length - 10} more`);
});
