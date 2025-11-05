#!/usr/bin/env node
// Fix for double REPL execution

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing double REPL issue...');

const termuxBin = '/data/data/com.termux/files/usr/bin/fluxus';
const projectRoot = process.cwd();

// Create a clean, simple wrapper
const wrapperScript = `#!/data/data/com.termux/files/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const projectRoot = '${projectRoot}';
const cliPath = require('path').join(projectRoot, 'src', 'cli.js');

// Set up proper module resolution
require('module').Module._resolveFilename = function(request, parent, isMain) {
    if (request === './cli.js' || request === 'cli.js') {
        return cliPath;
    }
    return require('module')._resolveFilename(request, parent, isMain);
};

// Import and execute
import(cliPath).then(module => {
    if (module && module.main) {
        module.main();
    } else {
        // Fallback: if no main export, the CLI should auto-execute
        console.log('🌊 Fluxus Language - Global Command');
        process.argv[1] = cliPath;
        import(cliPath);
    }
}).catch(error => {
    console.error('❌ Failed to start Fluxus:', error.message);
    process.exit(1);
});
`;

fs.writeFileSync(termuxBin, wrapperScript);
fs.chmodSync(termuxBin, '755');

console.log('✅ Fixed wrapper script');
console.log('🚀 Testing...');

// Test the fix
try {
    const { execSync } = require('child_process');
    const result = execSync(`${termuxBin} --version`, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Version test:', result.trim());
} catch (error) {
    console.log('⚠️  Test had issues, but let\'s try the REPL directly');
}
