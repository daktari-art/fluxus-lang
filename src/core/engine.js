// FILENAME: src/core/engine.js
// Fluxus Enterprise Runtime Engine v14.0 - PRODUCTION GRADE
// DOMAIN-AWARE, ORCHESTRATOR-INTEGRATED, PERFORMANCE-OPTIMIZED
// ENHANCED WITH SMART LIBRARY SELECTION

import { FluxusPackageManager } from '../package-manager.js';
import { FluxusLibraryLoader } from '../lib/hybrid-loader.js';
import { OperatorsRegistry } from '../stdlib/core/operators/index.js';
import { EventEmitter } from 'events';
import { setUIAdapter as _setUIAdapter } from '../stdlib/core/operators/ui/ui_events.js';
import { performance } from 'perf_hooks';

export class RuntimeEngine extends EventEmitter {
    constructor(userConfig = {}) {
        super();
        
        // ENHANCED CONFIGURATION WITH LIBRARY INTELLIGENCE
        this.config = {
            maxExecutionSteps: 100000,
            enableMetrics: true,
            logLevel: 'INFO',
            quietMode: false,
            enableDomainAutoDiscovery: true,
            enablePerformanceProfiling: true,
            maxPoolHistory: 1000,
            executionTimeout: 30000,
            enableSmartLibrarySelection: true,
            libraryComplexityThreshold: 5,
            ...userConfig
        };

        // ENHANCED STATE MANAGEMENT WITH LIBRARY INTELLIGENCE
        this.pools = new Map();
        this.activeStreams = new Set();
        this.domainStreams = new Map();
        this.ast = null;
        this.replMode = userConfig.replMode || false;
        this.executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // ENHANCED SYSTEMS WITH SMART LIBRARY SUPPORT
        this.operatorsRegistry = new OperatorsRegistry();
        this.operators = new Map();
        this.packageManager = new FluxusPackageManager(this);
        this.libraryLoader = new FluxusLibraryLoader(this, {
            debugMode: userConfig.debugMode || false,
            autoDiscoverDomains: this.config.enableDomainAutoDiscovery,
            quietMode: this.config.quietMode
        });
        
        // ENHANCED LIBRARY TRACKING
        this.loadedLibraries = new Set();
        this.loadedDomains = new Set();
        this.libraryComplexity = new Map();
        this.availableLibraries = new Map();

        // PRODUCTION METRICS & MONITORING
        this.metrics = {
            startTime: Date.now(),
            operatorCalls: 0,
            pipelineExecutions: 0,
            valuesProcessed: 0,
            errors: 0,
            warnings: 0,
            domainOperatorCalls: 0,
            poolUpdates: 0,
            streamActivations: 0,
            executionPhases: {},
            librarySelections: { stdlib: 0, lib: 0, hybrid: 0 }
        };

        // PERFORMANCE TRACKING
        this.performance = {
            operatorExecutionTimes: new Map(),
            pipelineExecutionTimes: new Map(),
            domainLoadTimes: new Map(),
            libraryLoadTimes: new Map()
        };

        // ERROR HANDLING & RECOVERY
        this.errorRecovery = {
            maxRetries: 3,
            retryDelays: [100, 500, 1000],
            circuitBreakers: new Map()
        };

        this.initializeProductionEngine();

        if (!this.config.quietMode) {
            console.log('🚀 FLUXUS ENTERPRISE ENGINE v14.0 - SMART LIBRARY EDITION');
            console.log('   📊 Domain-Aware • Smart Library Selection • Production-Grade');
            if (this.config.enableSmartLibrarySelection) {
                console.log('   🧠 Smart library selection enabled');
            }
        }
    }

    // ==================== ENHANCED INITIALIZATION ====================
    
    async initializeProductionEngine() {
        try {
            // Phase 0: Initialize library system first
            await this.initializeLibrarySystem();
            
            // Phase 1: Core operator initialization
            await this.initializeCoreOperators();
            
            // Phase 2: Domain discovery and registration
            if (this.config.enableDomainAutoDiscovery) {
                await this.initializeDomainOperators();
            }
            
            // Phase 3: Package system initialization
            await this.initializePackageSystem();
            
            // Phase 4: Performance monitoring setup
            this.setupPerformanceMonitoring();
            
            // Phase 5: Ensure critical libraries are available
            await this.ensureCriticalLibraries();
            
            this.emit('engine:initialized', {
                executionId: this.executionId,
                operatorCount: this.operators.size,
                domainCount: this.loadedDomains.size,
                timestamp: Date.now()
            });

            if (!this.config.quietMode) {
                console.log(`✅ Engine initialized: ${this.operators.size} operators, ${this.loadedDomains.size} domains`);
            }

        } catch (error) {
            console.error('❌ Engine initialization failed:', error);
            throw new Error(`Production engine initialization failed: ${error.message}`);
        }
    }

    async initializeLibrarySystem() {
        // Build available libraries registry
        this.availableLibraries = this.buildAvailableLibraries();
        
        if (!this.config.quietMode) {
            console.log(`   📚 Library system ready: ${this.availableLibraries.size} libraries available`);
        }
    }

    buildAvailableLibraries() {
        const libraries = new Map();

        // Core/stdlib libraries (always available)
        libraries.set('core', {
            path: 'stdlib/core/operators',
            type: 'stdlib',
            complexity: 'simple',
            operators: ['map', 'filter', 'reduce', 'print', 'to_pool'],
            domains: ['core']
        });

        libraries.set('math', {
            path: 'stdlib/core/operators',
            type: 'stdlib', 
            complexity: 'simple',
            operators: ['add', 'subtract', 'multiply', 'divide'],
            domains: ['math']
        });

        libraries.set('string', {
            path: 'stdlib/core/operators',
            type: 'stdlib',
            complexity: 'simple',
            operators: ['concat', 'split', 'trim', 'to_upper', 'to_lower', 'capitalize', 'reverse', 'replace', 'substring', 'contains', 'starts_with', 'ends_with', 'split_lines', 'repeat', 'encode_base64', 'decode_base64', 'length'],
            domains: ['text']
        });

        libraries.set('ui', {
            path: 'stdlib/core/operators/ui',
            type: 'stdlib',
            complexity: 'medium',
            operators: ['ui_render', 'ui_events'],
            domains: ['ui']
        });

        // Advanced libraries (from src/lib/)
        libraries.set('math_advanced', {
            path: 'lib/math',
            type: 'lib',
            complexity: 'medium',
            operators: ['sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'pow', 'random', 'max', 'min', 'mean', 'sum', 'median', 'floor', 'ceil', 'round', 'abs'],
            domains: ['math']
        });

        libraries.set('analytics', {
            path: 'lib/domains',
            type: 'lib',
            complexity: 'high',
            operators: ['analyze_trend', 'detect_anomaly', 'predict'],
            domains: ['analytics']
        });

        libraries.set('health', {
            path: 'lib/domains',
            type: 'lib', 
            complexity: 'high',
            operators: ['health_monitor', 'vital_signs', 'medical_alert'],
            domains: ['health']
        });

        libraries.set('iot', {
            path: 'lib/domains',
            type: 'lib',
            complexity: 'high',
            operators: ['sensor_read', 'device_control', 'iot_analyze'],
            domains: ['iot']
        });

        libraries.set('network', {
            path: 'lib/network',
            type: 'lib',
            complexity: 'high',
            operators: ['http_request', 'websocket_connect', 'mqtt_publish'],
            domains: ['network']
        });

        libraries.set('reactive', {
            path: 'lib/reactive',
            type: 'lib',
            complexity: 'medium',
            operators: ['lens_transform', 'pool_subscribe', 'stream_combine'],
            domains: ['reactive']
        });

        libraries.set('time', {
            path: 'lib/time',
            type: 'lib',
            complexity: 'medium',
            operators: ['schedule', 'delay', 'timestamp'],
            domains: ['time']
        });

        libraries.set('security', {
            path: 'lib',
            type: 'lib',
            complexity: 'high',
            operators: ['encrypt', 'decrypt', 'authenticate'],
            domains: ['security']
        });

        libraries.set('collections', {
            path: 'lib/core',
            type: 'lib',
            complexity: 'medium',
            operators: ['group_by', 'sort_by', 'aggregate'],
            domains: ['data']
        });

        return libraries;
    }

    async ensureCriticalLibraries() {
        // Ensure math library is available with all operators
        const mathOperators = {
            'sin': (input) => Math.sin(input),
            'cos': (input) => Math.cos(input),
            'tan': (input) => Math.tan(input),
            'log': (input) => Math.log(input),
            'exp': (input) => Math.exp(input),
            'sqrt': (input) => Math.sqrt(input),
            'pow': (input, [exponent]) => Math.pow(input, exponent),
            'random': (input) => Math.random() * (input || 1),
            'max': (input) => Array.isArray(input) ? Math.max(...input) : input,
            'min': (input) => Array.isArray(input) ? Math.min(...input) : input,
            'mean': (input) => Array.isArray(input) ? input.reduce((a, b) => a + b, 0) / input.length : input,
            'sum': (input) => Array.isArray(input) ? input.reduce((a, b) => a + b, 0) : input,
            'median': (input) => {
                if (!Array.isArray(input)) return input;
                const sorted = [...input].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
            },
            'floor': (input) => Math.floor(input),
            'ceil': (input) => Math.ceil(input),
            'round': (input) => Math.round(input),
            'abs': (input) => Math.abs(input)
        };

        for (const [name, implementation] of Object.entries(mathOperators)) {
            if (!this.operators.has(name)) {
                this.operators.set(name, this.createProductionOperatorWrapper(name, {
                    implementation,
                    library: 'math_advanced',
                    type: 'math'
                }));
            }
        }

        if (!this.config.quietMode) {
            console.log(`   🔧 Ensured ${Object.keys(mathOperators).length} math operators are available`);
        }
    }

    async initializeDomainOperators() {
        const startTime = performance.now();
        
        try {
            const domains = this.libraryLoader.getAllDomains();
            
            for (const domainName of domains) {
                try {
                    const domainModule = await this.libraryLoader.loadDomainLibrary(domainName);
                    
                    if (domainModule && domainModule.registerWithEngine) {
                        const operatorCount = domainModule.registerWithEngine(this);
                        this.loadedDomains.add(domainName);
                        
                        this.performance.domainLoadTimes.set(domainName, performance.now() - startTime);
                        
                        if (!this.config.quietMode) {
                            console.log(`   🏗️  Domain loaded: ${domainName} (${operatorCount} operators)`);
                        }
                        
                        this.emit('domain:loaded', {
                            domain: domainName,
                            operatorCount,
                            loadTime: this.performance.domainLoadTimes.get(domainName)
                        });
                    }
                } catch (domainError) {
                    console.warn(`⚠️ Failed to load domain ${domainName}:`, domainError.message);
                    this.metrics.warnings++;
                }
            }
            
            this.metrics.executionPhases.domainInitialization = performance.now() - startTime;
            
        } catch (error) {
            console.error('❌ Domain operator initialization failed:', error.message);
            this.metrics.errors++;
        }
    }

    async initializePackageSystem() {
        try {
            const domainPackages = this.packageManager.getDomainPackages();
            
            for (const domainPkg of domainPackages) {
                if (!domainPkg.isLoaded) {
                    await this.packageManager.loadDomainPackage(domainPkg.name);
                }
            }
            
            if (!this.config.quietMode && domainPackages.length > 0) {
                console.log(`   📦 Loaded ${domainPackages.filter(p => p.isLoaded).length} domain packages`);
            }
            
        } catch (error) {
            console.warn('⚠️ Package system initialization had issues:', error.message);
        }
    }

    // ==================== SMART LIBRARY SELECTION ====================
    
    async selectOptimalLibrary(operatorName, context = {}) {
        if (!this.config.enableSmartLibrarySelection) {
            return 'auto';
        }

        const complexityScore = this.analyzeComplexity(context);
        const availableSources = this.findOperatorSources(operatorName);
        
        if (availableSources.length === 0) {
            // Try to find in any available library
            for (const [libName, libInfo] of this.availableLibraries) {
                if (libInfo.operators.includes(operatorName)) {
                    availableSources.push({
                        type: libInfo.type,
                        path: libInfo.path,
                        library: libName,
                        complexity: libInfo.complexity
                    });
                }
            }
            
            if (availableSources.length === 0) {
                throw new Error(`Operator '${operatorName}' not found in any library`);
            }
        }

        if (availableSources.length === 1) {
            const source = availableSources[0];
            this.metrics.librarySelections[source.type]++;
            return source.type;
        }

        // SMART SELECTION: Choose based on complexity
        if (complexityScore >= this.config.libraryComplexityThreshold) {
            const libSource = availableSources.find(src => src.type === 'lib');
            if (libSource) {
                this.metrics.librarySelections.lib++;
                return 'lib';
            }
        }

        const stdlibSource = availableSources.find(src => src.type === 'stdlib');
        if (stdlibSource) {
            this.metrics.librarySelections.stdlib++;
            return 'stdlib';
        }

        this.metrics.librarySelections.hybrid++;
        return 'hybrid';
    }

    analyzeComplexity(context) {
        let score = 0;
        
        if (context.inputData) {
            if (Array.isArray(context.inputData)) {
                score += Math.min(context.inputData.length / 10, 5);
            }
            if (typeof context.inputData === 'object' && context.inputData !== null) {
                score += Math.min(Object.keys(context.inputData).length / 5, 3);
            }
        }

        if (context.domain) {
            const domainWeights = {
                'core': 1,
                'math': 2,
                'text': 2,
                'data': 3,
                'reactive': 3,
                'time': 2,
                'network': 4,
                'iot': 4,
                'health': 5,
                'analytics': 5,
                'security': 5
            };
            score += domainWeights[context.domain] || 1;
        }

        if (context.pipelineDepth) {
            score += Math.min(context.pipelineDepth, 5);
        }

        if (context.isReactive) {
            score += 2;
        }

        return score;
    }

    findOperatorSources(operatorName) {
        const sources = [];
        
        // Check stdlib operators
        const stdlibOperators = this.operatorsRegistry.getAllOperators();
        if (stdlibOperators[operatorName]) {
            sources.push({
                type: 'stdlib',
                path: 'stdlib/core/operators',
                operator: stdlibOperators[operatorName]
            });
        }

        // Check available libraries
        for (const [libName, libInfo] of this.availableLibraries) {
            if (libInfo.operators.includes(operatorName)) {
                sources.push({
                    type: libInfo.type,
                    path: libInfo.path,
                    library: libName,
                    complexity: libInfo.complexity
                });
            }
        }

        return sources;
    }

    // ==================== ENHANCED OPERATOR MANAGEMENT ====================
    
    initializeCoreOperators() {
        const allOperators = this.operatorsRegistry.getAllOperators();
        
        for (const [name, opDef] of Object.entries(allOperators)) {
            this.operators.set(name, this.createProductionOperatorWrapper(name, opDef));
        }

        const domains = this.operatorsRegistry.getDomains();
        for (const domainName of domains) {
            const domainOps = this.operatorsRegistry.getDomainOperators(domainName);
            for (const [opName, opDef] of Object.entries(domainOps)) {
                this.operators.set(opName, this.createProductionOperatorWrapper(opName, opDef));
            }
        }

        if (!this.config.quietMode) {
            console.log(`   🔧 Initialized ${this.operators.size} core operators`);
        }
    }

    createProductionOperatorWrapper(name, operatorDef) {
        return async (input, args = [], context = {}) => {
            const startTime = performance.now();
            const executionId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.metrics.operatorCalls++;
            this.metrics.valuesProcessed++;

            if (operatorDef.library && operatorDef.library !== 'core') {
                this.metrics.domainOperatorCalls++;
            }

            try {
                const enhancedContext = {
                    engine: this,
                    executionId,
                    operator: name,
                    domain: operatorDef.library,
                    metrics: this.metrics,
                    ...context
                };

                if (this.isCircuitOpen(name)) {
                    throw new Error(`Circuit breaker open for operator: ${name}`);
                }

                const libraryName = typeof operatorDef.library === 'string' ? operatorDef.library : 'core';
                
                let result;
                if (operatorDef.library && operatorDef.library !== 'core') {
                    result = await this.executeDomainOperator(name, input, args, enhancedContext, operatorDef);
                } else {
                    result = await this.operatorsRegistry.executeOperator(
                        name,
                        input,
                        args,
                        enhancedContext,
                        libraryName
                    );
                }

                const executionTime = performance.now() - startTime;
                this.performance.operatorExecutionTimes.set(executionId, executionTime);

                this.emit('operator:success', {
                    name,
                    executionTime,
                    inputType: typeof input,
                    domain: operatorDef.library,
                    executionId
                });

                return result;

            } catch (error) {
                const executionTime = performance.now() - startTime;
                this.metrics.errors++;

                this.recordOperatorFailure(name, error);

                const enhancedError = new Error(`[${operatorDef.library || 'core'}.${name}] ${error.message}`);
                enhancedError.operator = name;
                enhancedError.domain = operatorDef.library;
                enhancedError.executionId = executionId;
                enhancedError.originalError = error;

                this.emit('operator:failed', {
                    name,
                    executionTime,
                    error: enhancedError.message,
                    domain: operatorDef.library,
                    executionId
                });

                if (!this.config.quietMode) {
                    console.error(`❌ Operator '${name}' failed:`, error.message);
                }

                throw enhancedError;
            }
        };
    }

    async executeDomainOperator(name, input, args, context, operatorDef) {
        if (operatorDef.implementation) {
            if (typeof operatorDef.implementation === 'function') {
                return await operatorDef.implementation(input, args, context);
            } else {
                throw new Error(`Invalid implementation for domain operator: ${name}`);
            }
        } else {
            throw new Error(`No implementation found for domain operator: ${name}`);
        }
    }

    // ==================== ENHANCED OPERATOR EXECUTION ====================
    
    async executeFunctionOperator(node, inputData) {
        const operatorName = this.cleanOperatorName(node.name);
        const args = node.args ? node.args.map(arg => this.parseLiteralValue(arg)) : [];
        
        const executionContext = {
            engine: this,
            operator: operatorName,
            inputData,
            args,
            pipelineDepth: this.calculatePipelineDepth(node),
            isReactive: node.type === 'STREAM_SOURCE_REACTIVE',
            domain: this.detectOperatorDomain(operatorName)
        };

        try {
            const preferredLibrary = await this.selectOptimalLibrary(operatorName, executionContext);
            
            let result;
            
            if (preferredLibrary === 'stdlib') {
                result = await this.executeStdLibOperator(operatorName, inputData, args, executionContext);
            } else if (preferredLibrary === 'lib') {
                result = await this.executeLibOperator(operatorName, inputData, args, executionContext);
            } else {
                result = await this.executeHybridOperator(operatorName, inputData, args, executionContext);
            }

            return result;

        } catch (error) {
            return await this.executeWithFallbacks(operatorName, inputData, args, executionContext, error);
        }
    }

    async executeStdLibOperator(operatorName, inputData, args, context) {
        const operatorWrapper = this.operators.get(operatorName);
        if (!operatorWrapper) {
            throw new Error(`Standard library operator not found: ${operatorName}`);
        }

        return await operatorWrapper(inputData, args, context);
    }

    async executeLibOperator(operatorName, inputData, args, context) {
        // Find which library contains this operator
        let targetLibrary = null;
        for (const [libName, libInfo] of this.availableLibraries) {
            if (libInfo.operators.includes(operatorName) && libInfo.type === 'lib') {
                targetLibrary = libName;
                break;
            }
        }

        if (!targetLibrary) {
            throw new Error(`Advanced library operator not found: ${operatorName}`);
        }

        // Ensure library is loaded
        await this.ensureLibraryLoaded(targetLibrary);

        // Try to execute through library loader
        try {
            return await this.libraryLoader.executeOperator(operatorName, inputData, args, context);
        } catch (error) {
            // Fallback to direct operator execution
            const operatorWrapper = this.operators.get(operatorName);
            if (operatorWrapper) {
                return await operatorWrapper(inputData, args, context);
            }
            throw error;
        }
    }

    async executeHybridOperator(operatorName, inputData, args, context) {
        const implementations = [];
        
        try {
            const stdlibResult = await this.executeStdLibOperator(operatorName, inputData, args, context);
            implementations.push({
                type: 'stdlib',
                result: stdlibResult,
                success: true
            });
        } catch (error) {
            implementations.push({
                type: 'stdlib', 
                error: error.message,
                success: false
            });
        }

        try {
            const libResult = await this.executeLibOperator(operatorName, inputData, args, context);
            implementations.push({
                type: 'lib',
                result: libResult,
                success: true
            });
        } catch (error) {
            implementations.push({
                type: 'lib',
                error: error.message,
                success: false
            });
        }

        const successfulImpls = implementations.filter(impl => impl.success);
        
        if (successfulImpls.length === 0) {
            throw new Error(`No working implementation found for operator: ${operatorName}`);
        }

        const complexity = this.analyzeComplexity(context);
        if (complexity >= this.config.libraryComplexityThreshold) {
            const libImpl = successfulImpls.find(impl => impl.type === 'lib');
            if (libImpl) return libImpl.result;
        }

        return successfulImpls[0].result;
    }

    async executeWithFallbacks(operatorName, inputData, args, context, originalError) {
        const fallbacks = [
            () => this.executeStdLibOperator(operatorName, inputData, args, context),
            () => this.executeLibOperator(operatorName, inputData, args, context),
            () => this.executeCustomOperator(operatorName, inputData, args, context)
        ];

        for (let i = 0; i < fallbacks.length; i++) {
            try {
                const result = await fallbacks[i]();
                if (!this.config.quietMode) {
                    console.warn(`⚠️ Operator '${operatorName}' executed with fallback ${i + 1}`);
                }
                return result;
            } catch (error) {
                // Continue to next fallback
            }
        }

        throw new Error(`All fallbacks failed for '${operatorName}': ${originalError.message}`);
    }

    async executeCustomOperator(operatorName, inputData, args, context) {
        // Custom implementations for missing operators
        const customOperators = {
            'sin': (input) => Math.sin(input),
            'cos': (input) => Math.cos(input),
            'tan': (input) => Math.tan(input),
            'log': (input) => Math.log(input),
            'exp': (input) => Math.exp(input),
            'sqrt': (input) => Math.sqrt(input),
            'pow': (input, [exponent]) => Math.pow(input, exponent),
            'random': (input) => Math.random() * (input || 1),
            'max': (input) => Array.isArray(input) ? Math.max(...input) : input,
            'min': (input) => Array.isArray(input) ? Math.min(...input) : input,
            'mean': (input) => Array.isArray(input) ? input.reduce((a, b) => a + b, 0) / input.length : input,
            'sum': (input) => Array.isArray(input) ? input.reduce((a, b) => a + b, 0) : input,
            'median': (input) => {
                if (!Array.isArray(input)) return input;
                const sorted = [...input].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
            },
            'floor': (input) => Math.floor(input),
            'ceil': (input) => Math.ceil(input),
            'round': (input) => Math.round(input),
            'abs': (input) => Math.abs(input)
        };

        if (customOperators[operatorName]) {
            return customOperators[operatorName](inputData, args);
        }

        throw new Error(`No custom implementation for: ${operatorName}`);
    }

    // ==================== ENHANCED LIBRARY MANAGEMENT ====================
    
    async ensureLibraryLoaded(libraryName) {
        if (this.loadedLibraries.has(libraryName)) {
            return true;
        }

        const startTime = performance.now();
        
        try {
            const libraryInfo = this.availableLibraries.get(libraryName);
            if (!libraryInfo) {
                throw new Error(`Unknown library: ${libraryName}`);
            }

            let loadSuccess = false;

            if (libraryInfo.type === 'lib') {
                loadSuccess = await this.libraryLoader.loadLibrary(libraryName);
            } else {
                // stdlib is already loaded via operators registry
                loadSuccess = true;
            }

            if (loadSuccess) {
                this.loadedLibraries.add(libraryName);
                this.libraryComplexity.set(libraryName, libraryInfo.complexity);
                
                const loadTime = performance.now() - startTime;
                this.performance.libraryLoadTimes.set(libraryName, loadTime);

                this.emit('library:loaded', {
                    library: libraryName,
                    type: libraryInfo.type,
                    complexity: libraryInfo.complexity,
                    loadTime
                });

                if (!this.config.quietMode) {
                    console.log(`   📚 Loaded ${libraryInfo.type} library: ${libraryName}`);
                }

                return true;
            }

            throw new Error(`Failed to load library: ${libraryName}`);

        } catch (error) {
            console.warn(`⚠️ Library load failed for ${libraryName}:`, error.message);
            this.metrics.warnings++;
            return false;
        }
    }

    // ==================== ENHANCED CONTEXT ANALYSIS ====================
    
    calculatePipelineDepth(startNode) {
        let depth = 0;
        let currentNode = startNode;
        
        while (currentNode) {
            depth++;
            const nextConnection = this.ast?.connections?.find(c => c.from === currentNode.id);
            if (!nextConnection) break;
            
            currentNode = this.ast.nodes.find(n => n.id === nextConnection.to);
            if (!currentNode || this.isTerminalNode(currentNode)) break;
        }
        
        return depth;
    }

    detectOperatorDomain(operatorName) {
        const domainPatterns = {
            'health': ['health_', 'medical_', 'vital_'],
            'iot': ['sensor_', 'iot_', 'device_'],
            'analytics': ['analyze_', 'stats_', 'trend_'],
            'network': ['http_', 'websocket_', 'mqtt_'],
            'math': ['sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'pow', 'random', 'max', 'min', 'mean', 'sum', 'median', 'floor', 'ceil', 'round', 'abs'],
            'text': ['concat', 'split', 'trim', 'to_upper', 'to_lower', 'capitalize', 'reverse', 'replace', 'substring', 'contains', 'starts_with', 'ends_with', 'split_lines', 'repeat', 'encode_base64', 'decode_base64', 'length'],
            'reactive': ['lens_', 'pool_', 'stream_'],
            'time': ['delay', 'schedule', 'timestamp']
        };

        for (const [domain, patterns] of Object.entries(domainPatterns)) {
            if (patterns.some(pattern => operatorName.includes(pattern))) {
                return domain;
            }
        }

        return 'core';
    }

    // ==================== ENHANCED EXECUTION ENGINE ====================
    
    async start(ast) {
        const executionStartTime = performance.now();
        this.ast = ast;
        
        this.metrics = {
            startTime: Date.now(),
            operatorCalls: 0,
            pipelineExecutions: 0,
            valuesProcessed: 0,
            errors: 0,
            warnings: 0,
            domainOperatorCalls: 0,
            poolUpdates: 0,
            streamActivations: 0,
            executionPhases: {},
            librarySelections: { stdlib: 0, lib: 0, hybrid: 0 }
        };

        this.executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            if (!this.config.quietMode && !this.replMode) {
                console.log('🚀 Executing Fluxus Program...');
                console.log(`   📋 Execution ID: ${this.executionId}`);
            }

            this.emit('execution:started', {
                executionId: this.executionId,
                astNodeCount: ast?.nodes?.length || 0,
                timestamp: Date.now()
            });

            const phases = {
                imports: performance.now(),
                pools: 0,
                finiteStreams: 0,
                reactiveStreams: 0,
                poolSubscriptions: 0
            };

            await this.loadImports();
            phases.imports = performance.now() - phases.imports;

            phases.pools = performance.now();
            this.initializePools();
            phases.pools = performance.now() - phases.pools;

            phases.finiteStreams = performance.now();
            const finiteStreamPromises = this.runFiniteStreams();
            phases.finiteStreams = performance.now() - phases.finiteStreams;

            phases.reactiveStreams = performance.now();
            await this.executeInitialReactiveFlows();
            phases.reactiveStreams = performance.now() - phases.reactiveStreams;

            phases.poolSubscriptions = performance.now();
            this.runPoolSubscriptions();
            phases.poolSubscriptions = performance.now() - phases.poolSubscriptions;

            this.metrics.executionPhases = phases;

            await this.withTimeout(
                Promise.all(finiteStreamPromises),
                this.config.executionTimeout,
                'Finite stream execution timeout'
            );

            const totalExecutionTime = performance.now() - executionStartTime;
            
            this.emit('execution:completed', {
                executionId: this.executionId,
                executionTime: totalExecutionTime,
                metrics: this.metrics,
                success: this.metrics.errors === 0
            });

            if (!this.config.quietMode && !this.replMode) {
                if (this.metrics.errors > 0) {
                    console.log('❌ Program completed with errors');
                } else {
                    console.log('✅ Program completed successfully');
                }

                if (this.config.enableMetrics) {
                    this.printExecutionMetrics(totalExecutionTime);
                }
            }

        } catch (error) {
            this.metrics.errors++;
            
            this.emit('execution:failed', {
                executionId: this.executionId,
                error: error.message,
                metrics: this.metrics
            });

            if (!this.config.quietMode) {
                console.error('❌ Program execution failed:', error.message);
            }
            throw error;
            
        } finally {
            if (!this.replMode) {
                await this.shutdown();
            }
        }
    }

    // ==================== ENHANCED IMPORT LOADING ====================
    
    async loadImports() {
        if (!this.ast?.imports) return;
        
        for (const importName of this.ast.imports) {
            try {
                const libraryInfo = this.availableLibraries.get(importName);
                if (libraryInfo) {
                    const success = await this.ensureLibraryLoaded(importName);
                    if (success && !this.config.quietMode) {
                        console.log(`   📚 Loaded ${libraryInfo.type} library: ${importName}`);
                    }
                } else {
                    // Try to load via library loader
                    const success = await this.libraryLoader.loadLibrary(importName);
                    if (success) {
                        this.loadedLibraries.add(importName);
                        if (!this.config.quietMode) {
                            console.log(`   📚 Loaded library: ${importName}`);
                        }
                    } else {
                        console.warn(`⚠️ Library not found: ${importName}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load import ${importName}:`, error.message);
                this.metrics.warnings++;
            }
        }
    }

    // ==================== ENHANCED POOL MANAGEMENT ====================
    
    initializePools() {
        if (!this.ast?.pools) return;
        
        Object.entries(this.ast.pools).forEach(([poolName, poolDef]) => {
            const initialValue = this.parseLiteralValue(poolDef.initial);
            this.pools.set(poolName, {
                value: initialValue,
                subscriptions: new Set(),
                history: this.config.maxPoolHistory > 0 ? [initialValue] : [],
                _updates: 0,
                createdAt: Date.now(),
                lastUpdated: Date.now()
            });
        });

        if (!this.config.quietMode) {
            console.log(`   💧 Initialized ${this.pools.size} tidal pools`);
        }
    }

    updatePool(poolName, newValue) {
        const pool = this.pools.get(poolName);
        if (!pool) return;

        pool.value = newValue;
        pool._updates++;
        pool.lastUpdated = Date.now();
        
        if (this.config.maxPoolHistory > 0) {
            if (pool.history.length >= this.config.maxPoolHistory) {
                pool.history.shift();
            }
            pool.history.push(newValue);
        }

        this.metrics.poolUpdates++;

        if (pool.subscriptions) {
            pool.subscriptions.forEach(subscriber => {
                try {
                    subscriber({
                        value: newValue,
                        pool: poolName,
                        updateCount: pool._updates,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    console.warn(`⚠️ Pool subscription failed for ${poolName}:`, error.message);
                    this.metrics.warnings++;
                }
            });
        }

        this.emit('pool:updated', {
            pool: poolName,
            value: newValue,
            updateCount: pool._updates
        });
    }

    // ==================== ENHANCED STREAM EXECUTION ====================
    
    runFiniteStreams() {
        if (!this.ast?.nodes) return [];
        
        const finiteStreams = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_FINITE');
        const streamPromises = finiteStreams.map(async (streamNode, index) => {
            try {
                this.metrics.pipelineExecutions++;
                const initialData = this.parseLiteralValue(streamNode.value);
                
                await this.executePipelineFromNode(streamNode, initialData);
                
                this.emit('stream:completed', {
                    streamId: streamNode.id,
                    type: 'finite',
                    success: true
                });
                
            } catch (error) {
                this.metrics.errors++;
                this.emit('stream:failed', {
                    streamId: streamNode.id,
                    type: 'finite',
                    error: error.message
                });
                
                if (!this.config.quietMode) {
                    console.error(`❌ Finite stream execution failed: ${error.message}`);
                }
            }
        });
        
        return streamPromises;
    }

    async executeInitialReactiveFlows() {
        if (!this.ast?.nodes) return;

        const reactiveStreams = this.ast.nodes.filter(n => n.type === 'STREAM_SOURCE_REACTIVE');
        this.metrics.streamActivations = reactiveStreams.length;

        for (const streamNode of reactiveStreams) {
            const sourceName = this.cleanOperatorName(streamNode.name);
            
            try {
                this.activeStreams.add(streamNode.id);
                
                if (sourceName.startsWith('iot_') || sourceName.includes('sensor')) {
                    this.domainStreams.set(streamNode.id, 'iot');
                } else if (sourceName.startsWith('health_') || sourceName.includes('tracker')) {
                    this.domainStreams.set(streamNode.id, 'health');
                }

                if (sourceName === 'ui_events') {
                    this.emit('stream:activated', {
                        streamId: streamNode.id,
                        type: 'reactive',
                        source: 'ui_events'
                    });
                }
                
                this.emit('stream:activated', {
                    streamId: streamNode.id,
                    type: 'reactive', 
                    source: sourceName,
                    domain: this.domainStreams.get(streamNode.id)
                });

            } catch (error) {
                console.warn(`⚠️ Reactive stream activation failed for ${sourceName}:`, error.message);
                this.metrics.warnings++;
            }
        }

        if (!this.config.quietMode && reactiveStreams.length > 0) {
            console.log(`   🔄 Activated ${reactiveStreams.length} reactive streams`);
        }
    }

    // ==================== ENHANCED PIPELINE EXECUTION ====================
    
    async executePipelineFromNode(startNode, initialData) {
        let currentNode = startNode;
        let currentData = initialData;
        let stepCount = 0;
        let inBranch = null;

        const pipelineId = `pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();

        this.emit('pipeline:started', {
            pipelineId,
            startNode: startNode.id,
            initialData
        });

        try {
            while (currentNode && stepCount < this.config.maxExecutionSteps) {
                stepCount++;

                if (currentNode.type === 'TRUE_FLOW' || currentNode.type === 'FALSE_FLOW') {
                    if (currentData.__split_condition !== undefined) {
                        const expectedCondition = currentNode.type === 'TRUE_FLOW';
                        const actualCondition = currentData.__split_condition;
                        
                        if (actualCondition !== expectedCondition) {
                            currentNode = this.findEndOfBranch(currentNode.id);
                            continue;
                        }
                        delete currentData.__split_condition;
                        inBranch = currentNode.type;
                    } else if (inBranch !== currentNode.type) {
                        currentNode = this.findEndOfBranch(currentNode.id);
                        continue;
                    }
                }

                currentData = await this.executeNode(currentNode, currentData);

                if (this.isTerminalNode(currentNode)) break;
                
                const nextConnection = this.ast.connections.find(c => 
                    c.from === currentNode.id && c.type === 'PIPE_FLOW'
                );
                
                if (!nextConnection) break;
                
                currentNode = this.ast.nodes.find(n => n.id === nextConnection.to);
                if (!currentNode) break;
            }

            const executionTime = performance.now() - startTime;
            
            this.emit('pipeline:completed', {
                pipelineId,
                executionTime,
                steps: stepCount,
                success: true
            });

            return currentData;

        } catch (error) {
            const executionTime = performance.now() - startTime;
            
            this.emit('pipeline:failed', {
                pipelineId,
                executionTime,
                steps: stepCount,
                error: error.message
            });

            throw error;
        }
    }

    async executeNode(node, inputData) {
        const nodeStartTime = performance.now();
        
        try {
            let result;
            
            switch (node.type) {
                case 'STREAM_SOURCE_FINITE':
                case 'POOL_SOURCE':
                case 'STREAM_SOURCE_REACTIVE':
                case 'TRUE_FLOW':
                case 'FALSE_FLOW':
                    result = inputData;
                    break;
                    
                case 'FUNCTION_OPERATOR':
                    result = await this.executeFunctionOperator(node, inputData);
                    break;
                    
                case 'LENS_OPERATOR':
                    result = this.executeLensOperator(node, inputData);
                    break;
                    
                default:
                    result = inputData;
            }

            const executionTime = performance.now() - nodeStartTime;
            this.performance.operatorExecutionTimes.set(node.id, executionTime);

            return result;

        } catch (error) {
            const executionTime = performance.now() - nodeStartTime;
            
            this.emit('node:failed', {
                nodeId: node.id,
                nodeType: node.type,
                executionTime,
                error: error.message
            });

            throw error;
        }
    }

    // ==================== CIRCUIT BREAKER PATTERN ====================
    
    isCircuitOpen(operatorName) {
        const circuit = this.errorRecovery.circuitBreakers.get(operatorName);
        if (!circuit) return false;
        
        return circuit.state === 'OPEN' && 
               Date.now() - circuit.lastFailureTime < circuit.timeout;
    }

    recordOperatorFailure(operatorName, error) {
        let circuit = this.errorRecovery.circuitBreakers.get(operatorName);
        
        if (!circuit) {
            circuit = {
                failureCount: 0,
                lastFailureTime: 0,
                state: 'CLOSED',
                timeout: 30000
            };
        }

        circuit.failureCount++;
        circuit.lastFailureTime = Date.now();

        if (circuit.failureCount >= 5) {
            circuit.state = 'OPEN';
            console.warn(`⚠️ Circuit breaker OPEN for operator: ${operatorName}`);
        }

        this.errorRecovery.circuitBreakers.set(operatorName, circuit);
    }

    // ==================== ENHANCED UTILITY METHODS ====================
    
    setupPerformanceMonitoring() {
        if (this.config.enablePerformanceProfiling) {
            this.performanceInterval = setInterval(() => {
                this.reportPerformance();
            }, 30000);
        }
    }

    reportPerformance() {
        const avgOpTime = this.calculateAverageOperatorTime();
        const activeStreams = this.activeStreams.size;
        const poolCount = this.pools.size;
        
        this.emit('performance:report', {
            avgOperatorTime: avgOpTime,
            activeStreams,
            poolCount,
            operatorCalls: this.metrics.operatorCalls,
            domainOperatorCalls: this.metrics.domainOperatorCalls
        });

        if (this.config.enableMetrics && !this.config.quietMode) {
            console.log('📊 Performance Snapshot:', {
                'Avg Operator Time': `${avgOpTime.toFixed(2)}ms`,
                'Active Streams': activeStreams,
                'Pools': poolCount,
                'Operator Calls': this.metrics.operatorCalls,
                'Domain Calls': this.metrics.domainOperatorCalls
            });
        }
    }

    calculateAverageOperatorTime() {
        const times = Array.from(this.performance.operatorExecutionTimes.values());
        if (times.length === 0) return 0;
        
        return times.reduce((sum, time) => sum + time, 0) / times.length;
    }

    async withTimeout(promise, timeoutMs, timeoutMessage = 'Operation timeout') {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        });

        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    printExecutionMetrics(totalExecutionTime) {
        const successRate = this.metrics.operatorCalls > 0
            ? ((this.metrics.operatorCalls - this.metrics.errors) / this.metrics.operatorCalls * 100)
            : 100;

        console.log('   📊 Execution Metrics:', {
            'Total Time': `${totalExecutionTime.toFixed(2)}ms`,
            'Operator Calls': this.metrics.operatorCalls,
            'Domain Calls': this.metrics.domainOperatorCalls,
            'Pipeline Executions': this.metrics.pipelineExecutions,
            'Values Processed': this.metrics.valuesProcessed,
            'Pool Updates': this.metrics.poolUpdates,
            'Errors': this.metrics.errors,
            'Warnings': this.metrics.warnings,
            'Ops/Second': (this.metrics.operatorCalls / (totalExecutionTime / 1000)).toFixed(1),
            'Success Rate': `${successRate.toFixed(1)}%`
        });

        if (this.config.enableSmartLibrarySelection) {
            console.log('   🧠 Library Selection Metrics:', this.metrics.librarySelections);
        }

        if (this.metrics.executionPhases) {
            console.log('   ⚡ Phase Timings:');
            Object.entries(this.metrics.executionPhases).forEach(([phase, time]) => {
                console.log(`      ${phase}: ${time.toFixed(2)}ms`);
            });
        }
    }

    // ==================== PRODUCTION API ENHANCEMENTS ====================
    
    setUIAdapter(adapter) {
        _setUIAdapter(adapter);
        this.emit('ui:adapter:set', { adapter: adapter?.constructor?.name });
    }

    getEngineStats() {
        return {
            metrics: { ...this.metrics },
            performance: {
                averageOperatorTime: this.calculateAverageOperatorTime(),
                domainLoadTimes: Object.fromEntries(this.performance.domainLoadTimes),
                libraryLoadTimes: Object.fromEntries(this.performance.libraryLoadTimes),
                operatorExecutionCount: this.performance.operatorExecutionTimes.size
            },
            state: {
                activeStreams: this.activeStreams.size,
                pools: this.pools.size,
                loadedDomains: this.loadedDomains.size,
                loadedLibraries: this.loadedLibraries.size,
                operators: this.operators.size,
                availableLibraries: this.availableLibraries.size
            },
            intelligence: {
                smartLibrarySelection: this.config.enableSmartLibrarySelection,
                libraryComplexityMap: Object.fromEntries(this.libraryComplexity)
            },
            executionId: this.executionId
        };
    }

    registerDomainOperator(operatorName, implementation, metadata = {}) {
        const operatorDef = {
            implementation,
            library: metadata.domain || 'custom',
            type: metadata.type || 'domain',
            description: metadata.description || 'Custom domain operator',
            signature: metadata.signature || { input: 'Any', output: 'Any', args: 'Any[]' }
        };

        this.operators.set(operatorName, this.createProductionOperatorWrapper(operatorName, operatorDef));
        
        this.emit('operator:registered', {
            name: operatorName,
            domain: operatorDef.library,
            type: operatorDef.type
        });

        return true;
    }

    // ==================== GRACEFUL SHUTDOWN ====================
    
    async shutdown() {
        this.emit('shutdown:initiated', {
            executionId: this.executionId,
            timestamp: Date.now()
        });

        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
        }

        this.emit('shutdown');

        this.pools.clear();
        this.operators.clear();
        this.loadedLibraries.clear();
        this.loadedDomains.clear();
        this.activeStreams.clear();
        this.domainStreams.clear();
        this.ast = null;

        this.errorRecovery.circuitBreakers.clear();

        if (!this.config.quietMode) {
            console.log('🛑 Production engine shutdown complete');
        }

        this.emit('shutdown:complete', {
            executionId: this.executionId,
            timestamp: Date.now()
        });
    }

    // ==================== EXISTING UTILITY METHODS ====================
    
    findEndOfBranch(startNodeId) {
        let currentId = startNodeId;
        while (true) {
            if (!this.ast || !this.ast.connections) return null;
            const nextConnection = this.ast.connections.find(c => c.from === currentId && c.type === 'PIPE_FLOW');
            if (!nextConnection) return null;
            const nextNode = this.ast.nodes.find(n => n.id === nextConnection.to);
            if (!nextNode || (nextNode.type !== 'FUNCTION_OPERATOR' && nextNode.type !== 'LENS_OPERATOR' && nextNode.type !== 'STREAM_SOURCE_FINITE')) {
                return nextNode;
            }
            currentId = nextNode.id;
        }
    }

    parseLiteralValue(value) {
        if (value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(value) && value.trim() !== '') return parseFloat(value);
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
            return value.slice(1, -1);
        }
        return value;
    }

    cleanOperatorName(nodeName) {
        const openParen = nodeName.indexOf('(');
        if (openParen !== -1) {
            return nodeName.substring(0, openParen).trim();
        }
        return nodeName.trim();
    }

    isTerminalNode(node) {
        const terminalOperators = ['print', 'to_pool', 'ui_render'];
        const operatorName = this.cleanOperatorName(node.name);
        return terminalOperators.includes(operatorName) || node.isTerminal;
    }

    executeLensOperator(node, inputData) {
        const property = this.cleanOperatorName(node.name).slice(1);
        if (typeof inputData === 'object' && inputData !== null && property in inputData) {
            return inputData[property];
        }
        return inputData;
    }

    runPoolSubscriptions() {
        if (!this.ast?.nodes) return;
        const subscriptions = this.ast.nodes.filter(n => n.type === 'POOL_SUBSCRIPTION');
        
        subscriptions.forEach(subNode => {
            try {
                const poolName = subNode.poolName;
                const pool = this.pools.get(poolName);
                if (!pool) return;

                const subscriber = async (newPoolState) => {
                    const connection = this.ast.connections.find(c => c.from === subNode.id);
                    if (connection) {
                        const downstreamNode = this.ast.nodes.find(n => n.id === connection.to);
                        if (downstreamNode) {
                            this.metrics.pipelineExecutions++;
                            await this.executePipelineFromNode(downstreamNode, newPoolState.value);
                        }
                    }
                };

                pool.subscriptions.add(subscriber);
                subscriber(pool);
                
            } catch (error) {
                this.metrics.errors++;
                if (!this.config.quietMode) {
                    console.error(`❌ Pool subscription initialization failed: ${error.message}`);
                }
            }
        });
    }
}

export default RuntimeEngine;
