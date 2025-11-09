// FILENAME: src/lib/reactive/pools.js
// Advanced Tidal Pool operations

export const POOL_OPERATORS = {
    'pool_get': (input, args, context) => {
        const poolName = args[0];
        return context.engine.pools[poolName]?.value;
    },

    'pool_combine': (input, args, context) => {
        const poolNames = args;
        const combined = {};
        
        poolNames.forEach(poolName => {
            const pool = context.engine.pools[poolName];
            if (pool) {
                combined[poolName] = pool.value;
            }
        });
        
        return { ...input, combined };
    },
    
    'pool_transform': (input, args, context) => {
        const poolName = args[0];
        const transform = args[1]; // Could be a function or expression
        
        const pool = context.engine.pools[poolName];
        if (pool) {
            // Simple transformation examples
            if (transform === 'increment') {
                return Number(pool.value) + 1;
            } else if (transform === 'uppercase') {
                return String(pool.value).toUpperCase();
            }
            return pool.value;
        }
        return input;
    },
    
    'pool_watch': (input, args, context) => {
        const poolName = args[0];
        console.log(`👀 Watching pool: ${poolName}`);
        const pool = context.engine.pools[poolName];
        
        return {
            watching: poolName,
            currentValue: pool?.value,
            updates: pool?._updates || 0,
            timestamp: Date.now()
        };
    },
    
    'pool_history': (input, args, context) => {
        const poolName = args[0];
        const pool = context.engine.pools[poolName];
        
        if (pool && pool.history) {
            return {
                pool: poolName,
                history: pool.history.slice(-10), // Last 10 values
                current: pool.value,
                totalUpdates: pool.history.length
            };
        }
        return { pool: poolName, history: [], error: 'Pool not found' };
    }
    
    'pool_reset': (input, args, context) => {
        const poolName = args[0];
        const initialValue = context.engine.ast?.pools[poolName]?.initial || null;
        context.engine.updatePool(poolName, initialValue);
        return input;
    }
};
