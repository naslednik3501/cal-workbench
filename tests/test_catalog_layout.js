// Node checks for the display-only iProg-style navigation layout.
// Original paths, names, CAL bytes and SHA-256 identities are not changed.
const path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const db=globalThis.CAL_CATALOG,scope=require('../catalog-scope.js'),org=require('../catalog-organization.js'),layout=require('../catalog-layout.js');
const all=db.entries.filter(e=>e.ext==='cal'),groups=scope.calculatorGroups(all);
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const folderOf=g=>org.displayFolder(g.e),partsOf=g=>folderOf(g).split('/');
const findPath=prefix=>all.find(e=>e.path.startsWith(prefix));

test('every CAL keeps its identity and receives a display path',()=>{
 const unique=new Set(all.map(e=>e.sha));
 assert.equal(groups.length,unique.size,'one group per unique SHA');
 assert.equal(groups.length,15057,'catalog calculator count');
 for(const g of groups){
  const shown=org.displayPath(g.e);
  assert(shown&&shown.endsWith('.cal'),'display path '+g.e.path);
  assert.equal(layout.path(shown),shown,'layout idempotence '+shown);
 }
});

test('top level is the six original iProg sections',()=>{
 const counts={};for(const g of groups){const rootName=partsOf(g)[0];counts[rootName]=(counts[rootName]||0)+1;}
 assert.deepEqual(counts,{Dashboard:7482,Airbag:5386,CarRadio:1566,Immo:428,OTHER:175,Engine:20});
 assert.deepEqual(Object.keys(counts).sort(),['Airbag','CarRadio','Dashboard','Engine','Immo','OTHER']);
});

test('Dashboard second level is the original subsection set, never a direct brand',()=>{
 const expected=['Asia','CRYPTO','EU_US_RU','France','Germany','Mototechnics','Service calc','Special technics','Прочие панели'];
 const subsections=new Set();
 for(const g of groups)if(partsOf(g)[0]==='Dashboard')subsections.add(partsOf(g)[1]);
 assert.deepEqual([...subsections].sort(),expected.sort());
});

test('spot checks follow the original regional layout',()=>{
 const cases=[
  ['Toyota','Dashboard/Asia/Toyota'],
  ['BMW','Dashboard/Germany/BMW'],
  ['Ford','Dashboard/EU_US_RU/Ford'],
  ['Renault','Dashboard/France/Renault'],
  ['Komatsu','Dashboard/Special technics/Komatsu'],
  ['CFmoto','Dashboard/Mototechnics/ATV/CFmoto'],
  ['I_ok','Dashboard/Прочие панели/I_ok']
 ];
 for(const [brand,expected] of cases){
  const g=groups.find(g=>{const f=folderOf(g);return f===expected||f.startsWith(expected+'/');});
  assert(g,brand+' group');assert(org.folder(g.e).toLowerCase().includes(brand.toLowerCase()),brand+' stored folder '+org.folder(g.e));
 }
});

test('legacy roots are consolidated without deleting anything',()=>{
 const legacy=new Set(['SRS','Подушки безопасности','Приборные панели','Bikes','Car','CRYPTO+','MOTO - TRUCK - ATV','ATV','Peugeot','CHINA','Asia','EU_US_RU']);
 for(const g of groups)assert(!legacy.has(partsOf(g)[0]),'legacy root rendered '+folderOf(g));
 assert(all.some(e=>org.get(e.sha).folder.startsWith('Asia/')),'stored legacy folders stay untouched');
 assert(groups.some(g=>org.get(g.e.sha).folder!==folderOf(g)),'stored and displayed folders are separate');
});

test('Mototechnics keeps the four original categories',()=>{
 const categories=new Set(['ATV','Snowmobiles','Jet Ski','Motobikes']);
 for(const g of groups)if(partsOf(g)[0]==='Dashboard'&&partsOf(g)[1]==='Mototechnics')assert(categories.has(partsOf(g)[2]),'moto category '+folderOf(g));
 assert(findPath('Calculators/Asia/Ski-Doo/'));
 const skiDoo=all.filter(e=>e.path.startsWith('Calculators/Asia/Ski-Doo/'));
 for(const e of skiDoo)assert.equal(folderOf({e}).split('/')[2],'Snowmobiles',e.path);
});

test('Engine contains only the catalog ECU calculators',()=>{
 const engine=groups.filter(g=>partsOf(g)[0]==='Engine');
 assert.equal(engine.length,20);
 for(const g of engine){
  assert(/^Calculators\/ECU\//i.test(g.e.path),g.e.path);
  assert(!folderOf(g).startsWith('Engine/Engine'),'duplicate Engine level '+folderOf(g));
  assert(!folderOf(g).split('/').includes('Bmw'),'canonical BMW case '+folderOf(g));
 }
});

test('display paths are unique across all calculator groups',()=>{
 const seen=new Map();
 for(const g of groups){
  const key=org.displayPath(g.e).toLowerCase();
  assert(!seen.has(key),'duplicate display path '+key+' ('+seen.get(key)+' / '+g.e.path+')');
  seen.set(key,g.e.path);
 }
});

test('search accepts the new sections as well as old names and original paths',()=>{
 const toyota=findPath('Calculators/Dashboard/Toyota/');
 for(const q of ['Dashboard/Asia','Asia','Toyota',toyota.path])assert(org.matches(toyota,q),q);
 const bmw=findPath('Calculators/Germany/BMW/');
 for(const q of ['Germany','BMW',bmw.path])assert(org.matches(bmw,q),q);
 const ferrari=findPath('Calculators/EU_US_RU/Ferrari/')||findPath('Calculators/Dashboard/Ferrari/');
 if(ferrari)for(const q of ['EU_US_RU','Ferrari',ferrari.path])assert(org.matches(ferrari,q),q);
});

test('settings, names and bytes stay exportable',()=>{
 const sample=groups[0].e,item=org.get(sample.sha);
 assert(item,'stored item');
 assert.equal(item.name,org.title(sample),'stored display name');
 assert(org.displayTitle(sample),'visible name');
 assert.equal(org.data.entries[sample.sha].folder,item.folder,'organization map not rewritten');
});

console.log(JSON.stringify({passed,scope:'six iProg top sections, Dashboard subsections, four moto categories, unique display paths, search and untouched stored data'}));
