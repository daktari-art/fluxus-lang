// FILENAME: src/repl.js
// Fluxus Language REPL v4.0 - Visual Debugger & Advanced Analytics

import readline from 'readline';
import { GraphParser } from './core/parser.js';
import { RuntimeEngine } from './core/engine.js';

export class FluxusREPL {
    constructor() {
        this.parser = new GraphParser();
        this.engine = new RuntimeEngine();
        this.history = [];
        this.currentInput = '';
        this.inMultiLine = false;
        this.debugMode = false;
        this.visualizationMode = false;
        
        // Enhanced: Auto-completion with categories
        this.operators = [
            'add', 'subtract', 'multiply', 'divide', 'map', 'reduce', 'filter',
            'trim', 'to_upper', 'to_lower', 'concat', 'break', 'join', 'word_count',
            'print', 'to_pool', 'combine_latest', 'split', 'debounce', 'throttle'
        ];
        
        this.keywords = ['let', 'FLOW', 'FUNC', 'TRUE_FLOW', 'FALSE_FLOW', 'RESULT'];
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'fluxus> ',
            historySize: 1000, // Increased for better history
            removeHistoryDuplicates: true,
            completer: (line) => this.autoComplete(line)
        });

        this.supportsColor = process.stdout.isTTY;
        this.streamHistory = []; // Track stream executions for visualization
    }

    // Enhanced: Advanced syntax highlighting with semantic understanding
    highlightSyntax(code) {
        if (!this.supportsColor) return code;
        
        return code
            // Stream operators
            .replace(/(^|\s)(~|\|)(?=\s|$)/g, '$1\x1b[36m$2\x1b[0m')
            // Pool operators
            .replace(/(<\|>|->)/g, '\x1b[35m$1\x1b[0m')
            // Keywords
            .replace(/\b(let|FLOW|FUNC|TRUE_FLOW|FALSE_FLOW|RESULT)\b/g, '\x1b[33m$1\x1b[0m')
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

    // Enhanced: Smart auto-completion with context awareness
    autoComplete(line) {
        const hits = [];
        const currentWord = line.split(/\s+/).pop() || '';
        
        // Context-aware completion
        if (line.includes('|') && !line.includes('print') && !line.includes('to_pool')) {
            // Complete operators after pipe
            this.operators.forEach(op => {
                if (op.startsWith(currentWord)) hits.push(op);
            });
        } else if (line.includes('let') && line.includes('=')) {
            // Complete operators in assignment context
            this.operators.forEach(op => {
                if (op.startsWith(currentWord)) hits.push(op);
            });
        } else {
            // Complete everything
            this.operators.forEach(op => {
                if (op.startsWith(currentWord)) hits.push(op);
            });
            
            this.keywords.forEach(kw => {
                if (kw.startsWith(currentWord)) hits.push(kw);
            });
        }
        
        // Complete pool names
        Object.keys(this.engine.pools).forEach(pool => {
            if (pool.startsWith(currentWord)) hits.push(pool);
        });
        
        return [hits, currentWord];
    }

    start() {
        console.log(this.color('🌊 Fluxus Language REPL v4.0', '1;36'));
        console.log('Type Fluxus code to execute. Type "exit" to quit.');
        console.log('Special commands: .help, .clear, .examples, .pools, .debug, .viz, .history\n');
        
        this.rl.prompt();

        this.rl.on('line', (line) => {
            this.handleInput(line);
        });

        this.rl.on('close', () => {
            console.log('\n👋 Goodbye!');
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

        // Enhanced: Command history search
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

        // Handle pool value inspection
        if (this.isPoolInspection(input)) {
            this.inspectPool(input);
            this.rl.prompt();
            return;
        }

        // Multi-line handling
        if (this.inMultiLine) {
            this.currentInput += ' ' + input;
            
            if (this.isMultiLineComplete(this.currentInput)) {
                const highlighted = this.highlightSyntax(this.currentInput);
                console.log(this.color(`🔍 Executing: ${highlighted}`, '90'));
                this.execute(this.currentInput);
                this.currentInput = '';
                this.inMultiLine = false;
                this.rl.setPrompt('fluxus> ');
            } else {
                this.rl.setPrompt('... ');
            }
            this.rl.prompt();
            return;
        }

        // Check if this line needs continuation
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

    // Enhanced: Command history search
    searchHistory(term) {
        for (let i = this.history.length - 1; i >= 0; i--) {
            if (this.history[i].includes(term)) {
                return this.history[i];
            }
        }
        return null;
    }

    isPoolInspection(input) {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input) && 
               !['exit', 'quit', 'help'].includes(input) &&
               this.engine.pools[input] !== undefined;
    }

    // Enhanced: Advanced pool inspection with analytics
    inspectPool(poolName) {
        const pool = this.engine.pools[poolName];
        if (pool) {
            console.log(this.color(`🏊 ${poolName} = ${pool.value}`, '36'));
            
            // Enhanced analytics
            const valueType = Array.isArray(pool.value) ? 'Array' : typeof pool.value;
            console.log(this.color(`   Type: ${valueType}`, '90'));
            
            if (Array.isArray(pool.value)) {
                console.log(this.color(`   Length: ${pool.value.length}`, '90'));
                console.log(this.color(`   Sample: [${pool.value.slice(0, 3).join(', ')}${pool.value.length > 3 ? '...' : ''}]`, '90'));
            }
            
            if (pool.history && Array.isArray(pool.history)) {
                console.log(this.color(`   History: ${pool.history.length} updates`, '90'));
                // Show value trends
                if (pool.history.length > 1) {
                    const first = pool.history[0];
                    const last = pool.history[pool.history.length - 1];
                    if (typeof first === 'number' && typeof last === 'number') {
                        const change = last - first;
                        const trend = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
                        console.log(this.color(`   Trend: ${trend} ${change > 0 ? '+' : ''}${change}`, '90'));
                    }
                }
            }
            
            if (pool._updates !== undefined) {
                console.log(this.color(`   Total Updates: ${pool._updates}`, '90'));
            }
        } else {
            console.log(this.color(`❌ Pool '${poolName}' not found`, '31'));
            // Enhanced: Suggest similar pool names
            const similar = Object.keys(this.engine.pools).filter(p => 
                p.includes(poolName) || poolName.includes(p)
            );
            if (similar.length > 0) {
                console.log(this.color(`💡 Did you mean: ${similar.join(', ')}?`, '90'));
            }
        }
    }

    needsContinuation(input) {
        const delimiters = [
            { open: '{', close: '}' },
            { open: '(', close: ')' },
            { open: '[', close: ']' }
        ];
        
        for (const { open, close } of delimiters) {
            const openCount = (input.match(new RegExp(open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            const closeCount = (input.match(new RegExp(close.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (openCount > closeCount) return true;
        }
        
        if (input.endsWith('|') && !input.includes('| print()') && !input.includes('| to_pool(')) {
            return true;
        }
        
        return false;
    }

    isMultiLineComplete(input) {
        const delimiters = [
            { open: '{', close: '}' },
            { open: '(', close: ')' },
            { open: '[', close: ']' }
        ];
        
        for (const { open, close } of delimiters) {
            const openCount = (input.match(new RegExp(open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            const closeCount = (input.match(new RegExp(close.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (openCount !== closeCount) return false;
        }
        
        return true;
    }

    handleCommand(cmd) {
        const [command, arg] = cmd.split(' ');
        
        switch (command) {
            case '.help':
                console.log('\n' + this.color('📖 REPL Commands:', '1;33'));
                console.log('  .help      - Show this help');
                console.log('  .clear     - Clear the screen');
                console.log('  .examples  - Show example code');
                console.log('  .pools     - Show all Tidal Pools');
                console.log('  .history   - Show/search command history');
                console.log('  .debug     - Toggle debug mode');
                console.log('  .viz       - Toggle stream visualization');
                console.log('  .operators - List available operators');
                console.log('  .stats     - Show runtime statistics');
                console.log('  exit       - Exit the REPL');
                console.log('\n' + this.color('💡 Advanced Features:', '1;33'));
                console.log('  !!         - Repeat last command');
                console.log('  !text      - Repeat last command containing "text"');
                console.log('  TAB        - Auto-completion');
                console.log('  Multi-line - Automatic for complex expressions');
                break;
                
            case '.clear':
                console.clear();
                console.log(this.color('🌊 Fluxus Language REPL v4.0', '1;36'));
                break;
                
            case '.examples':
                console.log('\n' + this.color('💡 Example Code:', '1;33'));
                console.log(this.highlightSyntax('  5 | add(3) | print()'));
                console.log(this.highlightSyntax('  "hello" | to_upper() | print()'));
                console.log(this.highlightSyntax('  [1, 2, 3] | map {.value | multiply(2)} | reduce {+} | print()'));
                console.log(this.highlightSyntax('  ~ 10 | multiply(4) | subtract(15) | print()'));
                console.log('\n' + this.color('💡 Tidal Pool Examples:', '1;33'));
                console.log(this.highlightSyntax('  let count = <|> 0'));
                console.log(this.highlightSyntax('  5 | to_pool(count)'));
                console.log(this.highlightSyntax('  count  (inspect pool value)'));
                console.log('\n' + this.color('💡 Multi-line Example:', '1;33'));
                console.log(this.highlightSyntax('  [1, 2, 3] | map {.value | multiply(2)'));
                console.log(this.highlightSyntax('  | add(10)'));
                console.log(this.highlightSyntax('  } | print()'));
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
                
            case '.operators':
                console.log('\n' + this.color('🔧 Available Operators:', '1;33'));
                console.log('  ' + this.operators.join(', '));
                break;
                
            case '.stats':
                this.showRuntimeStats();
                break;
                
            default:
                console.log(this.color(`❌ Unknown command: ${cmd}. Type .help for available commands.`, '31'));
        }
    }

    // Enhanced: Command history with search
    showHistory() {
        console.log('\n' + this.color('📜 Command History:', '1;33'));
        const recentHistory = this.history.slice(-20);
        recentHistory.forEach((cmd, i) => {
            const index = this.history.length - recentHistory.length + i + 1;
            console.log(`  ${index}. ${this.highlightSyntax(cmd)}`);
        });
    }

    searchAndShowHistory(term) {
        console.log('\n' + this.color(`🔍 History search for "${term}":`, '1;33'));
        const matches = this.history.filter(cmd => cmd.includes(term));
        if (matches.length > 0) {
            matches.slice(-10).forEach((cmd, i) => {
                console.log(`  ${this.history.indexOf(cmd) + 1}. ${this.highlightSyntax(cmd)}`);
            });
        } else {
            console.log('  No matching commands found');
        }
    }

    // Enhanced: Stream visualization
    showStreamVisualization() {
        console.log('\n' + this.color('📊 Stream Visualization', '1;33'));
        console.log(this.color('┌─ Fluxus Stream Flow ──────────────────────────┐', '90'));
        
        const pools = Object.keys(this.engine.pools);
        if (pools.length === 0) {
            console.log(this.color('│  No active streams or pools                 │', '90'));
        } else {
            pools.forEach(poolName => {
                const pool = this.engine.pools[poolName];
                const valueStr = Array.isArray(pool.value) ? 
                    `[${pool.value.slice(0, 2).join(',')}${pool.value.length > 2 ? '...' : ''}]` : 
                    String(pool.value);
                
                console.log(this.color(`│  ${poolName.padEnd(12)} = ${valueStr.padEnd(15)} (${pool._updates || 0} updates) │`, '90'));
            });
        }
        console.log(this.color('└───────────────────────────────────────────────┘', '90'));
    }

    // Enhanced: Runtime statistics
    showRuntimeStats() {
        console.log('\n' + this.color('📈 Runtime Statistics', '1;33'));
        const pools = Object.keys(this.engine.pools);
        const totalUpdates = pools.reduce((sum, poolName) => 
            sum + (this.engine.pools[poolName]._updates || 0), 0);
        
        console.log(this.color(`  Active Pools: ${pools.length}`, '90'));
        console.log(this.color(`  Total Updates: ${totalUpdates}`, '90'));
        console.log(this.color(`  Command History: ${this.history.length} entries`, '90'));
        console.log(this.color(`  Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, '90'));
        
        // Show most active pools
        if (pools.length > 0) {
            console.log(this.color('\n  Most Active Pools:', '90'));
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
            return;
        }
        
        console.log('\n' + this.color('🏊 Tidal Pools:', '1;33'));
        pools.forEach(poolName => {
            const pool = this.engine.pools[poolName];
            let updateInfo = '';
            
            if (pool.history && Array.isArray(pool.history)) {
                updateInfo = this.color(`(${pool.history.length} updates)`, '90');
            } else if (pool._updates !== undefined) {
                updateInfo = this.color(`(${pool._updates} updates)`, '90');
            } else if (pool.updateCount !== undefined) {
                updateInfo = this.color(`(${pool.updateCount} updates)`, '90');
            } else {
                updateInfo = this.color('(active)', '90');
            }
            
            const valueDisplay = Array.isArray(pool.value) ? 
                `[${pool.value.join(', ')}]` : pool.value;
                
            console.log(`  ${this.color(poolName, '36')} = ${valueDisplay} ${updateInfo}`);
        });
    }

    // Enhanced: Advanced execution with visualization
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
            
            // Enhanced: Stream visualization
            if (this.visualizationMode) {
                this.visualizeStream(ast, code);
            }
            
            // Enhanced: Debug mode shows AST
            if (this.debugMode) {
                console.log(this.color('🔍 AST Structure:', '90'));
                console.log(JSON.stringify(ast, null, 2));
            }
            
            // Track stream execution for analytics
            this.streamHistory.push({
                code,
                timestamp: new Date(),
                poolsBefore: { ...this.engine.pools }
            });
            
            // Capture console output during execution
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
            
            // Restore console.log
            console.log = originalLog;
            
            // Enhanced: Update stream history with results
            const lastExecution = this.streamHistory[this.streamHistory.length - 1];
            lastExecution.poolsAfter = { ...this.engine.pools };
            lastExecution.outputs = outputs;
            
            // Display captured outputs
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
            // Enhanced: Advanced error recovery with suggestions
            let errorMessage = error.message;
            
            if (error.line) {
                errorMessage = `Line ${error.line}: ${errorMessage}`;
            }
            
            // Enhanced: Context-aware error suggestions
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
            } else if (error.message.includes('Division by zero')) {
                errorMessage += '\n💡 Add a filter: | filter {.value != 0} | divide(...)';
            } else if (error.message.includes('expects an Array')) {
                errorMessage += '\n💡 Use array literal: [1, 2, 3] or convert with .split()';
            }
            
            console.log(this.color(`❌ ${errorMessage}`, '31'));
            
            // Enhanced: Show the problematic code snippet with context
            if (this.debugMode && error.line) {
                const lines = code.split('\n');
                const problemLine = lines[error.line - 1];
                if (problemLine) {
                    console.log(this.color(`   Problematic line: ${this.highlightSyntax(problemLine.trim())}`, '90'));
                }
            }
        }
    }

    // Enhanced: Stream visualization
    visualizeStream(ast, code) {
        console.log('\n' + this.color('📊 Stream Flow Visualization', '1;33'));
        console.log(this.color('┌─ Pipeline Structure ──────────────────────────┐', '90'));
        
        const nodes = ast.nodes.filter(n => 
            n.type === 'STREAM_SOURCE_FINITE' || n.type === 'FUNCTION_OPERATOR'
        );
        
        nodes.forEach((node, index) => {
            const isSource = node.type === 'STREAM_SOURCE_FINITE';
            const nodeType = isSource ? 'SOURCE' : node.name.toUpperCase();
            const valuePreview = isSource ? 
                node.value.substring(0, 20) + (node.value.length > 20 ? '...' : '') : 
                node.value;
                
            const connector = index < nodes.length - 1 ? '↓' : '⏹️';
            
            console.log(this.color(`│ ${connector} ${nodeType.padEnd(12)}: ${valuePreview.padEnd(25)} │`, '90'));
        });
        
        console.log(this.color('└───────────────────────────────────────────────┘', '90'));
    }
}
