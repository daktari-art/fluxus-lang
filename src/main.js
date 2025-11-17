// FILENAME: src/main.js  
// Fluxus Main Entry Point v4.1 - WITH ORCHESTRATOR INTEGRATION

import { getOrchestrator } from './orchestrator.js';

export class FluxusCompiler {
    constructor(options = {}) {
        this.options = {
            useNewArchitecture: options.useNewArchitecture ?? true, // DEFAULT TO NEW ARCHITECTURE
            forceLegacy: options.forceLegacy ?? false,
            debug: options.debug ?? false,
            enableOrchestrator: options.enableOrchestrator ?? true, // NEW: Orchestrator integration
            ...options
        };

        this.stats = {
            compilations: 0,
            startTime: Date.now()
        };

        this.orchestrator = null;
        this.printWelcome();
    }

    printWelcome() {
        if (!this.options.debug) return;
        
        console.log('\n✨ Fluxus Language Compiler v4.1');
        console.log('   🚀 Enterprise Architecture with Orchestrator Integration');
        console.log('');
    }

    /**
     * MAIN COMPILATION WITH ORCHESTRATOR SUPPORT
     */
    async compile(source, filename = '<anonymous>') {
        this.stats.compilations++;
        
        try {
            // Use orchestrator by default for production
            if (this.options.enableOrchestrator) {
                return await this.compileWithOrchestrator(source, filename);
            }

            // Fallback to legacy if explicitly disabled
            if (this.options.forceLegacy) {
                return await this.compileLegacy(source, filename);
            }

            return await this.compileWithOrchestrator(source, filename);

        } catch (error) {
            console.error('💥 Compilation failed:', error.message);
            throw error;
        }
    }

    /**
     * PRODUCTION COMPILATION WITH ORCHESTRATOR
     */
    async compileWithOrchestrator(source, filename) {
        if (this.options.debug) {
            console.log('🎯 Using orchestrator for compilation...');
        }

        try {
            // Initialize orchestrator if needed
            if (!this.orchestrator) {
                this.orchestrator = await getOrchestrator({
                    enableMetrics: true,
                    autoRegisterDomains: true,
                    debugMode: this.options.debug
                }).initialize();
            }

            // Parse source to AST
            const { GraphParser } = await import('./core/parser.js');
            const parser = new GraphParser();
            const ast = parser.parse(source);
            
            // Execute with orchestrator
            const result = await this.orchestrator.executeProgram(ast, {
                filename,
                debug: this.options.debug
            });

            if (this.options.debug) {
                const health = this.orchestrator.getHealthStatus();
                console.log(`✅ Orchestrator compilation completed`);
                console.log(`   📊 Domains: ${health.domains.loaded}, Operators: ${health.operators.total}`);
            }

            return {
                result: "Compilation successful",
                executionEngine: 'orchestrator',
                stats: this.getStats(),
                orchestratorStats: this.orchestrator.getHealthStatus()
            };

        } catch (error) {
            if (this.options.debug) {
                console.log('⚠️ Orchestrator failed, falling back to legacy:', error.message);
            }
            return await this.compileLegacy(source, filename);
        }
    }

    /**
     * LEGACY COMPILATION (fallback)
     */
    async compileLegacy(source, filename) {
        if (this.options.debug) {
            console.log('🔙 Using legacy compiler...');
        }

        try {
            const { GraphParser } = await import('./core/parser.js');
            const parser = new GraphParser();
            const ast = parser.parse(source);
            
            const { RuntimeEngine } = await import('./core/engine.js');
            const engine = new RuntimeEngine({ 
                debugMode: this.options.debug,
                quietMode: !this.options.debug 
            });
            
            await engine.start(ast);
            
            if (this.options.debug) {
                console.log('✅ Legacy compilation completed');
            }

            return {
                result: "Compilation successful",
                executionEngine: 'legacy',
                stats: this.getStats()
            };

        } catch (error) {
            throw new Error(`Legacy compilation failed: ${error.message}`);
        }
    }

    /**
     * Compile from file
     */
    async compileFile(filename, options = {}) {
        const fs = await import('fs');
        
        if (!fs.existsSync(filename)) {
            throw new Error(`File not found: ${filename}`);
        }

        const source = fs.readFileSync(filename, 'utf-8');
        return this.compile(source, filename, options);
    }

    /**
     * ENHANCED STATS WITH ORCHESTRATOR INFO
     */
    getStats() {
        const now = Date.now();
        const baseStats = {
            ...this.stats,
            uptime: now - this.stats.startTime
        };

        if (this.orchestrator) {
            const health = this.orchestrator.getHealthStatus();
            baseStats.orchestrator = {
                domains: health.domains.loaded,
                operators: health.operators.total,
                status: health.status
            };
        }

        return baseStats;
    }

    printReport() {
        const stats = this.getStats();
        console.log('\n📊 Fluxus Compilation Report:');
        console.log(`   📝 Total compilations: ${stats.compilations}`);
        console.log(`   ⏱️ Uptime: ${stats.uptime}ms`);
        
        if (stats.orchestrator) {
            console.log(`   🏗️  Domains: ${stats.orchestrator.domains}`);
            console.log(`   ⚡ Operators: ${stats.orchestrator.operators}`);
        }
    }

    /**
     * ENHANCED DIAGNOSTICS
     */
    async diagnose() {
        const diagnosis = {
            compiler: this.getStats(),
            recommendations: []
        };

        if (!this.orchestrator) {
            diagnosis.recommendations.push('Enable orchestrator for production features');
        }

        if (this.options.forceLegacy) {
            diagnosis.recommendations.push('Consider using orchestrator instead of legacy mode');
        }

        return diagnosis;
    }
}

// Enhanced singleton with orchestrator
export const fluxusCompiler = new FluxusCompiler({ 
    enableOrchestrator: true,
    debug: process.env.NODE_ENV !== 'production'
});

// Enhanced public API
export async function compileFluxus(source, options = {}) {
    const compiler = new FluxusCompiler(options);
    return compiler.compile(source);
}

// NEW: Orchestrator access
export { getOrchestrator };

// Enhanced CLI export
export { fluxusCompiler as compiler };

// Handle graceful shutdown
process.on('SIGINT', async () => {
    const orchestrator = getOrchestrator();
    if (orchestrator) {
        await orchestrator.gracefulShutdown(0);
    } else {
        process.exit(0);
    }
});

process.on('SIGTERM', async () => {
    const orchestrator = getOrchestrator();
    if (orchestrator) {
        await orchestrator.gracefulShutdown(0);
    } else {
        process.exit(0);
    }
});
