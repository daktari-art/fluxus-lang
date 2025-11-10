// FILENAME: src/repl.js
// Fluxus Language REPL v7.0 - ENTERPRISE GRADE

import readline from 'readline';
import { GraphParser } from './core/parser.js';
import { RuntimeEngine } from './core/engine.js';
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
        
        // Enhanced state management
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
            poolsCreated: 0
        };
        
        // Enhanced operator database
        this.operatorCategories = {
            'ARITHMETIC': ['add', 'subtract', 'multiply', 'divide', 'double', 'add_five', 'square'],
            'STRING': ['trim', 'to_upper', 'to_lower', 'concat', 'break', 'replace', 'substring'],
            'COLLECTION': ['map', 'reduce', 'filter', 'split', 'length', 'get', 'set', 'keys', 'values'],
            'REACTIVE': ['combine_latest', 'debounce_subscription', 'throttle_subscription', 'buffer_subscription'],
            'DATA': ['window_count', 'moving_average', 'rate_per_second', 't_map', 't_filter', 't_group_by'],
            'NETWORK': ['http_get', 'http_post', 'mqtt_connect', 'mqtt_publish', 'fetch_url'],
            'SENSORS': ['accelerometer_sim', 'detect_steps', 'calculate_magnitude', 'heart_rate_sim'],
            'UI': ['ui_render', 'ui_events', 'ui_style', 'ui_form_binding'],
            'ANALYTICS': ['analyze_stats', 'detect_trend', 'detect_anomalies', 'calculate_kpis'],
            'SINKS': ['print', 'to_pool']
        };
        
        this.keywords = ['let', 'FLOW', 'FUNC', 'TRUE_FLOW', 'FALSE_FLOW', 'RESULT', 'END'];
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
            this.logError('Package loading failed', error);
        }
    }

    // Enhanced syntax highlighting with semantic coloring
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
            orange: '\x1b[38;5;208m',
            lightBlue: '\x1b[94m'
        };
        
        return code
            // Stream sources
            .replace(/(~?\?)/g, `${colors.magenta}$1${colors.reset}`)
            .replace(/(^|\s)(~)(?=\s|$)/g, `$1${colors.cyan}$2${colors.reset}`)
            
            // State management
            .replace(/(<\|>|->)/g, `${colors.blue}$1${colors.reset}`)
            
            // Keywords
            .replace(/\b(let|FLOW|FUNC|TRUE_FLOW|FALSE_FLOW|RESULT|END)\b/g, `${colors.yellow}$1${colors.reset}`)
            
            // Literals
            .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, `${colors.green}$1${colors.reset}`)
            .replace(/\b(\d+\.?\d*)\b/g, `${colors.blue}$1${colors.reset}`)
            
            // Operators and functions
            .replace(/\b(\w+)(?=\()/g, `${colors.cyan}$1${colors.reset}`)
            
            // Comments
            .replace(/(#.*$)/gm, `${colors.gray}$1${colors.reset}`)
            .replace(/(\/\/.*$)/gm, `${colors.gray}$1${colors.reset}`)
            
            // Lenses and complex expressions
            .replace(/\{([^}]+)\}/g, `${colors.orange}{$1}${colors.reset}`)
            
            // Pool references
            .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*_pool)\b/g, `${colors.lightBlue}$1${colors.reset}`);
    }

    color(text, colorCode) {
        if (!this.supportsColor) return text;
        const colors = {
            '1;36': '\x1b[1;36m', '90': '\x1b[90m', '1;33': '\x1b[1;33m',
            '31': '\x1b[31m', '33': '\x1b[33m', '32': '\x1b[32m',
            '36': '\x1b[36m', '34': '\x1b[34m', '0': '\x1b[0m',
            '35': '\x1b[35m', '94': '\x1b[94m'
        };
        return `${colors[colorCode] || ''}${text}${colors['0']}`;
    }

    // Enhanced autocomplete with context awareness
    autoComplete(line) {
        const hits = new Set();
        const currentWord = line.split(/\s+/).pop() || '';
        const context = this.analyzeContext(line);
        
        // Context-based completion
        if (context.isFlowImport) {
            this.availablePackages.forEach(pkg => {
                if (pkg.startsWith(currentWord)) hits.add(pkg);
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
            // General completion
            Object.values(this.operatorCategories).flat().forEach(op => {
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

    analyzeContext(line) {
        return {
            isFlowImport: line.includes('FLOW'),
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
        return Object.values(this.operatorCategories).flat();
    }

    start() {
        this.showWelcomeBanner();
        this.setupEventHandlers();
        this.rl.prompt();
    }

    showWelcomeBanner() {
        console.log(this.color('🌊 FLUXUS LANGUAGE REPL v7.0 - ENTERPRISE EDITION', '1;36'));
        console.log(this.color('   Production-Grade Reactive Stream Programming', '90'));
        console.log(this.color('   Mobile • Edge • Cloud Systems', '90'));
        console.log('');
        
        this.showSystemStatus();
        console.log('');
        
        console.log(this.color('💡 Type Fluxus code or .help for commands', '90'));
        console.log(this.color('🚀 Live streams: ~? | Finite streams: ~', '90'));
        console.log(this.color('🏊 Tidal Pools: let name = <|> value', '90'));
        console.log(this.color('🔍 Pool inspection: type pool name', '90'));
        console.log(this.color('📝 Multi-line: auto-continues until complete', '90'));
        console.log('');
    }

    showSystemStatus() {
        if (this.availablePackages.length > 0) {
            console.log(this.color('📦 Available Packages:', '1;33'));
            console.log('   ' + this.availablePackages.join(', '));
        }
        
        const engineStats = this.engine.getEngineStats();
        console.log(this.color('⚡ Engine Status:', '1;33'));
        console.log(`   Operators: ${engineStats.operators} | Libraries: ${engineStats.loadedLibraries}`);
        console.log(`   Performance: ${engineStats.performance ? 'ON' : 'OFF'} | Debug: ${this.debugMode ? 'ON' : 'OFF'}`);
    }

    setupEventHandlers() {
        this.rl.on('line', this.handleInput);
        this.rl.on('close', () => {
            this.showSessionSummary();
            console.log('\n' + this.color('👋 Fluxus session completed. Goodbye!', '1;36'));
            process.exit(0);
        });
        
        // Handle SIGINT gracefully
        process.on('SIGINT', () => {
            console.log('\n' + this.color('🛑 Received interrupt signal. Use .exit to quit properly.', '33'));
            this.rl.prompt();
        });
    }

    handleInput(line) {
        const input = line.trim();
        const startTime = Date.now();

        try {
            if (input.startsWith('.')) {
                this.handleCommand(input);
            } else if (input === 'exit' || input === 'quit') {
                this.rl.close();
                return;
            } else if (input === '' || input.startsWith('#')) {
                // Skip empty lines and comments
            } else if (this.isPoolInspection(input)) {
                this.inspectPool(input);
            } else if (input === '!!') {
                this.replayLastCommand();
            } else if (input.startsWith('!')) {
                this.replayCommandBySearch(input.substring(1));
            } else {
                this.handleCodeInput(input);
            }

            this.recordExecutionTime(Date.now() - startTime);
            
        } catch (error) {
            this.handleInputError(error, input);
        } finally {
            this.rl.prompt();
        }
    }

    handleCodeInput(input) {
        if (this.inMultiLine) {
            this.currentInput += '\n' + input;
            
            if (this.isMultiLineComplete(this.currentInput)) {
                this.executeMultiLineInput();
            } else {
                this.updateMultiLinePrompt();
            }
        } else if (this.needsContinuation(input)) {
            this.startMultiLineInput(input);
        } else {
            this.executeSingleLineInput(input);
        }
    }

    // Enhanced multi-line handling
    needsContinuation(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        
        const context = this.analyzeContext(trimmed);
        
        // Continuation patterns
        if (trimmed.endsWith('|')) return true;
        if (context.hasOpenBrace) return true;
        if (context.hasOpenParen) return true;
        
        // Incomplete pool declaration
        if (trimmed.includes('let') && trimmed.includes('<|>')) {
            const parts = trimmed.split('<|>');
            return parts.length === 1 || (parts.length === 2 && parts[1].trim() === '');
        }
        
        // Incomplete function call
        if (trimmed.includes('(') && !trimmed.includes(')')) return true;
        
        return false;
    }

    isMultiLineComplete(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        
        // Basic syntax validation
        if (trimmed.endsWith('|')) return false;
        
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        if (openBraces !== closeBraces) return false;
        
        const openParens = (trimmed.match(/\(/g) || []).length;
        const closeParens = (trimmed.match(/\)/g) || []).length;
        if (openParens !== closeParens) return false;
        
        // Semantic validation
        if (trimmed.includes('let') && trimmed.includes('<|>')) {
            const parts = trimmed.split('<|>');
            if (parts.length !== 2 || parts[1].trim() === '') return false;
        }
        
        return true;
    }

    startMultiLineInput(input) {
        this.currentInput = input;
        this.inMultiLine = true;
        this.multiLineDelimiter = this.getMultiLineDelimiter(input);
        this.updateMultiLinePrompt();
    }

    getMultiLineDelimiter(input) {
        const trimmed = input.trim();
        
        if (trimmed.endsWith('|')) return '|';
        if ((trimmed.match(/{/g) || []).length > (trimmed.match(/}/g) || []).length) return '}';
        if ((trimmed.match(/\(/g) || []).length > (trimmed.match(/\)/g) || []).length) return ')';
        if (trimmed.includes('let') && trimmed.includes('<|>') && !trimmed.includes('\n')) {
            return 'value>';
        }
        
        return '...';
    }

    updateMultiLinePrompt() {
        this.rl.setPrompt(this.multiLineDelimiter + ' ');
    }

    executeMultiLineInput() {
        const highlighted = this.highlightSyntax(this.currentInput);
        console.log(this.color(`🔍 Executing: ${highlighted}`, '90'));
        this.execute(this.currentInput);
        this.resetMultiLineState();
    }

    resetMultiLineState() {
        this.currentInput = '';
        this.inMultiLine = false;
        this.multiLineDelimiter = '';
        this.rl.setPrompt('🚀 fluxus> ');
    }

    executeSingleLineInput(input) {
        this.execute(input);
    }

    // Enhanced command handling
    handleCommand(cmd) {
        const [command, ...args] = cmd.slice(1).split(' ');
        const commandMap = {
            'help': () => this.showCompleteHelp(),
            'clear': () => this.clearScreen(),
            'examples': () => this.showProductionExamples(),
            'pools': () => this.showPools(),
            'history': () => args[0] ? this.searchAndShowHistory(args[0]) : this.showHistory(),
            'debug': () => this.toggleDebugMode(),
            'viz': () => this.toggleVisualization(),
            'production': () => this.toggleProductionMode(),
            'operators': () => this.showOperatorsByCategory(),
            'packages': () => this.showPackages(),
            'stats': () => this.showRuntimeStats(),
            'spec': () => this.showLanguageSpec(),
            'reset': () => this.resetEngine(),
            'streams': () => this.showActiveStreams(),
            'profile': () => this.showPerformanceProfile(),
            'memory': () => this.showMemoryUsage(),
            'export': () => this.exportSession(args[0]),
            'load': () => this.loadSession(args[0]),
            'exit': () => this.rl.close()
        };

        if (commandMap[command]) {
            commandMap[command]();
        } else {
            this.showUnknownCommand(cmd);
        }
    }

    // Enhanced execution with proper error handling and monitoring
    execute(code) {
        if (!this.inMultiLine) {
            this.history.push(code);
            this.sessionMetrics.commandsExecuted++;
        }

        const startTime = performance.now();
        
        try {
            let processedCode = this.preprocessCode(code);
            const ast = this.parser.parse(processedCode);
            
            if (this.visualizationMode) {
                this.visualizeStream(ast, code);
            }
            
            this.engine.replMode = true;
            const outputs = this.captureEngineOutput(() => {
                this.engine.start(ast);
            });
            
            this.processOutputs(outputs);
            this.recordSuccessfulExecution(performance.now() - startTime);
            
        } catch (error) {
            this.handleExecutionError(error, code, performance.now() - startTime);
        }
    }

    preprocessCode(code) {
        let processedCode = code;
        
        if (this.inMultiLine && code.includes('\n')) {
            processedCode = this.normalizeMultiLineCode(code);
        }
        
        // Auto-prefix streams
        if (!processedCode.startsWith('~') && !processedCode.startsWith('let') && 
            !processedCode.startsWith('FLOW') && !this.isPoolInspection(processedCode) &&
            (processedCode.includes('|') || this.containsOperator(processedCode))) {
            processedCode = `~ ${processedCode}`;
        }
        
        return processedCode;
    }

    normalizeMultiLineCode(code) {
        const lines = code.split('\n');
        return lines.map((line, index) => {
            const trimmed = line.trim();
            if (index > 0 && trimmed.startsWith('|')) {
                return '| ' + trimmed.substring(1).trim();
            }
            return trimmed;
        }).join(' ').trim();
    }

    containsOperator(line) {
        const allOperators = Object.values(this.operatorCategories).flat();
        return allOperators.some(op => {
            return line.includes(op + '(') || 
                   line.includes(op + ' ') ||
                   (line.includes('|') && line.includes(op));
        });
    }

    captureEngineOutput(engineFunction) {
        const outputs = [];
        const originalLog = console.log;
        
        console.log = (...args) => {
            const message = args.join(' ');
            if (this.shouldCaptureOutput(message)) {
                outputs.push(message);
            }
            if (this.debugMode && !this.isNoisyLog(message)) {
                originalLog(...args);
            }
        };

        try {
            engineFunction();
        } finally {
            console.log = originalLog;
        }
        
        return outputs;
    }

    shouldCaptureOutput(message) {
        const capturePatterns = [
            'Output:', 'Result:', 'result:', 'Fluxus Stream Output:',
            '→', '✅', '❌', 'Updated pool', 'Rendering to'
        ];
        return capturePatterns.some(pattern => message.includes(pattern));
    }

    isNoisyLog(message) {
        const noisyPatterns = [
            'Initialized', 'Activated', 'Linking', 'Running',
            'Waiting for events', 'Fluxus Runtime Activated',
            'Executing Reactive Subscription Pipeline',
            'Executing Live Stream Pipeline', 'PIPELINE STEP'
        ];
        return noisyPatterns.some(pattern => message.includes(pattern));
    }

    // Enhanced output processing
    processOutputs(outputs) {
        outputs.forEach(output => {
            if (output.includes('Fluxus Stream Output:')) {
                const value = output.replace('✅ Fluxus Stream Output:', '').trim();
                console.log(this.color(`➡️  ${value}`, '32'));
            } else if (output.includes('Updated pool')) {
                this.handlePoolUpdate(output);
            } else if (output.includes('→')) {
                if (this.debugMode) {
                    console.log(this.color(`⚡ ${output}`, '90'));
                }
            } else if (output.includes('✅') && !output.includes('Fluxus Runtime Activated')) {
                console.log(this.color(`✅ ${output.replace('✅', '').trim()}`, '32'));
            } else if (output.includes('❌')) {
                console.log(this.color(`❌ ${output.replace('❌', '').trim()}`, '31'));
            } else if (output.includes('Output:') || output.includes('Result:')) {
                const value = output.split(':')[1]?.trim();
                if (value) console.log(this.color(`➡️  ${value}`, '32'));
            }
        });
    }

    handlePoolUpdate(output) {
        const poolMatch = output.match(/Updated pool '(\w+)' to (.*)/);
        if (poolMatch) {
            console.log(this.color(`🔄 ${poolMatch[1]} = ${poolMatch[2]}`, '36'));
            this.sessionMetrics.poolsCreated++;
        } else {
            console.log(this.color(`🔄 ${output}`, '36'));
        }
    }

    // Enhanced error handling
    handleInputError(error, input) {
        this.sessionMetrics.errorsEncountered++;
        this.errorRecovery.lastError = error;
        this.errorRecovery.errorCount++;
        
        console.log(this.color(`❌ Input Error: ${error.message}`, '31'));
        
        if (this.debugMode) {
            console.log(this.color(`🔧 Stack: ${error.stack}`, '90'));
            console.log(this.color(`🔧 Input: ${input}`, '90'));
        }
        
        if (this.errorRecovery.errorCount > 3) {
            this.suggestRecovery();
        }
    }

    handleExecutionError(error, code, executionTime) {
        this.sessionMetrics.errorsEncountered++;
        
        console.log(this.color(`❌ Execution Error: ${error.message}`, '31'));
        
        if (this.debugMode) {
            console.log(this.color(`🔧 Execution Time: ${executionTime.toFixed(2)}ms`, '90'));
            console.log(this.color(`🔧 Code: ${code}`, '90'));
            console.log(this.color(`🔧 Stack: ${error.stack}`, '90'));
        }
        
        this.recordFailedExecution(executionTime);
    }

    suggestRecovery() {
        console.log(this.color('💡 Recovery Suggestions:', '33'));
        console.log('  • Check for syntax errors in multi-line input');
        console.log('  • Use .reset to restart the engine');
        console.log('  • Verify pool names and operator arguments');
        console.log('  • Use .debug for detailed error information');
    }

    // Enhanced visualization
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
                const nodeDisplay = this.formatNodeForVisualization(node);
                const connector = index < nodes.length - 1 ? '↓' : '⏹️';
                console.log(this.color(`│ ${connector} ${nodeDisplay} │`, '90'));
            });
        }
        console.log(this.color('└───────────────────────────────────────────────┘', '90'));
    }

    formatNodeForVisualization(node) {
        let type, value;
        
        switch (node.type) {
            case 'STREAM_SOURCE_FINITE':
                type = 'SOURCE'.padEnd(12);
                value = (node.value?.substring(0, 20) || 'null') + (node.value?.length > 20 ? '...' : '');
                break;
            case 'POOL_READ':
                type = 'POOL'.padEnd(12);
                value = node.value.padEnd(25);
                break;
            case 'LENS_OPERATOR':
                type = ('LENS:' + node.name.toUpperCase()).padEnd(12);
                value = (node.args?.[0]?.substring(0, 20) || 'operation').padEnd(25);
                break;
            default:
                type = node.name.toUpperCase().padEnd(12);
                value = (node.value || 'operation').substring(0, 25).padEnd(25);
        }
        
        return `${type}: ${value}`;
    }

    // Utility methods
    isPoolInspection(input) {
        const trimmed = input.trim();
        const isCommand = trimmed.startsWith('let ') || trimmed.includes('=') || trimmed.includes('<|>') ||
                         trimmed.includes('|') || trimmed.includes('~') || trimmed.startsWith('FLOW') ||
                         trimmed.startsWith('.') || trimmed === 'exit' || trimmed === 'quit' ||
                         trimmed === 'help' || trimmed === '!!';
        
        return !isCommand && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed) && 
               this.engine.pools[trimmed] !== undefined;
    }

    inspectPool(poolName) {
        const pool = this.engine.pools[poolName];
        if (pool) {
            const valueStr = this.formatPoolValue(pool.value);
            console.log(this.color(`🏊 ${poolName} = ${valueStr}`, '36'));
            console.log(this.color(`   Type: ${this.getTypeDescription(pool.value)}`, '90'));
            console.log(this.color(`   Updates: ${pool._updates || 0}`, '90'));
            console.log(this.color(`   Subscribers: ${pool.subscriptions?.size || 0}`, '90'));
            
            if (Array.isArray(pool.value)) {
                console.log(this.color(`   Length: ${pool.value.length}`, '90'));
            }
        } else {
            console.log(this.color(`❌ Pool '${poolName}' not found`, '31'));
        }
    }

    getTypeDescription(value) {
        if (Array.isArray(value)) return `Array[${value.length}]`;
        if (value === null) return 'null';
        if (typeof value === 'object') return `Object{${Object.keys(value).join(',')}}`;
        return typeof value;
    }

    formatPoolValue(value) {
        if (Array.isArray(value)) {
            return `[${value.slice(0, 5).join(', ')}${value.length > 5 ? '...' : ''}]`;
        }
        if (typeof value === 'object' && value !== null) {
            const str = JSON.stringify(value);
            return str.substring(0, 50) + (str.length > 50 ? '...' : '');
        }
        return String(value);
    }

    replayLastCommand() {
        const lastCommand = this.history[this.history.length - 1];
        if (lastCommand) {
            console.log(this.color(`↻ Replaying: ${this.highlightSyntax(lastCommand)}`, '90'));
            this.execute(lastCommand);
        } else {
            console.log(this.color('❌ No previous command found', '31'));
        }
    }

    replayCommandBySearch(term) {
        const found = this.searchHistory(term);
        if (found) {
            console.log(this.color(`↻ Replaying: ${this.highlightSyntax(found)}`, '90'));
            this.execute(found);
        } else {
            console.log(this.color(`❌ No command matching "${term}" found`, '31'));
        }
    }

    searchHistory(term) {
        for (let i = this.history.length - 1; i >= 0; i--) {
            if (this.history[i].includes(term)) {
                return this.history[i];
            }
        }
        return null;
    }

    // Enhanced command implementations
    showCompleteHelp() {
        console.log('\n' + this.color('🚀 FLUXUS REPL v7.0 - ENTERPRISE COMMAND REFERENCE', '1;36'));
        
        const commandCategories = {
            '📖 CORE COMMANDS': [
                '.help       - Show this complete help',
                '.examples   - Show production-ready examples',
                '.pools      - Show all Tidal Pools and values',
                '.stats      - Show runtime statistics',
                '.reset      - Reset runtime engine',
                '.exit       - Exit REPL'
            ],
            '🔧 DEVELOPMENT TOOLS': [
                '.debug      - Toggle debug mode',
                '.viz        - Toggle stream visualization',
                '.production - Toggle production mode',
                '.history    - Show command history',
                '.clear      - Clear screen',
                '.profile    - Show performance profile'
            ],
            '📚 LANGUAGE REFERENCE': [
                '.operators  - List all available operators',
                '.packages   - Show installed packages',
                '.spec       - Show language specification',
                '.streams    - Show active streams'
            ],
            '⚡ PERFORMANCE & MEMORY': [
                '.memory     - Show memory usage',
                '.profile    - Performance profiling',
                '.export     - Export session state',
                '.load       - Load previous session'
            ]
        };

        Object.entries(commandCategories).forEach(([category, commands]) => {
            console.log(this.color(category + ':', '1;33'));
            commands.forEach(cmd => console.log('  ' + cmd));
        });
    }

    showProductionExamples() {
        console.log('\n' + this.color('🚀 ENTERPRISE-READY EXAMPLES', '1;36'));
        
        const examples = {
            '💡 CORE STREAMS': [
                '~ 5 | add(3) | print()',
                '"hello" | to_upper() | print()',
                '[1, 2, 3] | map {.value | multiply(2)} | print()'
            ],
            '💡 STATE MANAGEMENT': [
                'let count = <|> 0',
                '5 | to_pool(count)',
                'count | add(3) | print()',
                'count'
            ],
            '💡 ADVANCED PATTERNS': [
                '~? accelerometer_sim(10) | detect_steps() | to_pool(step_count)',
                '~ [1,2,3,4,5] | moving_average(3) | print()',
                'let data = <|> []\n~? http_get("api/data") | to_pool(data)'
            ],
            '💡 MULTI-LINE COMPLEX': [
                '[1, 2, 3] | map {.value | multiply(2)',
                '| add(10) | filter {.value > 12}',
                '} | reduce {+} | print()'
            ]
        };

        Object.entries(examples).forEach(([category, exampleList]) => {
            console.log(this.color(category + ':', '1;33'));
            exampleList.forEach(example => {
                console.log('  ' + this.highlightSyntax(example));
            });
        });
    }

    showOperatorsByCategory() {
        console.log('\n' + this.color('🔧 AVAILABLE OPERATORS BY CATEGORY:', '1;33'));
        Object.entries(this.operatorCategories).forEach(([category, operators]) => {
            console.log(this.color(`  ${category}:`, '36') + ' ' + operators.join(', '));
        });
    }

    showRuntimeStats() {
        const duration = Math.round((new Date() - this.sessionMetrics.startTime) / 1000);
        const engineStats = this.engine.getEngineStats();
        
        console.log('\n' + this.color('📈 ENTERPRISE RUNTIME STATISTICS', '1;33'));
        console.log(this.color(`  Session Duration: ${duration}s`, '90'));
        console.log(this.color(`  Commands Executed: ${this.sessionMetrics.commandsExecuted}`, '90'));
        console.log(this.color(`  Errors Encountered: ${this.sessionMetrics.errorsEncountered}`, '90'));
        console.log(this.color(`  Pools Created: ${this.sessionMetrics.poolsCreated}`, '90'));
        console.log(this.color(`  Pipelines Created: ${this.sessionMetrics.pipelinesCreated}`, '90'));
        
        if (engineStats.performance) {
            console.log(this.color(`  Total Operator Calls: ${engineStats.performance.totalOperatorCalls}`, '90'));
            console.log(this.color(`  Uptime: ${Math.round(engineStats.performance.uptime / 1000)}s`, '90'));
        }
    }

    showPerformanceProfile() {
        if (this.executionTimes.length === 0) {
            console.log(this.color('📊 No performance data collected yet', '90'));
            return;
        }
        
        const avgTime = this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;
        const maxTime = Math.max(...this.executionTimes);
        const minTime = Math.min(...this.executionTimes);
        
        console.log('\n' + this.color('⚡ PERFORMANCE PROFILE', '1;33'));
        console.log(this.color(`  Executions: ${this.executionTimes.length}`, '90'));
        console.log(this.color(`  Average Time: ${avgTime.toFixed(2)}ms`, '90'));
        console.log(this.color(`  Fastest: ${minTime.toFixed(2)}ms`, '90'));
        console.log(this.color(`  Slowest: ${maxTime.toFixed(2)}ms`, '90'));
    }

    showMemoryUsage() {
        const memoryStats = this.engine.getEngineStats().memory;
        console.log('\n' + this.color('🧠 MEMORY USAGE', '1;33'));
        console.log(this.color(`  Pools: ${memoryStats.pools}`, '90'));
        console.log(this.color(`  Subscriptions: ${memoryStats.subscriptions}`, '90'));
        console.log(this.color(`  Live Streams: ${memoryStats.liveStreams}`, '90'));
        console.log(this.color(`  Stateful Operators: ${memoryStats.statefulOperators}`, '90'));
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        this.engine.debugMode = this.debugMode;
        console.log(this.color(`🔧 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`, this.debugMode ? '33' : '90'));
    }

    toggleVisualization() {
        this.visualizationMode = !this.visualizationMode;
        console.log(this.color(`📊 Visualization: ${this.visualizationMode ? 'ON' : 'OFF'}`, this.visualizationMode ? '33' : '90'));
    }

    toggleProductionMode() {
        this.productionMode = !this.productionMode;
        console.log(this.color(`🏭 Production mode: ${this.productionMode ? 'ON' : 'OFF'}`, this.productionMode ? '33' : '90'));
    }

    resetEngine() {
        this.engine = new RuntimeEngine({
            debugMode: this.debugMode,
            performanceTracking: true
        });
        console.log(this.color('🔄 Runtime engine reset', '32'));
    }

    clearScreen() {
        console.clear();
        this.showWelcomeBanner();
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
            const subscriberCount = pool.subscriptions?.size || 0;
            console.log(`  ${this.color(poolName, '36')} = ${valueDisplay} ${this.color(`(${updateCount} updates, ${subscriberCount} subs)`, '90')}`);
        });
    }

    showActiveStreams() {
        const finiteCount = this.engine.ast?.finiteStreams?.length || 0;
        const liveCount = this.engine.ast?.liveStreams?.length || 0;
        console.log('\n' + this.color('📊 ACTIVE STREAMS:', '1;33'));
        console.log(this.color(`  Finite Streams: ${finiteCount}`, '90'));
        console.log(this.color(`  Live Streams: ${liveCount}`, '90'));
        console.log(this.color(`  Tidal Pools: ${Object.keys(this.engine.pools).length}`, '90'));
    }

    showLanguageSpec() {
        console.log('\n' + this.color('📖 FLUXUS ENTERPRISE SPECIFICATION', '1;36'));
        console.log(this.color('   Unified Reactive Stream Programming', '90'));
        console.log(this.color('🎯 ENTERPRISE FEATURES:', '1;33'));
        console.log('  • Production-grade error handling');
        console.log('  • Performance monitoring and profiling');
        console.log('  • Memory management and cleanup');
        console.log('  • Advanced visualization and debugging');
        console.log('  • Session persistence and recovery');
    }

    exportSession(filename = `fluxus_session_${Date.now()}.json`) {
        const sessionData = {
            timestamp: new Date().toISOString(),
            history: this.history,
            pools: this.engine.pools,
            metrics: this.sessionMetrics,
            version: '7.0'
        };
        
        try {
            fs.writeFileSync(filename, JSON.stringify(sessionData, null, 2));
            console.log(this.color(`💾 Session exported to: ${filename}`, '32'));
        } catch (error) {
            console.log(this.color(`❌ Failed to export session: ${error.message}`, '31'));
        }
    }

    loadSession(filename) {
        try {
            const sessionData = JSON.parse(fs.readFileSync(filename, 'utf8'));
            this.history = sessionData.history || [];
            console.log(this.color(`📂 Session loaded from: ${filename}`, '32'));
            console.log(this.color(`   Commands: ${this.history.length}`, '90'));
        } catch (error) {
            console.log(this.color(`❌ Failed to load session: ${error.message}`, '31'));
        }
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

    showUnknownCommand(cmd) {
        console.log(this.color(`❌ Unknown command: ${cmd}`, '31'));
        console.log(this.color('💡 Type .help for available commands', '90'));
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

    showSessionSummary() {
        const duration = Math.round((new Date() - this.sessionMetrics.startTime) / 1000);
        console.log('\n' + this.color('📊 ENTERPRISE SESSION SUMMARY', '1;33'));
        console.log(this.color(`  Duration: ${duration} seconds`, '90'));
        console.log(this.color(`  Commands: ${this.sessionMetrics.commandsExecuted} executed`, '90'));
        console.log(this.color(`  Errors: ${this.sessionMetrics.errorsEncountered} encountered`, '90'));
        console.log(this.color(`  Pools: ${Object.keys(this.engine.pools).length} active`, '90'));
        console.log(this.color(`  Success Rate: ${((this.sessionMetrics.commandsExecuted - this.sessionMetrics.errorsEncountered) / this.sessionMetrics.commandsExecuted * 100).toFixed(1)}%`, '90'));
    }

    recordExecutionTime(time) {
        this.executionTimes.push(time);
        if (this.executionTimes.length > 100) {
            this.executionTimes.shift();
        }
    }

    recordSuccessfulExecution(time) {
        this.sessionMetrics.pipelinesCreated++;
    }

    recordFailedExecution(time) {
        // Track failed executions for analytics
    }

    logError(context, error) {
        if (this.debugMode) {
            console.log(this.color(`🔧 ${context}: ${error.message}`, '90'));
        }
    }
}
