#!/usr/bin/env node
// Quick fix for broken global installation

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing global Fluxus installation...');

const termuxBin = '/data/data/com.termux/files/usr/bin/fluxus';
const projectRoot = process.cwd();

if (fs.existsSync(termuxBin)) {
    // Remove the broken wrapper
    fs.unlinkSync(termuxBin);
    console.log('✅ Removed broken wrapper');
}

// Recreate with correct paths
const wrapperScript = `#!/data/data/com.termux/files/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = '${projectRoot}';
const cliPath = resolve(projectRoot, 'src', 'cli.js');

async function main() {
    try {
        const { main } = await import(cliPath);
        main();
    } catch (error) {
        console.error('Failed to start Fluxus:', error.message);
        console.error('Project path:', projectRoot);
        process.exit(1);
    }
}

main();
`;

fs.writeFileSync(termuxBin, wrapperScript);
fs.chmodSync(termuxBin, '755');

console.log('✅ Created fixed wrapper');
console.log('📁 Project path:', projectRoot);
console.log('🚀 Try: fluxus --version');
