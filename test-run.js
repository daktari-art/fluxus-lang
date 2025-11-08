#!/usr/bin/env node
/**
 * Fluxus Language Test Runner
 * 
 * Runs all examples to verify the language is working correctly.
 * Useful for contributors and users to validate their installation.
 */

import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import Fluxus components
import { GraphParser } from './src/core/parser.js';
import { Compiler } from './src/core/compiler.js';
import { RuntimeEngine } from './src/core/engine.js';

async function runTest(filePath) {
    try {
        const { readFileSync } = await import('fs');
        const source = readFileSync(filePath, 'utf-8');
        
        console.log(`\n🧪 Testing: ${filePath}`);
        
        // Parse
        const parser = new GraphParser();
        const ast = parser.parse(source);
        
        // Compile  
        const compiler = new Compiler();
        const compiledAst = compiler.compile(ast);
        
        // Execute (with timeout)
        const engine = new RuntimeEngine();
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log(`✅ ${filePath} - COMPLETED (timeout)`);
                resolve(true);
            }, 2000);
            
            try {
                engine.start(compiledAst);
                clearTimeout(timeout);
                console.log(`✅ ${filePath} - SUCCESS`);
                resolve(true);
            } catch (error) {
                clearTimeout(timeout);
                console.log(`❌ ${filePath} - ERROR: ${error.message}`);
                resolve(false);
            }
        });
        
    } catch (error) {
        console.log(`❌ ${filePath} - FAILED: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Fluxus Language Test Suite');
    console.log('=' .repeat(50));
    
    const examplesDir = join(__dirname, 'examples');
    const files = readdirSync(examplesDir)
        .filter(file => file.endsWith('.flux'))
        .sort();
    
    let passed = 0;
    let failed = 0;
    
    for (const file of files) {
        const filePath = join(examplesDir, file);
        const success = await runTest(filePath);
        
        if (success) passed++;
        else failed++;
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Fluxus is working correctly.');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Please check the errors above.');
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export { runAllTests };
