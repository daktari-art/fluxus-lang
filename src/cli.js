#!/usr/bin/env node
// FILENAME: src/cli.js
// Fluxus CLI v4.0 - ENTERPRISE GRADE (Fixed Export)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Compiler } from './core/compiler.js';
import { RuntimeEngine } from './core/engine.js';
import { GraphParser } from './core/parser.js';
import { FluxusREPL } from './repl.js';
import { FluxusPackageManager } from './package-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FluxusCLI {
    constructor() {
        this.version = '4.0.0';
        this.build = 'enterprise';
    }

    async execute() {
        const args = process.argv.slice(2);
        const command = args[0];
        const filename = args[1];
        const options = args.slice(2);

        try {
            await this.dispatchCommand(command, filename, options);
        } catch (error) {
            this.handleFatalError(error);
        }
    }

    async dispatchCommand(command, filename, options) {
        const commandHandlers = {
            'run': () => this.handleRun(filename, options),
            'repl': () => this.handleRepl(options),
            'libraries': () => this.handleLibraries(filename, options),
            'packages': () => this.handlePackages(filename, options),
            'doctor': () => this.handleDoctor(),
            'benchmark': () => this.handleBenchmark(),
            'version': () => this.handleVersion(),
            'help': () => this.handleHelp(),
            '--help': () => this.handleHelp(),
            '-h': () => this.handleHelp(),
            '': () => this.handleHelp()  // Handle empty command
        };

        const handler = commandHandlers[command] || this.handleHelp;
        await handler.call(this);
    }

    // 🚀 EXECUTION COMMANDS
    async handleRun(filename, options) {
        if (!filename) {
            this.showUsageError('run <file.flux>');
            return;
        }

        this.showBanner('EXECUTION');
        const source = this.loadSourceFile(filename);
        
        const engine = new RuntimeEngine({
            debugMode: options.includes('--debug'),
            quietMode: options.includes('--production')
        });

        const parser = new GraphParser();
        const ast = parser.parse(source);
        
        const compiler = new Compiler();
        const compiledAst = compiler.compile(ast);

        console.log(`📁 File: ${filename}`);
        console.log(`📊 AST: ${ast.nodes?.length || 0} nodes`);
        
        await engine.start(compiledAst);
    }

    async handleRepl(options) {
        this.showBanner('INTERACTIVE REPL');
        const repl = new FluxusREPL({
            debugMode: options.includes('--debug')
        });
        await repl.start();
    }

    // 📚 LIBRARY MANAGEMENT
    async handleLibraries(subcommand, options) {
        this.showBanner('LIBRARY MANAGEMENT');

        switch (subcommand) {
            case 'list':
                console.log('📚 Available Standard Libraries:');
                const libraries = ['core', 'math', 'string', 'collections', 'time', 'reactive', 'network', 'sensors'];
                libraries.forEach(lib => {
                    console.log(`   📦 ${lib}`);
                });
                break;

            case 'operators':
                console.log('🔧 Available Operators:');
                const operators = {
                    'Arithmetic': ['add', 'subtract', 'multiply', 'divide'],
                    'String': ['trim', 'to_upper', 'to_lower', 'concat'],
                    'Collections': ['map', 'reduce', 'filter'],
                    'Reactive': ['combine_latest', 'to_pool'],
                    'IO': ['print', 'ui_render']
                };
                Object.entries(operators).forEach(([category, ops]) => {
                    console.log(`\n   ${category}:`);
                    console.log(`   ${ops.join(', ')}`);
                });
                break;

            default:
                console.log('📚 Library Commands:');
                console.log('  fluxus libraries list          List available libraries');
                console.log('  fluxus libraries operators     Show operators by category');
        }
    }

    // 📦 PACKAGE MANAGEMENT
    async handlePackages(subcommand, options) {
        const pm = new FluxusPackageManager();
        this.showBanner('PACKAGE MANAGEMENT');

        switch (subcommand) {
            case 'install':
                if (!options[0]) {
                    console.error('❌ Usage: fluxus packages install <package-name>');
                    return;
                }
                console.log(`📦 Installing: ${options[0]}`);
                // pm.install(options[0]);
                break;

            case 'list':
                console.log('📦 Installed Packages:');
                console.log('   http');
                console.log('   sensors-mock');
                console.log('   sensors-real');
                break;

            default:
                console.log('📦 Package Commands:');
                console.log('  fluxus packages install <pkg>    Install a package');
                console.log('  fluxus packages list            List installed packages');
        }
    }

    // 🩺 SYSTEM DIAGNOSTICS
    async handleDoctor() {
        this.showBanner('SYSTEM DIAGNOSTICS');
        
        const checks = [
            { name: 'Core Parser', check: () => new GraphParser() },
            { name: 'Compiler', check: () => new Compiler() },
            { name: 'Runtime Engine', check: () => new RuntimeEngine() },
            { name: 'Package Manager', check: () => new FluxusPackageManager() },
            { name: 'REPL System', check: () => new FluxusREPL() }
        ];

        let allPassed = true;
        
        for (const check of checks) {
            try {
                check.check();
                console.log(`✅ ${check.name}: OK`);
            } catch (error) {
                console.log(`❌ ${check.name}: FAILED - ${error.message}`);
                allPassed = false;
            }
        }

        console.log(allPassed ? '\n💚 All systems operational!' : '\n💔 Some systems need attention.');
    }

    // 🏃 PERFORMANCE BENCHMARK
    async handleBenchmark() {
        this.showBanner('PERFORMANCE BENCHMARK');
        
        const examples = ['examples/arithmetic.flux', 'examples/hello.flux'];
        
        for (const example of examples) {
            try {
                const source = this.loadSourceFile(example);
                const parser = new GraphParser();
                const ast = parser.parse(source);
                const compiler = new Compiler();
                const compiledAst = compiler.compile(ast);
                const engine = new RuntimeEngine({ quietMode: true });
                
                const startTime = Date.now();
                await engine.start(compiledAst);
                const executionTime = Date.now() - startTime;

                console.log(`⏱️  ${example}: ${executionTime}ms`);
            } catch (error) {
                console.log(`❌ ${example}: ERROR - ${error.message}`);
            }
        }
    }

    // ℹ️ INFORMATIONAL COMMANDS
    handleVersion() {
        console.log(`🌊 Fluxus Language v${this.version}`);
        console.log(`   Build: ${this.build}`);
    }

    handleHelp() {
        this.showBanner('COMMAND REFERENCE');
        
        console.log('🚀 EXECUTION:');
        console.log('  fluxus run <file.flux>       Execute a Fluxus program');
        console.log('  fluxus repl                 Start interactive REPL');
        console.log('');
        
        console.log('📚 LIBRARIES & PACKAGES:');
        console.log('  fluxus libraries list        List available libraries');
        console.log('  fluxus libraries operators   Show operators by category');
        console.log('  fluxus packages list         List installed packages');
        console.log('');
        
        console.log('🧪 TESTING & QUALITY:');
        console.log('  fluxus benchmark            Performance benchmarks');
        console.log('  fluxus doctor               System diagnostics');
        console.log('');
        
        console.log('ℹ️ INFORMATION:');
        console.log('  fluxus version              Show version information');
        console.log('  fluxus help                 This help message');
        console.log('');
        
        console.log('💡 Examples:');
        console.log('  fluxus run examples/hello.flux');
        console.log('  fluxus repl');
        console.log('  fluxus libraries list');
    }

    // 🎯 UTILITY METHODS
    loadSourceFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            throw new Error(`Could not read file: ${filePath}`);
        }
    }

    showBanner(section) {
        console.log(`\n🌊 FLUXUS v${this.version} - ${section}`);
        console.log('═'.repeat(50));
    }

    showUsageError(usage) {
        console.error(`❌ Usage: fluxus ${usage}`);
    }

    handleFatalError(error) {
        console.error('💥 Fluxus CLI Fatal Error:');
        console.error(error);
        process.exit(1);
    }
}

// 🎯 MAIN FUNCTION - This is what bin/fluxus.js expects
export function main() {
    const cli = new FluxusCLI();
    return cli.execute();
}

// Export the class for programmatic use
export { FluxusCLI };

// Auto-execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
