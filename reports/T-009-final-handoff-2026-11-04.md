# T-009 UI safety: final bounded handoff

Agent: perplexity-ui-audit-20261104. Status: ON REVIEW, not overall T-009 Done. Application baseline: 25918df; test commit: 3af1c20. Branch: task/T-009-perplexity-ui-audit.

## Coordination

Shared queue is TASKS.md in main. It has NOT been updated by this agent. Coordinator must add: T-009 UI safety subset; perplexity-ui-audit-20261104; on review; this branch and report. Do not replace the overall T-009 entry or claim real-BIN validation. Claude T-003/T-008 and Codex assignments remain unchanged. A branch report does not constitute a shared-main assignment.

## Actual execution

1. Node v20.20.1: 8/8 write guard cases passed. Test bytes matched Git blob cd7769990425559c1b8272a86c57c3abd12ef3c7. Local app.js contained exact retrieved eventAvailable/sync functions plus boundary markers because connector output was truncated. This was NOT a full checkout execution.
2. Reconstructed isolated Node handlers: 9/10 passed; successful selection did not hide a preceding error. VM, DOM, diff and related dependencies were stubbed.
3. Chromium 134.0.6998.35 via Python Playwright: 5/5 isolated DOM guard cases passed (writable, partial, readOnly, no session, no BIN). Not full application browser tests.
4. Chromium recovery reproduction: original selection handler showed the invalid-range error and kept it visible after a valid selection, with one successful transaction. Proposed fix hid the old error after the same valid selection, still with one transaction. Fresh page/context per variant was necessary; an initial harness attempt failed due to reused lexical bindings and was corrected before the comparison.

## Proposed one-line fix, NOT applied to app.js

In the successful selection click handler, immediately after updateForm(session); and before log('Диапазон передан: '+scriptMessages(session)); insert:

```js
$('calcError').hidden=true;
```

This clears the stale banner only after successful selection processing. Error paths retain their existing behavior. Coordinator must inspect current app.js before applying; do not perform a global replacement across other handlers.

## Remaining acceptance

Run repository suites against a complete checkout, add a regression case using actual handlers, apply/review the one-line fix if appropriate, rerun browser integration, verify downloads/import/reset and real CAL behavior. No real BIN, expected hardware result, original iProg comparison, layout audit or full-site execution was performed here. Runtime files and MANIFEST.json were not changed. Earlier reports saying NOT RUN are superseded only for the narrow executions explicitly listed above. This review and proposal are ready for coordinator review; overall T-009 remains open.
