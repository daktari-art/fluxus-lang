// FILENAME: src/cli/tools/debugger/DebuggerCLI.js
// Debugger Command Line Interface

import { DebugSession } from './DebugSession.js';

export class DebuggerCLI {
    constructor(session) {
        this.session = session;
        this.commands = new Map();
        this.setupCommands();
    }

    setupCommands() {
        this.commands.set('break', this.setBreakpoint.bind(this));
        this.commands.set('watch', this.setWatch.bind(this));
        this.commands.set('step', this.stepOver.bind(this));
        this.commands.set('continue', this.continue.bind(this));
        this.commands.set('variables', this.showVariables.bind(this));
        this.commands.set('callstack', this.showCallStack.bind(this));
        this.commands.set('help', this.showHelp.bind(this));
        this.commands.set('quit', this.quit.bind(this));
    }

    async start() {
        console.log('🐛 Fluxus Debugger Started');
        console.log('Type "help" for available commands\n');

        const readline = (await import('readline')).createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '(fluxus-debug) '
        });

        readline.prompt();

        readline.on('line', async (line) => {
            const input = line.trim();
            const [command, ...args] = input.split(' ');

            if (this.commands.has(command)) {
                await this.commands.get(command)(args, readline);
            } else if (command) {
                console.log(`Unknown command: ${command}. Type "help" for available commands.`);
            }

            if (command !== 'quit') {
                readline.prompt();
            }
        });

        readline.on('close', () => {
            console.log('👋 Debugger session ended');
        });
    }

    setBreakpoint(args) {
        if (args.length === 0) {
            console.log('Usage: break <line-number>');
            return;
        }
        const lineNumber = parseInt(args[0]);
        this.session.addBreakpoint(lineNumber);
    }

    setWatch(args) {
        if (args.length === 0) {
            console.log('Usage: watch <expression>');
            return;
        }
        const expression = args.join(' ');
        this.session.addWatchExpression(expression);
    }

    stepOver() {
        this.session.stepOver();
        this.showCurrentState();
    }

    continue() {
        this.session.resume();
        console.log('▶️  Program continued');
    }

    showVariables() {
        const variables = this.session.getVariables();
        console.log('\n📊 Variables:');
        console.log('Globals:', variables.globals);
        console.log('Locals:', variables.locals);
    }

    showCallStack() {
        const callStack = this.session.getCallStack();
        console.log('\n📞 Call Stack:');
        callStack.forEach((frame, index) => {
            console.log(`  ${index + 1}. ${frame.function} at ${frame.file}:${frame.line}`);
        });
    }

    showCurrentState() {
        console.log(`\n🔄 Current State - Step ${this.session.currentStep}`);
        this.showVariables();
        this.showCallStack();
    }

    showHelp() {
        console.log(`
🐛 Fluxus Debugger Commands:

  break <line>     Set breakpoint at line number
  watch <expr>     Watch expression value
  step             Step over next operation
  continue         Continue program execution
  variables        Show current variables
  callstack        Show call stack
  help             Show this help message
  quit             Exit debugger

Examples:
  break 15         Set breakpoint at line 15
  watch $counter   Watch variable 'counter'
  step             Step to next operation
        `);
    }

    quit(readline) {
        console.log('👋 Ending debug session');
        readline.close();
    }
}

export default DebuggerCLI;
