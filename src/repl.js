// FILENAME: src/repl.js
// Fluxus Language REPL v7.1 - STANDARD LIBRARY INTEGRATED

import readline from 'readline';
import { GraphParser } from './core/parser.js';
import { RuntimeEngine } from './core/engine.js';
import { Compiler } from './core/compiler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusREPL {
    constructor(config = {}) {
        this.parser = new GraphParser();
        this.engine = new RuntimeEngine({
            debugMode: config.debugMode || false,
            performanceTracking: true
        });
        this.compiler = new Compiler();

        // Enhanced state management with Standard Library awareness
        this.history = [];
        this.currentInput = '';
        this.inMultiLine = false;
        this.multiLineDelimiter = '';
        this.debugMode = config.debugMode || false;
        this.visualizationMode = true;
        this.productionMode = false;
        this.sessionMetrics = {
            startTime: new Date(),
            commandsExecuted: 0,
            errorsEncountered: 0,
            pipelinesCreated: 0,
            poolsCreated: 0,
            standardLibrariesUsed: new Set()
        };

        // Enhanced operator database with Standard Library integration
        this.operatorCategories = {
            'ARITHMETIC': ['add', 'subtract', 'multiply', 'divide', 'double', 'add_five', 'square'],
            'MATH': ['sin', 'cos', 'tan', 'sqrt', 'pow', 'log', 'exp', 'abs', 'floor', 'ceil', 'round', 'max', 'min', 'random', 'mean', 'median', 'sum'],
            'STRING': ['trim', 'to_upper', 'to_lower', 'concat', 'break', 'replace', 'substring', 'capitalize', 'reverse', 'contains', 'starts_with', 'ends_with', 'split_lines', 'length', 'repeat'],
            'COLLECTION': ['map', 'reduce', 'filter', 'split', 'length', 'get', 'set', 'keys', 'values'],
            'TIME': ['now', 'performance_now', 'timestamp', 'add_milliseconds', 'add_seconds', 'add_minutes', 'add_hours', 'format_time', 'to_iso_string'],
            'REACTIVE': ['combine_latest', 'debounce_subscription', 'throttle_subscription', 'buffer_subscription'],
            'DATA': ['window_count', 'moving_average', 'rate_per_second', 't_map', 't_filter', 't_group_by'],
            'NETWORK': ['http_get', 'http_post', 'mqtt_connect', 'mqtt_publish', 'fetch_url'],
            'SENSORS': ['accelerometer_sim', 'detect_steps', 'calculate_magnitude', 'heart_rate_sim'],
            'UI': ['ui_render', 'ui_events', 'ui_style', 'ui_form_binding'],
            'ANALYTICS': ['analyze_stats', 'detect_trend', 'detect_anomalies', 'calculate_kpis'],
            'SINKS': ['print', 'to_pool']
        };

        this.keywords = ['let', 'FLOW', 'FUNC', 'TRUE_FLOW', 'FALSE_FLOW', 'RESULT', 'END', 'import'];
        this.streamTypes = ['~', '~?'];

        // Enhanced REPL configuration
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '🚀 fluxus> ',
            historySize: 1000,
            removeHistoryDuplicates: true,
            completer: (line) => this.autoComplete(line),
            tabSize: 2
        });

        this.supportsColor = process.stdout.isTTY;
        this.streamHistory = [];
        this.loadPackageCapabilities();

        // Enhanced error recovery
        this.errorRecovery = {
            lastError: null,
            errorCount: 0,
            recoveryAttempts: 0,
            maxRecoveryAttempts: 3
        };

        this.handleInput = this.handleInput.bind(this);
        this.handleCommand = this.handleCommand.bind(this);

        // Performance monitoring
        this.executionTimes = [];
        this.memorySnapshots = [];
    }

    // Enhanced autocomplete with Standard Library awareness
    autoComplete(line) {
        const hits = new Set();
        const currentWord = line.split(/\s+/).pop() || '';
        const context = this.analyzeContext(line);

        // Get all operators from Standard Library
        const allOperators = this.getAllAvailableOperators();

        // Context-based completion
        if (context.isFlowImport || context.isLibraryImport) {
            this.getAvailableLibraries().forEach(lib => {
                if (lib.startsWith(currentWord)) hits.add(lib);
            });
        } else if (context.isStream) {
            this.getStreamOperators(context).forEach(op => {
                if (op.startsWith(currentWord)) hits.add(op);
            });
        } else if (context.isPoolOperation) {
            Object.keys(this.engine.pools).forEach(pool => {
                if (pool.startsWith(currentWord)) hits.add(pool);
            });
        } else {
            // General completion with Standard Library operators
            allOperators.forEach(op => {
                if (op.startsWith(currentWord)) hits.add(op);
            });
            this.keywords.forEach(kw => {
                if (kw.startsWith(currentWord)) hits.add(kw);
            });
            this.streamTypes.forEach(st => {
                if (st.startsWith(currentWord)) hits.add(st);
            });
        }

        // Add pool names
        Object.keys(this.engine.pools).forEach(pool => {
            if (pool.startsWith(currentWord)) hits.add(pool);
        });

        const sortedHits = Array.from(hits).sort();
        return [sortedHits.length ? sortedHits : [], currentWord];
    }

    // Get all available operators from Standard Library
    getAllAvailableOperators() {
        const operators = new Set();
        
        // Add operators from all categories
        Object.values(this.operatorCategories).forEach(category => {
            category.forEach(op => operators.add(op));
        });

        // Add operators from compiler's Standard Library
        try {
            const catalog = this.compiler.getOperatorCatalog();
            Object.keys(catalog).forEach(op => operators.add(op));
        } catch (error) {
            // Fallback if compiler not available
        }

        return Array.from(operators);
    }

    getAvailableLibraries() {
        return ['math', 'string', 'time', 'collections', 'types', 'network', 'sensors'];
    }

    analyzeContext(line) {
        return {
            isFlowImport: line.includes('FLOW'),
            isLibraryImport: line.includes('import '),
            isStream: line.includes('~') || line.includes('|'),
            isPoolOperation: !line.includes('~') && !line.includes('|') && 
                            !line.startsWith('let') && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(line.trim()),
            hasOpenBrace: (line.match(/{/g) || []).length > (line.match(/}/g) || []).length,
            hasOpenParen: (line.match(/\(/g) || []).length > (line.match(/\)/g) || []).length
        };
    }

    getStreamOperators(context) {
        if (context.hasOpenBrace) {
            return ['.value', 'multiply', 'add', 'filter', 'map'];
        }
        return this.getAllAvailableOperators();
    }

    // Enhanced execution with Standard Library tracking
    execute(code) {
        if (!this.inMultiLine) {
            this.history.push(code);
            this.sessionMetrics.commandsExecuted++;
        }

        const startTime = performance.now();

        try {
            let processedCode = code;
            
            // Handle multi-line input properly
            if (this.inMultiLine && code.includes('\n')) {
                const lines = code.split('\n');
                processedCode = lines.map(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('|')) {
                        return '| ' + trimmed.substring(1).trim();
                    }
                    return trimmed;
                }).join(' ').trim();
                
                // Ensure it starts with ~ if it's a pipeline
                if (!processedCode.startsWith('~') && !processedCode.startsWith('let') && 
                    !this.isPoolInspection(processedCode) && processedCode.includes('|')) {
                    processedCode = `~ ${processedCode}`;
                }
            }
            
            // Handle different input types
            if (processedCode.includes('let') && processedCode.includes('<|>')) {
                // Pool declaration - process as is
            } else if (this.isPoolInspection(processedCode)) {
                this.inspectPool(processedCode);
                return;
            } else if (!processedCode.startsWith('~') && !processedCode.startsWith('FLOW') && 
                       (processedCode.includes('|') || this.isOperator(processedCode))) {
                processedCode = `~ ${processedCode}`;
            }

            // Track Standard Library usage in the code
            this.trackStandardLibraryUsage(processedCode);

            if (this.debugMode) {
                console.log(this.color(`🔧 Parsing: ${processedCode}`, '90'));
            }

            const ast = this.parser.parse(processedCode);
            
            // Update session metrics with Standard Library info
            if (ast.metadata?.standardLibrary?.usedLibraries) {
                ast.metadata.standardLibrary.usedLibraries.forEach(lib => {
                    this.sessionMetrics.standardLibrariesUsed.add(lib);
                });
            }

            if (this.visualizationMode) {
                this.visualizeStream(ast, code);
            }
            
            this.engine.replMode = true;
            const originalLog = console.log;
            const outputs = [];
            
            console.log = (...args) => {
                const message = args.join(' ');
                if (message.includes('Output:') || message.includes('Updated pool') ||
                    message.includes('Result:') || message.includes('result:') ||
                    message.includes('Fluxus Stream Output:') || message.includes('→') ||
                    message.includes('✅') || message.includes('❌')) {
                    outputs.push(message);
                }
                if (this.debugMode && !this.isNoisyLog(message)) {
                    originalLog(...args);
                }
            };

            this.engine.start(ast);
            console.log = originalLog;
            
            const executionTime = performance.now() - startTime;
            this.executionTimes.push(executionTime);
            
            this.processOutputs(outputs);

            // Success - reset error recovery
            this.errorRecovery.errorCount = 0;
            this.errorRecovery.recoveryAttempts = 0;

        } catch (error) {
            this.sessionMetrics.errorsEncountered++;
            this.handleExecutionError(error, code, startTime);
        }
    }

    // Track Standard Library usage in code
    trackStandardLibraryUsage(code) {
        // Check for import statements
        if (code.includes('import ')) {
            const importMatch = code.match(/import\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (importMatch) {
                this.sessionMetrics.standardLibrariesUsed.add(importMatch[1]);
            }
        }

        // Check for Standard Library operators
        Object.entries(this.operatorCategories).forEach(([category, operators]) => {
            if (category !== 'ARITHMETIC' && category !== 'SINKS') {
                operators.forEach(op => {
                    if (code.includes(op)) {
                        this.sessionMetrics.standardLibrariesUsed.add(category.toLowerCase());
                    }
                });
            }
        });
    }

    handleExecutionError(error, code, startTime) {
        const executionTime = performance.now() - startTime;
        
        console.log(this.color(`❌ ${error.message}`, '31'));
        
        if (this.debugMode) {
            console.log(this.color(`🔧 Stack: ${error.stack}`, '90'));
            console.log(this.color(`🔧 Code that failed: ${code}`, '90'));
            console.log(this.color(`⏱️ Execution time: ${executionTime.toFixed(2)}ms`, '90'));
        }

        // Error recovery logic
        this.errorRecovery.lastError = error;
        this.errorRecovery.errorCount++;
        
        if (this.errorRecovery.errorCount > 2) {
            console.log(this.color('💡 Tip: Try .reset to clear engine state', '90'));
        }
    }

    // Enhanced visualization with Standard Library info
    visualizeStream(ast, code) {
        console.log('\n' + this.color('📊 STREAM VISUALIZATION', '1;33'));
        console.log(this.color('┌─ Pipeline Structure ──────────────────────────┐', '90'));
        
        const nodes = ast.nodes.filter(n => 
            n.type === 'STREAM_SOURCE_FINITE' || n.type === 'FUNCTION_OPERATOR' || 
            n.type === 'LENS_OPERATOR' || n.type === 'POOL_READ'
        );
        
        if (nodes.length === 0) {
            console.log(this.color('│  No stream nodes found                     │', '90'));
        } else {
            nodes.forEach((node, index) => {
                let nodeType, valuePreview, libraryInfo = '';
                
                if (node.type === 'STREAM_SOURCE_FINITE') {
                    nodeType = 'SOURCE';
                    valuePreview = (node.value?.substring(0, 20) || 'null') + (node.value?.length > 20 ? '...' : '');
                } else if (node.type === 'POOL_READ') {
                    nodeType = 'POOL';
                    valuePreview = node.value;
                } else if (node.type === 'LENS_OPERATOR') {
                    nodeType = 'LENS:' + node.name.toUpperCase();
                    valuePreview = node.args?.[0]?.substring(0, 20) || 'operation';
                } else {
                    nodeType = node.name.toUpperCase();
                    valuePreview = (node.value || 'operation').substring(0, 20);
                    
                    // Add library info for Standard Library operators
                    if (node.library && node.library !== 'core') {
                        libraryInfo = ` [${node.library}]`;
                    }
                }
                
                const connector = index < nodes.length - 1 ? '↓' : '⏹️';
                const displayText = `${nodeType.padEnd(12)}: ${valuePreview.padEnd(25)}${libraryInfo}`;
                console.log(this.color(`│ ${connector} ${displayText} │`, '90'));
            });
        }
        
        // Show Standard Library usage if any
        if (ast.metadata?.standardLibrary?.usedLibraries?.size > 0) {
            const libraries = Array.from(ast.metadata.standardLibrary.usedLibraries).join(', ');
            console.log(this.color(`│ 📚 Libraries: ${libraries.padEnd(30)} │`, '90'));
        }
        
        console.log(this.color('└───────────────────────────────────────────────┘', '90'));
    }

    // Enhanced help with Standard Library information
    showCompleteHelp() {
        console.log('\n' + this.color('🚀 FLUXUS REPL v7.1 - STANDARD LIBRARY EDITION', '1;36'));
        console.log(this.color('📖 CORE COMMANDS:', '1;33'));
        console.log('  .help       - Show this complete help');
        console.log('  .examples   - Show production-ready examples');
        console.log('  .pools      - Show all Tidal Pools and values');
        console.log('  .stats      - Show runtime statistics');
        console.log('  .reset      - Reset runtime engine');
        console.log('  .exit       - Exit REPL');
        console.log(this.color('🔧 DEVELOPMENT TOOLS:', '1;33'));
        console.log('  .debug      - Toggle debug mode');
        console.log('  .viz        - Toggle stream visualization');
        console.log('  .production - Toggle production mode');
        console.log('  .history    - Show command history');
        console.log('  .clear      - Clear screen');
        console.log(this.color('📚 STANDARD LIBRARY:', '1;33'));
        console.log('  .operators  - List all available operators');
        console.log('  .libraries  - Show available Standard Libraries');
        console.log('  .packages   - Show installed packages');
        console.log('  .spec       - Show language specification');
        console.log('  .streams    - Show active streams');
    }

    // New command to show Standard Libraries
    showLibraries() {
        console.log('\n' + this.color('📚 AVAILABLE STANDARD LIBRARIES:', '1;33'));
        const libraries = {
            'math': 'Mathematical functions and constants',
            'string': 'String manipulation and text processing',
            'time': 'Time-based operations and scheduling',
            'collections': 'Array and object operations',
            'types': 'Type checking and conversion',
            'network': 'HTTP, MQTT, and WebSocket operations',
            'sensors': 'Sensor data processing and simulation'
        };
        
        Object.entries(libraries).forEach(([lib, desc]) => {
            const used = this.sessionMetrics.standardLibrariesUsed.has(lib) ? ' ✅' : '';
            console.log(`  ${this.color(lib.padEnd(12), '36')} - ${desc}${used}`);
        });
        
        console.log(this.color('\n💡 Usage: import <library>', '90'));
        console.log(this.color('   Example: import math', '90'));
    }

    // Enhanced operators command with categories
    showOperators() {
        console.log('\n' + this.color('🔧 AVAILABLE OPERATORS (by category):', '1;33'));
        
        Object.entries(this.operatorCategories).forEach(([category, operators]) => {
            console.log(this.color(`  ${category}:`, '36') + ` ${operators.slice(0, 8).join(', ')}${operators.length > 8 ? '...' : ''}`);
        });
        
        console.log(this.color('\n💡 Total operators:', '90') + ` ${this.getAllAvailableOperators().length}`);
        console.log(this.color('💡 Use TAB for auto-completion', '90'));
    }

    // Enhanced stats with Standard Library metrics
    showRuntimeStats() {
        const pools = Object.keys(this.engine.pools);
        const totalUpdates = pools.reduce((sum, poolName) => sum + (this.engine.pools[poolName]._updates || 0), 0);
        const duration = Math.round((new Date() - this.sessionMetrics.startTime) / 1000);
        const avgExecutionTime = this.executionTimes.length > 0 
            ? (this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length).toFixed(2)
            : 0;
        
        console.log('\n' + this.color('📈 RUNTIME STATISTICS', '1;33'));
        console.log(this.color(`  Session Duration: ${duration}s`, '90'));
        console.log(this.color(`  Commands Executed: ${this.sessionMetrics.commandsExecuted}`, '90'));
        console.log(this.color(`  Errors Encountered: ${this.sessionMetrics.errorsEncountered}`, '90'));
        console.log(this.color(`  Average Execution: ${avgExecutionTime}ms`, '90'));
        console.log(this.color(`  Active Pools: ${pools.length}`, '90'));
        console.log(this.color(`  Total Updates: ${totalUpdates}`, '90'));
        console.log(this.color(`  Standard Libraries: ${this.sessionMetrics.standardLibrariesUsed.size} used`, '90'));
        console.log(this.color(`  Visualization: ${this.visualizationMode ? 'ON' : 'OFF'}`, '90'));
        console.log(this.color(`  Debug Mode: ${this.debugMode ? 'ON' : 'OFF'}`, '90'));
    }

    // Enhanced start message
    start() {
        console.log(this.color('🌊 FLUXUS LANGUAGE REPL v7.1', '1;36'));
        console.log(this.color('   Production-Grade Reactive Stream Programming', '90'));
        console.log(this.color('   Standard Library Integrated • Mobile • Edge • Cloud', '90'));
        console.log('');
        
        if (this.availablePackages.length > 0) {
            console.log(this.color('📦 Available Packages:', '1;33'));
            console.log('   ' + this.availablePackages.join(', '));
            console.log('');
        }
        
        console.log(this.color('📚 Standard Libraries: math, string, time, collections, types', '90'));
        console.log(this.color('💡 Type Fluxus code or .help for commands', '90'));
        console.log(this.color('🚀 Live streams: ~? | Finite streams: ~', '90'));
        console.log(this.color('🏊 Tidal Pools: let name = <|> value', '90'));
        console.log(this.color('📖 Import libraries: import math', '90'));
        console.log('');
        
        this.rl.prompt();
        this.rl.on('line', this.handleInput);
        this.rl.on('close', () => {
            this.showSessionSummary();
            console.log('\n👋 Fluxus session completed. Goodbye!');
            process.exit(0);
        });
    }

    // Enhanced command handler
    handleCommand(cmd) {
        const [command, arg] = cmd.split(' ');
        
        switch (command) {
            case '.help': this.showCompleteHelp(); break;
            case '.clear': console.clear(); console.log(this.color('🌊 FLUXUS LANGUAGE REPL v7.1', '1;36')); break;
            case '.examples': this.showProductionExamples(); break;
            case '.pools': this.showPools(); break;
            case '.history': arg ? this.searchAndShowHistory(arg) : this.showHistory(); break;
            case '.debug': 
                this.debugMode = !this.debugMode;
                this.engine.debugMode = this.debugMode;
                console.log(this.color(`🔧 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`, this.debugMode ? '33' : '90'));
                break;
            case '.viz':
                this.visualizationMode = !this.visualizationMode;
                console.log(this.color(`📊 Visualization: ${this.visualizationMode ? 'ON' : 'OFF'}`, this.visualizationMode ? '33' : '90'));
                break;
            case '.production':
                this.productionMode = !this.productionMode;
                console.log(this.color(`🏭 Production mode: ${this.productionMode ? 'ON' : 'OFF'}`, this.productionMode ? '33' : '90'));
                break;
            case '.operators': this.showOperators(); break;
            case '.libraries': this.showLibraries(); break;
            case '.packages': this.showPackages(); break;
            case '.stats': this.showRuntimeStats(); break;
            case '.spec': this.showLanguageSpec(); break;
            case '.reset': 
                this.engine = new RuntimeEngine(); 
                this.sessionMetrics.poolsCreated = 0;
                console.log(this.color('🔄 Runtime engine reset', '32')); 
                break;
            case '.streams': this.showActiveStreams(); break;
            default: 
                console.log(this.color(`❌ Unknown command: ${cmd}`, '31'));
                console.log(this.color('💡 Type .help for available commands', '90'));
        }
    }

    // ============ EXISTING METHODS (preserved for compatibility) ============

    loadPackageCapabilities() {
        this.availablePackages = [];
        try {
            const packagesPath = path.join(process.cwd(), 'fluxus_packages');
            if (fs.existsSync(packagesPath)) {
                const packages = fs.readdirSync(packagesPath);
                this.availablePackages = packages.filter(p => 
                    !p.startsWith('.') && fs.statSync(path.join(packagesPath, p)).isDirectory()
                );
            }
        } catch (error) {
            // Silent fail
        }
    }

    color(text, colorCode) {
        if (!this.supportsColor) return text;
        const colors = {
            '1;36': '\x1b[1;36m', '90': '\x1b[90m', '1;33': '\x1b[1;33m',
            '31': '\x1b[31m', '33': '\x1b[33m', '32': '\x1b[32m',
            '36': '\x1b[36m', '34': '\x1b[34m', '0': '\x1b[0m'
        };
        return `${colors[colorCode] || ''}${text}${colors['0']}`;
    }

    highlightSyntax(code) {
        if (!this.supportsColor) return code;
        
        const colors = {
            reset: '\x1b[0m',
            bold: '\x1b[1m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            magenta: '\x1b[35m',
            red: '\x1b[31m',
            gray: '\x1b[90m',
            orange: '\x1b[38;5;208m'
        };
        
        return code
            .replace(/(~?\?)/g, `${colors.magenta}$1${colors.reset}`)
            .replace(/(^|\s)(~)(?=\s|$)/g, `$1${colors.cyan}$2${colors.reset}`)
            .replace(/(<\|>|->)/g, `${colors.blue}$1${colors.reset}`)
            .replace(/\b(let|FLOW|FUNC|TRUE_FLOW|FALSE_FLOW|RESULT|import)\b/g, `${colors.yellow}$1${colors.reset}`)
            .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, `${colors.green}$1${colors.reset}`)
            .replace(/\b(\d+\.?\d*)\b/g, `${colors.blue}$1${colors.reset}`)
            .replace(/\b(\w+)(?=\()/g, `${colors.cyan}$1${colors.reset}`)
            .replace(/(#.*$)/gm, `${colors.gray}$1${colors.reset}`)
            .replace(/\{([^}]+)\}/g, `${colors.orange}{$1}${colors.reset}`);
    }

    handleInput(line) {
        const input = line.trim();

        if (input.startsWith('.')) {
            this.handleCommand(input);
            this.rl.prompt();
            return;
        }

        if (input === 'exit' || input === 'quit') {
            this.rl.close();
            return;
        }

        if (input === '' || input.startsWith('#')) {
            this.rl.prompt();
            return;
        }

        if (this.isPoolInspection(input)) {
            this.inspectPool(input);
            this.rl.prompt();
            return;
        }

        if (input === '!!') {
            const lastCommand = this.history[this.history.length - 1];
            if (lastCommand) {
                console.log(this.color(`↻ Replaying: ${this.highlightSyntax(lastCommand)}`, '90'));
                this.execute(lastCommand);
            } else {
                console.log(this.color('❌ No previous command found', '31'));
            }
            this.rl.prompt();
            return;
        }

        if (input.startsWith('!')) {
            const searchTerm = input.substring(1);
            const found = this.searchHistory(searchTerm);
            if (found) {
                console.log(this.color(`↻ Replaying: ${this.highlightSyntax(found)}`, '90'));
                this.execute(found);
            } else {
                console.log(this.color(`❌ No command matching "${searchTerm}" found`, '31'));
            }
            this.rl.prompt();
            return;
        }

        // Multi-line handling
        if (this.inMultiLine) {
            this.currentInput += '\n' + input;
            
            if (this.isMultiLineComplete(this.currentInput)) {
                const highlighted = this.highlightSyntax(this.currentInput);
                console.log(this.color(`🔍 Executing: ${highlighted}`, '90'));
                this.execute(this.currentInput);
                this.currentInput = '';
                this.inMultiLine = false;
                this.multiLineDelimiter = '';
                this.rl.setPrompt('🚀 fluxus> ');
            } else {
                this.rl.setPrompt(this.multiLineDelimiter + ' ');
            }
            this.rl.prompt();
            return;
        }

        // Check if needs multi-line continuation
        if (this.needsContinuation(input)) {
            this.currentInput = input;
            this.inMultiLine = true;
            this.multiLineDelimiter = this.getMultiLineDelimiter(input);
            this.rl.setPrompt(this.multiLineDelimiter + ' ');
            this.rl.prompt();
            return;
        }

        this.execute(input);
        this.rl.prompt();
    }

    needsContinuation(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        
        if (trimmed.endsWith('|')) return true;
        
        if (trimmed.includes('let') && trimmed.includes('<|>')) {
            const parts = trimmed.split('<|>');
            if (parts.length === 1 || (parts.length === 2 && parts[1].trim() === '')) {
                return true;
            }
        }
        
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        if (openBraces > closeBraces) return true;
        
        const openParens = (trimmed.match(/\(/g) || []).length;
        const closeParens = (trimmed.match(/\)/g) || []).length;
        if (openParens > closeParens) return true;
        
        return false;
    }

    isMultiLineComplete(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        
        if (trimmed.endsWith('|')) return false;
        
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        if (openBraces !== closeBraces) return false;
        
        const openParens = (trimmed.match(/\(/g) || []).length;
        const closeParens = (trimmed.match(/\)/g) || []).length;
        if (openParens !== closeParens) return false;
        
        return true;
    }

    getMultiLineDelimiter(input) {
        const trimmed = input.trim();
        
        if (trimmed.endsWith('|')) return '|';
        if ((trimmed.match(/{/g) || []).length > (trimmed.match(/}/g) || []).length) return '}';
        if ((trimmed.match(/\(/g) || []).length > (trimmed.match(/\)/g) || []).length) return ')';
        if (trimmed.includes('let') && trimmed.includes('<|>') && !trimmed.includes('\n')) {
            const parts = trimmed.split('<|>');
            if (parts.length === 1 || (parts.length === 2 && parts[1].trim() === '')) {
                return 'value>';
            }
        }
        
        return '...';
    }

    isPoolInspection(input) {
        const trimmed = input.trim();
        if (trimmed.startsWith('let ') || trimmed.includes('=') || trimmed.includes('<|>') ||
            trimmed.includes('|') || trimmed.includes('~') || trimmed.startsWith('FLOW') ||
            trimmed.startsWith('.') || trimmed === 'exit' || trimmed === 'quit' ||
            trimmed === 'help' || trimmed === '!!') {
            return false;
        }
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed) && this.engine.pools[trimmed] !== undefined;
    }

    inspectPool(poolName) {
        const pool = this.engine.pools[poolName];
        if (pool) {
            const valueStr = this.formatPoolValue(pool.value);
            console.log(this.color(`🏊 ${poolName} = ${valueStr}`, '36'));
            console.log(this.color(`   Type: ${Array.isArray(pool.value) ? 'Array' : typeof pool.value}`, '90'));
            console.log(this.color(`   Updates: ${pool._updates || 0}`, '90'));
            if (Array.isArray(pool.value)) {
                console.log(this.color(`   Length: ${pool.value.length}`, '90'));
            }
        } else {
            console.log(this.color(`❌ Pool '${poolName}' not found`, '31'));
        }
    }

    formatPoolValue(value) {
        if (Array.isArray(value)) {
            return `[${value.slice(0, 5).join(', ')}${value.length > 5 ? '...' : ''}]`;
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '');
        }
        return String(value);
    }

    searchHistory(term) {
        for (let i = this.history.length - 1; i >= 0; i--) {
            if (this.history[i].includes(term)) {
                return this.history[i];
            }
        }
        return null;
    }

    showProductionExamples() {
        console.log('\n' + this.color('🚀 PRODUCTION-READY EXAMPLES', '1;36'));
        console.log(this.color('💡 CORE STREAMS:', '1;33'));
        console.log('  ' + this.highlightSyntax('~ 5 | add(3) | print()'));
        console.log('  ' + this.highlightSyntax('"hello" | to_upper() | print()'));
        console.log('  ' + this.highlightSyntax('[1, 2, 3] | map {.value | multiply(2)} | print()'));
        console.log(this.color('💡 STANDARD LIBRARY:', '1;33'));
        console.log('  ' + this.highlightSyntax('import math'));
        console.log('  ' + this.highlightSyntax('~ 3.14159 | math.sin() | print()'));
        console.log('  ' + this.highlightSyntax('import string'));
        console.log('  ' + this.highlightSyntax('"hello world" | string.capitalize() | print()'));
        console.log(this.color('💡 STATE MANAGEMENT:', '1;33'));
        console.log('  ' + this.highlightSyntax('let count = <|> 0'));
        console.log('  ' + this.highlightSyntax('5 | to_pool(count)'));
        console.log('  ' + this.highlightSyntax('count | add(3) | print()'));
    }

    showLanguageSpec() {
        console.log('\n' + this.color('📖 FLUXUS LANGUAGE SPECIFICATION', '1;36'));
        console.log(this.color('   Unified Reactive Stream Programming', '90'));
        console.log(this.color('🎯 DESIGN PHILOSOPHY:', '1;33'));
        console.log('  • Time and Data are Unified');
        console.log('  • Mobile-First, Cloud-Native');
        console.log('  • Real-time Stream Processing');
        console.log('  • Backward Compatible');
        console.log(this.color('🏗️  ARCHITECTURE:', '1;33'));
        console.log('  • Live Streams (~?): Real-time data sources');
        console.log('  • Finite Streams (~): Batch processing');
        console.log('  • Tidal Pools (<|>): State management');
        console.log('  • Standard Library: math, string, time, collections');
        console.log('  • Cross-Platform: Mobile → Edge → Cloud');
    }

    showPackages() {
        if (this.availablePackages.length === 0) {
            console.log(this.color('📦 No packages installed', '90'));
            console.log(this.color('💡 Run: fluxus install <package>', '90'));
            return;
        }
        console.log('\n' + this.color('📦 INSTALLED PACKAGES:', '1;33'));
        this.availablePackages.forEach(pkg => console.log(`  ${pkg}`));
    }

    showHistory() {
        console.log('\n' + this.color('📜 COMMAND HISTORY (last 10):', '1;33'));
        const recentHistory = this.history.slice(-10);
        if (recentHistory.length === 0) {
            console.log('  No commands in history');
        } else {
            recentHistory.forEach((cmd, i) => {
                console.log(`  ${i + 1}. ${this.highlightSyntax(cmd)}`);
            });
        }
    }

    searchAndShowHistory(term) {
        console.log('\n' + this.color(`🔍 HISTORY SEARCH FOR "${term}":`, '1;33'));
        const matches = this.history.filter(cmd => cmd.includes(term));
        if (matches.length > 0) {
            matches.slice(-5).forEach((cmd, i) => {
                console.log(`  ${i + 1}. ${this.highlightSyntax(cmd)}`);
            });
        } else {
            console.log('  No matching commands found');
        }
    }

    showActiveStreams() {
        const finiteCount = this.engine.ast?.finiteStreams?.length || 0;
        const liveCount = this.engine.ast?.liveStreams?.length || 0;
        console.log('\n' + this.color('📊 ACTIVE STREAMS:', '1;33'));
        console.log(this.color(`  Finite Streams: ${finiteCount}`, '90'));
        console.log(this.color(`  Live Streams: ${liveCount}`, '90'));
        console.log(this.color(`  Tidal Pools: ${Object.keys(this.engine.pools).length}`, '90'));
    }

    showPools() {
        const pools = Object.keys(this.engine.pools);
        if (pools.length === 0) {
            console.log(this.color('💧 NO TIDAL POOLS DEFINED', '90'));
            console.log(this.color('💡 Create pools with: let name = <|> value', '90'));
            return;
        }
        console.log('\n' + this.color('🏊 TIDAL POOLS:', '1;33'));
        pools.forEach(poolName => {
            const pool = this.engine.pools[poolName];
            const valueDisplay = this.formatPoolValue(pool.value);
            const updateCount = pool._updates || 0;
            console.log(`  ${this.color(poolName, '36')} = ${valueDisplay} ${this.color(`(${updateCount} updates)`, '90')}`);
        });
    }

    showSessionSummary() {
        const duration = Math.round((new Date() - this.sessionMetrics.startTime) / 1000);
        console.log('\n' + this.color('📊 SESSION SUMMARY', '1;33'));
        console.log(this.color(`  Duration: ${duration} seconds`, '90'));
        console.log(this.color(`  Commands: ${this.sessionMetrics.commandsExecuted} executed`, '90'));
        console.log(this.color(`  Pools: ${Object.keys(this.engine.pools).length} active`, '90'));
        console.log(this.color(`  Libraries: ${this.sessionMetrics.standardLibrariesUsed.size} used`, '90'));
        console.log(this.color(`  Errors: ${this.sessionMetrics.errorsEncountered} encountered`, '90'));
    }

    isOperator(line) {
        const allOperators = this.getAllAvailableOperators();
        return allOperators.some(op => {
            return line.includes(op + '(') || 
                   line.includes(op + ' ') ||
                   (line.includes('|') && line.includes(op));
        });
    }

    isNoisyLog(message) {
        const noisyPatterns = [
            'Initialized',
            'Activated', 
            'Linking',
            'Running',
            'Waiting for events',
            'Fluxus Runtime Activated',
            'Executing Reactive Subscription Pipeline',
            'Executing Live Stream Pipeline',
            'PIPELINE STEP'
        ];
        return noisyPatterns.some(pattern => message.includes(pattern));
    }

    processOutputs(outputs) {
        outputs.forEach(output => {
            if (output.includes('Fluxus Stream Output:')) {
                const value = output.replace('✅ Fluxus Stream Output:', '').trim();
                console.log(this.color(`➡️  ${value}`, '32'));
            } else if (output.includes('Updated pool')) {
                const poolMatch = output.match(/Updated pool '(\w+)' to (.*)/);
                if (poolMatch) {
                    console.log(this.color(`🔄 ${poolMatch[1]} = ${poolMatch[2]}`, '36'));
                } else {
                    console.log(this.color(`🔄 ${output}`, '36'));
                }
            } else if (output.includes('→')) {
                if (this.debugMode && !output.includes('Executing') && !output.includes('Pipeline')) {
                    console.log(this.color(`⚡ ${output}`, '90'));
                }
            } else if (output.includes('✅') && !output.includes('Fluxus Runtime Activated')) {
                console.log(this.color(`✅ ${output.replace('✅', '').trim()}`, '32'));
            } else if (output.includes('❌')) {
                console.log(this.color(`❌ ${output.replace('❌', '').trim()}`, '31'));
            } else if (output.includes('Output:') || output.includes('Result:')) {
                const value = output.split(':')[1]?.trim();
                if (value) {
                    console.log(this.color(`➡️  ${value}`, '32'));
                }
            } else if (output.includes('result:')) {
                const value = output.split('result:')[1]?.trim();
                if (value) {
                    console.log(this.color(`➡️  ${value}`, '32'));
                }
            }
        });
    }
}
