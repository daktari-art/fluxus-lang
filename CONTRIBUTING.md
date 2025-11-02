# 🤝 Contributing to Fluxus Language

We welcome contributions of all kinds to the Fluxus Language project—from fixing typos to implementing major new stream operators. Your effort helps build a powerful, stable, and intuitive reactive programming ecosystem.

## 🚀 Getting Started

### 1. Set up your Environment

1.  **Fork** the `fluxus-lang/fluxus-lang` repository on GitHub.
2.  **Clone** your fork locally:
    ```bash
    git clone [https://github.com/daktari-art/fluxus-lang.git](https://github.com/daktari-art/fluxus-lang.git)
    cd fluxus-lang
    ```
3.  **Install dependencies** (assuming Node.js 18+):
    ```bash
    npm install
    ```

### 2. Run the Test Suite

Before making any changes, ensure all tests pass on your machine.
```bash
npm test
# You should see: Tests Passed: [X]/[Y]

3. Development Commands
Use the CLI commands defined in package.json for development:
| Command | Purpose |
|---|---|
| npm start | Runs the main CLI entry point. |
| fluxus run <file.flux> | Executes a specific Fluxus source file. |
| fluxus repl | Starts the interactive read-eval-print loop for quick testing. |
| npm run dev | Watches an example file for changes and auto-reloads the execution. |
🛠️ Contribution Guidelines
Code Contributions (Operators & Core)
 * Reactive First: All new features must adhere to the Reactive Paradigm. Avoid mutable state outside of a designated Tidal Pool (<|>).
 * Pipeline Integrity: Operators must receive data via the pipe (|) and emit data out. Do not use global side effects unless the operator is explicitly a Sink (e.g., | print(), | to_pool()).
 * Asynchronous: Design operators to be non-blocking. If an operation takes time (network, disk I/O), it must be wrapped in an Asynchronous Stream primitive managed by the engine.
 * Testing: Every new operator or bug fix requires a corresponding test case added to the test/ directory to prevent regressions.
Documentation Contributions
Documentation lives in the .md files in the root and should be:
 * Clear and Concise: Emphasize the stream concepts (~, |, <|>).
 * Syntax Specific: Use correct Fluxus syntax in all examples.
Submitting Changes
 * Create a new branch for your feature or fix (e.g., feature/add-debounce-operator).
 * Commit your changes following the Conventional Commits standard (e.g., feat: implement new debounce operator).
 * Push your branch to your fork.
 * Open a Pull Request (PR) against the main branch of fluxus-lang/fluxus-lang.
Please describe your changes clearly in the PR description and reference any related issues.

