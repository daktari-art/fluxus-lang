# 🗺️ Fluxus Language Development Roadmap

## 🎯 Vision
To create the industry standard for asynchronous and reactive stream processing.

---

## ✅ **Phase 1: Core Foundation (v1.0.0 - CURRENT)**
* [x] Basic stream syntax (`~`, `|`, `<|>`, `->`)
* [x] Arithmetic & string operators
* [x] Map/reduce operations  
* [x] Basic REPL and CLI
* [ ] **MISSING: combine_latest, split, TRUE_FLOW, FALSE_FLOW**
* [ ] **MISSING: Time-based operators (debounce, throttle)**

---

## 🚀 **Phase 1.5: Real Stream Processing (IMMEDIATE)**
* [ ] Implement `debounce(ms)` - essential for UI events
* [ ] Implement `throttle(ms)` - prevent overload
* [ ] Implement `delay(ms)` - timing control
* [ ] Fix `combine_latest` - stream + pool combination
* [ ] Fix `split` + `TRUE_FLOW`/`FALSE_FLOW` - conditional routing
* [ ] Add `filter(condition)` - data filtering

---

## ⏳ **Phase 2: Error Handling & Types (v1.1.0)**
* [ ] Structured error streams
* [ ] Type-aware lenses  
* [ ] Hot-swap logic
* [ ] Local storage flow

---

## 📈 **Phase 3: Performance & Ecosystem (v2.0.0)**
* [ ] Compiler optimizations
* [ ] Visual debugger
* [ ] Package system
* [ ] Standard library
