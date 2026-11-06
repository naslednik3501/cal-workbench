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
let urlId=0;const context=vm.createContext({document:doc,CAL_IMAGES:require('../image-resources.js'),CatalogOrganization:require('../catalog-organization.js'),CatalogScope:require('../catalog-scope.js'),CalEngine:require('../engine.js'),CAL_CATALOG,CatalogStore:{...require('../catalog-store.js'),Store:class{async load(){return [];}async save(e){this.saved=e;}}},console,Uint8Array,Blob,TextDecoder,crypto:crypto.webcrypto,atob,btoa,URL:{createObjectURL(blob){let u='blob:test-'+(++urlId);doc.urls.set(u,blob);return u;},revokeObjectURL(){}},setTimeout(){},Date,confirm(){return true;}});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),el=id=>doc.ids[id];let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function upload(bytes,name){return {name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};}
const R=require('./test_t013_readers.js');
(async()=>{await run('catalogReady');
for(const t of R.readers)for(const flag of [0,1])await test(t.sha.slice(0,8)+' branch='+flag+' real reader/download protection',async()=>{
 await el('closeBin').click();run('select(entries.find(e=>e.sha==='+JSON.stringify(t.sha)+'))');
 const input=R.fixture(t,'ascii',flag),want=R.expected(t,input);await run('loadBin')(upload(input,'reader.bin'));
 assert.equal(el('compatBadge').textContent,'Чтение поддерживается',el('compat').textContent);assert(run('session'));assert.equal(run('session.controls[0].value'),want.pin);
 for(const [id,value]of Object.entries(want.text))assert.equal(run('session.controls['+id+'].text'),value);
 assert(el('apply').disabled);assert(el('cal-input-0').disabled);assert(el('save').disabled);assert.equal(run('candidate'),null);
 await el('saveOriginal').click();const d=doc.downloads.at(-1);assert.equal(d.name,'reader.bin');assert.equal(d.blob.size,input.length);assert.deepEqual(Buffer.from(await d.blob.arrayBuffer()),Buffer.from(input));
 const before=doc.downloads.length;await el('save').trigger('click');assert.equal(doc.downloads.length,before);
 // Actual manual edit then a forced disabled Apply: stale result must vanish.
 el('editAddress').value='00';el('editByte').value='AB';await el('edit').click();assert(!el('save').disabled);
 for(let i=0;i<2;i++){await el('apply').trigger('click');assert.equal(run('candidate'),null);assert(el('save').disabled);assert.deepEqual(Buffer.from(run('original')),Buffer.from(input));}
 await el('reset').click();assert.equal(run('candidate'),null);assert.equal(run('session.controls[0].value'),want.pin);
 await run('loadBin')(upload(new Uint8Array(1),'short.bin'));assert.equal(run('session'),null);assert(el('save').disabled);assert(el('apply').disabled);
});
await test('invert invalid initialization cannot expose its isolated writer',async()=>{
 await el('closeBin').click();const t=R.targets.find(t=>t.sha.startsWith('7498'));run('select(entries.find(e=>e.sha==='+JSON.stringify(t.sha)+'))');
 const input=new Uint8Array(131072);await run('loadBin')(upload(input,'invert.bin'));assert(!run('program.executable'));assert.equal(run('session'),null);assert(el('apply').disabled);assert(el('save').disabled);assert.match(el('compat').textContent,/адрес события show/);
 await el('apply').trigger('click');assert.equal(run('candidate'),null);assert.deepEqual(Buffer.from(run('original')),Buffer.from(input));
});
console.log(JSON.stringify({passed,scope:'Real app.js in Node DOM adapter; 15 reader-only originals and one invalid initialization; no browser rendering/hardware claim'}));
})().catch(e=>{console.error(e);process.exit(1)});
