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
- 656 of those parsed directly; 933 were rejected by the text parser.
- All 656 parsed scripts run their `OnShow` form within the application's
  2,000,000-step limit. The first analysis used a 200,000-step limit, which
  made 120 correct scripts look like runtime failures.
- Batch 2 added 536 (364 same-path, 172 new-path). Batch 3 added the remaining
  120 Immo/Bikes scripts (101 same-path, 19 new-path).
- Batch 4 added 111 scripts recovered without changing any operation:
  - 60 by accepting documented metadata lines before `Size` (section title,
    `!`, `@`, `#`, bare image/document names and `//` comments);
  - 51 by removing a duplicated outer `Form { Form {` keyword. Each original
    is matched by SHA-256, byte length and CRC-16 before the rewrite, following
    the existing repair profiles in `cal-source.js`.

Result: **23,357 + 2,329 = 25,686 CAL paths**, **15,057 + 2,329 = 17,386
unique CAL**, 26,275 catalog entries in total.

## Not imported

- 822 scripts still fail the text parser: 46 same-path versions and 776 new
  paths. Common causes are extra closing braces (308), missing parentheses
  before `;` (243), an `else` after a completed block (75), an identifier split
  by a space (53), a truncated file (35), malformed indirect addressing (30),
  remaining duplicated `Form` variants (21) and unsupported `message.Color`
  properties (24). Several are visibly broken source files, so they were not
  rewritten automatically.
- No parsed script remains unimported: every script that parses also completes
  `OnShow` within the application limit.

The 822 need individual review before they can be trusted. None were silently
repaired or imported.

## Verification

- Original CAL bytes are embedded unchanged in
  `catalog-import-data/blobs-*.js`; SHA-256 is checked by
  `tests/test_etsmart_import.js`.
- Every imported CAL parses and runs `OnShow` in the Node VM test.
- The merged tree has six sections, unique display paths and the counts
  `Dashboard 8,717`, `Airbag 5,586`, `CarRadio 2,226`, `Immo 643`,
  `OTHER 192`, `Engine 22`.
- Chromium loaded the built site, showed 25,686 calculators, opened an imported
  Opel CAL and reported no page errors.
- Base-catalog tests still use 15,057 unique CAL and pass unchanged.

Parsing and `OnShow` execution are not proof of correctness on a real dump or
hardware. No imported calculator has been hardware-validated.

The per-row list is in `reports/etsmart-import-2026-11-06.json`.
