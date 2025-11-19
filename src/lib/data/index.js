// FILENAME: src/lib/data/index.js
// Data Processing Library - Production Grade

import { DataStreams } from './streams.js';
import { DataAggregators } from './aggregators.js';
import { DataTransducers } from './transducers.js';

// Unified Data Processing System
export class DataProcessor {
    constructor() {
        this.streams = new DataStreams();
        this.aggregators = new DataAggregators();
        this.transducers = new DataTransducers();
    }

    // Stream processing
    processStream(data, operations = []) {
        let result = data;
        
        for (const operation of operations) {
            const [opName, ...args] = operation;
            
            switch (opName) {
                case 'filter':
                    result = this.streams.filter(result, ...args);
                    break;
                case 'map':
                    result = this.streams.map(result, ...args);
                    break;
                case 'reduce':
                    result = this.streams.reduce(result, ...args);
                    break;
                case 'aggregate':
                    result = this.aggregators.aggregate(result, ...args);
                    break;
                case 'transform':
                    result = this.transducers.transform(result, ...args);
                    break;
                default:
                    console.warn(`Unknown stream operation: ${opName}`);
            }
        }
        
        return result;
    }

    // Batch processing
    processBatch(data, config = {}) {
        const {
            chunkSize = 100,
            parallel = false,
            operations = []
        } = config;

        if (!Array.isArray(data)) {
            return this.processStream(data, operations);
        }

        if (data.length <= chunkSize) {
            return this.processStream(data, operations);
        }

        // Process in chunks
        const chunks = [];
        for (let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.slice(i, i + chunkSize));
        }

        if (parallel) {
            // Parallel processing (simplified)
            return Promise.all(
                chunks.map(chunk => 
                    Promise.resolve(this.processStream(chunk, operations))
                )
            ).then(results => results.flat());
        } else {
            // Sequential processing
            const results = [];
            for (const chunk of chunks) {
                results.push(...this.processStream(chunk, operations));
            }
            return results;
        }
    }

    // Data aggregation
    aggregateData(data, aggregationConfig) {
        const {
            groupBy,
            operations = [],
            sortBy = null,
            limit = null
        } = aggregationConfig;

        let aggregated = this.aggregators.groupBy(data, groupBy);
        
        for (const operation of operations) {
            const [aggOp, field] = operation;
            aggregated = this.aggregators.applyAggregation(aggregated, aggOp, field);
        }

        if (sortBy) {
            aggregated = this.aggregators.sort(aggregated, sortBy);
        }

        if (limit) {
            aggregated = aggregated.slice(0, limit);
        }

        return aggregated;
    }

    // Data transformation pipeline
    createPipeline(operations) {
        return (data) => this.processStream(data, operations);
    }

    // Statistical analysis
    analyzeData(data, analysisType, options = {}) {
        switch (analysisType) {
            case 'summary':
                return this.aggregators.getSummaryStats(data);
            case 'trend':
                return this.aggregators.calculateTrend(data, options);
            case 'correlation':
                return this.aggregators.calculateCorrelation(data, options.fields);
            case 'outliers':
                return this.aggregators.detectOutliers(data, options);
            default:
                throw new Error(`Unknown analysis type: ${analysisType}`);
        }
    }
}

// Data operators for engine registration
export const DATA_OPERATORS = {
    'data.filter': (input, args) => {
        const [predicate] = args;
        const processor = new DataProcessor();
        return processor.streams.filter(input, predicate);
    },
    
    'data.map': (input, args) => {
        const [transform] = args;
        const processor = new DataProcessor();
        return processor.streams.map(input, transform);
    },
    
    'data.reduce': (input, args) => {
        const [reducer, initialValue] = args;
        const processor = new DataProcessor();
        return processor.streams.reduce(input, reducer, initialValue);
    },
    
    'data.aggregate': (input, args) => {
        const [aggregationConfig] = args;
        const processor = new DataProcessor();
        return processor.aggregateData(input, aggregationConfig);
    },
    
    'data.groupBy': (input, args) => {
        const [field] = args;
        const processor = new DataProcessor();
        return processor.aggregators.groupBy(input, field);
    },
    
    'data.sort': (input, args) => {
        const [field, descending = false] = args;
        const processor = new DataProcessor();
        return processor.aggregators.sort(input, field, descending);
    }
};

// Registration function for engine
export function registerWithEngine(engine) {
    const operators = DATA_OPERATORS;
    let count = 0;
    
    for (const [name, implementation] of Object.entries(operators)) {
        if (engine.operators && !engine.operators.has(name)) {
            engine.operators.set(name, implementation);
            count++;
        }
    }
    
    console.log(`   📊 Data system registered: ${count} operators`);
    return Object.keys(operators);
}

export { DataStreams, DataAggregators, DataTransducers };
export default DataProcessor;
