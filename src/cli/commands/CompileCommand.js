// FILENAME: src/cli/commands/CompileCommand.js
// Compile Command for compiling Fluxus programs to IR

import { BaseCommand } from './BaseCommand.js';
import { GraphParser } from '../../core/parser.js';
import { Compiler } from '../../core/compiler.js';

export class CompileCommand extends BaseCommand {
    constructor(cli) {
        super(cli);
        this.description = 'Compile Fluxus program to intermediate representation';
    }

    async execute(args = []) {
        this.validateArgs(args, 1);
        
        const filename = args[0];
        const options = args.slice(1);
        
        try {
            const source = this.cli.loadSourceFile(filename);
            const parser = new GraphParser();
            const ast = parser.parse(source);
            
            const compiler = new Compiler();
            const compiled = compiler.compile(ast);

            this.log('Compiled Program:', 'info');
            console.log(JSON.stringify(compiled, null, 2));
            
            if (options.includes('--output')) {
                const runtimeCode = compiler.generateRuntimeCode(compiled);
                this.log('Generated Runtime Code:', 'info');
                console.log(runtimeCode);
            }
            
        } catch (error) {
            this.log(`Error compiling ${filename}: ${error.message}`, 'error');
            throw error;
        }
    }

    showHelp() {
        console.log(`
Usage: fluxus compile <file.flux> [options]

Options:
  --output    Generate runtime JavaScript code

Examples:
  fluxus compile examples/hello.flux
  fluxus compile examples/counter.flux --output
        `);
    }
}

export default CompileCommand;
