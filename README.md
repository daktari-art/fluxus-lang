# 🌊 Fluxus Language

> **The Reactive Stream Programming Language** - Where programs are non-blocking, time-aware streams, and complexity is simplified by data flow.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)](https://github.com/fluxus-lang/fluxus-lang)
[![Fluxus CI Status](https://github.com/daktari-art/fluxus-lang/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/daktari-art/fluxus-lang/actions/workflows/ci.yml)

Fluxus is a revolutionary data flow language built on the principle of **Reactive Programming**. Instead of writing sequential code, you define relationships between streams of data. When one piece of data changes, the entire system **reacts** automatically.

---

## 🚀 Core Philosophy

The Fluxus program is a dynamic graph composed of three unified components:

### 1. Streams (`~` and `~?`)
Every piece of data is an event over time.
* **`~`**: A one-off stream that emits a value and completes.
* **`~?`**: A **Live Stream** (e.g., a clock, button clicks) that never completes.

### 2. Pipes and Operators (`|`)
Data transformations are defined by the pipe operator (`|`). This enforces a clean flow, ensuring the output of one step is the sole input to the next.

### 3. Tidal Pools (`<|>`)
This is the controlled mechanism for **shared, mutable state**. A Tidal Pool holds the application state, and anything that reads from it automatically becomes a **reactive subscriber** that re-runs when the pool changes.

---

## 💡 Quick Start: A Reactive Counter

This simple program shows how a button click (`~?`), state management (`<|>`), and stream transformation (`|`) work together to automatically update a UI element.

```fluxus
# 1. State: Declare a Tidal Pool for the counter's value.
let counter = <|> 0 

# 2. Source: Start a Live Stream on button clicks.
~? ui_events('button#increment', 'click') 

# 3. Operator: Read the current value of the pool, add 1, and commit the result.
# The `counter -> add(1)` operation uses the current pool value as input.
| map { counter -> add(1) } 
| to_pool(counter) 

# 4. Sink: The UI element is a subscriber to the counter pool.
# This entire line automatically runs every time the 'counter' pool changes.
counter -> ui_render('#display_div')

🛠️ Getting Started
 * Installation (Node.js required):
   npm install -g @fluxus-lang/core

 * Run an example:
   fluxus run examples/login.flux

Full documentation is available in the SPECIFICATION.md.

