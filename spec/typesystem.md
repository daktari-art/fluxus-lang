### 📄 Updated `spec/typesystem.md`  
**Fluxus Type System Specification v4.1**  
*Gradual, Stream-Aware Typing for Reactive Programs*

---

#### **Type System Overview**

##### **Design Philosophy**
Fluxus adopts **pragmatic gradual typing**:
- **Dynamic by default**: No type annotations required; full runtime flexibility  
- **Static where needed**: Optional type contracts for operators, pools, and streams  
- **Zero-cost in production**: Type checks disabled by default; enabled only in dev/test  
- **Stream-aware**: Types model time-varying values, not just static data

> 🔹 **v4.1 Reality**: The engine is **dynamically typed**. This spec defines the **foundation for optional validation** in tooling (REPL, linter, debugger).

---

#### **Core Type Hierarchy**

| Type | Description | Examples |
|------|-------------|---------|
| `Any` | Universal supertype (default) | `42`, `"text"`, `{}` |
| `Prim` | Primitives | `String`, `Number`, `Boolean`, `Null` |
| `Object` | Structured data | `{ user: "admin", count: 5 }` |
| `Stream<T>` | Time-varying value of type `T` | `~? ui_events(...) → Stream<Event>` |
| `Pool<T>` | Reactive container holding `T` | `let auth = <|> { status: "out" } → Pool<AuthState>` |

> ⚠️ **Note**: `Stream` and `Pool` are **logical types** — not runtime constructs. They exist in specs and tooling only.

---

#### **Operator Type Signatures**

Every operator **should** declare input/output types (enforced in dev tools):

```js
// Example: fetch_url
{
  name: 'fetch_url',
  inputType: 'String',          // URL
  argsTypes: ['String', 'Object?'], // [url, options?]
  outputType: 'HttpResponse',   // { status_code: Number, body: Any }
  sideEffects: ['network']
}
```

**Validation Rules** (optional, for linter):
- Mismatched types → warning (not error)
- Missing types → assume `Any`

---

#### **Stream & Pool Type Propagation**

- **Streams**: Type inferred from source  
  ```flux
  ~ "hello"          → Stream<String>
  ~? ui_events(...)  → Stream<Event>
  ```
- **Pools**: Type fixed at declaration  
  ```flux
  let counter = <|> 0        → Pool<Number>
  let user = <|> { name: "" } → Pool<Object>
  ```
- **Operators**: Preserve or transform types  
  ```flux
  counter -> add(1)     → Number
  user -> .name         → String
  ```

---

#### **Reactive Type Safety**

- **Pool Subscriptions**:  
  Subscriber expects same type as pool:  
  ```flux
  counter -> print("Count: " | concat(.))  // OK: Number → String
  auth_state -> ui_render(...)             // OK: Object → UI
  ```
- **Branching**:  
  Both branches must return **compatible types** (enforced by type checker):  
  ```flux
  | split { .status == 200 }
  | TRUE_FLOW | map { "success" }   → String
  | FALSE_FLOW | map { "error" }    → String ✅
  ```

---

#### **Type Validation Rules (Tooling Only)**

| Rule | Dev Mode | Production |
|------|--------|-----------|
| Operator arity check | ✅ Warning | ❌ Skipped |
| Type mismatch | ✅ Warning | ❌ Skipped |
| Undefined pool | ✅ Error | ❌ Runtime error |
| Unhandled async | ✅ Warning | ❌ Silent fail |

> 🔹 **Engine Behavior**: **No runtime type checks** in v4.1. Safety comes from testing + tooling.

---

#### **Advanced Features (Future)**

- **Type Annotations** (v5.0):  
  ```flux
  let counter: Number = <|> 0
  ```
- **Generic Operators**:  
  `map<T>(fn: (T) → U) → Stream<U>`
- **Flow-Sensitive Typing**:  
  After `split`, `TRUE_FLOW` narrows type to `{ status: 200, body: UserData }`

---

#### **Enterprise Compliance**

- **Mobile-Optimized**: Type metadata stripped in production bundles  
- **Observability**: Type errors reported in `engine.metrics.warnings` (dev only)  
- **Interoperability**: FFI boundaries require explicit type contracts

---

> **Next**: See [Standard Library](standard-library.md) for operator contracts, and [Semantics](semantics.md) for execution model.


