// FILENAME: src/cli/commands/TestCommand.js
// Test Command for running Fluxus test suite

import { BaseCommand } from './BaseCommand.js';

export class TestCommand extends BaseCommand {
    constructor(cli) {
        super(cli);
        this.description = 'Run Fluxus language test suite';
    }

    async execute(args = []) {
        try {
            this.log('Running Fluxus Language Test Suite...', 'info');
            
            // Import and run the test runner
            const { runAllTests } = await import('../../../test-run.js');
            await runAllTests();
            
        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'error');
            throw error;
        }
    }

    showHelp() {
        console.log(`
Usage: fluxus test

Description:
  Runs the complete test suite to verify all Fluxus examples work correctly.

Examples:
  fluxus test
        `);
    }
}

export default TestCommand;
