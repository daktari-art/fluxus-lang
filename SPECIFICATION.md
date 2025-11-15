### 📄 Updated `SPECIFICATION.md`  
**Fluxus Language Specification v4.1**  
*The Reactive Stream Programming Language for the Real-Time World*

---

> **“Programs are dynamic graphs of time-varying values.”**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Node: ≥18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)  
[![Version: 4.1.0](https://img.shields.io/badge/version-4.1.0-brightgreen)](RELEASE_v4.md)  
[![CI](https://github.com/daktari-art/fluxus-lang/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/daktari-art/fluxus-lang/actions)

---

## 🌊 Core Philosophy

Fluxus treats **all computation as streams of values over time**. Instead of imperative control flow, you declare **reactive dataflow graphs** composed of:

1. **Streams** (`~`, `~?`)  
   - `~`: Finite stream (emits once)  
   - `~?`: Live stream (emits on events: clicks, sensors, timers)

2. **Operators** (`|`)  
   - Pure transformations (`map`, `add`)  
   - Async I/O (`fetch_url`, `hash_sha256`)  
   - Control flow (`split`, `combine_latest`)

3. **Tidal Pools** (`<|>`)  
   - Shared, reactive state  
   - Automatic subscriber propagation

When data changes, the graph **reactively re-executes only what’s needed**.

---

## 🧱 Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│ Intermediate │────▶│    Runtime   │
│ (Lexer, AST, │     │ (IR, Opt.)   │     │ (Engine, VM) │
│  Type Checker)│     └──────────────┘     └──────┬───────┘
└──────────────┘                                 │
                                                 ▼
                                       ┌───────────────────┐
                                       │ Standard Library  │
                                       │  (core, ui, net,  │
                                       │   math, time...)  │
                                       └─────────┬─────────┘
                                                 │
                                       ┌─────────▼─────────┐
                                       │    Packages       │
                                       │ (http, sensors,   │
                                       │  analytics, ...)  │
                                       └───────────────────┘
```

### Key Layers
- **Frontend**: Parsing, AST, analysis (`src/frontend/`)  
- **Intermediate**: IR, optimizer (`src/intermediate/`)  
- **Runtime**: Execution, scheduling (`src/core/engine.js`, `src/runtime/`)  
- **Stdlib**: Built-in operators (`src/stdlib/`, `src/lib/`)  
- **Packages**: Domain extensions (`fluxus_packages/`)  
- **Tooling**: REPL, Debugger, Profiler (`src/cli/`)

---

## 📚 Core Specifications

| Document | Purpose | Status |
|--------|--------|--------|
| [`grammar.bnf`](spec/grammar.bnf) | Formal syntax | ✅ Updated |
| [`semantics.md`](spec/semantics.md) | Execution model | ✅ Updated |
| [`standard-library.md`](spec/standard-library.md) | Operator contracts | ✅ Updated |
| [`typesystem.md`](spec/typesystem.md) | Gradual typing | ✅ Updated |

---

## ✅ Implemented in v4.1

### Reactive Core
- **Non-blocking async execution** (`fetch_url`, `ui_events`)
- **Tidal Pools** with automatic subscriber propagation
- **Branching** via `TRUE_FLOW` / `FALSE_FLOW`
- **Live stream sources** (`~?`) with pluggable adapters

### Standard Library
- `core`: `print`, `to_pool`, `split`, `map`
- `ui`: `ui_events(selector, eventType)`
- `network`: `fetch_url(url, options)`
- `crypto`: `hash_sha256(input)`
- `math`, `string`, `time`: Pure transforms

### Tooling & Ecosystem
- **REPL**: Interactive stream programming
- **Dashboard**: Visualize stream graphs & pool states
- **Profiler**: Metrics, ops/sec, success rate
- **Package System**: `FLOW http` → loads `fluxus_packages/http/`

### Enterprise Features
- **Metrics**: Operator calls, errors, performance
- **Graceful shutdown**: Resource cleanup on exit
- **Configurable**: Log level, execution limits, quiet mode
- **MIT Licensed**: Free for commercial use

---

## 🚀 Roadmap

| Milestone | Status |
|---------|--------|
| Causal debugging & time-travel | 🔄 In progress |
| Full type inference & validation | 📝 Spec ready |
| Distributed stream graphs (edge/cloud) | 🗺️ Planned |
| WASM/FFI integration | 💡 Research |
| Mobile sensor packages (Termux) | ✅ Working |

> See [`ROADMAP.md`](ROADMAP.md) for full details.

---

## 📦 Package Ecosystem

Extend Fluxus with domain-specific operators:
```flux
FLOW http      # REST clients
FLOW sensors   # Device telemetry  
FLOW analytics # Stream aggregation
```

Each package exports an **operator class** compatible with the standard library contract.

---

## 🧠 Tooling Suite

- **REPL**: `npm run repl` — live stream experimentation  
- **Debugger**: Step-through pipeline execution  
- **Profiler**: `engine.metrics` + visual dashboard  
- **Tutorial**: Guided examples in `examples/`

---

## 🤝 Contributing

We welcome contributions! See:
- [`CONTRIBUTING.md`](CONTRIBUTING.md)  
- [`DEVELOPER.md`](DEVELOPER.md)  
- [`operator-compatibility.md`](operator-compatibility.md)

Whether you’re building packages, improving the engine, or writing examples — **your input matters**.

---

> **License**: MIT  
> **Node**: ≥18  
> **Status**: Production-ready core; enterprise extensions in active development  
> **Next**: [Get Started](GETTING_STARTED.md) | [View Examples](examples/)
