# Development tests

These scripts are for development, not needed to open index.html.

The distribution does not include personal BIN dumps. Run tests in the development workspace where `tests/fixtures` contains the original fixtures from v0.1 and the Ceed files named below. CAL fixtures are retained; all BIN fixtures are excluded from the shared ZIP.

- `ceed-original.bin`: attached M24C16_EEPROM_20261031110850.bin
- `ceed-100000-user-result.bin`: attached M24C16_EEPROM_20261031110850_preview.bin
- Existing RAV4, Mitsubishi, VW source/expected/decoded BIN fixtures: retained in the original development workspace / prior private package.

`node tests/test_engine.js`: 15 engine checks.
`node tests/test_ui_state.js`: 13 application state/event checks with a minimal DOM adapter. Not a browser rendering test.
`node tests/test_catalog.js`: verifies every stored blob and entry against its size and SHA-256.
`node tests/test_browser.js`: browser integration scenario requiring Playwright and Chromium; not completed in this environment.

Do not write fixtures to hardware. Algorithm equivalence, independent-tool equivalence and real-block compatibility are separate validation levels.

Version 0.3 adds `node tests/test_catalog_store.js` (8 storage/serialization checks), and expands `test_ui_state.js` to 20 checks for persistence status, destinations, scoped tree, BIN close and inline editing. Both use Node adapters, not actual browser rendering or quotas. `archive-verification.json` records full ZIP-to-catalog path/hash/size equality. Private BIN fixtures remain excluded from the distribution.

Version 0.4 has 26 application state/event checks, including drop validation, pending-load cancellation, out-of-order reads, conditional selection controls and paging after removal of address navigation. Total: 49 checks (15 engine + 26 app + 8 store), plus full catalog hash validation. The browser scenario is updated but remains unexecuted; no real-browser visual or drag-and-drop claim is made.

Version 0.5: 29 app checks, 52 total with engine/store. Covers full session reset, conditional descriptions, virtual scroll end/partial row editing, removed backup UI and input modality. DOM adapters do not validate CSS geometry or actual browser event timing.

## Portable checks added 2026-11-02

These require only Node and repository contents: `test_source.js` (13), `test_preparation.js` (11), `test_polo.js` (8 groups), `test_catalog_store.js` (8), `test_catalog.js`, and `test_source_pairs.js` (465 pairs × three synthetic vectors). The last suite preserves nine explicitly recorded source-version differences, rather than asserting all same-name files are equivalent. Polo uses a separate direct permutation formulation and four write/readback values. No hardware or original-iProg claim follows from these tests.

`test_source.js` also loads engine and source interpreter as classic browser scripts without CommonJS. The app harness is still a Node adapter, not a rendering test. Private-fixture suites and their old result logs remain historical until the BINs are provided again.

## T-008 pair analysis, 2026-11-04

`node tests/test_t008_pairs.js` runs `tools/analyze_t008_pairs.js` and pins the file-derived findings about the nine differing text/binary pairs (see `reports/T-008-pair-differences-2026-11-04.md`). It uses only repository contents, synthetic dumps and our own engine; it is not an original-iProg comparison and does not pin engine behaviour that may change later.
