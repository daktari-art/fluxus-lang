import { BaseCommand } from './BaseCommand.js';
import { GraphParser } from '../../core/parser.js';
import { Compiler } from '../../core/compiler.js';
import { RuntimeEngine } from '../../core/engine.js';

export class RunCommand extends BaseCommand {
    constructor(cli) {
        super(cli);
        this.description = 'Execute a Fluxus program';
    }

    async execute(args = []) {
        this.validateArgs(args, 1);

        const filename = args[0];
        const options = args.slice(1);

        try {
            const source = this.cli.loadSourceFile(filename);
            const engine = new RuntimeEngine({
                debugMode: options.includes('--debug'),
                quietMode: options.includes('--quiet')
            });

            const parser = new GraphParser();
            const ast = parser.parse(source);

            const compiler = new Compiler();
            compiler.compile(ast); // Compile for validation

            this.log(`File: ${filename}`, 'info');
            this.log(`AST: ${ast.nodes?.length || 0} nodes`, 'info');

            // 🎯 FIX: Pass the AST, not the compiled program
            await engine.start(ast);

            this.log('Program completed successfully', 'success');
        } catch (error) {
            this.log(`Error running ${filename}: ${error.message}`, 'error');
            throw error;
        }
    }

    showHelp() {
        console.log(`
Usage: fluxus run <file.flux> [options]

Options:
  --debug     Enable debug mode
  --quiet     Enable quiet mode

Examples:
  fluxus run examples/hello.flux
  fluxus run examples/counter.flux --debug
        `);
    }
}

export default RunCommand;
