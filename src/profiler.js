// FILENAME: src/profiler.js
// Fluxus Performance Profiler

export class FluxusProfiler {
    constructor(engine) {
        this.engine = engine;
        this.executionTimes = new Map();
        this.poolUpdateTimes = new Map();
        this.streamStats = new Map();
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
        this.instrumentEngine();
        console.log('⚡ Performance profiler enabled');
    }

    disable() {
        this.enabled = false;
        console.log('⚡ Performance profiler disabled');
    }

    instrumentEngine() {
        const originalRunPipeline = this.engine.runPipeline.bind(this.engine);
        const originalUpdatePool = this.engine.updatePool.bind(this.engine);

        this.engine.runPipeline = (startNodeId, initialData) => {
            const startTime = performance.now();
            const result = originalRunPipeline(startNodeId, initialData);
            const endTime = performance.now();
            
            if (this.enabled) {
                this.recordExecutionTime(startNodeId, endTime - startTime);
            }
            
            return result;
        };

        this.engine.updatePool = (poolName, newValue) => {
            const startTime = performance.now();
            originalUpdatePool(poolName, newValue);
            const endTime = performance.now();
            
            if (this.enabled) {
                this.recordPoolUpdate(poolName, endTime - startTime);
            }
        };
    }

    recordExecutionTime(nodeId, duration) {
        if (!this.executionTimes.has(nodeId)) {
            this.executionTimes.set(nodeId, []);
        }
        this.executionTimes.get(nodeId).push(duration);
        
        // Keep only last 100 measurements
        const times = this.executionTimes.get(nodeId);
        if (times.length > 100) {
            times.shift();
        }
    }

    recordPoolUpdate(poolName, duration) {
        if (!this.poolUpdateTimes.has(poolName)) {
            this.poolUpdateTimes.set(poolName, []);
        }
        this.poolUpdateTimes.get(poolName).push(duration);
    }

    getStats() {
        const stats = {
            streams: {},
            pools: {},
            summary: {
                totalStreamExecutions: 0,
                totalPoolUpdates: 0,
                avgStreamTime: 0,
                avgPoolUpdateTime: 0
            }
        };

        // Stream execution stats
        let totalStreamTime = 0;
        let totalStreamExecutions = 0;
        
        this.executionTimes.forEach((times, nodeId) => {
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            
            stats.streams[nodeId] = {
                executions: times.length,
                avgTime: Math.round(avgTime * 100) / 100,
                maxTime: Math.round(maxTime * 100) / 100,
                recentTimes: times.slice(-5)
            };
            
            totalStreamTime += avgTime * times.length;
            totalStreamExecutions += times.length;
        });

        // Pool update stats
        let totalPoolTime = 0;
        let totalPoolUpdates = 0;
        
        this.poolUpdateTimes.forEach((times, poolName) => {
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            
            stats.pools[poolName] = {
                updates: times.length,
                avgTime: Math.round(avgTime * 100) / 100,
                recentTimes: times.slice(-5)
            };
            
            totalPoolTime += avgTime * times.length;
            totalPoolUpdates += times.length;
        });

        // Summary stats
        stats.summary.totalStreamExecutions = totalStreamExecutions;
        stats.summary.totalPoolUpdates = totalPoolUpdates;
        stats.summary.avgStreamTime = totalStreamExecutions > 0 ? 
            Math.round((totalStreamTime / totalStreamExecutions) * 100) / 100 : 0;
        stats.summary.avgPoolUpdateTime = totalPoolUpdates > 0 ? 
            Math.round((totalPoolTime / totalPoolUpdates) * 100) / 100 : 0;

        return stats;
    }

    generateReport() {
        const stats = this.getStats();
        
        console.log('\n⚡ Fluxus Performance Report');
        console.log('=' .repeat(50));
        
        console.log('\n📊 Summary:');
        console.log(`  Stream Executions: ${stats.summary.totalStreamExecutions}`);
        console.log(`  Pool Updates: ${stats.summary.totalPoolUpdates}`);
        console.log(`  Avg Stream Time: ${stats.summary.avgStreamTime}ms`);
        console.log(`  Avg Pool Update: ${stats.summary.avgPoolUpdateTime}ms`);

        console.log('\n🔧 Stream Performance:');
        Object.entries(stats.streams).forEach(([nodeId, data]) => {
            console.log(`  ${nodeId}: ${data.executions} execs, avg ${data.avgTime}ms`);
        });

        console.log('\n🏊 Pool Performance:');
        Object.entries(stats.pools).forEach(([poolName, data]) => {
            console.log(`  ${poolName}: ${data.updates} updates, avg ${data.avgTime}ms`);
        });

        // Performance recommendations
        console.log('\n💡 Recommendations:');
        if (stats.summary.avgStreamTime > 10) {
            console.log('  ⚠️  Streams are slow. Consider optimizing complex operations');
        }
        if (stats.summary.avgPoolUpdateTime > 5) {
            console.log('  ⚠️  Pool updates are slow. Check for expensive subscriptions');
        }

        return stats;
    }

    clear() {
        this.executionTimes.clear();
        this.poolUpdateTimes.clear();
        console.log('🧹 Performance data cleared');
    }
}
