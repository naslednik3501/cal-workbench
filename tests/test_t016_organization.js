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
const groups=scope.calculatorGroups(db.entries);
const groupBySha=new Map(groups.map(g=>[g.e.sha,g]));
const walk=(item,cls)=>item.children.flatMap(c=>[...(c.className?.startsWith(cls)?[c]:[]),...walk(c,cls)]);
const folderRows=()=>el('tree').children.filter(c=>c.tagName==='DETAILS').map(c=>({name:c.children[0].children[1].textContent,count:Number(c.children[0].children[2].textContent)}));
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
 const display=new Set(),roots=new Set();
 for(const [sha,item] of Object.entries(org.data.entries)){
  assert(item.name.trim()&&item.name.length<=140,sha);assert(item.folder.trim(),sha);
  assert(!/(^|\/)(?:Подушки безопасности|Приборные панели|Иммобилайзеры и ключи|Магнитолы и навигация|Утилиты)(\/|$)/.test(item.folder),'translated root: '+item.folder);
  assert(!/(^|\/)(?:Неуточнённые|Универсальные|Конвертеры ключей|Справочники|Инверсия)(\/|$)/.test(item.folder),'invented folder: '+item.folder);
  if(item.reason)assert(item.reason.trim().length<=240,sha);
  const key=(item.folder+'/'+item.name).toLowerCase();assert(!display.has(key),'duplicate display '+key);display.add(key);
  roots.add(item.folder.split('/')[0]);
 }
 for(const root of ['Airbag','Dashboard','Immo','CarRadio','OTHER'])assert(roots.has(root),root);
 assert.deepEqual([...roots].sort(),['ATV','Asia','Bikes','CHINA','CRYPTO','CRYPTO+','Car','Dashboard','ECU','EU_US_RU','France','Germany','Immo','MOTO - TRUCK - ATV','OTHER','Peugeot','Airbag','CarRadio'].sort());
 assert.equal(org.folder(entry('44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045')),'Airbag/Toyota');
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
  const item=org.get(row.sha);assert(item);assert.equal(item.name,row.name);assert.equal(item.folder,row.folder);
  assert(row.folder.split('/')[0]===row.canonical_path.split('/')[1],'original root '+row.folder);
  for(const path of row.paths)assert(org.matches(allCal.find(x=>x.path===path),path),path);
  assert(org.matches(e,item.name),'remaining display name search '+row.sha);
 }
 assert.equal(seen.size,2629);
});
await test('tree roots and every nested folder are ordered by unique CAL SHA count with matching counters',()=>{
 el('search').value='';run("catalogScope='';expandedFolders.clear();renderCatalog()");
 const sections=sectionRows();assert(sections.length>=17);
 for(let i=1;i<sections.length;i++){
  assert(sections[i-1].count>=sections[i].count,'root count order '+sections[i-1].name+' vs '+sections[i].name);
  if(sections[i-1].count===sections[i].count)assert(sections[i-1].name.localeCompare(sections[i].name,'ru')<=0,'root tie name');
 }
 assert.equal(sections[0].name,'Airbag','largest section first');
 assert.equal(sections[0].count,5386);assert.equal(sections.find(x=>x.name==='Dashboard').count,4843);
 const expectedCount=folder=>groups.filter(g=>org.displayPath(g.e)?.startsWith(folder+'/')).length;
 for(const section of ['Dashboard','Immo','CarRadio','OTHER','Asia']){
  run("expandedFolders.clear();catalogScope='"+section+"';renderCatalog()");
  const rows=folderRows();assert(rows.length>0,section);
  for(let i=1;i<rows.length;i++){
   assert(rows[i-1].count>=rows[i].count,'folder count order '+section+' '+rows[i-1].name+' vs '+rows[i].name);
   if(rows[i-1].count===rows[i].count)assert(rows[i-1].name.localeCompare(rows[i].name,'ru')<=0,'folder tie name '+section);
  }
  for(const row of rows)assert.equal(row.count,expectedCount(section+'/'+row.name),'counter '+section+'/'+row.name);
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
  const folders=[...new Set(Object.values(org.data.entries).filter(x=>x.folder===section||x.folder.startsWith(section+'/')).map(x=>x.folder))];
  run("expandedFolders.clear();catalogScope='"+section+"';"+folders.map(folder=>'expandedFolders.add('+JSON.stringify(folder)+')').join(';')+';renderCatalog()');
  const expected=groups.filter(g=>{const p=org.displayPath(g.e);return p===section||p?.startsWith(section+'/');}).length;
  assert.equal(walk(el('tree'),'fileItem').length,expected,'visible once in '+section);
 }
 const toyota=entry('44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045');
 run('select(entries.find(e=>e.sha==='+JSON.stringify(toyota.sha)+'))');
 const img=run('picture({type:"P",id:5,text:"Toyota.bmp"})');assert(img);assert.match(img.src,/^data:image\/bmp;base64,/);
 assert(!db.entries.some(e=>e.path.toLowerCase()==='calculators/airbag/toyota/toyota.bmp'),'no duplicate image');
});
console.log(JSON.stringify({passed,scope:'original section names, counted tree order, complete 15,057 SHA map, search, export and pictures via real app.js handlers'}));
})().catch(e=>{console.error(e);process.exit(1)});
