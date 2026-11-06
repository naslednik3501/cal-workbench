// Node checks for the T-016 display map and the real app handlers in a minimal DOM adapter.
// This is not browser rendering or a vehicle compatibility check.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const db=globalThis.CAL_CATALOG,scope=require('../catalog-scope.js'),org=require('../catalog-organization.js');

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
const allCal=db.entries.filter(e=>e.ext==='cal');
const uniqueCal=new Set(allCal.map(e=>e.sha));
const germanyAllSource=allCal.filter(e=>e.path.startsWith('Calculators/Germany/'));
const germanyShas=new Set(germanyAllSource.map(e=>e.sha));
const germanBmwSource=allCal.filter(e=>e.path.startsWith('Calculators/Germany/BMW/'));
const germanBmwShas=new Set(germanBmwSource.map(e=>e.sha));
const germanOtherSource=germanyAllSource.filter(e=>!e.path.startsWith('Calculators/Germany/BMW/'));
const franceAllSource=allCal.filter(e=>e.path.startsWith('Calculators/France/'));
const franceShas=new Set(franceAllSource.map(e=>e.sha));
const franceMovedSource=franceAllSource.filter(e=>org.folder(e)?.startsWith('Dashboard/France/'));
const asiaAcuraSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/Acura/'));
const asiaAcuraShas=new Set(asiaAcuraSource.map(e=>e.sha));
const asiaHondaSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/Honda/'));
const asiaHondaShas=new Set(asiaHondaSource.map(e=>e.sha));
const asiaMazdaSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/Mazda/'));
const asiaMazdaShas=new Set(asiaMazdaSource.map(e=>e.sha));
const asiaMazdaMovedSource=asiaMazdaSource.filter(e=>org.folder(e)?.startsWith('Dashboard/Asia/Mazda'));
const asiaNissanSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/Nissan/'));
const asiaNissanShas=new Set(asiaNissanSource.map(e=>e.sha));
const asiaNissanMovedSource=asiaNissanSource.filter(e=>org.folder(e)?.startsWith('Dashboard/Asia/Nissan'));
const asiaMitsubishiSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/Mitsubishi/'));
const asiaMitsubishiShas=new Set(asiaMitsubishiSource.map(e=>e.sha));
const asiaToyotaSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/Toyota/'));
const asiaToyotaShas=new Set(asiaToyotaSource.map(e=>e.sha));
const asiaSubaruSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/Subaru/'));
const asiaSubaruShas=new Set(asiaSubaruSource.map(e=>e.sha));
const asiaSuzukiSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/Suzuki/'));
const asiaSuzukiShas=new Set(asiaSuzukiSource.map(e=>e.sha));
const asiaAllSource=allCal.filter(e=>e.path.startsWith('Calculators/Asia/'));
const asiaAllShas=new Set(asiaAllSource.map(e=>e.sha));
const asiaAudit=require('../reports/catalog-organization-asia-exceptions-2026-11-06.json');
const groups=scope.calculatorGroups(db.entries);
const groupBySha=new Map(groups.map(g=>[g.e.sha,g]));
const walk=(item,cls)=>item.children.flatMap(c=>[...(c.className?.startsWith(cls)?[c]:[]),...walk(c,cls)]);
const folderRows=(parent=el('tree'))=>parent.children.filter(c=>c.tagName==='DETAILS').map(c=>({name:c.children[0].children[1].textContent,count:Number(c.children[0].children[2].textContent),node:c}));
const sectionRows=()=>el('tree').children.filter(c=>c.className==='sectionButton').map(c=>({name:c.children[1].textContent,count:Number(c.children[2].textContent.replace(/\s/g,''))}));
const approvedExpected=[
 ['faa4784def192d83d899083b360c2cc805dd9f6653bf7042c571980bf31b2c1a','Skoda Fabia 2006 — декриптор EEPROM 93C86','Dashboard/Skoda'],
 ['2ebd61f105e5ce3fcaae4d2ffad46aca471ff22cdf3616e50582dc30a42d4970','Skoda Superb — декриптор EEPROM 93C86','Dashboard/Skoda'],
 ['d0920cc81247ab7dd31d013dc130dd092747b666546e024382e67d8196ee9877','Philips — заготовка калькулятора кода','CarRadio'],
 ['b3503228dbb6c6b5e45352dd753f61c4d1b472bf04f84f1ff15a0c3fe57a2224','Hitag2 — контрольная сумма CRC по выделению','OTHER/CRC'],
 ['4f38ff98c567bd82e80821515a7e948c214cdc2a30aa26e15de3fc27bc7da1f1','Mitsubishi Outlander — CRC и VIN в IMMO по выделению','Immo/Mitsubishi'],
 ['b5d3f7c4be6434423a32c1a2f0c09a0bbf640cbddd0f16c9547022d5efe49621','CRC и VIN в дампе панели — правка по выделению','OTHER/CRC'],
 ['21b6963bdadeb104e7fe4b807542c56b79931aac78a5d388ac67e14729c01f9b','MasterKey → Kmrw — конвертер данных транспондера (8 или 16 байт)','Immo/Convertor'],
 ['89db59ed2be0d1cdd84c78d59a31cc15775a6712833b03de406f2e531e185d9f','Etsmart — справочник цветовых кодов','OTHER'],
 ['7498ed09f8cdcfed8b151c496de2c73e13e4baa3dfcb7a7b32d01806bd5689d2','Инверсия первых 128 КиБ дампа','OTHER'],
 ['44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045','Toyota 89170-02810 — сброс Crash (SRS)','Airbag/Toyota'],
 ['31ef5b19a0c4c02c73ca84c2aafcc7230679c94758b75a4441b9dc6bc0ac2d79','Nissan 28556 3AP1B — сброс Crash (SRS)','Airbag/Nissan'],
 ['a20a16b57c2ec83a2ebd27a51d7eceec63035545f272a2afc815e6919cde9eaf','Chevrolet 96 806 850 (5WY67070) — сброс Crash (SRS)','Airbag/Chevrolet']
];
await test('all active CAL are mapped once, without translated root folders',()=>{
 assert.equal(uniqueCal.size,15057,'unique CAL SHA');
 assert.equal(Object.keys(org.data.entries).length,15057,'one display entry per unique SHA');
 for(const e of allCal)assert(org.get(e.sha),'unmapped '+e.path);
 const display=new Set(),roots=new Set(),rootCounts={};
 for(const [sha,item] of Object.entries(org.data.entries)){
  assert(item.name.trim()&&item.name.length<=140,sha);assert(item.folder.trim(),sha);
  assert(!/(^|\/)(?:Подушки безопасности|Приборные панели|Иммобилайзеры и ключи|Магнитолы и навигация|Утилиты)(\/|$)/.test(item.folder),'translated root: '+item.folder);
  assert(!/(^|\/)(?:Неуточнённые|Универсальные|Конвертеры ключей|Справочники|Инверсия)(\/|$)/.test(item.folder),'invented folder: '+item.folder);
  if(item.reason)assert(item.reason.trim().length<=240,sha);
  const key=(item.folder+'/'+item.name).toLowerCase();assert(!display.has(key),'duplicate display '+key);display.add(key);
  roots.add(item.folder.split('/')[0]);
  if(!item.folder.includes('/'))rootCounts[item.folder]=(rootCounts[item.folder]||0)+1;
 }
 for(const root of ['Airbag','Dashboard','Immo','CarRadio','OTHER'])assert(roots.has(root),root);
 assert.deepEqual([...roots].sort(),['ATV','Asia','Bikes','CHINA','CRYPTO','CRYPTO+','Car','Dashboard','ECU','EU_US_RU','Immo','MOTO - TRUCK - ATV','OTHER','Peugeot','Airbag','CarRadio'].sort());
 assert.deepEqual(rootCounts,{Airbag:9,CHINA:1,ECU:1,CarRadio:1,OTHER:2},'exact direct-root remainder by section');
 for(const [sha,item] of Object.entries(org.data.entries)){
  if(!item.folder.includes('/'))assert(item.reason&&item.reason.trim(),'root reason '+sha);
 }
 assert.equal(org.folder(entry('44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045')),'Airbag/Toyota');
});
await test('Dashboard roots are routed into brand or confirmed panel-manufacturer folders, without unresolved roots',()=>{
 const report=require('../reports/catalog-organization-dashboard-2026-11-04.json'),rr=report.root_routing;
 assert.equal(report.totals.unique_sha,4843,'Dashboard unique SHA unchanged');
 assert.equal(rr.initial_root,84);assert.equal(rr.moved,84);assert.equal(rr.remaining,0);
 assert.equal(rr.initial_root,rr.moved+rr.remaining,'every root entry is accounted for');
 assert.equal(rr.moved_entries.length,rr.moved);assert.equal(rr.remaining_entries.length,rr.remaining);
 const existing=new Set(rr.existing_folders),created=new Set(rr.created_folders);
 assert.deepEqual([...created].sort(),['Curtis','Denso','Feeler','Hidromek','Kansey','SYM','TCM','TFN','Terex','Triumph','Visteon','Yazaki']);
 assert.equal(rr.folders_after,existing.size+created.size,'folder count after routing');
 const dashboardEntries=Object.values(org.data.entries).filter(item=>item.folder==='Dashboard'||item.folder.startsWith('Dashboard/'));
 const usedBrands=new Set(dashboardEntries.filter(item=>item.folder.startsWith('Dashboard/')).map(item=>item.folder.split('/')[1]));
 for(const brand of usedBrands)assert(existing.has(brand)||created.has(brand)||brand==='Germany'||brand==='France'||brand==='Asia','unknown Dashboard folder: '+brand);
 for(const brand of created)assert(usedBrands.has(brand),'created empty Dashboard folder: '+brand);
 const rootShas=new Set(Object.entries(org.data.entries).filter(([,item])=>item.folder==='Dashboard').map(([sha])=>sha));
 assert.equal(rootShas.size,0,'Dashboard root has no unresolved entries');
 const movedShas=new Set();
 for(const row of rr.moved_entries){
  assert(!movedShas.has(row.sha),'duplicate moved SHA '+row.sha);movedShas.add(row.sha);
  assert(!rootShas.has(row.sha),'moved entry still in Dashboard root '+row.sha);
  if(germanyShas.has(row.sha)||franceShas.has(row.sha)||asiaAllShas.has(row.sha))continue;
  const item=org.get(row.sha);assert(item,row.sha);assert.equal(item.folder,row.folder,row.sha);assert.equal(item.name,row.name,row.sha);
  assert(item.folder.startsWith('Dashboard/')&&item.folder.split('/').length<=3,row.sha);
  if(row.old_name){assert.equal(item.old_name,row.old_name,row.sha);assert(org.matches(entry(row.sha),row.old_name),'search old name '+row.sha);}
  if(row.manufacturer){assert.equal(item.manufacturer,row.manufacturer,row.sha);assert.equal(item.folder,'Dashboard/'+row.manufacturer,row.sha);}
 }
 assert.equal(movedShas.size,84,'all moved SHAs stay distinct');
 const yazaki=rr.moved_entries.find(row=>row.sha==='00de8bec6523cd8030439afa9418882d248341dd13014373a49b2a1242f089dd');
 assert(yazaki,'moved Yazaki entry');assert(yazaki.old_name);assert.equal(org.folder(entry(yazaki.sha)),'Dashboard/Mitsubishi');
 assert(org.matches(entry(yazaki.sha),yazaki.old_name),'old Yazaki name remains searchable');
 const createdRows=rr.moved_entries.filter(row=>created.has(row.folder.split('/')[1]));
 assert.equal(createdRows.length,24,'entries routed into newly created folders');
 const createdCounts={};for(const row of createdRows)createdCounts[row.folder.split('/')[1]]=(createdCounts[row.folder.split('/')[1]]||0)+1;
 assert.deepEqual(createdCounts,{Curtis:1,Denso:5,Feeler:1,Hidromek:1,Kansey:1,SYM:1,TCM:2,TFN:1,Terex:2,Triumph:2,Visteon:1,Yazaki:6});
 for(const row of createdRows)if(row.old_name)assert(org.matches(entry(row.sha),row.old_name),'old name search '+row.sha);
});
await test('Germany BMW panels follow the dated dashboard layout',()=>{
 assert.equal(germanBmwSource.length,49,'all Germany/BMW source paths');
 assert.equal(germanBmwShas.size,49,'distinct Germany/BMW CAL contents');
 const expectedCounts={'Dashboard/Germany/BMW':17,'Dashboard/Germany/BMW/CAS2':3,'Dashboard/Germany/BMW/CAS3':2,'Dashboard/Germany/BMW/CAS4':1,'Dashboard/Germany/BMW/E34':3,'Dashboard/Germany/BMW/E36':5,'Dashboard/Germany/BMW/E38, E39':4,'Dashboard/Germany/BMW/E46':2,'Dashboard/Germany/BMW/E84':2,'Dashboard/Germany/BMW/EWS3':2,'Dashboard/Germany/BMW/EWS4':3,'Dashboard/Germany/BMW/LCM':5};
 const actualCounts={};
 const modelFolders=[['CAS2',/^CAS2/],['CAS3',/^CAS3/],['CAS4',/^CAS4/],['E34',/^E34 /],['E36',/^E36 /],['E38, E39',/^(?:E38, E39|E39_)/],['E46',/^E46_/],['E84',/^E84_/],['EWS3',/^EWS3/],['EWS4',/^EWS4/],['LCM',/^LCM/]];
 for(const e of germanBmwSource){
  const base=e.path.split('/').at(-1),model=modelFolders.find(([,pattern])=>pattern.test(base))?.[0];
  const folder='Dashboard/Germany/BMW'+(model?'/'+model:'');
  assert.equal(org.folder(e),folder,e.path);
  assert(org.matches(e,e.path),'original path search '+e.path);
  actualCounts[folder]=(actualCounts[folder]||0)+1;
 }
 assert.deepEqual(Object.fromEntries(Object.entries(actualCounts).sort()),Object.fromEntries(Object.entries(expectedCounts).sort()));
});
await test('Asia Honda panels preserve reference models and direct Honda entries',()=>{
 assert.equal(asiaHondaSource.length,86,'all Asia/Honda source paths');
 assert.equal(asiaHondaShas.size,86,'distinct Asia/Honda CAL contents');
 const folders=new Set();
 let direct=0;
 for(const e of asiaHondaSource){
  const folder=org.folder(e);
  assert(folder==='Dashboard/Asia/Honda'||folder.startsWith('Dashboard/Asia/Honda/'),e.path);
  assert(org.matches(e,e.path),'original path search '+e.path);
  folders.add(folder);if(folder==='Dashboard/Asia/Honda')direct++;
 }
 assert.equal(folders.size,22,'Honda model folders');
 assert.equal(direct,19,'direct Honda records');
 assert.equal(asiaHondaSource.filter(e=>{const folder=org.folder(e);return folder!=='Dashboard/Asia/Honda'&&!folder?.startsWith('Dashboard/Asia/Honda/');}).length,0,'no disputed Honda records');
 const inferred={
  'Calculators/Asia/Honda/CRV 912B32 miles.cal':'Dashboard/Asia/Honda/CR-V',
  'Calculators/Asia/Honda/CRV 912B32 km.cal':'Dashboard/Asia/Honda/CR-V',
  'Calculators/Asia/Honda/HRV 912B32.cal':'Dashboard/Asia/Honda/HR-V',
  'Calculators/Asia/Honda/Odissey 93C66.cal':'Dashboard/Asia/Honda/Odyssey',
  'Calculators/Asia/Honda/Odissey 93C56 var1.cal':'Dashboard/Asia/Honda/Odyssey',
  'Calculators/Asia/Honda/Odissey 93C56 var2.cal':'Dashboard/Asia/Honda/Odyssey',
  'Calculators/Asia/Honda/Odissey 93C46 denso.cal':'Dashboard/Asia/Honda/Odyssey',
  'Calculators/Asia/Honda/Step Wagon 93C56.cal':'Dashboard/Asia/Honda/Stepwgn',
  'Calculators/Asia/Honda/Crosstour 93C76.cal':'Dashboard/Asia/Honda/Crosstour',
  'Calculators/Asia/Honda/Insight 93C86.cal':'Dashboard/Asia/Honda',
  'Calculators/Asia/Honda/Jazz 93C76.cal':'Dashboard/Asia/Honda/Jazz',
  'Calculators/Asia/Honda/Ridgeline MC9S12H256.cal':'Dashboard/Asia/Honda/Ridgeline',
  'Calculators/Asia/Honda/Pilot 24c16.cal':'Dashboard/Asia/Honda/Pilot',
  'Calculators/Asia/Honda/Life 93C66.cal':'Dashboard/Asia/Honda/Life'
 };
 for(const [path,folder] of Object.entries(inferred)){const e=allCal.find(x=>x.path===path);assert(e,path);assert.equal(org.folder(e),folder,path);}
});
await test('Asia Subaru accounts for every unique source CAL',()=>{
 assert.equal(asiaSubaruSource.length,25,'all Asia/Subaru source paths');
 assert.equal(asiaSubaruShas.size,25,'distinct Asia/Subaru CAL contents');
 const folders=new Set();let direct=0;
 for(const e of asiaSubaruSource){
  const folder=org.folder(e);assert(folder?.startsWith('Dashboard/Asia/Subaru'),e.path);
  assert(org.matches(e,e.path),'original path search '+e.path);
  folders.add(folder);if(folder==='Dashboard/Asia/Subaru')direct++;
 }
 assert.equal(folders.size,7,'Subaru model folders');
 assert.equal(direct,3,'direct Subaru records');
 assert.equal(asiaSubaruSource.filter(e=>!org.folder(e)?.startsWith('Dashboard/Asia/Subaru')).length,0,'no disputed Subaru records');
});
await test('Asia Suzuki accounts for every unique source CAL',()=>{
 assert.equal(asiaSuzukiSource.length,49,'all Asia/Suzuki source paths');
 assert.equal(asiaSuzukiShas.size,49,'distinct Asia/Suzuki CAL contents');
 const folders=new Set();let direct=0;
 for(const e of asiaSuzukiSource){
  const folder=org.folder(e);assert(folder?.startsWith('Dashboard/Asia/Suzuki'),e.path);
  assert(org.matches(e,e.path),'original path search '+e.path);
  folders.add(folder);if(folder==='Dashboard/Asia/Suzuki')direct++;
 }
 assert.equal(folders.size,15,'Suzuki model folders');
 assert.equal(direct,9,'direct Suzuki records');
 assert.equal(asiaSuzukiSource.filter(e=>!org.folder(e)?.startsWith('Dashboard/Asia/Suzuki')).length,0,'no disputed Suzuki records');
 const inferred={
  'Calculators/Asia/Suzuki/Jimny 93C56 New Denso.cal':'Dashboard/Asia/Suzuki/Jimny',
  'Calculators/Asia/Suzuki/Liana 93C56 New Denco.cal':'Dashboard/Asia/Suzuki/Liana'
 };
 for(const [path,folder] of Object.entries(inferred)){const e=allCal.find(x=>x.path===path);assert(e,path);assert.equal(org.folder(e),folder,path);}
});
await test('complete Asia inventory accounts for every unique SHA exactly once',()=>{
 assert.equal(asiaAllShas.size,1458,'all unique Asia SHA');
 assert.deepEqual(asiaAudit.summary,{unique_sha:1458,already_on_place:702,moved:359,exceptions:397,reconciled:1458,previously_processed:704});
 assert.equal(asiaAudit.already_sha.length,702);assert.equal(asiaAudit.moved_sha.length,359);assert.equal(asiaAudit.exceptions.length,397);
 const all=[...asiaAudit.already_sha,...asiaAudit.moved_sha,...asiaAudit.exceptions.map(row=>row.sha)];
 assert.equal(new Set(all).size,1458,'Asia SHA union');
 assert.equal(all.length,1458,'Asia categories are mutually exclusive');
 assert.deepEqual(new Set(all),asiaAllShas,'Asia inventory equals source');
 for(const sha of asiaAudit.already_sha)assert(org.folder(allCal.find(e=>e.sha===sha))?.startsWith('Dashboard/Asia/'),'already '+sha);
 for(const sha of asiaAudit.moved_sha)assert(org.folder(allCal.find(e=>e.sha===sha))?.startsWith('Dashboard/Asia/'),'moved '+sha);
 for(const row of asiaAudit.exceptions){
  assert(row.reason?.trim(),'exception reason '+row.sha);
  const entry=allCal.find(e=>e.sha===row.sha);assert(entry,row.sha);
  assert.equal(org.folder(entry),row.currentFolder,'exception folder '+row.sha);
  assert.equal(org.title(entry),row.currentName,'exception name '+row.sha);
  assert(!org.folder(entry).startsWith('Dashboard/Asia/'),'exception moved '+row.sha);
  for(const sourcePath of row.paths){const source=allCal.find(x=>x.path===sourcePath);assert(source,sourcePath);assert(org.matches(source,sourcePath),'exception old path '+sourcePath);}
 }
});
await test('Asia Toyota accounts for every unique source CAL',()=>{
 assert.equal(asiaToyotaSource.length,236,'all Asia/Toyota source paths');
 assert.equal(asiaToyotaShas.size,236,'distinct Asia/Toyota CAL contents');
 const folders=new Set();let direct=0;
 for(const e of asiaToyotaSource){
  const folder=org.folder(e);
  assert(folder==='Dashboard/Asia/Toyota'||folder.startsWith('Dashboard/Asia/Toyota/'),e.path);
  assert(org.matches(e,e.path),'original path search '+e.path);
  folders.add(folder);if(folder==='Dashboard/Asia/Toyota')direct++;
 }
 assert.equal(folders.size,66,'Toyota model folders');
 assert.equal(direct,59,'direct Toyota records');
 assert.equal(asiaToyotaSource.filter(e=>!org.folder(e)?.startsWith('Dashboard/Asia/Toyota')).length,0,'no disputed Toyota records');
 const inferred={
  'Calculators/Asia/Toyota/Hino 93C86 Yazaki31.cal':'Dashboard/Asia/Toyota/Hino',
  'Calculators/Asia/Toyota/Prius C 93C86 Denso.cal':'Dashboard/Asia/Toyota/Prius C',
  'Calculators/Asia/Toyota/Sienna 93C66 Denso.cal':'Dashboard/Asia/Toyota/Sienna',
  'Calculators/Asia/Toyota/Aqua 93C86 Denso.cal':'Dashboard/Asia/Toyota/Aqua',
  'Calculators/Asia/Toyota/Dina 93C56 Yazaki 17.cal':'Dashboard/Asia/Toyota/Dyna'
 };
 for(const [path,folder] of Object.entries(inferred)){const e=allCal.find(x=>x.path===path);assert(e,path);assert.equal(org.folder(e),folder,path);}
});
await test('Asia Mazda accounts for every source CAL and preserves the ambiguous shared calculator',()=>{
 assert.equal(asiaMazdaSource.length,58,'all Asia/Mazda source paths');
 assert.equal(asiaMazdaShas.size,58,'distinct Asia/Mazda CAL contents');
 assert.equal(asiaMazdaMovedSource.length,57,'confirmed Asia/Mazda entries');
 const disputed=asiaMazdaSource.filter(e=>!org.folder(e)?.startsWith('Dashboard/Asia/Mazda'));
 assert.equal(disputed.length,1,'disputed Mazda entries');
 assert.equal(disputed[0].path,'Calculators/Asia/Mazda/Mazda323_626_after2000.cal');
 assert.equal(org.folder(disputed[0]),'Asia/Mazda');
 assert.equal(asiaMazdaMovedSource.length+disputed.length,asiaMazdaSource.length,'Mazda accounting');
 const folders=new Set();let direct=0;
 for(const e of asiaMazdaMovedSource){
  const folder=org.folder(e);
  assert(folder==='Dashboard/Asia/Mazda'||folder.startsWith('Dashboard/Asia/Mazda/'),e.path);
  assert(org.matches(e,e.path),'original path search '+e.path);
  folders.add(folder);if(folder==='Dashboard/Asia/Mazda')direct++;
 }
 assert.equal(folders.size,21,'Mazda model folders');
 assert.equal(direct,13,'direct Mazda records');
 const mazda5=allCal.find(e=>e.path==='Calculators/Asia/Mazda/Mazda5.cal');
 assert(mazda5);assert.equal(org.folder(mazda5),'Dashboard/Asia/Mazda');
});
await test('Asia Nissan accounts for every unique source CAL',()=>{
 assert.equal(asiaNissanSource.length,162,'all Asia/Nissan source paths');
 assert.equal(asiaNissanShas.size,162,'distinct Asia/Nissan CAL contents');
 assert.equal(asiaNissanMovedSource.length,161,'confirmed Asia/Nissan entries');
 const disputed=asiaNissanSource.filter(e=>!org.folder(e)?.startsWith('Dashboard/Asia/Nissan'));
 assert.equal(disputed.length,1,'disputed Nissan entries');
 assert.equal(disputed[0].path,'Calculators/Asia/Nissan/Stager 93C56 Kansey.cal');
 assert.equal(org.folder(disputed[0]),'Asia/Nissan');
 assert.equal(asiaNissanMovedSource.length+disputed.length,asiaNissanSource.length,'Nissan accounting');
 const folders=new Set();let direct=0;
 for(const e of asiaNissanSource)assert(org.matches(e,e.path),'original path search '+e.path);
 for(const e of asiaNissanMovedSource){
  const folder=org.folder(e);
  assert(folder==='Dashboard/Asia/Nissan'||folder.startsWith('Dashboard/Asia/Nissan/'),e.path);
  folders.add(folder);if(folder==='Dashboard/Asia/Nissan')direct++;
 }
 assert.equal(folders.size,49,'Nissan model folders');
 assert.equal(direct,28,'direct Nissan records');
});
await test('Asia Mitsubishi accounts for every unique source CAL',()=>{
 assert.equal(asiaMitsubishiSource.length,69,'all Asia/Mitsubishi source paths');
 assert.equal(asiaMitsubishiShas.size,69,'distinct Asia/Mitsubishi CAL contents');
 const folders=new Set();let direct=0;
 for(const e of asiaMitsubishiSource){
  const folder=org.folder(e);
  assert(folder==='Dashboard/Asia/Mitsubishi'||folder.startsWith('Dashboard/Asia/Mitsubishi/'),e.path);
  assert(org.matches(e,e.path),'original path search '+e.path);
  folders.add(folder);if(folder==='Dashboard/Asia/Mitsubishi')direct++;
 }
 assert.equal(folders.size,18,'Mitsubishi model folders');
 assert.equal(direct,22,'direct Mitsubishi records');
 assert.equal(asiaMitsubishiSource.filter(e=>!org.folder(e)?.startsWith('Dashboard/Asia/Mitsubishi')).length,0,'no disputed Mitsubishi records');
 const inferred={
  'Calculators/Asia/Mitsubishi/Airtrack Yazaki.cal':'Dashboard/Asia/Mitsubishi',
  'Calculators/Asia/Mitsubishi/Outlander XL 93C86 Yazaki62.cal':'Dashboard/Asia/Mitsubishi/Outlander',
  'Calculators/Asia/Mitsubishi/L200 93C56 YNS.cal':'Dashboard/Asia/Mitsubishi/L200',
  'Calculators/Asia/Mitsubishi/Fuso 93CS56 Yazaki62.cal':'Dashboard/Asia/Mitsubishi/Fuso',
  'Calculators/Asia/Mitsubishi/Mirage Dingo.cal':'Dashboard/Asia/Mitsubishi/Mirage',
  'Calculators/Asia/Mitsubishi/Delica YNS 93C46.cal':'Dashboard/Asia/Mitsubishi/Delica',
  'Calculators/Asia/Mitsubishi/Space gear.cal':'Dashboard/Asia/Mitsubishi',
  'Calculators/Asia/Mitsubishi/Dion Yazaki.cal':'Dashboard/Asia/Mitsubishi',
  'Calculators/Asia/Mitsubishi/ASX 93C86 YNS.cal':'Dashboard/Asia/Mitsubishi/ASX',
  'Calculators/Asia/Mitsubishi/Carisma.cal':'Dashboard/Asia/Mitsubishi'
 };
 for(const [path,folder] of Object.entries(inferred)){const e=allCal.find(x=>x.path===path);assert(e,path);assert.equal(org.folder(e),folder,path);}
});
await test('other Germany panels follow brand and model nesting from the dated layout',()=>{
 assert.equal(germanOtherSource.length,309,'all non-BMW Germany source paths');
 assert.equal(new Set(germanOtherSource.map(e=>e.sha)).size,309,'distinct non-BMW Germany CAL contents');
 const brandCounts={};
 const folders=new Set();
 let direct=0;
 for(const e of germanOtherSource){
  const brand=e.path.split('/')[2],folder=org.folder(e);
  assert.equal(folder.split('/').slice(0,3).join('/'),'Dashboard/Germany/'+brand,e.path);
  assert(folder.split('/').length===3||folder.split('/').length===4,'brand or model/block depth '+folder);
  assert(org.matches(e,e.path),'original path search '+e.path);
  brandCounts[brand]=(brandCounts[brand]||0)+1;folders.add(folder);
  if(folder.split('/').length===3)direct++;
 }
 assert.deepEqual(brandCounts,{Audi:32,Mercedes:87,Mini:5,Opel:41,Porsche:14,Seat:24,Skoda:16,Smart:10,Volkswagen:80});
 assert.equal(folders.size,76,'brand/model display folders');
 assert.equal(direct,42,'records kept directly under their brand');
 const inferred=[
  ['Calculators/Germany/Audi/A4 MM73 912dg128 v1.cal','Dashboard/Germany/Audi/A4'],
  ['Calculators/Germany/Audi/A4 MM73 912dg128 v2.cal','Dashboard/Germany/Audi/A4'],
  ['Calculators/Germany/Audi/A6 MM73 912dg128.cal','Dashboard/Germany/Audi/A6'],
  ['Calculators/Germany/Audi/TT MM73 912dg128.cal','Dashboard/Germany/Audi/TT'],
  ['Calculators/Germany/Audi/TT MM73 912D60.cal','Dashboard/Germany/Audi/TT'],
  ['Calculators/Germany/Mercedes/V W447 95640.cal','Dashboard/Germany/Mercedes'],
  ['Calculators/Germany/Mercedes/Sprinter EZS 9S12DT256.cal','Dashboard/Germany/Mercedes/Sprinter'],
  ['Calculators/Germany/Mercedes/Sprinter 24C04.cal','Dashboard/Germany/Mercedes/Sprinter'],
  ['Calculators/Germany/Mercedes/V W639 EZS 908AZ60 Auto.cal','Dashboard/Germany/Mercedes/V W639'],
  ['Calculators/Germany/Mercedes/Sprinter 24C02.cal','Dashboard/Germany/Mercedes/Sprinter'],
  ['Calculators/Germany/Mercedes/Ratrack Prinoth 93C86.cal','Dashboard/Germany/Mercedes'],
  ['Calculators/Germany/Mercedes/G W463 EZS 908AZ60.cal','Dashboard/Germany/Mercedes/G W463'],
  ['Calculators/Germany/Mercedes/Citan 95160.cal','Dashboard/Germany/Mercedes/Citan'],
  ['Calculators/Germany/Opel/Meriva 95160 Body.cal','Dashboard/Germany/Opel/Meriva'],
  ['Calculators/Germany/Opel/Antara 93c86.cal','Dashboard/Germany/Opel'],
  ['Calculators/Germany/Opel/AstraH VDO 35080.cal','Dashboard/Germany/Opel/Astra'],
  ['Calculators/Germany/Opel/Astra J 24c16 Body.cal','Dashboard/Germany/Opel/Astra'],
  ['Calculators/Germany/Porsche/Cartronic 95P08 V1.cal','Dashboard/Germany/Porsche'],
  ['Calculators/Germany/Porsche/Cartronic 95P08 V2.cal','Dashboard/Germany/Porsche'],
  ['Calculators/Germany/Porsche/Cartronic 95P08 V3.cal','Dashboard/Germany/Porsche'],
  ['Calculators/Germany/Porsche/Cartronic 95320.cal','Dashboard/Germany/Porsche'],
  ['Calculators/Germany/Skoda/Octavia 24C32 new v1.cal','Dashboard/Germany/Skoda/Octavia'],
  ['Calculators/Germany/Skoda/Octavia 24C32 new v2.cal','Dashboard/Germany/Skoda/Octavia'],
  ['Calculators/Germany/Skoda/Octavia 24C32 new v3.cal','Dashboard/Germany/Skoda/Octavia'],
  ['Calculators/Germany/Smart/Smart for two BCM hc05x32.cal','Dashboard/Germany/Smart/ForTwo'],
  ['Calculators/Germany/Smart/Smart new 93s66.cal','Dashboard/Germany/Smart'],
  ['Calculators/Germany/Smart/Smart for two dash VDO 93c66.cal','Dashboard/Germany/Smart/ForTwo'],
  ['Calculators/Germany/Smart/Smart W451 25160.cal','Dashboard/Germany/Smart/ForTwo'],
  ['Calculators/Germany/Smart/Smart SAM 9S12B128.cal','Dashboard/Germany/Smart/ForTwo'],
  ['Calculators/Germany/Volkswagen/Golf4 24C02.cal','Dashboard/Germany/Volkswagen/Golf'],
  ['Calculators/Germany/Volkswagen/Caddy 24c32.cal','Dashboard/Germany/Volkswagen/Caddy']
 ];
 for(const [path,folder] of inferred){const e=allCal.find(x=>x.path===path);assert(e,path);assert.equal(org.folder(e),folder,path);}
});
await test('France panels follow confirmed brands and preserve disputed entries',()=>{
 assert.equal(franceAllSource.length,392,'all France source paths');
 assert.equal(franceShas.size,392,'distinct France CAL contents');
 assert.equal(franceMovedSource.length,386,'confirmed France dashboard entries');
 for(const e of franceAllSource)assert(org.matches(e,e.path),'original path search '+e.path);
 const brandCounts={},folders=new Set();
 let direct=0;
 for(const e of franceMovedSource){
  const brand=e.path.split('/')[2],folder=org.folder(e);
  assert.equal(folder.split('/').slice(0,3).join('/'),'Dashboard/France/'+brand,e.path);
  assert(folder.split('/').length===3||folder.split('/').length===4,'brand or model/block depth '+folder);
  assert(org.matches(e,e.path),'original path search '+e.path);
  brandCounts[brand]=(brandCounts[brand]||0)+1;folders.add(folder);
  if(folder.split('/').length===3)direct++;
 }
 assert.deepEqual(brandCounts,{Aixam:3,Citroen:122,Dacia:6,Peugeot:147,Renault:108});
 assert.equal(folders.size,55,'France brand/model display folders');
 assert.equal(direct,27,'records kept directly under their brand');
 const disputed={
  'Calculators/France/Case/CX90 93C46.cal':'Dashboard/Case',
  'Calculators/France/Case/MX120 93C46.cal':'Dashboard/Case',
  'Calculators/France/Case/MX150 93C46.cal':'Dashboard/Case',
  'Calculators/France/Case/MX170 93C46.cal':'Dashboard/Case',
  'Calculators/France/Citroen/Dash RS5 93C86 V1.cal':'Dashboard/Citroen',
  'Calculators/France/Peugeot/Satelis 24C04.cal':'Dashboard/Peugeot'
 };
 for(const [path,folder] of Object.entries(disputed)){
  const e=allCal.find(x=>x.path===path);assert(e,path);assert.equal(org.folder(e),folder,path);
 }
 const latitudeVariants=allCal.filter(e=>e.path.startsWith('Calculators/France/Renault/Latitude')&&/24C16/i.test(e.path));
 assert.equal(latitudeVariants.length,2);assert.notEqual(org.title(latitudeVariants[0]),org.title(latitudeVariants[1]));
 const renamed=latitudeVariants.find(e=>org.get(e.sha).old_name);
 assert(renamed);assert(org.matches(renamed,org.get(renamed.sha).old_name));
});
await test('Asia Acura panels preserve the reference model folders',()=>{
 assert.equal(asiaAcuraSource.length,19,'all Asia/Acura source paths');
 assert.equal(asiaAcuraShas.size,19,'distinct Asia/Acura CAL contents');
 const expectedCounts={'Dashboard/Asia/Acura':4,'Dashboard/Asia/Acura/EL':2,'Dashboard/Asia/Acura/MDX':3,'Dashboard/Asia/Acura/RDX':1,'Dashboard/Asia/Acura/RSX':2,'Dashboard/Asia/Acura/TL':4,'Dashboard/Asia/Acura/TSX':3};
 const actualCounts={};
 for(const e of asiaAcuraSource){
  const folder=org.folder(e);actualCounts[folder]=(actualCounts[folder]||0)+1;
  assert(folder==='Dashboard/Asia/Acura'||folder.startsWith('Dashboard/Asia/Acura/'),e.path);
  assert(org.matches(e,e.path),'original path search '+e.path);
 }
 assert.deepEqual(Object.fromEntries(Object.entries(actualCounts).sort()),Object.fromEntries(Object.entries(expectedCounts).sort()));
});
await test('Airbag roots keep only unresolved brands; CX-5 moves to Mazda with its operation status unchanged',()=>{
 const report=require('../reports/catalog-airbag-organization-2026-11-04.json');
 assert.equal(report.totals.unique_sha,5383,'Airbag/SRS unique SHA unchanged');
 assert.equal(report.totals.ambiguous,9);assert.equal(report.totals.operation_unconfirmed,1);
 const cx5=entry('3233be92811e89914a7a85ae0e99bcfb7dde48c41745173b64514d8800bcde01');
 assert(cx5,'CX-5 source path');
 assert.equal(org.folder(cx5),'Airbag/Mazda/CX-5');
 assert.equal(org.title(cx5),'Mazda CX-5 2018 K123 57K30B — операция не подтверждена');
 const item=org.get(cx5.sha);assert(item.old_name);assert(org.matches(cx5,item.old_name),'old CX-5 name remains searchable');
 assert.equal(item.reason,undefined,'brand is confirmed, operation state is in the display name');
 const airbagRoot=Object.values(org.data.entries).filter(x=>x.folder==='Airbag');
 assert.equal(airbagRoot.length,9);
 for(const row of airbagRoot)assert(row.reason&&row.reason.trim(),'root reason');
});
await test('Airbag model folders are restored from source paths, including Toyota RAV4',()=>{
 const rav4=allCal.filter(e=>/^Calculators\/(Airbag|SRS)\/Toyota\/RAV-?4\//i.test(e.path));
 assert(rav4.length>0,'RAV4 source paths');
 const rav4Shas=new Set(rav4.map(e=>e.sha));
 for(const e of rav4)assert.equal(org.folder(e),'Airbag/Toyota/RAV4',e.path);
 for(const [sha,item] of Object.entries(org.data.entries))if(rav4Shas.has(sha))assert.equal(item.folder,'Airbag/Toyota/RAV4',sha);
 const airbagModels=[...new Set(Object.values(org.data.entries).filter(item=>item.folder.startsWith('Airbag/')&&item.folder.split('/').length===3).map(item=>item.folder.split('/')[1]))];
 assert(airbagModels.length>20,'Airbag model folders restored');
 assert(airbagModels.includes('Toyota'));
 const cx5=Object.values(org.data.entries).find(item=>item.folder==='Airbag/Mazda/CX-5');
 assert(cx5,'CX-5 model folder');
 const focus=Object.values(org.data.entries).filter(item=>item.folder==='Airbag/Ford/Focus');
 assert(focus.length>0,'Ford Focus model folder');
 for(const item of Object.values(org.data.entries)){
  if(!item.folder.startsWith('Airbag/'))continue;
  const parts=item.folder.split('/');
  assert(!parts.slice(1).some(part=>/^(?:Обновы|╨₧╨▒╨╜╨╛╨▓╤ï|Service|LCM|EWS-4)$/i.test(part)),'service folder '+item.folder);
 }
});
await test('confirmed model folders are restored in Dashboard, Immo and CarRadio without service directories',()=>{
 const modelFolders=prefix=>new Set(Object.values(org.data.entries).filter(item=>item.folder.startsWith(prefix+'/')&&item.folder.split('/').length===3).map(item=>item.folder.slice(prefix.length+1)));
 const dashboard=modelFolders('Dashboard'),immo=modelFolders('Immo'),radio=modelFolders('CarRadio');
 assert(dashboard.size>200,'Dashboard model folders');assert(dashboard.has('Toyota/RAV4'));assert(dashboard.has('Peugeot/308'));
 assert(immo.has('Opel/Astra H'));assert(immo.has('Ford/Transit Connect'));
 assert(radio.has('Acura/MDX'));assert(radio.has('Renault/Duster'));
 for(const [section,folders] of [['Dashboard',dashboard],['Immo',immo],['CarRadio',radio]]){
  for(const folder of folders)assert(!/(^|\/)(?:Service|LCM|EWS-4|Smart Key|Обновы|╨₧╨▒╨╜╨╛╨▓╤ï)$/i.test(folder),'service model folder '+section+'/'+folder);
 }
});
await test('Denso and Yazaki screenshot roots use confirmed panel-manufacturer folders and keep Toyota/Lexus search',()=>{
 const report=require('../reports/catalog-organization-dashboard-2026-11-04.json'),rr=report.root_routing;
 const manufactured=rr.moved_entries.filter(row=>row.routing==='manufacturer');
 assert.equal(manufactured.length,14,'all Dashboard roots have a confirmed manufacturer folder');
 const screenshot=manufactured.filter(row=>['Denso','Yazaki'].includes(row.manufacturer));
 assert.equal(screenshot.length,11,'Denso/Yazaki screenshot group');
 for(const row of manufactured){
  const item=org.get(row.sha);assert(item,row.sha);
  assert.equal(item.folder,'Dashboard/'+row.manufacturer,row.sha);
  assert.equal(item.manufacturer,row.manufacturer,row.sha);
  assert.equal(item.reason,undefined,row.sha);
  assert(org.matches(entry(row.sha),row.manufacturer),'manufacturer search '+row.sha);
 }
 for(const row of screenshot){
  assert(row.brands.includes('Toyota')&&row.brands.includes('Lexus'),'both car brands retained '+row.sha);
  assert(org.matches(entry(row.sha),'Toyota'),'Toyota search '+row.sha);
  assert(org.matches(entry(row.sha),'Lexus'),'Lexus search '+row.sha);
 }
 const denso=manufactured.filter(row=>row.manufacturer==='Denso');const yazaki=manufactured.filter(row=>row.manufacturer==='Yazaki');
 assert.equal(denso.length,5);assert.equal(yazaki.length,6);
 assert.deepEqual([...new Set(manufactured.map(row=>row.manufacturer))].sort(),['Curtis','Denso','Kansey','Visteon','Yazaki']);
});
await test('approved entries keep exact names, folders, original paths and bytes',async()=>{
 for(const [sha,name,folder] of approvedExpected){
  const e=entry(sha);assert(e,sha);assert.equal(org.title(e),name,sha);assert.equal(org.folder(e),folder,sha);
  run('select(entries.find(e=>e.sha==='+JSON.stringify(sha)+'))');
  assert.equal(run('selected.sha'),sha);assert.equal(run('selected.path'),e.path);
  assert.equal(el('calcTitle').textContent,name);assert(el('calcPath').textContent.includes('Раздел: '+folder));assert(el('calcPath').textContent.includes(e.path));
  doc.downloads.length=0;await el('exportCal').click();const download=doc.downloads.at(-1);
  assert.equal(download.name,e.path.split('/').at(-1),'export name '+sha);
  assert.deepEqual(Buffer.from(await download.blob.arrayBuffer()),Buffer.from(db.blobs[sha],'base64'),'export bytes '+sha);
 }
});
await test('Airbag, Dashboard, Immo and CarRadio cover their source paths once',()=>{
 const airSource=allCal.filter(e=>/^Calculators\/(Airbag|SRS)\//i.test(e.path));
 assert.equal(airSource.length,7664);assert.equal(new Set(airSource.map(e=>e.sha)).size,5383);
 for(const e of airSource)assert(org.folder(e)==='Airbag'||org.folder(e).startsWith('Airbag/'),'airbag '+e.path);
 assert.equal(Object.values(org.data.entries).filter(x=>x.folder==='Airbag'||x.folder.startsWith('Airbag/')).length,5386,'Airbag plus moved SRS utilities');
 for(const e of allCal.filter(e=>e.path.startsWith('Calculators/Dashboard/')))assert(org.get(e.sha),'dashboard '+e.path);
 for(const e of allCal.filter(e=>e.path.startsWith('Calculators/Immo/')))assert(org.get(e.sha),'immo '+e.path);
 for(const e of allCal.filter(e=>e.path.startsWith('Calculators/CarRadio/')))assert(org.get(e.sha),'radio '+e.path);
});
await test('utility names contain only evidenced operations and confirmed SRS is in Airbag',()=>{
 const utilitySource=[...Object.values(org.data.entries)].filter(x=>x.folder.startsWith('OTHER/'));
 assert.equal(utilitySource.length,216,'216 utility subfolder entries');
 for(const item of utilitySource){
  assert(!/сервисные функции и коррекция пробега|сервисные функции/i.test(item.name),item.name);
  assert(!/Конвертеры US-EU|Сервисные функции|PIN и IMMO|Синхронизация|Тахографы/i.test(item.folder),item.folder);
 }
 for(const path of ['Calculators/Service calc/Mercedes/E W211  AB 68HC912DG128.cal','Calculators/Service calc/Mercedes/E W211 AB  MC9S12DG128.cal','Calculators/Service calc/Mercedes/E W211 AB 68HC912DG128 var2.cal']){
  const e=allCal.find(x=>x.path===path);assert(e,path);assert.equal(org.folder(e),'Airbag/Mercedes-Benz');assert.match(org.title(e),/сброс Crash \(SRS\)/);
 }
 const help=allCal.find(e=>e.path==='Calculators/PIN/Mitsubishi/Help.cal');assert.equal(org.folder(help),'OTHER/PIN');assert.match(org.reason(help),/назначение/);assert(!/— коррекция пробега/.test(org.title(help)));
});
await test('all 2,629 remainder SHA are distributed by original sections with reasons where needed',()=>{
 const report=require('../reports/catalog-organization-remainder-2026-11-04.json');
 assert.equal(report.before.unique_sha,2629);assert.equal(report.after.distributed_sha,2629);assert.equal(report.after.outside_map_sha,0);
 assert.equal(report.decisions.length,2629);assert.equal(report.ambiguous_entries.length,report.ambiguous);
 const seen=new Set();
 for(const row of report.decisions){
  assert(!seen.has(row.sha),row.sha);seen.add(row.sha);assert(row.paths.includes(row.canonical_path));
  const e=allCal.find(x=>x.path===row.canonical_path);assert(e,row.canonical_path);assert.equal(e.sha,row.sha);
  if(germanyShas.has(row.sha)||franceShas.has(row.sha)||asiaAllShas.has(row.sha))continue;
  const item=org.get(row.sha);assert(item);assert.equal(item.name,row.name);assert.equal(item.folder,row.folder);
  assert(row.folder.split('/')[0]===row.canonical_path.split('/')[1],'original root '+row.folder);
  for(const path of row.paths)assert(org.matches(allCal.find(x=>x.path===path),path),path);
  assert(org.matches(e,item.name),'remaining display name search '+row.sha);
 }
 assert.equal(seen.size,2629);
});
await test('main sections sort by unique CAL count; folders inside sections sort alphabetically with counters',()=>{
 el('search').value='';run("catalogScope='';expandedFolders.clear();renderCatalog()");
 const sections=sectionRows();assert(sections.length>=16);
 for(let i=1;i<sections.length;i++){
  assert(sections[i-1].count>=sections[i].count,'root count order '+sections[i-1].name+' vs '+sections[i].name);
  if(sections[i-1].count===sections[i].count)assert(sections[i-1].name.localeCompare(sections[i].name,'ru')<=0,'root tie name');
 }
 assert.equal(sections[0].name,'Dashboard','largest section first');
 assert.equal(sections.find(x=>x.name==='Airbag').count,5386);assert.equal(sections[0].count,5964);
 const expectedCount=folder=>groups.filter(g=>org.displayPath(g.e)?.startsWith(folder+'/')).length;
 const folderPaths=[...new Set(Object.values(org.data.entries).flatMap(item=>{const parts=item.folder.split('/');return parts.map((_,index)=>parts.slice(0,index+1).join('/'));}))];
 const expand=folderPaths.map(folder=>'expandedFolders.add('+JSON.stringify(folder)+')').join(';');
 const checkAlphabetical=(parent,prefix,section)=>{
  const rows=folderRows(parent);if(!rows.length)return;
  for(let i=1;i<rows.length;i++)assert(rows[i-1].name.localeCompare(rows[i].name,'ru')<=0,'folder alphabetical order '+section+' '+prefix+' '+rows[i-1].name+' vs '+rows[i].name);
  for(const row of rows){const path=prefix+'/'+row.name;assert.equal(row.count,expectedCount(path),'counter '+path);checkAlphabetical(row.node,path,section);}
 };
 for(const section of ['Airbag','Dashboard','Immo','CarRadio','OTHER']){
  run("expandedFolders.clear();"+expand+";catalogScope='"+section+"';renderCatalog()");
  checkAlphabetical(el('tree'),section,section);
 }
 run("expandedFolders.clear();catalogScope='';renderCatalog()");
});
await test('custom calculators stay visible and follow the same count order, not a pinned position',()=>{
 const fake={path:'Мои калькуляторы/Проверка.tmp.cal',sha:'f'.repeat(64),size:1,ext:'cal',source:'test',user:true};
 run('entries=entries.concat('+JSON.stringify(fake)+');userEntries.push('+JSON.stringify(fake)+');catalogScope=\'\';expandedFolders.clear();renderCatalog()');
 const rows=sectionRows();const own=rows.find(x=>x.name==='Мои калькуляторы');assert(own,'custom section visible');assert.equal(own.count,1);
 assert.notEqual(rows[0].name,'Мои калькуляторы','custom section is not pinned');
 const idx=rows.findIndex(x=>x.name==='Мои калькуляторы');
 for(let i=1;i<rows.length;i++)assert(rows[i-1].count>=rows[i].count,'custom order');
 run("entries=entries.filter(e=>!e.user);userEntries=[];renderCatalog()");
});
await test('search finds new names, original paths, old file names and old section aliases',()=>{
 const toyota=entry('44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045');
 for(const q of ['Toyota 89170-02810','89170-02810','Calculators/Airbag/89170-02810(93C56).cal','Airbag','SRS','Подушки безопасности'])assert(org.matches(toyota,q),q);
 const philips=entry('d0920cc81247ab7dd31d013dc130dd092747b666546e024382e67d8196ee9877');
 assert(org.matches(philips,'Renault'));assert(!/Renault/i.test(org.title(philips)));
 const help=allCal.find(e=>e.path==='Calculators/PIN/Mitsubishi/Help.cal');
 for(const q of ['Help','Calculators/PIN/Mitsubishi/Help.cal','PIN','Утилиты'])assert(org.matches(help,q),q);
 const remainder=allCal.find(e=>e.path.startsWith('Calculators/Asia/Toyota/'));
 assert(org.matches(remainder,remainder.path),'remainder original path');assert(org.matches(remainder,org.title(remainder)),'remainder display name');
 assert(org.matches(remainder,'Asia'),'remainder original section');
 el('search').value='Toyota 89170-02810';run('searchPage=0;renderCatalog()');
 assert(el('searchPager').textContent.includes('1 · 1/1'));
 el('search').value='';run('searchPage=0;renderCatalog()');
});
await test('tree expanded sections show every unique CAL once, with original exports and pictures',async()=>{
 for(const section of ['Airbag','Dashboard','Immo','CarRadio','OTHER']){
  const folders=[...new Set(Object.values(org.data.entries).filter(x=>x.folder===section||x.folder.startsWith(section+'/')).flatMap(x=>{const parts=x.folder.split('/');return parts.map((_,index)=>parts.slice(0,index+1).join('/'));}))];
  run("expandedFolders.clear();catalogScope='"+section+"';"+folders.map(folder=>'expandedFolders.add('+JSON.stringify(folder)+')').join(';')+';renderCatalog()');
  const expected=groups.filter(g=>{const p=org.displayPath(g.e);return p===section||p?.startsWith(section+'/');}).length;
  assert.equal(walk(el('tree'),'fileItem').length,expected,'visible once in '+section);
 }
 const toyota=entry('44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045');
 run('select(entries.find(e=>e.sha==='+JSON.stringify(toyota.sha)+'))');
 const img=run('picture({type:"P",id:5,text:"Toyota.bmp"})');assert(img);assert.match(img.src,/^data:image\/bmp;base64,/);
 assert(!db.entries.some(e=>e.path.toLowerCase()==='calculators/airbag/toyota/toyota.bmp'),'no duplicate image');
});
await test('Airbag/SRS reconciliation accounts for every unique SHA and preserves names',async()=>{
 const rec=require('../reports/catalog-airbag-reconciliation-2026-11-06.json');
 const routes=require('../tools/catalog-airbag-routes.json');
 assert.equal(rec.totals.unique_sha,5383,'Airbag/SRS unique SHA');
 assert.equal(rec.totals.already+rec.totals.moved+rec.totals.disputed,5383,'three groups cover all SHA');
 assert.equal(rec.reconciliation_sum,5383,'recorded reconciliation sum');
 assert.equal(rec.already.length,rec.totals.already,'already count');
 assert.equal(rec.moved.length,rec.totals.moved,'moved count');
 assert.equal(rec.disputed.length,rec.totals.disputed,'disputed count');
 assert.equal(Object.values(rec.disputed_by_reason).reduce((sum,n)=>sum+n,0),rec.totals.disputed,'reason count');
 assert.equal(Object.keys(routes.routes).length,rec.totals.already+rec.totals.moved,'confirmed routes');
 const seen=new Set();
 for(const group of ['already','moved','disputed'])for(const row of rec[group]){
  assert(!seen.has(row.sha),'duplicate '+row.sha);seen.add(row.sha);
  const item=org.get(row.sha);assert(item,row.sha);
  const folder=group==='moved'?row.to:row.folder;
  assert.equal(item.folder,folder,row.sha);
  assert.equal(item.name,row.name,'name preserved '+row.sha);
  if(group==='moved'){
   assert(row.to.startsWith('Airbag/')&&row.to.split('/').length===3,'moved target '+row.sha);
   assert.equal(routes.routes[row.sha],row.to.replace(/^Airbag\//,''),'route '+row.sha);
  }else if(group==='disputed')assert(row.reason&&row.reason.trim(),'reason '+row.sha);
 }
 assert.equal(seen.size,5383,'every SHA appears once');
 for(const [sha,name] of Object.entries(routes.name_overrides))assert.equal(org.get(sha).name,name,'name override '+sha);
 const moved=rec.moved.find(row=>row.to==='Airbag/Volkswagen/Touareg');
 assert(moved,'moved Volkswagen entry');
 const e=entry(moved.sha);assert(e,moved.sha);
 assert(org.matches(e,moved.path),'old path search '+moved.path);
 run('select(entries.find(e=>e.sha==='+JSON.stringify(moved.sha)+'))');
 assert.equal(el('calcTitle').textContent,org.title(e),'moved title');
 doc.downloads.length=0;await el('exportCal').click();const download=doc.downloads.at(-1);
 assert.equal(download.name,e.path.split('/').at(-1),'moved export name');
 assert.deepEqual(Buffer.from(await download.blob.arrayBuffer()),Buffer.from(db.blobs[moved.sha],'base64'),'moved export bytes');
});
console.log(JSON.stringify({passed,scope:'original section names, counted section order, alphabetical inner folders, complete 15,057 SHA map, search, export and pictures via real app.js handlers'}));
})().catch(e=>{console.error(e);process.exit(1)});
