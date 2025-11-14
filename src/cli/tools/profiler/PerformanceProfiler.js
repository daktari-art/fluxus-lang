// FILENAME: src/cli/tools/profiler/PerformanceProfiler.js
// Performance Profiler for Fluxus Programs

export class PerformanceProfiler {
    constructor() {
        this.metrics = {
            startTime: 0,
            endTime: 0,
            memoryUsage: {
                start: 0,
                end: 0
            },
            operations: {
                total: 0,
                byType: new Map(),
                durations: []
            },
            streams: {
                created: 0,
                active: 0,
                completed: 0
            },
            pools: {
                created: 0,
                updates: 0
            }
        };
        this.isProfiling = false;
    }

    start() {
        this.metrics.startTime = performance.now();
        this.metrics.memoryUsage.start = process.memoryUsage().heapUsed;
        this.isProfiling = true;
        
        console.log('📊 Performance profiling started');
    }

    stop() {
        if (!this.isProfiling) return;
        
        this.metrics.endTime = performance.now();
        this.metrics.memoryUsage.end = process.memoryUsage().heapUsed;
        this.isProfiling = false;
        
        console.log('📊 Performance profiling stopped');
    }

    recordOperation(type, duration = 0) {
        if (!this.isProfiling) return;
        
        this.metrics.operations.total++;
        
        const typeCount = this.metrics.operations.byType.get(type) || 0;
        this.metrics.operations.byType.set(type, typeCount + 1);
        
        if (duration > 0) {
            this.metrics.operations.durations.push({
                type,
                duration,
                timestamp: performance.now()
            });
        }
    }

    recordStreamEvent(eventType) {
        if (!this.isProfiling) return;
        
        switch (eventType) {
            case 'created':
                this.metrics.streams.created++;
                this.metrics.streams.active++;
                break;
            case 'completed':
                this.metrics.streams.completed++;
                this.metrics.streams.active--;
                break;
        }
    }

    recordPoolEvent(eventType) {
        if (!this.isProfiling) return;
        
        switch (eventType) {
            case 'created':
                this.metrics.pools.created++;
                break;
            case 'updated':
                this.metrics.pools.updates++;
                break;
        }
    }

    generateReport() {
        const executionTime = this.metrics.endTime - this.metrics.startTime;
        const memoryUsed = this.metrics.memoryUsage.end - this.metrics.memoryUsage.start;
        
        return {
            summary: {
                executionTime: `${executionTime.toFixed(2)}ms`,
                memoryUsed: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
                totalOperations: this.metrics.operations.total,
                streamsCreated: this.metrics.streams.created,
                poolsCreated: this.metrics.pools.created
            },
            operations: {
                byType: Object.fromEntries(this.metrics.operations.byType),
                averageDuration: this.calculateAverageDuration(),
                throughput: this.calculateThroughput(executionTime)
            },
            recommendations: this.generateRecommendations()
        };
    }

    calculateAverageDuration() {
        if (this.metrics.operations.durations.length === 0) return 0;
        
        const total = this.metrics.operations.durations.reduce(
            (sum, op) => sum + op.duration, 0
        );
        return total / this.metrics.operations.durations.length;
    }

    calculateThroughput(executionTime) {
        if (executionTime === 0) return 0;
        return (this.metrics.operations.total / executionTime * 1000).toFixed(2);
    }

    generateRecommendations() {
        const recommendations = [];
        const report = this.generateReport();
        
        if (report.operations.averageDuration > 10) {
            recommendations.push('⚠️  High operation duration detected. Consider optimizing complex operations.');
        }
        
        if (report.summary.streamsCreated > 100) {
            recommendations.push('⚠️  High stream creation. Consider reusing streams or using pool patterns.');
        }
        
        if (parseFloat(report.summary.memoryUsed) > 50) {
            recommendations.push('⚠️  High memory usage. Check for memory leaks in long-running streams.');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ Performance looks good! No major issues detected.');
        }
        
        return recommendations;
    }

    printReport() {
        const report = this.generateReport();
        
        console.log('\n📈 FLUXUS PERFORMANCE REPORT');
        console.log('=' .repeat(50));
        
        console.log('\n📊 SUMMARY:');
        console.log(`  Execution Time: ${report.summary.executionTime}`);
        console.log(`  Memory Used: ${report.summary.memoryUsed}`);
        console.log(`  Total Operations: ${report.summary.totalOperations}`);
        console.log(`  Streams Created: ${report.summary.streamsCreated}`);
        console.log(`  Pools Created: ${report.summary.poolsCreated}`);
        
        console.log('\n🔧 OPERATIONS:');
        console.log('  By Type:', report.operations.byType);
        console.log(`  Average Duration: ${report.operations.averageDuration.toFixed(2)}ms`);
        console.log(`  Throughput: ${report.operations.throughput} ops/sec`);
        
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
    }
}

export default PerformanceProfiler;
