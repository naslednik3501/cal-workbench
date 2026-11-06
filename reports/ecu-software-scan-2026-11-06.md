# `Ecu software more 150.rar` static scan — 2026-11-06

Source: public MEGA file `i1pVGKLL`, 3,942,255,699 bytes. The archive is
untrusted input; it was only listed and unpacked with `bsdtar` into a
temporary directory. No Windows executable, installer, driver or script was
run.

## Contents

- 181 top-level entries: 123 RAR, 13 ZIP, 43 EXE, 1 7z and one directory.
- Every RAR/ZIP was opened and its file list searched for `.cal`, `.uds`,
  `.lua`, `.ipr`, `.ipp`, `.blr` and `.bc`.
- Only three archives contain such files:
  - `ETSmartUSB.rar` — 10,472 CAL paths, plus 72 `.ipr` transponder scripts.
    Its SHA-256 is identical to the archive already processed for the CAL
    import (`e9a56435…f403`), so it adds nothing new.
  - `DeviceScripts.rar` — 487 `.uds` and 72 `.ipr` device/transponder scripts.
    These are programmer-device scripts, not CAL calculators, and the browser
    application does not execute them.
  - `CrossTunerStudio_v030_Beta.rar` — one `.lua` file inside a bundled
    gnuplot installation, not a calculator.
- No other archive contains a CAL calculator.

## Decision

Nothing from this archive is added to the site. The only calculator payload is
the already-imported ETSmartUSB collection; the remaining archives are Windows
ECU/airbag/immo/key tools, installers and device scripts. Reimplementing their
algorithms would require separate evidence and is outside the calculator-only
scope.

The archive and temporary extraction were deleted after the scan.
