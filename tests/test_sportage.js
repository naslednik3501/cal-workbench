// Uses the SHA-pinned original now included in the catalog; optional local CAL argument.
// All BINs below are synthetic. This is not an original-iProg or vehicle oracle.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const E = require('../engine.js');

const SOURCE_SHA = '1544ac94267414e7aebae42bfc455d1699df96e60417469dcdeb118e0770fffa';
if (process.argv.length > 3) {
  console.error('Usage: node tests/test_sportage.js /private/cache/Sportage-95160.cal');
  process.exit(2);
}
let raw;
if (process.argv[2]) raw = fs.readFileSync(process.argv[2]);
else {
  require('../catalog.js');
  for (const part of require('../catalog-parts.json')) require('../' + part);
  raw = Buffer.from(CAL_CATALOG.blobs[SOURCE_SHA], 'base64');
}
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(raw), SOURCE_SHA, 'Refusing a different source version');
const program = E.parse(raw, {sha: SOURCE_SHA});
const FIRST = 0x4c, END = 0x13c, RECORDS = 40;
let passed = 0, vectorCount = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }

// Independent closed-form expectation from the decoded source, without VM opcodes,
// registers or control flow. Each record stores floor(km/15) as a LE 16-bit word,
// three parity-dependent bytes, and an additive checksum modulo 256.
function expectedRecord(km) {
  const word = Math.floor(km / 15);
  const bytes = [word % 256, Math.floor(word / 256),
    word % 2 ? 224 : 0, word % 2 ? 255 : 0, word % 2 ? 255 : 0];
  return Uint8Array.from([...bytes, (bytes.reduce((a, b) => a + b, 0) + 170) % 256]);
}
function expectedApply(input, km) {
  const out = input.slice();
  for (let record = 0; record < RECORDS; record++) out.set(expectedRecord(km), FIRST + record * 6);
  return out;
}
function synthetic(size = 2048, seed = 17) {
  return Uint8Array.from({length: size}, (_, i) => (i * 37 + seed) % 256);
}
function shown(input) { return new E.VM(program, input).transaction('show').vm; }
function apply(input, km) {
  const session = shown(input);
  session.input(0, km);
  return {session, result: session.transaction('apply').vm};
}

test('Pinned original decodes to reviewed binary form and supported commands', () => {
  assert.equal(raw.length, 2310);
  assert.equal(program.bytes.length, 1088);
  assert.equal(sha(program.bytes), '1be0d8ba0052343c62a244ececffdd5a6d148e7b02ccf50d18419d3079a8fd4b');
  assert.equal(program.executable, true);
  assert.deepEqual(program.unsupported, []);
  assert.equal(Object.keys(program.code).length, 174);
  assert.deepEqual(program.form.events, {show: 300, apply: 489, change: 65535});
  assert.equal(program.form.controls[0].type, 'D');
});

test('OnShow reads LE mileage times 15 and leaves original bytes unchanged', () => {
  for (const km of [0, 15, 30, 3825, 3840, 180000, 983000]) {
    const input = expectedApply(synthetic(), km), before = input.slice(), view = shown(input);
    assert.equal(view.controls[0].value, Math.floor(km / 15) * 15);
    assert.equal(view.controls[2].text, 'Дамп ОК. Введите новый пробег.');
    assert.deepEqual(view.buffer, before);
    assert.deepEqual(input, before);
  }
});

test('Bad first-record checksum produces zero field and source warning', () => {
  const input = expectedApply(synthetic(), 180000);
  input[0x51] ^= 1;
  const view = shown(input);
  assert.equal(view.controls[0].value, 0);
  assert.equal(view.controls[2].text, 'Неверный дамп!');
  assert.deepEqual(view.buffer, input);
});

test('Source warning is limited to the first record, not whole-dump validation', () => {
  const input = expectedApply(synthetic(), 180000);
  input[0x57] ^= 1; // Second record checksum.
  input[0x136] ^= 1; // Last record mileage.
  const view = shown(input);
  assert.equal(view.controls[0].value, 180000);
  assert.equal(view.controls[2].text, 'Дамп ОК. Введите новый пробег.');
  assert.deepEqual(view.buffer, input);
});

test('Independent full-buffer expectations cover parity, carry and limit boundaries', () => {
  const values = new Set([0, 1, 14, 15, 16, 29, 30, 31, 3824, 3825, 3839, 3840,
    3841, 7679, 7680, 99999, 100000, 123456, 180000, 982979, 982980, 982994, 982995, 983000]);
  // Spread across the supported range, including both parity branches and byte carries.
  for (let i = 0; i < 128; i++) values.add((i * 7919 + 123) % 983001);
  for (const km of values) {
    const input = expectedApply(synthetic(2048, km % 256), 180000), before = input.slice();
    const {session, result} = apply(input, km), expected = expectedApply(before, km);
    assert.deepEqual(result.buffer, expected, 'Full output for km=' + km);
    assert.deepEqual(result.buffer.subarray(0, FIRST), before.subarray(0, FIRST));
    assert.deepEqual(result.buffer.subarray(END), before.subarray(END));
    assert.deepEqual(session.buffer, before);
    assert.deepEqual(input, before);
    assert.equal(result.buffer.length, 2048);
    assert.equal(result.controls[2].text, 'Новый пробег записан.');
    assert.equal(shown(result.buffer).controls[0].value, Math.floor(km / 15) * 15);
    assert.deepEqual(session.transaction('apply').vm.buffer, expected, 'Repeat starts from session');
    vectorCount++;
  }
});

test('Values above the source maximum return a message without writing bytes', () => {
  for (const km of [983001, 983040, 0xffffffff]) {
    const input = expectedApply(synthetic(), 180000), {result} = apply(input, km);
    assert.deepEqual(result.buffer, input);
    assert.equal(result.controls[2].text, 'Пробег должен быть не более 983000 км');
  }
});

test('OnApply does not enforce first checksum or compared identification bytes', () => {
  // Characterization of original CAL behavior, not approval to use arbitrary dumps.
  const input = expectedApply(synthetic(), 180000);
  input[0x51] ^= 1;
  for (const [a, b] of [[0x155, 0x39], [0x156, 0x34], [0x157, 0x30]]) input[a] = input[b] ^ 255;
  assert.equal(shown(input).controls[2].text, 'Неверный дамп!');
  assert.deepEqual(apply(input, 123456).result.buffer, expectedApply(input, 123456));
});

test('CAL has no exact EEPROM-size guard; bounds errors preserve the parent', () => {
  // 344 is the code-access minimum, NOT a valid EEPROM size or padding recommendation.
  const small = expectedApply(synthetic(344), 180000);
  assert.deepEqual(apply(small, 123456).result.buffer, expectedApply(small, 123456));
  const showTooShort = new E.VM(program, new Uint8Array(81));
  assert.throws(() => showTooShort.transaction('show'), /границы/);
  assert.deepEqual(showTooShort.buffer, new Uint8Array(81));
  const applyTooShort = shown(expectedApply(synthetic(343), 180000));
  const before = applyTooShort.buffer.slice();
  applyTooShort.input(0, 123456);
  assert.throws(() => applyTooShort.transaction('apply'), /границы/);
  assert.deepEqual(applyTooShort.buffer, before);
});

test('Budget stop after writes rolls back bytes and controls', () => {
  const input = expectedApply(synthetic(), 180000), session = shown(input);
  session.input(0, 123456);
  const controls = session.controls.map(c => ({...c}));
  // Direct execution on a disposable clone establishes that this budget reaches writes.
  const disposable = session.clone();
  assert.throws(() => disposable.execute('apply', {maxSteps: 200}), /лимит/);
  assert.notDeepEqual(disposable.buffer, input);
  assert.throws(() => session.transaction('apply', {maxSteps: 200}), /лимит/);
  assert.deepEqual(session.buffer, input);
  assert.deepEqual(session.controls, controls);
});

test('Numeric input bounds and tampered source bytes are rejected', () => {
  const session = shown(expectedApply(synthetic(), 180000));
  for (const value of [-1, 1.5, NaN, 0x100000000]) assert.throws(() => session.input(0, value));
  const corrupt = Buffer.from(raw);
  corrupt[100] = corrupt[100] === 48 ? 49 : 48;
  assert.throws(() => E.parse(corrupt));
});

console.log(JSON.stringify({passed, failed: 0, calculationVectors: vectorCount,
  sourceSha256: SOURCE_SHA, scope: 'Synthetic BINs, source-derived independent record formula; no original-iProg, browser or physical-block verification'}));
