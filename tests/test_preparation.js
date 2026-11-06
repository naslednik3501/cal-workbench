// Node tests of real app event handlers with a minimal DOM adapter.
// This is NOT browser rendering or CSS verification.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
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
let urlId=0,confirmAnswer=false,confirmMessages=[];const context=vm.createContext({document:doc,CAL_IMAGES:require('../image-resources.js'),CatalogOrganization:require('../catalog-organization.js'),CatalogScope:require('../catalog-scope.js'),CalEngine:require('../engine.js'),CAL_CATALOG,CatalogStore:{...require('../catalog-store.js'),Store:class{async load(){return [];}async save(e){this.saved=e;}}},console,Uint8Array,Blob,TextDecoder,crypto:crypto.webcrypto,atob,btoa,URL:{createObjectURL(blob){let u='blob:test-'+(++urlId);doc.urls.set(u,blob);return u;},revokeObjectURL(){}},setTimeout(){},Date,confirm(message){confirmMessages.push(message);return confirmAnswer;}});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),el=id=>doc.ids[id];let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function upload(bytes,name){return {name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};}
const watchdog=setTimeout(()=>{console.error('FAIL preparation test timeout');process.exit(1);},30000);
const src='Size(200,120);Form{Digit(km,"Value",0,0,100);Label(msg,"",0,30);} OnShow{@0=17;km=2;} OnApply{@1=km;@2=@2+1;if(km=99){@bufsize=1;}} OnChange{@selstart=km;}';
async function openSource(text=src){el('openCal').files=[upload(Buffer.from(text),'preparation.cal')];await el('openCal').trigger('change');}
(async()=>{
await run('catalogReady');
await test('Text CAL import renders real controls and supports working-copy preparation',async()=>{
 await openSource();await run('loadBin')(upload(new Uint8Array(16),'test.bin'));
 assert.equal(run('program.format'),'text');assert.equal(el('cal-input-0').value,'2');assert.equal(run('session.buffer[0]'),17);assert.equal(run('candidate[0]'),17);assert.equal(run('original[0]'),0);assert(!el('save').disabled);assert.match(el('resultStatus').textContent,/подготовлена/);
});
await test('Downloads keep original and prepared result separate',async()=>{
 await el('saveOriginal').click();await el('save').click();assert.equal(doc.downloads.at(-2).name,'test.bin');assert.equal(doc.downloads.at(-1).name,'test_result.bin');
 assert.deepEqual([...new Uint8Array(await doc.downloads.at(-2).blob.arrayBuffer())],Array(16).fill(0));assert.equal(new Uint8Array(await doc.downloads.at(-1).blob.arrayBuffer())[0],17);
});
await test('Apply uses prepared bytes and does not accumulate repeated calculations',async()=>{
 await el('apply').click();const first=Buffer.from(run('candidate'));assert.deepEqual([...first.slice(0,3)],[17,2,1]);await el('apply').click();assert.deepEqual(Buffer.from(run('candidate')),first);assert.equal(run('session.buffer[2]'),0);
 assert.equal(confirmMessages.length,0,'ordinary Apply must not ask for confirmation');
});
await test('Cancelling repeated Apply preserves manually edited result',async()=>{
 el('editAddress').value='02';el('editByte').value='7F';await el('edit').click();
 const edited=Buffer.from(run('candidate'));assert.equal(run('manualCandidate'),true);confirmAnswer=false;
 await el('apply').click();
 assert.equal(confirmMessages.length,1);assert.match(confirmMessages.at(-1),/Ручные изменения/);assert.match(confirmMessages.at(-1),/сброшены/);
 assert.deepEqual(Buffer.from(run('candidate')),edited);assert.equal(run('manualCandidate'),true);assert.equal(run('resultKind'),'CAL + ручное редактирование');
 assert.match(el('resultStatus').textContent,/Пересчёт отменён/);assert(!el('save').disabled);
 await el('save').click();assert.deepEqual(Buffer.from(await doc.downloads.at(-1).blob.arrayBuffer()),edited);
});
await test('Confirming repeated Apply recalculates from current CAL inputs',async()=>{
 confirmAnswer=true;await el('apply').click();
 assert.equal(confirmMessages.length,2);assert.deepEqual([...run('candidate').slice(0,3)],[17,2,1]);
 assert.equal(run('manualCandidate'),false);assert.equal(run('resultKind'),'CAL OnApply');assert(el('calcError').hidden);
});
await test('Calculation error clears manual edits and their confirmation state',async()=>{
 el('editAddress').value='04';el('editByte').value='5A';await el('edit').click();assert.equal(run('manualCandidate'),true);
 run("const applyCloneForError=session.clone;session.clone=()=>{throw Error('forced calculation error')}");
 confirmAnswer=true;await el('apply').click();
 assert(!el('calcError').hidden);assert.match(el('calcError').textContent,/forced calculation error/);
 assert.equal(run('candidate'),null);assert.equal(run('manualCandidate'),false);assert.equal(run('resultKind'),'');assert(el('save').disabled);
 run('session.clone=applyCloneForError');
 const confirmations=confirmMessages.length;await el('apply').click();
 assert.equal(confirmMessages.length,confirmations);assert.equal(run('manualCandidate'),false);assert.deepEqual([...run('candidate').slice(0,3)],[17,2,1]);
});
await test('New BIN read failure preserves the open session and manual result',async()=>{
 el('editAddress').value='03';el('editByte').value='A5';await el('edit').click();
 const before={original:Buffer.from(run('original')),candidate:Buffer.from(run('candidate')),name:run('name'),digest:run('digest'),selected:run('selected')};
 await run('loadBin')({name:'broken.bin',size:16,arrayBuffer:async()=>{throw Error('simulated read failure')}});
 assert.equal(run('name'),before.name);assert.equal(run('digest'),before.digest);assert.equal(run('selected'),before.selected);
 assert.deepEqual(Buffer.from(run('original')),before.original);assert.deepEqual(Buffer.from(run('candidate')),before.candidate);
 assert.equal(run('manualCandidate'),true);assert(!el('save').disabled);assert(!el('saveOriginal').disabled);
 assert(!el('binError').hidden);assert.match(el('binError').textContent,/Текущий BIN и результат сохранены/);
 await run('loadBin')({name:'wrong-size.bin',size:15,arrayBuffer:async()=>Uint8Array.from(before.original).buffer});
 assert.equal(run('name'),before.name);assert.deepEqual(Buffer.from(run('original')),before.original);assert.deepEqual(Buffer.from(run('candidate')),before.candidate);
 assert.match(el('binError').textContent,/Не удалось прочитать файл целиком/);assert(!el('save').disabled);
 await el('save').click();assert.deepEqual(Buffer.from(await doc.downloads.at(-1).blob.arrayBuffer()),before.candidate);
});
await test('Successful BIN replacement starts a fresh session',async()=>{
 const replacement=Buffer.alloc(16);await run('loadBin')(upload(replacement,'replacement.bin'));
 assert.equal(run('name'),'replacement.bin');assert.deepEqual(Buffer.from(run('original')),replacement);
 assert.equal(run('manualCandidate'),false);assert.equal(run('candidate[0]'),17);assert.equal(run('candidate[1]'),0);
 assert(el('binError').hidden);assert(!el('apply').disabled);assert(!el('saveOriginal').disabled);
});
await test('Changed input drops old calculation but preserves explicitly labelled preparation',async()=>{
 el('cal-input-0').value='7';await el('cal-input-0').trigger('input');assert.equal(run('candidate[1]'),0);assert.equal(run('candidate[2]'),0);assert.equal(run('candidate[0]'),17);assert.equal(run('resultKind'),'CAL подготовка');assert.match(el('resultStatus').textContent,/Применить/);assert.equal(run('original[0]'),0);
});
await test('OnChange writes only working copy, and Apply starts from that copy',async()=>{
 el('selStart').value='4';el('selEnd').value='5';await el('selection').click();assert.equal(run('session.buffer[4]'),7);assert.equal(run('candidate[4]'),7);assert.equal(run('original[4]'),0);await el('apply').click();assert.equal(run('candidate[4]'),7);assert.equal(run('candidate[1]'),7);
});
await test('Selection recovery clears stale error and preserves subsequent errors',async()=>{
 el('selStart').value='10';el('selEnd').value='01';await el('selection').click();assert.equal(el('calcError').hidden,false);assert.match(el('calcError').textContent,/Диапазон за границами/);
 el('selStart').value='4';el('selEnd').value='5';await el('selection').click();assert.equal(el('calcError').hidden,true);assert.equal(run('session.buffer[4]'),7);assert.equal(run('original[4]'),0);
 el('selStart').value='10';el('selEnd').value='01';await el('selection').click();assert.equal(el('calcError').hidden,false);
});
await test('Failed Apply cannot expose a partial or stale result',async()=>{
 el('cal-input-0').value='99';await el('cal-input-0').trigger('input');await el('apply').click();assert.equal(run('candidate'),null);assert(el('save').disabled);assert.equal(run('session.buffer[1]'),0);assert.equal(run('session.buffer[4]'),7);assert.equal(run('original[0]'),0);
});
await test('Reset rebuilds preparation from unchanged original',async()=>{
 await el('reset').click();assert.equal(el('cal-input-0').value,'2');assert.equal(run('candidate[0]'),17);assert.equal(run('candidate[4]'),0);assert.equal(run('session.buffer[4]'),0);assert.deepEqual([...run('original')],Array(16).fill(0));
});
await test('Failed OnShow leaves no usable session or partial download',async()=>{
 await openSource('Size(1,1);Form{}OnShow{@0=7;@bufsize=8;}OnApply{}');assert.equal(run('candidate'),null);assert.equal(run('session'),null);assert(el('apply').disabled);assert(el('save').disabled);assert.equal(run('original[0]'),0);
});
await test('Actual binary CAL that prepares bytes is no longer blocked',async()=>{
 const entry=run("entries.find(e=>e.ext==='cal'&&/Boxer/i.test(e.path)&&/var.?2/i.test(e.path))");assert(entry);run('select')(entry);await run('loadBin')(upload(new Uint8Array(65536),'boxer.bin'));assert(run('session'));assert(run('candidate'));assert(run('candidate.some((b,i)=>b!==original[i])'));assert(run('original.every(b=>b===0)'));
});
await test('Catalog Polo receives its bounded scratch profile in the actual app',async()=>{
 const entry=run("entries.find(e=>e.sha==='a0a66442b874d649d9ee00c3bbe5a9a859567cd50ab5a3b7771a6c12bb119956')");assert(entry);run('select')(entry);
 const bytes=new Uint8Array(2048);for(const [a,w] of [[10,0xbf39],[26,0x9f39],[42,0x3f39],[58,0x1f39]]){bytes[a]=w&255;bytes[a+1]=w>>>8;}
 await run('loadBin')(upload(bytes,'polo.bin'));assert.equal(run('program.memory.start'),8192);assert.equal(run('session.scratch.length'),2048);assert.equal(run('candidate.length'),2048);assert.deepEqual(Buffer.from(run('original')),Buffer.from(bytes));
});
await test('Closing clears prepared data and preserves catalog',async()=>{
 const count=run('entries.length');await el('closeBin').click();assert.equal(run('session'),null);assert.equal(run('candidate'),null);assert.equal(run('original'),null);assert.equal(run('entries.length'),count);assert(el('save').disabled);
});
await test('Unavailable persistent storage is reported before any import',async()=>{
 run("catalogStore.load=async()=>{throw Error('storage blocked')};userEntries=[];entries=[...db.entries]");await run('loadUserCatalog()');
 assert.equal(run('storageProblem'),'storage blocked');assert(!el('storageStatus').hidden);assert.match(el('storageStatus').textContent,/Сохранение в браузере недоступно/);assert.match(el('storageStatus').textContent,/storage blocked/);assert(!el('openCal').disabled);
 run("catalogStore.load=async()=>[]");await run('loadUserCatalog()');assert(el('storageStatus').hidden);
});
await test('Unsupported handler reason stays visible after opening a BIN',async()=>{
 run("select(entries.find(e=>e.sha==='dfc2f328da0c07d0141e0f832fedf2c271785c7ec10be40ca595c9fafb7d0df4'))");
 const reason=el('calcError').textContent;assert(!el('calcError').hidden);assert.match(reason,/apply/);
 await run('loadBin')(upload(Buffer.alloc(1024),'unsupported.bin'));assert(!el('calcError').hidden);assert.equal(el('calcError').textContent,reason);assert(el('apply').disabled);
});
console.log(JSON.stringify({passed,failed:0,scope:'Real app event handlers in Node DOM adapter; no browser rendering'}));clearTimeout(watchdog);
})().catch(e=>{console.error(e);process.exit(1);});
