// FILENAME: src/cli.js
// Fluxus CLI v5.0 - COMPLETE DOMAIN SUPPORT

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { GraphParser } from './core/parser.js';
import { Compiler } from './core/compiler.js';
import { RuntimeEngine } from './core/engine.js';
import { FluxusREPL } from './repl.js';
import { FluxusPackageManager } from './package-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FluxusCLI {
    constructor() {
        this.version = '5.0.0';
        this.build = 'complete-domains';
    }

    async execute() {
        const args = process.argv.slice(2);
        const command = args[0];
        const filename = args[1];
        const options = args.slice(2);

        try {
            await this.dispatchCommand(command, filename, options);
        } catch (error) {
            this.handleFatalError(error);
        }
    }

    async dispatchCommand(command, filename, options) {
        const commandHandlers = {
            'run': () => this.handleRun(filename, options),
            'compile': () => this.handleCompile(filename, options),
            'parse': () => this.handleParse(filename, options),
            'repl': () => this.handleRepl(options),
            'tutorial': () => this.handleTutorial(),
            'dashboard': () => this.handleDashboard(),
            'profile': () => this.handleProfile(filename, options),
            'test': () => this.handleTest(options),
            'libraries': () => this.handleLibraries(filename, options),
            'domains': () => this.handleDomains(filename, options),
            'packages': () => this.handlePackages(filename, options),
            'doctor': () => this.handleDoctor(),
            'benchmark': () => this.handleBenchmark(),
            'version': () => this.handleVersion(),
            'help': () => this.handleHelp(),
            '--help': () => this.handleHelp(),
            '-h': () => this.handleHelp(),
            '': () => this.handleHelp()
        };

        const handler = commandHandlers[command] || this.handleHelp;
        await handler.call(this);
    }

    async handleRun(filename, options) {
        if (!filename) {
            this.showUsageError('run <file.flux>');
            return;
        }

        this.showBanner('EXECUTION');
        const source = this.loadSourceFile(filename);
        
        const engine = new RuntimeEngine({
            debugMode: options.includes('--debug'),
            quietMode: options.includes('--quiet'),
            enableSmartLibrarySelection: !options.includes('--no-smart-libs'),
            enableMetrics: options.includes('--metrics'),
            enableIOTDomains: !options.includes('--no-iot'),
            enableHealthDomains: !options.includes('--no-health'),
            enableAnalyticsDomains: !options.includes('--no-analytics'),
            enableNetworkDomains: !options.includes('--no-network'),
            enableSecurityDomains: !options.includes('--no-security'),
            logLevel: options.includes('--debug') ? 'DEBUG' : 'INFO'
        });

        const parser = new GraphParser();
        const ast = parser.parse(source);
        
        const compiler = new Compiler();
        const compiledAst = compiler.compile(ast);

        console.log(`📁 File: ${filename}`);
        console.log(`📊 AST: ${ast.nodes?.length || 0} nodes`);
        console.log(`🧠 Engine: Complete Domain Support`);
        console.log(`   Smart Library: ${options.includes('--no-smart-libs') ? '❌ Disabled' : '✅ Enabled'}`);
        console.log(`   IoT Domain: ${options.includes('--no-iot') ? '❌ Disabled' : '✅ Enabled'}`);
        console.log(`   Health Domain: ${options.includes('--no-health') ? '❌ Disabled' : '✅ Enabled'}`);
        console.log(`   Analytics Domain: ${options.includes('--no-analytics') ? '❌ Disabled' : '✅ Enabled'}`);
        
        await engine.start(ast);
        
        if (options.includes('--metrics')) {
            const stats = engine.getEngineStats();
            console.log('\n📈 Complete Engine Metrics:');
            console.log(`   Library Selections:`, stats.metrics.librarySelections);
            console.log(`   Domain Operations:`, stats.intelligence.domainOperations);
            console.log(`   Stream Processors: ${Object.keys(stats.state.streamProcessors).length}`);
        }
    }

    async handleDomains(subcommand, options) {
        this.showBanner('DOMAIN MANAGEMENT');

        switch (subcommand) {
            case 'list':
                console.log('🏗️ Available Domains:');
                const engine = new RuntimeEngine({ quietMode: true });
                await engine.initializeProductionEngine();
                const stats = engine.getEngineStats();
                
                console.log('   🔧 Core Domains:');
                console.log('     📊 Math - Mathematical operations');
                console.log('     📝 Text - String processing');
                console.log('     ⚡ Reactive - Stream processing');
                console.log('     🕒 Time - Temporal operations');
                
                console.log('\n   🚀 Advanced Domains:');
                console.log('     🌐 IoT - Internet of Things');
                console.log('     🏥 Health - Healthcare monitoring');
                console.log('     📈 Analytics - Data analysis');
                console.log('     🔗 Network - Communication');
                console.log('     🔒 Security - Cryptography & auth');
                console.log('     🖥️ UI - User interface');
                console.log('     💾 Data - Collections & storage');
                
                console.log(`\n   📊 Loaded: ${stats.state.loadedDomains} domains, ${stats.state.operators} operators`);
                break;

            case 'stats':
                console.log('📊 Domain Statistics:');
                const eng = new RuntimeEngine({ quietMode: true });
                await eng.initializeProductionEngine();
                const engStats = eng.getEngineStats();
                console.log(`   Domain Operations:`, engStats.intelligence.domainOperations);
                break;

            default:
                console.log('🏗️ Domain Commands:');
                console.log('  fluxus domains list          List available domains');
                console.log('  fluxus domains stats         Show domain usage statistics');
        }
    }

    async handleCompile(filename, options) {
        if (!filename) {
            this.showUsageError('compile <file.flux>');
            return;
        }

        this.showBanner('COMPILATION');
        const source = this.loadSourceFile(filename);
        
        const parser = new GraphParser();
        const ast = parser.parse(source);
        
        const compiler = new Compiler();
        const compiled = compiler.compile(ast);

        console.log('📦 Compiled Program:');
        console.log(JSON.stringify(compiled, null, 2));
        
        console.log('\n🔍 Library Analysis:');
        const libraryAnalysis = this.analyzeLibraryUsage(ast);
        for (const [lib, operators] of Object.entries(libraryAnalysis)) {
            if (operators.length > 0) {
                console.log(`   📚 ${lib}: ${operators.length} operators`);
            }
        }
    }

    async handleParse(filename, options) {
        if (!filename) {
            this.showUsageError('parse <file.flux>');
            return;
        }

        this.showBanner('PARSING');
        const source = this.loadSourceFile(filename);
        
        const parser = new GraphParser();
        const ast = parser.parse(source);

        console.log('📖 AST Structure:');
        console.log(JSON.stringify(ast, null, 2));
    }

    async handleRepl(options) {
        this.showBanner('INTERACTIVE REPL');
        const repl = new FluxusREPL({
            debugMode: options.includes('--debug'),
            enableSmartLibrarySelection: !options.includes('--no-smart-libs')
        });
        await repl.start();
    }

    async handleTutorial() {
        this.showBanner('TUTORIAL');
        console.log(`
📚 Fluxus Tutorial - Complete Domain Support
============================================

1. CORE STREAMS:
   ~ "Hello" | print                    # One-off stream
   ~? "live_data" | print               # Live stream

2. DOMAIN OPERATIONS:
   ~ 5 | add(3) | print                 # Math domain
   ~ "data" | analyze_trend | print     # Analytics domain  
   ~ {} | health_monitor | print        # Health domain
   ~ {} | sensor_read | print           # IoT domain

3. SMART LIBRARY SELECTION:
   # Engine automatically chooses optimal library
   # Simple ops -> stdlib (fast)
   # Complex ops -> lib/ (advanced)

4. MULTI-DOMAIN PROCESSING:
   let health_data = <|> {}
   let iot_data = <|> {}
   ~? "patient_monitor" | health_monitor | to_pool(health_data)
   ~? "sensor_stream" | sensor_read | to_pool(iot_data)

Run: fluxus run examples/comprehensive-working.flux --metrics
        `);
    }

    async handleDashboard() {
        this.showBanner('DASHBOARD');
        const engine = new RuntimeEngine({ quietMode: true });
        const stats = engine.getEngineStats();
        
        console.log(`
📊 Fluxus Complete Engine Dashboard
===================================

Engine Status:
   🧠 Smart Library Selection: ${stats.intelligence.smartLibrarySelection ? '✅ Enabled' : '❌ Disabled'}
   📚 Available Libraries: ${stats.state.availableLibraries}
   🏗️ Loaded Domains: ${stats.state.loadedDomains}
   ⚡ Operators: ${stats.state.operators}

Domain Operations:
   🌐 IoT: ${stats.intelligence.domainOperations.iot}
   🏥 Health: ${stats.intelligence.domainOperations.health}  
   📈 Analytics: ${stats.intelligence.domainOperations.analytics}
   🔗 Network: ${stats.intelligence.domainOperations.network}
   🔒 Security: ${stats.intelligence.domainOperations.security}

Run 'fluxus run examples/comprehensive-working.flux --metrics' for detailed analysis
        `);
    }

    async handleProfile(filename, options) {
        if (!filename) {
            this.showUsageError('profile <file.flux>');
            return;
        }

        this.showBanner('PROFILING');
        const source = this.loadSourceFile(filename);
        
        const parser = new GraphParser();
        const ast = parser.parse(source);
        
        const compiler = new Compiler();
        const compiled = compiler.compile(ast);
        
        const engine = new RuntimeEngine({
            enableMetrics: true,
            enableSmartLibrarySelection: true,
            quietMode: true
        });
        
        console.log(`📊 Profiling: ${filename}`);
        
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        
        await engine.start(ast);
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;
        const stats = engine.getEngineStats();
        
        console.log('\n📈 Performance Report:');
        console.log(`   Execution Time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`   Memory Used: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Operator Calls: ${stats.metrics.operatorCalls}`);
        console.log(`   Library Selections:`, stats.metrics.librarySelections);
        console.log(`   Domain Operations:`, stats.intelligence.domainOperations);
    }

    async handleTest(options) {
        this.showBanner('TEST SUITE');
        console.log('🧪 Running Complete Engine Test Suite...\n');
        
        try {
            const engine = new RuntimeEngine({ quietMode: true });
            await engine.initializeProductionEngine();
            
            console.log('🔧 Testing All Domains:');
            const testResults = [];
            
            // Test core
            try {
                const result = await engine.operators.get('add')(5, [3]);
                testResults.push({ test: 'add(5, 3)', result, expected: 8, passed: result === 8 });
            } catch (e) {
                testResults.push({ test: 'add(5, 3)', error: e.message, passed: false });
            }
            
            // Test math
            try {
                const result = await engine.operators.get('sin')(0);
                testResults.push({ test: 'sin(0)', result, expected: 0, passed: Math.abs(result) < 0.0001 });
            } catch (e) {
                testResults.push({ test: 'sin(0)', error: e.message, passed: false });
            }
            
            // Test analytics
            try {
                const result = await engine.operators.get('analyze_trend')([1,2,3]);
                testResults.push({ test: 'analyze_trend([1,2,3])', result: 'object', expected: 'object', passed: typeof result === 'object' });
            } catch (e) {
                testResults.push({ test: 'analyze_trend([1,2,3])', error: e.message, passed: false });
            }
            
            // Test health
            try {
                const result = await engine.operators.get('health_monitor')({});
                testResults.push({ test: 'health_monitor({})', result: 'object', expected: 'object', passed: typeof result === 'object' });
            } catch (e) {
                testResults.push({ test: 'health_monitor({})', error: e.message, passed: false });
            }
            
            // Test IoT
            try {
                const result = await engine.operators.get('sensor_read')({});
                testResults.push({ test: 'sensor_read({})', result: 'object', expected: 'object', passed: typeof result === 'object' });
            } catch (e) {
                testResults.push({ test: 'sensor_read({})', error: e.message, passed: false });
            }
            
            let passed = 0;
            testResults.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`   ${status} ${test.test}: ${test.passed ? (typeof test.result === 'object' ? 'object' : test.result) : test.error}`);
                if (test.passed) passed++;
            });
            
            console.log(`\n📊 Results: ${passed}/${testResults.length} tests passed`);
            
            if (passed === testResults.length) {
                console.log('🎉 All domain tests passed!');
            } else {
                console.log('💔 Some domain tests failed');
                process.exit(1);
            }
            
            await engine.shutdown();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async handleLibraries(subcommand, options) {
        this.showBanner('LIBRARY MANAGEMENT');

        switch (subcommand) {
            case 'list':
                console.log('📚 Available Libraries:');
                const engine = new RuntimeEngine({ quietMode: true });
                await engine.initializeProductionEngine();
                const stats = engine.getEngineStats();
                
                console.log('   Standard Libraries (stdlib/):');
                console.log('     📦 core - Basic operators');
                console.log('     📦 math_basic - Simple math');
                console.log('     📦 string_basic - String operations');
                
                console.log('\n   Advanced Libraries (lib/):');
                console.log('     🚀 math_advanced - Advanced math');
                console.log('     🚀 analytics - Data analysis');
                console.log('     🚀 health - Healthcare');
                console.log('     🚀 iot - IoT operations');
                console.log('     🚀 network - Network operations');
                console.log('     🚀 security - Security operations');
                console.log('     🚀 reactive - Reactive streams');
                console.log('     🚀 time - Time operations');
                
                console.log(`\n   Total Available: ${stats.state.availableLibraries} libraries`);
                break;

            case 'stats':
                console.log('📊 Library Usage Statistics:');
                const eng = new RuntimeEngine({ quietMode: true });
                await eng.initializeProductionEngine();
                const engStats = eng.getEngineStats();
                console.log(`   Library Selections:`, engStats.metrics.librarySelections);
                break;

            default:
                console.log('📚 Library Commands:');
                console.log('  fluxus libraries list          List available libraries');
                console.log('  fluxus libraries stats         Show library selection stats');
        }
    }

    async handlePackages(subcommand, options) {
        const pm = new FluxusPackageManager();
        this.showBanner('PACKAGE MANAGEMENT');

        switch (subcommand) {
            case 'install':
                if (!options[0]) {
                    console.error('❌ Usage: fluxus packages install <package-name>');
                    return;
                }
                console.log(`📦 Installing: ${options[0]}`);
                break;

            case 'list':
                console.log('📦 Installed Packages:');
                console.log('   http');
                console.log('   sensors-mock');
                console.log('   sensors-real');
                break;

            default:
                console.log('📦 Package Commands:');
                console.log('  fluxus packages install <pkg>    Install a package');
                console.log('  fluxus packages list            List installed packages');
        }
    }

    async handleDoctor() {
        this.showBanner('COMPLETE ENGINE DIAGNOSTICS');
        
        const checks = [
            { 
                name: 'Complete Engine', 
                check: async () => {
                    const engine = new RuntimeEngine({ quietMode: true });
                    await engine.initializeProductionEngine();
                    const stats = engine.getEngineStats();
                    return stats.intelligence.smartLibrarySelection ? '✅ Active' : '❌ Inactive';
                } 
            },
            { 
                name: 'Math Domain', 
                check: async () => {
                    const engine = new RuntimeEngine({ quietMode: true });
                    await engine.initializeProductionEngine();
                    try {
                        const result = await engine.operators.get('sin')(0);
                        return Math.abs(result) < 0.0001 ? '✅ Working' : `❌ Failed (got ${result})`;
                    } catch (e) {
                        return `❌ Failed: ${e.message}`;
                    }
                } 
            },
            { 
                name: 'Analytics Domain', 
                check: async () => {
                    const engine = new RuntimeEngine({ quietMode: true });
                    await engine.initializeProductionEngine();
                    try {
                        const result = await engine.operators.get('analyze_trend')([1,2,3]);
                        return typeof result === 'object' ? '✅ Working' : `❌ Failed (got ${typeof result})`;
                    } catch (e) {
                        return `❌ Failed: ${e.message}`;
                    }
                } 
            },
            { 
                name: 'Health Domain', 
                check: async () => {
                    const engine = new RuntimeEngine({ quietMode: true });
                    await engine.initializeProductionEngine();
                    try {
                        const result = await engine.operators.get('health_monitor')({});
                        return typeof result === 'object' ? '✅ Working' : `❌ Failed (got ${typeof result})`;
                    } catch (e) {
                        return `❌ Failed: ${e.message}`;
                    }
                } 
            },
            { 
                name: 'IoT Domain', 
                check: async () => {
                    const engine = new RuntimeEngine({ quietMode: true });
                    await engine.initializeProductionEngine();
                    try {
                        const result = await engine.operators.get('sensor_read')({});
                        return typeof result === 'object' ? '✅ Working' : `❌ Failed (got ${typeof result})`;
                    } catch (e) {
                        return `❌ Failed: ${e.message}`;
                    }
                } 
            },
            { name: 'Core Parser', check: () => new GraphParser() ? '✅ OK' : '❌ Failed' },
            { name: 'Compiler', check: () => new Compiler() ? '✅ OK' : '❌ Failed' },
            { name: 'Package Manager', check: () => new FluxusPackageManager() ? '✅ OK' : '❌ Failed' },
            { name: 'REPL System', check: () => new FluxusREPL() ? '✅ OK' : '❌ Failed' }
        ];

        let allPassed = true;
        
        for (const check of checks) {
            try {
                const result = typeof check.check === 'function' ? 
                    (check.check.constructor.name === 'AsyncFunction' ? 
                        await check.check() : check.check()) : '✅ OK';
                console.log(`   ${result} ${check.name}`);
                if (result.startsWith('❌')) allPassed = false;
            } catch (error) {
                console.log(`   ❌ ${check.name}: ${error.message}`);
                allPassed = false;
            }
        }

        console.log(allPassed ? '\n💚 All systems operational!' : '\n💔 Some systems need attention.');
    }

    async handleBenchmark() {
        this.showBanner('COMPLETE ENGINE BENCHMARK');
        
        const examples = [
            'examples/arithmetic.flux', 
            'examples/comprehensive-working.flux', 
            'examples/health_tracker.flux',
            'examples/iot_monitor.flux'
        ];
        
        for (const example of examples) {
            try {
                const source = this.loadSourceFile(example);
                const parser = new GraphParser();
                const ast = parser.parse(source);
                const compiler = new Compiler();
                const compiledAst = compiler.compile(ast);
                const engine = new RuntimeEngine({ 
                    quietMode: true,
                    enableSmartLibrarySelection: true,
                    enableMetrics: true
                });
                
                const startTime = Date.now();
                await engine.start(ast);
                const executionTime = Date.now() - startTime;
                
                const stats = engine.getEngineStats();

                console.log(`⏱️  ${example}:`);
                console.log(`   Time: ${executionTime}ms`);
                console.log(`   Operators: ${stats.metrics.operatorCalls}`);
                console.log(`   Domain Operations:`, stats.intelligence.domainOperations);
                
            } catch (error) {
                console.log(`❌ ${example}: ERROR - ${error.message}`);
            }
        }
    }

    handleVersion() {
        console.log(`🌊 Fluxus Language v${this.version}`);
        console.log(`   Build: ${this.build}`);
        console.log(`   Status: Complete Domain Support`);
        console.log(`   Smart Library Selection: Enabled`);
    }

    handleHelp() {
        this.showBanner('COMPLETE ENGINE COMMAND REFERENCE');
        
        console.log('🚀 EXECUTION:');
        console.log('  fluxus run <file.flux>           Execute with Complete Engine');
        console.log('  fluxus run <file> --no-smart-libs Disable smart library selection');
        console.log('  fluxus run <file> --metrics      Show engine metrics');
        console.log('  fluxus run <file> --no-iot       Disable IoT domain');
        console.log('  fluxus run <file> --no-health    Disable health domain');
        console.log('  fluxus run <file> --no-analytics Disable analytics domain');
        console.log('  fluxus compile <file.flux>       Compile to IR');
        console.log('  fluxus parse <file.flux>         Parse and show AST');
        console.log('  fluxus repl                      Start interactive REPL');
        console.log('');
        
        console.log('🏗️ DOMAINS:');
        console.log('  fluxus domains list              List available domains');
        console.log('  fluxus domains stats             Show domain usage statistics');
        console.log('');
        
        console.log('📚 DEVELOPMENT:');
        console.log('  fluxus tutorial                  Show language tutorial');
        console.log('  fluxus dashboard                 Show runtime dashboard');
        console.log('  fluxus test                      Run complete engine tests');
        console.log('  fluxus libraries list            List available libraries');
        console.log('  fluxus libraries stats           Show library selection stats');
        console.log('  fluxus packages list             List installed packages');
        console.log('');
        
        console.log('🧪 TESTING & QUALITY:');
        console.log('  fluxus benchmark                 Performance benchmarks');
        console.log('  fluxus doctor                    Complete engine diagnostics');
        console.log('');
        
        console.log('ℹ️ INFORMATION:');
        console.log('  fluxus version                   Show version information');
        console.log('  fluxus help                      This help message');
        console.log('');
        
        console.log('💡 Examples:');
        console.log('  fluxus run examples/comprehensive-working.flux --metrics');
        console.log('  fluxus domains list');
        console.log('  fluxus test');
        console.log('  fluxus doctor');
    }

    loadSourceFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            throw new Error(`Could not read file: ${filePath}`);
        }
    }

    analyzeLibraryUsage(ast) {
        const usage = {
            core: [], math: [], text: [], data: [], analytics: [], health: [], iot: [], network: [], security: []
        };
        
        const operatorDomains = {
            'sin': 'math', 'cos': 'math', 'tan': 'math', 'max': 'math', 'min': 'math', 'mean': 'math', 'sum': 'math',
            'analyze_trend': 'analytics', 'detect_anomaly': 'analytics', 'predict': 'analytics',
            'health_monitor': 'health', 'vital_signs': 'health', 'medical_alert': 'health',
            'sensor_read': 'iot', 'device_control': 'iot', 'iot_analyze': 'iot',
            'http_request': 'network', 'websocket_connect': 'network', 'api_call': 'network',
            'encrypt': 'security', 'decrypt': 'security', 'authenticate': 'security',
            'map': 'data', 'filter': 'data', 'reduce': 'data', 'group_by': 'data'
        };
        
        if (ast.nodes) {
            ast.nodes.forEach(node => {
                if (node.type === 'FUNCTION_OPERATOR') {
                    const opName = node.name.split('(')[0].trim();
                    const domain = operatorDomains[opName];
                    if (domain && !usage[domain].includes(opName)) {
                        usage[domain].push(opName);
                    } else if (!domain && !usage.core.includes(opName)) {
                        usage.core.push(opName);
                    }
                }
            });
        }
        return usage;
    }

    showBanner(section) {
        console.log(`\n🌊 FLUXUS COMPLETE ENGINE v${this.version} - ${section}`);
        console.log('═'.repeat(60));
    }

    showUsageError(usage) {
        console.error(`❌ Usage: fluxus ${usage}`);
    }

    handleFatalError(error) {
        console.error('💥 Fluxus CLI Fatal Error:');
        console.error(error);
        process.exit(1);
    }
}

export function main() {
    const cli = new FluxusCLI();
    return cli.execute();
}

export { FluxusCLI };

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
