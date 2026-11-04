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
let urlId=0;const context=vm.createContext({document:doc,CatalogOrganization:require('../catalog-organization.js'),CatalogScope:require('../catalog-scope.js'),CalEngine:require('../engine.js'),CAL_CATALOG,CatalogStore:{...require('../catalog-store.js'),Store:class{async load(){return [];}async save(e){this.saved=e;}}},console,Uint8Array,Blob,TextDecoder,crypto:crypto.webcrypto,atob,btoa,URL:{createObjectURL(blob){let u='blob:test-'+(++urlId);doc.urls.set(u,blob);return u;},revokeObjectURL(){}},setTimeout(){},Date});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),el=id=>doc.ids[id];let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function upload(bytes,name){return {name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};}
const {shas,fixture}=require('./test_t012_writers.js');
(async()=>{
await run('catalogReady');
for(const sha of shas){
 await test(sha.slice(0,8)+' reader, original download, blocked writer and stale result',async()=>{
  // First make a result using a tiny synthetic CAL; switching to a blocked writer
  // must remove it. This is not a claim about recovering any of the originals.
  const seed='Size(100,100);Form{}OnApply{@0=99;}';
  run('select({path:"test.cal",ext:"cal",sha:"synthetic",raw:Uint8Array.from('+JSON.stringify(Array.from(Buffer.from(seed)))+')})');
  await run('loadBin')(upload(new Uint8Array(512),'prior.bin'));await el('apply').click();assert(!el('save').disabled);
  run('select(entries.find(e=>e.sha==='+JSON.stringify(sha)+'))');
  assert.equal(run('candidate'),null);assert(el('save').disabled);
  const input=fixture(sha);el('openBin').files=[upload(input,'blocked.bin')];await el('openBin').trigger('change');
  assert.equal(el('compatBadge').textContent,'Запись заблокирована');
  assert.match(el('compat').textContent,sha===shas[0]?/0x32–0x3F/:/Var6 >> 16 \+ Var6/);
  assert(!el('compat').textContent.includes('пока не распознан'));
  assert.equal(el('cal-input-0').value,sha===shas[0]?'4660':'100000');assert(el('cal-input-0').disabled);
  assert(el('apply').disabled);assert(el('save').disabled);assert.equal(run('candidate'),null);
  const count=doc.downloads.length;await el('save').trigger('click');assert.equal(doc.downloads.length,count);
  await el('saveOriginal').click();const source=doc.downloads.at(-1);assert.equal(source.name,'blocked.bin');assert.equal(source.blob.size,input.length);
  assert.deepEqual(Buffer.from(await source.blob.arrayBuffer()),Buffer.from(input));
  for(let repeat=0;repeat<2;repeat++){await el('apply').trigger('click');assert.equal(run('candidate'),null);assert(el('save').disabled);assert.deepEqual(Buffer.from(run('original')),Buffer.from(input));}
  await el('reset').click();assert.equal(run('candidate'),null);assert(el('save').disabled);assert.equal(el('cal-input-0').value,sha===shas[0]?'4660':'100000');
  // Replacing the file cannot revive the previous result or enable the writer.
  await run('loadBin')(upload(new Uint8Array(input.length),'invalid.bin'));assert(el('apply').disabled);assert(el('save').disabled);assert.equal(run('candidate'),null);
 });
}
console.log(JSON.stringify({passed,restored:0,blocked:3,scope:'Actual app.js event handlers in Node DOM adapter; only source download is available for these blocked CALs; no browser rendering or hardware test'}));
})().catch(e=>{console.error(e);process.exit(1)});
