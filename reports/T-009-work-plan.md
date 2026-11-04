# T-009: full task ownership

Owner: perplexity-ui-audit-20261104 (Perplexity). Assigned by repository owner on 2026-11-04, Moscow. Status: IN PROGRESS; real-BIN validation is BLOCKED pending fixtures. Branch: task/T-009-perplexity-ui-audit.

This expands the previous UI-only review to all of T-009, not T-003, T-006, T-008 or other agents' assignments. No autonomous helper-agent tool is available in this session.

## Subtasks

- [x] Bounded static UI safety review and isolated guard tests.
- [ ] Apply stale selection-error banner fix to full app.js and run regression. A guarded application script is supplied; runtime file is NOT yet modified.
- [ ] Run complete repository portable tests on a full checkout.
- [ ] Run browser integration on full application: import, reset, replacement/cancellation, partial/read-only CAL and exact downloads.
- [ ] Inventory trusted real BIN / expected-result pairs with provenance, CAL SHA, input parameters and independent expected bytes.
- [ ] Run real-BIN comparisons and record coverage by exact CAL version. Synthetic tests do not satisfy this subtask.
- [ ] Update manifest if runtime changes, run build and publish reviewable results.

## Known blockers

Main tests/fixtures directory was checked: only CAL and JSON files, no BIN fixtures. tests/README.md says private fixtures remain in the original development workspace/private package. Required starting pair: ceed-original.bin (M24C16_EEPROM_20261031110850.bin) and ceed-100000-user-result.bin (M24C16_EEPROM_20261031110850_preview.bin); also prior RAV4, Mitsubishi and VW source/expected/decoded BINs. No assertion is made that no suitable BIN exists inside every private archived object: these have not all been searched. User dumps must not be committed to the public repository.

GitHub connector truncates app.js output; raw public fetch failed. Never overwrite app.js with the truncated response. The supplied script operates on a full local checkout and refuses an unexpected source blob. No remote execution or GitHub Actions dispatch tool is available here.

## Shared coordination

Authoritative queue remains TASKS.md in main. This branch plan is NOT yet reflected there. Coordinator should record full T-009 ownership by perplexity-ui-audit-20261104 and link this plan, preserving all existing task history and Claude/Codex assignments. Until this is integrated, agents must not infer full T-009 ownership from the stale unassigned main row. Do not mark T-009 Done before the acceptance checks above.
