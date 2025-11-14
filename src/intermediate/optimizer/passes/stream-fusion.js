// FILENAME: src/intermediate/optimizer/passes/stream-fusion.js
// Stream Fusion Optimization Pass

export class StreamFusionOptimizer {
    constructor(config = {}) {
        this.config = {
            fusionThreshold: config.fusionThreshold || 3,
            enableMapFusion: config.enableMapFusion !== false,
            enableFilterFusion: config.enableFilterFusion !== false,
            enableMapFilterFusion: config.enableMapFilterFusion !== false,
            ...config
        };
        
        this.fusionPatterns = this.initializeFusionPatterns();
        this.fusionCount = 0;
    }

    initializeFusionPatterns() {
        return {
            'MAP_MAP': this.fuseMapMap.bind(this),
            'FILTER_FILTER': this.fuseFilterFilter.bind(this),
            'MAP_FILTER': this.fuseMapFilter.bind(this),
            'FILTER_MAP': this.fuseFilterMap.bind(this)
        };
    }

    optimize(irProgram) {
        this.fusionCount = 0;
        let currentIR = { ...irProgram };
        let changed = true;
        let iterations = 0;

        while (changed && iterations < 10) {
            changed = false;
            iterations++;

            const newInstructions = [];
            let i = 0;

            while (i < currentIR.instructions.length) {
                const current = currentIR.instructions[i];
                const next = currentIR.instructions[i + 1];

                if (next && this.canFuse(current, next)) {
                    const fused = this.fuseInstructions(current, next);
                    if (fused) {
                        newInstructions.push(fused);
                        i += 2; // Skip both original instructions
                        changed = true;
                        this.fusionCount++;
                        continue;
                    }
                }

                newInstructions.push(current);
                i++;
            }

            currentIR.instructions = newInstructions;
        }

        return {
            ...currentIR,
            metadata: {
                ...currentIR.metadata,
                optimizations: {
                    streamFusion: {
                        fusionsApplied: this.fusionCount,
                        iterations
                    }
                }
            }
        };
    }

    canFuse(instr1, instr2) {
        const fusionKey = `${this.getInstructionType(instr1)}_${this.getInstructionType(instr2)}`;
        
        if (!this.fusionPatterns[fusionKey]) {
            return false;
        }

        // Check if fusion is enabled in config
        if (!this.isFusionEnabled(fusionKey)) {
            return false;
        }

        // Check if instructions operate on the same stream
        if (instr1.result !== instr2.operands[0]) {
            return false;
        }

        return true;
    }

    fuseInstructions(instr1, instr2) {
        const fusionKey = `${this.getInstructionType(instr1)}_${this.getInstructionType(instr2)}`;
        const fusionFn = this.fusionPatterns[fusionKey];
        
        if (fusionFn) {
            return fusionFn(instr1, instr2);
        }

        return null;
    }

    fuseMapMap(map1, map2) {
        if (!this.config.enableMapFusion) return null;

        // Compose the two mapping functions
        const map1Fn = this.extractFunction(map1);
        const map2Fn = this.extractFunction(map2);
        
        const composedFn = `(x) => ${this.wrapFunction(map2Fn)}(${this.wrapFunction(map1Fn)}(x))`;

        return {
            opcode: 'STREAM_MAP_ADVANCED',
            operands: [
                map1.operands[0], // Original stream
                composedFn
            ],
            result: map2.result,
            metadata: {
                ...map1.metadata,
                fused: true,
                originalInstructions: [map1.opcode, map2.opcode],
                fusionType: 'MAP_MAP'
            }
        };
    }

    fuseFilterFilter(filter1, filter2) {
        if (!this.config.enableFilterFusion) return null;

        // Combine the two filter predicates with AND
        const pred1 = this.extractFunction(filter1);
        const pred2 = this.extractFunction(filter2);
        
        const combinedPred = `(x) => ${this.wrapFunction(pred1)}(x) && ${this.wrapFunction(pred2)}(x)`;

        return {
            opcode: 'STREAM_FILTER_ADVANCED',
            operands: [
                filter1.operands[0], // Original stream
                combinedPred
            ],
            result: filter2.result,
            metadata: {
                ...filter1.metadata,
                fused: true,
                originalInstructions: [filter1.opcode, filter2.opcode],
                fusionType: 'FILTER_FILTER'
            }
        };
    }

    fuseMapFilter(mapInstr, filterInstr) {
        if (!this.config.enableMapFilterFusion) return null;

        const mapFn = this.extractFunction(mapInstr);
        const filterFn = this.extractFunction(filterInstr);

        return {
            opcode: 'STREAM_MAP_FILTER_FUSED',
            operands: [
                mapInstr.operands[0], // Original stream
                mapFn,
                filterFn
            ],
            result: filterInstr.result,
            metadata: {
                ...mapInstr.metadata,
                fused: true,
                originalInstructions: [mapInstr.opcode, filterInstr.opcode],
                fusionType: 'MAP_FILTER'
            }
        };
    }

    fuseFilterMap(filterInstr, mapInstr) {
        if (!this.config.enableFilterMapFusion) return null;

        const filterFn = this.extractFunction(filterInstr);
        const mapFn = this.extractFunction(mapInstr);

        return {
            opcode: 'STREAM_FILTER_MAP_FUSED',
            operands: [
                filterInstr.operands[0], // Original stream
                filterFn,
                mapFn
            ],
            result: mapInstr.result,
            metadata: {
                ...filterInstr.metadata,
                fused: true,
                originalInstructions: [filterInstr.opcode, mapInstr.opcode],
                fusionType: 'FILTER_MAP'
            }
        };
    }

    getInstructionType(instruction) {
        if (instruction.opcode.includes('MAP')) return 'MAP';
        if (instruction.opcode.includes('FILTER')) return 'FILTER';
        return 'OTHER';
    }

    extractFunction(instruction) {
        // Extract the function from instruction operands
        // This is simplified - real implementation would parse the function
        if (instruction.operands.length >= 2) {
            return instruction.operands[1];
        }
        return 'x => x'; // Identity function as fallback
    }

    wrapFunction(fnStr) {
        // Ensure the function string is properly wrapped
        if (typeof fnStr === 'string' && !fnStr.includes('=>')) {
            return `(${fnStr})`;
        }
        return fnStr;
    }

    isFusionEnabled(fusionType) {
        const enabledMap = {
            'MAP_MAP': this.config.enableMapFusion,
            'FILTER_FILTER': this.config.enableFilterFusion,
            'MAP_FILTER': this.config.enableMapFilterFusion,
            'FILTER_MAP': this.config.enableFilterMapFusion
        };

        return enabledMap[fusionType] || false;
    }

    getOptimizationReport() {
        return {
            type: 'stream_fusion',
            fusionsApplied: this.fusionCount,
            patterns: Object.keys(this.fusionPatterns)
        };
    }
}

export default StreamFusionOptimizer;
