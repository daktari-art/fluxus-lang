// FILENAME: src/repl.js
// Fluxus Language REPL with Better Output & Pool Inspection

import readline from 'readline';
import { GraphParser } from './core/parser.js';
import { RuntimeEngine } from './core/engine.js';

export class FluxusREPL {
    constructor() {
        this.parser = new GraphParser();
        this.engine = new RuntimeEngine(); // Single engine instance for state persistence
        this.history = [];
        this.currentInput = '';
        this.inMultiLine = false;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'fluxus> ',
            historySize: 100,
            removeHistoryDuplicates: true
        });

        this.supportsColor = process.stdout.isTTY;
    }

    color(text, colorCode) {
        return this.supportsColor ? `\x1b[${colorCode}m${text}\x1b[0m` : text;
    }

    start() {
        console.log(this.color('🌊 Fluxus Language REPL v1.0.0', '1;36'));
        console.log('Type Fluxus code to execute. Type "exit" to quit.');
        console.log('Special commands: .help, .clear, .examples, .pools\n');
        
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

        // Handle pool value inspection (just typing pool name)
        if (this.isPoolInspection(input)) {
            this.inspectPool(input);
            this.rl.prompt();
            return;
        }

        if (this.inMultiLine) {
            this.currentInput += '\n' + input;
            
            if (this.isMultiLineComplete(this.currentInput)) {
                this.execute(this.currentInput);
                this.currentInput = '';
                this.inMultiLine = false;
                this.rl.setPrompt('fluxus> ');
            }
            this.rl.prompt();
            return;
        }

        if (this.shouldStartMultiLine(input)) {
            this.currentInput = input;
            this.inMultiLine = true;
            this.rl.setPrompt('... ');
            this.rl.prompt();
            return;
        }

        this.execute(input);
        this.rl.prompt();
    }

    isPoolInspection(input) {
        // Check if input is just a pool name (no operators, just alphanumeric)
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input) && 
               !['exit', 'quit', 'help'].includes(input) &&
               this.engine.pools[input] !== undefined;
    }

    inspectPool(poolName) {
        const pool = this.engine.pools[poolName];
        if (pool) {
            console.log(this.color(`🏊 ${poolName} = ${pool.value}`, '36'));
            // Safely check for history
            if (pool.history && Array.isArray(pool.history)) {
                console.log(this.color(`   History: ${pool.history.length} updates`, '90'));
            } else if (pool._updates !== undefined) {
                console.log(this.color(`   Updates: ${pool._updates}`, '90'));
            }
        } else {
            console.log(this.color(`❌ Pool '${poolName}' not found`, '31'));
        }
    }

    shouldStartMultiLine(input) {
        const openBraces = (input.match(/{/g) || []).length;
        const closeBraces = (input.match(/}/g) || []).length;
        return openBraces > closeBraces;
    }

    isMultiLineComplete(input) {
        const openBraces = (input.match(/{/g) || []).length;
        const closeBraces = (input.match(/}/g) || []).length;
        return openBraces === closeBraces;
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
                console.log('  exit       - Exit the REPL');
                console.log('\n' + this.color('💡 Pool Inspection:', '1;33'));
                console.log('  Just type a pool name to see its current value');
                break;
                
            case '.clear':
                console.clear();
                console.log(this.color('🌊 Fluxus Language REPL v1.0.0', '1;36'));
                break;
                
            case '.examples':
                console.log('\n' + this.color('💡 Example Code:', '1;33'));
                console.log('  5 | add(3) | print()');
                console.log('  "hello" | to_upper() | print()');
                console.log('  [1, 2, 3] | map {.value | multiply(2)} | reduce {+} | print()');
                console.log('  ~ 10 | multiply(4) | subtract(15) | print()');
                console.log('\n' + this.color('💡 Tidal Pool Examples:', '1;33'));
                console.log('  let count = <|> 0');
                console.log('  5 | to_pool(count)');
                console.log('  count  (inspect pool value)');
                console.log('\n' + this.color('💡 Multi-line Example:', '1;33'));
                console.log('  [1, 2, 3] | map {.value | multiply(2)');
                console.log('  | add(10)');
                console.log('  } | print()');
                break;

            case '.pools':
                this.showPools();
                break;
                
            case '.history':
                console.log('\n' + this.color('📜 Command History:', '1;33'));
                this.history.slice(-10).forEach((cmd, i) => {
                    console.log(`  ${i + 1}. ${cmd}`);
                });
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
            
            // Safely get update count from various possible properties
            if (pool.history && Array.isArray(pool.history)) {
                updateInfo = this.color(`(${pool.history.length} updates)`, '90');
            } else if (pool._updates !== undefined) {
                updateInfo = this.color(`(${pool._updates} updates)`, '90');
            } else if (pool.updateCount !== undefined) {
                updateInfo = this.color(`(${pool.updateCount} updates)`, '90');
            } else {
                updateInfo = this.color('(active)', '90');
            }
            
            console.log(`  ${poolName} = ${pool.value} ${updateInfo}`);
        });
    }

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
            
            // Capture ALL console output during execution
            const originalLog = console.log;
            const outputs = [];
            
            console.log = (...args) => {
                const message = args.join(' ');
                // Only capture meaningful output, filter out engine status
                if (message.includes('Output:') || 
                    message.includes('Updated pool') ||
                    message.includes('Result:') ||
                    message.includes('result:')) {
                    outputs.push(message);
                }
            };

            // Use the same engine instance to maintain state
            this.engine.start(ast);
            
            // Restore console.log
            console.log = originalLog;
            
            // Display captured outputs with colors
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

            // If no outputs were captured, the expression executed silently
            // This is normal for some operations

        } catch (error) {
            console.log(this.color(`❌ ${error.message}`, '31'));
        }
    }
}
