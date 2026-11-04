# T-009: independent static UI safety review

Reviewer: perplexity-ui-audit-20261104. Date: 2026-11-04 (Moscow).
Base: 25918dfbb2719190731b739e9bdca127baa0f69a.
Branch: task/T-009-perplexity-ui-audit.
Scope: read-only review of UI safety conditions; no runtime, original CAL, catalog, manifest or source-store changes. This is a bounded review, not completion of T-009.

## Coordination and limitations

The main TASKS.md still lists T-009 as unassigned. No shared-file implementation is claimed or started. Coordinator should register this bounded review and decide follow-up ownership. T-003 and T-008 have Claude branch records and must not be duplicated.

Evidence: engine.js, cal-source.js, the returned portion of app.js, tests/README.md and the T-005 report at the reviewed baseline. The app.js response was truncated after the beginning of commitByte: download/reset/close and later handlers were NOT fully reviewed. No tests, browser, Node suite, original iProg or physical hardware were executed in this review. Existing test claims are prior authors' results, not independent reproduction.

## Confirmed static observations

1. sync() requires original + executable program + session for readiness. Apply additionally requires !partial, !readOnly and an available apply event. The apply click handler repeats the write restrictions.
2. clearResult() does not expose session preparation as a downloadable candidate for partial/readOnly programs. initializeSession() runs show transactionally and keeps original separate.
3. Apply sets candidate=null before executing on cloned session state. action(...,{invalidate:true}) clears candidate on failure, marks inputs dirty and updates controls/HEX.
4. Engine transaction() executes on a cloned VM. SourceVM.clone() also copies variables and mismatch annotations. These are code-path observations, not proof of all runtime sequences.

## Follow-up regression scenarios (not executed)

A. Stale error banner after recovery: initializeSession() hides calcError before attempting show; the Apply success path also hides it. The successful selection handler does not explicitly hide calcError. Reproduce a selection/input validation failure followed by a valid selection. Check whether an old error remains visible after successful processing. This is a candidate UX defect, not a confirmed browser failure.

B. Read-only controls: sync() disables every generated input unless a writer is available. This is safe against calculated writes, but may prevent useful reader-only selector interaction for CALs with valid change events. Check concrete CAL behavior and requirements before changing any gate. Do not simply enable writes or downloads.

C. Download invalidation: execute a successful Apply, edit an input, trigger a failing Apply, change calculator, replace BIN, cancel a pending BIN load, and reset. At each step assert that download/report never expose stale results. Later handlers were truncated, so this review makes no pass/fail claim.

D. Repeated Apply semantics: Apply clones session and displays res.vm without assigning it back to session. Test whether repeating identical input is deterministic and whether changing input recalculates from the intended prepared baseline. Do not change this behavior without a regression specification; it may be intentional protection against cumulative edits.

## Handoff / acceptance

Static review delivered; runtime validation remains pending. Suggested next work is an isolated tests/test_t009_ui_safety.js with synthetic fixtures and a coordinator-reviewed DOM harness, followed by Chromium for actual interaction. Keep engine.js, cal-source.js, catalog and manifest unchanged unless a separately assigned fix is justified.

Coordinator: validate observations, register this review in TASKS.md, and decide whether to merge this report. Do not mark overall T-009 Done or claim verified calculations from this report.
