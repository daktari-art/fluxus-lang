// FILENAME: src/lib/time/time.js
// Fluxus Enterprise Time Library v4.0 - PRODUCTION GRADE

import { performance } from 'perf_hooks';

/**
 * ENTERPRISE TIME OPERATORS
 * 
 * Fluxus-Specific Features:
 * - Stream-aware time operations
 * - Reactive scheduling and timing
 * - High-precision time measurements
 * - Mobile-optimized timing operations
 * - Temporal stream processing
 */

export const FLUXUS_TIME_OPERATORS = {
    // ==================== TIME MEASUREMENT OPERATORS ====================
    
    'now': {
        type: 'time_source',
        implementation: (input, args, context) => {
            return Date.now();
        },
        metadata: {
            name: 'now',
            category: 'time_measurement',
            complexity: 'O(1)',
            streamSafe: true,
            stateful: true,
            returnsNumber: true
        }
    },

    'performance_now': {
        type: 'time_source',
        implementation: (input, args, context) => {
            return performance.now();
        },
        metadata: {
            name: 'performance_now',
            category: 'time_measurement',
            complexity: 'O(1)',
            streamSafe: true,
            stateful: true,
            highPrecision: true,
            returnsNumber: true
        }
    },

    'timestamp': {
        type: 'time_source',
        implementation: (input, args, context) => {
            return {
                timestamp: Date.now(),
                iso: new Date().toISOString(),
                performance: performance.now()
            };
        },
        metadata: {
            name: 'timestamp',
            category: 'time_measurement',
            complexity: 'O(1)',
            streamSafe: true,
            stateful: true,
            returnsObject: true
        }
    },

    // ==================== TIME MANIPULATION OPERATORS ====================
    
    'add_milliseconds': {
        type: 'time_manipulation',
        implementation: (input, args, context) => {
            const baseTime = this.extractTimestamp(input);
            const milliseconds = args.length > 0 ? this.toNumber(args[0]) : 0;
            return baseTime + milliseconds;
        },
        metadata: {
            name: 'add_milliseconds',
            category: 'time_manipulation',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'add_seconds': {
        type: 'time_manipulation',
        implementation: (input, args, context) => {
            const baseTime = this.extractTimestamp(input);
            const seconds = args.length > 0 ? this.toNumber(args[0]) : 0;
            return baseTime + (seconds * 1000);
        },
        metadata: {
            name: 'add_seconds',
            category: 'time_manipulation',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'add_minutes': {
        type: 'time_manipulation',
        implementation: (input, args, context) => {
            const baseTime = this.extractTimestamp(input);
            const minutes = args.length > 0 ? this.toNumber(args[0]) : 0;
            return baseTime + (minutes * 60 * 1000);
        },
        metadata: {
            name: 'add_minutes',
            category: 'time_manipulation',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    'add_hours': {
        type: 'time_manipulation',
        implementation: (input, args, context) => {
            const baseTime = this.extractTimestamp(input);
            const hours = args.length > 0 ? this.toNumber(args[0]) : 0;
            return baseTime + (hours * 60 * 60 * 1000);
        },
        metadata: {
            name: 'add_hours',
            category: 'time_manipulation',
            complexity: 'O(1)',
            streamSafe: true
        }
    },

    // ==================== TIME FORMATTING OPERATORS ====================
    
    'format_time': {
        type: 'time_formatting',
        implementation: (input, args, context) => {
            const timestamp = this.extractTimestamp(input);
            const format = args.length > 0 ? args[0] : 'iso';
            return this.formatTimestamp(timestamp, format);
        },
        metadata: {
            name: 'format_time',
            category: 'time_formatting',
            complexity: 'O(1)',
            streamSafe: true,
            returnsString: true
        }
    },

    'to_iso_string': {
        type: 'time_formatting',
        implementation: (input, args, context) => {
            const timestamp = this.extractTimestamp(input);
            return new Date(timestamp).toISOString();
        },
        metadata: {
            name: 'to_iso_string',
            category: 'time_formatting',
            complexity: 'O(1)',
            streamSafe: true,
            returnsString: true
        }
    },

    'to_locale_string': {
        type: 'time_formatting',
        implementation: (input, args, context) => {
            const timestamp = this.extractTimestamp(input);
            const locale = args.length > 0 ? args[0] : undefined;
            const options = args.length > 1 ? args[1] : undefined;
            return new Date(timestamp).toLocaleString(locale, options);
        },
        metadata: {
            name: 'to_locale_string',
            category: 'time_formatting',
            complexity: 'O(1)',
            streamSafe: true,
            returnsString: true
        }
    },

    // ==================== TIME DIFFERENCE OPERATORS ====================
    
    'time_diff': {
        type: 'time_comparison',
        implementation: (input, args, context) => {
            const time1 = this.extractTimestamp(input);
            const time2 = args.length > 0 ? this.extractTimestamp(args[0]) : Date.now();
            return time2 - time1;
        },
        metadata: {
            name: 'time_diff',
            category: 'time_comparison',
            complexity: 'O(1)',
            streamSafe: true,
            returnsNumber: true
        }
    },

    'time_since': {
        type: 'time_comparison',
        implementation: (input, args, context) => {
            const pastTime = this.extractTimestamp(input);
            const currentTime = Date.now();
            return currentTime - pastTime;
        },
        metadata: {
            name: 'time_since',
            category: 'time_comparison',
            complexity: 'O(1)',
            streamSafe: true,
            returnsNumber: true
        }
    },

    'time_until': {
        type: 'time_comparison',
        implementation: (input, args, context) => {
            const futureTime = this.extractTimestamp(input);
            const currentTime = Date.now();
            return Math.max(0, futureTime - currentTime);
        },
        metadata: {
            name: 'time_until',
            category: 'time_comparison',
            complexity: 'O(1)',
            streamSafe: true,
            returnsNumber: true
        }
    },

    // ==================== SCHEDULING OPERATORS ====================
    
    'delay': {
        type: 'scheduling',
        implementation: async (input, args, context) => {
            const delayMs = args.length > 0 ? this.toNumber(args[0]) : 1000;
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(input);
                }, delayMs);
            });
        },
        metadata: {
            name: 'delay',
            category: 'scheduling',
            complexity: 'O(1)',
            streamSafe: true,
            asynchronous: true,
            preservesValue: true
        }
    },

    'throttle': {
        type: 'scheduling',
        implementation: (input, args, context) => {
            const intervalMs = args.length > 0 ? this.toNumber(args[0]) : 1000;
            const key = this.getThrottleKey(input, context);
            
            const now = performance.now();
            const lastExecution = this.throttleCache.get(key) || 0;
            
            if (now - lastExecution >= intervalMs) {
                this.throttleCache.set(key, now);
                return input;
            }
            
            return null; // Skip this execution
        },
        metadata: {
            name: 'throttle',
            category: 'scheduling',
            complexity: 'O(1)',
            streamSafe: true,
            stateful: true,
            rateLimiting: true
        }
    },

    'debounce': {
        type: 'scheduling',
        implementation: (input, args, context) => {
            const delayMs = args.length > 0 ? this.toNumber(args[0]) : 1000;
            const key = this.getDebounceKey(input, context);
            
            // Clear existing timeout
            if (this.debounceTimeouts.has(key)) {
                clearTimeout(this.debounceTimeouts.get(key));
            }
            
            // Set new timeout
            return new Promise((resolve) => {
                const timeoutId = setTimeout(() => {
                    this.debounceTimeouts.delete(key);
                    resolve(input);
                }, delayMs);
                
                this.debounceTimeouts.set(key, timeoutId);
            });
        },
        metadata: {
            name: 'debounce',
            category: 'scheduling',
            complexity: 'O(1)',
            streamSafe: true,
            stateful: true,
            asynchronous: true,
            eventSuppression: true
        }
    },

    // ==================== TEMPORAL STREAM OPERATORS ====================
    
    'temporal_map': {
        type: 'temporal',
        implementation: (input, args, context) => {
            const transformFn = this.resolveFunction(args[0], context);
            const timestamp = performance.now();
            
            if (input && input.type === 'STREAM') {
                return {
                    ...input,
                    values: input.values.map((value, index) => ({
                        value: transformFn(value),
                        timestamp,
                        index,
                        elapsed: index > 0 ? timestamp - input.metadata.created : 0
                    }))
                };
            }
            
            return {
                value: transformFn(input),
                timestamp,
                elapsed: 0
            };
        },
        metadata: {
            name: 'temporal_map',
            category: 'temporal',
            complexity: 'O(n)',
            streamSafe: true,
            streamAware: true,
            addsTiming: true
        }
    },

    'with_timing': {
        type: 'temporal',
        implementation: (input, args, context) => {
            const startTime = performance.now();
            const result = input; // In real implementation, this would execute something
            const endTime = performance.now();
            
            return {
                value: result,
                timing: {
                    start: startTime,
                    end: endTime,
                    duration: endTime - startTime
                }
            };
        },
        metadata: {
            name: 'with_timing',
            category: 'temporal',
            complexity: 'O(1)',
            streamSafe: true,
            addsTiming: true
        }
    },

    // ==================== INTERVAL OPERATORS ====================
    
    'interval': {
        type: 'scheduling',
        implementation: (input, args, context) => {
            const intervalMs = args.length > 0 ? this.toNumber(args[0]) : 1000;
            const count = args.length > 1 ? this.toNumber(args[1]) : Infinity;
            
            return this.createIntervalStream(intervalMs, count, context);
        },
        metadata: {
            name: 'interval',
            category: 'scheduling',
            complexity: 'O(1)',
            streamSafe: true,
            createsStream: true,
            liveStream: true
        }
    },

    'timeout': {
        type: 'scheduling',
        implementation: (input, args, context) => {
            const timeoutMs = args.length > 0 ? this.toNumber(args[0]) : 1000;
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(input);
                }, timeoutMs);
            });
        },
        metadata: {
            name: 'timeout',
            category: 'scheduling',
            complexity: 'O(1)',
            streamSafe: true,
            asynchronous: true
        }
    }
};

/**
 * ENTERPRISE TIME UTILITIES
 */
export class TimeOperators {
    constructor() {
        this.performanceMetrics = new Map();
        this.throttleCache = new Map();
        this.debounceTimeouts = new Map();
        this.activeIntervals = new Map();
        this.activeTimeouts = new Map();
        
        this.initializeTimeFormats();
    }

    /**
     * TIME FORMATS AND CONSTANTS
     */
    initializeTimeFormats() {
        this.timeFormats = {
            'iso': (timestamp) => new Date(timestamp).toISOString(),
            'locale': (timestamp) => new Date(timestamp).toLocaleString(),
            'time': (timestamp) => new Date(timestamp).toLocaleTimeString(),
            'date': (timestamp) => new Date(timestamp).toLocaleDateString(),
            'unix': (timestamp) => Math.floor(timestamp / 1000),
            'relative': (timestamp) => this.formatRelativeTime(timestamp),
            'custom': (timestamp, format) => this.formatCustom(timestamp, format)
        };

        this.timeConstants = {
            MILLISECOND: 1,
            SECOND: 1000,
            MINUTE: 60 * 1000,
            HOUR: 60 * 60 * 1000,
            DAY: 24 * 60 * 60 * 1000,
            WEEK: 7 * 24 * 60 * 60 * 1000
        };
    }

    /**
     * TIME EXTRACTION AND CONVERSION
     */
    extractTimestamp(input) {
        if (typeof input === 'number') {
            return input;
        } else if (typeof input === 'string') {
            const timestamp = Date.parse(input);
            if (isNaN(timestamp)) {
                throw new Error(`Invalid date string: ${input}`);
            }
            return timestamp;
        } else if (input instanceof Date) {
            return input.getTime();
        } else if (typeof input === 'object' && input.timestamp) {
            return input.timestamp;
        } else if (input === null || input === undefined) {
            return Date.now();
        } else {
            throw new Error(`Cannot extract timestamp from: ${typeof input}`);
        }
    }

    toNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value);
        if (typeof value === 'boolean') return value ? 1 : 0;
        if (value === null || value === undefined) return 0;
        if (typeof value === 'object' && value.value !== undefined) {
            return this.toNumber(value.value);
        }
        throw new Error(`Cannot convert to number: ${typeof value}`);
    }

    /**
     * TIME FORMATTING IMPLEMENTATIONS
     */
    formatTimestamp(timestamp, format) {
        const formatFn = this.timeFormats[format];
        if (formatFn) {
            return formatFn(timestamp);
        } else if (format === 'custom') {
            return this.formatCustom(timestamp, format);
        } else {
            // Default to ISO format
            return this.timeFormats['iso'](timestamp);
        }
    }

    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const absDiff = Math.abs(diff);
        
        if (absDiff < this.timeConstants.SECOND) {
            return 'just now';
        } else if (absDiff < this.timeConstants.MINUTE) {
            const seconds = Math.floor(absDiff / this.timeConstants.SECOND);
            return `${seconds} second${seconds !== 1 ? 's' : ''} ${diff < 0 ? 'from now' : 'ago'}`;
        } else if (absDiff < this.timeConstants.HOUR) {
            const minutes = Math.floor(absDiff / this.timeConstants.MINUTE);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ${diff < 0 ? 'from now' : 'ago'}`;
        } else if (absDiff < this.timeConstants.DAY) {
            const hours = Math.floor(absDiff / this.timeConstants.HOUR);
            return `${hours} hour${hours !== 1 ? 's' : ''} ${diff < 0 ? 'from now' : 'ago'}`;
        } else {
            const days = Math.floor(absDiff / this.timeConstants.DAY);
            return `${days} day${days !== 1 ? 's' : ''} ${diff < 0 ? 'from now' : 'ago'}`;
        }
    }

    formatCustom(timestamp, format) {
        const date = new Date(timestamp);
        const replacements = {
            'YYYY': date.getFullYear(),
            'MM': String(date.getMonth() + 1).padStart(2, '0'),
            'DD': String(date.getDate()).padStart(2, '0'),
            'HH': String(date.getHours()).padStart(2, '0'),
            'mm': String(date.getMinutes()).padStart(2, '0'),
            'ss': String(date.getSeconds()).padStart(2, '0'),
            'SSS': String(date.getMilliseconds()).padStart(3, '0')
        };

        return format.replace(/YYYY|MM|DD|HH|mm|ss|SSS/g, match => replacements[match]);
    }

    /**
     * SCHEDULING IMPLEMENTATIONS
     */
    getThrottleKey(input, context) {
        // Create a unique key for throttling based on input and context
        return JSON.stringify({
            input: typeof input === 'object' ? input.type || 'value' : input,
            nodeId: context.currentNode?.id,
            timestamp: Date.now() // Use coarse timestamp for bucketing
        });
    }

    getDebounceKey(input, context) {
        // Create a unique key for debouncing
        return `${context.currentNode?.id}_${typeof input}`;
    }

    createIntervalStream(intervalMs, count, context) {
        const streamId = `interval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const stream = {
            id: streamId,
            type: 'STREAM',
            streamType: 'LIVE',
            values: [],
            options: {
                interval: intervalMs,
                maxCount: count
            },
            metadata: {
                created: Date.now(),
                elementCount: 0,
                subscribers: new Set()
            },
            state: 'ACTIVE'
        };

        let executionCount = 0;
        const intervalId = setInterval(() => {
            if (stream.state !== 'ACTIVE') {
                clearInterval(intervalId);
                return;
            }

            if (executionCount >= count) {
                clearInterval(intervalId);
                stream.state = 'COMPLETED';
                return;
            }

            const value = {
                value: executionCount,
                timestamp: Date.now(),
                iteration: executionCount
            };

            stream.values.push(value);
            stream.metadata.elementCount++;
            executionCount++;

            // Notify subscribers
            stream.metadata.subscribers.forEach(subscriberId => {
                context.scheduler?.scheduleStreamUpdate(subscriberId, value);
            });

        }, intervalMs);

        this.activeIntervals.set(streamId, intervalId);
        stream.metadata.intervalId = intervalId;

        return stream;
    }

    /**
     * TEMPORAL ANALYSIS
     */
    analyzeTemporalStream(stream) {
        if (!stream || stream.type !== 'STREAM') {
            throw new Error('Expected a stream for temporal analysis');
        }

        const values = stream.values;
        if (values.length === 0) {
            return {
                count: 0,
                duration: 0,
                frequency: 0,
                regularity: 0
            };
        }

        const timestamps = values.map(item => 
            item.timestamp || this.extractTimestamp(item)
        );
        
        const duration = timestamps[timestamps.length - 1] - timestamps[0];
        const intervals = [];
        
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }

        const averageInterval = intervals.length > 0 ? 
            intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length : 0;
        
        const frequency = averageInterval > 0 ? 1000 / averageInterval : 0;
        
        // Calculate regularity (coefficient of variation of intervals)
        const regularity = this.calculateRegularity(intervals);

        return {
            count: values.length,
            duration,
            frequency: Math.round(frequency * 100) / 100, // Hz
            regularity: Math.round(regularity * 100) / 100,
            averageInterval,
            minInterval: Math.min(...intervals),
            maxInterval: Math.max(...intervals)
        };
    }

    calculateRegularity(intervals) {
        if (intervals.length < 2) return 1;
        
        const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        return mean > 0 ? stdDev / mean : 1;
    }

    /**
     * PERFORMANCE MONITORING
     */
    recordPerformance(operation, duration) {
        const stats = this.performanceMetrics.get(operation) || {
            count: 0,
            totalTime: 0,
            maxTime: 0,
            minTime: Infinity
        };
        
        stats.count++;
        stats.totalTime += duration;
        stats.maxTime = Math.max(stats.maxTime, duration);
        stats.minTime = Math.min(stats.minTime, duration);
        
        this.performanceMetrics.set(operation, stats);
    }

    getPerformanceReport() {
        const report = {};
        
        for (const [operation, stats] of this.performanceMetrics) {
            report[operation] = {
                averageTime: stats.totalTime / stats.count,
                maxTime: stats.maxTime,
                minTime: stats.minTime,
                totalCalls: stats.count
            };
        }
        
        return report;
    }

    /**
     * RESOURCE CLEANUP
     */
    cleanup() {
        // Clear all active intervals
        for (const intervalId of this.activeIntervals.values()) {
            clearInterval(intervalId);
        }
        this.activeIntervals.clear();

        // Clear all active timeouts
        for (const timeoutId of this.activeTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        this.activeTimeouts.clear();

        // Clear debounce timeouts
        for (const timeoutId of this.debounceTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        this.debounceTimeouts.clear();

        // Clear throttle cache
        this.throttleCache.clear();
    }

    resolveFunction(fn, context) {
        if (typeof fn === 'function') {
            return fn;
        } else if (typeof fn === 'string') {
            const resolved = context?.engine?.operators?.[fn];
            if (typeof resolved === 'function') {
                return resolved;
            }
        }
        throw new Error(`Cannot resolve function: ${fn}`);
    }
}

/**
 * SCHEDULING AND TIMING UTILITIES
 */
export const scheduling = {
    createScheduler: (config = {}) => {
        return new AdvancedScheduler(config);
    },

    createTimer: (duration, callback) => {
        const timerId = setTimeout(callback, duration);
        return {
            cancel: () => clearTimeout(timerId),
            id: timerId
        };
    },

    createInterval: (duration, callback) => {
        const intervalId = setInterval(callback, duration);
        return {
            cancel: () => clearInterval(intervalId),
            id: intervalId
        };
    },

    sleep: (duration) => {
        return new Promise(resolve => setTimeout(resolve, duration));
    },

    animationFrame: () => {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }
};

export default FLUXUS_TIME_OPERATORS;
