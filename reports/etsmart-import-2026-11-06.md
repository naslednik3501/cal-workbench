# ETSmartUSB CAL import — 2026-11-06

Source: `ETSmartUSB+iProg.rar` recovered from the public MEGA folder linked in
the browser download history. Only calculator scripts were kept. CKDecode,
native Windows programs, USB/device tooling, encrypted `.udx`, ECU `.drt`
databases and installer files were not imported.

## Selection

- 10,471 CAL paths were found; 3,869 have unique SHA-256.
- The first review added 1,562 CALs that differ from the verified base catalog.
- Re-running the comparison against the published catalog left 1,589 further
  unique CAL SHA: 1,060 new paths and 529 same-path versions with different
  bytes.
- 656 of those parsed; 933 were rejected by the text parser.
- 536 of the parsed scripts ran their `OnShow` form on a zero-filled 1 MiB
  buffer and were appended as `— ETSmart` variants where the name or path was
  already taken.

Result: **23,357 + 2,098 = 25,455 CAL paths**, **15,057 + 2,098 = 17,155
unique CAL**, 26,044 catalog entries in total.

Batch 1 contributed 1,562 calculators; batch 2 contributed 536.

## Not imported

- 933 scripts the current text parser rejects (missing parentheses or braces,
  duplicated `Form`, stray HTML/preamble text, unmatched `else`, truncated
  files). Several are visibly damaged source files, so they were not rewritten
  automatically.
- 120 scripts that parse but fail bounded `OnShow` execution. These may need
  hardware-specific memory or contain runtime errors.
- Among the 1,053 remaining files: 64 are same-path versions of published
  calculators and 989 are new paths. Each needs individual review before it can
  be trusted.

None were silently repaired or imported.

## Verification

- Original CAL bytes are embedded unchanged in
  `catalog-import-data/blobs-*.js`; SHA-256 is checked by
  `tests/test_etsmart_import.js`.
- Every imported CAL parses and runs `OnShow` in the Node VM test.
- The merged tree has six sections, unique display paths and the counts
  `Dashboard 8,629`, `Airbag 5,585`, `CarRadio 2,226`, `Immo 501`,
  `OTHER 192`, `Engine 22`.
- Chromium loaded the built site, showed 25,455 calculators, opened an imported
  Opel CAL and reported no page errors.
- Base-catalog tests still use 15,057 unique CAL and pass unchanged.

Parsing and `OnShow` execution are not proof of correctness on a real dump or
hardware. No imported calculator has been hardware-validated.

The per-row list is in `reports/etsmart-import-2026-11-06.json`.
