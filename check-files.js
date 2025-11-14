// FILENAME: check-files.js
// Simple Fluxus File Presence Checker

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

// All files that should exist
const REQUIRED_FILES = [
    // Core System
    'src/core/parser.js',
    'src/core/compiler.js', 
    'src/core/engine.js',
    
    // REPL and CLI
    'src/repl.js',
    'src/cli.js',
    'src/main.js',
    'bin/fluxus.js',
    
    // Standard Library Core
    'src/stdlib/core/operators/CoreOperators.js',
    'src/stdlib/core/operators/MathOperators.js',
    'src/stdlib/core/operators/StringOperators.js',
    'src/stdlib/core/operators/index.js',
    'src/stdlib/core/types/index.js',
    
    // Intermediate Representation
    'src/intermediate/ir/StreamIRBuilder.js',
    'src/intermediate/ir/stream-ir.js',
    'src/intermediate/ir/instructions/stream-instructions.js',
    'src/intermediate/ir/instructions/index.js',
    'src/intermediate/ir/builder/IRBuilder.js',
    'src/intermediate/ir/builder/IRInstructions.js',
    'src/intermediate/ir/builder/index.js',
    
    // Optimizer
    'src/intermediate/optimizer/index.js',
    'src/intermediate/optimizer/passes/constant-folding.js',
    'src/intermediate/optimizer/passes/dead-code.js',
    'src/intermediate/optimizer/passes/stream-fusion.js',
    
    // Runtime System
    'src/runtime/ffi/index.js',
    'src/runtime/memory/gc.js',
    'src/runtime/scheduler/advanced-scheduler.js',
    'src/runtime/scheduler/scheduler.js',
    'src/runtime/vm/virtual-machine.js',
    
    // Frontend Analysis
    'src/frontend/analysis/AnalysisManager.js',
    'src/frontend/analysis/SymbolTable.js',
    'src/frontend/analysis/TypeChecker.js',
    'src/frontend/analysis/index.js',
    
    // AST Nodes
    'src/frontend/ast/nodes/ASTNode.js',
    'src/frontend/ast/nodes/StreamNodes.js',
    'src/frontend/ast/nodes/PoolNodes.js',
    'src/frontend/ast/nodes/LiteralNodes.js',
    'src/frontend/ast/nodes/LensNodes.js',
    'src/frontend/ast/nodes/index.js',
    
    // Library Domains
    'src/lib/domains/sensors.js',
    'src/lib/domains/analytics.js',
    'src/lib/domains/health.js',
    'src/lib/domains/iot.js',
    'src/lib/domains/ui.js',
    
    // Text Utilities
    'src/lib/text/format/index.js',
    'src/lib/text/regex/index.js',
    'src/lib/text/string.js',
    
    // Time Utilities
    'src/lib/time/date/index.js',
    'src/lib/time/scheduler/index.js',
    'src/lib/time/time.js',
    
    // Math Libraries
    'src/lib/math/math.js',
    'src/lib/math/stats/index.js',
    'src/lib/math/trig/index.js',
    
    // Network
    'src/lib/network/http.js',
    'src/lib/network/mqtt.js',
    'src/lib/network/websocket.js',
    'src/lib/network/index.js',
    
    // Reactive System
    'src/lib/reactive/lenses.js',
    'src/lib/reactive/pools.js',
    'src/lib/reactive/subscriptions.js',
    
    // Other Core Libraries
    'src/lib/core/core.js',
    'src/lib/core/types.js',
    'src/lib/core/collections.js',
    'src/lib/data/aggregators.js',
    'src/lib/data/streams.js',
    'src/lib/data/transducers.js',
    'src/lib/flux/index.js',
    'src/lib/hybrid/index.js',
    'src/lib/hybrid-loader.js',
    'src/lib/library-conflict-resolver.js',
    'src/lib/conflict-resolver.js',
    'src/lib/security-manager.js',
    'src/lib/index.js',
    
    // Package Manager
    'src/package-manager.js',
    
    // Other files
    'src/dashboard.js',
    'src/exit_helper.js',
    'src/profiler.js',
    'src/tutorial.js'
];

console.log('🔍 Checking Fluxus File Presence...\n');

let missingFiles = [];
let presentFiles = [];

// Check each file
REQUIRED_FILES.forEach(filePath => {
    const fullPath = path.join(ROOT_DIR, filePath);
    
    if (fs.existsSync(fullPath)) {
        presentFiles.push(filePath);
        console.log(`✅ ${filePath}`);
    } else {
        missingFiles.push(filePath);
        console.log(`❌ ${filePath} - MISSING`);
    }
});

// Summary
console.log('\n📊 SUMMARY:');
console.log(`Total files checked: ${REQUIRED_FILES.length}`);
console.log(`Present: ${presentFiles.length}`);
console.log(`Missing: ${missingFiles.length}`);
console.log(`Coverage: ${((presentFiles.length / REQUIRED_FILES.length) * 100).toFixed(1)}%`);

if (missingFiles.length === 0) {
    console.log('\n🎉 SUCCESS! All files are present!');
} else {
    console.log('\n❌ MISSING FILES:');
    missingFiles.forEach(file => {
        console.log(`   - ${file}`);
    });
}

// Check critical files
const CRITICAL_FILES = [
    'src/core/parser.js',
    'src/core/compiler.js',
    'src/core/engine.js',
    'src/repl.js',
    'src/main.js'
];

console.log('\n🔧 CRITICAL FILES CHECK:');
let allCriticalPresent = true;
CRITICAL_FILES.forEach(file => {
    const exists = fs.existsSync(path.join(ROOT_DIR, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allCriticalPresent = false;
});

if (allCriticalPresent) {
    console.log('✅ All critical files present - system can run');
} else {
    console.log('❌ Missing critical files - system cannot run');
}
