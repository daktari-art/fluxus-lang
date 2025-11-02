# 🏛️ Fluxus Language Project Governance

This document outlines the governance model for the Fluxus Language project, defining roles, responsibilities, and decision-making processes.

## 1. Roles and Responsibilities

The project utilizes a clear hierarchy designed for efficiency, transparency, and accountability, focusing on maintaining the integrity of the Reactive Stream paradigm.

### A. Project Lead (Maintainer)

The Project Lead is the primary decision-maker and strategic director of the project.

* **Current Lead:** daktari-art
* **Responsibilities:**
    * Set the overall project vision and direction (Roadmap).
    * Final authority on technical architecture and core syntax changes.
    * Manage and mentor Core Contributors.
    * Oversee the release process (versioning and packaging).
    * Handle security disclosures and Code of Conduct enforcement.

### B. Core Contributors

Core Contributors are individuals who have demonstrated a long-term commitment to the project, possessing write access to the repository.

* **Responsibilities:**
    * Review and merge routine Pull Requests (PRs).
    * Contribute major features, bug fixes, and documentation.
    * Participate in all major design discussions.
    * Maintain the health and stability of specific components (e.g., CLI, Runtime, Compiler).

### C. Community Contributors

Community Contributors are any individuals who submit code, documentation, bug reports, or proposals.

* **Responsibilities:**
    * Adhere to the `CONTRIBUTING.md` guidelines.
    * Provide feedback on proposed features and specifications.

## 2. Decision Making Process

Decisions are made based on consensus among Core Contributors, with the Project Lead having the final authority in cases of deadlock or time-critical situations.

### A. Code Changes (Pull Requests)

1.  **Small Fixes/Features:** Require **one** Core Contributor approval (`+1`).
2.  **Major Features/Architecture:** Require **two** Core Contributor approvals (`+2`) or an explicit approval from the Project Lead.
3.  **Core Syntax/Spec Changes:** Must be approved through a **Formal Proposal** process.

### B. Formal Proposals (FLPs)

For changes affecting the core language specification, syntax, or major tooling, a Fluxus Language Proposal (FLP) is required.

1.  **Draft:** A Core Contributor submits a proposal document to the `proposals/` directory.
2.  **Discussion:** The proposal is discussed publicly via GitHub Issues for a minimum of 7 days.
3.  **Vote:** Core Contributors vote on the proposal. A simple majority (51%) of all Core Contributors is required for approval.
4.  **Adoption:** Upon approval, the FLP is merged, and implementation begins under the guidance of the Project Lead.
