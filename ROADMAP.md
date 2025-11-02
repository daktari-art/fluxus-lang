# 🗺️ Fluxus Language Development Roadmap

## 🎯 Vision

To create the industry standard for asynchronous and reactive stream processing, providing an auditable, non-blocking, and high-performance execution environment for all event-driven applications (Web, IoT, and Cloud).

---

## ✅ **Phase 1: Reactive Foundation (v1.0.0)** - *Completed Nov 2025*

This phase focused on the core language paradigm shift from Glyph's graph execution to Fluxus's time-aware, reactive stream model.

* **[x] New Syntax:** Full adoption of the stream (`~`, `~?`), pipe (`|`), and pool (`<|>`) syntax.
* **[x] Core Operators:** Implementation of `map`, `filter`, `combine_latest`, and `split`.
* **[x] Tidal Pool Engine:** Stable implementation of the state management primitive (`<|>`) and its reactive subscription mechanism (`->`).
* **[x] Asynchronous Handling:** Built-in management of asynchronous operations (`| fetch_url`) without requiring explicit `async/await` syntax.
* **[x] CLI and Examples:** Rebranded CLI (`fluxus`) and core examples (`login.flux`).

---

## ⏳ **Phase 2: Tooling and Expansion (v1.1.0 - Q1 2026)**

This phase focuses on developer experience, robust error handling, and making Fluxus a practical choice for large-scale applications.

### 🛠️ Key Initiatives (Q1 2026)

* **[ ] Hot-Swap Logic:** Implement the ability to dynamically update and replace a running Fluxus pipeline without interrupting the Live Streams (`~?`).
* **[ ] Type-Aware Lenses:** Extend the Lens syntax (`{}`) to enforce explicit type checking on stream data, significantly reducing runtime errors.
* **[ ] Comprehensive Error Stream:** Define a standard error object format and enhance the `| split` operator to handle structured error types directly, simplifying error recovery flows.
* **[ ] Local Storage Flow (`FLOW local_db`):** Implement stable, reactive operators for IndexedDB/SQLite persistence (`| local_db_read`, `| local_db_write`).

---

## 📈 **Phase 3: High Performance and Community (v2.0.0 - Q3 2026)**

The goal of v2.0 is to establish Fluxus as a top-tier performer and foster a strong ecosystem.

* **[ ] Compiler Optimization:** Develop a dedicated compiler pass to optimize long stream chains and merge unnecessary `map` operators, targeting near-native stream performance.
* **[ ] Visual Debugger:** A web-based tool that visualizes the stream flow, highlighting active pools and showing the value history of every pipe for unmatched debugging clarity.
* **[ ] External Package System:** Finalize the `FLOW` system to allow community packages to be installed and integrated seamlessly (`fluxus install @package/utils`).
* **[ ] Fluxus Standard Library:** Define and implement a comprehensive set of non-blocking utility operators (e.g., `rate_limit`, `retry`, `buffer_time`).
