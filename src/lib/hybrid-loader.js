// FILENAME: src/lib/hybrid-loader.js
// Fluxus Enterprise Hybrid Library Loader v5.0 - PRODUCTION READY
// ENHANCED WITH SMART LIBRARY DISCOVERY AND DOMAIN SUPPORT

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
     * PRODUCTION INITIALIZATION WITH ENHANCED DOMAIN SUPPORT
     */
    async initializeProductionLoader() {
        try {
            // Build production library registry
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
     * ENHANCED LIBRARY DISCOVERY WITH FALLBACK PATHS
     */
    async buildProductionRegistry() {
        const registry = new Map();

        // Core libraries with multiple fallback paths
        const coreLibraries = [
            {
                name: 'core',
                paths: [
                    './core/core.js',
                    './core/index.js',
                    '../core/core.js',
                    '../../lib/core/core.js'
                ],
                category: 'foundation',
                critical: true
            },
            {
                name: 'math',
                paths: [
                    './math/math.js',
                    './math/index.js',
                    '../math/math.js',
                    '../../lib/math/math.js'
                ],
                category: 'standard'
            },
            {
                name: 'collections',
                paths: [
                    './core/collections.js',
                    '../core/collections.js',
                    '../../lib/core/collections.js'
                ],
                category: 'foundation'
            },
            {
                name: 'string',
                paths: [
                    './text/string.js',
                    '../text/string.js',
                    '../../lib/text/string.js'
                ],
                category: 'standard'
            },
            {
                name: 'time',
                paths: [
                    './time/time.js',
                    '../time/time.js',
                    '../../lib/time/time.js'
                ],
                category: 'standard'
            },
            {
                name: 'network',
                paths: [
                    './network/network.js',
                    '../network/network.js',
                    '../../lib/network/network.js'
                ],
                category: 'domain'
            },
            {
                name: 'reactive',
                paths: [
                    './reactive/reactive.js',
                    '../reactive/reactive.js',
                    '../../lib/reactive/reactive.js'
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
     * ENHANCED DOMAIN LIBRARY DISCOVERY
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
     * ENHANCED DOMAIN REGISTRATION INTERFACE
     */
    async registerDomain(domainName, domainModule) {
        if (this.domainLibraries.has(domainName)) {
            return true; // Already registered
        }

        try {
            const operators = this.extractOperatorsFromDomain(domainModule);

            this.domainLibraries.set(domainName, {
                module: domainModule,
                path: 'dynamic',
                discoveredAt: Date.now(),
                operators
            });

            // Auto-register with engine if possible
            if (domainModule.registerWithEngine && this.engine) {
                domainModule.registerWithEngine(this.engine);
            }

            this.emit('domain:registered', { domainName, operators });

            if (this.config.debugMode && !this.config.quietMode) {
                console.log(`✅ Domain registered: ${domainName} (${operators.length} operators)`);
            }

            return true;

        } catch (error) {
            if (!this.config.quietMode) {
                console.error(`❌ Domain registration failed for ${domainName}:`, error.message);
            }
            return false;
        }
    }

    /**
     * INTELLIGENT PATH RESOLUTION WITH FALLBACKS
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

        // No path found
        return null;
    }

    /**
     * ENHANCED LIBRARY LOADING WITH OPERATOR EXTRACTION
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
     * ROBUST LIBRARY IMPLEMENTATION LOADING
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
     * PERFORMANCE-OPTIMIZED CORE PRELOADING
     */
    async preloadCoreLibraries() {
        const coreLibraries = ['core', 'math', 'collections'];
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
     * DOMAIN-SPECIFIC METHODS
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
            operators.push(...Object.keys(domainModule.getOperators()));
        }
        if (domainModule.operators) {
            operators.push(...Object.keys(domainModule.operators));
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
     * EXECUTE OPERATOR FROM LOADED LIBRARIES
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
     * ENHANCED METRICS WITH DOMAIN INFO
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
            totalOperators: this.calculateTotalOperators()
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
     * ENHANCED DIAGNOSTICS WITH DOMAIN INFO
     */
    async diagnose() {
        const diagnosis = {
            status: 'healthy',
            libraries: {},
            domains: {},
            issues: [],
            recommendations: []
        };

        // Check standard libraries
        for (const [name, info] of this.libraryRegistry) {
            try {
                const fullPath = path.join(__dirname, info.path);
                await fs.access(fullPath);
                diagnosis.libraries[name] = {
                    status: 'available',
                    path: info.path,
                    category: info.category
                };
            } catch (error) {
                diagnosis.libraries[name] = {
                    status: 'missing',
                    path: info.path,
                    error: error.message
                };

                if (info.critical) {
                    diagnosis.issues.push(`Critical library missing: ${name}`);
                    diagnosis.status = 'degraded';
                }
            }
        }

        // Check domain libraries
        for (const [name, domain] of this.domainLibraries) {
            diagnosis.domains[name] = {
                status: 'registered',
                operators: domain.operators.length,
                path: domain.path
            };
        }

        // Generate recommendations
        if (diagnosis.issues.length > 0) {
            diagnosis.recommendations.push('Run fluxus doctor to fix library issues');
        }
        if (this.domainLibraries.size === 0) {
            diagnosis.recommendations.push('Consider adding domain libraries for extended functionality');
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
}

export default FluxusLibraryLoader;
