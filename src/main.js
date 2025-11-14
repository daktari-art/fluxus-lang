// Fluxus Main Entry Point v4.0 - FIXED FOR RUNTIMEENGINE

export class FluxusCompiler {
    constructor(options = {}) {
        this.options = {
            useNewArchitecture: options.useNewArchitecture ?? false,
            forceLegacy: options.forceLegacy ?? false,
            debug: options.debug ?? false,
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
        
        console.log('\n✨ Fluxus Language Compiler v4.0');
        console.log('   🚀 Enterprise Architecture with Migration Support');
        console.log('');
    }

    /**
     * Main compilation entry point
     */
    async compile(source, filename = '<anonymous>') {
        this.stats.compilations++;
        
        try {
            if (this.options.forceLegacy) {
                return await this.compileLegacy(source, filename);
            }

            if (this.options.useNewArchitecture) {
                return await this.compileWithMigration(source, filename);
            }

            // Default to legacy for now
            return await this.compileLegacy(source, filename);

        } catch (error) {
            console.error('💥 Compilation failed:', error.message);
            throw error;
        }
    }

    /**
     * Compile with migration bridge
     */
    async compileWithMigration(source, filename) {
        if (this.options.debug) {
            console.log('🚀 Attempting migration bridge...');
        }

        try {
            const { LegacyMigrationBridge } = await import('./migration/legacy-bridge.js');
            const bridge = new LegacyMigrationBridge({
                debug: this.options.debug
            });

            const result = await bridge.migrateAndExecute(source, { filename });
            
            if (this.options.debug) {
                console.log(`✅ Migration completed`);
                console.log(`   Engine: ${result.executionEngine}`);
            }

            return result;

        } catch (error) {
            if (this.options.debug) {
                console.log('⚠️ Migration failed, falling back to legacy:', error.message);
            }
            return await this.compileLegacy(source, filename);
        }
    }

    /**
     * Direct legacy compilation - FIXED
     */
    async compileLegacy(source, filename) {
        if (this.options.debug) {
            console.log('🔙 Using legacy compiler...');
        }

        try {
            // Parse first
            const { GraphParser } = await import('./core/parser.js');
            const parser = new GraphParser();
            const ast = parser.parse(source);
            
            // Then execute with engine
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
                stats: this.getStats(),
                engineStats: engine.getEngineStats()
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

    getStats() {
        const now = Date.now();
        return {
            ...this.stats,
            uptime: now - this.stats.startTime
        };
    }

    printReport() {
        const stats = this.getStats();
        console.log('\n📊 Fluxus Compilation Report:');
        console.log(`   📝 Total compilations: ${stats.compilations}`);
        console.log(`   ⏱️ Uptime: ${stats.uptime}ms`);
    }
}

// Singleton instance
export const fluxusCompiler = new FluxusCompiler();

// Backward compatibility
export async function compileFluxus(source, options = {}) {
    const compiler = new FluxusCompiler(options);
    return compiler.compile(source);
}

// CLI export
export { fluxusCompiler as compiler };
