# Instructions for contributors and AI assistants

Read PROJECT_SCOPE.md before auditing coverage, planning changes or sorting sources.
The project is a calculator for already-read EEPROM/Flash dumps. The owner uses
MultiProg to read and write physical chips. iProg hardware communication, adapters,
chip read/write and processor connections are deliberately out of scope.
Do not treat those omissions as incomplete calculator support.

Read SOURCE_STORAGE.md to retrieve original data selectively from the private source
repository. Preserve original bytes and identify source variants by SHA-256.
Distinguish supported parsing/commands from tested calculation results.
Do not report all recognized CAL files as proven working calculators.
