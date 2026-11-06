# ETSmartUSB CAL import — 2026-11-06

Source: `ETSmartUSB.rar` from the mixed archive inspected in the iProg working
area. Only calculator scripts were kept. CKDecode, native Windows programs,
USB/device tooling, encrypted `.udx`, ECU `.drt` databases and installer files
were not imported.

## Selection

- 10,475 CAL paths were found; 3,871 have unique SHA-256.
- 3,151 SHA are absent from the verified base catalog.
- 1,578 new paths parsed after exact-path versions and display-name collisions
  were excluded.
- 1,563 of those run their `OnShow` form on a zero-filled 1 MiB buffer.
- 1,562 were appended: one more shared a stored `(folder, name)` pair with an
  existing entry and was left out.

Result: **23,357 + 1,562 = 24,919 CAL paths**, **15,057 + 1,562 = 16,619
unique CAL**, 25,508 catalog entries in total.

## Not imported in this batch

- 508 same-path versions with different bytes (need individual comparison).
- 869 new-path scripts that the current text parser rejects.
- 196 display-name collisions inside the same folder.
- 15 scripts that exceeded the bounded `OnShow` execution limit.

These remain review material; none were silently rewritten.

## Verification

- Original CAL bytes are embedded unchanged in
  `catalog-import-data/blobs-*.js`; SHA-256 is checked by
  `tests/test_etsmart_import.js`.
- Every imported CAL parses and runs `OnShow` in the Node VM test.
- The merged tree has six sections, unique display paths and the counts
  `Dashboard 8,443`, `Airbag 5,390`, `CarRadio 2,152`, `Immo 438`,
  `OTHER 175`, `Engine 21`.
- Chromium loaded the built site, showed 16,619 calculators, opened an imported
  Opel CAL and reported no page errors.
- Base-catalog tests still use 15,057 unique CAL and pass unchanged.

Parsing and `OnShow` execution are not proof of correctness on a real dump or
hardware. No imported calculator has been hardware-validated.

The per-row list is in `reports/etsmart-import-2026-11-06.json`.
