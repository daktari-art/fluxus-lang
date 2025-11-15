// FILENAME: src/stdlib/core/operators/ui/ui_events.js
// Fluxus Standard Library — UI Event Source Operator
// Production-grade, environment-agnostic, async reactive stream
// v1.0 — Designed for world-class general-purpose use

/**
 * Default (no-op) UI adapter.
 * Users MUST register a real adapter via `engine.setUIAdapter(adapter)`.
 */
class DefaultUIAdapter {
  /**
   * Subscribe to a UI event stream.
   * @param {string} selector - DOM-like selector (e.g., 'button#login')
   * @param {string} eventType - Event type (e.g., 'click', 'value')
   * @param {function} onNext - Callback to emit new event data
   * @param {function} onError - Callback for errors
   * @param {AbortSignal} signal - For cancellation (from engine shutdown)
   * @returns {Promise<Function>} Cleanup function
   */
  async subscribe(selector, eventType, onNext, onError, signal) {
    // In real usage, this throws to enforce adapter registration
    // In REPL/test, user can inject a mock adapter
    throw new Error(
      `No UI adapter registered. ` +
      `Call engine.setUIAdapter('ui', yourAdapter) before using ui_events().`
    );
  }
}

/**
 * Global adapter registry (per-engine instance in practice, but static here for simplicity).
 * In full design, this would be stored on the engine instance.
 */
let globalUIAdapter = new DefaultUIAdapter();

/**
 * Sets the UI adapter for all ui_events operators.
 * Should be called once during app initialization.
 * @param {Object} adapter - Must implement `subscribe()` as above.
 */
export function setUIAdapter(adapter) {
  if (typeof adapter?.subscribe !== 'function') {
    throw new TypeError('UI adapter must implement a subscribe(selector, eventType, onNext, onError, signal) method.');
  }
  globalUIAdapter = adapter;
}

/**
 * The ui_events Fluxus operator.
 * Creates a reactive, cancellable stream of UI events.
 *
 * Usage in Fluxus:
 *   ~? ui_events('button#login', 'click')
 *
 * This operator returns a special sentinel that tells the engine:
 * "I am an async source — do not resolve me immediately."
 */
export function ui_events(selector, eventType) {
  // Return a special async source descriptor
  // The engine will handle this in executeInitialReactiveFlows() or a dedicated stream scheduler
  return {
    __isAsyncSource: true,
    sourceType: 'ui_events',
    selector,
    eventType,
    // Executor: provided by engine at runtime
    execute: async (context, nextConnectionId) => {
      const { engine } = context;
      
      return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const { signal } = controller;

        // Handle engine shutdown
        const onEngineShutdown = () => {
          controller.abort();
          resolve(null); // Graceful exit
        };
        engine.once('shutdown', onEngineShutdown);

        const onNext = (eventData) => {
          // Push event into the pipeline
          // Note: In full design, this would schedule async execution of downstream nodes
          engine.executePipelineFromNodeById(nextConnectionId, eventData)
            .catch(err => {
              // Log but don't crash the stream
              if (!engine.config.quietMode) {
                console.warn(`⚠️ UI event pipeline error: ${err.message}`);
              }
            });
        };

        const onError = (error) => {
          engine.metrics.errors++;
          if (!engine.config.quietMode) {
            console.error(`❌ UI event stream error: ${error.message}`);
          }
          reject(error);
        };

        // Start listening
        globalUIAdapter.subscribe(selector, eventType, onNext, onError, signal)
          .then(cleanup => {
            // If signal aborts, cleanup is called automatically in real adapters
            // We resolve only when explicitly stopped (not on every event)
          })
          .catch(err => {
            if (!signal.aborted) {
              onError(err);
            }
          });

        // Note: This promise resolves only when the stream is cancelled
        // In reactive systems, streams often live forever — so this is expected
      });
    }
  };
}

// Register metadata for the engine's operator registry
export const operatorMetadata = {
  name: 'ui_events',
  arity: 2,
  isAsyncSource: true,
  description: 'Creates a reactive stream from UI events (e.g., clicks, input changes). Requires a UI adapter.',
  library: 'ui'
};
