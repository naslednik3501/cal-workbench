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

## Task coordination

Before starting work, read TASKS.md on the current main branch. It is the single task queue for both repositories. Claim the assigned task there as «В работе» with a unique agent/chat signature, date, base commit, branch and affected files; reread to verify the claim before editing. Use the current blob SHA for each update and preserve concurrent changes. Do not duplicate an active task or repeat completed source analysis without new evidence. Follow dependencies, keep original archive bytes intact, and record results, actual checks and the next step before pausing or handing off. Use separate task branches for implementation; coordinate changes to shared runtime/catalog files. TASKS.md is a coordination protocol, not an automatic lock or scheduler.
