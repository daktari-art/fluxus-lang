// FILENAME: src/lib/reactive/subscriptions.js
// Fluxus Advanced Subscription Management and Reactive Patterns

/**
 * Advanced subscription operators for managing complex reactive relationships
 * and controlling data flow in reactive systems
 */

export const ReactiveSubscriptions = {
    /**
     * Debounce subscription updates to prevent excessive recalculations
     * @param {any} input - Stream input
     * @param {Array} args - [delayMs] Debounce delay in milliseconds
     * @param {Object} context - Execution context
     * @returns {any} Debounced value
     */
    'debounce_subscription': (input, args, context) => {
        const delayMs = parseInt(args[0]) || 300;
        
        if (!context.engine._debounceTimers) {
            context.engine._debounceTimers = new Map();
        }
        
        const subscriptionId = `debounce_${args.join('_')}`;
        let debounceData = context.engine._debounceTimers.get(subscriptionId);
        
        if (!debounceData) {
            debounceData = {
                timer: null,
                lastValue: input,
                lastEmitTime: 0
            };
            context.engine._debounceTimers.set(subscriptionId, debounceData);
        }
        
        // Store the latest value
        debounceData.lastValue = input;
        
        // Clear existing timer
        if (debounceData.timer) {
            clearTimeout(debounceData.timer);
        }
        
        // Set new timer
        return new Promise((resolve) => {
            debounceData.timer = setTimeout(() => {
                debounceData.lastEmitTime = Date.now();
                resolve(debounceData.lastValue);
            }, delayMs);
        });
    },
    
    /**
     * Throttle subscription updates to limit maximum frequency
     * @param {any} input - Stream input
     * @param {Array} args - [intervalMs] Throttle interval in milliseconds
     * @param {Object} context - Execution context
     * @returns {any} Throttled value or undefined if throttled
     */
    'throttle_subscription': (input, args, context) => {
        const intervalMs = parseInt(args[0]) || 1000;
        
        if (!context.engine._throttleStates) {
            context.engine._throttleStates = new Map();
        }
        
        const throttleId = `throttle_${args.join('_')}`;
        let throttleState = context.engine._throttleStates.get(throttleId);
        
        const now = Date.now();
        
        if (!throttleState) {
            throttleState = {
                lastEmitTime: 0,
                lastValue: input
            };
            context.engine._throttleStates.set(throttleId, throttleState);
            
            // First call always emits
            throttleState.lastEmitTime = now;
            return input;
        }
        
        // Check if enough time has passed
        if (now - throttleState.lastEmitTime >= intervalMs) {
            throttleState.lastEmitTime = now;
            throttleState.lastValue = input;
            return input;
        }
        
        // Return last value during throttle period
        return throttleState.lastValue;
    },
    
    /**
     * Buffer subscription values and emit in batches
     * @param {any} input - Stream input
     * @param {Array} args - [bufferSize, timeoutMs] Buffer parameters
     * @param {Object} context - Execution context
     * @returns {Array} Buffered values or single value if not full
     */
    'buffer_subscription': (input, args, context) => {
        const bufferSize = parseInt(args[0]) || 5;
        const timeoutMs = parseInt(args[1]) || 1000;
        
        if (!context.engine._subscriptionBuffers) {
            context.engine._subscriptionBuffers = new Map();
        }
        
        const bufferId = `buffer_${args.join('_')}`;
        let bufferState = context.engine._subscriptionBuffers.get(bufferId);
        
        const now = Date.now();
        
        if (!bufferState) {
            bufferState = {
                buffer: [input],
                createdAt: now,
                timer: null
            };
            context.engine._subscriptionBuffers.set(bufferId, bufferState);
            
            // Set timeout for partial buffer emission
            bufferState.timer = setTimeout(() => {
                const currentBuffer = bufferState.buffer;
                if (currentBuffer.length > 0) {
                    // Emission handled by next call
                    bufferState.buffer = [];
                }
            }, timeoutMs);
            
            return bufferState.buffer.length >= bufferSize ? bufferState.buffer : undefined;
        }
        
        // Add to buffer
        bufferState.buffer.push(input);
        
        // Check if buffer is full
        if (bufferState.buffer.length >= bufferSize) {
            const fullBuffer = [...bufferState.buffer];
            bufferState.buffer = [];
            bufferState.createdAt = now;
            
            // Reset timer
            if (bufferState.timer) {
                clearTimeout(bufferState.timer);
            }
            bufferState.timer = setTimeout(() => {
                // Handle empty timeout
            }, timeoutMs);
            
            return fullBuffer;
        }
        
        return undefined; // Buffer not full yet
    },
    
    /**
     * Share subscription among multiple consumers (multicast)
     * @param {any} input - Stream input
     * @param {Array} args - [shareKey] Key for shared subscription
     * @param {Object} context - Execution context
     * @returns {any} Shared value
     */
    'share_subscription': (input, args, context) => {
        const shareKey = args[0] || 'default';
        
        if (!context.engine._sharedSubscriptions) {
            context.engine._sharedSubscriptions = new Map();
        }
        
        const sharedId = `shared_${shareKey}`;
        let sharedState = context.engine._sharedSubscriptions.get(sharedId);
        
        if (!sharedState) {
            sharedState = {
                value: input,
                subscribers: new Set(),
                lastUpdated: Date.now()
            };
            context.engine._sharedSubscriptions.set(sharedId, sharedState);
        } else {
            sharedState.value = input;
            sharedState.lastUpdated = Date.now();
        }
        
        // Return the shared value
        return {
            value: sharedState.value,
            shared: true,
            key: shareKey,
            subscribers: sharedState.subscribers.size,
            lastUpdated: sharedState.lastUpdated
        };
    },
    
    /**
     * Cache subscription values with expiration
     * @param {any} input - Stream input
     * @param {Array} args - [cacheKey, ttlMs] Cache parameters
     * @param {Object} context - Execution context
     * @returns {any} Cached or fresh value
     */
    'cache_subscription': (input, args, context) => {
        const cacheKey = args[0] || 'default';
        const ttlMs = parseInt(args[1]) || 60000; // Default 1 minute
        
        if (!context.engine._subscriptionCache) {
            context.engine._subscriptionCache = new Map();
        }
        
        const cacheId = `cache_${cacheKey}`;
        const now = Date.now();
        let cacheEntry = context.engine._subscriptionCache.get(cacheId);
        
        // Check if cached value is still valid
        if (cacheEntry && (now - cacheEntry.timestamp) < ttlMs) {
            return {
                value: cacheEntry.value,
                cached: true,
                age: now - cacheEntry.timestamp,
                ttl: ttlMs
            };
        }
        
        // Update cache with new value
        cacheEntry = {
            value: input,
            timestamp: now
        };
        context.engine._subscriptionCache.set(cacheId, cacheEntry);
        
        return {
            value: input,
            cached: false,
            age: 0,
            ttl: ttlMs
        };
    },
    
    /**
     * Retry subscription on error with backoff
     * @param {any} input - Stream input
     * @param {Array} args - [maxRetries, backoffMs] Retry parameters
     * @param {Object} context - Execution context
     * @returns {any} Successful value or error
     */
    'retry_subscription': async (input, args, context) => {
        const maxRetries = parseInt(args[0]) || 3;
        const baseBackoff = parseInt(args[1]) || 1000;
        
        if (!context.engine._retryStates) {
            context.engine._retryStates = new Map();
        }
        
        const retryId = `retry_${args.join('_')}`;
        let retryState = context.engine._retryStates.get(retryId);
        
        if (!retryState) {
            retryState = {
                retryCount: 0,
                lastError: null
            };
            context.engine._retryStates.set(retryId, retryState);
        }
        
        // Check if input indicates an error
        const isError = input && (input.error || input instanceof Error);
        
        if (isError && retryState.retryCount < maxRetries) {
            retryState.retryCount++;
            retryState.lastError = input;
            
            // Calculate exponential backoff
            const backoffMs = baseBackoff * Math.pow(2, retryState.retryCount - 1);
            
            console.warn(`⚠️ Retry ${retryState.retryCount}/${maxRetries} after ${backoffMs}ms`);
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            
            // Signal retry (return special object)
            return {
                shouldRetry: true,
                retryCount: retryState.retryCount,
                maxRetries: maxRetries,
                backoff: backoffMs,
                lastError: input
            };
        }
        
        // Reset retry state on success
        if (!isError) {
            retryState.retryCount = 0;
            retryState.lastError = null;
        }
        
        return input;
    },
    
    /**
     * Sample subscription at regular intervals
     * @param {any} input - Stream input
     * @param {Array} args - [intervalMs] Sampling interval
     * @param {Object} context - Execution context
     * @returns {any} Sampled value or undefined
     */
    'sample_subscription': (input, args, context) => {
        const intervalMs = parseInt(args[0]) || 5000;
        
        if (!context.engine._sampleStates) {
            context.engine._sampleStates = new Map();
        }
        
        const sampleId = `sample_${args.join('_')}`;
        let sampleState = context.engine._sampleStates.get(sampleId);
        
        const now = Date.now();
        
        if (!sampleState) {
            sampleState = {
                lastSampleTime: 0,
                lastValue: input
            };
            context.engine._sampleStates.set(sampleId, sampleState);
            
            // First call always samples
            sampleState.lastSampleTime = now;
            return input;
        }
        
        // Store latest value
        sampleState.lastValue = input;
        
        // Check if sampling interval has elapsed
        if (now - sampleState.lastSampleTime >= intervalMs) {
            sampleState.lastSampleTime = now;
            return sampleState.lastValue;
        }
        
        return undefined; // Not time to sample yet
    },
    
    /**
     * Audit subscription - emit last value when notified
     * @param {any} input - Stream input
     * @param {Array} args - [auditStream] Stream that triggers emission
     * @param {Object} context - Execution context
     * @returns {any} Audited value or undefined
     */
    'audit_subscription': (input, args, context) => {
        if (!context.engine._auditStates) {
            context.engine._auditStates = new Map();
        }
        
        const auditId = `audit_${args.join('_')}`;
        let auditState = context.engine._auditStates.get(auditId);
        
        if (!auditState) {
            auditState = {
                lastValue: input,
                pending: false
            };
            context.engine._auditStates.set(auditId, auditState);
        } else {
            auditState.lastValue = input;
        }
        
        // Check if this is an audit trigger
        const isTrigger = args[0] && input === args[0];
        
        if (isTrigger && auditState.lastValue !== undefined) {
            const value = auditState.lastValue;
            auditState.pending = false;
            return value;
        }
        
        // Store value for future audit
        auditState.pending = true;
        return undefined;
    },
    
    /**
     * Distinct until changed - only emit when value actually changes
     * @param {any} input - Stream input
     * @param {Array} args - [comparator] Custom comparison function
     * @param {Object} context - Execution context
     * @returns {any} Value if changed, undefined otherwise
     */
    'distinct_until_changed': (input, args, context) => {
        if (!context.engine._distinctStates) {
            context.engine._distinctStates = new Map();
        }
        
        const distinctId = `distinct_${args.join('_')}`;
        let distinctState = context.engine._distinctStates.get(distinctId);
        
        if (!distinctState) {
            distinctState = {
                lastValue: input
            };
            context.engine._distinctStates.set(distinctId, distinctState);
            return input; // Always emit first value
        }
        
        // Compare values
        let isEqual = false;
        
        if (args[0] === 'deep') {
            // Deep comparison
            isEqual = JSON.stringify(input) === JSON.stringify(distinctState.lastValue);
        } else {
            // Shallow comparison
            isEqual = input === distinctState.lastValue;
        }
        
        if (!isEqual) {
            distinctState.lastValue = input;
            return input;
        }
        
        return undefined; // Value unchanged
    },
    
    /**
     * Delay subscription emission
     * @param {any} input - Stream input
     * @param {Array} args - [delayMs] Delay in milliseconds
     * @param {Object} context - Execution context
     * @returns {Promise} Delayed value
     */
    'delay_subscription': async (input, args, context) => {
        const delayMs = parseInt(args[0]) || 1000;
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return input;
    },
    
    /**
     * Take until another subscription emits
     * @param {any} input - Stream input
     * @param {Array} args - [notifierStream] Stream that stops emission
     * @param {Object} context - Execution context
     * @returns {any} Value or complete signal
     */
    'take_until': (input, args, context) => {
        const notifierKey = args[0];
        
        if (!context.engine._takeUntilStates) {
            context.engine._takeUntilStates = new Map();
        }
        
        const stateId = `take_until_${notifierKey}`;
        let takeUntilState = context.engine._takeUntilStates.get(stateId);
        
        // Check if this is the notifier
        if (input === notifierKey) {
            // Notifier triggered - complete
            if (takeUntilState) {
                takeUntilState.completed = true;
            }
            return { completed: true, reason: 'take_until' };
        }
        
        if (!takeUntilState) {
            takeUntilState = {
                completed: false
            };
            context.engine._takeUntilStates.set(stateId, takeUntilState);
        }
        
        if (takeUntilState.completed) {
            return { completed: true, reason: 'take_until' };
        }
        
        return input;
    },
    
    /**
     * Skip until another subscription emits
     * @param {any} input - Stream input
     * @param {Array} args - [notifierStream] Stream that starts emission
     * @param {Object} context - Execution context
     * @returns {any} Value or undefined
     */
    'skip_until': (input, args, context) => {
        const notifierKey = args[0];
        
        if (!context.engine._skipUntilStates) {
            context.engine._skipUntilStates = new Map();
        }
        
        const stateId = `skip_until_${notifierKey}`;
        let skipUntilState = context.engine._skipUntilStates.get(stateId);
        
        // Check if this is the notifier
        if (input === notifierKey) {
            // Notifier triggered - start emitting
            if (skipUntilState) {
                skipUntilState.started = true;
            } else {
                skipUntilState = { started: true };
                context.engine._skipUntilStates.set(stateId, skipUntilState);
            }
            return undefined;
        }
        
        if (!skipUntilState || !skipUntilState.started) {
            return undefined; // Still waiting for notifier
        }
        
        return input;
    }
};
