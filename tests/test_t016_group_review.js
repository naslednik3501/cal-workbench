// Focused checks for the reviewed 62 + 112 T-016 groups. This is a map /
// provenance test; it does not claim vehicle compatibility or hardware tests.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const root = path.resolve(__dirname, '..');
require('../catalog.js');
for (const file of require('../catalog-parts.json')) require('../' + file);
const org = require('../catalog-organization.js');
const registry = require('../reports/T-016-group-review-2026-11-04.json');
const audit = require('../reports/T-016-name-audit-2026-11-04.json');
const remainder = require('../reports/catalog-organization-remainder-2026-11-04.json');
const allCal = globalThis.CAL_CATALOG.entries.filter(entry => entry.ext === 'cal');
const bySha = new Map(allCal.map(entry => [entry.sha, entry]));
const overriddenShas = new Set(allCal
  .filter(entry => entry.path.startsWith('Calculators/Asia/') || entry.path.startsWith('Calculators/EU_US_RU/') || entry.path.startsWith('Calculators/CRYPTO/'))
  .map(entry => entry.sha));
const decisions = registry.decisions;
const generic = decisions.filter(row => row.group === 'generic');
const ambiguous = decisions.filter(row => row.group === 'ambiguous');

assert.equal(decisions.length, 174);
assert.equal(new Set(decisions.map(row => row.sha)).size, 174);
assert.equal(generic.length, 62);
assert.equal(ambiguous.length, 112);
assert.equal(registry.source_groups.generic_count, 62);
assert.equal(registry.source_groups.ambiguous_count, 112);
assert.equal(registry.source_groups.union_count, 174);
assert.equal(registry.source_groups.overlap, 0);
assert.deepEqual(new Set(generic.map(row => row.sha)), new Set(audit.changed_utility_names.filter(row => row.generic_phrase_before).map(row => row.sha)));
assert.deepEqual(new Set(ambiguous.map(row => row.sha)), new Set(registry.source_groups.ambiguous));

const display = new Set();
let changedNames = 0;
let moved = 0;
let unresolved = 0;
for (const row of decisions) {
  const entry = allCal.find(item => item.path === row.canonical_path);
  assert(entry && entry.sha === row.sha, 'catalog SHA ' + row.sha);
  for (const sourcePath of row.paths) {
    const source = allCal.find(item => item.path === sourcePath);
    assert(source && source.sha === row.sha, 'original path ' + sourcePath);
  }
  const item = org.get(row.sha);
  assert(item, 'map entry ' + row.sha);
  assert.equal(item.name, row.new_name, 'new name ' + row.sha);
  if (!overriddenShas.has(row.sha)) assert.equal(item.folder, row.new_folder, 'new folder ' + row.sha);
  assert(org.matches(entry, row.new_name), 'search new name ' + row.sha);
  assert(org.matches(entry, row.old_name), 'search old name ' + row.sha);
  if (row.previous_name) assert(org.matches(entry, row.previous_name), 'search previous name ' + row.sha);
  assert(org.matches(entry, row.canonical_path), 'search original path ' + row.sha);
  if (row.group === 'ambiguous' && !overriddenShas.has(row.sha)) {
    assert.equal(row.new_folder.split('/')[0], row.canonical_path.split('/')[1], 'root preserved ' + row.sha);
  }
  const key = (row.new_folder + '/' + row.new_name).toLowerCase();
  assert(!display.has(key), 'duplicate display path ' + key);
  display.add(key);
  const previousVisible = row.previous_name || row.old_name;
  if (previousVisible !== row.new_name) changedNames++;
  if (row.old_folder !== row.new_folder) moved++;
  if (!row.resolved) {
    unresolved++;
    assert(row.reason && item.reason, 'unresolved reason ' + row.sha);
  } else {
    assert(!row.reason && !item.reason, 'resolved reason removed ' + row.sha);
  }
}
assert.equal(changedNames, 164);
assert.equal(moved, 99);
assert.equal(unresolved, 18);
assert.equal(registry.counts.reviewed_sha, 174);
assert.equal(registry.counts.confirmed, 156);
assert.equal(registry.counts.needs_review, 18);
assert.equal(remainder.decisions.length, 2629);
assert.equal(remainder.ambiguous_entries.length, 18);
assert.equal(remainder.ambiguous, 18);
for (const row of remainder.ambiguous_entries) {
  assert(row.reason && org.reason(allCal.find(entry => entry.sha === row.sha)), 'remainder reason ' + row.sha);
}
for (const row of generic) {
  assert(!/сервисные функции|сервисные функции и коррекция пробега/i.test(row.new_name), row.new_name);
  assert(row.operation && row.unit && row.unit !== 'не подтверждено', 'evidenced operation ' + row.sha);
}
console.log(JSON.stringify({
  passed: 174,
  generic: generic.length,
  ambiguous: ambiguous.length,
  changed_names: changedNames,
  moved,
  unresolved,
  scope: 'map only; original paths/SHA/bytes untouched',
}));
