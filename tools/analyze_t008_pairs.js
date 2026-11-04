#!/usr/bin/env node
// T-008: read-only analysis of the nine text/binary CAL pairs that differ in
// reports/source-comparison-2026-11-02.json. It parses both forms of each pair with
// the existing engine, records which BIN addresses OnShow reads and OnApply writes,
// and compares form controls and results. It changes no application code, no
// catalog data and no original bytes. Both implementations are ours: results are
// synthetic-data observations, not an original-iProg oracle.
//
// Usage: node tools/analyze_t008_pairs.js [output.json]
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..') + path.sep;
const E = require(root + 'engine.js');
require(root + 'catalog.js');
for (const f of require(root + 'catalog-parts.json')) require(root + f);

const report = require(root + 'reports/source-comparison-2026-11-02.json');
const fixtures = require(root + 'tests/fixtures/source-pairs.json');
const provenancePath = root + 'reports/T-008-provenance-2026-11-04.json';
const provenance = fs.existsSync(provenancePath) ? require(provenancePath).bySha : {};

const blob = sha => {
  const b = Buffer.from(CAL_CATALOG.blobs[sha], 'base64');
  if (crypto.createHash('sha256').update(b).digest('hex') !== sha) throw new Error('SHA-256 mismatch for ' + sha);
  return b;
};

// --- access recorder: patches the shared VM prototype (text VM inherits read/write) ---
let rec = null;
const origRead = E.VM.prototype.read, origWrite = E.VM.prototype.write;
E.VM.prototype.read = function (a) { if (rec) rec.reads.add(a); return origRead.call(this, a); };
E.VM.prototype.write = function (a, b) { if (rec) rec.writes.set(a, b & 255); return origWrite.call(this, a, b); };

function ranges(map) { // Map(addr -> value) or Set(addr) -> [{start,end,value?}] with end exclusive
  const keys = [...(map instanceof Map ? map.keys() : map)].sort((a, b) => a - b), out = [];
  for (const k of keys) {
    const v = map instanceof Map ? map.get(k) : undefined, last = out.at(-1);
    if (last && last.end === k && last.value === v) last.end++; else out.push({ start: k, end: k + 1, ...(v === undefined ? {} : { value: v }) });
  }
  return out.map(r => ({ start: '0x' + r.start.toString(16), end: '0x' + r.end.toString(16), length: r.end - r.start, ...(r.value === undefined ? {} : { value: '0x' + r.value.toString(16).padStart(2, '0') }) }));
}

// Padded analysis buffers are not production BINs; do not apply the reviewed
// exact-chip-size profile to these historical comparison cases.
function analysisVM(program, dump) {
  return new E.VM(program.memory && dump.length !== program.memory.dumpBytes ? { ...program, memory: undefined } : program, dump);
}

function footprint(program, size) {
  const dump = new Uint8Array(size); // all zero: OnShow reaches the deeper crash-flag branch
  const vm = analysisVM(program, dump);
  rec = { reads: new Set(), writes: new Map() };
  const shown = vm.transaction('show', { maxSteps: 500000 }).vm; const reads = rec.reads;
  rec = { reads: new Set(), writes: new Map() };
  shown.transaction('apply', { maxSteps: 500000 });
  const writes = rec.writes; rec = null;
  return { reads, writes };
}

const hex = n => '0x' + n.toString(16);
function compareMaps(a, b) {
  const onlyA = new Map(), onlyB = new Map(), valueDiff = new Map();
  for (const [k, v] of a) { if (!b.has(k)) onlyA.set(k, v); else if (b.get(k) !== v) valueDiff.set(k, 'text=' + v + ',binary=' + b.get(k)); }
  for (const [k, v] of b) if (!a.has(k)) onlyB.set(k, v);
  return { onlyA, onlyB, valueDiff };
}

const controlKey = c => [c.type, c.text, c.x, c.y, c.width ?? null, c.height ?? null, c.items ? c.items.join('|') : null];
const view = v => v.controls.map(c => ({ value: c.value, text: c.text, color: c.color, bold: c.bold, align: c.align }));

function runCase(program, size, fill, event) {
  const dump = Uint8Array.from({ length: size }, (_, i) => fill === 'pattern' ? (i * 17 + 23) & 255 : fill);
  let v = analysisVM(program, dump).transaction('show', { maxSteps: 500000 }).vm;
  if (event === 'apply') {
    for (const o of program.form.controls) if ('DHCB'.includes(o.type)) v.input(o.id, o.type === 'C' ? Math.min(1, o.items.length - 1) : o.type === 'B' ? 1 : o.type === 'H' ? 0x1234 : 123456);
    v = v.transaction('apply', { maxSteps: 500000 }).vm;
  }
  return { buffer: Buffer.from(v.buffer), controls: view(v) };
}

// The Skoda decryptors verify signature words before doing anything, so the synthetic
// 0x00/0xFF/pattern dumps never reach their decode/encode branch. Signature words below
// are copied from the text sources (OnApply); dumps are seeded pseudo-random otherwise.
const signatures = {
  Fabia: [{ 0x0a: 0xBF39, 0x1a: 0x9F39, 0x2a: 0x3F39, 0x3a: 0x1F39 }, { 0xE0: 0x534B, 0xEE: 0x534B, 0xFC: 0x534B }],
  'Super B': [{ 0x00: 0xFF44, 0x10: 0xFF45, 0x30: 0x7F45 }, { 0xE0: 0x534B, 0xEE: 0x534B, 0xFC: 0x534B }]
};
function validDumpRuns(text, bin, size, model) {
  const rows = [];
  signatures[model].forEach((sig, mode) => {
    for (const seed of [1, 2, 3]) {
      let s = seed >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return (t ^ (t >>> 14)) >>> 0; };
      const dump = Uint8Array.from({ length: size }, () => rnd() & 255);
      for (const [a, w] of Object.entries(sig)) { dump[+a] = w & 255; dump[+a + 1] = w >> 8; }
      const run = p => {
        let v = analysisVM(p, dump); const mc = p.form.controls.findIndex(c => c.type === 'C'); v.input(mc, mode);
        v = v.transaction('apply', { maxSteps: 5000000 }).vm; return { buffer: Buffer.from(v.buffer), controls: view(v) };
      };
      const a = run(text), b = run(bin), changed = a.buffer.reduce((n, x, k) => n + (x !== dump[k]), 0);
      const cd = []; a.controls.forEach((c, k) => { for (const f of Object.keys(c)) if (c[f] !== b.controls[k][f]) cd.push({ control: k, field: f, text: c[f], binary: b.controls[k][f] }); });
      rows.push({ mode: mode === 0 ? 'decode' : 'encode', seed, bytesEqual: a.buffer.equals(b.buffer), bytesChangedByTextVersion: changed, finalMessageText: a.controls.find((c, k) => text.form.controls[k].type === 'L' && c.text && /Готово|Неверн/.test(c.text))?.text ?? null, controlDiffs: cd });
    }
  });
  // The decoders also use scratch addresses from 0x2000, beyond a real 2048-byte 93C86 dump.
  // Probe the current production SHA profiles on real-size BINs separately from padded analysis.
  const probe = [];
  signatures[model].forEach((sig, mode) => {
    const dump = Uint8Array.from({ length: 2048 }, (_, k) => (k * 29 + 7) & 255);
    for (const [a, w] of Object.entries(sig)) { dump[+a] = w & 255; dump[+a + 1] = w >> 8; }
    for (const [form, p] of [['text', text], ['binary', bin]]) {
      try { let v = new E.VM(p, dump); v.input(p.form.controls.findIndex(c => c.type === 'C'), mode); v.transaction('apply', { maxSteps: 5000000 }); probe.push({ mode: mode === 0 ? 'decode' : 'encode', form, result: 'completed' }); }
      catch (e) { probe.push({ mode: mode === 0 ? 'decode' : 'encode', form, result: 'error', error: e.message }); }
    }
  });
  return { dumpBytes: 0x2800, rows, realChipSizeProbe: { dumpBytes: 2048, rows: probe } };
}

// Internal consistency of an airbag calculator: after its own OnApply, does its own
// OnShow report a clean dump? (control 0 is the status label in these forms)
function selfConsistency(program, size, fill) {
  const dump = new Uint8Array(size).fill(fill);
  const vm = new E.VM(program, dump), status = v => v.controls[0].text;
  const before = vm.transaction('show', { maxSteps: 500000 }).vm;
  const applied = before.transaction('apply', { maxSteps: 500000 }).vm;
  const after = new E.VM(program, applied.buffer).transaction('show', { maxSteps: 500000 }).vm;
  return { statusBeforeApply: status(before), statusAfterApplyAndShowAgain: status(after) };
}

const out = { task: 'T-008', scope: 'Read-only analysis; synthetic dumps; both implementations are ours (not an original-iProg oracle).', pairs: [], binaryTwins: [] };
const unique = new Map();
report.differences.forEach((d, i) => {
  const fx = fixtures.find(p => p.sourceSha === d.sourceSha && p.binarySha === d.binarySha);
  if (!fx) throw new Error('fixture not found for pair ' + (i + 1));
  const size = fx.size, text = E.parse(blob(d.sourceSha), { sha: d.sourceSha }), bin = E.parse(blob(d.binarySha), { sha: d.binarySha });
  const ct = text.form.controls.map(controlKey), cb = bin.form.controls.map(controlKey), formDiffs = [];
  for (let k = 0; k < Math.max(ct.length, cb.length); k++) if (JSON.stringify(ct[k]) !== JSON.stringify(cb[k])) formDiffs.push({ index: k, text: ct[k] ?? null, binary: cb[k] ?? null });
  const ft = footprint(text, size), fb = footprint(bin, size);
  const reads = compareMaps(new Map([...ft.reads].map(a => [a, 0])), new Map([...fb.reads].map(a => [a, 0])));
  const writes = compareMaps(ft.writes, fb.writes);
  const fills = [];
  for (const fill of [0, 255, 'pattern']) {
    const row = { fill };
    for (const event of ['show', 'apply']) {
      const a = runCase(text, size, fill, event), b = runCase(bin, size, fill, event), diffs = [];
      a.controls.forEach((c, k) => { for (const f of Object.keys(c)) if (c[f] !== b.controls[k][f]) diffs.push({ control: k, field: f, text: c[f], binary: b.controls[k][f] }); });
      row[event] = { bytesEqual: a.buffer.equals(b.buffer), changedBytesText: a.buffer.reduce((n, x, k) => n + (x !== (fill === 'pattern' ? (k * 17 + 23) & 255 : fill)), 0), changedBytesBinary: b.buffer.reduce((n, x, k) => n + (x !== (fill === 'pattern' ? (k * 17 + 23) & 255 : fill)), 0), controlDiffs: diffs };
    }
    fills.push(row);
  }
  const msgOnly = fills.every(f => ['show', 'apply'].every(e => f[e].controlDiffs.every(x => x.field === 'text' && ((x.text === '' && x.binary === ' ') || (x.text === ' ' && x.binary === '')))));
  const readsEqual = !reads.onlyA.size && !reads.onlyB.size, writesEqual = !writes.onlyA.size && !writes.onlyB.size && !writes.valueDiff.size;
  const kinds = [];
  if (!readsEqual) kinds.push('different OnShow read addresses (crash-flag byte)');
  if (!writesEqual) kinds.push('different OnApply write footprint');
  if (readsEqual && writesEqual && fills.every(f => f.show.bytesEqual && f.apply.bytesEqual) && msgOnly) kinds.push('cosmetic: initial message text is empty in text form and a single space in binary form');
  else if (readsEqual && writesEqual && !formDiffs.length) kinds.push('control values only');
  out.pairs.push({
    id: i + 1, size,
    text: { sha: d.sourceSha, path: d.source, otherPaths: (provenance[d.sourceSha] || []).filter(p => p !== d.source) },
    binary: { sha: d.binarySha, path: d.binary, otherPaths: (provenance[d.binarySha] || []).filter(p => p !== d.binary) },
    labels: text.form.controls.filter(c => c.type === 'L').map(c => c.text),
    formControlsEqualIgnoringNames: !formDiffs.length, formDifferences: formDiffs,
    onShowReads: { text: ranges(ft.reads), binary: ranges(fb.reads), onlyText: ranges(reads.onlyA), onlyBinary: ranges(reads.onlyB) },
    onApplyWrites: {
      text: ranges(ft.writes), binary: ranges(fb.writes),
      onlyText: ranges(writes.onlyA), onlyBinary: ranges(writes.onlyB),
      sameAddressDifferentValue: ranges(writes.valueDiff),
      textBytes: ft.writes.size, binaryBytes: fb.writes.size,
      textMaxAddress: ft.writes.size ? hex(Math.max(...ft.writes.keys())) : null, binaryMaxAddress: fb.writes.size ? hex(Math.max(...fb.writes.keys())) : null
    },
    results: fills,
    ...(!/Fabia|Super B/.test(d.source) ? { selfConsistency: [0, 0x55].map(fill => ({ fill, text: selfConsistency(text, size, fill), binary: selfConsistency(bin, size, fill) })) } : {}),
    ...(/Fabia|Super B/.test(d.source) ? { validSignatureRuns: validDumpRuns(text, bin, 0x2800, /Fabia/.test(d.source) ? 'Fabia' : 'Super B') } : {}),
    classification: kinds
  });
  unique.set(d.sourceSha, d.source); unique.set(d.binarySha, d.binary);
});

// Binary copies of one program that differ in raw bytes: compare the decoded programs.
// Same form + same instructions + same strings, but different raw/decoded bytes: where do the bytes differ?
function usedEnd(p) { // end of the last instruction or string actually used by the program
  let end = p.form.codeStart;
  for (const i of Object.values(p.code)) {
    end = Math.max(end, i.next);
    if (i.op === 0x36) { const first = p.bytes[i.args[1]] ^ 128; let q = i.args[1] + 1; while ((p.bytes[q++] ^ first) !== 0); end = Math.max(end, q); }
  }
  return end;
}
const byProgram = new Map();
for (const sha of unique.keys()) {
  const raw = blob(sha);
  if (/\bSize\s*\(/i.test(raw.toString('latin1'))) continue; // text form
  const p = E.parse(raw, { sha });
  const key = JSON.stringify({ e: p.form.events, c: p.form.controls.map(controlKey), i: Object.values(p.code).map(i => [i.pc, i.op, i.args, i.text ?? null]) });
  (byProgram.get(key) || byProgram.set(key, []).get(key)).push({ sha, p });
}
for (const group of byProgram.values()) if (group.length > 1) {
  const [a, ...rest] = group;
  for (const b of rest) {
    const diffs = []; for (let i = 0; i < Math.max(a.p.bytes.length, b.p.bytes.length); i++) if (a.p.bytes[i] !== b.p.bytes[i]) diffs.push(i);
    const end = usedEnd(a.p);
    out.binaryTwins.push({ shas: [a.sha, b.sha], sameFormAndInstructionsAndStrings: true, decodedLength: a.p.bytes.length, usedBytesEnd: hex(end), differingDecodedBytes: diffs.length, firstDifferingOffset: diffs.length ? hex(diffs[0]) : null, lastDifferingOffset: diffs.length ? hex(diffs.at(-1)) : null, allDifferencesAfterUsedBytes: diffs.every(x => x >= end && b.p.bytes.length === a.p.bytes.length && x >= usedEnd(b.p)) });
  }
}

const target = process.argv[2];
const json = JSON.stringify(out, null, 1) + '\n';
if (target) fs.writeFileSync(target, json); else process.stdout.write(json);
