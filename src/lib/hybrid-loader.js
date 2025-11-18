//// FILENAME: src/lib/hybrid-loader.js
// Fluxus Enterprise Hybrid Library Loader v5.0 - LIB MIGRATION COMPLETE
// UPDATED FOR LIB-ONLY OPERATION

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusLibraryLoader extends EventEmitter {
    constructor(engine, config = {}) {
        super();

        this.engine = engine;
        this.config = {
            enableSecurity: false,
            enableCaching: true,
            enableMetrics: true,
            debugMode: config.debugMode || false,
            autoDiscoverDomains: true,
            quietMode: config.quietMode || false,
            ...config
        };

        this.loadedLibraries = new Map();
        this.libraryCache = new Map();
        this.domainLibraries = new Map();
        this.libraryRegistry = new Map();
        this.metrics = {
            loads: 0,
            cacheHits: 0,
            errors: 0,
            startTime: performance.now()
        };

        this.initialized = false;
        this.initializationPromise = this.initializeProductionLoader();
    }

    /**
     * PRODUCTION INITIALIZATION WITH LIB-ONLY PATHS
     */
    async initializeProductionLoader() {
        try {
            // Build production library registry with LIB paths only
            this.libraryRegistry = await this.buildProductionRegistry();

            // Auto-discover domain libraries
            if (this.config.autoDiscoverDomains) {
                await this.discoverDomainLibraries();
            }

            // Preload core libraries for performance
            await this.preloadCoreLibraries();

            this.initialized = true;

            this.emit('initialized', {
                timestamp: Date.now(),
                libraryCount: this.libraryRegistry.size,
                domainCount: this.domainLibraries.size
            });

            if (this.config.debugMode && !this.config.quietMode) {
                console.log('🏢 Production Library Loader initialized');
                console.log(`   📚 Registered libraries: ${this.libraryRegistry.size}`);
                console.log(`   🏗️  Domain libraries: ${this.domainLibraries.size}`);
            }

        } catch (error) {
            console.error('💥 Production loader initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * ENHANCED LIBRARY DISCOVERY WITH LIB-ONLY PATHS
     */
    async buildProductionRegistry() {
        const registry = new Map();

        // Core libraries with LIB paths only
        const coreLibraries = [
            {
                name: 'core',
                paths: [
                    './core/operators/index.js',           // CHANGED: lib/core/operators
                    './core/index.js',
                    './core/core.js'
                ],
                category: 'foundation',
                critical: true
            },
            {
                name: 'math',
                paths: [
                    './math/index.js',                     // CHANGED: lib/math
                    './math/math.js'
                ],
                category: 'standard'
            },
            {
                name: 'math_basic',
                paths: [
                    './math/basic/index.js',               // NEW: lib/math/basic
                    './math/basic.js'
                ],
                category: 'standard'
            },
            {
                name: 'math_advanced',
                paths: [
                    './math/index.js',                     // CHANGED: lib/math
                    './math/math.js'
                ],
                category: 'standard'
            },
            {
                name: 'text',
                paths: [
                    './text/index.js',                     // NEW: lib/text
                    './text/string.js'
                ],
                category: 'standard'
            },
            {
                name: 'collections',
                paths: [
                    './core/collections.js',
                    './data/collections.js'
                ],
                category: 'foundation'
            },
            {
                name: 'time',
                paths: [
                    './time/index.js',                     // CHANGED: lib/time
                    './time/time.js'
                ],
                category: 'standard'
            },
            {
                name: 'network',
                paths: [
                    './network/index.js',                  // CHANGED: lib/network
                    './network/network.js'
                ],
                category: 'domain'
            },
            {
                name: 'reactive',
                paths: [
                    './reactive/index.js',                 // CHANGED: lib/reactive
                    './reactive/reactive.js'
                ],
                category: 'domain'
            },
            {
                name: 'analytics',
                paths: [
                    './domains/analytics.js',              // CHANGED: lib/domains/analytics
                    './analytics/index.js'
                ],
                category: 'domain'
            },
            {
                name: 'health',
                paths: [
                    './domains/health.js',                 // CHANGED: lib/domains/health
                    './health/index.js'
                ],
                category: 'domain'
            },
            {
                name: 'iot',
                paths: [
                    './domains/iot.js',                    // CHANGED: lib/domains/iot
                    './iot/index.js'
                ],
                category: 'domain'
            },
            {
                name: 'security',
                paths: [
                    './security/index.js',                 // NEW: lib/security
                    './security/security.js'
                ],
                category: 'domain'
            }
        ];

        // Discover and register libraries
        for (const lib of coreLibraries) {
            const resolvedPath = await this.resolveLibraryPath(lib);
            if (resolvedPath) {
                registry.set(lib.name, {
                    path: resolvedPath,
                    category: lib.category,
                    critical: lib.critical || false,
                    discovered: true
                });

                if (this.config.debugMode && !this.config.quietMode) {
                    console.log(`   📍 Discovered ${lib.name} at ${resolvedPath}`);
                }
            } else if (lib.critical && !this.config.quietMode) {
                console.warn(`⚠️  Critical library not found: ${lib.name}`);
            }
        }

        return registry;
    }

    /**
     * ENHANCED DOMAIN LIBRARY DISCOVERY - LIB ONLY
     */
    async discoverDomainLibraries() {
        try {
            const domainsDir = path.join(__dirname, 'domains');

            try {
                await fs.access(domainsDir);
            } catch {
                if (this.config.debugMode && !this.config.quietMode) {
                    console.log('   📁 Domains directory not found, skipping domain discovery');
                }
                return;
            }

            const files = await fs.readdir(domainsDir);
            const domainFiles = files.filter(f => f.endsWith('.js') && !f.startsWith('.'));

            for (const domainFile of domainFiles) {
                const domainName = domainFile.replace('.js', '');
                const domainPath = path.join(domainsDir, domainFile);

                try {
                    const module = await import(`file://${domainPath}`);

                    this.domainLibraries.set(domainName, {
                        module,
                        path: domainPath,
                        discoveredAt: Date.now(),
                        operators: this.extractOperatorsFromDomain(module)
                    });

                    if (this.config.debugMode && !this.config.quietMode) {
                        console.log(`   🏗️  Discovered domain: ${domainName} (${this.domainLibraries.get(domainName).operators.length} operators)`);
                    }

                } catch (error) {
                    if (!this.config.quietMode) {
                        console.warn(`⚠️ Failed to load domain ${domainName}:`, error.message);
                    }
                }
            }

        } catch (error) {
            if (!this.config.quietMode) {
                console.warn('⚠️ Domain discovery failed:', error.message);
            }
        }
    }

    /**
     * INTELLIGENT PATH RESOLUTION - LIB ONLY WITH FALLBACKS
     */
    async resolveLibraryPath(libraryInfo) {
        for (const libPath of libraryInfo.paths) {
            try {
                const fullPath = path.join(__dirname, libPath);
                await fs.access(fullPath);
                return libPath; // Return relative path for dynamic import
            } catch (error) {
                // Try next path
                continue;
            }
        }

        // No path found - try direct lib path as last resort
        const directPath = `./${libraryInfo.name}/index.js`;
        try {
            const fullPath = path.join(__dirname, directPath);
            await fs.access(fullPath);
            return directPath;
        } catch {
            return null;
        }
    }

    /**
     * RESOLVE LIBRARY PATH FOR ENGINE INTEGRATION
     */
    resolveLibraryPathForEngine(libraryName, libraryInfo) {
        // ALL paths now resolve to lib directory
        const basePaths = {
            'lib': './',  // All libraries are in lib/ now
            'stdlib': './' // Redirect stdlib to lib for compatibility
        };

        const basePath = basePaths[libraryInfo.type] || './';
        const libraryPath = libraryInfo.path || libraryName;
        
        return `${basePath}${libraryPath}`;
    }

    /**
     * ENHANCED LIBRARY LOADING WITH LIB-ONLY OPERATOR EXTRACTION
     */
    async loadLibrary(libraryName, options = {}) {
        const loadId = `load_${Date.now()}_${libraryName}`;
        const startTime = performance.now();

        this.metrics.loads++;

        // Wait for initialization
        if (!this.initialized && this.initializationPromise) {
            await this.initializationPromise;
        }

        try {
            // Check cache first
            if (this.config.enableCaching && this.libraryCache.has(libraryName)) {
                this.metrics.cacheHits++;
                const cached = this.libraryCache.get(libraryName);
                this.emit('cacheHit', { library: libraryName, loadId });
                return cached;
            }

            // Try domain libraries first
            if (this.domainLibraries.has(libraryName)) {
                const domain = this.domainLibraries.get(libraryName);
                this.libraryCache.set(libraryName, domain.module);
                return domain.module;
            }

            // Then try standard libraries
            const libraryInfo = this.libraryRegistry.get(libraryName);
            if (!libraryInfo) {
                throw new Error(`Library '${libraryName}' not found in registry`);
            }

            // Load library implementation
            const libraryExports = await this.loadLibraryImplementation(libraryName, libraryInfo, options);

            // Cache the result
            if (this.config.enableCaching) {
                this.libraryCache.set(libraryName, libraryExports);
            }

            // Register as loaded
            this.loadedLibraries.set(libraryName, {
                exports: libraryExports,
                loadedAt: Date.now(),
                loadTime: performance.now() - startTime
            });

            const loadTime = performance.now() - startTime;

            this.emit('loadSuccess', {
                library: libraryName,
                loadTime,
                loadId,
                cached: false
            });

            if (this.config.debugMode && !this.config.quietMode) {
                console.log(`📦 Loaded ${libraryName} in ${loadTime.toFixed(2)}ms`);
            }

            return libraryExports;

        } catch (error) {
            this.metrics.errors++;
            const errorTime = performance.now() - startTime;

            this.emit('loadError', {
                library: libraryName,
                error: error.message,
                loadTime: errorTime,
                loadId
            });

            const enhancedError = new Error(`Failed to load library '${libraryName}': ${error.message}`);
            enhancedError.library = libraryName;
            enhancedError.code = 'LIBRARY_LOAD_ERROR';

            throw enhancedError;
        }
    }

    /**
     * ROBUST LIBRARY IMPLEMENTATION LOADING - LIB ONLY
     */
    async loadLibraryImplementation(libraryName, libraryInfo, options) {
        try {
            const fullPath = path.join(__dirname, libraryInfo.path);

            // Verify file exists
            await fs.access(fullPath);

            // Dynamic import with enhanced error handling
            const importPath = `file://${fullPath}`;
            const module = await import(importPath);

            // Extract exports
            const exports = module.default || module;

            if (!exports || typeof exports !== 'object') {
                throw new Error('Library must export an object or have a default export');
            }

            // Special handling for core operators
            if (libraryName === 'core' && exports.getAllOperators) {
                return {
                    operators: exports.getAllOperators(),
                    getOperators: exports.getOperators,
                    executeOperator: exports.executeOperator
                };
            }

            // Handle domain registration
            if (exports.registerWithEngine && this.engine && options.registerWithEngine !== false) {
                try {
                    exports.registerWithEngine(this.engine);
                } catch (regError) {
                    console.warn(`⚠️ Domain registration failed for ${libraryName}:`, regError.message);
                }
            }

            return exports;

        } catch (error) {
            if (error.code === 'ERR_MODULE_NOT_FOUND') {
                throw new Error(`Library file not found: ${libraryInfo.path}`);
            } else if (error.message.includes('SyntaxError')) {
                throw new Error(`Syntax error in library ${libraryName}`);
            } else {
                throw new Error(`Import failed: ${error.message}`);
            }
        }
    }

    /**
     * PERFORMANCE-OPTIMIZED CORE PRELOADING - LIB ONLY
     */
    async preloadCoreLibraries() {
        const coreLibraries = ['core', 'math', 'math_basic', 'text'];
        const preloadPromises = [];

        for (const libName of coreLibraries) {
            if (this.libraryRegistry.has(libName)) {
                preloadPromises.push(
                    this.loadLibrary(libName).catch(error => {
                        // Log but don't fail initialization for non-critical errors
                        if (!this.config.quietMode) {
                            console.warn(`⚠️  Preload failed for ${libName}:`, error.message);
                        }
                    })
                );
            }
        }

        await Promise.allSettled(preloadPromises);

        if (this.config.debugMode && !this.config.quietMode) {
            console.log(`   🔄 Preloaded ${preloadPromises.length} core libraries`);
        }
    }

    /**
     * DOMAIN-SPECIFIC METHODS - UPDATED FOR LIB
     */
    extractOperatorsFromDomain(domainModule) {
        const operators = [];

        if (domainModule.IOT_OPERATORS) {
            operators.push(...Object.keys(domainModule.IOT_OPERATORS));
        }
        if (domainModule.default && typeof domainModule.default === 'object') {
            operators.push(...Object.keys(domainModule.default));
        }
        if (domainModule.getOperators) {
            const domainOps = domainModule.getOperators();
            if (typeof domainOps === 'object') {
                operators.push(...Object.keys(domainOps));
            }
        }
        if (domainModule.operators) {
            operators.push(...Object.keys(domainModule.operators));
        }
        if (domainModule.MATH_OPERATORS) {
            operators.push(...Object.keys(domainModule.MATH_OPERATORS));
        }
        if (domainModule.STATS_OPERATORS) {
            operators.push(...Object.keys(domainModule.STATS_OPERATORS));
        }

        return operators;
    }

    getDomainOperators(domainName) {
        const domain = this.domainLibraries.get(domainName);
        return domain ? domain.operators : [];
    }

    getAllDomains() {
        return Array.from(this.domainLibraries.keys());
    }

    async loadDomainLibrary(domainName) {
        return this.loadLibrary(domainName);
    }

    /**
     * EXECUTE OPERATOR FROM LOADED LIBRARIES - LIB ONLY
     */
    async executeOperator(operatorName, inputData, args, context) {
        // Find which library contains this operator
        for (const [libName, libModule] of this.loadedLibraries.entries()) {
            const exports = libModule.exports;
            
            if (exports && exports.operators && exports.operators[operatorName]) {
                return await exports.operators[operatorName](inputData, args, context);
            }
            
            if (exports && exports[operatorName] && typeof exports[operatorName] === 'function') {
                return await exports[operatorName](inputData, args, context);
            }

            // Handle core operator registry
            if (exports && exports.executeOperator && typeof exports.executeOperator === 'function') {
                try {
                    return await exports.executeOperator(operatorName, inputData, args, context);
                } catch {
                    // Continue to next library
                }
            }
        }

        // Try domain libraries
        for (const [domainName, domain] of this.domainLibraries.entries()) {
            const module = domain.module;
            
            if (module.operators && module.operators[operatorName]) {
                return await module.operators[operatorName](inputData, args, context);
            }
            
            if (module[operatorName] && typeof module[operatorName] === 'function') {
                return await module[operatorName](inputData, args, context);
            }
        }

        throw new Error(`Operator ${operatorName} not found in any loaded library`);
    }

    /**
     * ENHANCED METRICS WITH LIB INFO
     */
    getMetrics() {
        const uptime = performance.now() - this.metrics.startTime;
        const successRate = this.metrics.loads > 0 ?
            ((this.metrics.loads - this.metrics.errors) / this.metrics.loads) * 100 : 0;
        const cacheEfficiency = this.metrics.loads > 0 ?
            (this.metrics.cacheHits / this.metrics.loads) * 100 : 0;

        return {
            loads: this.metrics.loads,
            errors: this.metrics.errors,
            cacheHits: this.metrics.cacheHits,
            successRate: `${successRate.toFixed(1)}%`,
            cacheEfficiency: `${cacheEfficiency.toFixed(1)}%`,
            uptime: `${(uptime / 1000).toFixed(1)}s`,
            loadedLibraries: this.loadedLibraries.size,
            domainLibraries: this.domainLibraries.size,
            totalOperators: this.calculateTotalOperators(),
            libraryRegistry: this.libraryRegistry.size
        };
    }

    calculateTotalOperators() {
        let total = 0;
        for (const domain of this.domainLibraries.values()) {
            total += domain.operators.length;
        }
        return total;
    }

    /**
     * ENHANCED DIAGNOSTICS WITH LIB PATHS
     */
    async diagnose() {
        const diagnosis = {
            status: 'healthy',
            libraries: {},
            domains: {},
            issues: [],
            recommendations: [],
            libMigration: 'complete' // NEW: Track lib migration status
        };

        // Check standard libraries - LIB ONLY
        for (const [name, info] of this.libraryRegistry) {
            try {
                const fullPath = path.join(__dirname, info.path);
                await fs.access(fullPath);
                diagnosis.libraries[name] = {
                    status: 'available',
                    path: info.path,
                    category: info.category,
                    location: 'lib' // NEW: All in lib now
                };
            } catch (error) {
                diagnosis.libraries[name] = {
                    status: 'missing',
                    path: info.path,
                    error: error.message,
                    location: 'lib'
                };

                if (info.critical) {
                    diagnosis.issues.push(`Critical library missing: ${name}`);
                    diagnosis.status = 'degraded';
                }
            }
        }

        // Check domain libraries - LIB ONLY
        for (const [name, domain] of this.domainLibraries) {
            diagnosis.domains[name] = {
                status: 'registered',
                operators: domain.operators.length,
                path: domain.path,
                location: 'lib'
            };
        }

        // Generate recommendations for lib migration
        const missingLibs = Object.values(diagnosis.libraries).filter(lib => lib.status === 'missing');
        if (missingLibs.length > 0) {
            diagnosis.recommendations.push('Run file migration: mv src/stdlib/core/operators/ src/lib/core/');
            diagnosis.recommendations.push('Update imports in engine and related files');
        }

        return diagnosis;
    }

    /**
     * GRACEFUL SHUTDOWN
     */
    async shutdown() {
        this.emit('shutdown', { timestamp: Date.now() });

        // Clear caches
        this.libraryCache.clear();
        this.domainLibraries.clear();

        if (this.config.debugMode && !this.config.quietMode) {
            const metrics = this.getMetrics();
            console.log('🛑 Library loader shutdown');
            console.log(`   📊 Final metrics:`, metrics);
        }
    }

    /**
     * NEW: LIB MIGRATION HELPER
     */
    getLibMigrationStatus() {
        const status = {
            libLibraries: this.libraryRegistry.size,
            loadedLibraries: this.loadedLibraries.size,
            domainLibraries: this.domainLibraries.size,
            allPathsResolvedToLib: true
        };

        // Verify all paths point to lib
        for (const [name, info] of this.libraryRegistry) {
            if (!info.path.startsWith('./') || info.path.includes('../stdlib')) {
                status.allPathsResolvedToLib = false;
                break;
            }
        }

        return status;
    }
}

export default FluxusLibraryLoader;
