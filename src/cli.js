// FILENAME: src/cli.js
// Enhanced CLI with Fixed Exports for Global Installation

import fs from 'fs';
import { Compiler } from './core/compiler.js';
import { RuntimeEngine } from './core/engine.js';
import { GraphParser } from './core/parser.js';
import { FluxusREPL } from './repl.js';
import { FluxusTutorial } from './tutorial.js';
import { FluxusDashboard } from './dashboard.js';
import { FluxusProfiler } from './profiler.js';
import { FluxusPackageManager } from './package-manager.js';

const ARGS = process.argv.slice(2);
const COMMAND = ARGS[0];
const FILENAME = ARGS[1];
const ARG2 = ARGS[2];

function loadSourceFile(path) {
    try {
        return fs.readFileSync(path, 'utf-8');
    } catch (e) {
        console.error(`\n❌ ERROR: Could not find or read file: ${path}`);
        process.exit(1);
    }
}

function handleRun() {
    if (!FILENAME) {
        console.error("Usage: fluxus run <file.flux>");
        console.error("Or:    npm run examples");
        return;
    }
    const source = loadSourceFile(FILENAME);
    
    const parser = new GraphParser();
    const ast = parser.parse(source);
    
    const compiler = new Compiler();
    const compiledAst = compiler.compile(ast);

    const engine = new RuntimeEngine();
    
    // Enable profiling if requested
    if (process.env.FLUXUS_PROFILE) {
        const profiler = new FluxusProfiler(engine);
        profiler.enable();
    }

    console.log(`\n🚀 Executing Fluxus Program...`);
    engine.start(compiledAst);
}

function handleParse() {
    if (!FILENAME) {
        console.error("Usage: fluxus parse <file.flux>");
        return;
    }
    const source = loadSourceFile(FILENAME);
    const parser = new GraphParser();
    const ast = parser.parse(source);
    
    console.log(`\n🔍 Parsed Stream Graph for ${FILENAME}:`);
    console.log(JSON.stringify(ast, null, 2));
}

function handleCompile() {
    if (!FILENAME) {
        console.error("Usage: fluxus compile <file.flux>");
        return;
    }
    const source = loadSourceFile(FILENAME);
    const parser = new GraphParser();
    const ast = parser.parse(source);

    const compiler = new Compiler();
    const compiledAst = compiler.compile(ast);
    
    console.log(`\n⚙️ Compiled AST for ${FILENAME}:`);
    console.log(JSON.stringify(compiledAst, null, 2));
}

function handleRepl() {
    const repl = new FluxusREPL();
    repl.start();
}

function handleTutorial() {
    const tutorial = new FluxusTutorial();
    tutorial.start();
}

function handleDashboard() {
    const engine = new RuntimeEngine();
    const dashboard = new FluxusDashboard(engine);
    dashboard.start();
}

function handleProfile() {
    if (!FILENAME) {
        console.error("Usage: fluxus profile <file.flux>");
        return;
    }
    
    process.env.FLUXUS_PROFILE = 'true';
    handleRun();
}

function handlePackageManager() {
    const pm = new FluxusPackageManager();
    
    switch (COMMAND) {
        case 'install':
            if (!FILENAME) {
                console.error("Usage: fluxus install <package-name>");
                console.error("Available packages: http, fs, crypto, time, math, utils");
                return;
            }
            pm.install(FILENAME);
            break;
        case 'uninstall':
            if (!FILENAME) {
                console.error("Usage: fluxus uninstall <package-name>");
                return;
            }
            pm.uninstall(FILENAME);
            break;
        case 'list':
            pm.list();
            break;
        case 'search':
            if (!FILENAME) {
                console.error("Usage: fluxus search <query>");
                return;
            }
            pm.search(FILENAME);
            break;
        default:
            console.log("Package manager commands:");
            console.log("  fluxus install <package>    Install a package");
            console.log("  fluxus uninstall <package>  Uninstall a package");
            console.log("  fluxus list                 List installed packages");
            console.log("  fluxus search <query>       Search for packages");
            console.log("\nAvailable packages: http, fs, crypto, time, math, utils");
    }
}

function handleHelp() {
    console.log(`\n🌊 Fluxus Language v4.0`);
    console.log(`\nUsage: fluxus <command> [options]`);
    console.log(`\nCore Commands:`);
    console.log(`  run <file.flux>      Execute a Fluxus program`);
    console.log(`  parse <file.flux>    Output the Abstract Syntax Tree (AST)`);
    console.log(`  compile <file.flux>  Output the compiled AST`);
    console.log(`  repl                 Start the interactive REPL`);
    console.log(`  tutorial             Start interactive tutorial`);
    console.log(`\nAdvanced Features:`);
    console.log(`  dashboard            Start real-time web dashboard`);
    console.log(`  profile <file.flux>  Run with performance profiling`);
    console.log(`\nPackage Management:`);
    console.log(`  install <package>    Install a FLOW package`);
    console.log(`  uninstall <package>  Uninstall a package`);
    console.log(`  list                 List installed packages`);
    console.log(`  search <query>       Search for packages`);
    console.log(`\nQuick Start:`);
    console.log(`  fluxus repl          # Start REPL`);
    console.log(`  fluxus tutorial      # Interactive lessons`);
    console.log(`  fluxus run examples/hello.flux`);
}

// Main function that handles command execution
export function main() {
    switch (COMMAND) {
        case 'run':
            handleRun();
            break;
        case 'parse':
            handleParse();
            break;
        case 'compile':
            handleCompile();
            break;
        case 'repl':
            handleRepl();
            break;
        case 'tutorial':
            handleTutorial();
            break;
        case 'dashboard':
            handleDashboard();
            break;
        case 'profile':
            handleProfile();
            break;
        case 'install':
        case 'uninstall':
        case 'list':
        case 'search':
            handlePackageManager();
            break;
        case '--version':
        case '-v':
            console.log('Fluxus Language v4.0');
            break;
        case 'help':
        default:
            handleHelp();
            break;
    }
}

// Auto-execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
