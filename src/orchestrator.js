// FILENAME: src/orchestrator.js
// Fluxus Enterprise Orchestrator v1.0 - Production Grade
// Central nervous system for Fluxus reactive runtime

import { RuntimeEngine } from './core/engine.js';
import { FluxusPackageManager } from './package-manager.js';
import { PerformanceProfiler } from './cli/tools/profiler/index.js';
import { DebugSession } from './cli/tools/debugger/DebugSession.js';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableMetrics: true,
            autoRegisterDomains: true,
            validateOnStartup: true,
            hotReload: false,
            maxDomains: 50,
            domainScanInterval: 30000, // 30 seconds
            ...config
        };
        
        // Core systems
        this.engine = null;
        this.packageManager = null;
        this.profiler = null;
        this.debugSession = null;
        
        // Domain registry
        this.domainLibraries = new Map();
        this.registeredOperators = new Set();
        this.healthStatus = {
            status: 'initializing',
            domains: { loaded: 0, failed: 0, total: 0 },
            operators: { core: 0, domain: 0, custom: 0 },
            lastValidation: null,
            uptime: 0
        };
        
        // Integration state
        this.integrationGraph = new Map();
        this.dependencyTree = new Map();
        this.startTime = Date.now();
        
        this.setupErrorHandling();
    }

    // ==================== LIFECYCLE MANAGEMENT ====================
    
    async initialize() {
        try {
            this.healthStatus.status = 'initializing';
            this.emit('initialization:start');
            
            // 1. Initialize core engine first
            await this.initializeCoreEngine();
            
            // 2. Load package management system
            await this.initializePackageManager();
            
            // 3. Auto-discover and register domain libraries
            if (this.config.autoRegisterDomains) {
                await this.autoRegisterDomainLibraries();
            }
            
            // 4. Validate system integration
            if (this.config.validateOnStartup) {
                await this.validateSystemIntegration();
            }
            
            // 5. Initialize tooling
            await this.initializeTooling();
            
            // 6. Start health monitoring
            this.startHealthMonitoring();
            
            this.healthStatus.status = 'ready';
            this.healthStatus.uptime = Date.now() - this.startTime;
            
            this.emit('initialization:complete', this.healthStatus);
            
            console.log('🎯 Fluxus Orchestrator Ready');
            console.log(`   📊 Domains: ${this.healthStatus.domains.loaded}/${this.healthStatus.domains.total}`);
            console.log(`   ⚡ Operators: ${this.healthStatus.operators.core + this.healthStatus.operators.domain}`);
            
            return this;
            
        } catch (error) {
            this.healthStatus.status = 'error';
            this.emit('initialization:error', error);
            throw new Error(`Orchestrator initialization failed: ${error.message}`);
        }
    }

    async initializeCoreEngine() {
        const engineConfig = {
            enableMetrics: this.config.enableMetrics,
            logLevel: 'INFO',
            maxExecutionSteps: 100000
        };
        
        this.engine = new RuntimeEngine(engineConfig);
        
        // Enhanced engine event forwarding
        this.engine.on('shutdown', () => this.emit('engine:shutdown'));
        this.engine.on('metrics:update', (metrics) => this.emit('metrics:update', metrics));
        
        this.emit('engine:initialized');
    }

    async initializePackageManager() {
        this.packageManager = new FluxusPackageManager();
        
        // Enhanced package loading with domain integration
        this.packageManager.loadPackage = async (packageName) => {
            // Try standard packages first
            let pkg = await this.loadStandardPackage(packageName);
            
            // Fall back to domain libraries
            if (!pkg) pkg = await this.loadDomainAsPackage(packageName);
            
            // Fall back to core operators
            if (!pkg) pkg = await this.loadCoreOperatorsAsPackage(packageName);
            
            if (pkg) {
                this.integrationGraph.set(packageName, {
                    type: pkg.type,
                    operators: pkg.operators || [],
                    loadedAt: Date.now(),
                    source: pkg.source
                });
            }
            
            return pkg;
        };
        
        this.emit('packageManager:initialized');
    }

    // ==================== DOMAIN LIBRARY INTEGRATION ====================
    
    async autoRegisterDomainLibraries() {
        const domainsDir = path.join(__dirname, 'lib', 'domains');
        
        try {
            const files = await fs.readdir(domainsDir);
            const domainFiles = files.filter(f => f.endsWith('.js') && !f.startsWith('.'));
            
            this.healthStatus.domains.total = domainFiles.length;
            
            for (const file of domainFiles) {
                await this.registerDomainLibrary(file.replace('.js', ''), domainsDir);
            }
            
            console.log(`✅ Auto-registered ${this.healthStatus.domains.loaded} domain libraries`);
            
        } catch (error) {
            console.warn('⚠️ Domain auto-registration skipped:', error.message);
        }
    }

    async registerDomainLibrary(domainName, basePath = null) {
        try {
            const domainsPath = basePath || path.join(__dirname, 'lib', 'domains');
            const modulePath = path.join(domainsPath, `${domainName}.js`);
            
            // Dynamic import with error handling
            const module = await import(`file://${modulePath}`);
            
            if (module.registerWithEngine) {
                // Standard registration pattern
                module.registerWithEngine(this.engine);
                this.trackDomainRegistration(domainName, module, 'standard');
                
            } else if (module.IOT_OPERATORS || module.default) {
                // Legacy domain pattern - auto-register
                await this.autoRegisterLegacyDomain(domainName, module);
                this.trackDomainRegistration(domainName, module, 'legacy');
                
            } else {
                throw new Error(`Invalid domain module structure for ${domainName}`);
            }
            
            this.domainLibraries.set(domainName, {
                module,
                registeredAt: Date.now(),
                operators: this.extractOperatorsFromModule(module),
                health: 'healthy'
            });
            
            this.healthStatus.domains.loaded++;
            this.emit('domain:registered', domainName);
            
            return true;
            
        } catch (error) {
            this.healthStatus.domains.failed++;
            this.emit('domain:registrationFailed', { domainName, error });
            console.warn(`⚠️ Failed to register domain ${domainName}:`, error.message);
            return false;
        }
    }

    async autoRegisterLegacyDomain(domainName, module) {
        const operators = module.IOT_OPERATORS || module.default || {};
        
        Object.entries(operators).forEach(([opName, opDef]) => {
            if (opDef.implementation) {
                const wrappedOperator = this.createDomainOperatorWrapper(domainName, opName, opDef);
                this.engine.operators.set(opName, wrappedOperator);
                this.registeredOperators.add(`${domainName}.${opName}`);
                this.healthStatus.operators.domain++;
            }
        });
        
        console.log(`✅ Auto-registered ${Object.keys(operators).length} operators from ${domainName}`);
    }

    createDomainOperatorWrapper(domainName, opName, opDef) {
        return async (input, args, context) => {
            const startTime = Date.now();
            
            try {
                // Enhanced context with orchestrator access
                const enhancedContext = {
                    ...context,
                    orchestrator: this,
                    domain: domainName,
                    operator: opName
                };
                
                const result = await opDef.implementation(input, args, enhancedContext);
                
                // Performance tracking
                const executionTime = Date.now() - startTime;
                this.emit('operator:executed', {
                    domain: domainName,
                    operator: opName,
                    executionTime,
                    inputType: typeof input,
                    success: true
                });
                
                return result;
                
            } catch (error) {
                const executionTime = Date.now() - startTime;
                this.emit('operator:failed', {
                    domain: domainName,
                    operator: opName,
                    executionTime,
                    error: error.message,
                    success: false
                });
                
                throw new Error(`[${domainName}.${opName}] ${error.message}`);
            }
        };
    }

    // ==================== INTEGRATION VALIDATION ====================
    
    async validateSystemIntegration() {
        const validationResults = {
            timestamp: Date.now(),
            checks: [],
            overall: 'pass'
        };
        
        // Check 1: Domain library integration
        validationResults.checks.push(await this.validateDomainIntegration());
        
        // Check 2: Operator availability
        validationResults.checks.push(await this.validateOperatorCoverage());
        
        // Check 3: Example compatibility
        validationResults.checks.push(await this.validateExampleCompatibility());
        
        // Check 4: Specification compliance
        validationResults.checks.push(await this.validateSpecCompliance());
        
        // Update health status
        this.healthStatus.lastValidation = validationResults;
        this.healthStatus.status = validationResults.overall === 'pass' ? 'healthy' : 'degraded';
        
        this.emit('validation:complete', validationResults);
        return validationResults;
    }

    async validateDomainIntegration() {
        const check = { name: 'Domain Integration', status: 'pass', issues: [] };
        
        for (const [domainName, domainInfo] of this.domainLibraries) {
            const operators = domainInfo.operators || [];
            
            // Verify each operator is registered in engine
            for (const opName of operators) {
                if (!this.engine.operators.has(opName)) {
                    check.issues.push(`Operator ${opName} from ${domainName} not registered in engine`);
                    check.status = 'fail';
                }
            }
            
            // Verify domain health
            if (domainInfo.health !== 'healthy') {
                check.issues.push(`Domain ${domainName} health: ${domainInfo.health}`);
                check.status = 'fail';
            }
        }
        
        return check;
    }

    async validateExampleCompatibility() {
        const check = { name: 'Example Compatibility', status: 'pass', issues: [] };
        const examplesDir = path.join(process.cwd(), 'examples');
        
        try {
            const exampleFiles = await fs.readdir(examplesDir);
            const fluxExamples = exampleFiles.filter(f => f.endsWith('.flux'));
            
            for (const exampleFile of fluxExamples.slice(0, 5)) { // Sample first 5
                const content = await fs.readFile(path.join(examplesDir, exampleFile), 'utf8');
                const requiredOperators = this.extractOperatorsFromExample(content);
                
                for (const op of requiredOperators) {
                    if (!this.engine.operators.has(op)) {
                        check.issues.push(`Example ${exampleFile} requires missing operator: ${op}`);
                        check.status = 'fail';
                    }
                }
            }
        } catch (error) {
            check.issues.push(`Cannot validate examples: ${error.message}`);
            check.status = 'error';
        }
        
        return check;
    }

    // ==================== TOOLING INTEGRATION ====================
    
    async initializeTooling() {
        // Profiler integration
        this.profiler = new PerformanceProfiler(this.engine);
        
        // Debug session integration
        this.debugSession = new DebugSession(this.engine);
        
        // Enhanced metrics collection
        this.setupEnhancedMetrics();
        
        this.emit('tooling:initialized');
    }

    setupEnhancedMetrics() {
        setInterval(() => {
            this.healthStatus.uptime = Date.now() - this.startTime;
            
            const metrics = {
                health: this.healthStatus,
                domains: this.domainLibraries.size,
                operators: this.registeredOperators.size,
                integration: this.integrationGraph.size,
                performance: this.profiler?.getSnapshot() || {}
            };
            
            this.emit('orchestrator:metrics', metrics);
        }, 5000);
    }

    // ==================== HEALTH MONITORING ====================
    
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, 10000); // Every 10 seconds
        
        // Domain library rescan
        if (this.config.hotReload) {
            setInterval(() => {
                this.rescanDomainLibraries();
            }, this.config.domainScanInterval);
        }
    }

    async performHealthCheck() {
        const healthCheck = {
            timestamp: Date.now(),
            status: 'healthy',
            components: {}
        };
        
        // Check engine health
        healthCheck.components.engine = this.engine ? 'healthy' : 'unhealthy';
        
        // Check domain health
        for (const [domain, info] of this.domainLibraries) {
            healthCheck.components[`domain.${domain}`] = info.health;
            if (info.health !== 'healthy') {
                healthCheck.status = 'degraded';
            }
        }
        
        // Update overall health
        this.healthStatus.status = healthCheck.status;
        this.emit('health:check', healthCheck);
    }

    async rescanDomainLibraries() {
        console.log('🔄 Rescanning domain libraries...');
        await this.autoRegisterDomainLibraries();
    }

    // ==================== UTILITY METHODS ====================
    
    trackDomainRegistration(domainName, module, type) {
        this.dependencyTree.set(domainName, {
            type,
            operators: this.extractOperatorsFromModule(module),
            registeredAt: Date.now(),
            version: module.version || '1.0.0'
        });
    }

    extractOperatorsFromModule(module) {
        if (module.IOT_OPERATORS) return Object.keys(module.IOT_OPERATORS);
        if (module.default && typeof module.default === 'object') return Object.keys(module.default);
        if (module.getOperators) return Object.keys(module.getOperators());
        return [];
    }

    extractOperatorsFromExample(content) {
        const operatorPattern = /\|?\s*(\w+)\s*(?:\(|\[|\{)/g;
        const operators = new Set();
        let match;
        
        while ((match = operatorPattern.exec(content)) !== null) {
            const opName = match[1];
            if (!['FLOW', 'let', 'auth_state', 'username_pool'].includes(opName)) {
                operators.add(opName);
            }
        }
        
        return Array.from(operators);
    }

    setupErrorHandling() {
        process.on('unhandledRejection', (reason, promise) => {
            this.emit('error:unhandledRejection', { reason, promise });
            console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
        });

        process.on('uncaughtException', (error) => {
            this.emit('error:uncaughtException', error);
            console.error('🚨 Uncaught Exception:', error);
            this.gracefulShutdown(1);
        });
    }

    // ==================== PACKAGE LOADING ENHANCEMENTS ====================
    
    async loadStandardPackage(packageName) {
        try {
            return await this.packageManager.loadFluxusPackage(packageName);
        } catch (error) {
            return null;
        }
    }

    async loadDomainAsPackage(domainName) {
        if (this.domainLibraries.has(domainName)) {
            const domain = this.domainLibraries.get(domainName);
            return {
                name: domainName,
                type: 'domain',
                operators: domain.operators,
                source: 'domain-library'
            };
        }
        return null;
    }

    async loadCoreOperatorsAsPackage(packageName) {
        // Map common names to core operator groups
        const coreMappings = {
            'math': ['add', 'subtract', 'multiply', 'divide'],
            'string': ['length', 'concat', 'split'],
            'collections': ['map', 'reduce', 'filter']
        };
        
        if (coreMappings[packageName]) {
            return {
                name: packageName,
                type: 'core',
                operators: coreMappings[packageName],
                source: 'core-operators'
            };
        }
        
        return null;
    }

    // ==================== GRACEFUL SHUTDOWN ====================
    
    async gracefulShutdown(exitCode = 0) {
        console.log('🛑 Initiating graceful shutdown...');
        
        this.healthStatus.status = 'shutting_down';
        this.emit('shutdown:initiated');
        
        try {
            // Shutdown engine first
            if (this.engine) {
                await this.engine.shutdown();
            }
            
            // Clear intervals and timeouts
            // (In production, you'd track these and clear them)
            
            this.emit('shutdown:complete');
            console.log('✅ Graceful shutdown complete');
            
            if (exitCode !== null) {
                process.exit(exitCode);
            }
            
        } catch (error) {
            console.error('❌ Graceful shutdown failed:', error);
            process.exit(1);
        }
    }

    // ==================== PUBLIC API ====================
    
    getHealthStatus() {
        return { ...this.healthStatus, uptime: Date.now() - this.startTime };
    }

    getRegisteredDomains() {
        return Array.from(this.domainLibraries.keys());
    }

    getOperatorCount() {
        return {
            core: this.healthStatus.operators.core,
            domain: this.healthStatus.operators.domain,
            custom: this.healthStatus.operators.custom,
            total: this.healthStatus.operators.core + this.healthStatus.operators.domain + this.healthStatus.operators.custom
        };
    }

    async executeProgram(ast, options = {}) {
        if (!this.engine) {
            throw new Error('Orchestrator not initialized');
        }
        
        this.emit('program:execution:start', { ast, options });
        
        try {
            const result = await this.engine.start(ast, options);
            this.emit('program:execution:complete', { result });
            return result;
        } catch (error) {
            this.emit('program:execution:failed', { error });
            throw error;
        }
    }
}

// Singleton instance for application-wide access
let globalOrchestrator = null;

export function getOrchestrator(config) {
    if (!globalOrchestrator) {
        globalOrchestrator = new FluxusOrchestrator(config);
    }
    return globalOrchestrator;
}

export default FluxusOrchestrator;
