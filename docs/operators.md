
Fluxus Operator Reference

Fluxus operators are modular, composable functions that transform, combine, or emit reactive streams. They can be built-in or defined via packages in fluxus_packages/.

---

🧩 Operator Contract Format

Each operator must follow this structure:



---

🔀 Operator Types

| Type            | Description                                 |
|-----------------|---------------------------------------------|
| stream-source   | Emits data into the stream (e.g., sensors)  |
| transformation  | Modifies or combines stream data            |
| sink            | Consumes or stores stream data              |

---

🛠️ Built-in Operators

| Name         | Type           | Description                          |
|--------------|----------------|--------------------------------------|
| add        | transformation | Adds two numbers                     |
| subtract   | transformation | Subtracts one number from another    |
| to_pool    | sink           | Stores value in named pool           |
| print      | sink           | Outputs value to console             |

---

📦 Package Operators

debounce



- Type: transformation
- Description: Emits only after input has stopped changing for N ms
- Use case: UI events, sensor noise reduction

---

combine_latest



- Type: transformation
- Description: Emits combined value when either input updates
- Use case: Login validation, multi-sensor fusion

---

fetch_url



- Type: transformation
- Description: Performs HTTP GET and emits response
- Use case: Network integration, cloud sync

---

split



- Type: transformation
- Description: Branches stream into TRUEFLOW and FALSEFLOW
- Use case: Error handling, conditional logic

---

retry_after



- Type: transformation
- Description: Waits and retries after delay
- Use case: Network resilience, user retry flows

---

🧪 Custom Operators

You can define your own operators in any package. Example:



---

📁 Operator Discovery

Operators are auto-loaded from installed packages. Use the REPL to list available operators:

CODE_OF_CONDUCT.md
CONTRIBUTING.md
DEVELOPER.md
GETTING_STARTED.md
GOVERNANCE.md
LICENSE
README.md
ROADMAP.md
ROADMAP_UPDATED.md
SECURITY.md
SPECIFICATION.md
bin
doc
docs
examples
fluxus_packages
install.js
package-lock.json
package.json
src
test-run.js
CODE_OF_CONDUCT.md
CONTRIBUTING.md
DEVELOPER.md
GETTING_STARTED.md
GOVERNANCE.md
LICENSE
README.md
ROADMAP.md
ROADMAP_UPDATED.md
SECURITY.md
SPECIFICATION.md
bin
doc
docs
examples
fluxus_packages
install.js
package-lock.json
package.json
src
test-run.js
CODE_OF_CONDUCT.md
CONTRIBUTING.md
DEVELOPER.md
GETTING_STARTED.md
GOVERNANCE.md
LICENSE
README.md
ROADMAP.md
ROADMAP_UPDATED.md
SECURITY.md
SPECIFICATION.md
bin
doc
docs
examples
fluxus-lang
fluxus_packages
install.js
package-lock.json
package.json
src
test-run.js
fluxus-lang
storage

Or inspect a specific one:



---

📚 See Also

- docs/spec.md: Full implementation roadmap
- fluxus_packages/: Package source code
- examples/: Real-world usage demos

