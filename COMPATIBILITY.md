# Compatibility checkpoint — 0.5.2, 2026-11-03

The application calculates on supplied BIN dumps; physical programmer operations
are intentionally out of scope. Original bytes and source paths remain preserved.

The catalog contains 23,946 archived entries: 23,357 CAL entries with 15,057 distinct
CAL contents. The UI groups 8,300 exact duplicate instances. Sportage is included.

Static handler coverage is 14,712 fully recognized contents, 257 partial/read-only
contents and 88 unavailable contents. This is not proof of correct calculations on
real vehicle dumps. Partial programs preserve errors, block their failed handlers
in the VM, and permit reading only in the UI. OnShow preparation in partial mode
is never offered as a calculated download. Full programs retain transactional
OnShow/OnChange preparation and repeatable OnApply from that session.

18 exact text variants receive a bounded final-brace parsing repair; original CAL
exports remain unchanged. Byte mismatch annotations do not modify BIN data. Three
newly parsed originals have known writer inconsistencies and remain read-only.
The four FIS readers can open, but opcode 0x4D is still unsupported for writing.
135 original image assets restore 623 references in 288 unique CAL contents.

Portable Node/Python checks and real Chromium synthetic workflows are documented
in [the delivery report](DELIVERY-2026-11-03.md). Historical private BIN tests,
original-iProg execution, physical hardware and Windows were not verified.
465 text/binary comparisons retain 456 exact matches and nine differing pairs.
Current coverage: [JSON report](reports/calculator-coverage-2026-11-03.json).
