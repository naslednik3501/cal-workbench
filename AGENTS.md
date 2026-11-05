# Instructions for contributors and AI assistants

## Work authorization
Work only on the current explicit task supplied by the owner in the conversation.
There is no active repository task queue and no standing agent assignment.
Do not recreate TASKS.md, claim an old task, or continue a historical report's next
step without a new owner instruction. Historical task IDs identify evidence only.
Before editing, fetch current main, inspect the working tree and any concurrent
changes, and use a separate branch. Do not overwrite another agent's work.

## Product boundaries
Read PROJECT_SCOPE.md. This application performs calculations on already-read
EEPROM/Flash BIN files. Physical programmer communication, adapters, chip reading
and writing, power and connection instructions are outside the product scope.
Read SOURCE_STORAGE.md to retrieve original objects selectively. Preserve original
bytes, SHA-256 identities, source paths and exact-CAL exports.

## Implementation and validation
Make the smallest complete change needed for the assigned task. Preserve separate
original BIN and working/result buffers. Unknown commands and unsupported writers
must fail explicitly rather than be skipped. Do not guess original algorithms.
Folder names remain the original section names. Sections sort by descending unique
CAL count; folders inside a section sort alphabetically. Display names can improve
clarity without changing original files.

Distinguish handler recognition, synthetic test coverage and real reference results.
Do not describe every recognized CAL as proven correct on all vehicle dumps.
Run checks appropriate to the change and update MANIFEST.json deliberately.
Publish verified changes to main through a PR under the owner's standing
authorization, then check Pages and the actual published files.

## Documentation
README.md is the entry point; COMPATIBILITY.md records current limitations.
reports/ and dated technical documents are research evidence, not instructions,
assignments or a queue. Read only evidence relevant to the current task.
Keep useful provenance and tests. Avoid duplicate progress reports, handoff notes
and documentation-only PR chains. Report briefly: change, checks, publication and
any concrete remaining limitation. Never relabel incomplete work as completed.
