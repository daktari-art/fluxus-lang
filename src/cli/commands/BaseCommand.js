// FILENAME: src/cli/commands/BaseCommand.js
// Base Command Class for Fluxus CLI

export class BaseCommand {
    constructor(cli, options = {}) {
        this.cli = cli;
        this.name = this.constructor.name.replace('Command', '').toLowerCase();
        this.description = 'No description provided';
        this.options = options;
    }

    async execute(args = []) {
        throw new Error('Command.execute() must be implemented by subclass');
    }

    showHelp() {
        console.log(`Usage: fluxus ${this.name} [options]`);
        console.log(`Description: ${this.description}`);
    }

    validateArgs(args, expectedCount) {
        if (args.length < expectedCount) {
            throw new Error(`Expected ${expectedCount} arguments, got ${args.length}`);
        }
    }

    log(message, level = 'info') {
        const prefixes = {
            info: '📝',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        console.log(`${prefixes[level]} ${message}`);
    }
}

export default BaseCommand;
