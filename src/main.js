// FILENAME: src/main.js  
// Fluxus Main Entry Point v4.2 - SMART ENGINE INTEGRATION

export class FluxusCompiler {
    constructor(options = {}) {
        this.options = {
            useNewArchitecture: options.useNewArchitecture ?? true,
            forceLegacy: options.forceLegacy ?? false,
            debug: options.debug ?? false,
            enableSmartLibrarySelection: options.enableSmartLibrarySelection ?? true, // SMART ENGINE
            enableMetrics: options.enableMetrics ?? true,
            ...options
        };

        this.stats = {
            compilations: 0,
            startTime: Date.now()
        };

        this.printWelcome();
    }

    printWelcome() {
        if (!this.options.debug) return;
        
        console.log('\n✨ Fluxus Language Compiler v4.2');
        console.log('   🧠 Smart Engine with Library Selection');
        console.log('');
    }

    /**
     * MAIN COMPILATION WITH SMART ENGINE
     */
    async compile(source, filename = '<anonymous>') {
        this.stats.compilations++;
        
        try {
            // Use Smart Engine by default
            if (this.options.enableSmartLibrarySelection) {
                return await this.compileWithSmartEngine(source, filename);
            }

            // Fallback to legacy if explicitly disabled
            if (this.options.forceLegacy) {
                return await this.compileLegacy(source, filename);
            }

            return await this.compileWithSmartEngine(source, filename);

        } catch (error) {
            console.error('💥 Compilation failed:', error.message);
            throw error;
        }
    }

    /**
     * PRODUCTION COMPILATION WITH SMART ENGINE
     */
    async compileWithSmartEngine(source, filename) {
        if (this.options.debug) {
            console.log('🧠 Using Smart Engine for compilation...');
        }

        try {
            // Parse source to AST
            const { GraphParser } = await import('./core/parser.js');
            const parser = new GraphParser();
            const ast = parser.parse(source);
            
            // Initialize Smart Engine
            const { RuntimeEngine } = await import('./core/engine.js');
            const engine = new RuntimeEngine({
                enableSmartLibrarySelection: this.options.enableSmartLibrarySelection,
                enableMetrics: this.options.enableMetrics,
                debugMode: this.options.debug,
                quietMode: !this.options.debug
            });

            // Execute with Smart Engine
            await engine.start(ast);

            if (this.options.debug) {
                const stats = engine.getEngineStats();
                console.log(`✅ Smart Engine compilation completed`);
                console.log(`   📊 Library Selections:`, stats.metrics.librarySelections);
                console.log(`   ⚡ Operators: ${stats.metrics.operatorCalls}`);
            }

            return {
                result: "Compilation successful",
                executionEngine: 'smart_engine',
                stats: this.getStats(),
                engineStats: engine.getEngineStats()
            };

        } catch (error) {
            if (this.options.debug) {
                console.log('⚠️ Smart Engine failed, falling back to legacy:', error.message);
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
                quietMode: !this.options.debug,
                enableSmartLibrarySelection: false // Force legacy mode
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
     * ENHANCED STATS WITH SMART ENGINE INFO
     */
    getStats() {
        const now = Date.now();
        const baseStats = {
            ...this.stats,
            uptime: now - this.stats.startTime
        };

        return baseStats;
    }

    printReport() {
        const stats = this.getStats();
        console.log('\n📊 Fluxus Smart Engine Report:');
        console.log(`   📝 Total compilations: ${stats.compilations}`);
        console.log(`   ⏱️ Uptime: ${stats.uptime}ms`);
        console.log(`   🧠 Smart Engine: ${this.options.enableSmartLibrarySelection ? '✅ Enabled' : '❌ Disabled'}`);
    }

    /**
     * ENHANCED DIAGNOSTICS
     */
    async diagnose() {
        const diagnosis = {
            compiler: this.getStats(),
            smartEngine: this.options.enableSmartLibrarySelection,
            recommendations: []
        };

        if (!this.options.enableSmartLibrarySelection) {
            diagnosis.recommendations.push('Enable smart engine for optimal performance');
        }

        return diagnosis;
    }
}

// Smart Engine singleton
export const fluxusCompiler = new FluxusCompiler({ 
    enableSmartLibrarySelection: true,
    enableMetrics: true,
    debug: process.env.NODE_ENV !== 'production'
});

// Enhanced public API
export async function compileFluxus(source, options = {}) {
    const compiler = new FluxusCompiler(options);
    return compiler.compile(source);
}

// Smart Engine factory
export function createSmartEngine(options = {}) {
    const { RuntimeEngine } = require('./core/engine.js');
    return new RuntimeEngine({
        enableSmartLibrarySelection: true,
        enableMetrics: true,
        ...options
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    process.exit(0);
});

process.on('SIGTERM', async () => {
    process.exit(0);
});
