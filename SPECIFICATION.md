# Fluxus Language Specification v1.0

## 🎯 Core Philosophy: Stream-Centric Execution

Fluxus is a **Reactive Stream Language**. A program is a directed graph where data flows along **Streams** (`~`), through **Operators** (`|`), and commits to **Tidal Pools** (`<|>`). Execution is non-sequential; it is driven entirely by asynchronous events.

---

## 1. Fundamental Elements (The Core Symbols)

| Symbol | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| **`~`** | **Stream Source (Data)** | Initializer | Starts a finite stream (emits value(s) and completes). |
| **`~?`** | **Stream Source (Live)** | Initializer | Starts a continuous, time-aware stream (e.g., clock, user input). |
| **`|`** | **Pipe Operator** | Connector | The universal connector. Passes the output of the preceding element as the primary input to the next operator. |
| **`{}`** | **The Lens** | Transformation | A block for compact, pure functional logic (map, filter conditions). |
| **`<|>`** | **Tidal Pool** | State | Declares a named, mutable state container (the only mutable data allowed). |
| **`->`** | **Pool Read/Flow Start** | Trigger | Reads a pool's value and **starts a new reactive flow** that re-runs when the pool changes. |
| **`| to_pool()`** | **Pool Write (Commit)** | Sink | The explicit operator used to commit the final value of a stream into a Tidal Pool. |

---

## 2. Program Structure

A Fluxus program is a set of zero or more **`FLOW`** imports, followed by state declarations, and finally, one or more **Stream Pipelines**.

### A. Library Imports

The `FLOW` keyword makes external functionality available as operators or stream sources.

```fluxus
FLOW network      # Imports 'fetch_url', 'websocket_stream'
FLOW ui           # Imports 'ui_events', 'ui_render'
FLOW math         # Imports 'sin', 'cos', 'sq', 'sqrt'

B. State Declaration (Tidal Pool)
Pools are globally accessible state containers that must be declared with an initial value.
let app_config = <|> { theme: 'dark', log_level: 2 }
let active_users = <|> []

C. Functions and Blocks (FUNC)
A function is a named, reusable stream transformation that receives inputs and must exit to the RESULT sink.
FUNC clean_and_hash (raw_text: String):
    ~ raw_text
    | map { .trim | .to_lower }
    | hash_sha256()
    | RESULT # The stream's final output is the function's return value

D. The Pipeline Syntax
A stream pipeline is a sequence of a Source, one or more Operators, and a final Sink.
# SOURCE (Live) -> OPERATOR (Filter) -> OPERATOR (Map/Lens) -> SINK (Print)
~? clock_ms(1000) 
| filter { .value % 2 == 0 } 
| map { .value | * 10 } 
| print() 

3. Standard Library Operators (Built-in)
These operators are always available and do not require a FLOW statement.
| Category | Operator | Inputs | Description |
|---|---|---|---|
| Control | map | Stream, Lens {} | Transforms every value in the stream using the Lens logic. |
| Control | filter | Stream, Lens {} | Passes only values that satisfy the Lens condition (true). |
| Control | debounce | Stream, ms | Emits a value only if the stream has been silent for ms milliseconds. |
| Control | throttle | Stream, ms | Emits a value at most once every ms milliseconds. |
| Control | split | Stream, Lens {} | Forks the stream into a TRUE_FLOW and a FALSE_FLOW. |
| Combination | combine_latest | Stream, Pool(s) | Merges the trigger stream with the latest values from other pools/streams. |
| I/O | print() | Stream | Outputs the current stream value to the console (a terminal sink). |
| I/O | to_pool() | Stream, Pool | Commits the stream's result to the specified Tidal Pool (a terminal sink). |
4. Control Flow and Branching
Conditional Branching
The split operator is used to route data based on a condition, replacing traditional if/else logic.
~ user_data 
| validate_input() 
| split { .is_valid } 

| TRUE_FLOW 
| save_to_db()

| FALSE_FLOW 
| print_error('Validation failed.')

