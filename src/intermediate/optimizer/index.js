// FILENAME: src/intermediate/optimizer/index.js
// Optimizer Index and Manager

import { ConstantFoldingOptimizer } from './passes/constant-folding.js';
import { DeadCodeEliminator } from './passes/dead-code.js';
import { StreamFusionOptimizer } from './passes/stream-fusion.js';

export class OptimizerManager {
    constructor(config = {}) {
        this.config = {
            optimizationLevel: config.optimizationLevel || 1,
            enableAll: config.enableAll !== false,
            ...config
        };

        this.optimizers = this.initializeOptimizers();
        this.optimizationHistory = [];
    }

    initializeOptimizers() {
        const optimizers = [];

        // Level 1 optimizations (always safe)
        if (this.config.optimizationLevel >= 1) {
            optimizers.push(new ConstantFoldingOptimizer(this.config));
            optimizers.push(new DeadCodeEliminator(this.config));
        }

        // Level 2 optimizations (more aggressive)
        if (this.config.optimizationLevel >= 2) {
            optimizers.push(new StreamFusionOptimizer(this.config));
        }

        return optimizers;
    }

    optimize(irProgram) {
        let optimizedIR = { ...irProgram };
        this.optimizationHistory = [];

        for (const optimizer of this.optimizers) {
            const startTime = Date.now();
            
            try {
                const previousIR = optimizedIR;
                optimizedIR = optimizer.optimize(optimizedIR);
                
                this.optimizationHistory.push({
                    optimizer: optimizer.constructor.name,
                    duration: Date.now() - startTime,
                    instructionCount: optimizedIR.instructions.length,
                    changes: this.calculateChanges(previousIR, optimizedIR)
                });

            } catch (error) {
                console.warn(`Optimizer ${optimizer.constructor.name} failed:`, error.message);
                // Continue with next optimizer
            }
        }

        // Add optimization summary to metadata
        optimizedIR.metadata = {
            ...optimizedIR.metadata,
            optimization: {
                level: this.config.optimizationLevel,
                history: this.optimizationHistory,
                finalInstructionCount: optimizedIR.instructions.length
            }
        };

        return optimizedIR;
    }

    calculateChanges(previousIR, currentIR) {
        return {
            instructionsRemoved: previousIR.instructions.length - currentIR.instructions.length,
            percentage: ((previousIR.instructions.length - currentIR.instructions.length) / previousIR.instructions.length * 100).toFixed(2)
        };
    }

    getOptimizationReport() {
        return {
            config: this.config,
            optimizers: this.optimizers.map(opt => opt.constructor.name),
            history: this.optimizationHistory,
            totalOptimizations: this.optimizationHistory.length
        };
    }

    setOptimizationLevel(level) {
        this.config.optimizationLevel = level;
        this.optimizers = this.initializeOptimizers();
    }

    addOptimizer(optimizer) {
        this.optimizers.push(optimizer);
    }
}

// Convenience function
export function optimizeIR(irProgram, config = {}) {
    const optimizer = new OptimizerManager(config);
    return optimizer.optimize(irProgram);
}

export default OptimizerManager;
