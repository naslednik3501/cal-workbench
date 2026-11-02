# Compatibility checkpoint — 0.5.1, 2026-11-02

Current scope is offline calculation on supplied BIN dumps. Hardware/programmer functions are intentionally excluded.

The catalog preserves the original 23,944 files and adds one original Polo CAL extracted from an embedded RAR: 23,945 entries, 23,356 CALs, 15,056 distinct CAL contents. All stored payload sizes and SHA-256 hashes are verified by `tests/test_catalog.js`.

Static support: 21,550 binary CAL entries and 1,358 text CAL entries. Four entries require the unresolved opcode 0x4D; 444 have remaining syntax, structure or format failures. Supported syntax is not a hardware-compatibility verdict.

OnShow and OnChange may prepare a transactional working copy. OnApply starts from that prepared session; original BIN bytes remain separate. Failed events do not commit partial writes. The reviewed RAR Polo source has a SHA-specific 2048-byte scratch region; the downloadable BIN remains 2048 bytes. All other CALs retain strict dump bounds.

Validation: 13 source/decoder checks, 11 app-state checks, 8 Polo check groups, 8 storage checks, full catalog hash verification, and 465 source/binary comparisons (456 exactly matching pairs; nine documented differences). Tests use synthetic data and Node adapters. No original-iProg execution, real-browser rendering, or real-block verification is claimed. Historical private BIN tests were not rerun.

Remaining limitations include malformed or unsupported source syntax, alternative containers, opcode 0x4D, other scratch-memory contracts, and missing images. Lua/IPR/IPP/BLR/BC/EXE execution is not implemented. Sportage 95160 needs its original file reattached before addition.

See [the detailed implementation and handoff report](IMPLEMENTATION-2026-11-02.md), [current static coverage](reports/calculator-coverage-2026-11-02.json), and [image investigation](IMAGE-RESOURCE-AUDIT.md). Earlier audit documents are historical snapshots.
