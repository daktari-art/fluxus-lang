#!/usr/bin/env node
/**
 * Fluxus Global Binary Wrapper
 * This file is the entry point for global installations
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(__dirname, '../src/cli.js');

async function main() {
    try {
        // Import the actual CLI
        const { main: cliMain } = await import(cliPath);
        
        if (typeof cliMain === 'function') {
            cliMain();
        } else {
            console.error('❌ CLI main function not found');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Failed to start Fluxus:');
        console.error('   Error:', error.message);
        console.error('   CLI path:', cliPath);
        process.exit(1);
    }
}

main();
