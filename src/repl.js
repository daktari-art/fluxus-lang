// FILENAME: src/repl.js
// Fluxus Language REPL v5.0 - PRODUCTION-GRADE with Superior UX

import readline from 'readline';
import { GraphParser } from './core/parser.js';
import { RuntimeEngine } from './core/engine.js';
import fs from 'fs';
import path from 'path';

export class FluxusREPL {
    constructor() {
        this.parser = new GraphParser();
        this.engine = new RuntimeEngine();
        this.history = [];
        this.currentInput = '';
        this.inMultiLine = false;
        this.debugMode = false;
        this.visualizationMode = true; // DEFAULT ON - Show superiority
        this.productionMode = false;
        
        // 🚀 PRODUCTION OPERATORS - Reflects your specification
        this.operators = [
            // Core stream operations
            'add', 'subtract', 'multiply', 'divide', 'map', 'reduce', 'filter',
            'trim', 'to_upper', 'to_lower', 'concat', 'break', 'join', 'word_count',
            
            // Advanced stream processing (from your spec)
            'debounce', 'throttle', 'time_window', 'combine_latest', 'split',
            'delay', 'retry_after', 'stats', 'detect_steps', 'linear_regression',
            
            // Package integrations
            'fetch_url', 'mqtt_publish', 'sms_alert', 'http_post', 'local_processing',
            
            // Sinks & outputs
            'print', 'to_pool', 'network_gateway', 'results_back_to_mobile'
        ];
        
        this.keywords = ['let', 'FLOW', 'FUNC', 'TRUE_FLOW', 'FALSE_FLOW', 'RESULT'];
        this.streamTypes = ['~', '~?']; // Emphasize live vs finite streams
        
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
        
        // 🚀 Load package capabilities
        this.loadPackageCapabilities();
    }

    // 🚀 Load available packages to show real capabilities
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
            // Silent fail - packages optional
        }
    }

    // 🚀 SUPERIOR Syntax highlighting
    highlightSyntax(code) {
        if (!this.supportsColor) return code;
        
        return code
            // Live streams (emphasize importance)
            .replace(/(~?\?)/g, '\x1b[1;35m$1\x1b[0m')
            // Finite streams
            .replace(/(^|\s)(~)(?=\s|$)/g, '$1\x1b[36m$2\x1b[0m')
            // Pool operators
            .replace(/(<\|>|->)/g, '\x1b[1;34m$1\x1b[0m')
            // Keywords
            .replace(/\b(let|FLOW|FUNC|TRUE_FLOW|FALSE_FLOW|RESULT)\b/g, '\x1b[1;33m$1\x1b[0m')
            // Strings
            .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, '\x1b[32m$1\x1b[0m')
            // Numbers
            .replace(/\b(\d+\.?\d*)\b/g, '\x1b[34m$1\x1b[0m')
            // Functions
            .replace(/\b(\w+)(?=\()/g, '\x1b[1;36m$1\x1b[0m')
            // Comments
            .replace(/(#.*$)/gm, '\x1b[90m$1\x1b[0m')
            // Lenses
            .replace(/\{([^}]+)\}/g, '\x1b[38;5;208m{$1}\x1b[0m');
    }

    color(text, colorCode) {
        return this.supportsColor ? `\x1b[${colorCode}m${text}\x1b[0m` : text;
    }

    // 🚀 PRODUCTION-GRADE Auto-completion
    autoComplete(line) {
        const hits = [];
        const currentWord = line.split(/\s+/).pop() || '';
        
        // Context-aware completion for production code
        if (line.includes('~?')) {
            // Live stream context - suggest real-time operators
            const liveOps = ['debounce', 'throttle', 'time_window', 'combine_latest', 'split'];
            liveOps.forEach(op => {
                if (op.startsWith(currentWord)) hits.push(op);
            });
        } else if (line.includes('FLOW')) {
            // Flow declaration - suggest available packages
            this.availablePackages.forEach(pkg => {
                if (pkg.startsWith(currentWord)) hits.push(pkg);
            });
        } else if (line.includes('|') && !line.includes('print') && !line.includes('to_pool')) {
            // Stream processing context
            this.operators.forEach(op => {
                if (op.startsWith(currentWord)) hits.push(op);
            });
        } else {
            // Global completion
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
        
        // Complete pool names
        Object.keys(this.engine.pools).forEach(pool => {
            if (pool.startsWith(currentWord)) hits.push(pool);
        });
        
        return [hits.length ? hits : [], currentWord];
    }

    start() {
        console.log(this.color('🌊 FLUXUS LANGUAGE REPL v5.0', '1;36'));
        console.log(this.color('   Production-Grade Reactive Stream Programming', '90'));
        console.log(this.color('   Mobile • Edge • Cloud Systems', '90'));
        console.log('');
        
        // 🚀 Show available packages
        if (this.availablePackages.length > 0) {
            console.log(this.color('📦 Available Packages:', '1;33'));
            console.log('   ' + this.availablePackages.join(', '));
            console.log('');
        }
        
        console.log(this.color('💡 Type Fluxus code or .help for commands', '90'));
        console.log(this.color('🚀 Live streams: ~? | Finite streams: ~', '90'));
        console.log('');
        
        this.rl.prompt();

        this.rl.on('line', (line) => {
            this.handleInput(line);
        });

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

        // 🚀 Enhanced command history
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

        // 🚀 Smart pool inspection
        if (this.isPoolInspection(input)) {
            this.inspectPool(input);
            this.rl.prompt();
            return;
        }

        // 🚀 BULLETPROOF Multi-line handling
        if (this.inMultiLine) {
            this.currentInput += '\n' + input;
            
            if (this.isMultiLineComplete(this.currentInput)) {
                const highlighted = this.highlightSyntax(this.currentInput);
                console.log(this.color(`🔍 Executing: ${highlighted}`, '90'));
                this.execute(this.currentInput);
                this.currentInput = '';
                this.inMultiLine = false;
                this.rl.setPrompt('🚀 fluxus> ');
            } else {
                this.rl.setPrompt('... ');
            }
            this.rl.prompt();
            return;
        }

        // 🚀 Check if needs continuation
        if (this.needsContinuation(input)) {
            this.currentInput = input;
            this.inMultiLine = true;
            this.rl.setPrompt('... ');
            this.rl.prompt();
            return;
        }

        // Single line execution
        this.execute(input);
        this.rl.prompt();
    }

    // 🚀 BULLETPROOF Multi-line completion
    needsContinuation(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        
        // SIMPLE RULES THAT WORK:
        
        // 1. Ends with pipe = continue
        if (trimmed.endsWith('|') && !trimmed.includes('| print()') && !trimmed.includes('| to_pool(')) {
            return true;
        }
        
        // 2. Unbalanced braces = continue
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        if (openBraces > closeBraces) return true;
        
        // 3. Incomplete Tidal Pool = continue
        if (trimmed.includes('let') && trimmed.includes('<|>') && !trimmed.endsWith('>')) {
            return true;
        }
        
        // 4. Unclosed parentheses = continue
        const openParen = (trimmed.match(/\(/g) || []).length;
        const closeParen = (trimmed.match(/\)/g) || []).length;
        if (openParen > closeParen) return true;
        
        return false;
    }

    isMultiLineComplete(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        
        // BULLETPROOF COMPLETION RULES:
        
        // 1. If it's just a pool name = COMPLETE
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed) && 
            !trimmed.includes('|') && 
            !trimmed.includes('{') && 
            !trimmed.includes('}') &&
            !trimmed.includes('let') &&
            !trimmed.includes('<|>')) {
            return true;
        }
        
        // 2. Balanced braces required
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        if (openBraces !== closeBraces) return false;
        
        // 3. Balanced parentheses required
        const openParen = (trimmed.match(/\(/g) || []).length;
        const closeParen = (trimmed.match(/\)/g) || []).length;
        if (openParen !== closeParen) return false;
        
        // 4. Cannot end with pipe
        if (trimmed.endsWith('|') && !trimmed.includes('| print()') && !trimmed.includes('| to_pool(')) {
            return false;
        }
        
        // 5. Complete Tidal Pool declaration
        if (trimmed.includes('let') && trimmed.includes('<|>') && !trimmed.endsWith('>')) {
            return false;
        }
        
        return true;
    }

    isPoolInspection(input) {
        const trimmed = input.trim();
        
        // DON'T treat these as pool inspections
        if (trimmed.startsWith('let ') || trimmed.includes('=') || trimmed.includes('<|>') ||
            trimmed.includes('|') || trimmed.includes('~') || trimmed.startsWith('FLOW')) {
            return false;
        }
        
        // ONLY treat as inspection if it's a simple identifier AND pool exists
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed) && 
               !['exit', 'quit', 'help', '!!'].includes(trimmed) &&
               this.engine.pools[trimmed] !== undefined;
    }

    // 🚀 PRODUCTION-GRADE Pool inspection
    inspectPool(poolName) {
        const pool = this.engine.pools[poolName];
        if (pool) {
            console.log(this.color(`🏊 ${poolName} = ${pool.value}`, '36'));
            
            const valueType = Array.isArray(pool.value) ? 'Array' : typeof pool.value;
            console.log(this.color(`   Type: ${valueType}`, '90'));
            
            if (Array.isArray(pool.value)) {
                console.log(this.color(`   Length: ${pool.value.length}`, '90'));
                if (pool.value.length > 0) {
                    console.log(this.color(`   Sample: [${pool.value.slice(0, 3).join(', ')}${pool.value.length > 3 ? '...' : ''}]`, '90'));
                }
            }
            
            if (pool._updates !== undefined) {
                console.log(this.color(`   Updates: ${pool._updates}`, '90'));
            }
            
            // Show stream connections
            const connections = this.findPoolConnections(poolName);
            if (connections.length > 0) {
                console.log(this.color(`   Connected to: ${connections.join(', ')}`, '90'));
            }
        } else {
            console.log(this.color(`❌ Pool '${poolName}' not found`, '31'));
            const similar = Object.keys(this.engine.pools).filter(p => 
                p.includes(poolName) || poolName.includes(p)
            );
            if (similar.length > 0) {
                console.log(this.color(`💡 Did you mean: ${similar.join(', ')}?`, '90'));
            }
        }
    }

    findPoolConnections(poolName) {
        // Simple connection detection
        const connections = [];
        this.history.forEach(cmd => {
            if (cmd.includes(`to_pool(${poolName})`) || cmd.includes(`-> ${poolName}`)) {
                const source = cmd.split('|')[0]?.trim();
                if (source && !connections.includes(source)) {
                    connections.push(source);
                }
            }
        });
        return connections;
    }

    searchHistory(term) {
        for (let i = this.history.length - 1; i >= 0; i--) {
            if (this.history[i].includes(term)) {
                return this.history[i];
            }
        }
        return null;
    }

    // 🚀 PRODUCTION-GRADE Commands
    handleCommand(cmd) {
        const [command, arg] = cmd.split(' ');
        
        switch (command) {
            case '.help':
                this.showProductionHelp();
                break;
                
            case '.clear':
                console.clear();
                console.log(this.color('🌊 FLUXUS LANGUAGE REPL v5.0', '1;36'));
                console.log(this.color('   Production-Grade Reactive Stream Programming', '90'));
                break;
                
            case '.examples':
                this.showProductionExamples();
                break;

            case '.pools':
                this.showPools();
                break;
                
            case '.history':
                if (arg) {
                    this.searchAndShowHistory(arg);
                } else {
                    this.showHistory();
                }
                break;
                
            case '.debug':
                this.debugMode = !this.debugMode;
                this.engine.debugMode = this.debugMode;
                console.log(this.color(`🔧 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`, this.debugMode ? '33' : '90'));
                break;
                
            case '.viz':
                this.visualizationMode = !this.visualizationMode;
                console.log(this.color(`📊 Visualization: ${this.visualizationMode ? 'ON' : 'OFF'}`, this.visualizationMode ? '33' : '90'));
                if (this.visualizationMode) {
                    this.showStreamVisualization();
                }
                break;

            case '.production':
                this.productionMode = !this.productionMode;
                console.log(this.color(`🏭 Production mode: ${this.productionMode ? 'ON' : 'OFF'}`, this.productionMode ? '33' : '90'));
                break;
                
            case '.operators':
                console.log('\n' + this.color('🔧 Production Operators:', '1;33'));
                console.log('  ' + this.operators.join(', '));
                break;

            case '.packages':
                this.showPackages();
                break;
                
            case '.stats':
                this.showRuntimeStats();
                break;

            case '.spec':
                this.showLanguageSpec();
                break;
                
            default:
                console.log(this.color(`❌ Unknown command: ${cmd}. Type .help for available commands.`, '31'));
        }
    }

    showProductionHelp() {
        console.log('\n' + this.color('🚀 FLUXUS PRODUCTION REPL', '1;36'));
        console.log(this.color('   Unified Reactive Stream Language', '90'));
        console.log('');
        
        console.log(this.color('📖 CORE COMMANDS:', '1;33'));
        console.log('  .help       - Show this production help');
        console.log('  .examples   - Show production-ready examples');
        console.log('  .spec       - Show language specification');
        console.log('  .production - Toggle production mode');
        console.log('');
        
        console.log(this.color('🔧 DEVELOPMENT:', '1;33'));
        console.log('  .debug      - Toggle debug mode');
        console.log('  .viz        - Toggle stream visualization');
        console.log('  .pools      - Show all Tidal Pools');
        console.log('  .operators  - List available operators');
        console.log('  .packages   - Show available packages');
        console.log('  .stats      - Show runtime statistics');
        console.log('');
        
        console.log(this.color('💡 ADVANCED FEATURES:', '1;33'));
        console.log('  !!          - Repeat last command');
        console.log('  !text       - Repeat command containing "text"');
        console.log('  .history    - Show/search command history');
        console.log('  Multi-line  - Automatic for complex expressions');
        console.log('');
        
        console.log(this.color('🌊 STREAM TYPES:', '1;33'));
        console.log('  ~?          - Live streams (real-time, sensors)');
        console.log('  ~           - Finite streams (batch processing)');
        console.log('  <|>         - Tidal Pools (state management)');
        console.log('  ->          - Stream to pool connections');
        console.log('');
        
        console.log(this.color('📚 QUICK START:', '90'));
        console.log('  let data = <|> 0');
        console.log('  5 | add(3) | to_pool(data)');
        console.log('  data');
    }

    showProductionExamples() {
        console.log('\n' + this.color('🚀 PRODUCTION-READY EXAMPLES', '1;36'));
        
        console.log('\n' + this.color('💡 CORE STREAMS:', '1;33'));
        console.log(this.highlightSyntax('  ~ 5 | add(3) | print()'));
        console.log(this.highlightSyntax('  "hello" | to_upper() | print()'));
        console.log(this.highlightSyntax('  [1, 2, 3] | map {.value | multiply(2)} | print()'));
        
        console.log('\n' + this.color('💡 STATE MANAGEMENT:', '1;33'));
        console.log(this.highlightSyntax('  let count = <|> 0'));
        console.log(this.highlightSyntax('  5 | to_pool(count)'));
        console.log(this.highlightSyntax('  count  (inspect pool value)'));
        
        console.log('\n' + this.color('💡 REAL-TIME PROCESSING:', '1;33'));
        console.log(this.highlightSyntax('  ~? sensor_data | debounce(300) | throttle(1000)'));
        console.log(this.highlightSyntax('  ~? user_input | combine_latest(profile_data)'));
        console.log(this.highlightSyntax('  ~? network_request | split {.status == 200}'));
        
        console.log('\n' + this.color('💡 MULTI-LINE COMPLEX:', '1;33'));
        console.log(this.highlightSyntax('  [1, 2, 3] | map {.value | multiply(2)'));
        console.log(this.highlightSyntax('  | add(10) | filter {.value > 12}'));
        console.log(this.highlightSyntax('  } | print()'));
        
        console.log('\n' + this.color('💡 PRODUCTION PATTERNS:', '1;33'));
        console.log(this.highlightSyntax('  # Health tracker (from spec)'));
        console.log(this.highlightSyntax('  let steps = <|> 0'));
        console.log(this.highlightSyntax('  ~? accelerometer | detect_steps() | to_pool(steps)'));
        console.log(this.highlightSyntax('  steps | split {.value > 1000} | TRUE_FLOW | alert_achievement()'));
    }

    showLanguageSpec() {
        console.log('\n' + this.color('📖 FLUXUS LANGUAGE SPECIFICATION', '1;36'));
        console.log(this.color('   Unified Reactive Stream Programming', '90'));
        console.log('');
        
        console.log(this.color('🎯 DESIGN PHILOSOPHY:', '1;33'));
        console.log('  • Time and Data are Unified');
        console.log('  • Mobile-First, Cloud-Native');
        console.log('  • Backward Compatible, Progressive Enhancement');
        console.log('  • Real-time Stream Processing');
        console.log('');
        
        console.log(this.color('🏗️  ARCHITECTURE:', '1;33'));
        console.log('  • Live Streams (~?): Real-time data sources');
        console.log('  • Finite Streams (~): Batch processing');
        console.log('  • Tidal Pools (<|>): State management');
        console.log('  • Package System: Extensible operators');
        console.log('  • Cross-Platform: Mobile → Edge → Cloud');
        console.log('');
        
        console.log(this.color('🚀 USE CASES:', '1;33'));
        console.log('  • Health & Fitness Trackers');
        console.log('  • IoT Sensor Networks');
        console.log('  • Real-time Dashboards');
        console.log('  • Edge Computing Pipelines');
        console.log('  • Mobile App Backends');
        console.log('');
        
        console.log(this.color('📚 NEXT STEPS:', '90'));
        console.log('  Read SPECIFICATION.md for complete details');
        console.log('  Run .examples to see working code');
        console.log('  Try .production for advanced features');
    }

    showPackages() {
        if (this.availablePackages.length === 0) {
            console.log(this.color('📦 No packages installed. Check fluxus_packages/ directory', '90'));
            return;
        }
        
        console.log('\n' + this.color('📦 AVAILABLE PACKAGES:', '1;33'));
        this.availablePackages.forEach(pkg => {
            console.log(`  ${pkg}`);
        });
        console.log('\n' + this.color('💡 Use: FLOW package_name to import', '90'));
    }

    showHistory() {
        console.log('\n' + this.color('📜 Command History:', '1;33'));
        const recentHistory = this.history.slice(-15);
        if (recentHistory.length === 0) {
            console.log('  No commands in history');
            return;
        }
        
        recentHistory.forEach((cmd, i) => {
            const index = this.history.length - recentHistory.length + i + 1;
            console.log(`  ${index}. ${this.highlightSyntax(cmd)}`);
        });
    }

    searchAndShowHistory(term) {
        console.log('\n' + this.color(`🔍 History search for "${term}":`, '1;33'));
        const matches = this.history.filter(cmd => cmd.includes(term));
        if (matches.length > 0) {
            matches.slice(-8).forEach((cmd, i) => {
                console.log(`  ${this.history.indexOf(cmd) + 1}. ${this.highlightSyntax(cmd)}`);
            });
        } else {
            console.log('  No matching commands found');
        }
    }

    showStreamVisualization() {
        console.log('\n' + this.color('📊 STREAM TOPOLOGY', '1;33'));
        console.log(this.color('┌─ Active Data Flows ───────────────────────────┐', '90'));
        
        const pools = Object.keys(this.engine.pools);
        if (pools.length === 0) {
            console.log(this.color('│  No active streams or pools                 │', '90'));
        } else {
            pools.forEach(poolName => {
                const pool = this.engine.pools[poolName];
                const valueStr = Array.isArray(pool.value) ? 
                    `[${pool.value.slice(0, 2).join(',')}${pool.value.length > 2 ? '...' : ''}]` : 
                    String(pool.value);
                
                const updateCount = pool._updates || 0;
                const activity = updateCount > 0 ? '🟢' : '⚪';
                
                console.log(this.color(`│  ${activity} ${poolName.padEnd(12)} = ${valueStr.padEnd(15)} (${updateCount} updates) │`, '90'));
            });
        }
        console.log(this.color('└───────────────────────────────────────────────┘', '90'));
    }

    showRuntimeStats() {
        console.log('\n' + this.color('📈 RUNTIME STATISTICS', '1;33'));
        const pools = Object.keys(this.engine.pools);
        const totalUpdates = pools.reduce((sum, poolName) => 
            sum + (this.engine.pools[poolName]._updates || 0), 0);
        
        const sessionDuration = Math.round((new Date() - this.sessionStart) / 1000);
        
        console.log(this.color(`  Session: ${sessionDuration}s`, '90'));
        console.log(this.color(`  Active Pools: ${pools.length}`, '90'));
        console.log(this.color(`  Total Updates: ${totalUpdates}`, '90'));
        console.log(this.color(`  Commands Executed: ${this.history.length}`, '90'));
        console.log(this.color(`  Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, '90'));
        
        if (pools.length > 0) {
            console.log(this.color('\n  MOST ACTIVE:', '90'));
            const sortedPools = pools.sort((a, b) => 
                (this.engine.pools[b]._updates || 0) - (this.engine.pools[a]._updates || 0)
            ).slice(0, 3);
            
            sortedPools.forEach(poolName => {
                const pool = this.engine.pools[poolName];
                console.log(this.color(`    ${poolName}: ${pool._updates || 0} updates`, '90'));
            });
        }
    }

    showPools() {
        const pools = Object.keys(this.engine.pools);
        if (pools.length === 0) {
            console.log(this.color('💧 No Tidal Pools defined', '90'));
            console.log(this.color('💡 Create one: let data = <|> initial_value', '90'));
            return;
        }
        
        console.log('\n' + this.color('🏊 TIDAL POOLS:', '1;33'));
        pools.forEach(poolName => {
            const pool = this.engine.pools[poolName];
            let updateInfo = '';
            
            if (pool._updates !== undefined) {
                updateInfo = this.color(`(${pool._updates} updates)`, '90');
            } else {
                updateInfo = this.color('(active)', '90');
            }
            
            const valueDisplay = Array.isArray(pool.value) ? 
                `[${pool.value.slice(0, 5).join(', ')}${pool.value.length > 5 ? '...' : ''}]` : pool.value;
                
            console.log(`  ${this.color(poolName, '36')} = ${valueDisplay} ${updateInfo}`);
        });
    }

    showSessionSummary() {
        const duration = Math.round((new Date() - this.sessionStart) / 1000);
        console.log('\n' + this.color('📊 SESSION SUMMARY', '1;33'));
        console.log(this.color(`  Duration: ${duration} seconds`, '90'));
        console.log(this.color(`  Commands: ${this.history.length} executed`, '90'));
        console.log(this.color(`  Pools: ${Object.keys(this.engine.pools).length} active`, '90'));
    }

    // 🚀 PRODUCTION-GRADE Execution
    execute(code) {
        if (!this.inMultiLine) {
            this.history.push(code);
            if (this.history.length > 1000) this.history.shift();
        }

        try {
            let processedCode = code;
            if (!code.startsWith('~') && !code.startsWith('let') && !code.startsWith('FLOW')) {
                processedCode = `~ ${code}`;
            }

            const ast = this.parser.parse(processedCode);
            
            if (this.visualizationMode) {
                this.visualizeStream(ast, code);
            }
            
            if (this.debugMode) {
                console.log(this.color('🔍 AST Structure:', '90'));
                console.log(JSON.stringify(ast, null, 2));
            }
            
            this.streamHistory.push({
                code,
                timestamp: new Date(),
                poolsBefore: { ...this.engine.pools }
            });
            
            const originalLog = console.log;
            const outputs = [];
            
            console.log = (...args) => {
                const message = args.join(' ');
                if (message.includes('Output:') || 
                    message.includes('Updated pool') ||
                    message.includes('Result:') ||
                    message.includes('result:')) {
                    outputs.push(message);
                }
            };

            this.engine.start(ast);
            
            console.log = originalLog;
            
            const lastExecution = this.streamHistory[this.streamHistory.length - 1];
            lastExecution.poolsAfter = { ...this.engine.pools };
            lastExecution.outputs = outputs;
            
            outputs.forEach(output => {
                if (output.includes('Output:')) {
                    const value = output.replace('Output:', '').trim();
                    console.log(this.color(`➡️  ${value}`, '32'));
                } else if (output.includes('Updated pool')) {
                    console.log(this.color(`🔄 ${output}`, '36'));
                } else if (output.includes('Result:') || output.includes('result:')) {
                    const value = output.replace(/Result:|result:/, '').trim();
                    console.log(this.color(`➡️  ${value}`, '32'));
                }
            });

        } catch (error) {
            let errorMessage = error.message;
            
            if (error.line) {
                errorMessage = `Line ${error.line}: ${errorMessage}`;
            }
            
            // Enhanced error suggestions
            if (error.message.includes('Unexpected token')) {
                const suggestions = [];
                if (code.includes('{') && !code.includes('}')) {
                    suggestions.push('Add closing brace "}"');
                }
                if (code.includes('(') && !code.includes(')')) {
                    suggestions.push('Add closing parenthesis ")"');
                }
                if (code.includes('|') && code.split('|').length < 2) {
                    suggestions.push('Add an operator after "|"');
                }
                
                if (suggestions.length > 0) {
                    errorMessage += '\n💡 ' + suggestions.join(', ');
                }
            } else if (error.message.includes('not defined')) {
                const poolMatch = error.message.match(/'(\w+)'/);
                if (poolMatch) {
                    errorMessage += `\n💡 Declare it with: let ${poolMatch[1]} = <|> initial_value`;
                }
            }
            
            console.log(this.color(`❌ ${errorMessage}`, '31'));
            
            if (this.debugMode && error.line) {
                const lines = code.split('\n');
                const problemLine = lines[error.line - 1];
                if (problemLine) {
                    console.log(this.color(`   Problematic line: ${this.highlightSyntax(problemLine.trim())}`, '90'));
                }
            }
        }
    }

    visualizeStream(ast, code) {
        console.log('\n' + this.color('📊 STREAM VISUALIZATION', '1;33'));
        console.log(this.color('┌─ Pipeline Structure ──────────────────────────┐', '90'));
        
        const nodes = ast.nodes.filter(n => 
            n.type === 'STREAM_SOURCE_FINITE' || n.type === 'FUNCTION_OPERATOR'
        );
        
        if (nodes.length === 0) {
            console.log(this.color('│  No stream nodes found                     │', '90'));
        } else {
            nodes.forEach((node, index) => {
                const isSource = node.type === 'STREAM_SOURCE_FINITE';
                const nodeType = isSource ? 'SOURCE' : node.name.toUpperCase();
                const valuePreview = isSource ? 
                    (node.value?.substring(0, 20) || 'null') + (node.value?.length > 20 ? '...' : '') : 
                    (node.value || 'operation');
                    
                const connector = index < nodes.length - 1 ? '↓' : '⏹️';
                
                console.log(this.color(`│ ${connector} ${nodeType.padEnd(12)}: ${valuePreview.padEnd(25)} │`, '90'));
            });
        }
        
        console.log(this.color('└───────────────────────────────────────────────┘', '90'));
    }
}
