// FILENAME: src/cli.js
// 
// Command Line Interface (CLI) Entry Point for Fluxus Language v1.0.0.
// Handles command routing (run, parse, repl) and interfaces with the core compiler and engine.

// FIX: Change 'require' to 'import' for Node.js built-in modules in an ES Module project.
import fs from 'fs'; // <-- This correctly imports the file system module

import { Compiler } from './core/compiler.js';
import { RuntimeEngine } from './core/engine.js';
import { GraphParser } from './core/parser.js';

// --- MAIN CONSTANTS ---
const ARGS = process.argv.slice(2);
const COMMAND = ARGS[0];
const FILENAME = ARGS[1];
const VERSION = '1.0.0';

// --- CORE UTILITIES ---

/**
 * Loads and reads the content of a Fluxus source file.
 * @param {string} path - The path to the.flux file.
 * @returns {string} The raw source code content.
 */
function loadSourceFile(path) {
    try {
        // --- THE CRITICAL FIX IS HERE ---
        // We use the 'fs' imported at the top of the file.
        return fs.readFileSync(path, 'utf-8');
    } catch (e) {
        console.error(`\n徴 ERROR: Could not find or read file: ${path}`);
        process.exit(1);
    }
}

// ... (Rest of the file remains the same)

function runProgram(ast) {
    const engine = new RuntimeEngine();
    console.log(`\n穴 Executing Fluxus Program...`);
    engine.start(ast); 
}

function handleRun() {
    if (!FILENAME) {
        console.error("Usage: fluxus run <file.flux>");
        return;
    }
    const source = loadSourceFile(FILENAME);
    
    // 1. Parsing: Build the Stream Graph
    const parser = new GraphParser();
    const ast = parser.parse(source);
    
    // 2. Compilation (Type Check/Optimization)
    const compiler = new Compiler();
    const compiledAst = compiler.compile(ast);

    // 3. Execution (The reactive engine starts)
    runProgram(compiledAst);
}

function handleParse() {
    if (!FILENAME) {
        console.error("Usage: fluxus parse <file.flux>");
        return;
    }
    const source = loadSourceFile(FILENAME);
    const parser = new GraphParser();
    const ast = parser.parse(source);
    
    console.log(`\n穴 Parsed Stream Graph for ${FILENAME}:`);
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
    
    console.log(`\n孱ｸCompiled AST (Type Checked and Optimized) for ${FILENAME}:`);
    console.log(JSON.stringify(compiledAst, null, 2));
}

function handleRepl() {
    console.log(`\n穴 Fluxus REPL v${VERSION}`);
    console.log(`Type Fluxus stream syntax to execute (Ctrl+C to exit).`);
    // Placeholder for REPL logic implementation
}

function handleHelp() {
    console.log(`\nUsage: fluxus <command> [options]`);
    console.log(`\nCommands:`);
    console.log(`  run <file.flux>    Execute a Fluxus program.`);
    console.log(`  parse <file.flux>  Output the Abstract Syntax Tree (AST).`);
    console.log(`  compile <file.flux>  Output the type-checked and optimized AST.`);
    console.log(`  repl               Start the interactive REPL.`);
    console.log(`  --version, -v      Display the Fluxus version.`);
}

// --- MAIN DISPATCHER ---

function main() {
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
        case '--version':
        case '-v':
            console.log(`Fluxus Language v${VERSION}`);
            break;
        case 'help':
        default:
            handleHelp();
            break;
    }
}

// Ensure execution is within the main block scope (Node.js convention)
try {
    main();
} catch (e) {
    if (e.code!== 'MODULE_NOT_FOUND') {
        console.error(`\n徴 Fatal Runtime Error: ${e.message}`);
    }
}
