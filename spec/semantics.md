### 📄 Updated `spec/semantics.md`  
**Fluxus Execution Semantics Specification v4.1**  
*Enterprise-Grade Reactive Stream Semantics*

---

#### **Execution Model Overview**

Fluxus executes programs as **reactive dataflow graphs** where nodes are operators and edges are value streams. Execution is **asynchronous, non-blocking, and pull-driven**: downstream nodes activate only when upstream data arrives.

The `RuntimeEngine` orchestrates:
- Finite stream execution (fire-and-forget)
- Reactive stream subscription (long-lived)
- Pool state propagation (reactive updates)
- Graceful shutdown with resource cleanup

---

#### **Stream Semantics**

##### **Stream Types**
| Type | Syntax | Behavior |
|------|--------|--------|
| **Finite Stream** | `~ value` | Emits once, then completes |
| **Reactive Stream** | `~? source(...)` | Long-lived; emits on external events (e.g., UI clicks) |

##### **Lifecycle**
- **Finite streams**: Executed immediately at startup via `runFiniteStreams()`  
- **Reactive streams**: Subscribed at startup (`executeInitialReactiveFlows()`), but **do not emit until events occur**  
- **Subscription**: Triggered by connections in the AST; no emission without downstream consumers

> 🔹 **Key Rule**: Streams are **lazy** — no work is done unless connected to a sink (`print`, `to_pool`, `ui_render`).

---

#### **Reactive Semantics**

##### **Tidal Pools (`<|>`)**
- Pools are **reactive state containers** with:
  - Current `value`
  - Immutable `history` (append-only)
  - Set of `subscriptions` (callbacks)
- **Update Protocol**:
  1. `to_pool(pool)` sets new value
  2. Engine appends to `history`
  3. **All subscribers are invoked synchronously** with new state
  4. Subscribers trigger downstream pipeline execution

##### **Pool Subscriptions**
- Defined as: `pool_name -> operator(...)`  
- Converted to `POOL_SUBSCRIPTION` AST nodes  
- Executed **immediately on program start** (with initial pool value)  
- Re-executed **on every pool update**

> 🔹 **Guarantee**: Pool updates are **atomic and ordered**; no partial state visible.

---

#### **Branching Semantics**

##### **Split & Flow Control**
- `split { condition }` evaluates condition and attaches `__split_condition: boolean` to output  
- **`TRUE_FLOW`**: Executes only if `__split_condition === true`  
- **`FALSE_FLOW`**: Executes only if `__split_condition === false`  
- Branches **reconverge** at the first non-operator node after the branch

> 🔹 **Engine Behavior**: Branch resolution is handled in `executePipelineFromNode()`; mismatched branches skip execution until reconvergence.

---

#### **Memory Management**

- **Pools**: Retain full `history` by default (for debugging); truncation via GC in future  
- **Streams**: Finite streams auto-clean on completion; reactive streams cleaned on `shutdown()`  
- **Shutdown Protocol**:
  1. Engine emits `'shutdown'` event
  2. Adapters (e.g., UI, network) clean listeners
  3. All state (`pools`, `operators`, `ast`) cleared

> 🔹 **No GC yet**: Memory safety relies on proper shutdown; advanced GC in `v5.0`.

---

#### **Error Handling**

- **Per-Operator**: Errors caught in `createOperatorWrapper`, increment `metrics.errors`  
- **Pipeline-Level**: Failed finite streams return `null`; reactive streams log but persist  
- **Program-Level**: 
  - Errors **do not stop** other streams (isolated failure)
  - Final report: `Program completed with errors` if `metrics.errors > 0`

> 🔹 **Recovery**: Not supported in v4; all errors are fatal to their pipeline.

---

#### **Concurrency Model**

- **Single-threaded**: All execution on JS event loop  
- **Async Operators**: Integrated via `await` (e.g., `fetch_url` yields to event loop)  
- **Parallelism**: 
  - Finite streams: `Promise.all()` for concurrent execution
  - Reactive streams: Event-driven, non-blocking
- **No Data Races**: Pools updated synchronously; streams never share mutable state

---

#### **Performance Guarantees**

| Feature | Guarantee |
|--------|----------|
| **Max Steps** | `config.maxExecutionSteps` prevents infinite loops |
| **Metrics** | Operator calls, errors, ops/sec tracked by default |
| **Startup** | All finite streams complete before reactive streams initialize |
| **Shutdown** | Always called (unless REPL mode); cleans all resources |

---

#### **Enterprise Compliance**

- **Observability**: Full metrics exported via `engine.metrics`  
- **Security**: No sandboxing in v4; operators run with host privileges  
- **Reliability**: Async flows `await` all finite work before shutdown  
- **Portability**: Engine runs in any JS environment (Node ≥18, browsers, Deno)

>**Next**: See [Type System](typesystem.md) for validation, and [Standard Library](standard-library.md) for operator contracts.

