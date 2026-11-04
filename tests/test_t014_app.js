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
let urlId=0;const context=vm.createContext({document:doc,CatalogScope:require('../catalog-scope.js'),CalEngine:require('../engine.js'),CAL_CATALOG,CatalogStore:{...require('../catalog-store.js'),Store:class{async load(){return [];}async save(e){this.saved=e;}}},console,Uint8Array,Blob,TextDecoder,crypto:crypto.webcrypto,atob,btoa,URL:{createObjectURL(blob){let u='blob:test-'+(++urlId);doc.urls.set(u,blob);return u;},revokeObjectURL(){}},setTimeout(){},Date});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),el=id=>doc.ids[id];let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function upload(bytes,name){return {name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};}
const {variants,fixture,reference}=require('./test_t014_skoda.js');
(async()=>{
await run('catalogReady');
for(const variant of variants)for(const mode of [0,1]){
 await test(variant.model+' '+variant.sha.slice(0,8)+' '+(mode?'encode':'decode')+' upload/apply/download/reset',async()=>{
  await el('closeBin').click();
  run('select(entries.find(e=>e.sha==='+JSON.stringify(variant.sha)+'))');
  const input=fixture(variant.model,mode,7),want=reference(variant.model,input,mode);
  el('openBin').files=[upload(input,'skoda.bin')];await el('openBin').trigger('change');
  assert(!el('apply').disabled);assert.equal(run('original.length'),2048);
  const id=run("program.form.controls.findIndex(c=>c.type==='C')");
  el('cal-input-'+id).value=String(mode);await el('cal-input-'+id).trigger('change');
  await el('apply').click();assert(!el('save').disabled);
  assert.deepEqual(Buffer.from(run('candidate')),Buffer.from(want));
  assert.deepEqual(Buffer.from(run('original')),Buffer.from(input));
  await el('save').click();await el('saveOriginal').click();
  const result=doc.downloads.at(-2),source=doc.downloads.at(-1);
  assert.equal(result.name,'skoda_result.bin');assert.equal(result.blob.size,2048);
  assert.deepEqual(Buffer.from(await result.blob.arrayBuffer()),Buffer.from(want));
  assert.equal(source.name,'skoda.bin');assert.equal(source.blob.size,2048);
  assert.deepEqual(Buffer.from(await source.blob.arrayBuffer()),Buffer.from(input));
  await el('apply').click();assert.deepEqual(Buffer.from(run('candidate')),Buffer.from(want));
  await el('reset').click();assert.equal(run('candidate'),null);assert(el('save').disabled);
  assert.deepEqual(Buffer.from(run('original')),Buffer.from(input));
 });
}
console.log(JSON.stringify({passed,scope:'Real app.js handlers in Node DOM adapter; synthetic BIN; no browser rendering or vehicle test'}));
})().catch(e=>{console.error(e);process.exit(1)});
