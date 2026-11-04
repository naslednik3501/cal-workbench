// Node checks for the T-016 display map and the real app handlers in a minimal DOM adapter.
// This is not browser rendering or a vehicle compatibility check.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const db=globalThis.CAL_CATALOG,scope=require('../catalog-scope.js'),org=require('../catalog-organization.js');
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
await test('12 approved SHAs have one original path and one display path each',()=>{
 assert.equal(Object.keys(org.data.entries).length,12);assert.equal(expected.length,12);
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
 assert.equal(org.displayPath(radio),null);assert.equal(org.title(radio),'22DC679.cal');
 assert(org.matches(radio,'carradio'),'unclassified CAL keeps the original path rule');
});

await test('the tree shows each approved CAL once under its thematic section',()=>{
 const sections=el('tree').children.filter(c=>c.className==='sectionButton').map(c=>c.children[1].textContent);
 for(const s of ['Подушки безопасности','Приборные панели','Иммобилайзеры и ключи','Магнитолы и навигация','Утилиты'])assert(sections.includes(s),s);
 assert.equal(el('tree').children.filter(c=>c.className.startsWith('fileItem')).length,0,'no CAL is displayed at the root any more');
 const walk=(item,cls)=>item.children.flatMap(c=>[...(c.className?.startsWith(cls)?[c]:[]),...walk(c,cls)]);
 run("catalogScope='Подушки безопасности';expandedFolders.add('Подушки безопасности/Toyota');expandedFolders.add('Подушки безопасности/Nissan');expandedFolders.add('Подушки безопасности/Chevrolet');renderCatalog()");
 const airbag=walk(el('tree'),'fileItem');
 assert.equal(airbag.length,3);assert(airbag.every(f=>/сброс Crash/.test(f.textContent)));
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
 assert.equal(el('tree').children.filter(c=>c.className.startsWith('fileItem')).length,1,'old file name still finds the entry');
 el('search').value='подушки безопасности';run('searchPage=0;renderCatalog()');
 assert.equal(el('tree').children.filter(c=>c.className.startsWith('fileItem')).length,3,'thematic folder finds its three CALs');
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

