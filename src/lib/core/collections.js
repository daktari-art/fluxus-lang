// FILENAME: src/lib/core/collections.js
// Fluxus Enterprise Collections Library v4.0 - PRODUCTION GRADE

import { performance } from 'perf_hooks';

/**
 * ENTERPRISE COLLECTIONS OPERATORS
 * 
 * Fluxus-Specific Features:
 * - Stream-aware collection operations
 * - Memory-efficient data structures
 * - Reactive collection updates
 * - Lazy evaluation for large datasets
 * - Mobile-optimized algorithms
 */

export const FLUXUS_COLLECTIONS_OPERATORS = {
    // ==================== BASIC COLLECTION OPERATIONS ====================
    
    'map': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const startTime = performance.now();
            
            try {
                const transformFn = this.resolveFunction(args[0], context);
                let result;
                
                if (Array.isArray(input)) {
                    // Optimized array mapping
                    result = this.optimizedMap(input, transformFn);
                } else if (input && typeof input === 'object') {
                    // Object mapping
                    result = this.mapObject(input, transformFn);
                } else {
                    // Single value mapping
                    result = transformFn(input);
                }
                
                this.recordPerformance('map', performance.now() - startTime, 
                                    Array.isArray(input) ? input.length : 1);
                return result;
                
            } catch (error) {
                throw new Error(`Map operation failed: ${error.message}`);
            }
        },
        metadata: {
            name: 'map',
            category: 'transformation',
            complexity: 'O(n)',
            streamSafe: true,
            memoryEfficient: true,
            preservesStructure: true
        }
    },

    'filter': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const startTime = performance.now();
            
            try {
                const predicateFn = this.resolveFunction(args[0], context);
                let result;
                
                if (Array.isArray(input)) {
                    result = this.optimizedFilter(input, predicateFn);
                } else if (input && typeof input === 'object') {
                    result = this.filterObject(input, predicateFn);
                } else {
                    result = predicateFn(input) ? input : null;
                }
                
                this.recordPerformance('filter', performance.now() - startTime,
                                    Array.isArray(input) ? input.length : 1);
                return result;
                
            } catch (error) {
                throw new Error(`Filter operation failed: ${error.message}`);
            }
        },
        metadata: {
            name: 'filter',
            category: 'transformation',
            complexity: 'O(n)',
            streamSafe: true,
            memoryEfficient: true
        }
    },

    'reduce': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const startTime = performance.now();
            
            try {
                const reducerFn = this.resolveFunction(args[0], context);
                const initialValue = args.length > 1 ? args[1] : undefined;
                
                let result;
                if (Array.isArray(input)) {
                    result = this.optimizedReduce(input, reducerFn, initialValue);
                } else if (input && typeof input === 'object') {
                    result = this.reduceObject(input, reducerFn, initialValue);
                } else {
                    result = initialValue !== undefined ? 
                             reducerFn(initialValue, input) : input;
                }
                
                this.recordPerformance('reduce', performance.now() - startTime,
                                    Array.isArray(input) ? input.length : 1);
                return result;
                
            } catch (error) {
                throw new Error(`Reduce operation failed: ${error.message}`);
            }
        },
        metadata: {
            name: 'reduce',
            category: 'transformation',
            complexity: 'O(n)',
            streamSafe: true,
            terminal: true
        }
    },

    // ==================== COLLECTION CREATION ====================
    
    'range': {
        type: 'creation',
        implementation: (input, args, context) => {
            const start = args[0] || 0;
            const end = args[1] || 10;
            const step = args[2] || 1;
            
            return this.generateRange(start, end, step);
        },
        metadata: {
            name: 'range',
            category: 'creation',
            complexity: 'O(n)',
            streamSafe: true,
            memoryEfficient: true
        }
    },

    'repeat': {
        type: 'creation',
        implementation: (input, args, context) => {
            const value = args[0];
            const count = args[1] || 1;
            
            return Array(count).fill(value);
        },
        metadata: {
            name: 'repeat',
            category: 'creation',
            complexity: 'O(n)',
            streamSafe: true
        }
    },

    'zip': {
        type: 'creation',
        implementation: (input, args, context) => {
            const arrays = [input, ...args].filter(Array.isArray);
            return this.zipArrays(arrays);
        },
        metadata: {
            name: 'zip',
            category: 'creation',
            complexity: 'O(n)',
            streamSafe: true,
            combinesCollections: true
        }
    },

    // ==================== COLLECTION QUERYING ====================
    
    'find': {
        type: 'query',
        implementation: (input, args, context) => {
            const predicateFn = this.resolveFunction(args[0], context);
            
            if (Array.isArray(input)) {
                return input.find(predicateFn);
            } else if (input && typeof input === 'object') {
                return this.findInObject(input, predicateFn);
            }
            return predicateFn(input) ? input : undefined;
        },
        metadata: {
            name: 'find',
            category: 'query',
            complexity: 'O(n)',
            streamSafe: true,
            shortCircuit: true
        }
    },

    'some': {
        type: 'query',
        implementation: (input, args, context) => {
            const predicateFn = this.resolveFunction(args[0], context);
            
            if (Array.isArray(input)) {
                return input.some(predicateFn);
            } else if (input && typeof input === 'object') {
                return Object.values(input).some(predicateFn);
            }
            return predicateFn(input);
        },
        metadata: {
            name: 'some',
            category: 'query',
            complexity: 'O(n)',
            streamSafe: true,
            shortCircuit: true,
            returnsBoolean: true
        }
    },

    'every': {
        type: 'query',
        implementation: (input, args, context) => {
            const predicateFn = this.resolveFunction(args[0], context);
            
            if (Array.isArray(input)) {
                return input.every(predicateFn);
            } else if (input && typeof input === 'object') {
                return Object.values(input).every(predicateFn);
            }
            return predicateFn(input);
        },
        metadata: {
            name: 'every',
            category: 'query',
            complexity: 'O(n)',
            streamSafe: true,
            shortCircuit: true,
            returnsBoolean: true
        }
    },

    // ==================== COLLECTION COMBINATION ====================
    
    'concat': {
        type: 'combination',
        implementation: (input, args, context) => {
            if (Array.isArray(input)) {
                return input.concat(...args);
            } else if (input && typeof input === 'object') {
                return this.mergeObjects([input, ...args]);
            }
            return [input, ...args];
        },
        metadata: {
            name: 'concat',
            category: 'combination',
            complexity: 'O(n)',
            streamSafe: true,
            combinesCollections: true
        }
    },

    'flatten': {
        type: 'combination',
        implementation: (input, args, context) => {
            const depth = args[0] || 1;
            
            if (Array.isArray(input)) {
                return this.flattenArray(input, depth);
            }
            return input;
        },
        metadata: {
            name: 'flatten',
            category: 'combination',
            complexity: 'O(n)',
            streamSafe: true,
            memoryIntensive: true
        }
    },

    'group_by': {
        type: 'combination',
        implementation: (input, args, context) => {
            const keyFn = this.resolveFunction(args[0], context);
            
            if (Array.isArray(input)) {
                return this.groupBy(input, keyFn);
            }
            return { [keyFn(input)]: [input] };
        },
        metadata: {
            name: 'group_by',
            category: 'combination',
            complexity: 'O(n)',
            streamSafe: true,
            createsStructure: true
        }
    },

    // ==================== ADVANCED COLLECTION OPERATIONS ====================
    
    'sort': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const compareFn = args[0] ? this.resolveFunction(args[0], context) : undefined;
            
            if (Array.isArray(input)) {
                // Create copy to avoid mutating original
                return [...input].sort(compareFn);
            }
            return input;
        },
        metadata: {
            name: 'sort',
            category: 'transformation',
            complexity: 'O(n log n)',
            streamSafe: true,
            memoryIntensive: true
        }
    },

    'distinct': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const keyFn = args[0] ? this.resolveFunction(args[0], context) : undefined;
            
            if (Array.isArray(input)) {
                return this.distinctValues(input, keyFn);
            }
            return input;
        },
        metadata: {
            name: 'distinct',
            category: 'transformation',
            complexity: 'O(n)',
            streamSafe: true,
            memoryEfficient: true
        }
    },

    'chunk': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const size = args[0] || 1;
            
            if (Array.isArray(input)) {
                return this.chunkArray(input, size);
            }
            return [[input]];
        },
        metadata: {
            name: 'chunk',
            category: 'transformation',
            complexity: 'O(n)',
            streamSafe: true,
            createsStructure: true
        }
    },

    'slice': {
        type: 'transformation',
        implementation: (input, args, context) => {
            const start = args[0] || 0;
            const end = args[1];
            
            if (Array.isArray(input)) {
                return input.slice(start, end);
            } else if (input && typeof input === 'object') {
                return this.sliceObject(input, start, end);
            }
            return input;
        },
        metadata: {
            name: 'slice',
            category: 'transformation',
            complexity: 'O(k) where k = end - start',
            streamSafe: true,
            memoryEfficient: true
        }
    }
};

/**
 * ENTERPRISE COLLECTION UTILITIES
 */
export class CollectionOperators {
    constructor() {
        this.performanceMetrics = new Map();
        this.optimizationCache = new Map();
    }

    // ==================== OPTIMIZED IMPLEMENTATIONS ====================
    
    optimizedMap(array, transformFn) {
        // Pre-allocate array for better performance
        const result = new Array(array.length);
        
        for (let i = 0; i < array.length; i++) {
            result[i] = transformFn(array[i], i, array);
        }
        
        return result;
    }

    optimizedFilter(array, predicateFn) {
        // Two-pass approach for memory efficiency
        const filtered = [];
        
        for (let i = 0; i < array.length; i++) {
            if (predicateFn(array[i], i, array)) {
                filtered.push(array[i]);
            }
        }
        
        return filtered;
    }

    optimizedReduce(array, reducerFn, initialValue) {
        let accumulator = initialValue;
        let startIndex = 0;
        
        if (initialValue === undefined) {
            if (array.length === 0) {
                throw new Error('Reduce of empty array with no initial value');
            }
            accumulator = array[0];
            startIndex = 1;
        }
        
        for (let i = startIndex; i < array.length; i++) {
            accumulator = reducerFn(accumulator, array[i], i, array);
        }
        
        return accumulator;
    }

    // ==================== OBJECT OPERATIONS ====================
    
    mapObject(obj, transformFn) {
        const result = {};
        
        for (const [key, value] of Object.entries(obj)) {
            result[key] = transformFn(value, key, obj);
        }
        
        return result;
    }

    filterObject(obj, predicateFn) {
        const result = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (predicateFn(value, key, obj)) {
                result[key] = value;
            }
        }
        
        return result;
    }

    reduceObject(obj, reducerFn, initialValue) {
        const entries = Object.entries(obj);
        let accumulator = initialValue;
        let startIndex = 0;
        
        if (initialValue === undefined) {
            if (entries.length === 0) {
                throw new Error('Reduce of empty object with no initial value');
            }
            accumulator = entries[0][1];
            startIndex = 1;
        }
        
        for (let i = startIndex; i < entries.length; i++) {
            const [key, value] = entries[i];
            accumulator = reducerFn(accumulator, value, key, obj);
        }
        
        return accumulator;
    }

    findInObject(obj, predicateFn) {
        for (const [key, value] of Object.entries(obj)) {
            if (predicateFn(value, key, obj)) {
                return value;
            }
        }
        return undefined;
    }

    // ==================== COLLECTION CREATION ====================
    
    generateRange(start, end, step) {
        const result = [];
        
        if (step > 0) {
            for (let i = start; i < end; i += step) {
                result.push(i);
            }
        } else if (step < 0) {
            for (let i = start; i > end; i += step) {
                result.push(i);
            }
        }
        
        return result;
    }

    zipArrays(arrays) {
        const length = Math.min(...arrays.map(arr => arr.length));
        const result = [];
        
        for (let i = 0; i < length; i++) {
            const tuple = [];
            for (const array of arrays) {
                tuple.push(array[i]);
            }
            result.push(tuple);
        }
        
        return result;
    }

    // ==================== ADVANCED OPERATIONS ====================
    
    flattenArray(array, depth = 1) {
        const result = [];
        
        const flatten = (arr, currentDepth) => {
            for (const item of arr) {
                if (Array.isArray(item) && currentDepth > 0) {
                    flatten(item, currentDepth - 1);
                } else {
                    result.push(item);
                }
            }
        };
        
        flatten(array, depth);
        return result;
    }

    groupBy(array, keyFn) {
        const groups = {};
        
        for (const item of array) {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        }
        
        return groups;
    }

    distinctValues(array, keyFn = null) {
        const seen = new Set();
        const result = [];
        
        for (const item of array) {
            const key = keyFn ? keyFn(item) : item;
            if (!seen.has(key)) {
                seen.add(key);
                result.push(item);
            }
        }
        
        return result;
    }

    chunkArray(array, size) {
        const chunks = [];
        
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        
        return chunks;
    }

    sliceObject(obj, start, end) {
        const entries = Object.entries(obj);
        const slicedEntries = entries.slice(start, end);
        return Object.fromEntries(slicedEntries);
    }

    mergeObjects(objects) {
        return objects.reduce((result, obj) => {
            return { ...result, ...obj };
        }, {});
    }

    // ==================== PERFORMANCE AND UTILITIES ====================
    
    resolveFunction(fn, context) {
        if (typeof fn === 'function') {
            return fn;
        } else if (typeof fn === 'string') {
            // Resolve function from context
            const resolved = context?.engine?.operators?.[fn];
            if (typeof resolved === 'function') {
                return resolved;
            }
        }
        throw new Error(`Cannot resolve function: ${fn}`);
    }

    recordPerformance(operation, duration, elementCount) {
        const key = `${operation}_${elementCount}`;
        const stats = this.performanceMetrics.get(key) || {
            count: 0,
            totalTime: 0,
            maxTime: 0,
            minTime: Infinity
        };
        
        stats.count++;
        stats.totalTime += duration;
        stats.maxTime = Math.max(stats.maxTime, duration);
        stats.minTime = Math.min(stats.minTime, duration);
        
        this.performanceMetrics.set(key, stats);
    }

    getPerformanceReport() {
        const report = {};
        
        for (const [key, stats] of this.performanceMetrics) {
            report[key] = {
                averageTime: stats.totalTime / stats.count,
                maxTime: stats.maxTime,
                minTime: stats.minTime,
                totalCalls: stats.count
            };
        }
        
        return report;
    }

    // ==================== STREAM-AWARE OPERATIONS ====================
    
    createLazySequence(generatorFn) {
        return {
            [Symbol.iterator]: function* () {
                yield* generatorFn();
            },
            map: function(transformFn) {
                const self = this;
                return {
                    [Symbol.iterator]: function* () {
                        for (const item of self) {
                            yield transformFn(item);
                        }
                    }
                };
            },
            filter: function(predicateFn) {
                const self = this;
                return {
                    [Symbol.iterator]: function* () {
                        for (const item of self) {
                            if (predicateFn(item)) {
                                yield item;
                            }
                        }
                    }
                };
            },
            take: function(count) {
                const self = this;
                return {
                    [Symbol.iterator]: function* () {
                        let taken = 0;
                        for (const item of self) {
                            if (taken >= count) break;
                            yield item;
                            taken++;
                        }
                    }
                };
            }
        };
    }

    // ==================== MEMORY MANAGEMENT ====================
    
    createWeakCollection() {
        // For large datasets that should be garbage collectable
        return new WeakMap();
    }

    estimateMemoryUsage(collection) {
        if (Array.isArray(collection)) {
            return collection.length * 8; // Rough estimate: 8 bytes per element
        } else if (collection && typeof collection === 'object') {
            return Object.keys(collection).length * 16; // Rough estimate
        }
        return 8; // Single value
    }
}

/**
 * ENTERPRISE DATA STRUCTURES
 */
export class FluxusDataStructures {
    constructor() {
        this.structures = new Map();
    }

    // Stream-aware data structures
    createStreamBuffer(maxSize = 1000) {
        return {
            buffer: [],
            maxSize,
            add(value) {
                this.buffer.push(value);
                if (this.buffer.length > this.maxSize) {
                    this.buffer.shift(); // Remove oldest
                }
            },
            get() {
                return [...this.buffer]; // Return copy
            },
            clear() {
                this.buffer = [];
            },
            size() {
                return this.buffer.length;
            }
        };
    }

    createPriorityQueue(compareFn = (a, b) => a - b) {
        const heap = [];
        
        return {
            enqueue(item) {
                heap.push(item);
                this.heapifyUp(heap.length - 1);
            },
            
            dequeue() {
                if (heap.length === 0) return null;
                
                const max = heap[0];
                const last = heap.pop();
                
                if (heap.length > 0) {
                    heap[0] = last;
                    this.heapifyDown(0);
                }
                
                return max;
            },
            
            peek() {
                return heap.length > 0 ? heap[0] : null;
            },
            
            size() {
                return heap.length;
            },
            
            isEmpty() {
                return heap.length === 0;
            },
            
            heapifyUp(index) {
                while (index > 0) {
                    const parent = Math.floor((index - 1) / 2);
                    if (compareFn(heap[parent], heap[index]) >= 0) break;
                    
                    [heap[parent], heap[index]] = [heap[index], heap[parent]];
                    index = parent;
                }
            },
            
            heapifyDown(index) {
                const length = heap.length;
                while (true) {
                    let left = 2 * index + 1;
                    let right = 2 * index + 2;
                    let largest = index;
                    
                    if (left < length && compareFn(heap[left], heap[largest]) > 0) {
                        largest = left;
                    }
                    
                    if (right < length && compareFn(heap[right], heap[largest]) > 0) {
                        largest = right;
                    }
                    
                    if (largest === index) break;
                    
                    [heap[index], heap[largest]] = [heap[largest], heap[index]];
                    index = largest;
                }
            }
        };
    }

    createLRUCache(maxSize = 100) {
        const cache = new Map();
        
        return {
            get(key) {
                if (cache.has(key)) {
                    // Move to end (most recently used)
                    const value = cache.get(key);
                    cache.delete(key);
                    cache.set(key, value);
                    return value;
                }
                return undefined;
            },
            
            set(key, value) {
                if (cache.has(key)) {
                    cache.delete(key);
                } else if (cache.size >= maxSize) {
                    // Remove least recently used
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }
                cache.set(key, value);
            },
            
            has(key) {
                return cache.has(key);
            },
            
            size() {
                return cache.size;
            },
            
            clear() {
                cache.clear();
            }
        };
    }
}

export default FLUXUS_COLLECTIONS_OPERATORS;
