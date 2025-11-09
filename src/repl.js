// FILENAME: src/repl.js
// Fluxus Language REPL v5.5 - FIXED MULTI-LINE & PARSER INTEGRATION

import readline from 'readline';
import { GraphParser } from './core/parser.js';
import { RuntimeEngine } from './core/engine.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FluxusREPL {
    constructor() {
        this.parser = new GraphParser();
        this.engine = new RuntimeEngine();
        this.history = [];
        this.currentInput = '';
        this.inMultiLine = false;
        this.multiLineDelimiter = '';
        this.debugMode = false;
        this.visualizationMode = true;
        this.productionMode = false;
        
        this.operators = [
            'add', 'subtract', 'multiply', 'divide', 'map', 'reduce', 'filter', 'split',
            'trim', 'to_upper', 'to_lower', 'concat', 'break', 'join', 'word_count',
            'debounce', 'throttle', 'time_window', 'combine_latest',
            'delay', 'retry_after', 'stats', 'detect_steps', 'linear_regression',
            'fetch_url', 'mqtt_publish', 'sms_alert', 'http_post', 'local_processing',
            'print', 'to_pool', 'network_gateway', 'results_back_to_mobile'
        ];
        
        this.keywords = ['let', 'FLOW', 'FUNC', 'TRUE_FLOW', 'FALSE_FLOW', 'RESULT'];
        this.streamTypes = ['~', '~?'];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '🚀 fluxus> ',
            historySize: 1000,
            removeHistoryDuplicates: true,
            completer: (line) => this.autoComplete(line)
        });

        this.supportsColor = process.stdout.isTTY;
        this.streamHistory = [];
        this.sessionStart = new Date();
        this.loadPackageCapabilities();
        
        this.handleInput = this.handleInput.bind(this);
        this.handleCommand = this.handleCommand.bind(this);
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
            // Silent fail
        }
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
            .replace(/\b(let|FLOW|FUNC|TRUE_FLOW|FALSE_FLOW|RESULT)\b/g, `${colors.yellow}$1${colors.reset}`)
            .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, `${colors.green}$1${colors.reset}`)
            .replace(/\b(\d+\.?\d*)\b/g, `${colors.blue}$1${colors.reset}`)
            .replace(/\b(\w+)(?=\()/g, `${colors.cyan}$1${colors.reset}`)
            .replace(/(#.*$)/gm, `${colors.gray}$1${colors.reset}`)
            .replace(/\{([^}]+)\}/g, `${colors.orange}{$1}${colors.reset}`);
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

    autoComplete(line) {
        const hits = [];
        const currentWord = line.split(/\s+/).pop() || '';
        
        if (line.includes('~?')) {
            const liveOps = ['debounce', 'throttle', 'time_window', 'combine_latest', 'split'];
            liveOps.forEach(op => {
                if (op.startsWith(currentWord)) hits.push(op);
            });
        } else if (line.includes('FLOW')) {
            this.availablePackages.forEach(pkg => {
                if (pkg.startsWith(currentWord)) hits.push(pkg);
            });
        } else if (line.includes('|') && !line.includes('print') && !line.includes('to_pool')) {
            this.operators.forEach(op => {
                if (op.startsWith(currentWord)) hits.push(op);
            });
        } else {
            this.operators.forEach(op => {
                if (op.startsWith(currentWord)) hits.push(op);
            });
            this.keywords.forEach(kw => {
                if (kw.startsWith(currentWord)) hits.push(kw);
            });
            this.streamTypes.forEach(st => {
                if (st.startsWith(currentWord)) hits.push(st);
            });
        }
        
        Object.keys(this.engine.pools).forEach(pool => {
            if (pool.startsWith(currentWord)) hits.push(pool);
        });
        
        return [hits.length ? hits : [], currentWord];
    }

    start() {
        console.log(this.color('🌊 FLUXUS LANGUAGE REPL v5.5', '1;36'));
        console.log(this.color('   Production-Grade Reactive Stream Programming', '90'));
        console.log(this.color('   Mobile • Edge • Cloud Systems', '90'));
        console.log('');
        
        if (this.availablePackages.length > 0) {
            console.log(this.color('📦 Available Packages:', '1;33'));
            console.log('   ' + this.availablePackages.join(', '));
            console.log('');
        }
        
        console.log(this.color('💡 Type Fluxus code or .help for commands', '90'));
        console.log(this.color('🚀 Live streams: ~? | Finite streams: ~', '90'));
        console.log(this.color('🏊 Tidal Pools: let name = <|> value', '90'));
        console.log(this.color('🔍 Pool inspection: type pool name', '90'));
        console.log(this.color('📝 Multi-line: auto-continues until complete', '90'));
        console.log('');
        
        this.rl.prompt();
        this.rl.on('line', this.handleInput);
        this.rl.on('close', () => {
            this.showSessionSummary();
            console.log('\n👋 Fluxus session completed. Goodbye!');
            process.exit(0);
        });
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

        // 🎯 FIXED MULTI-LINE HANDLING
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

        // 🎯 FIXED: Check if needs multi-line continuation
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

    // 🎯 FIXED: Smart multi-line detection
    needsContinuation(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        
        // Check for obvious continuation patterns
        if (trimmed.endsWith('|')) return true;
        
        // Check for incomplete pool declaration
        if (trimmed.includes('let') && trimmed.includes('<|>')) {
            const parts = trimmed.split('<|>');
            if (parts.length === 1 || (parts.length === 2 && parts[1].trim() === '')) {
                return true;
            }
        }
        
        // Check for unbalanced delimiters
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        if (openBraces > closeBraces) return true;
        
        const openParens = (trimmed.match(/\(/g) || []).length;
        const closeParens = (trimmed.match(/\)/g) || []).length;
        if (openParens > closeParens) return true;
        
        return false;
    }

    // 🎯 FIXED: Complete expression detection
    isMultiLineComplete(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        
        // Quick syntax checks
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

    handleCommand(cmd) {
        const [command, arg] = cmd.split(' ');
        
        switch (command) {
            case '.help': this.showCompleteHelp(); break;
            case '.clear': console.clear(); console.log(this.color('🌊 FLUXUS LANGUAGE REPL v5.5', '1;36')); break;
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
            case '.packages': this.showPackages(); break;
            case '.stats': this.showRuntimeStats(); break;
            case '.spec': this.showLanguageSpec(); break;
            case '.reset': this.engine = new RuntimeEngine(); console.log(this.color('🔄 Runtime engine reset', '32')); break;
            case '.streams': this.showActiveStreams(); break;
            default: 
                console.log(this.color(`❌ Unknown command: ${cmd}`, '31'));
                console.log(this.color('💡 Type .help for available commands', '90'));
        }
    }

    showCompleteHelp() {
        console.log('\n' + this.color('🚀 FLUXUS REPL v5.5 - COMPLETE COMMAND REFERENCE', '1;36'));
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
        console.log(this.color('📚 LANGUAGE REFERENCE:', '1;33'));
        console.log('  .operators  - List all available operators');
        console.log('  .packages   - Show installed packages');
        console.log('  .spec       - Show language specification');
        console.log('  .streams    - Show active streams');
    }

    showProductionExamples() {
        console.log('\n' + this.color('🚀 PRODUCTION-READY EXAMPLES', '1;36'));
        console.log(this.color('💡 CORE STREAMS:', '1;33'));
        console.log('  ' + this.highlightSyntax('~ 5 | add(3) | print()'));
        console.log('  ' + this.highlightSyntax('"hello" | to_upper() | print()'));
        console.log('  ' + this.highlightSyntax('[1, 2, 3] | map {.value | multiply(2)} | print()'));
        console.log(this.color('💡 STATE MANAGEMENT:', '1;33'));
        console.log('  ' + this.highlightSyntax('let count = <|> 0'));
        console.log('  ' + this.highlightSyntax('5 | to_pool(count)'));
        console.log('  ' + this.highlightSyntax('count | add(3) | print()'));
        console.log('  ' + this.highlightSyntax('count'));
        console.log(this.color('💡 MULTI-LINE COMPLEX:', '1;33'));
        console.log('  ' + this.highlightSyntax('[1, 2, 3] | map {.value | multiply(2)'));
        console.log('  ' + this.highlightSyntax('| add(10) | filter {.value > 12}'));
        console.log('  ' + this.highlightSyntax('} | reduce {+} | print()'));
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
        console.log('  • Operators: Transform, filter, combine');
        console.log('  • Cross-Platform: Mobile → Edge → Cloud');
    }

    showOperators() {
        console.log('\n' + this.color('🔧 AVAILABLE OPERATORS:', '1;33'));
        console.log(this.color('  ARITHMETIC:', '36') + ' add, subtract, multiply, divide, double, add_five, square');
        console.log(this.color('  STRING:', '36') + ' trim, to_upper, to_lower, concat, break');
        console.log(this.color('  COLLECTION:', '36') + ' map, reduce, filter, split');
        console.log(this.color('  REACTIVE:', '36') + ' combine_latest, debounce, throttle, time_window');
        console.log(this.color('  SENSORS:', '36') + ' detect_steps, detect_mock_steps, calculate_magnitude');
        console.log(this.color('  NETWORK:', '36') + ' fetch_url, hash_sha256');
        console.log(this.color('  SINKS:', '36') + ' print, to_pool, ui_render');
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

    showRuntimeStats() {
        const pools = Object.keys(this.engine.pools);
        const totalUpdates = pools.reduce((sum, poolName) => sum + (this.engine.pools[poolName]._updates || 0), 0);
        const duration = Math.round((new Date() - this.sessionStart) / 1000);
        console.log('\n' + this.color('📈 RUNTIME STATISTICS', '1;33'));
        console.log(this.color(`  Active Pools: ${pools.length}`, '90'));
        console.log(this.color(`  Total Updates: ${totalUpdates}`, '90'));
        console.log(this.color(`  Commands Executed: ${this.history.length}`, '90'));
        console.log(this.color(`  Session Duration: ${duration}s`, '90'));
        console.log(this.color(`  Visualization: ${this.visualizationMode ? 'ON' : 'OFF'}`, '90'));
        console.log(this.color(`  Debug Mode: ${this.debugMode ? 'ON' : 'OFF'}`, '90'));
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
        const duration = Math.round((new Date() - this.sessionStart) / 1000);
        console.log('\n' + this.color('📊 SESSION SUMMARY', '1;33'));
        console.log(this.color(`  Duration: ${duration} seconds`, '90'));
        console.log(this.color(`  Commands: ${this.history.length} executed`, '90'));
        console.log(this.color(`  Pools: ${Object.keys(this.engine.pools).length} active`, '90'));
    }

    // 🎯 FIXED: Complete execute method with proper multi-line support
    execute(code) {
        if (!this.inMultiLine) {
            this.history.push(code);
        }

        try {
            let processedCode = code;
            
            // 🎯 CRITICAL FIX: Handle multi-line input properly
            if (this.inMultiLine && code.includes('\n')) {
                // Join all lines into a single expression for the parser
                const lines = code.split('\n');
                processedCode = lines.map(line => {
                    const trimmed = line.trim();
                    // Remove leading pipe from continuation lines but keep the pipe operator
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
            
            // 🎯 Handle different input types
            if (processedCode.includes('let') && processedCode.includes('<|>')) {
                // Pool declaration - process as is
            } else if (this.isPoolInspection(processedCode)) {
                this.inspectPool(processedCode);
                return;
            } else if (!processedCode.startsWith('~') && !processedCode.startsWith('FLOW') && 
                       (processedCode.includes('|') || this.isOperator(processedCode))) {
                processedCode = `~ ${processedCode}`;
            }

            // 🎯 DEBUG: Show what's being parsed
            if (this.debugMode) {
                console.log(this.color(`🔧 Parsing: ${processedCode}`, '90'));
            }

            const ast = this.parser.parse(processedCode);
            
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
            this.processOutputs(outputs);

        } catch (error) {
            console.log(this.color(`❌ ${error.message}`, '31'));
            if (this.debugMode) {
                console.log(this.color(`🔧 Stack: ${error.stack}`, '90'));
                console.log(this.color(`🔧 Code that failed: ${code}`, '90'));
            }
        }
    }

    isOperator(line) {
        const operators = [
            'add', 'subtract', 'multiply', 'divide', 'print', 'to_pool', 'ui_render',
            'trim', 'to_upper', 'to_lower', 'concat', 'break', 'map', 'reduce', 
            'filter', 'split', 'combine_latest', 'fetch_url', 'hash_sha256',
            'double', 'add_five', 'square', 'detect_steps', 'detect_mock_steps', 
            'calculate_magnitude'
        ];
        return operators.some(op => {
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
                // Operator execution logs - show in debug mode only
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
                let nodeType, valuePreview;
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
                }
                const connector = index < nodes.length - 1 ? '↓' : '⏹️';
                console.log(this.color(`│ ${connector} ${nodeType.padEnd(12)}: ${valuePreview.padEnd(25)} │`, '90'));
            });
        }
        console.log(this.color('└───────────────────────────────────────────────┘', '90'));
    }
}
