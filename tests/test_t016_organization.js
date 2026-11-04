// Node checks for the T-016 display map and the real app handlers in a minimal DOM adapter.
// This is not browser rendering or a vehicle compatibility check.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const db=globalThis.CAL_CATALOG,scope=require('../catalog-scope.js'),org=require('../catalog-organization.js'),dashboard=require('../catalog-organization-dashboard.js'),immo=require('../catalog-organization-immo.js'),radio=require('../catalog-organization-radio.js');
const mapOverlap=[...Object.keys(dashboard.entries)].filter(sha=>immo.entries[sha]).length;
const radioOverlap=[...Object.keys(radio.entries)].filter(sha=>dashboard.entries[sha]||immo.entries[sha]).length;
const expected=[
 ['faa4784def192d83d899083b360c2cc805dd9f6653bf7042c571980bf31b2c1a','Calculators/Fabia 93C86 2006 decryptor.cal','Skoda Fabia 2006 — декриптор EEPROM 93C86','Приборные панели/Skoda'],
 ['2ebd61f105e5ce3fcaae4d2ffad46aca471ff22cdf3616e50582dc30a42d4970','Calculators/Super B 93C86 decryptor.cal','Skoda Superb — декриптор EEPROM 93C86','Приборные панели/Skoda'],
 ['d0920cc81247ab7dd31d013dc130dd092747b666546e024382e67d8196ee9877','Calculators/philips temp.cal','Philips — заготовка калькулятора кода','Магнитолы и навигация/Неуточнённые'],
 ['b3503228dbb6c6b5e45352dd753f61c4d1b472bf04f84f1ff15a0c3fe57a2224','Calculators/hitag2.cal','Hitag2 — контрольная сумма CRC по выделению','Утилиты/CRC'],
 ['4f38ff98c567bd82e80821515a7e948c214cdc2a30aa26e15de3fc27bc7da1f1','Calculators/Immo_Outlander_crc_vin.cal','Mitsubishi Outlander — CRC и VIN в IMMO по выделению','Иммобилайзеры и ключи/Mitsubishi'],
 ['b5d3f7c4be6434423a32c1a2f0c09a0bbf640cbddd0f16c9547022d5efe49621','Calculators/dash_crc_vin.cal','CRC и VIN в дампе панели — правка по выделению','Утилиты/CRC'],
 ['21b6963bdadeb104e7fe4b807542c56b79931aac78a5d388ac67e14729c01f9b','Calculators/MasterKey to Kmrw 2.cal','MasterKey → Kmrw — конвертер данных транспондера (8 или 16 байт)','Иммобилайзеры и ключи/Конвертеры ключей'],
 ['89db59ed2be0d1cdd84c78d59a31cc15775a6712833b03de406f2e531e185d9f','Calculators/color.cal','Etsmart — справочник цветовых кодов','Утилиты/Справочники'],
 ['7498ed09f8cdcfed8b151c496de2c73e13e4baa3dfcb7a7b32d01806bd5689d2','Calculators/invert.cal','Инверсия первых 128 КиБ дампа','Утилиты/Инверсия'],
 ['44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045','Calculators/Airbag/89170-02810(93C56).cal','Toyota 89170-02810 — сброс Crash (SRS)','Подушки безопасности/Toyota'],
 ['31ef5b19a0c4c02c73ca84c2aafcc7230679c94758b75a4441b9dc6bc0ac2d79','Calculators/Airbag/28556 3AP1B  (93C56).cal','Nissan 28556 3AP1B — сброс Crash (SRS)','Подушки безопасности/Nissan'],
 ['a20a16b57c2ec83a2ebd27a51d7eceec63035545f272a2afc815e6919cde9eaf','Calculators/Airbag/96 806 850 5WY67070 ST95160.cal','Chevrolet 96 806 850 (5WY67070) — сброс Crash (SRS)','Подушки безопасности/Chevrolet']
];
const airbagEntries=db.entries.filter(e=>e.ext==='cal'&&/^Calculators\/(Airbag|SRS)\//i.test(e.path));
const airbagShas=new Set(airbagEntries.map(e=>e.sha));
const approvedShas=new Set(expected.map(item=>item[0]));
const generatedEntries=new Map(Object.entries(org.data.entries).filter(([sha])=>airbagShas.has(sha)&&!approvedShas.has(sha)));

class Element{
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.parentNode=null;this.dataset={};this.style={};this.attrs={};this.events={};this._text='';this.className='';this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.open=false;this.files=[];this.classList={contains:n=>this.className.split(/\s/).includes(n),toggle:(n,on)=>{let s=new Set(this.className.split(/\s/).filter(Boolean));if(on??!s.has(n))s.add(n);else s.delete(n);this.className=[...s].join(' ');},remove:n=>{this.classList.toggle(n,false);}};}
 set id(x){this._id=x;this.doc.ids[x]=this;}get id(){return this._id;}
 get childNodes(){return this.children;}
 set textContent(t){this.children=[];this._text=String(t);}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 append(...items){for(let x of items){if(typeof x==='string')x=this.doc.createTextNode(x);x.remove();x.parentNode=this;this.children.push(x);}}
 replaceChildren(...items){for(const x of this.children)x.parentNode=null;this.children=[];this._text='';this.append(...items);}
 remove(){if(this.parentNode){let a=this.parentNode.children;a.splice(a.indexOf(this),1);this.parentNode=null;}}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,v){(this.events[k]??=[]).push(v);}
 focus(){this.doc.activeElement=this;}select(){}
 async trigger(k,extra={}){const e={target:this,preventDefault(){},stopPropagation(){},...extra};if(this['on'+k])await this['on'+k](e);for(const fn of this.events[k]||[])await fn(e);}
 click(){if(this.tagName==='A'){this.doc.downloads.push({name:this.download,blob:this.doc.urls.get(this.href)});return;}if(!this.disabled)return this.trigger('click');}
 querySelectorAll(q){const matches=e=>q.startsWith('.')?e.classList.contains(q.slice(1)):q==='[data-icon]'?!!e.dataset.icon:e.tagName===q.toUpperCase();const out=[];const walk=e=>{for(const c of e.children){if(matches(c))out.push(c);walk(c);}};walk(this);return out;}
}
const doc={events:{},addEventListener(k,fn){(this.events[k]??=[]).push(fn);},ids:{},urls:new Map(),downloads:[],createElement(t){return new Element(t,this);},createElementNS(ns,t){return this.createElement(t);},createTextNode(t){let e=this.createElement('#text');e.textContent=t;return e;},getElementById(id){return this.ids[id]||null;},querySelectorAll(q){return this.body.querySelectorAll(q);}};doc.body=doc.createElement('body');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)){let el=doc.createElement(match[1]);el.id=match[2];el.value=/\bvalue="([^"]*)"/.exec(match[0])?.[1]||'';doc.body.append(el);}
doc.ids.hex.tBodies=[doc.createElement('tbody')];doc.ids.hex.append(doc.ids.hex.tBodies[0]);
let urlId=0;const context=vm.createContext({document:doc,CAL_IMAGES:require('../image-resources.js'),CatalogOrganization:org,CatalogScope:scope,CalEngine:require('../engine.js'),CAL_CATALOG,CatalogStore:{...require('../catalog-store.js'),Store:class{async load(){return [];}async save(e){this.saved=e;}}},console,Uint8Array,Blob,TextDecoder,crypto:crypto.webcrypto,atob,btoa,URL:{createObjectURL(blob){let u='blob:test-'+(++urlId);doc.urls.set(u,blob);return u;},revokeObjectURL(){}},setTimeout(){},Date});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),el=id=>doc.ids[id];let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
const entry=sha=>db.entries.find(e=>e.sha===sha);

(async()=>{
await run('catalogReady');
await test('the 12 approved SHAs keep their exact names, folders and display paths',()=>{
 assert.equal(Object.keys(org.data.entries).length,5392+Object.keys(dashboard.entries).length+Object.keys(immo.entries).length+Object.keys(radio.entries).length-mapOverlap-radioOverlap);assert.equal(expected.length,12);
 const shown=new Set(),originals=new Set();
 for(const [sha,oldPath,name,folder] of expected){
  const rows=db.entries.filter(e=>e.sha===sha);
  assert.equal(rows.length,1,sha);assert.equal(rows[0].path,oldPath,sha);assert.equal(rows[0].source,'Calculators.zip');
  assert.equal(org.title(rows[0]),name);assert.equal(org.folder(rows[0]),folder);
  const display=folder+'/'+name+'.cal';assert.equal(org.displayPath(rows[0]),display);
  assert(!shown.has(display.toLowerCase()),'duplicate display '+display);shown.add(display.toLowerCase());
  assert(!originals.has(oldPath),'duplicate original '+oldPath);originals.add(oldPath);
 }
 // The display path is virtual: it must never sit on a real catalogue file.
 for(const display of shown)assert(!db.entries.some(e=>e.path.toLowerCase()==='calculators/'+display),'collision '+display);
 assert.equal(new Set(db.entries.filter(e=>e.ext==='cal').map(e=>e.sha)).size,db.meta.uniqueCal);
});
await test('all Airbag and SRS SHA are covered by unique, reasoned display entries',()=>{
 assert.equal(airbagEntries.length,7664);assert.equal(airbagShas.size,5383);
 assert.equal(generatedEntries.size,5380);
 for(const sha of airbagShas)assert(org.get(sha),'missing '+sha);
 const outside=[...Object.keys(org.data.entries)].filter(sha=>!airbagShas.has(sha));
 assert.equal(outside.length,9+Object.keys(dashboard.entries).length+Object.keys(immo.entries).length+Object.keys(radio.entries).length-mapOverlap-radioOverlap,'only approved, dashboard, immo and radio entries stay outside Airbag');
 const display=new Map(),folders=new Set();
 for(const e of airbagEntries){
  const item=org.get(e.sha),name=e.path.split('/').at(-1).replace(/\.cal$/i,'');
  assert(item,e.sha);assert(item.folder.startsWith('Подушки безопасности/'),item.folder);
  const brand=item.folder.split('/')[1];folders.add(item.folder);
  assert(!['Huyndai','Infinity','Cherry','Pontiak','China','1 Universal'].includes(brand),brand);
  if(brand==='Неуточнённые'){
   assert(item.reason,'reason for '+e.sha);assert(org.title(e).startsWith(name),'original name kept '+e.sha);
  }else{
   assert(!item.reason,'no reason outside Неуточнённые '+e.sha);assert(/ — (?:сброс|обнуление)/.test(item.name),item.name);
  }
  assert(org.matches(e,name),'old name search '+e.sha);
  assert(org.matches(e,e.path),'old path search '+e.sha);
  assert(org.matches(e,item.name),'new name search '+e.sha);
  assert(org.matches(e,item.folder),'folder search '+e.sha);
  const key=org.displayPath(e).toLowerCase(),owner=display.get(key);
  assert(!owner||owner===e.sha,'display collision '+key);display.set(key,e.sha);
 }
 for(const brand of ['Hyundai','Infiniti','Chery','Pontiac'])assert(folders.has('Подушки безопасности/'+brand),brand);
 assert.equal(folders.size,51,'50 brands plus Неуточнённые');
 assert.equal(org.data.airbag_report,'reports/catalog-organization-airbag-srs-2026-11-04.md');
 assert.equal(org.data.dashboard_report,'reports/catalog-organization-dashboard-2026-11-04.md');
});
await test('dashboard source paths are covered once, while Car ECU/Immo keep their own rules',()=>{
 const report=require('../reports/catalog-organization-dashboard-2026-11-04.json');
 assert.equal(Object.keys(dashboard.entries).length,report.totals.unique_sha);
 const selected=db.entries.filter(e=>e.ext==='cal'&&(
  e.path.startsWith('Calculators/Dashboard/')||
  e.path.startsWith('Calculators/I/')||
  e.path.startsWith('Calculators/I_ok/')||
  /\/Dash\b/i.test(e.path)&&e.path.startsWith('Calculators/Peugeot/')
 ));
 const carOnly=new Set(report.car_only_selected_paths);
 for(const e of selected)assert(org.get(e.sha),'dashboard path is mapped '+e.path);
 for(const e of db.entries.filter(e=>e.ext==='cal'&&carOnly.has(e.path)))assert(org.get(e.sha),'confirmed Car dashboard is mapped '+e.path);
 const display=new Set();
 for(const [sha,item] of Object.entries(dashboard.entries)){
  assert(item.folder.startsWith('Приборные панели/'),item.folder);
  assert(org.get(sha),sha);
  if(item.folder.endsWith('/Неуточнённые'))assert(item.reason&&item.reason.length<240,sha);
  else assert(!item.reason&&/ — /.test(item.name),sha);
  const key=(item.folder+'/'+item.name).toLowerCase();
  assert(!display.has(key),'dashboard display collision '+key);display.add(key);
 }
 for(const path of [
  'Calculators/Car/Ford/Mondeo ECU TMS 370 4C.cal',
  'Calculators/Car/Daihatsu/Move v1.cal',
  'Calculators/Car/Chrysler/PT Cruiser 2003 Immo login.cal',
  'Calculators/Car/Ford/Ka  Immo 7701 4C.cal'
 ]){
  const e=db.entries.find(item=>item.path===path);assert(e,path);
  const item=org.get(e.sha);
  assert(!item||!item.folder.startsWith('Приборные панели/'),'non-dashboard Car entry must not be mapped as a panel '+path);
  assert(org.matches(e,'car'),'old path search still works '+path);
 }
 const sample=selected.find(e=>org.get(e.sha)&&!org.get(e.sha).reason);
 assert(org.matches(sample,org.title(sample)),'new dashboard name is searchable');
});

await test('immo source paths are covered once and dashboard/ECU entries are not stolen',async()=>{
 const report=require('../reports/catalog-organization-immo-2026-11-04.json');
 assert.equal(Object.keys(immo.entries).length,report.totals.unique_sha);
 assert.equal(report.totals.ambiguous,0);
 const source=db.entries.filter(e=>e.ext==='cal'&&['Immo','Immo off','MB'].includes(e.path.split('/')[1]));
 for(const e of source)assert(org.get(e.sha),'immo source is mapped '+e.path);
 const carOnly=new Set(report.car_only_selected_paths);
 for(const e of db.entries.filter(e=>e.ext==='cal'&&carOnly.has(e.path)))assert(org.get(e.sha),'confirmed Car IMMO is mapped '+e.path);
 for(const [sha,item] of Object.entries(immo.entries)){
  assert(item.folder.startsWith('Иммобилайзеры и ключи/'),item.folder);
  assert(org.get(sha),sha);
  assert(/ — (?:данные|чтение|идентификация|отключение|конвертер)/.test(item.name),item.name);
  if(item.folder.endsWith('/Неуточнённые'))assert(item.reason,sha);
 }
 for(const path of [
  'Calculators/Car/M/Mazda/MAZDA 2 93C86-2017.cal'
 ]){
  const e=db.entries.find(item=>item.path===path);assert(e,path);
  assert.equal(org.get(e.sha),null,'non-IMMO Car entry stays unclassified '+path);
 }
 const panel=db.entries.find(e=>e.path==='Calculators/Car/Citroen/Citroen/Berlingo/Dash Berlingo 25020.cal');
 assert(panel&&org.folder(panel).startsWith('Приборные панели/'),'dashboard evidence remains a panel');
 const sample=db.entries.find(e=>e.path==='Calculators/Immo/Car/Fiat/Barchetta v1.cal');
 run('select(entries.find(e=>e.sha==='+JSON.stringify(sample.sha)+'))');
 assert.equal(el('calcTitle').textContent,org.title(sample));
 assert(el('calcPath').textContent.includes(sample.path));
 doc.downloads.length=0;await el('exportCal').click();
 const download=doc.downloads.at(-1);
 assert.equal(download.name,sample.path.split('/').at(-1));
 assert.deepEqual(Buffer.from(await download.blob.arrayBuffer()),Buffer.from(db.blobs[sample.sha],'base64'));
 const folders=[...new Set(Object.values(immo.entries).map(item=>item.folder))];
 const sectionCount=Object.values(org.data.entries).filter(item=>item.folder.startsWith('Иммобилайзеры и ключи/')).length;
 run("expandedFolders.clear();catalogScope='Иммобилайзеры и ключи';"+folders.map(folder=>'expandedFolders.add('+JSON.stringify(folder)+')').join(';')+';renderCatalog()');
 const walk=(item,cls)=>item.children.flatMap(c=>[...(c.className?.startsWith(cls)?[c]:[]),...walk(c,cls)]);
 assert.equal(walk(el('tree'),'fileItem').length,sectionCount,'all IMMO calculators are shown once');
 el('search').value='иммобилайзеры и ключи';run('searchPage=0;renderCatalog()');
 assert(el('searchPager').textContent.includes(sectionCount+' · 1/'));
 el('search').value='';run('expandedFolders.clear();catalogScope=\'\';searchPage=0;renderCatalog()');
});

await test('radio and navigation paths keep operations, brands and original exports',async()=>{
 const report=require('../reports/catalog-organization-radio-2026-11-04.json');
 assert.equal(Object.keys(radio.entries).length,report.totals.unique_sha);
 assert.equal(report.totals.ambiguous,0);
 const source=db.entries.filter(e=>e.ext==='cal'&&e.path.startsWith('Calculators/CarRadio/'));
 for(const e of source)assert(org.get(e.sha),'radio source is mapped '+e.path);
 const display=new Set();
 for(const [sha,item] of Object.entries(radio.entries)){
  assert(item.folder.startsWith('Магнитолы и навигация/'),item.folder);
  assert(org.get(sha),sha);
  if(item.folder.endsWith('/Универсальные'))assert(/код[а]? магнитолы/.test(item.name),item.name);
  else assert(/ — код(?: |$)/.test(item.name),item.name);
  if(item.folder.endsWith('/Неуточнённые'))assert(item.reason,sha);
  const key=(item.folder+'/'+item.name).toLowerCase();
  assert(!display.has(key),'radio display collision '+key);display.add(key);
 }
 const check=(path,operation)=>{
  const e=db.entries.find(item=>item.path===path);assert(e,path);
  const item=org.get(e.sha);assert(item,path);assert(item.name.includes(operation),path+' -> '+item.name);
 };
 check('Calculators/CarRadio/Diodes/Daewoo/AKL-1626JS.cal','код по диодной матрице');
 check('Calculators/CarRadio/Serial calculator/BECKER SN.cal','код по серийному номеру');
 check('Calculators/CarRadio/Navigation/AUDI/FIS AUDI coder.cal','код навигации');
 const any=db.entries.find(e=>e.path==='Calculators/CarRadio/Any model by dump.cal');
 assert(any&&org.folder(any)==='Магнитолы и навигация/Универсальные');
 const sample=db.entries.find(e=>e.path==='Calculators/CarRadio/Philips/22DC679.cal');
 run('select(entries.find(e=>e.sha==='+JSON.stringify(sample.sha)+'))');
 assert.equal(el('calcTitle').textContent,org.title(sample));
 assert(el('calcPath').textContent.includes(sample.path));
 doc.downloads.length=0;await el('exportCal').click();
 const download=doc.downloads.at(-1);
 assert.equal(download.name,sample.path.split('/').at(-1));
 assert.deepEqual(Buffer.from(await download.blob.arrayBuffer()),Buffer.from(db.blobs[sample.sha],'base64'));
 const sectionCount=Object.values(org.data.entries).filter(item=>item.folder.startsWith('Магнитолы и навигация/')).length;
 const folders=[...new Set(Object.values(org.data.entries).filter(item=>item.folder.startsWith('Магнитолы и навигация/')).map(item=>item.folder))];
 run("expandedFolders.clear();catalogScope='Магнитолы и навигация';"+folders.map(folder=>'expandedFolders.add('+JSON.stringify(folder)+')').join(';')+';renderCatalog()');
 const walk=(item,cls)=>item.children.flatMap(c=>[...(c.className?.startsWith(cls)?[c]:[]),...walk(c,cls)]);
 assert.equal(walk(el('tree'),'fileItem').length,sectionCount,'all radio calculators are shown once');
 el('search').value='магнитолы и навигация';run('searchPage=0;renderCatalog()');
 assert(el('searchPager').textContent.includes(sectionCount+' · 1/'));
 el('search').value='';run('expandedFolders.clear();catalogScope=\'\';searchPage=0;renderCatalog()');
});

await test('every approved SHA stays its own calculator; sibling versions are not merged',()=>{
 const groups=scope.calculatorGroups(db.entries),bySha=new Map(groups.map(g=>[g.e.sha,g]));
 for(const [sha] of expected){const g=bySha.get(sha);assert(g,sha);assert.equal(g.aliases.length,1,sha);}
 const outlander=bySha.get('86ff4298a9d5323fb0b47388c8d9c412a78b0509b41817d930ecdb36fbed44c6'),dash=bySha.get('b1a2d621d1a65ea8ddb3d5d05ffd2f0768a9e91dbe607bc0b10681be3fe8d9cf');
 assert(outlander,'the Outlander twin must stay in the catalogue');assert(dash,'the dash CRC twin must stay in the catalogue');
 assert(outlander.aliases.some(a=>a.path==='Calculators/Immo/Car/Mitsubishi/Immo_Outlander_crc_vin.cal'));
 assert(dash.aliases.some(a=>a.path==='Calculators/CRC/dash_crc_vin.cal'));
 assert.notEqual(org.displayPath(outlander.aliases[0]),org.displayPath(bySha.get(expected[4][0]).aliases[0]));
 assert.notEqual(outlander.e.sha,bySha.get(expected[4][0]).e.sha);assert.notEqual(dash.e.sha,bySha.get(expected[5][0]).e.sha);
 assert.equal(org.displayPath(dash.aliases[0]),null,'unclassified duplicates keep the original rule');
});
await test('search matches new names, folders, old file names and old paths',()=>{
 for(const [sha,oldPath,name,folder] of expected){
  const e=entry(sha),base=oldPath.split('/').at(-1);
  for(const q of [base,base.replace(/\.cal$/i,''),oldPath,name,folder.split('/')[1]])assert(org.matches(e,q),sha+' should match '+q);
  assert(org.matches(e,base.toLowerCase()),'case-insensitive '+sha);
 }
 const philips=entry(expected[2][0]);
 assert(org.matches(philips,'renault'),'Renault stays a search hint');
 assert(!/Renault/i.test(org.title(philips)),'Renault is not presented as a confirmed brand');
 const radio=db.entries.find(e=>e.path==='Calculators/CarRadio/Philips/22DC679.cal');
 assert(org.displayPath(radio).startsWith('Магнитолы и навигация/'),'radio is mapped to its section');
 assert(org.title(radio).includes('22DC679'),'radio keeps its model');
 assert(org.matches(radio,'22DC679')&&org.matches(radio,'carradio'),'old radio search still works');
});

await test('different SHA with the same display base stay distinct versions',()=>{
 const groups=new Map();
 for(const [sha,item] of Object.entries(org.data.entries)){
  if(!airbagShas.has(sha))continue;
  const base=item.name.replace(/ \((?:Airbag|SRS)\)$/,'').replace(/ · вариант \d+$/,'');
  const key=item.folder+'/'+base;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push({sha,item});
 }
 const pair=[...groups.values()].find(list=>list.length>1&&new Set(list.map(row=>row.item.name)).size===list.length);
 assert(pair,'a collision group with distinct names must exist');
 const paths=new Set();
 for(const {sha,item} of pair){
  const e=entry(sha);assert(e,sha);run('select(entries.find(e=>e.sha==='+JSON.stringify(sha)+'))');
  assert.equal(el('calcTitle').textContent,item.name,sha);
  assert(!paths.has(org.displayPath(e)),'distinct display path '+sha);paths.add(org.displayPath(e));
  assert.equal(run('selected.sha'),sha);assert(!el('exportCal').disabled);
 }
 assert(pair.length>1);
});

await test('the tree shows each approved CAL once under its thematic section',()=>{
 const sections=el('tree').children.filter(c=>c.className==='sectionButton').map(c=>c.children[1].textContent);
 for(const s of ['Подушки безопасности','Приборные панели','Иммобилайзеры и ключи','Магнитолы и навигация','Утилиты'])assert(sections.includes(s),s);
 assert.equal(el('tree').children.filter(c=>c.className.startsWith('fileItem')).length,0,'no CAL is displayed at the root any more');
 const walk=(item,cls)=>item.children.flatMap(c=>[...(c.className?.startsWith(cls)?[c]:[]),...walk(c,cls)]);
 const folders=[...new Set([...airbagShas].map(sha=>org.folder(entry(sha))))];
 run('expandedFolders.clear();catalogScope=\'Подушки безопасности\';'+folders.map(folder=>'expandedFolders.add('+JSON.stringify(folder)+')').join(';')+';renderCatalog()');
 const airbag=walk(el('tree'),'fileItem');
 assert.equal(airbag.length,airbagShas.size,'all Airbag/SRS calculators are shown once');
 assert(airbag.some(f=>/89170-02810/.test(f.textContent)),'the approved Toyota stays visible');
 run("expandedFolders.clear();catalogScope='';renderCatalog()");
});
await test('selecting each CAL shows the new name and keeps the original path and bytes',async()=>{
 for(const [sha,oldPath,name,folder] of expected){
  run('select(entries.find(e=>e.sha==='+JSON.stringify(sha)+'))');
  assert.equal(el('calcTitle').textContent,name,sha);
  assert(el('calcPath').textContent.includes('Раздел: '+folder),'folder shown '+sha);
  assert(el('calcPath').textContent.includes(oldPath),'original path visible '+sha);
  assert.equal(run('selected.sha'),sha);assert.equal(run('selected.path'),oldPath);
  assert(!el('exportCal').disabled);
  doc.downloads.length=0;await el('exportCal').click();
  const download=doc.downloads.at(-1);
  assert.equal(download.name,oldPath.split('/').at(-1),'export keeps the original name '+sha);
  assert.deepEqual(Buffer.from(await download.blob.arrayBuffer()),Buffer.from(db.blobs[sha],'base64'),'export keeps the original bytes '+sha);
 }
 run('select(entries.find(e=>e.sha==='+JSON.stringify(expected[2][0])+'))');
 assert(el('calcPath').textContent.includes('Renault'),'the Renault hint stays visible');
 assert(el('calcPath').textContent.includes('не подтверждена'),'the hint is marked as unconfirmed');
});
await test('sample Airbag and SRS CAL export original names, bytes and show ambiguous reasons',async()=>{
 const sample=[...airbagShas].filter((_,index)=>index%211===0);
 for(const sha of sample){
  const e=entry(sha);run('select(entries.find(e=>e.sha==='+JSON.stringify(sha)+'))');
  assert.equal(el('calcTitle').textContent,org.title(e),sha);
  assert(el('calcPath').textContent.includes(e.path),'original path visible '+sha);
  doc.downloads.length=0;await el('exportCal').click();
  const download=doc.downloads.at(-1);
  assert.equal(download.name,e.path.split('/').at(-1),'export name '+sha);
  assert.deepEqual(Buffer.from(await download.blob.arrayBuffer()),Buffer.from(db.blobs[sha],'base64'),'export bytes '+sha);
 }
 const ambiguous=airbagEntries.find(e=>org.get(e.sha).reason);
 assert(ambiguous,'an ambiguous entry exists');run('select(entries.find(e=>e.sha==='+JSON.stringify(ambiguous.sha)+'))');
 assert(el('calcPath').textContent.includes('Причина:'),'the reason is shown');assert.equal(el('calcTitle').textContent,org.title(ambiguous));
});
await test('dashboard CALs keep original names, paths, bytes and section grouping',async()=>{
 const rows=db.entries.filter(e=>e.ext==='cal'&&e.path.startsWith('Calculators/Dashboard/'));
 const sample=rows.filter((_,index)=>index%317===0);
 for(const e of sample){
  const item=org.get(e.sha);assert(item,'mapped dashboard '+e.path);
  run('select(entries.find(e=>e.sha==='+JSON.stringify(e.sha)+'))');
  assert.equal(el('calcTitle').textContent,item.name,e.path);
  assert(el('calcPath').textContent.includes(e.path),'original path '+e.path);
  assert(el('calcPath').textContent.includes('Раздел: '+item.folder),'folder '+e.path);
  doc.downloads.length=0;await el('exportCal').click();
  const download=doc.downloads.at(-1);
  assert.equal(download.name,e.path.split('/').at(-1),'export name '+e.path);
  assert.deepEqual(Buffer.from(await download.blob.arrayBuffer()),Buffer.from(db.blobs[e.sha],'base64'),'export bytes '+e.path);
 }
 const ambiguous=rows.find(e=>org.get(e.sha)?.reason);assert(ambiguous,'dashboard ambiguity exists');
 run('select(entries.find(e=>e.sha==='+JSON.stringify(ambiguous.sha)+'))');
 assert(el('calcPath').textContent.includes('Причина:'),'dashboard reason is visible');
 const folders=[...new Set(Object.values(dashboard.entries).map(item=>item.folder))];
 const sectionCount=Object.values(org.data.entries).filter(item=>item.folder.startsWith('Приборные панели/')).length;
 run("expandedFolders.clear();catalogScope='Приборные панели';"+folders.map(folder=>'expandedFolders.add('+JSON.stringify(folder)+')').join(';')+';renderCatalog()');
 const walk=(item,cls)=>item.children.flatMap(c=>[...(c.className?.startsWith(cls)?[c]:[]),...walk(c,cls)]);
 assert.equal(walk(el('tree'),'fileItem').length,sectionCount,'all dashboard calculators are shown once');
 el('search').value='приборные панели';run('searchPage=0;renderCatalog()');
 assert(el('searchPager').textContent.includes(sectionCount+' · 1/'),'dashboard folder search covers the section');
 el('search').value='';run('expandedFolders.clear();catalogScope=\'\';searchPage=0;renderCatalog()');
});

await test('a search row shows the new name plus the old path and opens the same entry',()=>{
 el('search').value='Skoda Fabia 2006 — декриптор EEPROM 93C86';run('searchPage=0;renderCatalog()');
 let rows=el('tree').children.filter(c=>c.className.startsWith('fileItem'));
 assert.equal(rows.length,1,'the new name finds exactly the approved entry');
 assert.match(rows[0].textContent,/Skoda Fabia 2006 — декриптор EEPROM 93C86/);
 assert(rows[0].textContent.includes('Calculators/Fabia 93C86 2006 decryptor.cal'),'the row keeps the old path as an alias');
 rows[0].click();assert.equal(el('calcTitle').textContent,'Skoda Fabia 2006 — декриптор EEPROM 93C86');
 el('search').value='Calculators/Fabia 93C86 2006 decryptor.cal';run('searchPage=0;renderCatalog()');
 assert.equal(el('tree').children.filter(c=>c.className.startsWith('fileItem')).length,1,'the exact old path still finds it');
 el('search').value='89170-02810';run('searchPage=0;renderCatalog()');
 assert(el('tree').children.filter(c=>c.className.startsWith('fileItem')).length>=1,'old file name still finds the entry');
 el('search').value='подушки безопасности';run('searchPage=0;renderCatalog()');
 assert(el('searchPager').textContent.includes(airbagShas.size+' · 1/'),'thematic folder finds every Airbag/SRS calculator');
 el('search').value='';run('searchPage=0;renderCatalog()');
});
await test('pictures resolve from the original CAL location, not from the display folder',()=>{
 const map=[['44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045','Toyota.bmp','Подушки безопасности/Toyota'],['31ef5b19a0c4c02c73ca84c2aafcc7230679c94758b75a4441b9dc6bc0ac2d79','Nissan.bmp','Подушки безопасности/Nissan'],['a20a16b57c2ec83a2ebd27a51d7eceec63035545f272a2afc815e6919cde9eaf','Chevrolet.bmp','Подушки безопасности/Chevrolet']];
 for(const [sha,name,folder] of map){
  run('select(entries.find(e=>e.sha==='+JSON.stringify(sha)+'))');
  const img=run('picture({type:"P",id:5,text:'+JSON.stringify(name)+'})');
  assert(img,'picture must resolve for '+sha);assert.equal(img.alt,name);
  assert.match(img.src,/^data:image\/bmp;base64,/);
  assert(!db.entries.some(e=>e.path.toLowerCase()==='calculators/'+folder.toLowerCase()+'/'+name.toLowerCase()),'no duplicate image next to the display folder');
 }
});
console.log(JSON.stringify({passed,scope:'Display map, catalogue identity, search, tree, selection, export and pictures via real app.js handlers; no browser rendering or vehicle test'}));
})().catch(e=>{console.error(e);process.exit(1)});

