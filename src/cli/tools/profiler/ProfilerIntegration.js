// FILENAME: src/cli/tools/profiler/ProfilerIntegration.js
// Profiler Integration with Fluxus Runtime

import { PerformanceProfiler } from './PerformanceProfiler.js';

export class ProfilerIntegration {
    constructor(runtimeEngine) {
        this.engine = runtimeEngine;
        this.profiler = new PerformanceProfiler();
        this.setupHooks();
    }

    setupHooks() {
        // Hook into engine events for profiling
        const originalStart = this.engine.start.bind(this.engine);
        
        this.engine.start = async (compiledProgram) => {
            this.profiler.start();
            await originalStart(compiledProgram);
            this.profiler.stop();
            this.profiler.printReport();
        };

        // Monitor stream operations
        this.engine.onStreamCreated = (stream) => {
            this.profiler.recordStreamEvent('created');
        };

        this.engine.onStreamCompleted = (stream) => {
            this.profiler.recordStreamEvent('completed');
        };

        // Monitor pool operations
        this.engine.onPoolCreated = (pool) => {
            this.profiler.recordPoolEvent('created');
        };

        this.engine.onPoolUpdated = (pool) => {
            this.profiler.recordPoolEvent('updated');
        };
    }

    startProfiling() {
        this.profiler.start();
    }

    stopProfiling() {
        this.profiler.stop();
    }

    getProfiler() {
        return this.profiler;
    }
}

export default ProfilerIntegration;
