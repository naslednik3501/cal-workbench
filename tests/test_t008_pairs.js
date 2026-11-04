// T-008: pins the file-derived findings about the nine differing text/binary pairs.
// Runs tools/analyze_t008_pairs.js and asserts only facts that follow from the preserved
// CAL bytes. It deliberately does not pin engine behaviour that may legitimately change
// later (for example scratch-memory support for the Skoda decryptors).
const assert = require('assert/strict'), path = require('path'), { execFileSync } = require('child_process');
const out = JSON.parse(execFileSync('node', [path.join(__dirname, '../tools/analyze_t008_pairs.js')], { encoding: 'utf8', maxBuffer: 64 << 20 }));
const p = id => out.pairs.find(x => x.id === id), span = r => r.map(x => x.start + '-' + x.end);

assert.equal(out.pairs.length, 9);
assert(out.pairs.every(x => x.formControlsEqualIgnoringNames), 'form controls must match apart from field names');

// 1 Ford Fusion: different crash-flag byte and slightly different erase ranges
assert.deepEqual([span(p(1).onShowReads.onlyText), span(p(1).onShowReads.onlyBinary)], [['0x290-0x291'], ['0x380-0x381']]);
assert.deepEqual([span(p(1).onApplyWrites.onlyText), span(p(1).onApplyWrites.onlyBinary)], [['0x3c0-0x3df'], ['0x27b-0x27c']]);
// 2 Ford Mondeo: text OnShow can never report clean after its own OnApply
assert.deepEqual([span(p(2).onShowReads.onlyText), span(p(2).onShowReads.onlyBinary), span(p(2).onApplyWrites.onlyBinary)], [['0x330-0x331'], ['0x320-0x321'], ['0x2d0-0x2d2']]);
for (const s of p(2).selfConsistency) { assert.equal(s.text.statusAfterApplyAndShowAgain, 'Обнаружен CRASH!'); assert.equal(s.binary.statusAfterApplyAndShowAgain, 'Дамп чистый!'); }
// 3 Hyundai Sonata: large difference in erase footprint
assert.equal(p(3).onApplyWrites.textBytes, 5168); assert.equal(p(3).onApplyWrites.binaryBytes, 1908);
assert.deepEqual([p(3).onShowReads.onlyText.length, p(3).onShowReads.onlyBinary.length], [0, 0]);
// 8 Nissan: only the crash-flag read address differs
assert.deepEqual([span(p(8).onShowReads.onlyText), span(p(8).onShowReads.onlyBinary)], [['0x60-0x62'], ['0x50-0x52']]);
assert.deepEqual([p(8).onApplyWrites.onlyText.length, p(8).onApplyWrites.onlyBinary.length, p(8).onApplyWrites.sameAddressDifferentValue.length], [0, 0, 0]);
// 9 Honda: text erases 16 additional bytes before the flag
assert.deepEqual([span(p(9).onApplyWrites.onlyText), p(9).onApplyWrites.onlyBinary.length], [['0x570-0x580'], 0]);
// every airbag version is consistent with itself, except the Mondeo text
for (const id of [1, 3, 8, 9]) for (const s of p(id).selfConsistency) for (const v of [s.text, s.binary]) assert.equal(v.statusAfterApplyAndShowAgain, 'Дамп чистый!');

// 4-7 Skoda decryptors: only the initial status text differs; decode/encode results are identical
for (const id of [4, 5, 6, 7]) {
  assert.match(p(id).classification.join(), /cosmetic/);
  assert.equal(p(id).validSignatureRuns.rows.length, 6);
  for (const r of p(id).validSignatureRuns.rows) { assert(r.bytesEqual); assert.equal(r.controlDiffs.length, 0); assert(r.bytesChangedByTextVersion > 1000); assert.equal(r.finalMessageText, 'Готово'); }
  for (const f of p(id).results) for (const e of ['show', 'apply']) { assert(f[e].bytesEqual); for (const d of f[e].controlDiffs) assert.deepEqual([d.field, d.text, d.binary], ['text', '', ' ']); }
}
// the two binary copies of each Skoda program differ only in trailing padding
assert.equal(out.binaryTwins.length, 2);
for (const t of out.binaryTwins) { assert(t.sameFormAndInstructionsAndStrings); assert(t.allDifferencesAfterUsedBytes); assert.equal(t.firstDifferingOffset, t.usedBytesEnd); }
console.log('T-008 pair findings verified: 9 pairs, 4 cosmetic, 4 behavioural, 1 read-address only');
