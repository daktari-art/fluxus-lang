// FILENAME: src/repl.js
// Fluxus Language REPL v2.0 - Enhanced with Syntax Highlighting, Error Recovery & Auto-completion

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
        
        // Enhanced: Auto-completion candidates
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
            historySize: 100,
            removeHistoryDuplicates: true,
            completer: (line) => this.autoComplete(line)
        });

        this.supportsColor = process.stdout.isTTY;
    }

    // Enhanced: Syntax highlighting
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
            .replace(/(#.*$)/gm, '\x1b[90m$1\x1b[0m');
    }

    color(text, colorCode) {
        return this.supportsColor ? `\x1b[${colorCode}m${text}\x1b[0m` : text;
    }

    // Enhanced: Auto-completion
    autoComplete(line) {
        const hits = [];
        const currentWord = line.split(/\s+/).pop() || '';
        
        // Complete operators
        this.operators.forEach(op => {
            if (op.startsWith(currentWord)) hits.push(op);
        });
        
        // Complete keywords
        this.keywords.forEach(kw => {
            if (kw.startsWith(currentWord)) hits.push(kw);
        });
        
        // Complete pool names
        Object.keys(this.engine.pools).forEach(pool => {
            if (pool.startsWith(currentWord)) hits.push(pool);
        });
        
        return [hits, currentWord];
    }

    start() {
        console.log(this.color('🌊 Fluxus Language REPL v2.0', '1;36'));
        console.log('Type Fluxus code to execute. Type "exit" to quit.');
        console.log('Special commands: .help, .clear, .examples, .pools, .debug\n');
        
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

    isPoolInspection(input) {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input) && 
               !['exit', 'quit', 'help'].includes(input) &&
               this.engine.pools[input] !== undefined;
    }

    inspectPool(poolName) {
        const pool = this.engine.pools[poolName];
        if (pool) {
            console.log(this.color(`🏊 ${poolName} = ${pool.value}`, '36'));
            if (pool.history && Array.isArray(pool.history)) {
                console.log(this.color(`   History: ${pool.history.length} updates`, '90'));
            } else if (pool._updates !== undefined) {
                console.log(this.color(`   Updates: ${pool._updates}`, '90'));
            }
            
            // Enhanced: Show pool type and structure
            const valueType = Array.isArray(pool.value) ? 'Array' : typeof pool.value;
            console.log(this.color(`   Type: ${valueType}`, '90'));
            
            if (Array.isArray(pool.value)) {
                console.log(this.color(`   Length: ${pool.value.length}`, '90'));
            }
        } else {
            console.log(this.color(`❌ Pool '${poolName}' not found`, '31'));
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
        switch (cmd) {
            case '.help':
                console.log('\n' + this.color('📖 REPL Commands:', '1;33'));
                console.log('  .help      - Show this help');
                console.log('  .clear     - Clear the screen');
                console.log('  .examples  - Show example code');
                console.log('  .pools     - Show all Tidal Pools');
                console.log('  .history   - Show command history');
                console.log('  .debug     - Toggle debug mode');
                console.log('  .operators - List available operators');
                console.log('  exit       - Exit the REPL');
                console.log('\n' + this.color('💡 Tips:', '1;33'));
                console.log('  - Press TAB for auto-completion');
                console.log('  - Type pool names to inspect values');
                console.log('  - Use multi-line for complex expressions');
                break;
                
            case '.clear':
                console.clear();
                console.log(this.color('🌊 Fluxus Language REPL v2.0', '1;36'));
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
                console.log('\n' + this.color('📜 Command History:', '1;33'));
                this.history.slice(-10).forEach((cmd, i) => {
                    console.log(`  ${i + 1}. ${this.highlightSyntax(cmd)}`);
                });
                break;
                
            case '.debug':
                this.debugMode = !this.debugMode;
                console.log(this.color(`🔧 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`, this.debugMode ? '33' : '90'));
                break;
                
            case '.operators':
                console.log('\n' + this.color('🔧 Available Operators:', '1;33'));
                console.log('  ' + this.operators.join(', '));
                break;
                
            default:
                console.log(this.color(`❌ Unknown command: ${cmd}. Type .help for available commands.`, '31'));
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

    // Enhanced: Better error handling with line numbers
    execute(code) {
        if (!this.inMultiLine) {
            this.history.push(code);
            if (this.history.length > 100) this.history.shift();
        }

        try {
            let processedCode = code;
            if (!code.startsWith('~') && !code.startsWith('let') && !code.startsWith('FLOW')) {
                processedCode = `~ ${code}`;
            }

            const ast = this.parser.parse(processedCode);
            
            // Enhanced: Debug mode shows AST
            if (this.debugMode) {
                console.log(this.color('🔍 AST Structure:', '90'));
                console.log(JSON.stringify(ast, null, 2));
            }
            
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
            // Enhanced: Better error messages
            let errorMessage = error.message;
            
            // Add line number context if available
            if (error.line) {
                errorMessage = `Line ${error.line}: ${errorMessage}`;
            }
            
            // Enhanced: Suggest fixes for common errors
            if (error.message.includes('Unexpected token')) {
                errorMessage += '\n💡 Check for missing operators or unbalanced brackets';
            } else if (error.message.includes('not defined')) {
                errorMessage += '\n💡 Make sure pools are declared with "let name = <|> value"';
            } else if (error.message.includes('Division by zero')) {
                errorMessage += '\n💡 Add a filter to prevent zero values before division';
            }
            
            console.log(this.color(`❌ ${errorMessage}`, '31'));
            
            // Enhanced: Show the problematic code snippet in debug mode
            if (this.debugMode && error.line) {
                const lines = code.split('\n');
                const problemLine = lines[error.line - 1];
                if (problemLine) {
                    console.log(this.color(`   Problematic line: ${problemLine.trim()}`, '90'));
                }
            }
        }
    }
}
