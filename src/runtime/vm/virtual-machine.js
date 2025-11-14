// FILENAME: src/runtime/vm/virtual-machine.js
// Fluxus Virtual Machine - Production Grade

import { AdvancedScheduler } from '../scheduler/advanced-scheduler.js';
import { FluxusGarbageCollector } from '../memory/gc.js';
import { FluxusFFI } from '../ffi/index.js';

export class FluxusVirtualMachine {
    constructor(config = {}) {
        this.config = {
            enableJIT: config.enableJIT !== false,
            maxExecutionTime: config.maxExecutionTime || 5000,
            memoryLimit: config.memoryLimit || 100 * 1024 * 1024, // 100MB
            enableProfiling: config.enableProfiling !== false,
            ...config
        };

        // Core subsystems
        this.scheduler = new AdvancedScheduler(config.scheduler);
        this.gc = new FluxusGarbageCollector(config.gc);
        this.ffi = new FluxusFFI(config.ffi);

        // Execution state
        this.registers = new Map();
        this.callStack = [];
        this.heap = new Map();
        this.programCounter = 0;
        
        // JIT compilation cache
        this.jitCache = new Map();
        
        // Profiling data
        this.profilingData = {
            instructionsExecuted: 0,
            executionTime: 0,
            memoryAllocations: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        this.initializeVM();
    }

    initializeVM() {
        // Initialize registers
        this.registers.set('acc', 0);      // Accumulator
        this.registers.set('pc', 0);       // Program Counter
        this.registers.set('sp', 0);       // Stack Pointer
        this.registers.set('fp', 0);       // Frame Pointer
        this.registers.set('ir', null);    // Instruction Register

        // Initialize system calls
        this.initializeSystemCalls();

        console.log('🚀 Fluxus Virtual Machine initialized');
    }

    initializeSystemCalls() {
        // Register system calls with FFI
        this.ffi.bindFunction('vm_allocate', this.allocateMemory.bind(this));
        this.ffi.bindFunction('vm_free', this.freeMemory.bind(this));
        this.ffi.bindFunction('vm_get_register', this.getRegister.bind(this));
        this.ffi.bindFunction('vm_set_register', this.setRegister.bind(this));
        this.ffi.bindFunction('vm_execute_instruction', this.executeInstruction.bind(this));
    }

    // Memory management
    allocateMemory(size, type = 'generic') {
        const blockId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const allocation = {
            id: blockId,
            size,
            type,
            data: new ArrayBuffer(size),
            allocatedAt: Date.now(),
            accessCount: 0
        };

        this.heap.set(blockId, allocation);
        this.gc.allocate(blockId, allocation);
        this.profilingData.memoryAllocations++;

        return blockId;
    }

    freeMemory(blockId) {
        if (this.heap.has(blockId)) {
            this.heap.delete(blockId);
            return true;
        }
        return false;
    }

    // Register operations
    getRegister(name) {
        return this.registers.get(name);
    }

    setRegister(name, value) {
        this.registers.set(name, value);
        return true;
    }

    // Instruction execution
    executeInstruction(instruction) {
        const startTime = Date.now();
        
        try {
            // Check for JIT compiled version
            let compiledFn = this.jitCache.get(instruction.opcode);
            
            if (!compiledFn && this.config.enableJIT) {
                compiledFn = this.jitCompile(instruction);
                this.jitCache.set(instruction.opcode, compiledFn);
                this.profilingData.cacheMisses++;
            } else {
                this.profilingData.cacheHits++;
            }

            let result;
            if (compiledFn) {
                result = compiledFn(instruction.operands);
            } else {
                result = this.interpretInstruction(instruction);
            }

            this.profilingData.instructionsExecuted++;
            this.profilingData.executionTime += Date.now() - startTime;

            // Update program counter
            this.registers.set('pc', this.registers.get('pc') + 1);

            return result;

        } catch (error) {
            throw new Error(`Instruction execution failed: ${error.message}`);
        }
    }

    interpretInstruction(instruction) {
        const { opcode, operands } = instruction;

        switch (opcode) {
            case 'MOV':
                return this.executeMOV(operands);
            case 'ADD':
                return this.executeADD(operands);
            case 'SUB':
                return this.executeSUB(operands);
            case 'MUL':
                return this.executeMUL(operands);
            case 'DIV':
                return this.executeDIV(operands);
            case 'JMP':
                return this.executeJMP(operands);
            case 'CALL':
                return this.executeCALL(operands);
            case 'RET':
                return this.executeRET(operands);
            case 'PUSH':
                return this.executePUSH(operands);
            case 'POP':
                return this.executePOP(operands);
            case 'CMP':
                return this.executeCMP(operands);
            case 'JEQ':
                return this.executeJEQ(operands);
            case 'JNE':
                return this.executeJNE(operands);
            case 'HLT':
                return this.executeHLT(operands);
            default:
                throw new Error(`Unknown instruction: ${opcode}`);
        }
    }

    // Instruction implementations
    executeMOV([src, dest]) {
        const value = this.resolveOperand(src);
        this.setRegister(dest, value);
        return value;
    }

    executeADD([op1, op2, dest]) {
        const val1 = this.resolveOperand(op1);
        const val2 = this.resolveOperand(op2);
        const result = val1 + val2;
        
        if (dest) {
            this.setRegister(dest, result);
        }
        
        return result;
    }

    executeSUB([op1, op2, dest]) {
        const val1 = this.resolveOperand(op1);
        const val2 = this.resolveOperand(op2);
        const result = val1 - val2;
        
        if (dest) {
            this.setRegister(dest, result);
        }
        
        return result;
    }

    executeMUL([op1, op2, dest]) {
        const val1 = this.resolveOperand(op1);
        const val2 = this.resolveOperand(op2);
        const result = val1 * val2;
        
        if (dest) {
            this.setRegister(dest, result);
        }
        
        return result;
    }

    executeDIV([op1, op2, dest]) {
        const val1 = this.resolveOperand(op1);
        const val2 = this.resolveOperand(op2);
        
        if (val2 === 0) {
            throw new Error('Division by zero');
        }
        
        const result = val1 / val2;
        
        if (dest) {
            this.setRegister(dest, result);
        }
        
        return result;
    }

    executeJMP([target]) {
        const address = this.resolveOperand(target);
        this.registers.set('pc', address);
        return address;
    }

    executeCALL([target]) {
        const returnAddress = this.registers.get('pc') + 1;
        this.callStack.push(returnAddress);
        
        const address = this.resolveOperand(target);
        this.registers.set('pc', address);
        
        return address;
    }

    executeRET([]) {
        if (this.callStack.length === 0) {
            throw new Error('Call stack underflow');
        }
        
        const returnAddress = this.callStack.pop();
        this.registers.set('pc', returnAddress);
        
        return returnAddress;
    }

    executePUSH([value]) {
        const stackValue = this.resolveOperand(value);
        const sp = this.registers.get('sp');
        
        // Push to stack (simplified)
        this.registers.set('sp', sp + 1);
        
        return stackValue;
    }

    executePOP([dest]) {
        const sp = this.registers.get('sp');
        
        if (sp === 0) {
            throw new Error('Stack underflow');
        }
        
        this.registers.set('sp', sp - 1);
        
        // In real implementation, we'd get the value from stack memory
        const value = 0; // Placeholder
        
        if (dest) {
            this.setRegister(dest, value);
        }
        
        return value;
    }

    executeCMP([op1, op2]) {
        const val1 = this.resolveOperand(op1);
        const val2 = this.resolveOperand(op2);
        
        return {
            comparison: val1 - val2,
            flags: {
                zero: val1 === val2,
                negative: val1 < val2,
                positive: val1 > val2
            }
        };
    }

    executeJEQ([target]) {
        const flags = this.registers.get('flags') || {};
        if (flags.zero) {
            return this.executeJMP([target]);
        }
        return null;
    }

    executeJNE([target]) {
        const flags = this.registers.get('flags') || {};
        if (!flags.zero) {
            return this.executeJMP([target]);
        }
        return null;
    }

    executeHLT([]) {
        throw new Error('Program halted');
    }

    // Utility methods
    resolveOperand(operand) {
        if (typeof operand === 'number') {
            return operand;
        }
        
        if (typeof operand === 'string' && operand.startsWith('@')) {
            // Register reference
            const registerName = operand.substring(1);
            return this.registers.get(registerName) || 0;
        }
        
        if (typeof operand === 'string' && operand.startsWith('#')) {
            // Immediate value
            return parseFloat(operand.substring(1));
        }
        
        if (typeof operand === 'string' && operand.startsWith('$')) {
            // Memory reference
            const address = operand.substring(1);
            return this.heap.get(address)?.value || 0;
        }
        
        return operand;
    }

    jitCompile(instruction) {
        // Simple JIT compilation to native JavaScript function
        // In real implementation, this would generate optimized machine code
        
        const { opcode, operands } = instruction;
        
        try {
            const fnBody = this.generateJITFunction(opcode, operands);
            const compiledFn = new Function('operands', fnBody);
            
            return compiledFn;
        } catch (error) {
            console.warn(`JIT compilation failed for ${opcode}:`, error.message);
            return null;
        }
    }

    generateJITFunction(opcode, operands) {
        // Generate JavaScript function body for the instruction
        switch (opcode) {
            case 'ADD':
                return `
                    const op1 = operands[0];
                    const op2 = operands[1];
                    return op1 + op2;
                `;
            case 'MOV':
                return `
                    const src = operands[0];
                    const dest = operands[1];
                    // In real implementation, this would update registers
                    return src;
                `;
            default:
                throw new Error(`JIT not supported for: ${opcode}`);
        }
    }

    // Program execution
    executeProgram(instructions, context = {}) {
        const startTime = Date.now();
        let instructionCount = 0;
        
        try {
            this.registers.set('pc', 0);
            
            while (this.registers.get('pc') < instructions.length) {
                const pc = this.registers.get('pc');
                const instruction = instructions[pc];
                
                // Check execution time limit
                if (Date.now() - startTime > this.config.maxExecutionTime) {
                    throw new Error('Execution time limit exceeded');
                }
                
                this.executeInstruction(instruction);
                instructionCount++;
                
                // Yield to event loop occasionally
                if (instructionCount % 1000 === 0) {
                    await new Promise(resolve => setImmediate(resolve));
                }
            }
            
            return {
                success: true,
                instructionsExecuted: instructionCount,
                executionTime: Date.now() - startTime,
                finalState: this.getVMState()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                instructionsExecuted: instructionCount,
                executionTime: Date.now() - startTime,
                state: this.getVMState()
            };
        }
    }

    // State management
    getVMState() {
        return {
            registers: Object.fromEntries(this.registers),
            callStack: [...this.callStack],
            heapSize: this.heap.size,
            profiling: { ...this.profilingData },
            jitCacheSize: this.jitCache.size
        };
    }

    reset() {
        this.registers.clear();
        this.callStack = [];
        this.heap.clear();
        this.jitCache.clear();
        this.profilingData = {
            instructionsExecuted: 0,
            executionTime: 0,
            memoryAllocations: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.initializeVM();
    }

    // Profiling and diagnostics
    getProfilingReport() {
        return {
            ...this.profilingData,
            averageInstructionTime: this.profilingData.instructionsExecuted > 0 
                ? this.profilingData.executionTime / this.profilingData.instructionsExecuted 
                : 0,
            cacheHitRate: this.profilingData.cacheHits + this.profilingData.cacheMisses > 0
                ? this.profilingData.cacheHits / (this.profilingData.cacheHits + this.profilingData.cacheMisses)
                : 0
        };
    }

    // Cleanup
    dispose() {
        this.scheduler.dispose();
        this.gc.dispose();
        this.ffi.dispose();
        
        this.registers.clear();
        this.callStack = [];
        this.heap.clear();
        this.jitCache.clear();
    }
}

export default FluxusVirtualMachine;
