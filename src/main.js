#!/usr/bin/env node
// Fluxus Main Entry Point - Enterprise Grade
import { FluxusCLI } from './cli.js';

// Global error handler
process.on('unhandledRejection', (error) => {
    console.error('💥 Unhandled Promise Rejection:');
    console.error(error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:');
    console.error(error);
    process.exit(1);
});

// Main execution
async function main() {
    try {
        const cli = new FluxusCLI();
        await cli.execute();
    } catch (error) {
        console.error('💥 Fluxus CLI Fatal Error:');
        console.error(error);
        process.exit(1);
    }
}

// Export for testing and programmatic use
export { main, FluxusCLI };

// Auto-execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
