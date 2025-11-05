#!/usr/bin/env node
// FILENAME: install.js
// Fluxus Language Installation Script - FIXED for Termux

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FluxusInstaller {
    constructor() {
        this.projectRoot = process.cwd();
        this.globalInstall = process.argv.includes('--global');
        this.installDir = this.globalInstall ? 
            this.findGlobalInstallDir() : 
            this.projectRoot;
    }

    findGlobalInstallDir() {
        // Try to find a suitable global installation directory
        const possibleDirs = [
            '/data/data/com.termux/files/usr/bin', // Termux specific
            '/usr/local/bin',
            '/usr/bin', 
            process.env.HOME ? path.join(process.env.HOME, '.local', 'bin') : null,
        ].filter(Boolean);

        for (const dir of possibleDirs) {
            if (fs.existsSync(dir)) {
                console.log(`📁 Using installation directory: ${dir}`);
                return dir;
            }
        }
        console.log('⚠️  No global directory found, using local installation');
        return this.projectRoot;
    }

    install() {
        console.log('🚀 Installing Fluxus Language...\n');
        
        if (this.globalInstall) {
            this.installGlobal();
        } else {
            this.installLocal();
        }
        
        this.createExamples();
        this.showPostInstallMessage();
    }

    installLocal() {
        console.log('📁 Installing locally for development...');
        
        // Create necessary directories
        const dirs = ['fluxus_packages', 'examples', 'logs'];
        dirs.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`   Created ./${dir}/`);
            }
        });

        console.log('✅ Local installation complete!');
    }

    installGlobal() {
        console.log('🌍 Attempting global installation...');
        
        try {
            // For Termux, we need to create a proper wrapper script
            if (this.installDir.includes('termux')) {
                console.log('📱 Detected Termux environment');
                this.installForTermux();
            } else {
                this.installForUnix();
            }
        } catch (error) {
            console.log('❌ Global installation failed:', error.message);
            console.log('💡 Falling back to local installation');
            this.installLocal();
        }
    }

    installForTermux() {
        console.log('🔧 Creating Termux wrapper...');
        
        // Get the absolute path to the project
        const projectPath = this.projectRoot;
        const cliPath = path.join(projectPath, 'src', 'cli.js');
        
        if (!fs.existsSync(cliPath)) {
            throw new Error(`CLI not found at: ${cliPath}`);
        }

        // Create a wrapper script that uses the correct paths
        const wrapperScript = `#!/data/data/com.termux/files/usr/bin/env node
/**
 * Fluxus Language Wrapper for Termux
 * This file points to the actual installation location
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Resolve the project path dynamically
const projectRoot = '${projectPath.replace(/'/g, "\\'")}';
const cliPath = projectRoot + '/src/cli.js';

async function main() {
    try {
        // Import the actual CLI
        const { main } = await import(cliPath);
        
        // Pass command line arguments
        const args = process.argv.slice(2);
        process.argv = [process.argv[0], cliPath, ...args];
        
        main();
    } catch (error) {
        console.error('❌ Failed to start Fluxus:');
        console.error('   Error:', error.message);
        console.error('   Project path:', projectRoot);
        console.error('   CLI path:', cliPath);
        console.error('\\n💡 Make sure Fluxus is installed in:', projectRoot);
        process.exit(1);
    }
}

// Handle different Node.js versions
if (import.meta.url === \`file://\${process.argv[1]}\`) {
    main();
}
`;

        const wrapperPath = path.join(this.installDir, 'fluxus');
        
        // Remove existing wrapper if it exists
        if (fs.existsSync(wrapperPath)) {
            fs.unlinkSync(wrapperPath);
        }
        
        fs.writeFileSync(wrapperPath, wrapperScript);
        fs.chmodSync(wrapperPath, '755');
        
        console.log(`✅ Created Termux wrapper: ${wrapperPath}`);
        console.log(`📁 Project location: ${projectPath}`);
        
        // Test the wrapper
        console.log('🧪 Testing installation...');
        try {
            const { execSync } = require('child_process');
            const versionOutput = execSync(`${wrapperPath} --version`, { encoding: 'utf8' });
            console.log(`✅ Test successful: ${versionOutput}`);
        } catch (testError) {
            console.log('⚠️  Test failed, but wrapper created. You may need to restart terminal.');
        }
    }

    installForUnix() {
        console.log('🐧 Creating Unix symlink...');
        
        const cliSource = path.join(this.projectRoot, 'src', 'cli.js');
        const cliTarget = path.join(this.installDir, 'fluxus');
        
        if (!fs.existsSync(cliSource)) {
            throw new Error(`CLI not found at: ${cliSource}`);
        }

        // Remove existing symlink if it exists
        if (fs.existsSync(cliTarget)) {
            fs.unlinkSync(cliTarget);
        }
        
        // Create symlink
        fs.symlinkSync(cliSource, cliTarget, 'file');
        fs.chmodSync(cliTarget, '755');
        
        console.log(`✅ Created symlink: ${cliTarget} -> ${cliSource}`);
    }

    createExamples() {
        const examplesDir = path.join(this.projectRoot, 'examples');
        if (!fs.existsSync(examplesDir)) {
            fs.mkdirSync(examplesDir, { recursive: true });
        }

        const examples = {
            'hello.flux': `# Hello World Example
~ "Hello, Fluxus!" | print()`,

            'arithmetic.flux': `# Arithmetic Operations
~ 5 | add(3) | print()
~ 10 | multiply(2) | subtract(5) | print()`,

            'strings.flux': `# String Transformations
~ "  hello world  " | trim() | to_upper() | print()
~ "apple,banana,cherry" | break(",") | print()`,

            'arrays.flux': `# Array Processing
~ [1, 2, 3, 4, 5] 
| map {.value | multiply(2)} 
| filter {.value > 5} 
| print()`
        };

        Object.entries(examples).forEach(([filename, content]) => {
            const filepath = path.join(examplesDir, filename);
            if (!fs.existsSync(filepath)) {
                fs.writeFileSync(filepath, content);
                console.log(`   Created example: examples/${filename}`);
            }
        });
    }

    showPostInstallMessage() {
        console.log('\n🎉 Fluxus Language Installation Complete!');
        console.log('\n📚 Quick Start Guide:');
        
        if (this.globalInstall) {
            console.log('   fluxus repl                 # Start REPL');
            console.log('   fluxus run examples/hello.flux');
            console.log('   fluxus tutorial             # Interactive lessons');
            console.log('   fluxus dashboard            # Web dashboard');
        } else {
            console.log('   npm run repl               # Start REPL');
            console.log('   npm run examples           # Run examples');
            console.log('   npm run tutorial           # Learn Fluxus');
            console.log('   npm run dashboard          # Web dashboard');
        }
        
        console.log('\n🔧 Development Commands:');
        console.log('   npm test                     # Run test suite');
        console.log('   npm run install-pkg http     # Install packages');
        
        console.log('\n📖 Documentation:');
        console.log('   Read SPECIFICATION.md for language guide');
        console.log('   Read GETTING_STARTED.md for tutorials');
        console.log('   Read DEVELOPER.md for development guide');
        
        if (this.globalInstall) {
            console.log('\n💡 Global installation notes:');
            console.log('   - The fluxus command is now available system-wide');
            console.log('   - Project files remain in:', this.projectRoot);
            console.log('   - Restart terminal if command not found');
        }
        
        console.log('\n🚀 Happy streaming!');
    }
}

// Run installation
try {
    const installer = new FluxusInstaller();
    installer.install();
} catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
}
