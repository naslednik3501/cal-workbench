// Build the display map for Calculators/Airbag and Calculators/SRS.
// Evidence is read from the original paths and the CAL forms (labels only);
// no calculator is applied to a BIN and no CAL bytes are changed.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'catalog-organization-airbag.js');
const REPORT = path.join(ROOT, 'reports', 'catalog-airbag-organization-2026-11-04.json');
const SOURCE_REPORT = 'reports/catalog-organization-airbag-srs-2026-11-04.md';
const DATE = '2026-11-04';

require(path.join(ROOT, 'catalog.js'));
for (const file of require(path.join(ROOT, 'catalog-parts.json'))) require(path.join(ROOT, file));
const db = globalThis.CAL_CATALOG;
const engine = require(path.join(ROOT, 'engine.js'));

// These three SHA are already approved in catalog-organization.js. Their names
// and folders are intentionally kept byte-for-byte, so this generator skips them.
const APPROVED = {
  '44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045': 'Toyota 89170-02810',
  '31ef5b19a0c4c02c73ca84c2aafcc7230679c94758b75a4441b9dc6bc0ac2d79': 'Nissan 28556 3AP1B',
  'a20a16b57c2ec83a2ebd27a51d7eceec63035545f272a2afc815e6919cde9eaf': 'Chevrolet 96 806 850'
};

const BRANDS = [
  'Alfa Romeo', 'Land Rover', 'Great Wall', 'Mercedes', 'Volkswagen', 'Chevrolet',
  'Mitsubishi', 'SsangYong', 'Infiniti', 'Hyundai', 'Renault', 'Peugeot', 'Citroen',
  'Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Suzuki', 'Dacia', 'Daewoo',
  'Lada', 'Audi', 'BMW', 'Seat', 'Skoda', 'Kia', 'Ford', 'Opel', 'Fiat', 'Volvo',
  'Lexus', 'Acura', 'Chery', 'Saab', 'Chrysler', 'Cadillac', 'Mini', 'Jeep',
  'Jaguar', 'Hummer', 'Porsche', 'Dodge', 'Pontiac', 'Lifan', 'Datsun', 'Daihatsu',
  'Buick', 'Rover', 'Geely'
];
const BRAND_FIX = {
  huyndai: 'Hyundai',
  infinity: 'Infiniti',
  cherry: 'Chery',
  pontiak: 'Pontiac',
  vw: 'Volkswagen',
  'mercedes-benz': 'Mercedes'
};
const GENERIC = new Set(['1 universal', 'china']);
const NON_MODEL_DIRS = new Set(['1 universal','china','обновы','╨₧╨▒╨╜╨╛╨▓╤ï','service','lcm','ews-4','bsi','cas','smart key','dash','dashboard','pin','immo','navigation','diodes','smartcard','keycard','serial calculator','convertor','firmware','dump','dumps','backup','old','new','final','mcu','eeprom','processor','can','obd','tools','read','write','data','files','file','info','easy']);
const BRAND_SET = new Set(BRANDS.map(brand => brand.toLowerCase()));
const VENDORS = [
  'Mitsubishi Electric', 'Johnson Controls', 'Delphi', 'Continental', 'Visteon',
  'Autoliv', 'Bosch', 'Siemens', 'Temic', 'TRW', 'Denso', 'Sagem', 'Valeo',
  'Hella', 'Motorola', 'Kefico', 'Behr'
];
const MEMORY_CHIP = /\b(?:ST|M)?(?:93CS?(?:46|56|66|76|86)|95(?:010|020|040|080|160|128|320|640)|24(?:C|LC|AA|FC)(?:01|02|04|08|16|32|64|128|256)|25(?:C|LC)(?:010|020|040|080|160|320|640|128|256)|25(?:128|320|640))\b/gi;
const PROCESSOR_CHIP = /\b(?:MC9S12[A-Z0-9]*|MC68HC[A-Z0-9]*|68HC[0-9][0-9A-Z]*|XC2361A(?:-\d+)?|HC(?:05|08|11|12)[A-Z0-9]*|9S12[A-Z0-9]*|CR16[A-Z0-9]*|MAC\s*\d+)\b/gi;
const VERSION_WORD = /\b(?:var|ver|v)\s*\d+\b/gi;
const MOJIBAKE = /[\uFFFD╨╤₧╡╢╖╕]/;

const canonBrand = value => {
  if (!value) return '';
  const key = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (BRAND_FIX[key]) return BRAND_FIX[key];
  return BRANDS.find(brand => brand.toLowerCase() === key) || value.trim();
};
const knownBrand = value => !!value && BRAND_SET.has(canonBrand(value).toLowerCase());
const clean = value => String(value)
  .replace(/[()\[\]]/g, ' ')
  .replace(/_+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function brandsIn(text) {
  const value = ' ' + String(text)
    .replace(/[\\/]/g, ' ')
    .replace(/R\.?\s*Rover/gi, 'Land Rover')
    .replace(/Range Rover/gi, 'Land Rover')
    .replace(/Mitsubishi Electric/gi, ' ')
    .replace(/\s+/g, ' ') + ' ';
  const hits = [];
  for (const brand of [...BRANDS].sort((a, b) => b.length - a.length)) {
    const source = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|[^A-Za-z])${source}([^A-Za-z]|$)`, 'i').test(value)) hits.push(brand);
  }
  return [...new Set(hits)];
}

function imageBrand(images) {
  for (const file of images || []) {
    const name = file.replace(/\.(bmp|png|jpe?g)$/i, '').replace(/[_-]/g, ' ');
    const matches = brandsIn(name);
    if (matches.length === 1) return matches[0];
  }
  return '';
}

function pathScore(file) {
  let score = 0;
  if (file.startsWith('Calculators/Airbag/')) score -= 100;
  if (MOJIBAKE.test(file)) score += 1000;
  if (/Обновы|╨₧╨▒╨╜╨╛╨▓╤ï/i.test(file)) score += 500;
  const parts = file.split('/');
  if (parts[2] && canonBrand(parts[2]) !== parts[2]) score += 20;
  score -= Math.min(parts.length, 8) * 3;
  return score;
}

function memoryType(labels) {
  for (const label of labels || []) {
    const match = /(?:eeprom|еепром|епром)\s*:?\s*([A-Za-z0-9][A-Za-z0-9-]*)/i.exec(label);
    if (!match) continue;
    const value = match[1].toUpperCase();
    if (/^\d/.test(value) || /^(?:ST|M)?(?:MC|68HC|XC|HC|9S12|S12|95|93|24|25)/.test(value)) return value;
  }
  return '';
}

function operation(labels) {
  const text = (labels || []).join(' | ');
  if (/CRASH/i.test(text)) {
    return /моточас|motohour/i.test(text) ? 'сброс Crash и моточасов' : 'сброс Crash';
  }
  if (/Occupant/i.test(text) && /обнул/i.test(text)) return 'обнуление дампа блока Occupant';
  if (/стереть|обнул|сброс/i.test(text)) return 'сброс данных';
  return '';
}

function removeWords(value, words) {
  let result = ' ' + value + ' ';
  for (const word of words) {
    if (!word) continue;
    const source = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(^|\\s)${source}(?=\\s|$)`, 'gi'), ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
}

function modelName(model, brand) {
  let value = clean(model);
  for (const prefix of [brand, ...brand.split(' ')]) {
    if (!prefix) continue;
    const source = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${source}\\s+`, 'i');
    if (regex.test(value) && value.replace(regex, '').trim()) {
      value = value.replace(regex, '').trim();
      break;
    }
  }
  const fixes = {
    'grant vitara': 'Grand Vitara',
    otlander: 'Outlander',
    'grand vitara': 'Grand Vitara',
    rav4: 'RAV4',
    'rav-4': 'RAV4',
    'rav 4': 'RAV4',
    'a-class': 'A-Class',
    'b-class': 'B-Class',
    'c-class': 'C-Class',
    'e-class': 'E-Class',
    's-class': 'S-Class'
  };
  return fixes[value.toLowerCase().replace(/\s+/g, ' ')] || value;
}
function isModelDir(value, brand) {
  const text = clean(value);
  if (!text || /\.cal$/i.test(text)) return false;
  const lower = text.toLowerCase();
  if (NON_MODEL_DIRS.has(lower) || GENERIC.has(lower) || /[╨╤]/.test(text)) return false;
  if (VENDORS.some(vendor => vendor.toLowerCase() === lower)) return false;
  return !knownBrand(text) && canonBrand(text) !== brand;
}
function modelFolderName(value, brand) {
  const name = clean(modelName(value, brand)).replace(/[\\/]/g, ' ').replace(/\s+/g, ' ').trim();
  return name.length > 60 ? name.slice(0, 60).trim() : name;
}
function pathModel(parts, brand) {
  for (const dir of parts.slice(3, -1)) {
    if (!isModelDir(dir, brand)) continue;
    const name = modelFolderName(dir, brand);
    if (name) return name;
  }
  return '';
}
const MODEL_BY_BRAND = new Map();
for (const entry of db.entries) {
  if (entry.ext !== 'cal' || !/^Calculators\/(Airbag|SRS)\//i.test(entry.path)) continue;
  const parts = entry.path.split('/');
  const rawFolder = parts[2] || '';
  const nested = parts.slice(3, -1).map(canonBrand).find(knownBrand);
  const brand = nested || (rawFolder && !GENERIC.has(rawFolder.toLowerCase()) ? canonBrand(rawFolder) : '');
  if (!brand) continue;
  const model = pathModel(parts, brand);
  if (!model) continue;
  if (!MODEL_BY_BRAND.has(brand)) MODEL_BY_BRAND.set(brand, new Set());
  MODEL_BY_BRAND.get(brand).add(model);
}
function modelFromFileName(file, brand) {
  const text = clean(file.replace(/\.cal$/i, '')).toLowerCase();
  const models = [...(MODEL_BY_BRAND.get(brand) || [])].filter(model => /^[A-Za-z]/.test(model)).sort((a, b) => b.length - a.length);
  return models.find(model => text === model.toLowerCase() || text.startsWith(model.toLowerCase() + ' ')) || '';
}

const groups = new Map();
for (const entry of db.entries) {
  if (entry.ext !== 'cal' || !/^Calculators\/(Airbag|SRS)\//i.test(entry.path)) continue;
  if (!groups.has(entry.sha)) groups.set(entry.sha, []);
  groups.get(entry.sha).push(entry);
}

const rows = [];
for (const [sha, entries] of groups) {
  if (APPROVED[sha]) continue;
  const paths = entries.map(entry => entry.path).sort((a, b) => pathScore(a) - pathScore(b));
  const canonical = paths[0];
  const parts = canonical.split('/');
  const rawFolder = parts[2] || '';
  const pathDirs = parts.slice(3, -1).filter(Boolean);
  const rawModel = pathDirs[0] || '';

  let program;
  try {
    program = engine.parse(Uint8Array.from(Buffer.from(db.blobs[sha], 'base64')), { sha });
  } catch (error) {
    throw new Error(`Cannot parse ${canonical}: ${error.message}`);
  }
  const labels = (program.form?.controls || [])
    .filter(control => control.type === 'L')
    .map(control => String(control.text || '').trim())
    .filter(Boolean);
  const images = (program.form?.controls || [])
    .filter(control => control.type === 'P')
    .map(control => String(control.text || '').trim())
    .filter(Boolean);

  const description = labels.find(label => /Кальк|Утилита/i.test(label)) || '';
  const descriptionBrands = brandsIn(description);
  const folder = canonBrand(rawFolder);
  const generic = GENERIC.has(rawFolder.toLowerCase());
  let brand = '';
  let model = '';
  let reason = '';

  if (knownBrand(rawModel)) {
    const nested = canonBrand(rawModel);
    brand = nested === folder ? '' : nested;
  }

  if (!brand) {
    if (!generic && folder) {
      brand = folder;
      const found = descriptionBrands.filter(value => value !== 'Mitsubishi' || !/Mitsubishi Electric/i.test(description));
      if (found.length && found[0] !== folder) {
        if (found.length === 1 && rawModel && canonBrand(rawModel) === found[0]) {
          brand = found[0];
          model = '';
        } else if (folder === 'Daewoo' && found[0] === 'Chevrolet') {
          const formLogo = imageBrand(images);
          reason = formLogo === 'Chevrolet'
            ? 'путь указывает Daewoo, описание и логотип формы — Chevrolet Aveo; марка не подтверждена однозначно'
            : 'путь и логотип формы указывают Daewoo, описание — Chevrolet Aveo; марка не подтверждена однозначно';
        } else if (folder === 'Nissan' && found[0] === 'Infiniti') {
          reason = 'папка и модель Qashqai указывают Nissan, а форма и логотип — Infiniti; марка не подтверждена однозначно';
        } else if (folder === 'Rover' && found[0] === 'Land Rover') {
          brand = 'Land Rover';
        } else {
          reason = `марка в папке ${folder} не совпадает с описанием формы: ${found[0]}`;
        }
      }
    } else {
      const found = descriptionBrands.filter(value => value !== 'Mitsubishi' || !/Mitsubishi Electric/i.test(description));
      if (found.length === 1) brand = found[0];
      else if (found.length > 1) reason = `в форме несколько марок: ${found.join(', ')}`;
      else {
        const fromImage = imageBrand(images);
        if (fromImage) brand = fromImage;
        else reason = 'марка не указана в пути и форме';
      }
    }
  }

  const labelBrands = [...new Set(labels.flatMap(label => brandsIn(label)))];
  const imageBrandNames = [...new Set(images.flatMap(file => brandsIn(file.replace(/\.(bmp|png|jpe?g)$/i, ''))))];
  const rowBrands = [...new Set([...descriptionBrands, ...labelBrands, ...imageBrandNames, ...(brand ? [brand] : [])])];
  if (!reason && labelBrands.length > 1 && (generic || !folder)) {
    reason = `в форме и имени несколько марок: ${labelBrands.join(', ')}`;
  }
  if (reason) brand = '';

  const action = operation(labels);
  // A confirmed brand/model may stay useful even when the form does not prove
  // the erase operation. Keep it in the brand folder and mark the operation as
  // unconfirmed instead of hiding the calculator in the section root.
  let operationUnconfirmed = false;
  if (!reason && !action) {
    if (brand) operationUnconfirmed = true;
    else reason = 'в форме нет подтверждения операции стирания/сброса';
  }
  if (reason) brand = '';

  if (!reason && brand) model = pathModel(parts, brand) || modelFromFileName(parts.at(-1), brand);
  else model = '';

  const memory = memoryType(labels);
  const rawUnit = clean(parts.at(-1).replace(/\.cal$/i, ''));
  let unit = clean(rawUnit
    .replace(MEMORY_CHIP, ' ')
    .replace(PROCESSOR_CHIP, ' ')
    .replace(/\b(?:Eeprom|EEPROM|ЕЕПРОМ|епром|проц\.?|Flash|kB|BITE)\b/gi, ' ')
    .replace(/\b(?:4096|2048|1024|512)\s*(?:BITE|байт)?\b/gi, ' ')
    .replace(VERSION_WORD, ' '));
  unit = removeWords(unit, [brand, folder, model, 'VW', ...VENDORS].filter(Boolean));
  unit = unit.replace(/\b(?:DP|DPS)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  unit = unit.replace(/^[\s.,;:_-]+|[\s.,;:_-]+$/g, '');
  if (!unit) {
    const processor = rawUnit.match(PROCESSOR_CHIP);
    if (processor && processor[0].length > 2) unit = processor[0].toUpperCase();
  }
  if (operationUnconfirmed && model) {
    const compactModel = model.replace(/[-\s]/g, '');
    if (unit.toLowerCase().startsWith(compactModel.toLowerCase() + ' ')) {
      unit = unit.slice(compactModel.length).trim();
    }
  }
  if (model && unit.toLowerCase().startsWith(model.toLowerCase() + ' ')) unit = unit.slice(model.length).trim();
  if (model && unit.toLowerCase() === model.toLowerCase()) unit = '';
  if (memory && unit.toLowerCase() === memory.toLowerCase()) unit = '';
  if (unit.length > 70) unit = unit.slice(0, 70).replace(/\s+\S*$/, '').trim();

  let name = reason ? '' : [brand, model, unit].filter(Boolean).join(' ');
  if (!reason && operationUnconfirmed) {
    name = (name || brand) + ' — операция не подтверждена';
  } else if (!reason) {
    name += ' — ' + action;
    if (memory) name += ` (EEPROM ${memory})`;
  }
  if (!reason && !name) reason = 'не удалось построить название';
  const oldName = clean(parts.at(-1).replace(/\.cal$/i, ''));
  if (reason) name = oldName;

  rows.push({
    sha,
    paths,
    canonical,
    folder: reason ? 'Неуточнённые' : [brand, ...(model ? [model] : [])].filter(Boolean).join('/'),
    name,
    ...(rowBrands.length > 1 ? { brands: rowBrands } : {}),
    ...(operationUnconfirmed && oldName !== name ? { old_name: oldName } : {}),
    reason,
    memory,
    action,
    operationUnconfirmed,
    sources: [...new Set(paths.map(item => item.split('/')[1]))]
  });
}

// Different SHA are kept as separate calculators. When their display names
// coincide, the Airbag/SRS source distinguishes the two builds; within one
// source a deterministic version number is appended.
const byDisplay = new Map();
for (const row of rows) {
  const key = (row.folder + '/' + row.name).toLowerCase();
  if (!byDisplay.has(key)) byDisplay.set(key, []);
  byDisplay.get(key).push(row);
}
let collisionGroups = 0;
let sourceGroups = 0;
let versionGroups = 0;
for (const list of byDisplay.values()) {
  if (list.length < 2) continue;
  collisionGroups++;
  list.sort((a, b) => a.canonical.localeCompare(b.canonical));
  const singleSource = list.every(row => row.sources.length === 1);
  if (list.length === 2 && singleSource && list[0].sources[0] !== list[1].sources[0]) {
    sourceGroups++;
    for (const row of list) row.name += ` (${row.sources[0]})`;
  } else {
    versionGroups++;
    for (let index = 1; index < list.length; index++) list[index].name += ` · вариант ${index + 1}`;
  }
}

const airbagShas = new Set(groups.keys());
const covered = new Set([...rows.map(row => row.sha), ...Object.keys(APPROVED)]);
if (covered.size !== airbagShas.size) throw new Error(`Coverage ${covered.size} != ${airbagShas.size}`);
if ([...covered].some(sha => !airbagShas.has(sha))) throw new Error('Map contains a SHA outside Airbag/SRS');
if (rows.length !== airbagShas.size - Object.keys(APPROVED).length) throw new Error('Duplicate generated entries');

const validFolder = folder => {
  if (folder === 'Airbag') return true;
  const parts = folder.replace(/^Airbag\//, '').split('/');
  return parts.length >= 1 && parts.length <= 2 && BRANDS.includes(parts[0]) && parts.slice(1).every(Boolean);
};
const display = new Set();
for (const row of rows) {
  const displayFolder = row.folder === 'Неуточнённые' ? 'Airbag' : `Airbag/${row.folder}`;
  if (!validFolder(displayFolder)) throw new Error(`Invalid folder: ${row.folder}`);
  if (!row.name.trim() || row.name.length > 140 || /[\\/]/.test(row.name) || /\.cal$/i.test(row.name)) {
    throw new Error(`Invalid name: ${row.name}`);
  }
  if (row.folder === 'Неуточнённые' && !row.reason) throw new Error(`Missing reason: ${row.sha}`);
  if (row.folder !== 'Неуточнённые' && row.reason) throw new Error(`Unexpected reason: ${row.sha}`);
  if (row.folder !== 'Неуточнённые' && !row.action && !row.operationUnconfirmed) {
    throw new Error(`Missing operation: ${row.sha}`);
  }
  const key = `${row.folder}/${row.name}`.toLowerCase();
  if (display.has(key)) throw new Error(`Duplicate display path: ${key}`);
  display.add(key);
}

const totals = {
  paths: [...groups.values()].reduce((sum, list) => sum + list.length, 0),
  unique_sha: groups.size,
  generated_entries: rows.length,
  approved_entries: Object.keys(APPROVED).length,
  ambiguous: rows.filter(row => row.reason).length,
  operation_unconfirmed: rows.filter(row => row.operationUnconfirmed).length,
  memory_confirmed: rows.filter(row => row.memory).length,
  collision_groups: collisionGroups,
  source_groups: sourceGroups,
  version_groups: versionGroups
};
const byBrand = {};
const byModel = {};
const byAction = {};
for (const row of rows) {
  const brandFolder = row.folder.split('/')[0];
  byBrand[brandFolder] = (byBrand[brandFolder] || 0) + 1;
  if (row.folder.includes('/')) byModel[row.folder] = (byModel[row.folder] || 0) + 1;
  byAction[row.action || '(не подтверждена)'] = (byAction[row.action || '(не подтверждена)'] || 0) + 1;
}

const sorted = [...rows].sort((a, b) => a.sha.localeCompare(b.sha));
const lines = sorted.map(row => {
  const item = { name: row.name, folder: row.folder === 'Неуточнённые' ? 'Airbag' : `Airbag/${row.folder}` };
  if (row.reason) item.reason = row.reason;
  if (row.brands) item.brands = row.brands;
  if (row.old_name) item.old_name = row.old_name;
  return `  '${row.sha}':${JSON.stringify(item)},`;
});
const output = `/* Generated by tools/catalog_airbag_organization.js on ${DATE}. Do not edit by hand. */\n`
  + `/* Display-only map for Calculators/Airbag and Calculators/SRS; original paths, bytes and SHA stay unchanged. */\n`
  + `(function(root){\n'use strict';\nconst data={\n schema:1,\n source_report:${JSON.stringify(SOURCE_REPORT)},\n generated_from:['catalog.js','catalog-data/*.js','engine.js'],\n entries:{\n${lines.join('\n')}\n }\n};\n`
  + `root.CAL_ORGANIZATION_AIRBAG=data;\nif(typeof module==='object'&&module.exports)module.exports=data;\n})(globalThis);\n`;
fs.writeFileSync(OUT, output, 'utf8');

const report = {
  date: DATE,
  source_report: SOURCE_REPORT,
  generated_file: path.relative(ROOT, OUT),
  inputs: ['catalog.js', 'catalog-data/*.js', 'engine.js'],
  scope: ['Calculators/Airbag/**/*.cal', 'Calculators/SRS/**/*.cal'],
  totals,
  by_brand: byBrand,
  by_model: byModel,
  by_operation: byAction,
  approved_unchanged: Object.entries(APPROVED).map(([sha, label]) => ({ sha, label })),
  normalization: {
    Huyndai: 'Hyundai',
    Infinity: 'Infiniti',
    Cherry: 'Chery',
    Pontiak: 'Pontiac',
    'China (форма Tigo, логотип Chery)': 'Chery'
  },
  ambiguous: rows.filter(row => row.reason).map(row => ({
    sha: row.sha,
    paths: row.paths,
    title: row.name,
    reason: row.reason
  })),
  operation_unconfirmed: rows.filter(row => row.operationUnconfirmed).map(row => ({
    sha: row.sha,
    paths: row.paths,
    title: row.name,
    folder: `Airbag/${row.folder}`,
    old_name: row.old_name || ''
  }))
};
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({
  output: path.relative(ROOT, OUT),
  report: path.relative(ROOT, REPORT),
  totals,
  brands: Object.keys(byBrand).length
}, null, 2));



