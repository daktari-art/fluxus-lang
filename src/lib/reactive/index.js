// FILENAME: src/lib/reactive/index.js
// Reactive Programming System - Production Grade

import { ReactiveLenses } from './lenses.js';
import { ReactivePools } from './pools.js';
import { ReactiveSubscriptions } from './subscriptions.js';

// Unified Reactive System
export class ReactiveSystem {
    constructor(engine) {
        this.engine = engine;
        this.lenses = new ReactiveLenses();
        this.pools = new ReactivePools();
        this.subscriptions = new ReactiveSubscriptions();
        
        this.initializeReactiveOperators();
    }

    initializeReactiveOperators() {
        // Register reactive operators with engine
        const reactiveOperators = {
            // Lens operators
            'lens.create': this.lenses.createLens.bind(this.lenses),
            'lens.get': this.lenses.get.bind(this.lenses),
            'lens.set': this.lenses.set.bind(this.lenses),
            'lens.transform': this.lenses.transform.bind(this.lenses),
            
            // Pool operators
            'pool.create': this.pools.createPool.bind(this.pools),
            'pool.get': this.pools.get.bind(this.pools),
            'pool.set': this.pools.set.bind(this.pools),
            'pool.subscribe': this.pools.subscribe.bind(this.pools),
            
            // Subscription operators
            'subscribe': this.subscriptions.create.bind(this.subscriptions),
            'unsubscribe': this.subscriptions.remove.bind(this.subscriptions),
            'notify': this.subscriptions.notify.bind(this.subscriptions)
        };

        // Register with engine
        Object.entries(reactiveOperators).forEach(([name, implementation]) => {
            if (this.engine && this.engine.operators) {
                this.engine.operators.set(name, implementation);
            }
        });
    }

    // Stream processing
    createStream(initialValue) {
        return {
            value: initialValue,
            subscribers: new Set(),
            
            subscribe(callback) {
                this.subscribers.add(callback);
                return () => this.subscribers.delete(callback);
            },
            
            set(newValue) {
                this.value = newValue;
                this.subscribers.forEach(callback => callback(newValue));
            },
            
            get() {
                return this.value;
            },
            
            map(transform) {
                const newStream = this.createStream(transform(this.value));
                this.subscribe(value => newStream.set(transform(value)));
                return newStream;
            },
            
            filter(predicate) {
                const newStream = this.createStream(predicate(this.value) ? this.value : undefined);
                this.subscribe(value => {
                    if (predicate(value)) {
                        newStream.set(value);
                    }
                });
                return newStream;
            }
        };
    }

    // Combine multiple streams
    combineStreams(streams, combiner) {
        const values = streams.map(stream => stream.get());
        const combinedStream = this.createStream(combiner(...values));
        
        streams.forEach((stream, index) => {
            stream.subscribe(newValue => {
                values[index] = newValue;
                combinedStream.set(combiner(...values));
            });
        });
        
        return combinedStream;
    }

    // State management
    createStore(initialState) {
        const stream = this.createStream(initialState);
        
        return {
            getState: () => stream.get(),
            setState: (newState) => stream.set(newState),
            subscribe: (callback) => stream.subscribe(callback),
            select: (selector) => {
                const selectedStream = this.createStream(selector(stream.get()));
                stream.subscribe(state => selectedStream.set(selector(state)));
                return selectedStream;
            }
        };
    }
}

// Export individual components
export { ReactiveLenses, ReactivePools, ReactiveSubscriptions };

// Export reactive operators for engine registration
export const REACTIVE_OPERATORS = {
    // Stream operators
    'stream.create': (input, args) => {
        const [initialValue] = args;
        const reactiveSystem = new ReactiveSystem();
        return reactiveSystem.createStream(initialValue !== undefined ? initialValue : input);
    },
    
    'stream.map': (input, args) => {
        const [transform] = args;
        if (input && typeof input.map === 'function') {
            return input.map(transform);
        }
        return input;
    },
    
    'stream.filter': (input, args) => {
        const [predicate] = args;
        if (input && typeof input.filter === 'function') {
            return input.filter(predicate);
        }
        return input;
    },
    
    // State operators
    'state.create': (input, args) => {
        const [initialState] = args;
        const reactiveSystem = new ReactiveSystem();
        return reactiveSystem.createStore(initialState !== undefined ? initialState : input);
    }
};

// Registration function for engine
export function registerWithEngine(engine) {
    const operators = REACTIVE_OPERATORS;
    let count = 0;
    
    for (const [name, implementation] of Object.entries(operators)) {
        if (engine.operators && !engine.operators.has(name)) {
            engine.operators.set(name, implementation);
            count++;
        }
    }
    
    console.log(`   🔄 Reactive system registered: ${count} operators`);
    return Object.keys(operators);
}

export default ReactiveSystem;
