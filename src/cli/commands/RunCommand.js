// FILENAME: src/cli/commands/RunCommand.js
import { BaseCommand } from './BaseCommand.js';
import { GraphParser } from '../../core/parser.js';
import { Compiler } from '../../core/compiler.js';
import { RuntimeEngine } from '../../core/engine.js'; // SMART ENGINE

export class RunCommand extends BaseCommand {
    constructor(cli) {
        super(cli);
        this.description = 'Execute a Fluxus program with Smart Engine';
    }

    async execute(args = []) {
        this.validateArgs(args, 1);

        const filename = args[0];
        const options = args.slice(1);

        try {
            const source = this.cli.loadSourceFile(filename);
            
            // USE SMART ENGINE WITH OPTIONS
            const engine = new RuntimeEngine({
                debugMode: options.includes('--debug'),
                quietMode: options.includes('--quiet'),
                enableSmartLibrarySelection: !options.includes('--no-smart-libs'),
                enableMetrics: options.includes('--metrics'),
                logLevel: options.includes('--debug') ? 'DEBUG' : 'INFO'
            });

            const parser = new GraphParser();
            const ast = parser.parse(source);

            const compiler = new Compiler();
            compiler.compile(ast); // Compile for validation

            this.log(`File: ${filename}`, 'info');
            this.log(`AST: ${ast.nodes?.length || 0} nodes`, 'info');
            this.log(`Engine: Smart Library ${options.includes('--no-smart-libs') ? 'Disabled' : 'Enabled'}`, 'info');

            // 🎯 FIX: Pass the AST, not the compiled program
            await engine.start(ast);

            // Show smart engine metrics if enabled
            if (options.includes('--metrics')) {
                const stats = engine.getEngineStats();
                this.log(`Library Selections: ${JSON.stringify(stats.metrics.librarySelections)}`, 'info');
                this.log(`Domain Calls: ${stats.metrics.domainOperatorCalls}`, 'info');
            }

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
  --debug          Enable debug mode
  --quiet          Enable quiet mode  
  --no-smart-libs  Disable smart library selection
  --metrics        Show engine metrics

Examples:
  fluxus run examples/hello.flux
  fluxus run examples/comprehensive-working.flux --metrics
  fluxus run examples/counter.flux --debug --no-smart-libs
        `);
    }
}

export default RunCommand;
