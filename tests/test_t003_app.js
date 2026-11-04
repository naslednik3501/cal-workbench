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
let urlId=0;const context=vm.createContext({document:doc,CAL_IMAGES:require('../image-resources.js'),CatalogOrganization:require('../catalog-organization.js'),CatalogScope:require('../catalog-scope.js'),CalEngine:require('../engine.js'),CAL_CATALOG,CatalogStore:{...require('../catalog-store.js'),Store:class{async load(){return [];}async save(e){this.saved=e;}}},console,Uint8Array,Blob,TextDecoder,crypto:crypto.webcrypto,atob,btoa,URL:{createObjectURL(blob){let u='blob:test-'+(++urlId);doc.urls.set(u,blob);return u;},revokeObjectURL(){}},setTimeout(){},Date});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),el=id=>doc.ids[id];let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function upload(bytes,name){return {name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};}
const F=require('./test_t003_fis.js');
const oldPerformance=globalThis.performance;let seed=0;
Object.defineProperty(globalThis,'performance',{value:{now:()=>seed},configurable:true});
(async()=>{await run('catalogReady');
for(const t of F.proof.targets)for(const mode of [0,1])for(const index of [0,27])await test(t.sha.slice(0,8)+' mode='+mode+' index='+index+' real Apply/download',async()=>{
 await el('closeBin').click();run('select(entries.find(e=>e.sha==='+JSON.stringify(t.sha)+'))');seed=F.reference.seedByIndex[index];
 const input=F.fixture(mode,1024,1),want=F.expected(input,mode,index);await run('loadBin')(upload(input,'fis.bin'));
 assert(run('program.executable&&!program.partial'));assert(!el('apply').disabled);assert.match(run('session.controls[0].text'),/Дамп ОК/);
 for(let repeat=0;repeat<2;repeat++){await el('apply').click();assert.equal(el('calcError').hidden,true,el('calcError').textContent);assert.deepEqual(Buffer.from(run('candidate')),Buffer.from(want));assert.deepEqual(Buffer.from(run('original')),Buffer.from(input));assert.deepEqual(Buffer.from(run('session.buffer')),Buffer.from(input));assert.equal(el('save').disabled,false);}
 await el('save').click();let d=doc.downloads.at(-1);assert.equal(d.name,'fis_result.bin');assert.equal(d.blob.size,input.length);assert.deepEqual(Buffer.from(await d.blob.arrayBuffer()),Buffer.from(want));
 await el('saveOriginal').click();d=doc.downloads.at(-1);assert.equal(d.name,'fis.bin');assert.deepEqual(Buffer.from(await d.blob.arrayBuffer()),Buffer.from(input));
 await el('reset').click();assert.equal(run('candidate'),null);assert(el('save').disabled);assert.deepEqual(Buffer.from(run('original')),Buffer.from(input));
 // Clock input changes the confirmed random operation; it is not an input to CAL algorithms.
 const other=(index+1)%28;seed=F.reference.seedByIndex[other];await el('apply').click();assert.deepEqual(Buffer.from(run('candidate')),Buffer.from(F.expected(input,mode,other)));assert.deepEqual(Buffer.from(run('original')),Buffer.from(input));
 // Reload the actual downloaded result and exercise OnShow.
 await run('loadBin')(upload(want,'readback.bin'));assert.match(run('session.controls[0].text'),/Дамп ОК/);assert.equal(run('candidate'),null);
 // Show succeeds at 103 bytes; writer then fails after partial writes to its transaction.
 await run('loadBin')(upload(F.fixture(1,103),'short-writer.bin'));seed=F.reference.seedByIndex[0];await el('apply').click();assert.match(el('calcError').textContent,/границы BIN/);assert.equal(run('candidate'),null);assert(el('save').disabled);assert.deepEqual(Buffer.from(run('original')),Buffer.from(F.fixture(1,103)));
 const count=doc.downloads.length;await el('save').trigger('click');assert.equal(doc.downloads.length,count);
 await run('loadBin')(upload(new Uint8Array(96),'short-reader.bin'));assert.equal(run('session'),null);assert(el('apply').disabled);assert(el('save').disabled);
});
console.log(JSON.stringify({passed,scope:'Real app.js in Node DOM adapter, host timer pinned for reproducible 0x4D; no browser/vehicle execution claim'}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>Object.defineProperty(globalThis,'performance',{value:oldPerformance,configurable:true}));
