// FILENAME: src/cli.js
// Command Line Interface for Fluxus Language

import fs from 'fs';
import { Compiler } from './core/compiler.js';
import { RuntimeEngine } from './core/engine.js';
import { GraphParser } from './core/parser.js';
import { FluxusREPL } from './repl.js';

const ARGS = process.argv.slice(2);
const COMMAND = ARGS[0];
const FILENAME = ARGS[1];

function loadSourceFile(path) {
    try {
        return fs.readFileSync(path, 'utf-8');
    } catch (e) {
        console.error(`\n徴 ERROR: Could not find or read file: ${path}`);
        process.exit(1);
    }
}

function handleRun() {
    if (!FILENAME) {
        console.error("Usage: fluxus run <file.flux>");
        return;
    }
    const source = loadSourceFile(FILENAME);
    
    const parser = new GraphParser();
    const ast = parser.parse(source);
    
    const compiler = new Compiler();
    const compiledAst = compiler.compile(ast);

    const engine = new RuntimeEngine();
    console.log(`\n穴 Executing Fluxus Program...`);
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
    
    console.log(`\n孱ｸCompiled AST for ${FILENAME}:`);
    console.log(JSON.stringify(compiledAst, null, 2));
}

function handleRepl() {
    const repl = new FluxusREPL();
    repl.start();
}

function handleHelp() {
    console.log(`\nUsage: fluxus <command> [options]`);
    console.log(`\nCommands:`);
    console.log(`  run <file.flux>    Execute a Fluxus program`);
    console.log(`  parse <file.flux>  Output the Abstract Syntax Tree (AST)`);
    console.log(`  compile <file.flux>  Output the compiled AST`);
    console.log(`  repl               Start the interactive REPL`);
    console.log(`  --version, -v      Display the Fluxus version`);
    console.log(`  help               Show this help message`);
}

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
            console.log('Fluxus Language v1.0.0');
            break;
        case 'help':
        default:
            handleHelp();
            break;
    }
}

try {
    main();
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        console.error(`\n徴 Error: ${e.message}`);
    }
}
