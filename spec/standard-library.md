# Fluxus Standard Library Specification v4.1  
**Enterprise-Grade API Contracts for Reactive Streams**

> _"Operators are the verbs of the Fluxus language."_

---

## Library Architecture

### Modular Design Principles
The Fluxus Standard Library is organized into **namespaced, class-based modules**. Each library:
- Exports a class with static methods
- Implements a standard interface for engine integration
- Contains pure, side-effect-free operators where possible

### Library Registration
Libraries are registered in `src/stdlib/core/operators/index.js` under a namespace:

```js
export const StandardLibrary = {
  core: CoreOperators,
  math: MathOperators,
  string: StringOperators,
  ui: UIOperators,
  // ... others
};
```

Used in Fluxus code via:
```flux
FLOW ui      # Enables ui_events(...)
FLOW network # Enables fetch_url(...)
```

---

## Operator Contract

Every operator must be defined via a **metadata descriptor**:

```js
{
  implementation: Function,       // The actual function (input, ...args) => output
  type: 'source' | 'transform' | 'sink' | 'async',
  description: string,            // Human-readable purpose
  arity: number,                  // Expected number of arguments
  isAsyncSource?: boolean,        // True if operator emits over time (e.g., ui_events)
  sideEffects?: string[],         // e.g., ['network', 'fs', 'ui']
  library: string                 // Namespace (auto-filled by registry)
}
```

### Execution Signatures
- **`transform` / `sink`**: `(input, arg1, arg2, ..., context) => result`  
- **`source`**: `(arg1, arg2, ..., context) => result` (no input)  
- **`async`**: May return `Promise` or an async source descriptor

> ⚠️ **Note**: `context` includes `{ engine, location, stack }` for advanced operators.

---

## Core Libraries

### `core`
- `print`, `to_pool`, `combine_latest`, `split`, `map`
- **Branching**: Implicit `__split_condition` for `TRUE_FLOW`/`FALSE_FLOW`

### `ui`
- `ui_events(selector, eventType)` → **async source**  
  - Requires `engine.setAdapter('ui', adapter)`  
  - Emits event payloads (e.g., `{ value: "text" }`, `{ x: 100, y: 200 }`)

### `network`
- `fetch_url(url, options)` → **async transform**  
  - Returns `{ status_code, headers, body }`

### `crypto`
- `hash_sha256(input)` → **sync transform**

### `math`, `string`, `time`
- Pure, synchronous operators (e.g., `add`, `concat`, `now`)

---

## Domain-Specific Extensions

Libraries can be extended via **packages** in `fluxus_packages/`:
- `http` → REST clients
- `sensors` → Device telemetry
- `analytics` → Stream aggregation

Each package exports an operator class compatible with `StandardLibrary`.

---

## Enterprise Compliance

- **Operator validation**: Runtime checks for arity, type (opt-in)
- **Security gating**: Operators declare `sideEffects`; engine can block based on policy
- **Observability**: All operator calls counted in `engine.metrics.operatorCalls`


> **Next**: See [Semantics](semantics.md) for execution lifecycle, and [Type System](typesystem.md) for validation.
```
