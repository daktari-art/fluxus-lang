#!/usr/bin/env node
// FILENAME: bin/fluxus.js
/**
 * Fluxus Global Binary Wrapper - SMART ENGINE EDITION
 * This file is the entry point for global installations
 */

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try multiple possible paths for the CLI
const possiblePaths = [
    resolve(__dirname, '../src/cli.js'),
    resolve(__dirname, './src/cli.js'), 
    resolve(__dirname, 'src/cli.js'),
    join(__dirname, '..', 'src', 'cli.js'),
    join(process.cwd(), 'src', 'cli.js')
];

async function main() {
    let cliMain;
    let successfulPath;

    // Try all possible paths
    for (const cliPath of possiblePaths) {
        try {
            console.log(`🔍 Trying CLI path: ${cliPath}`);
            const module = await import(cliPath);
            if (module && module.main) {
                cliMain = module.main;
                successfulPath = cliPath;
                console.log(`✅ Found CLI at: ${cliPath}`);
                break;
            }
        } catch (error) {
            // Continue to next path
            continue;
        }
    }

    if (!cliMain) {
        console.error('❌ Failed to find Fluxus CLI');
        console.error('   Tried paths:', possiblePaths);
        console.error('   Current directory:', process.cwd());
        console.error('   __dirname:', __dirname);
        process.exit(1);
    }

    try {
        await cliMain();
    } catch (error) {
        console.error('❌ Fluxus execution failed:');
        console.error('   Error:', error.message);
        if (error.stack) {
            console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
        }
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();
