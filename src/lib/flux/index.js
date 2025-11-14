// FILENAME: src/lib/flux/index.js
// Flux Architecture Utilities - Production Grade

export class FluxStore {
    constructor(reducer, initialState = {}) {
        this.state = initialState;
        this.reducer = reducer;
        this.listeners = new Set();
        this.isDispatching = false;
        this.actionHistory = [];
        this.maxHistorySize = 100;
    }

    getState() {
        if (this.isDispatching) {
            throw new Error('Cannot get state while dispatching');
        }
        return this.state;
    }

    dispatch(action) {
        if (this.isDispatching) {
            throw new Error('Cannot dispatch while already dispatching');
        }

        if (typeof action === 'function') {
            return action(this.dispatch.bind(this), this.getState.bind(this));
        }

        if (!action || !action.type) {
            throw new Error('Actions must have a type property');
        }

        try {
            this.isDispatching = true;
            const previousState = this.state;
            this.state = this.reducer(previousState, action);
            
            // Record action in history
            this.actionHistory.push({
                action,
                timestamp: Date.now(),
                previousState,
                nextState: this.state
            });
            
            // Limit history size
            if (this.actionHistory.length > this.maxHistorySize) {
                this.actionHistory.shift();
            }

        } finally {
            this.isDispatching = false;
        }

        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Store listener error:', error);
            }
        });

        return action;
    }

    subscribe(listener) {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }

        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    replaceReducer(nextReducer) {
        this.reducer = nextReducer;
        this.dispatch({ type: '@@flux/REPLACE' });
    }

    getActionHistory() {
        return [...this.actionHistory];
    }

    clearHistory() {
        this.actionHistory = [];
    }

    // Time travel debugging
    timeTravel(stepsBack = 1) {
        if (stepsBack <= 0 || stepsBack > this.actionHistory.length) {
            throw new Error('Invalid time travel steps');
        }

        const targetIndex = this.actionHistory.length - stepsBack;
        const targetState = this.actionHistory[targetIndex].previousState;
        
        this.state = targetState;
        this.actionHistory = this.actionHistory.slice(0, targetIndex);
        
        // Notify listeners of state change
        this.listeners.forEach(listener => listener());
    }
}

export class FluxActions {
    constructor() {
        this.actions = new Map();
        this.actionCreators = new Map();
    }

    defineAction(type, creator, validator = null) {
        if (this.actions.has(type)) {
            throw new Error(`Action already defined: ${type}`);
        }

        this.actions.set(type, { 
            type, 
            creator, 
            validator,
            definedAt: Date.now()
        });
        
        if (creator) {
            this.actionCreators.set(type, creator);
        }

        return type;
    }

    createAction(type, ...args) {
        const actionDef = this.actions.get(type);
        if (!actionDef) {
            throw new Error(`Unknown action type: ${type}`);
        }

        let action;
        if (actionDef.creator) {
            action = actionDef.creator(...args);
        } else {
            action = { type, payload: args[0] };
        }

        // Validate action if validator provided
        if (actionDef.validator) {
            const validation = actionDef.validator(action);
            if (!validation.valid) {
                throw new Error(`Action validation failed: ${validation.error}`);
            }
        }

        return action;
    }

    isAction(action) {
        return action && 
               typeof action === 'object' && 
               'type' in action &&
               typeof action.type === 'string';
    }

    validateAction(action) {
        if (!this.isAction(action)) {
            return { valid: false, error: 'Not a valid action object' };
        }

        const actionDef = this.actions.get(action.type);
        if (!actionDef) {
            return { valid: false, error: `Unknown action type: ${action.type}` };
        }

        if (actionDef.validator) {
            return actionDef.validator(action);
        }

        return { valid: true, action };
    }

    getDefinedActions() {
        return Array.from(this.actions.keys());
    }
}

export function combineReducers(reducers) {
    const reducerKeys = Object.keys(reducers);
    
    return (state = {}, action) => {
        let hasChanged = false;
        const nextState = {};

        for (const key of reducerKeys) {
            const reducer = reducers[key];
            const previousStateForKey = state[key];
            const nextStateForKey = reducer(previousStateForKey, action);
            
            nextState[key] = nextStateForKey;
            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }

        hasChanged = hasChanged || reducerKeys.length !== Object.keys(state).length;
        
        return hasChanged ? nextState : state;
    };
}

export function createMiddleware(...middlewares) {
    return (store) => (next) => (action) => {
        const middlewareAPI = {
            getState: store.getState.bind(store),
            dispatch: (action, ...args) => store.dispatch(action, ...args)
        };

        const chain = middlewares.map(middleware => middleware(middlewareAPI));
        const dispatch = compose(...chain)(next);

        return dispatch(action);
    };
}

function compose(...funcs) {
    if (funcs.length === 0) {
        return arg => arg;
    }

    if (funcs.length === 1) {
        return funcs[0];
    }

    return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

// Built-in middleware
export const loggerMiddleware = (store) => (next) => (action) => {
    const startTime = Date.now();
    
    console.group(`🔀 Action: ${action.type}`);
    console.log('📋 Action:', action);
    console.log('📜 Previous State:', store.getState());
    
    const result = next(action);
    
    console.log('📊 Next State:', store.getState());
    console.log(`⏱️  Duration: ${Date.now() - startTime}ms`);
    console.groupEnd();
    
    return result;
};

export const thunkMiddleware = (store) => (next) => (action) => {
    if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
    }
    
    return next(action);
};

export const crashReporterMiddleware = (store) => (next) => (action) => {
    try {
        return next(action);
    } catch (error) {
        console.error('💥 Redux crash reporter:', error);
        console.error('🔍 Action that caused error:', action);
        console.error('📊 State when error occurred:', store.getState());
        throw error;
    }
};

export const analyticsMiddleware = (tracker = console.log) => (store) => (next) => (action) => {
    const result = next(action);
    
    // Track action for analytics
    tracker('action_dispatched', {
        type: action.type,
        timestamp: Date.now(),
        state: store.getState()
    });
    
    return result;
};

// Utility functions
export function createStore(reducer, preloadedState, enhancer) {
    if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
        enhancer = preloadedState;
        preloadedState = undefined;
    }

    if (typeof enhancer !== 'undefined') {
        if (typeof enhancer !== 'function') {
            throw new Error('Expected the enhancer to be a function');
        }

        return enhancer(createStore)(reducer, preloadedState);
    }

    if (typeof reducer !== 'function') {
        throw new Error('Expected the reducer to be a function');
    }

    return new FluxStore(reducer, preloadedState);
}

export function bindActionCreators(actionCreators, dispatch) {
    const boundActionCreators = {};

    for (const key in actionCreators) {
        const actionCreator = actionCreators[key];
        
        if (typeof actionCreator === 'function') {
            boundActionCreators[key] = (...args) => dispatch(actionCreator(...args));
        }
    }

    return boundActionCreators;
}

export function applyMiddleware(...middlewares) {
    return (createStore) => (reducer, preloadedState) => {
        const store = createStore(reducer, preloadedState);
        let dispatch = () => {
            throw new Error('Dispatching while constructing middleware is not allowed');
        };

        const middlewareAPI = {
            getState: store.getState,
            dispatch: (action, ...args) => dispatch(action, ...args)
        };

        const chain = middlewares.map(middleware => middleware(middlewareAPI));
        dispatch = compose(...chain)(store.dispatch);

        return {
            ...store,
            dispatch
        };
    };
}

// Flux-specific utilities
export class FluxDispatcher {
    constructor() {
        this.callbacks = new Map();
        this.isDispatching = false;
        this.isHandled = new Map();
        this.isPending = new Map();
        this.lastID = 1;
    }

    register(callback) {
        const id = `ID_${this.lastID++}`;
        this.callbacks.set(id, callback);
        return id;
    }

    unregister(id) {
        if (!this.callbacks.has(id)) {
            throw new Error(`Callback ${id} does not exist`);
        }
        this.callbacks.delete(id);
    }

    dispatch(payload) {
        if (this.isDispatching) {
            throw new Error('Cannot dispatch in the middle of a dispatch');
        }

        this._startDispatching(payload);

        try {
            for (const [id, callback] of this.callbacks) {
                if (this.isPending.get(id)) {
                    continue;
                }
                
                this._invokeCallback(id, callback, payload);
            }
        } finally {
            this._stopDispatching();
        }
    }

    _startDispatching(payload) {
        for (const [id] of this.callbacks) {
            this.isPending.set(id, false);
            this.isHandled.set(id, false);
        }
        this.isDispatching = true;
    }

    _stopDispatching() {
        this.isDispatching = false;
    }

    _invokeCallback(id, callback, payload) {
        this.isPending.set(id, true);
        callback(payload);
        this.isHandled.set(id, true);
    }

    isDispatching() {
        return this.isDispatching;
    }

    waitFor(ids) {
        if (!this.isDispatching) {
            throw new Error('Must be invoked while dispatching');
        }

        for (const id of ids) {
            if (this.isPending.get(id)) {
                if (!this.isHandled.get(id)) {
                    throw new Error(`Circular dependency detected while waiting for ${id}`);
                }
                continue;
            }

            const callback = this.callbacks.get(id);
            if (!callback) {
                throw new Error(`Callback ${id} does not exist`);
            }

            this._invokeCallback(id, callback, this.pendingPayload);
        }
    }
}

export default {
    FluxStore,
    FluxActions,
    FluxDispatcher,
    combineReducers,
    createMiddleware,
    createStore,
    bindActionCreators,
    applyMiddleware,
    loggerMiddleware,
    thunkMiddleware,
    crashReporterMiddleware,
    analyticsMiddleware
};
