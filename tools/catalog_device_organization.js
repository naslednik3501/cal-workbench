// Build display-only maps for device sections. Evidence comes from original
// paths and CAL form labels; no calculator is applied and no bytes are changed.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SECTION = String(process.argv[2] || process.env.SECTION || '').toLowerCase();
const DATE = '2026-11-04';
const ALLOWED = new Set(['dashboard', 'ecu', 'immo', 'radio', 'utilities']);
// These Dashboard brand folders were created by the 2026-11-05 root routing.
// Keeping them explicit makes repeated generation idempotent: they stay "new"
// in the root audit instead of turning into pre-existing folders on run two.
const DASHBOARD_CREATED_ROOT_FOLDERS = new Set([
  'Feeler', 'Hidromek', 'SYM', 'TCM', 'TFN', 'Terex', 'Triumph',
  'Curtis', 'Denso', 'Kansey', 'Visteon', 'Yazaki'
]);

require(path.join(ROOT, 'catalog.js'));
for (const file of require(path.join(ROOT, 'catalog-parts.json'))) require(path.join(ROOT, file));
const db = globalThis.CAL_CATALOG;
const engine = require(path.join(ROOT, 'engine.js'));
const scopeRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'scope-registry.json'), 'utf8'));

// Reference-confirmed Immo nesting from iProgGuard Immo.txt dated 2026-08-01.
// Only display folders move; names, original paths, bytes, SHA and versions
// stay unchanged. Exceptions keep the generated folder.
const IMMO_ROUTE_DATA = require('./catalog-immo-routes.json');
const IMMO_ROUTE_OVERRIDES = IMMO_ROUTE_DATA.routes;
const RADIO_ROUTE_DATA = require('./catalog-carradio-routes.json');
const RADIO_ROUTE_OVERRIDES = RADIO_ROUTE_DATA.routes;
// Reference-confirmed ECU nesting from iProgGuard Engine lists dated 2026-08-01.
// Only display folders move; names, original paths, bytes, SHA and versions
// stay unchanged. Exceptions keep the current ECU folder and its reason.
const ECU_ROUTE_DATA = require('./catalog-ecu-routes.json');
const ECU_ROUTE_OVERRIDES = ECU_ROUTE_DATA.routes;
const ECU_KEEP_FOLDERS = ECU_ROUTE_DATA.keep_folders || {};

const CONFIG = {
  dashboard: {
    display: 'Dashboard',
    output: 'catalog-organization-dashboard.js',
    report: 'reports/catalog-organization-dashboard-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-dashboard-2026-11-04.md',
    sources: ['Dashboard', 'I', 'I_ok'],
    purpose: 'Щитки, панели приборов, одометры и коррекция пробега.'
  },
  ecu: {
    display: 'ECU',
    output: 'catalog-organization-ecu.js',
    report: 'reports/catalog-organization-ecu-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-ecu-2026-11-04.md',
    sources: ['ECU'],
    purpose: 'Калькуляторы блоков управления двигателем: семейство, марка, модель или блок.'
  },
  immo: {
    display: 'Immo',
    output: 'catalog-organization-immo.js',
    report: 'reports/catalog-organization-immo-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-immo-2026-11-04.md',
    sources: ['Immo', 'Immo off', 'MB'],
    purpose: 'IMMO, EZS, транспондеры, IDEN и конвертеры ключей.'
  },
  radio: {
    display: 'CarRadio',
    output: 'catalog-organization-radio.js',
    report: 'reports/catalog-organization-radio-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-radio-2026-11-04.md',
    sources: ['CarRadio'],
    purpose: 'Автомагнитолы, навигация, коды, IMMO, карты и серийные калькуляторы.'
  },
  utilities: {
    display: 'OTHER',
    output: 'catalog-organization-utilities.js',
    report: 'reports/catalog-organization-utilities-2026-11-04.json',
    sourceReport: 'reports/catalog-organization-utilities-2026-11-04.md',
    sources: ['CRC', 'PIN', 'Service', 'Service calc', 'Synchronization',
      'Tachograf off', 'US-Euro converter', 'USA-Euro converter', 'OTHER'],
    purpose: 'CRC, PIN/IMMO, сервисные функции, синхронизация, тахографы и конвертеры US-EU.'
  }
};

if (!ALLOWED.has(SECTION)) {
  console.error('Usage: node tools/catalog_device_organization.js <dashboard|ecu|immo|radio|utilities>');
  process.exit(2);
}
const cfg = CONFIG[SECTION];
let previousEntries = {};
try {
  previousEntries = require(path.join(ROOT, cfg.output)).entries || {};
} catch (_) {
  // The first generation has no previous map; root routing then has no folders.
}
const existingFolders = new Set();
for (const item of Object.values(previousEntries)) {
  const prefix = cfg.display + '/';
  if (typeof item.folder === 'string' && item.folder.startsWith(prefix)) {
    existingFolders.add(item.folder.slice(prefix.length).split('/')[0]);
  }
}
if (SECTION === 'dashboard') {
  for (const brand of DASHBOARD_CREATED_ROOT_FOLDERS) existingFolders.delete(brand);
}
const createdFolders = new Set();

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
  'Terex', 'Triumph', 'TCM', 'SYM', 'TFN', 'Feeler', 'Hidromek',
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
const NON_MODEL_DIRS = new Set(['service','lcm','ews-4','bsi','cas','smart key','dash','dashboard','pin','immo','navigation','diodes','smartcard','keycard','serial calculator','convertor','1 universal','china','universal','универсальные','обновы','╨₧╨▒╨╜╨╛╨▓╤ï','firmware','dump','dumps','backup','old','new','final','mcu','eeprom','processor','can','obd','tools','read','write','data','files','file','info','easy','general']);
const MODEL_FIXES = {rav4:'RAV4','rav-4':'RAV4','rav 4':'RAV4','grant vitara':'Grand Vitara','grand vitara':'Grand Vitara',otlander:'Outlander','land rover lr2':'Land Rover LR2',cady:'Caddy',crv:'CR-V','a-class':'A-Class','b-class':'B-Class','c-class':'C-Class','e-class':'E-Class','s-class':'S-Class',rangar:'Ranger'};
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

const NOT_VEHICLE_BRANDS = new Set(VENDORS.map(value => value.toLowerCase()));

// Panel and radio vendors are not vehicle marques. Visteon/VDO/Bosch names in
// an Audi or Toyota file must not create a second possible brand.
function vehicleBrandsIn(text) {
  return brandsIn(text).filter(brand => !NOT_VEHICLE_BRANDS.has(brand.toLowerCase()));
}

// Root routing needs all image brands, not the first image that happens to
// contain one brand. Two logos on one form are two possible marques.
function imageBrands(images) {
  const found = new Set();
  for (const file of images || []) {
    const name = file.replace(/\.(bmp|png|jpe?g)$/i, '').replace(/[_-]/g, ' ');
    for (const brand of vehicleBrandsIn(name)) found.add(brand);
  }
  return [...found];
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addBrandToName(value, brand) {
  let text = clean(value);
  if (brand === 'Volkswagen') text = text.replace(/^VW\s*/i, '').trim();
  if (!text) return brand;
  const prefix = new RegExp(`^${escapeRegex(brand)}(?=\\s|$)`, 'i');
  return prefix.test(text) ? text.replace(prefix, brand) : `${brand} ${text}`;
}
function addPanelToName(value, panel) {
  let text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return panel;
  const prefix = new RegExp(`^${escapeRegex(panel)}(?=\\s|$)`, 'i');
  return prefix.test(text) ? text.replace(prefix, panel) : `${panel} ${text}`;
}

const PANEL_NAMES = ['Nippondenso','Denso','Yazaki','Kansey','Curtis','Visteon','Delphi','Continental','Bosch','Siemens','VDO','Magneti Marelli','Johnson Controls','Mitsubishi Electric'];
function panelManufacturer(labels) {
  const text = (labels || []).join(' | ');
  const found = [...text.matchAll(/(?:панель|panel|dash(?:board)?)\s*[:,-]?\s*([A-Za-z][A-Za-z .-]{1,30})/gi)];
  for (const match of found) {
    const value = clean(match[1]).replace(/[.,;:]+$/, '').trim().toLowerCase();
    if (!value) continue;
    if (value.includes('nippondenso') || value.includes('denso')) return 'Denso';
    const panel = PANEL_NAMES.find(name => value.startsWith(name.toLowerCase()));
    if (panel) return panel;
  }
  return '';
}
// A display root is not automatically universal. These rules only inspect
// entries that the earlier classifier left at Dashboard/. They deliberately
// require one unambiguous brand; a missing brand folder is created by routing.
function dashboardRootEvidence(file, labels, images) {
  const pathBrandValue = pathBrand(file);
  const base = clean(file.split('/').at(-1).replace(/(?:\.cal)+$/i, ''));
  const nameBrands = [...new Set(vehicleBrandsIn(base))];
  const labelBrands = [...new Set(vehicleBrandsIn((labels || []).join(' | ')))];
  const imageBrandsFound = imageBrands(images);
  const manufacturer = panelManufacturer(labels);
  const allBrands = [...new Set([...(pathBrandValue ? [pathBrandValue] : []), ...nameBrands, ...labelBrands, ...imageBrandsFound])];
  const several = list => `форма указывает несколько марок: ${list.join(', ')}; марка не подтверждена однозначно`;
  const result = (brand = '', reason = '') => ({ brand, reason, brands: allBrands, manufacturer });
  const conflict = reason => result('', reason);

  if (pathBrandValue) {
    if (nameBrands.length && !nameBrands.includes(pathBrandValue)) {
      return conflict(`путь указывает ${pathBrandValue}, имя — ${nameBrands.join(', ')}; марка не подтверждена однозначно`);
    }
    if (labelBrands.length > 1 && !nameBrands.includes(pathBrandValue)) return conflict(several(labelBrands));
    if (labelBrands.length === 1 && labelBrands[0] !== pathBrandValue) {
      return conflict(`путь указывает ${pathBrandValue}, форма — ${labelBrands[0]}; марка не подтверждена однозначно`);
    }
    if (imageBrandsFound.length && !imageBrandsFound.includes(pathBrandValue)) {
      return conflict(`путь указывает ${pathBrandValue}, изображение — ${imageBrandsFound.join(', ')}; марка не подтверждена однозначно`);
    }
    return result(pathBrandValue);
  }

  if (nameBrands.length > 1) return conflict(`имя указывает несколько марок: ${nameBrands.join(', ')}; марка не подтверждена однозначно`);
  if (nameBrands.length === 1) {
    const brand = nameBrands[0];
    if (labelBrands.length > 1 && !labelBrands.includes(brand)) return conflict(several(labelBrands));
    if (labelBrands.length === 1 && labelBrands[0] !== brand) {
      return conflict(`имя указывает ${brand}, форма — ${labelBrands[0]}; марка не подтверждена однозначно`);
    }
    if (imageBrandsFound.length && !imageBrandsFound.includes(brand)) {
      return conflict(`имя указывает ${brand}, изображение — ${imageBrandsFound.join(', ')}; марка не подтверждена однозначно`);
    }
    return result(brand);
  }

  const found = [...new Set([...labelBrands, ...imageBrandsFound])];
  if (!found.length) return result();
  if (found.length === 1) return result(found[0]);
  if (labelBrands.length && imageBrandsFound.length
    && !labelBrands.some(brand => imageBrandsFound.includes(brand))) {
    return conflict(`подписи указывают ${labelBrands.join(', ')}, изображение — ${imageBrandsFound.join(', ')}; марка не подтверждена однозначно`);
  }
  if (labelBrands.length > 1) return conflict(several(labelBrands));
  return conflict(`изображения указывают несколько марок: ${imageBrandsFound.join(', ')}; марка не подтверждена однозначно`);
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
  const brand = pathBrand(file);
  if (!brand) return '';
  const parts = file.split('/');
  let brandIndex = -1;
  for (let index = 1; index < parts.length - 1; index++) {
    if (canonBrand(parts[index]) === brand) { brandIndex = index; break; }
  }
  if (brandIndex < 0) return '';
  for (const dir of parts.slice(brandIndex + 1, -1)) {
    const text = clean(dir);
    if (!text || /\.cal$/i.test(text) || CATEGORY_DIRS.has(text) || isLetterDir(text)) continue;
    const lower = text.toLowerCase();
    if (NON_MODEL_DIRS.has(lower) || BRAND_CANON.has(lower) || /[╨╤]/.test(text)) continue;
    if (VENDORS.some(vendor => vendor.toLowerCase() === lower)) continue;
    let name = text;
    const prefix = new RegExp(`^${escapeRegex(brand)}\\s+`, 'i');
    if (prefix.test(name) && name.replace(prefix, '').trim()) name = name.replace(prefix, '').trim();
    name = MODEL_FIXES[name.toLowerCase().replace(/\s+/g, ' ')] || name;
    if (!name || NON_MODEL_DIRS.has(name.toLowerCase())) continue;
    return clean(name);
  }
  return '';
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
  'CRC', 'PIN', 'Service', 'Service calc', 'Synchronization',
  'Tachograf off', 'US-Euro converter', 'USA-Euro converter', 'OTHER'
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

function utilityCategory(file) {
  return utilitySource(file) || 'OTHER';
}

function utilityAmbiguous(file, labels) {
  const source = utilitySource(file);
  return source === 'PIN'
    && /^help$/i.test(utilityBase(file))
    && (labels || []).filter(label => label.trim().length > 1).length <= 1;
}

function utilityOperation(category, labels, file) {
  // The source folder chooses the section, not an operation promise. Only
  // visible labels and the original file name are evidence for a function.
  const base = file.split('/').at(-1);
  const evidence = [...(labels || []), base].join(' | ');
  const labelText = (labels || []).join(' | ');
  if (category === 'CRC') return 'правка CRC и VIN по выделению';
  if (category === 'Tachograf off') return 'отключение тахографа';
  if (category === 'Synchronization') return 'восстановление синхронизации';
  if (category === 'US-Euro converter' || category === 'USA-Euro converter') return 'конверсия миль ↔ км';
  if (/\bSRS\b|crash/i.test(evidence)) return 'сброс Crash (SRS)';
  const km = /пробег|одометр|mileage|miles|odometer|(^|[^A-Za-zА-Яа-яЁё])(?:km|км)(?![A-Za-zА-Яа-яЁё])/i.test(evidence);
  const service = /assy|service|сервис|interval|интервал/i.test(labelText) || /assy/i.test(base);
  if (service && km) return 'коррекция пробега и сервисных интервалов';
  if (service) return 'сервисные интервалы';
  if (km) return 'коррекция пробега';
  if (category === 'PIN' && /\bISN\b/i.test(evidence)) return 'ISN';
  if (category === 'PIN' && /\bPIN\b|\bIMMO\b|immobil|transponder|\bVIN\b|\blogin\b|данные\s+IMMO/i.test(evidence)) {
    return 'PIN и данные IMMO';
  }
  return '';
}

function utilityName(file, category, labels, ambiguous = false) {
  const base = utilityBase(file);
  const brand = utilityBrand(file);
  const labeled = brand && !brandsIn(base).length ? `${brand} ${base}`.trim() : base;
  if (ambiguous) return labeled;
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
  'catalog-organization-radio.js', 'catalog-organization-utilities.js']) {
  if (file === cfg.output) continue;
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
  const utilityFolder = SECTION === 'utilities' ? utilityCategory(canonical) : '';
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
    if (utilityAmbiguous(canonical, labels)) reason = 'имя Help и форма не подтверждают назначение расчёта';
  } else {
    if (!universal && !convertor && !brand) reason = 'марка не подтверждена путём или формой CAL';
    if (SECTION === 'dashboard' && !reason && !operation) reason = 'в форме нет подтверждения операции панели';
    if (SECTION === 'dashboard' && !reason && !parsed.parsed && !universal) reason = 'форма CAL недоступна для проверки операции';
    if (SECTION === 'immo' && !reason && !operation && !convertor) reason = 'в форме нет подтверждения операции IMMO';
    if (SECTION === 'radio' && !reason && !operation) reason = 'в форме нет подтверждения операции магнитолы';
  }

  const sourceFolder = canonical.split('/')[1] || '';
  const modelFolder = !reason && !universal && !convertor && brand ? pathModelFolder(canonical) : '';
  let folder = SECTION === 'utilities'
    ? utilityFolder
    : reason ? (SECTION === 'dashboard' ? (sourceFolder === 'Dashboard' ? '' : sourceFolder) : SECTION === 'immo' ? sourceFolder : SECTION === 'radio' ? 'CarRadio' : '')
      : universal ? (sourceFolder === 'CarRadio' ? 'Any model by dump' : sourceFolder === 'Dashboard' ? '' : sourceFolder)
        : convertor ? 'Convertor'
          : brand && (SECTION !== 'dashboard' || existingFolders.has(brand)) ? [brand, modelFolder].filter(Boolean).join('/') : '';
  let name = '';
  if (reason) {
    name = SECTION === 'utilities'
      ? utilityName(canonical, utilityFolder, labels, true) + ' — назначение не подтверждено'
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

  const legacyFolder = folder;
  const legacyName = name;
  const legacyReason = reason;
  const immoRouteFolder = SECTION === 'immo' ? IMMO_ROUTE_OVERRIDES[sha] || '' : '';
  if (immoRouteFolder) {
    if (reason) throw new Error(`Immo route override on ambiguous entry: ${sha}`);
    folder = immoRouteFolder;
  }
  const radioRouteFolder = SECTION === 'radio' ? RADIO_ROUTE_OVERRIDES[sha] || '' : '';
  if (radioRouteFolder) {
    if (reason) throw new Error(`Radio route override on ambiguous entry: ${sha}`);
    folder = radioRouteFolder;
  }
  const ecuRouteFolder = SECTION === 'ecu' && Object.prototype.hasOwnProperty.call(ECU_ROUTE_OVERRIDES, sha)
    ? ECU_ROUTE_OVERRIDES[sha] : null;
  if (ecuRouteFolder !== null) {
    if (reason) throw new Error(`ECU route override on ambiguous entry: ${sha}`);
    folder = ecuRouteFolder;
  } else if (SECTION === 'ecu' && Object.prototype.hasOwnProperty.call(ECU_KEEP_FOLDERS, sha)) {
    folder = ECU_KEEP_FOLDERS[sha];
  }
  let rootRouting = '';
  let routeBrands = [];
  let routeManufacturer = '';
  if (SECTION === 'dashboard' && legacyFolder === '') {
    // Dashboard/1, I and I_ok are source folders, not proof of a universal
    // calculator. Keep the old root only when the brand is not one clear value.
    // A confirmed brand is routed to its folder and the folder is created when
    // the previous display map did not contain it yet.
    const evidence = dashboardRootEvidence(canonical, labels, parsed.images);
    routeBrands = evidence.brands || [];
    if (evidence.brand) {
      const rootBrand = canonBrand(evidence.brand);
      if (!existingFolders.has(rootBrand)) createdFolders.add(rootBrand);
      folder = [rootBrand, pathModelFolder(canonical)].filter(Boolean).join('/');
      if (legacyReason || !operation) {
        const base = clean(canonical.split('/').at(-1).replace(/(?:\.cal)+$/i, ''));
        name = addBrandToName(base, rootBrand) + ' — операция не подтверждена';
      } else {
        const unit = unitFromPath(canonical, rootBrand);
        name = [rootBrand, unit].filter(Boolean).join(' ');
        if (!name) name = clean(canonical.split('/').at(-1).replace(/\.cal$/i, ''));
        name += ' — ' + operation;
        const memory = memoryType(labels, canonical);
        if (memory) name += ` (EEPROM ${memory})`;
      }
      reason = '';
      rootRouting = 'moved';
    } else if (evidence.manufacturer) {
      routeManufacturer = evidence.manufacturer;
      if (!existingFolders.has(routeManufacturer)) createdFolders.add(routeManufacturer);
      folder = routeManufacturer;
      name = addPanelToName(legacyName, routeManufacturer);
      if (!/ — /.test(name)) {
        if (operation) {
          name += ' — ' + operation;
          const memory = memoryType(labels, canonical);
          if (memory) name += ` (EEPROM ${memory})`;
        } else {
          name += ' — операция не подтверждена';
        }
      }
      reason = '';
      rootRouting = 'manufacturer';
    } else {
      reason = evidence.reason || legacyReason || 'марка не подтверждена путём или формой CAL';
      rootRouting = 'remaining';
    }
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
    legacyFolder,
    legacyName,
    legacyReason,
    immoRouteFolder,
    radioRouteFolder,
    ecuRouteFolder,
    ecuKeepFolder: SECTION === 'ecu' && Object.prototype.hasOwnProperty.call(ECU_KEEP_FOLDERS, sha),
    rootRouting,
    ...(routeBrands.length > 1 ? { brands: routeBrands } : {}),
    ...(routeManufacturer ? { manufacturer: routeManufacturer } : {}),
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

// Moving Bikes away from the flat brand folder changes which generated names
// collide. Keep every previously published Immo name exactly.
const IMMO_NAME_OVERRIDES = IMMO_ROUTE_DATA.name_overrides || {};
if (SECTION === 'immo') {
  for (const row of rows) {
    const preserved = IMMO_NAME_OVERRIDES[row.sha];
    if (preserved) row.name = preserved;
  }
  for (const sha of Object.keys(IMMO_NAME_OVERRIDES)) {
    if (!groups.has(sha)) throw new Error(`Immo name override outside the Immo volume: ${sha}`);
  }
}

// Moving radio entries into the reference categories changes collision groups.
// Keep every previously published CarRadio name exactly.
const RADIO_NAME_OVERRIDES = RADIO_ROUTE_DATA.name_overrides || {};
if (SECTION === 'radio') {
  for (const row of rows) {
    const preserved = RADIO_NAME_OVERRIDES[row.sha];
    if (preserved) row.name = preserved;
  }
  for (const sha of Object.keys(RADIO_NAME_OVERRIDES)) {
    if (!groups.has(sha)) throw new Error(`Radio name override outside the CarRadio volume: ${sha}`);
  }
}

// ECU names and the two existing reasons are published metadata; keep them
// exactly while the generated map takes over the 20 ECU entries.
const ECU_NAME_OVERRIDES = ECU_ROUTE_DATA.name_overrides || {};
const ECU_OLD_NAME_OVERRIDES = ECU_ROUTE_DATA.old_name_overrides || {};
const ECU_REASON_OVERRIDES = ECU_ROUTE_DATA.reason_overrides || {};
if (SECTION === 'ecu') {
  for (const row of rows) {
    if (ECU_NAME_OVERRIDES[row.sha]) row.name = ECU_NAME_OVERRIDES[row.sha];
    if (ECU_OLD_NAME_OVERRIDES[row.sha]) row.old_name = ECU_OLD_NAME_OVERRIDES[row.sha];
    if (ECU_REASON_OVERRIDES[row.sha]) row.reason = ECU_REASON_OVERRIDES[row.sha];
  }
  for (const sha of new Set([...Object.keys(ECU_NAME_OVERRIDES),
    ...Object.keys(ECU_OLD_NAME_OVERRIDES), ...Object.keys(ECU_REASON_OVERRIDES)])) {
    if (!groups.has(sha)) throw new Error(`ECU override outside the ECU volume: ${sha}`);
  }
}

const display = new Set();
for (const row of rows) {
  const relativeFolder = row.folder || '';
  row.folder = relativeFolder ? `${cfg.display}/${relativeFolder}` : cfg.display;
  row.name = String(row.name || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '⁄')
    .trim()
    .replace(/(?:\.cal)+$/i, '')
    .trim();
  const previous = previousEntries[row.sha];
  if (previous && previous.name && previous.name !== row.name) row.old_name = previous.name;
  else if (previous && previous.old_name) row.old_name = previous.old_name;
  const relativeParts = relativeFolder ? relativeFolder.split('/') : [];
  const immoCategory = SECTION === 'immo'
    && ['Car', 'Bikes', 'Convertor'].includes(relativeParts[0]);
  const maxImmoParts = immoCategory && relativeParts[0] !== 'Convertor' ? 3 : 2;
  const maxParts = SECTION === 'ecu' ? 3 : maxImmoParts;
  if (relativeParts.length > maxParts || relativeParts.some(part => !part || part === '.' || part === '..' || /[\\/]/.test(part)) || /^(?:\.|Неуточнённые|Универсальные|Конвертеры ключей)$/.test(relativeParts[0] || '')) {
    throw new Error(`Unexpected folder: ${row.folder}`);
  }
  if (immoCategory && relativeParts[0] === 'Convertor' && relativeParts.length !== 1) {
    throw new Error(`Unexpected Convertor folder: ${row.folder}`);
  }
  if (immoCategory && relativeParts[0] !== 'Convertor' && relativeParts.length < 2) {
    throw new Error(`Missing Immo brand: ${row.folder}`);
  }
  if (SECTION === 'utilities' && !UTILITY_FOLDERS.has(relativeFolder)) {
    throw new Error(`Unexpected utility folder: ${row.folder}`);
  }
  if (!row.name || row.name.length > 140 || /[\\/]/.test(row.name) || /\.cal$/i.test(row.name)) {
    throw new Error(`Invalid name: ${row.name}`);
  }
  if (row.reason && (!row.reason.trim() || row.reason.length > 240)) throw new Error(`Invalid reason: ${row.sha}`);
  if (SECTION === 'dashboard' && row.folder === cfg.display && !row.reason) {
    throw new Error(`Unreasoned Dashboard root entry: ${row.sha}`);
  }
  const key = `${row.folder}/${row.name}`.toLowerCase();
  if (display.has(key)) throw new Error(`Duplicate display path: ${key}`);
  display.add(key);
}
if (rows.length + skippedApproved.length !== groups.size) throw new Error(`Coverage ${rows.length} != ${groups.size}`);
if (SECTION === 'immo') {
  const routed = rows.filter(row => row.immoRouteFolder).length;
  if (routed !== Object.keys(IMMO_ROUTE_OVERRIDES).length) {
    throw new Error(`Immo routes applied ${routed} != ${Object.keys(IMMO_ROUTE_OVERRIDES).length}`);
  }
  for (const sha of Object.keys(IMMO_ROUTE_OVERRIDES)) {
    if (!groups.has(sha)) throw new Error(`Immo route outside the Immo volume: ${sha}`);
  }
  const expected = IMMO_ROUTE_DATA.counts || {};
  if (expected.generated_entries !== groups.size || rows.length !== expected.generated_entries) {
    throw new Error(`Immo generated volume ${rows.length}/${groups.size} != ${expected.generated_entries}`);
  }
  if (expected.approved_entries + expected.generated_entries !== expected.unique_sha) {
    throw new Error('Immo approved + generated volume does not match the unique SHA volume');
  }
  if (expected.moved !== routed || expected.exceptions !== rows.length - routed + expected.approved_entries
    || expected.already + expected.moved + expected.exceptions !== expected.unique_sha) {
    throw new Error('Immo reconciliation counts do not match the generated volume');
  }
}
if (SECTION === 'radio') {
  const routed = rows.filter(row => row.radioRouteFolder).length;
  if (routed !== Object.keys(RADIO_ROUTE_OVERRIDES).length) {
    throw new Error(`Radio routes applied ${routed} != ${Object.keys(RADIO_ROUTE_OVERRIDES).length}`);
  }
  for (const sha of Object.keys(RADIO_ROUTE_OVERRIDES)) {
    if (!groups.has(sha)) throw new Error(`Radio route outside the CarRadio volume: ${sha}`);
  }
  const expected = RADIO_ROUTE_DATA.counts || {};
  if (expected.generated_entries !== groups.size || rows.length !== expected.generated_entries) {
    throw new Error(`Radio generated volume ${rows.length}/${groups.size} != ${expected.generated_entries}`);
  }
  if (expected.approved_entries + expected.generated_entries !== expected.unique_sha) {
    throw new Error('Radio approved + generated volume does not match the unique SHA volume');
  }
  if (expected.moved !== routed || expected.exceptions !== rows.length - routed + expected.approved_entries
    || expected.already + expected.moved + expected.exceptions !== expected.unique_sha) {
    throw new Error('Radio reconciliation counts do not match the generated volume');
  }
}
if (SECTION === 'ecu') {
  const routed = rows.filter(row => row.ecuRouteFolder !== null).length;
  if (routed !== Object.keys(ECU_ROUTE_OVERRIDES).length) {
    throw new Error(`ECU routes applied ${routed} != ${Object.keys(ECU_ROUTE_OVERRIDES).length}`);
  }
  if (!rows.every(row => row.ecuRouteFolder !== null || row.ecuKeepFolder)) {
    throw new Error('ECU entry without an explicit route or keep folder');
  }
  for (const sha of Object.keys(ECU_ROUTE_OVERRIDES)) {
    if (!groups.has(sha)) throw new Error(`ECU route outside the ECU volume: ${sha}`);
  }
  for (const sha of Object.keys(ECU_KEEP_FOLDERS)) {
    if (!groups.has(sha)) throw new Error(`ECU keep folder outside the ECU volume: ${sha}`);
  }
  const expected = ECU_ROUTE_DATA.counts || {};
  if (expected.generated_entries !== groups.size || rows.length !== expected.generated_entries) {
    throw new Error(`ECU generated volume ${rows.length}/${groups.size} != ${expected.generated_entries}`);
  }
  if (expected.approved_entries + expected.generated_entries !== expected.unique_sha) {
    throw new Error('ECU approved + generated volume does not match the unique SHA volume');
  }
  if (expected.moved !== routed || expected.exceptions !== rows.length - routed + expected.approved_entries
    || expected.already + expected.moved + expected.exceptions !== expected.unique_sha) {
    throw new Error('ECU reconciliation counts do not match the generated volume');
  }
}

const byBrand = {};
const byModel = {};
const byOperation = {};
for (const row of rows) {
  const parts = row.folder.split('/');
  byBrand[parts[1] || parts[0]] = (byBrand[parts[1] || parts[0]] || 0) + 1;
  if (parts.length > 2) byModel[parts.slice(1).join('/')] = (byModel[parts.slice(1).join('/')] || 0) + 1;
  byOperation[row.operation || '(не подтверждена)'] = (byOperation[row.operation || '(не подтверждена)'] || 0) + 1;
}
const initialRootEntries = SECTION === 'dashboard' ? rows.filter(row => row.legacyFolder === '').length : 0;
const movedRootEntries = rows.filter(row => row.rootRouting === 'moved' || row.rootRouting === 'manufacturer').length;
const remainingRootRows = SECTION === 'dashboard' ? rows.filter(row => row.folder === cfg.display) : [];
const rootReasons = {};
for (const row of remainingRootRows) rootReasons[row.reason] = (rootReasons[row.reason] || 0) + 1;

const sorted = [...rows].sort((a, b) => a.sha.localeCompare(b.sha));
const lines = sorted.map(row => {
  const item = { name: row.name, folder: row.folder };
  if (row.reason) item.reason = row.reason;
  if (row.old_name) item.old_name = row.old_name;
  if (row.manufacturer) item.manufacturer = row.manufacturer;
  if (row.brands) item.brands = row.brands;
  return `  '${row.sha}':${JSON.stringify(item)},`;
});
const globalName = SECTION === 'dashboard'
  ? 'CAL_ORGANIZATION_DASHBOARD'
  : SECTION === 'ecu' ? 'CAL_ORGANIZATION_ECU'
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
  ...(row.immoRouteFolder || row.radioRouteFolder || row.ecuRouteFolder !== null ? { legacy_folder: row.legacyFolder } : {}),
  operation: row.operation,
  sources: row.sources,
  canonical_path: row.canonical,
  paths: row.paths,
  ...(row.old_name ? { old_name: row.old_name } : {}),
  ...(row.manufacturer ? { manufacturer: row.manufacturer } : {}),
  ...(row.brands ? { brands: row.brands } : {}),
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
  ] : SECTION === 'ecu' ? ['Calculators/ECU/**/*.cal']
    : SECTION === 'radio' ? ['Calculators/CarRadio/**/*.cal'] : [
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
    version_groups: versionGroups,
    ...(SECTION === 'dashboard' ? {
      root_initial: initialRootEntries,
      root_moved: movedRootEntries,
      root_remaining: remainingRootRows.length
    } : {})
  },
  source_paths: sourceCounts,
  car_only_selected_paths: [...new Set(carOnly)].sort(),
  approved_unchanged: skippedApproved,
  ...(SECTION === 'immo' ? {
    route_source: IMMO_ROUTE_DATA.source,
    route_source_sha256: IMMO_ROUTE_DATA.source_sha256,
    reconciliation_report: 'reports/catalog-immo-reconciliation-2026-11-06.json',
    reconciliation_counts: IMMO_ROUTE_DATA.counts,
    route_overrides: Object.entries(IMMO_ROUTE_OVERRIDES).map(([sha, folder]) => ({
      sha,
      folder,
      basis: IMMO_ROUTE_DATA.source
    })),
    name_overrides: Object.entries(IMMO_ROUTE_DATA.name_overrides || {}).map(([sha, name]) => ({ sha, name }))
  } : {}),
  ...(SECTION === 'radio' ? {
    route_source: RADIO_ROUTE_DATA.source,
    route_source_sha256: RADIO_ROUTE_DATA.source_sha256,
    reconciliation_report: 'reports/catalog-carradio-reconciliation-2026-11-06.json',
    reconciliation_counts: RADIO_ROUTE_DATA.counts,
    route_overrides: Object.entries(RADIO_ROUTE_OVERRIDES).map(([sha, folder]) => ({
      sha,
      folder,
      basis: RADIO_ROUTE_DATA.source
    })),
    name_overrides: Object.entries(RADIO_ROUTE_DATA.name_overrides || {}).map(([sha, name]) => ({ sha, name }))
  } : {}),
  ...(SECTION === 'ecu' ? {
    route_source: ECU_ROUTE_DATA.source,
    route_source_sha256: ECU_ROUTE_DATA.source_files,
    reconciliation_report: 'reports/catalog-ecu-reconciliation-2026-11-06.json',
    reconciliation_counts: ECU_ROUTE_DATA.counts,
    route_overrides: Object.entries(ECU_ROUTE_OVERRIDES).map(([sha, folder]) => ({
      sha,
      folder,
      basis: ECU_ROUTE_DATA.source
    })),
    keep_folders: Object.entries(ECU_KEEP_FOLDERS).map(([sha, folder]) => ({ sha, folder })),
    name_overrides: Object.entries(ECU_ROUTE_DATA.name_overrides || {}).map(([sha, name]) => ({ sha, name }))
  } : {}),
  ...(SECTION === 'dashboard' ? {
    root_routing: {
      initial_root: initialRootEntries,
      moved: movedRootEntries,
      moved_to_brand: rows.filter(row => row.rootRouting === 'moved').length,
      moved_to_manufacturer: rows.filter(row => row.rootRouting === 'manufacturer').length,
      remaining: remainingRootRows.length,
      by_reason: rootReasons,
      existing_folders: [...existingFolders].sort((a, b) => a.localeCompare(b)),
      created_folders: [...createdFolders].sort((a, b) => a.localeCompare(b)),
      folders_after: existingFolders.size + createdFolders.size,
      moved_entries: rows.filter(row => row.rootRouting === 'moved' || row.rootRouting === 'manufacturer').map(row => ({
        sha: row.sha,
        name: row.name,
        folder: row.folder,
        paths: row.paths,
        routing: row.rootRouting,
        ...(row.old_name ? { old_name: row.old_name } : {}),
        ...(row.manufacturer ? { manufacturer: row.manufacturer } : {}),
        ...(row.brands ? { brands: row.brands } : {})
      })),
      remaining_entries: remainingRootRows.map(row => ({
        sha: row.sha,
        name: row.name,
        paths: row.paths,
        reason: row.reason
      }))
    }
  } : {}),
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
  by_model: byModel,
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
