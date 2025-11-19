// FILENAME: src/lib/data/aggregators.js
// Fluxus Windowed Aggregation Operators for Real-time Data Processing

/**
 * Windowed aggregation operators for real-time stream processing
 * These operators maintain state across multiple stream events
 */

export const DataAggregators = {
    /**
     * Count events in a sliding time window
     * @param {any} input - Stream input
     * @param {Array} args - [windowSizeMs] Window size in milliseconds
     * @param {Object} context - Execution context
     * @returns {number} Event count in window
     */
    'window_count': (input, args, context) => {
        const windowSize = parseInt(args[0]) || 1000; // Default 1 second
        
        // Initialize window tracking in context if not exists
        if (!context.engine._aggregationWindows) {
            context.engine._aggregationWindows = new Map();
        }
        
        const operatorId = `window_count_${args.join('_')}`;
        let windowData = context.engine._aggregationWindows.get(operatorId);
        
        if (!windowData) {
            windowData = {
                events: [],
                windowSize: windowSize,
                lastCleanup: Date.now()
            };
            context.engine._aggregationWindows.set(operatorId, windowData);
        }
        
        // Add current event with timestamp
        windowData.events.push({
            timestamp: Date.now(),
            data: input
        });
        
        // Clean up old events outside window
        const now = Date.now();
        windowData.events = windowData.events.filter(event => 
            now - event.timestamp <= windowSize
        );
        
        return windowData.events.length;
    },
    
    /**
     * Calculate moving average over a window of values
     * @param {number} input - Numeric stream input
     * @param {Array} args - [windowSize] Number of values to average
     * @param {Object} context - Execution context
     * @returns {number} Moving average
     */
    'moving_average': (input, args, context) => {
        const windowSize = parseInt(args[0]) || 10;
        
        if (!context.engine._movingAverages) {
            context.engine._movingAverages = new Map();
        }
        
        const operatorId = `moving_average_${args.join('_')}`;
        let averageData = context.engine._movingAverages.get(operatorId);
        
        if (!averageData) {
            averageData = {
                values: [],
                windowSize: windowSize
            };
            context.engine._movingAverages.set(operatorId, averageData);
        }
        
        // Convert input to number
        const numericValue = typeof input === 'number' ? input : parseFloat(input);
        if (isNaN(numericValue)) {
            return 0; // Return 0 for non-numeric inputs
        }
        
        // Add new value
        averageData.values.push(numericValue);
        
        // Maintain window size
        if (averageData.values.length > windowSize) {
            averageData.values.shift();
        }
        
        // Calculate average
        const sum = averageData.values.reduce((acc, val) => acc + val, 0);
        return sum / averageData.values.length;
    },
    
    /**
     * Calculate rate of events per second
     * @param {any} input - Stream input
     * @param {Array} args - [sampleWindowMs] Sampling window in milliseconds
     * @param {Object} context - Execution context
     * @returns {number} Events per second
     */
    'rate_per_second': (input, args, context) => {
        const sampleWindow = parseInt(args[0]) || 5000; // Default 5 second window
        
        if (!context.engine._rateCalculators) {
            context.engine._rateCalculators = new Map();
        }
        
        const operatorId = `rate_per_second_${args.join('_')}`;
        let rateData = context.engine._rateCalculators.get(operatorId);
        
        const now = Date.now();
        
        if (!rateData) {
            rateData = {
                events: [now],
                sampleWindow: sampleWindow,
                lastCalculation: now
            };
            context.engine._rateCalculators.set(operatorId, rateData);
        } else {
            rateData.events.push(now);
        }
        
        // Clean old events
        rateData.events = rateData.events.filter(timestamp => 
            now - timestamp <= sampleWindow
        );
        
        // Calculate rate (events per second)
        const windowSeconds = sampleWindow / 1000;
        const rate = rateData.events.length / windowSeconds;
        
        return Math.round(rate * 100) / 100; // Round to 2 decimal places
    },
    
    /**
     * Find maximum value in sliding window
     * @param {number} input - Numeric stream input
     * @param {Array} args - [windowSize] Window size for max calculation
     * @param {Object} context - Execution context
     * @returns {number} Maximum value in window
     */
    'window_max': (input, args, context) => {
        const windowSize = parseInt(args[0]) || 10;
        
        if (!context.engine._windowMax) {
            context.engine._windowMax = new Map();
        }
        
        const operatorId = `window_max_${args.join('_')}`;
        let maxData = context.engine._windowMax.get(operatorId);
        
        if (!maxData) {
            maxData = {
                values: [],
                windowSize: windowSize,
                currentMax: -Infinity
            };
            context.engine._windowMax.set(operatorId, maxData);
        }
        
        const numericValue = typeof input === 'number' ? input : parseFloat(input);
        if (isNaN(numericValue)) {
            return maxData.currentMax !== -Infinity ? maxData.currentMax : 0;
        }
        
        // Add new value
        maxData.values.push({
            value: numericValue,
            timestamp: Date.now()
        });
        
        // Remove values outside window if windowSize is time-based
        if (args[1] === 'time') {
            const now = Date.now();
            maxData.values = maxData.values.filter(item => 
                now - item.timestamp <= windowSize
            );
        } else {
            // Fixed size window
            if (maxData.values.length > windowSize) {
                const removed = maxData.values.shift();
                // If we removed the current max, recalculate
                if (removed.value === maxData.currentMax) {
                    maxData.currentMax = Math.max(...maxData.values.map(v => v.value));
                }
            }
        }
        
        // Update max if new value is larger
        if (numericValue > maxData.currentMax) {
            maxData.currentMax = numericValue;
        } else if (!maxData.values.some(v => v.value === maxData.currentMax)) {
            // Current max was removed, recalculate
            maxData.currentMax = maxData.values.length > 0 ? 
                Math.max(...maxData.values.map(v => v.value)) : numericValue;
        }
        
        return maxData.currentMax;
    },
    
    /**
     * Aggregate values by key for real-time grouping
     * @param {Object} input - Stream input with key-value pairs
     * @param {Array} args - [keyField, valueField] Fields to aggregate by
     * @param {Object} context - Execution context
     * @returns {Object} Aggregated values by key
     */
    'group_aggregate': (input, args, context) => {
        const keyField = args[0] || 'key';
        const valueField = args[1] || 'value';
        const aggregation = args[2] || 'sum'; // sum, count, avg
        
        if (!context.engine._groupAggregations) {
            context.engine._groupAggregations = new Map();
        }
        
        const operatorId = `group_aggregate_${args.join('_')}`;
        let aggregationData = context.engine._groupAggregations.get(operatorId);
        
        if (!aggregationData) {
            aggregationData = {
                groups: new Map(),
                aggregation: aggregation
            };
            context.engine._groupAggregations.set(operatorId, aggregationData);
        }
        
        const key = input[keyField];
        const value = input[valueField];
        
        if (key === undefined) {
            return Object.fromEntries(aggregationData.groups);
        }
        
        let group = aggregationData.groups.get(key);
        if (!group) {
            group = { sum: 0, count: 0, values: [] };
            aggregationData.groups.set(key, group);
        }
        
        const numericValue = typeof value === 'number' ? value : parseFloat(value);
        
        if (!isNaN(numericValue)) {
            group.sum += numericValue;
            group.count++;
            group.values.push(numericValue);
            
            // Limit history to prevent memory leaks
            if (group.values.length > 1000) {
                group.values = group.values.slice(-100);
            }
        }
        
        // Return aggregated result based on type
        const result = {};
        aggregationData.groups.forEach((data, groupKey) => {
            switch (aggregation) {
                case 'sum':
                    result[groupKey] = data.sum;
                    break;
                case 'count':
                    result[groupKey] = data.count;
                    break;
                case 'avg':
                    result[groupKey] = data.count > 0 ? data.sum / data.count : 0;
                    break;
                case 'max':
                    result[groupKey] = data.values.length > 0 ? Math.max(...data.values) : 0;
                    break;
                default:
                    result[groupKey] = data.sum;
            }
        });
        
        return result;
    }
};
