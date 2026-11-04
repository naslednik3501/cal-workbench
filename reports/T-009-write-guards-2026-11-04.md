# T-009: fixture-free write guard test

Agent: perplexity-ui-audit-20261104. Branch: task/T-009-perplexity-ui-audit. Application baseline: 25918dfbb2719190731b739e9bdca127baa0f69a.

Scope: only a new test and this report; no runtime, source data, catalog, manifest or other agent branch changes. The shared TASKS.md is unchanged; coordinator must register this bounded subtask before parallel implementation work.

Added tests/test_t009_write_guards.js. Run from repository checkout: node tests/test_t009_write_guards.js.

Eight synthetic cases exercise actual eventAvailable() and sync() functions extracted from app.js: writable, partial, original reader, absent apply, absent session, absent BIN, unavailable program and legacy event error. Extraction fails explicitly if the function boundaries change. No private BIN, catalog import, browser or external dependency is required.

The test checks button/input disabled states, not the calculation algorithms or click-handler enforcement. It uses a minimal element adapter and must not be presented as browser validation. Existing test_ui_state.js already covers stale results and repeated Apply but requires private Ceed fixtures; this isolated matrix avoids those fixtures without claiming equivalent integration coverage.

Execution status: NOT RUN in this chat. Coordinator must run the new test against the checkout and inspect the result before marking this subtask complete. Overall T-009 remains unfinished. No runtime fix is proposed.
