# 🛡️ Security Policy for Fluxus Language

The Fluxus Language project takes the security of its code and runtime environment seriously. We appreciate the efforts of security researchers and the community for responsibly disclosing vulnerabilities.

## 報告方法 (Reporting a Vulnerability)

If you discover a security vulnerability in the Fluxus Language core, its tooling, or any official extension, please report it immediately and confidentially.

**Please DO NOT report security issues via public GitHub issues, pull requests, or community forums.**

### 📧 **Direct Reporting**

All security vulnerabilities must be reported directly to the core development team via email:

* **Email:** `security@fluxus-lang.org` (Conceptual Address)
* **Encryption:** If possible, please use PGP/GPG encryption for sensitive reports (Key details can be requested via the same email).

We aim to acknowledge your email within **48 hours** and provide a substantive response within **7 days**.

## 💻 Scope and Supported Versions

We only provide active security support for the latest major release of the Fluxus Language.

| Version | Status | Notes |
| :--- | :--- | :--- |
| **v1.x.x** | **Supported** | All v1.x.x patches are actively maintained and receive security fixes. |
| v0.x.x | Unsupported | All versions prior to the v1.0 reactive paradigm shift are end-of-life. |

If you find a vulnerability in an unsupported version, we still encourage reporting it, but fixes will only be backported to the supported `v1.x.x` branch.

## ⏰ Responsible Disclosure

We follow the principle of responsible disclosure. We ask that you:

1.  Provide enough detail to allow us to reproduce and verify the vulnerability (code, steps, environment).
2.  Allow us a reasonable time to investigate, fix, and prepare a patch before public disclosure. Our target is typically **30-90 days** from initial report, depending on severity.
3.  **Do not disclose the vulnerability publicly** until we have confirmed that the fix has been released to the public.

Upon confirmation and release of the fix, we are happy to publicly credit the researcher for their work, if desired.
