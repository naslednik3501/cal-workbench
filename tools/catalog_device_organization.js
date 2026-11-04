// Build display-only maps for device sections. Evidence comes from original
// paths and CAL form labels; no calculator is applied and no bytes are changed.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SECTION = String(process.argv[2] || process.env.SECTION || '').toLowerCase();
const DATE = '2026-11-04';
const ALLOWED = new Set(['dashboard', 'immo', 'radio', 'utilities']);

require(path.join(ROOT, 'catalog.js'));
for (const file of require(path.join(ROOT, 'catalog-parts.json'))) require(path.join(ROOT, file));
const db = globalThis.CAL_CATALOG;
const engine = require(path.join(ROOT, 'engine.js'));
const scopeRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'scope-registry.json'), 'utf8'));

const CONFIG = {
  dashboard: {
    display: 'Приборные панели',
    output: 'catalog-organization-dashboard.js',
    report: 'reports/catalog-organization-dashboard-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-dashboard-2026-11-04.md',
    sources: ['Dashboard', 'I', 'I_ok'],
    purpose: 'Щитки, панели приборов, одометры и коррекция пробега.'
  },
  immo: {
    display: 'Иммобилайзеры и ключи',
    output: 'catalog-organization-immo.js',
    report: 'reports/catalog-organization-immo-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-immo-2026-11-04.md',
    sources: ['Immo', 'Immo off', 'MB'],
    purpose: 'IMMO, EZS, транспондеры, IDEN и конвертеры ключей.'
  },
  radio: {
    display: 'Магнитолы и навигация',
    output: 'catalog-organization-radio.js',
    report: 'reports/catalog-organization-radio-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-radio-2026-11-04.md',
    sources: ['CarRadio'],
    purpose: 'Автомагнитолы, навигация, коды, IMMO, карты и серийные калькуляторы.'
  },
  utilities: {
    display: 'Утилиты',
    output: 'catalog-organization-utilities.js',
    report: 'reports/catalog-organization-utilities-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-utilities-2026-11-04.md',
    sources: ['CRC', 'PIN', 'Service', 'Service calc', 'Synchronization',
      'Tachograf off', 'US-Euro converter', 'USA-Euro converter', 'OTHER'],
    purpose: 'CRC, PIN/IMMO, сервисные функции, синхронизация, тахографы и конвертеры US-EU.'
  }
};

if (!ALLOWED.has(SECTION)) {
  console.error('Usage: node tools/catalog_device_organization.js <dashboard|immo|radio|utilities>');
  process.exit(2);
}
const cfg = CONFIG[SECTION];

const BRANDS = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Brilliance',
  'Buick', 'BYD', 'Cadillac', 'Changan', 'Chery', 'Chevrolet', 'Chrysler',
  'Citroen', 'Dacia', 'Daewoo', 'Daihatsu', 'Dodge', 'DongFeng', 'FAW',
  'Ferrari', 'Fiat', 'Ford', 'Foton', 'Freightliner', 'GAZ', 'Geely', 'GMC',
  'Great Wall', 'Haval', 'Hino', 'Hitachi', 'Honda', 'Hummer', 'Hyundai',
  'Infiniti', 'Isuzu', 'Iveco', 'JAC', 'Jaguar', 'Jeep', 'KAMAZ', 'Kia',
  'Lada', 'Lancia', 'Land Rover', 'Lexus', 'Lifan', 'Lincoln', 'Mahindra', 'MAN',
  'Maserati', 'Mazda', 'Mercedes-Benz', 'Mercury', 'MG', 'Mini', 'Mitsubishi',
  'Nissan', 'Opel', 'Peugeot', 'Pontiac', 'Porsche', 'Renault', 'Rover',
  'Saab', 'Samsung', 'Scania', 'Seat', 'Skoda', 'Smart', 'SsangYong',
  'Subaru', 'Suzuki', 'TAGAZ', 'TATA', 'Toyota', 'UAZ', 'VAZ', 'Volkswagen',
  'Volvo', 'ZAZ', 'BRP', 'Polaris', 'CFMOTO', 'Stels', 'Yamaha', 'Kawasaki',
  'Kymco', 'Baltmotors', 'Piaggio', 'Gilera', 'Aprilia', 'Ducati', 'GM',
  'Русская Механика', 'John Deere', 'Case', 'JCB',
  'Komatsu', 'CAT', 'Hamm', 'New Holland', 'Yanmar', 'Bobcat', 'KATO', 'XCMG', 'Shantui',
  'McCormick', 'Kirovec', 'Belarus', 'Higer', 'Golden Dragon', 'Ankai',
  'Blaupunkt', 'Grundig', 'Becker', 'Philips', 'Autosound', 'Alpine',
  'Matsushita', 'VDO', 'KENWOOD', 'Clarion', 'Pioneer', 'Delco', 'Technisat',
  'JVC', 'Sony', 'Panasonic', 'Siemens VDO', 'Visteon', 'INFO', 'EASY',
  'GAMASOUND', 'KNUTSSON', 'BILTEMA', 'YUGO'
];
const ALIASES = {
  audi: 'Audi', bmw: 'BMW', 'bmw ag': 'BMW', chery: 'Chery', cherry: 'Chery',
  chevrolet: 'Chevrolet', chevroley: 'Chevrolet', chrysler: 'Chrysler',
  crysler: 'Chrysler', citroen: 'Citroen', daihatsu: 'Daihatsu',
  dongfeng: 'DongFeng', 'dong feng': 'DongFeng', hyundai: 'Hyundai',
  huyndai: 'Hyundai', infiniti: 'Infiniti', infinity: 'Infiniti', jac: 'JAC',
  jaguar: 'Jaguar', kamaz: 'KAMAZ', kia: 'Kia', lada: 'Lada',
  'land rover': 'Land Rover', 'land rover lr2': 'Land Rover',
  'range rover': 'Land Rover', 'all rovers': 'Land Rover',
  mazda: 'Mazda', mercedes: 'Mercedes-Benz', 'mercedes benz': 'Mercedes-Benz',
  'mercedes-benz': 'Mercedes-Benz', mersedes: 'Mercedes-Benz', mers: 'Mercedes-Benz',
  benz: 'Mercedes-Benz', peugeot: 'Peugeot', pegeot: 'Peugeot',
  pontiac: 'Pontiac', pontiak: 'Pontiac', porsche: 'Porsche',
  saab: 'Saab', ssangyong: 'SsangYong', 'ssang yong': 'SsangYong',
  subaru: 'Subaru', suzuki: 'Suzuki', tagaz: 'TAGAZ', tata: 'TATA',
  volkswagen: 'Volkswagen', vw: 'Volkswagen', vdo: 'VDO', jvc: 'JVC',
  'siemens vdo': 'Siemens VDO', 'bmw': 'BMW', 'crysler': 'Chrysler',
  cat: 'CAT', caterpillar: 'CAT', kamatsu: 'Komatsu', chev: 'Chevrolet',
  zaz: 'ZAZ', gm: 'GM', 'general motors': 'GM', gillera: 'Gilera',
  'russkaya mehanika': 'Русская Механика'
};
const BRAND_CANON = new Map();
for (const brand of BRANDS) BRAND_CANON.set(brand.toLowerCase().replace(/\s+/g, ' '), brand);
for (const [alias, brand] of Object.entries(ALIASES)) BRAND_CANON.set(alias, brand);

const CATEGORY_DIRS = new Set([
  'ATV', 'Bikes', 'Motobikes', 'Snowmobile', 'Snowmobiles', 'Jet ski',
  'Special vehicles', 'Forklift truck', 'China', 'Car', 'Convertor',
  'Immo off', 'IDEN', 'Serial calculator', 'Diodes', 'Smartcard', 'Keycard',
  'Navigation', 'INFO', '1'
]);
const GENERIC = new Set(['1', 'universal', 'универсальные']);
const VENDORS = [
  'Mitsubishi Electric', 'Johnson Controls', 'Delphi', 'Continental', 'Visteon',
  'Autoliv', 'Bosch', 'Siemens', 'Temic', 'TRW', 'Denso', 'Sagem', 'Valeo',
  'Hella', 'Motorola', 'Kefico', 'Behr', 'VDO', 'Magneti Marelli', 'Visteon'
];
const MEMORY_CHIP = /\b(?:ST|M)?(?:93CS?(?:46|56|66|76|86)|95(?:010|020|040|080|160|128|320|640)|24(?:C|LC|AA|FC)(?:01|02|04|08|16|32|64|128|256)|25(?:C|LC)(?:010|020|040|080|160|320|640|128|256)|25(?:128|320|640))\b/gi;
const PROCESSOR_CHIP = /\b(?:MC9S12[A-Z0-9]*|MC68HC[A-Z0-9]*|68HC[0-9][0-9A-Z]*|XC2361A(?:-\d+)?|HC(?:05|08|11|12)[A-Z0-9]*|9S12[A-Z0-9]*|CR16[A-Z0-9]*|MAC\s*\d+|TMS\s*\d+|ST10F\d+[A-Z0-9-]*)\b/gi;
const VERSION_WORD = /\b(?:var|ver|v)\s*\d+\b/gi;
const MOJIBAKE = /[\uFFFD╨╤╬╧╪╫╩╦╠╣╝╜╛║╗╔╓╒╕]/;

const clean = value => String(value || '')
  .replace(/[()[\]{}]/g, ' ')
  .replace(/_+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function repairMojibake(text) {
  try {
    return Buffer.from(String(text), 'latin1').toString('utf8');
  } catch (_) {
    return String(text);
  }
}

function canonBrand(value) {
  const raw = clean(value);
  if (!raw) return '';
  const key = raw.toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return BRAND_CANON.get(key) || raw;
}

function isKnownBrand(value) {
  const raw = clean(value).toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return BRAND_CANON.has(raw);
}

function brandsIn(text) {
  const value = ' ' + String(text || '')
    .replace(/Mitsubishi Electric/gi, ' ')
    .replace(/Range Rover/gi, 'Land Rover')
    .replace(/R\.?\s*Rover/gi, 'Land Rover')
    .replace(/[\\/]/g, ' ')
    .replace(/\s+/g, ' ') + ' ';
  const hits = [];
  const aliases = [...BRAND_CANON.keys()].sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const brand = BRAND_CANON.get(alias);
    if (!brand || hits.includes(brand) || alias.length < 2) continue;
    const source = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const regex = new RegExp(`(^|[^A-Za-z0-9А-Яа-яЁё])${source}(?=[^A-Za-z0-9А-Яа-яЁё]|$)`, 'i');
    if (regex.test(value)) hits.push(brand);
  }
  return hits;
}

function imageBrand(images) {
  for (const file of images || []) {
    const name = file.replace(/\.(bmp|png|jpe?g)$/i, '').replace(/[_-]/g, ' ');
    const matches = brandsIn(name);
    if (matches.length === 1) return matches[0];
  }
  return '';
}

function isLetterDir(value) {
  return value.length === 1 && /^[A-ZА-ЯЁ]$/i.test(value) && value.toUpperCase() === value;
}

function pathBrand(file) {
  const parts = file.split('/');
  const source = parts[1] || '';
  if (source === 'Dashboard') {
    const top = parts[2] || '';
    if (top === 'Special vehicles') {
      const nested = parts.length > 3 && !/\.cal$/i.test(parts[3]) ? canonBrand(parts[3]) : '';
      if (nested && isKnownBrand(nested)) return nested;
      return brandsIn(parts.slice(2).join(' '))[0] || '';
    }
    if (CATEGORY_DIRS.has(top)) {
      if (top === '1') return '';
      return brandsIn(parts.slice(2).join(' '))[0] || '';
    }
    return canonBrand(top);
  }
  if ((source === 'I' || source === 'I_ok') && parts.length === 3) return '';
  if (source === 'Peugeot') return 'Peugeot';
  if (source === 'MB') return 'Mercedes-Benz';
  if (source === 'CarRadio') {
    const top = parts[2] || '';
    if (/\.cal$/i.test(top)) return '';
    if (['INFO', 'EASY'].includes(top)) return canonBrand(top);
    if (['Immo', 'Diodes', 'Smartcard', 'Keycard', 'Serial calculator', 'Navigation'].includes(top)) {
      const nested = parts.length > 3 && !/\.cal$/i.test(parts[3]) ? canonBrand(parts[3]) : '';
      if (nested && isKnownBrand(nested)) return nested;
      const found = brandsIn(parts.slice(2).join(' '));
      return found[0] || '';
    }
    return canonBrand(top);
  }
  if (source === 'Immo' || source === 'Immo off') {
    const dirs = parts.slice(2, -1).filter(part => part && !isLetterDir(part) && !CATEGORY_DIRS.has(part));
    for (let index = dirs.length - 1; index >= 0; index--) {
      const brand = canonBrand(dirs[index]);
      if (isKnownBrand(brand)) return brand;
    }
    const found = brandsIn(parts.slice(2).join(' '));
    return found[0] || '';
  }
  if (source === 'Car') {
    const dirs = parts.slice(2, -1).filter(part => part && !isLetterDir(part) && !CATEGORY_DIRS.has(part));
    for (let index = dirs.length - 1; index >= 0; index--) {
      const brand = canonBrand(dirs[index]);
      if (isKnownBrand(brand)) return brand;
    }
    const found = brandsIn(parts.slice(2).join(' '));
    if (found.length) return found[0];
    return dirs.length ? canonBrand(dirs.at(-1)) : '';
  }
  return '';
}

function pathModelFolder(file) {
  const parts = file.split('/');
  const source = parts[1] || '';
  const parent = parts.length > 3 ? parts.at(-2) : '';
  if (!parent || CATEGORY_DIRS.has(parent) || isLetterDir(parent)) return '';
  if (canonBrand(parent) === pathBrand(file)) return '';
  if (source === 'I' || source === 'I_ok' || SECTION === 'immo') return '';
  return clean(parent);
}

function pathScore(file) {
  const parts = file.split('/');
  const source = parts[1] || '';
  let score = 0;
  if (source === 'Dashboard') score -= 100;
  else if (source === 'Immo') score -= 100;
  else if (source === 'CarRadio') score -= 100;
  else if (source === 'Peugeot') score -= 60;
  else if (source === 'Immo off') score -= 60;
  else if (source === 'MB') score -= 50;
  else if (source === 'I' || source === 'I_ok') score -= 30;
  else if (source === 'Car') score += 30;
  else if (source === 'OTHER') score += 50;
  if (MOJIBAKE.test(file)) score += 1000;
  if (/Обновы|╨₧╨▒╨╜╨╛╨▓╤ï/i.test(file)) score += 500;
  if (parts[2] && canonBrand(parts[2]) !== parts[2]) score += 6;
  score -= Math.min(parts.length, 8);
  return score;
}

function memoryType(labels, file) {
  const text = [...(labels || []), file.split('/').at(-1)].join(' | ');
  const matches = text.match(MEMORY_CHIP);
  if (!matches) return '';
  return matches[0].replace(/^ST/i, '').toUpperCase();
}

function transponderType(labels, file) {
  const text = [...(labels || []), file.split('/').at(-1)].join(' | ');
  const found = [];
  const add = value => {
    if (!value) return;
    const normalized = value.toLowerCase();
    if (found.some(item => normalized === item.toLowerCase() || normalized.includes(item.toLowerCase()))) return;
    found.push(value);
  };
  let match = /Temic\s*(\d+)/i.exec(text); if (match) add(`Temic ${match[1]}`);
  match = /Philips\s*(\d+)/i.exec(text); if (match) add(`Philips ${match[1]}`);
  match = /Megamos\s*(\d+)/i.exec(text); if (match) add(`Megamos ${match[1]}`);
  match = /Texas\s*(?:\(?\s*тип\s*)?(\d+[A-Z]?)/i.exec(text); if (match) add(`Texas ${match[1].toUpperCase()}`);
  match = /Hitag\s*([A-Z0-9]+)?/i.exec(text); if (match) add('Hitag' + (match[1] ? ' ' + match[1].toUpperCase() : ''));
  match = /PCF\s*(\d+)/i.exec(text); if (match) add(`PCF${match[1]}`);
  match = /(^|[^A-Z0-9])(4[CD])(?=[^A-Z0-9]|$)/i.exec(text); if (match) add(match[2].toUpperCase());
  return found.slice(0, 2).join(', ');
}

function immoOperation(labels, file) {
  const text = [...(labels || []), file].join(' | ');
  if (/\/Convertor\//i.test(file)) return 'конвертер данных ключа';
  if (/Immo\s*off|удалить\s+IMMO|immobilizer\s*off/i.test(text)) return 'отключение IMMO';
  if (/\bIDEN\b/i.test(text)) return 'идентификация блока';
  if (/\bPIN\b/i.test(text)) return 'чтение PIN';
  if (/\bEZS\b/i.test(text)) return 'данные EZS';
  const type = transponderType(labels, file);
  if (type) return `данные транспондера ${type}`;
  if (/иммобилайзер|transponder|ключ|\bkey\b|\bIMMO\b/i.test(text)) return 'данные IMMO';
  return 'данные IMMO';
}

function radioOperation(labels, file) {
  const text = [...(labels || []), file].join(' | ');
  if (/Any model by dump/i.test(file)) return 'код магнитолы по дампу';
  if (/\/Navigation\//i.test(file) || /NAVIGATION/i.test(text)) return 'код навигации';
  if (/\/Serial calculator\//i.test(file)) return 'код по серийному номеру';
  if (/\/Diodes\//i.test(file) || /diodes?/i.test(file.split('/').at(-1))) return 'код по диодной матрице';
  if (/\/Smartcard\//i.test(file) || /\/Keycard\//i.test(file) || /SMARTCARD|KEYCARD/i.test(text)) return 'код карты';
  if (/\/Immo\//i.test(file) || /\bIMMO\b/i.test(text)) return 'код IMMO';
  return 'код магнитолы';
}

function radioUnit(file, brand, labels) {
  const parts = file.split('/');
  const base = clean(parts.at(-1).replace(/\.cal$/i, ''));
  const model = (labels || [])
    .map(label => /Model\s*:\s*(.*)$/i.exec(label))
    .map(match => match && clean(match[1]))
    .find(value => value && !/^any$/i.test(value)) || '';
  let unit = base.replace(/╤[üс]/g, 'C').replace(/╨[íС]/g, 'C');
  unit = unit
    .replace(MEMORY_CHIP, ' ')
    .replace(PROCESSOR_CHIP, ' ')
    .replace(VERSION_WORD, ' ')
    .replace(/\b(?:EEPROM|Eeprom|CODE|IMMO|IMMOBILIZER|NAVIGATION|SMARTCARD|KEYCARD|SERIAL|SN|MCU|SPI|FINAL|OLD|NEW|ANY|BY|DIG|DIGITS?|SEC\.?|TYPE|MANUFACTUREN|MANUFACTURER|MODEL)\b/gi, ' ')
    .replace(/[.,;:_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const aliases = Object.entries(ALIASES)
    .filter(([, value]) => value === brand)
    .map(([alias]) => alias.replace(/\b\w/g, letter => letter.toUpperCase()));
  unit = removeWords(unit, [brand, ...(brand || '').split(' '), ...aliases, ...VENDORS]);
  unit = unit.replace(/\b(?:code|calculator|calc)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!unit) unit = model || pathModelFolder(file) || '';
  unit = unit.replace(/\bno\s*$/i, '').replace(/\s+/g, ' ').trim();
  if (unit.length > 70) unit = unit.slice(0, 70).replace(/\s+\S*$/, '').trim();
  return unit;
}

function removeWords(value, words) {
  let result = ' ' + value + ' ';
  for (const word of words || []) {
    if (!word) continue;
    const source = String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    result = result.replace(new RegExp(`(^|\\s)${source}(?=\\s|$)`, 'gi'), ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
}

function modelName(value) {
  const result = clean(value);
  const fixes = {
    'grant vitara': 'Grand Vitara',
    otlander: 'Outlander',
    'grand vitara': 'Grand Vitara',
    'cady': 'Caddy'
  };
  return fixes[result.toLowerCase()] || result;
}

function unitFromPath(file, brand) {
  const parts = file.split('/');
  const base = clean(parts.at(-1).replace(/\.cal$/i, ''));
  const folder = pathModelFolder(file);
  let unit = base
    .replace(MEMORY_CHIP, ' ')
    .replace(PROCESSOR_CHIP, ' ')
    .replace(VERSION_WORD, ' ')
    .replace(/\b(?:EEPROM|ЕЕПРОМ|епром|проц\.?|Flash|kB|BITE|CRYPTO|DUMP|DASH|DASHBOARD|PANEL|ODOMETER|MILEAGE|KM|КМ)\b/gi, ' ')
    .replace(/\b(?:IMMO|IMMOBILIZER|IMMOBILISER|IDEN|TRANSPONDER|KEY|KEYS|ECU|BOX|CHIP|TEXAS|TEMIC|PHILIPS|MEGAMOS|HITAG)\b/gi, ' ')
    .replace(/\b(?:4[CD]|PCF\s*\d+)\b/gi, ' ')
    .replace(/\b(?:4096|2048|1024|512)\s*(?:BITE|байт)?\b/gi, ' ');
  const aliases = Object.entries(ALIASES)
    .filter(([, value]) => value === brand)
    .map(([alias]) => alias.replace(/\b\w/g, letter => letter.toUpperCase()));
  unit = removeWords(unit, [brand, ...(brand || '').split(' '), ...aliases, folder, 'VW', ...VENDORS]);
  unit = unit.replace(/\b(?:calculator|calc|new|ok|final|old|read|write|service|сервис)\b/gi, ' ');
  unit = unit.replace(/[.,;:_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!unit) unit = folder;
  if (folder && unit && !unit.toLowerCase().startsWith(folder.toLowerCase() + ' ') && unit.toLowerCase() !== folder.toLowerCase()) {
    unit = folder + ' ' + unit;
  }
  if (brand && unit.toLowerCase().startsWith(brand.toLowerCase() + ' ')) unit = unit.slice(brand.length).trim();
  unit = modelName(unit);
  if (unit.length > 70) unit = unit.slice(0, 70).replace(/\s+\S*$/, '').trim();
  return unit;
}

function parseEntry(entries) {
  for (const entry of entries) {
    try {
      const program = engine.parse(Uint8Array.from(Buffer.from(db.blobs[entry.sha], 'base64')), { sha: entry.sha });
      const labels = (program.form?.controls || [])
        .filter(control => control.type === 'L')
        .map(control => String(control.text || '').trim())
        .filter(Boolean);
      const images = (program.form?.controls || [])
        .filter(control => control.type === 'P')
        .map(control => String(control.text || '').trim())
        .filter(Boolean);
      return { labels, images, parsed: true };
    } catch (_) {
      // An unavailable calculator must still stay in the catalogue.
    }
  }
  return { labels: [], images: [], parsed: false };
}

function isDashboardCarOnly(entry, parsed) {
  const base = entry.path.split('/').at(-1).replace(/\.cal$/i, '');
  if (/dash|dashboard/i.test(base)) return true;
  const text = [...parsed.labels, base].join(' | ');
  return /пробег|одометр|mileage|miles/i.test(text)
    || /(^|[^A-Za-zА-Яа-яЁё])(?:km|км)(?=[^A-Za-zА-Яа-яЁё]|$)/i.test(text);
}

const dashboardShas = new Set(db.entries
  .filter(entry => entry.ext === 'cal' && entry.path.startsWith('Calculators/Dashboard/'))
  .map(entry => entry.sha));

function isImmoCarOnly(entry, parsed) {
  const base = entry.path.split('/').at(-1).replace(/\.cal$/i, '');
  if (/immo|immobil|key|transponder/i.test(base)) return true;
  const text = [...parsed.labels, base].join(' | ');
  return /иммобилайзер|immobil|transponder|temic|texas|philips|megamos|hitag|pcf|данные для|ключ|\bkey\b|\blogin\b/i.test(text)
    || (/\bECU\b/i.test(base) && /\bIMMO\b|\bLOGIN\b|\bVIN\b/i.test(text));
}

const immoShas = new Set(db.entries
  .filter(entry => entry.ext === 'cal' && ['Immo', 'Immo off', 'MB'].includes(entry.path.split('/')[1]))
  .map(entry => entry.sha));

const UTILITY_FOLDERS = new Set([
  'CRC', 'PIN и IMMO', 'Сервисные функции', 'Синхронизация', 'Тахографы',
  'Конвертеры US-EU', 'Неуточнённые'
]);

function utilityBase(file) {
  return clean(file.split('/').at(-1).replace(/\.cal$/i, ''))
    .replace(/╤[üс]/g, 'C')
    .replace(/╨[íС]/g, 'C')
    .replace(/\bTachograf\s*off\b/gi, ' ')
    .replace(/\bUSA?-Euro\s*converter\b/gi, ' ')
    .replace(/\s*\+\s*service\b/gi, ' ')
    .replace(/\bservice\s*$/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function utilitySource(file) {
  const parts = file.split('/');
  return parts[1] === 'OTHER' ? (parts[2] || '') : (parts[1] || '');
}

function utilityBrand(file) {
  const parts = file.split('/');
  const dirs = parts.slice(2, -1).filter(part => part && !CATEGORY_DIRS.has(part) && !isLetterDir(part));
  for (let index = dirs.length - 1; index >= 0; index--) {
    const brand = canonBrand(dirs[index]);
    if (isKnownBrand(brand)) return brand;
  }
  const found = brandsIn(parts.slice(2).join(' '));
  return found[0] || '';
}

function utilityCategory(file, labels) {
  const source = utilitySource(file);
  const text = [...(labels || []), file].join(' | ');
  if (source === 'CRC') return 'CRC';
  if (source === 'Tachograf off') return 'Тахографы';
  if (source === 'Synchronization') return 'Синхронизация';
  if (source === 'US-Euro converter' || source === 'USA-Euro converter') return 'Конвертеры US-EU';
  if (source === 'Service' || source === 'Service calc') return 'Сервисные функции';
  if (source === 'PIN') {
    if (/synchroni[sz]ation|восстановлен.*синхрон/i.test(text)) return 'Синхронизация';
    if (/^help$/i.test(utilityBase(file))
      && (labels || []).filter(label => label.trim().length > 1).length <= 1) return 'Неуточнённые';
    return 'PIN и IMMO';
  }
  return 'Неуточнённые';
}

function utilityOperation(category, labels, file) {
  const text = [...(labels || []), file].join(' | ');
  if (category === 'CRC') return 'правка CRC и VIN по выделению';
  if (category === 'Тахографы') return 'отключение тахографа';
  if (category === 'Синхронизация') return 'восстановление синхронизации';
  if (category === 'Конвертеры US-EU') return 'конверсия миль ↔ км';
  if (category === 'Сервисные функции') {
    if (/\bSRS\b|crash/i.test(text)) return 'сброс Crash (SRS)';
    return 'сервисные функции и коррекция пробега';
  }
  if (category === 'PIN и IMMO') {
    if (/\bISN\b/i.test(text)) return 'ISN и коррекция пробега';
    if (/\bPIN\b|\bIMMO\b|immobil|transponder|\bVIN\b|\blogin\b|данные\s+IMMO/i.test(text)) {
      return 'PIN и данные IMMO';
    }
    if (/пробег|одометр|mileage|odometer|\bkm\b|км/i.test(text)) return 'коррекция пробега';
  }
  return '';
}

function utilityName(file, category, labels) {
  const base = utilityBase(file);
  const brand = utilityBrand(file);
  const labeled = brand && !brandsIn(base).length ? `${brand} ${base}`.trim() : base;
  if (category === 'Неуточнённые') return `${labeled} — назначение не подтверждено`;
  if (category === 'CRC' && /dash[_\s-]*crc[_\s-]*vin/i.test(base)) {
    return 'CRC и VIN в дампе панели — отдельная сборка';
  }
  const operation = utilityOperation(category, labels, file);
  let name = [labeled, operation].filter(Boolean).join(' — ');
  if (name.length > 140) name = name.slice(0, 139).replace(/\s+\S*$/, '').trim() + '…';
  return name;
}

function selectedEntries() {
  const selected = [];
  const carOnly = [];
  for (const entry of db.entries) {
    if (entry.ext !== 'cal') continue;
    const parts = entry.path.split('/');
    const source = parts[1] || '';
    if (cfg.sources.includes(source)) {
      selected.push(entry);
      continue;
    }
    if (SECTION === 'dashboard' && source === 'Peugeot' && /\/Dash\b/i.test(entry.path)) {
      selected.push(entry);
      continue;
    }
    if (SECTION === 'dashboard' && source === 'Car'
      && !dashboardShas.has(entry.sha) && isDashboardCarOnly(entry, parseEntry([entry]))) {
      selected.push(entry);
      carOnly.push(entry.path);
      continue;
    }
    if (SECTION === 'immo' && source === 'Car'
      && !dashboardShas.has(entry.sha) && !immoShas.has(entry.sha)
      && isImmoCarOnly(entry, parseEntry([entry]))) {
      selected.push(entry);
      carOnly.push(entry.path);
    }
  }
  return { selected, carOnly };
}

const { selected, carOnly } = selectedEntries();
const groups = new Map();
for (const entry of selected) {
  if (!groups.has(entry.sha)) groups.set(entry.sha, []);
  groups.get(entry.sha).push(entry);
}

const approvedShas = new Set();
for (const file of ['catalog-organization.js', 'catalog-organization-airbag.js',
  'catalog-organization-dashboard.js', 'catalog-organization-immo.js',
  'catalog-organization-radio.js']) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const match of text.matchAll(/'([0-9a-f]{64})':/g)) approvedShas.add(match[1]);
}
const skippedApproved = [];
const rows = [];
for (const [sha, entries] of groups) {
  if (approvedShas.has(sha)) {
    skippedApproved.push({ sha, paths: entries.map(entry => entry.path) });
    continue;
  }
  const paths = entries.map(entry => entry.path).sort((a, b) => pathScore(a) - pathScore(b));
  const canonical = paths[0];
  const parts = canonical.split('/');
  const source = parts[1] || '';
  const parsed = parseEntry(entries);
  const labels = parsed.labels;
  const text = [...labels, canonical].join(' | ');
  const universal = (SECTION === 'dashboard' && (source === 'I' || source === 'I_ok' || parts[2] === '1'))
    || (SECTION === 'radio' && /Any model by dump/i.test(canonical));
  const convertor = SECTION === 'immo' && /\/Convertor\//i.test(canonical);
  const utilityFolder = SECTION === 'utilities' ? utilityCategory(canonical, labels) : '';
  let brand = universal ? '' : pathBrand(canonical);
  if (!brand && !universal && parsed.images.length) brand = imageBrand(parsed.images);
  if (!brand && !universal && labels.length) {
    const found = brandsIn(labels.join(' | '));
    if (found.length === 1) brand = found[0];
  }
  brand = canonBrand(brand);

  const operation = SECTION === 'dashboard'
    ? dashboardOperation(labels, canonical)
    : SECTION === 'immo' ? immoOperation(labels, canonical)
      : SECTION === 'radio' ? radioOperation(labels, canonical)
        : utilityOperation(utilityFolder, labels, canonical);
  let reason = '';
  if (SECTION === 'utilities') {
    if (utilityFolder === 'Неуточнённые') reason = 'имя Help и форма не подтверждают назначение расчёта';
  } else {
    if (!universal && !convertor && !brand) reason = 'марка не подтверждена путём или формой CAL';
    if (SECTION === 'dashboard' && !reason && !operation) reason = 'в форме нет подтверждения операции панели';
    if (SECTION === 'dashboard' && !reason && !parsed.parsed && !universal) reason = 'форма CAL недоступна для проверки операции';
    if (SECTION === 'immo' && !reason && !operation && !convertor) reason = 'в форме нет подтверждения операции IMMO';
    if (SECTION === 'radio' && !reason && !operation) reason = 'в форме нет подтверждения операции магнитолы';
  }

  const folder = SECTION === 'utilities'
    ? (reason ? 'Неуточнённые' : utilityFolder)
    : reason ? 'Неуточнённые' : universal ? 'Универсальные' : convertor ? 'Конвертеры ключей' : brand;
  let name = '';
  if (reason) {
    name = SECTION === 'utilities'
      ? utilityName(canonical, 'Неуточнённые', labels)
      : clean(canonical.split('/').at(-1).replace(/(?:\.cal)+$/i, ''));
  } else if (SECTION === 'utilities') {
    name = utilityName(canonical, utilityFolder, labels);
  } else if (universal && SECTION === 'radio') {
    name = 'Универсальный калькулятор кода магнитолы по дампу';
  } else {
    const unit = SECTION === 'radio' ? radioUnit(canonical, brand, labels) : unitFromPath(canonical, brand);
    name = [brand, unit].filter(Boolean).join(' ');
    if (!name) name = clean(canonical.split('/').at(-1).replace(/\.cal$/i, ''));
    if (convertor) name = unit.replace(/\s+to\s+/i, ' → ');
    name += ' — ' + operation;
    const memory = memoryType(labels, canonical);
    if (memory) name += ` (EEPROM ${memory})`;
  }
  rows.push({
    sha,
    paths,
    canonical,
    folder,
    name,
    reason,
    operation,
    universal,
    sources: [...new Set(paths.map(item => item.split('/')[1]))],
    parsed: parsed.parsed
  });
}
function dashboardOperation(labels, file) {
  const text = [...(labels || []), file.split('/').at(-1)].join(' | ');
  if (/пробег|одометр|mileage|miles/i.test(text) || /(^|[^A-Za-zА-Яа-яЁё])(?:km|км)(?=[^A-Za-zА-Яа-яЁё]|$)/i.test(text)) {
    return 'коррекция пробега';
  }
  if (/моточас|motohour|hour\s*meter|\bhours?\b/i.test(text)) return 'коррекция моточасов';
  if (/service|сервис/i.test(text)) return 'сброс сервисного интервала';
  if (/\bCRC\b/i.test(text)) return 'CRC панели';
  if (/decryptor|decrypt|crypto/i.test(text)) return 'декриптор панели';
  if (/\bDash\b/i.test(file.split('/').at(-1))) return 'коррекция пробега';
  return '';
}
// Different SHA stay separate. I and I_ok intentionally repeat names but carry
// different builds, so their source markers are kept visible.
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
  const ioPair = list.length === 2 && singleSource
    && list.every(row => ['I', 'I_ok'].includes(row.sources[0]))
    && list[0].sources[0] !== list[1].sources[0];
  if (ioPair) {
    sourceGroups++;
    for (const row of list) row.name += ` (${row.sources[0]})`;
  } else {
    versionGroups++;
    for (let index = 1; index < list.length; index++) list[index].name += ` · вариант ${index + 1}`;
  }
}

const allowedFolders = new Set(SECTION === 'utilities'
  ? [...UTILITY_FOLDERS].map(folder => `${cfg.display}/${folder}`)
  : [
    'Приборные панели/Универсальные',
    'Приборные панели/Неуточнённые'
  ]);
const display = new Set();
for (const row of rows) {
  row.folder = `${cfg.display}/${row.folder}`;
  row.name = String(row.name || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '⁄')
    .trim()
    .replace(/(?:\.cal)+$/i, '')
    .trim();
  allowedFolders.add(row.folder);
  if (SECTION === 'utilities' && !UTILITY_FOLDERS.has(row.folder.slice(cfg.display.length + 1))) {
    throw new Error(`Unexpected utility folder: ${row.folder}`);
  }
  if (!row.name || row.name.length > 140 || /[\\/]/.test(row.name) || /\.cal$/i.test(row.name)) {
    throw new Error(`Invalid name: ${row.name}`);
  }
  if (row.folder.endsWith('/Неуточнённые') && !row.reason) throw new Error(`Missing reason: ${row.sha}`);
  if (!row.folder.endsWith('/Неуточнённые') && row.reason) throw new Error(`Unexpected reason: ${row.sha}`);
  const key = `${row.folder}/${row.name}`.toLowerCase();
  if (display.has(key)) throw new Error(`Duplicate display path: ${key}`);
  display.add(key);
}
if (rows.length + skippedApproved.length !== groups.size) throw new Error(`Coverage ${rows.length} != ${groups.size}`);

const byBrand = {};
const byOperation = {};
for (const row of rows) {
  byBrand[row.folder] = (byBrand[row.folder] || 0) + 1;
  byOperation[row.operation || '(не подтверждена)'] = (byOperation[row.operation || '(не подтверждена)'] || 0) + 1;
}

const sorted = [...rows].sort((a, b) => a.sha.localeCompare(b.sha));
const lines = sorted.map(row => {
  const item = { name: row.name, folder: row.folder };
  if (row.reason) item.reason = row.reason;
  return `  '${row.sha}':${JSON.stringify(item)},`;
});
const globalName = SECTION === 'dashboard'
  ? 'CAL_ORGANIZATION_DASHBOARD'
  : SECTION === 'immo' ? 'CAL_ORGANIZATION_IMMO'
    : SECTION === 'radio' ? 'CAL_ORGANIZATION_RADIO' : 'CAL_ORGANIZATION_UTILITIES';
const output = `/* Generated by tools/catalog_device_organization.js ${SECTION} on ${DATE}. Do not edit by hand. */\n`
  + `/* Display-only map for ${cfg.display}; original paths, bytes and SHA stay unchanged. */\n`
  + `(function(root){\n'use strict';\nconst data={\n schema:1,\n source_report:${JSON.stringify(cfg.sourceReport)},\n generated_from:['catalog.js','catalog-data/*.js','engine.js'],\n entries:{\n${lines.join('\n')}\n },\n search_aliases:{}\n};\n`
  + `root.${globalName}=data;\nif(typeof module==='object'&&module.exports)module.exports=data;\n})(globalThis);\n`;
const outputPath = path.join(ROOT, cfg.output);
fs.writeFileSync(outputPath, output, 'utf8');

const sourceCounts = {};
for (const entry of selected) {
  const source = entry.path.split('/')[1] || '';
  sourceCounts[source] = (sourceCounts[source] || 0) + 1;
}
const nonCal = SECTION === 'utilities' ? db.entries
  .filter(entry => entry.ext !== 'cal'
    && cfg.sources.includes(entry.path.split('/')[1] || ''))
  .map(entry => ({ path: entry.path, ext: entry.ext, sha: entry.sha, bytes: entry.size }))
  : [];
const nonCalByExt = {};
for (const item of nonCal) nonCalByExt[item.ext] = (nonCalByExt[item.ext] || 0) + 1;
const decisions = sorted.map(row => ({
  sha: row.sha,
  name: row.name,
  folder: row.folder,
  operation: row.operation,
  sources: row.sources,
  canonical_path: row.canonical,
  paths: row.paths,
  ...(row.reason ? { reason: row.reason } : {})
}));
const report = {
  date: DATE,
  section: cfg.display,
  source_report: cfg.sourceReport,
  generated_file: cfg.output,
  inputs: ['catalog.js', 'catalog-data/*.js', 'engine.js'],
  purpose: cfg.purpose,
  scope: SECTION === 'dashboard' ? [
    'Calculators/Dashboard/**/*.cal',
    'Calculators/I/**/*.cal',
    'Calculators/I_ok/**/*.cal',
    'Calculators/Peugeot/**/Dash*.cal',
    'selected Calculators/Car/**/*.cal with dashboard evidence'
  ] : SECTION === 'immo' ? [
    'Calculators/Immo/**/*.cal',
    'Calculators/Immo off/**/*.cal',
    'Calculators/MB/**/*.cal',
    'selected Calculators/Car/**/*.cal with IMMO/key evidence'
  ] : SECTION === 'radio' ? ['Calculators/CarRadio/**/*.cal'] : [
    'Calculators/CRC/**/*.cal',
    'Calculators/PIN/**/*.cal',
    'Calculators/Service/**/*.cal',
    'Calculators/Service calc/**/*.cal',
    'Calculators/Synchronization/**/*.cal',
    'Calculators/Tachograf off/**/*.cal',
    'Calculators/US-Euro converter/**/*.cal',
    'Calculators/USA-Euro converter/**/*.cal',
    'Calculators/OTHER/**/*.cal'
  ],
  totals: {
    paths: selected.length,
    unique_sha: groups.size,
    generated_entries: rows.length,
    approved_unchanged: skippedApproved.length,
    ambiguous: rows.filter(row => row.reason).length,
    car_only_selected: carOnly.length,
    collision_groups: collisionGroups,
    source_groups: sourceGroups,
    version_groups: versionGroups
  },
  source_paths: sourceCounts,
  car_only_selected_paths: [...new Set(carOnly)].sort(),
  approved_unchanged: skippedApproved,
  decisions,
  ...(SECTION === 'utilities' ? {
    non_cal_resources: {
      total: nonCal.length,
      by_ext: nonCalByExt,
      note: 'Не-CAL файлы сохранены как есть; в отображение не переносились и мусором не объявлялись.',
      items: nonCal.sort((a, b) => a.path.localeCompare(b.path))
    },
    hardware_policy: {
      registry_decisions: Object.keys(scopeRegistry.decisions).length,
      resource_rules: scopeRegistry.resource_rules.length,
      new_cal_exclusions: 0,
      note: 'Подтверждённые аппаратные ссылки уже исключены адресными правилами T-001; среди утилит новых hardware-only CAL не найдено, Help.cal оставлен неопределённым.'
    }
  } : {}),
  by_brand: byBrand,
  by_operation: byOperation,
  ambiguous: rows.filter(row => row.reason).map(row => ({
    sha: row.sha,
    paths: row.paths,
    title: row.name,
    reason: row.reason
  })),
  car_only_not_selected: ['radio', 'utilities'].includes(SECTION) ? [] : db.entries
    .filter(entry => entry.ext === 'cal'
      && entry.path.startsWith('Calculators/Car/')
      && !selected.some(chosen => chosen.path === entry.path)
      && !dashboardShas.has(entry.sha)
      && !(SECTION === 'immo' && immoShas.has(entry.sha)))
    .map(entry => ({
      path: entry.path,
      reason: SECTION === 'dashboard'
        ? 'путь и форма не подтверждают панель/пробег'
        : 'путь и форма не подтверждают IMMO/ключ'
    }))
};
fs.mkdirSync(path.dirname(path.join(ROOT, cfg.report)), { recursive: true });
fs.writeFileSync(path.join(ROOT, cfg.report), JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({
  section: cfg.display,
  output: cfg.output,
  report: cfg.report,
  totals: report.totals,
  folders: Object.keys(byBrand).length
}, null, 2));
