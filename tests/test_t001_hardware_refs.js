'use strict';
// T-001: address exclusion of 18 hardware-wiring references, real catalog + real app code.
// This is a Node DOM-adapter check of the real picture() path, not browser rendering or CSS.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const policy=require('../catalog-scope.js'),engine=require('../engine.js'),images=require('../image-resource-data.js');
const remainder=JSON.parse(fs.readFileSync(path.join(root,'reports/T-010-remainder-2026-11-04.json'),'utf8'));
const records=remainder.references.filter(r=>r.next_step==='excluded_by_hardware_policy_T001');
const rules=policy.registry.resource_rules;
class Element{
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.parentNode=null;this.dataset={};this.style={};this.attrs={};this.events={};this._text='';this.className='';this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.open=false;this.files=[];this.classList={contains:n=>this.className.split(/\s/).includes(n),toggle:(n,on)=>{const s=new Set(this.className.split(/\s/).filter(Boolean));if(on??!s.has(n))s.add(n);else s.delete(n);this.className=[...s].join(' ');},remove:n=>this.classList.toggle(n,false)};}
 set id(x){this._id=x;this.doc.ids[x]=this;}get id(){return this._id;}
 get childNodes(){return this.children;}
 set textContent(t){this.children=[];this._text=String(t);}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
 append(...items){for(let x of items){if(typeof x==='string')x=this.doc.createTextNode(x);x.remove();x.parentNode=this;this.children.push(x);}}
 replaceChildren(...items){for(const x of this.children)x.parentNode=null;this.children=[];this._text='';this.append(...items);}
 remove(){if(this.parentNode){const a=this.parentNode.children;a.splice(a.indexOf(this),1);this.parentNode=null;}}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,v){(this.events[k]??=[]).push(v);}
 focus(){this.doc.activeElement=this;}select(){}
 async trigger(k,extra={}){const e={target:this,preventDefault(){},stopPropagation(){},...extra};if(this['on'+k])await this['on'+k](e);for(const fn of this.events[k]||[])await fn(e);}
 click(){if(this.tagName==='A'){this.doc.downloads.push({name:this.download,blob:this.doc.urls.get(this.href)});return;}if(!this.disabled)return this.trigger('click');}
 querySelectorAll(q){const matches=e=>q.startsWith('.')?e.classList.contains(q.slice(1)):q==='[data-icon]'?!!e.dataset.icon:e.tagName===q.toUpperCase();const out=[];const walk=e=>{for(const c of e.children){if(matches(c))out.push(c);walk(c);}};walk(this);return out;}
}
const doc={events:{},addEventListener(k,fn){(this.events[k]??=[]).push(fn);},ids:{},urls:new Map(),downloads:[],createElement(t){return new Element(t,this);},createElementNS(ns,t){return this.createElement(t);},createTextNode(t){const e=this.createElement('#text');e.textContent=t;return e;},getElementById(id){return this.ids[id]||null;},querySelectorAll(q){return this.body.querySelectorAll(q);}};doc.body=doc.createElement('body');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)){const el=doc.createElement(match[1]);el.id=match[2];el.value=/\bvalue="([^"]*)"/.exec(match[0])?.[1]||'';doc.body.append(el);}
doc.ids.hex.tBodies=[doc.createElement('tbody')];doc.ids.hex.append(doc.ids.hex.tBodies[0]);
let urlId=0;
const context=vm.createContext({document:doc,CAL_IMAGES:require('../image-resources.js'),CatalogOrganization:require('../catalog-organization.js'),CatalogScope:policy,CalEngine:engine,CAL_CATALOG,CatalogStore:{...require('../catalog-store.js'),Store:class{async load(){return [];}async save(e){this.saved=e;}}},console,Uint8Array,Blob,TextDecoder,crypto:crypto.webcrypto,atob,btoa,URL:{createObjectURL(blob){const u='blob:test-'+(++urlId);doc.urls.set(u,blob);return u;},revokeObjectURL(){}},setTimeout(){},Date});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context);
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
assert.equal(records.length,18);
assert.equal(rules.length,9);
const triples=new Set(records.map(r=>`${r.cal_sha}:${r.control}:${r.candidates[0].sha256}`));

test('Every one of the 18 records has an address rule and no other rule exists',()=>{
 assert.equal(triples.size,9);
 assert.equal(new Set(rules.map(r=>`${r.cal_sha}:${r.control_id}:${r.resource_sha}`)).size,9);
 for(const t of triples)assert([...rules].some(r=>`${r.cal_sha}:${r.control_id}:${r.resource_sha}`===t),t);
});
test('Rules keep originals, provenance and the shared resource decision',()=>{
 for(const rule of rules){
  assert.equal(rule.action,'exclude');assert.equal(rule.mapping_verified,true);
  assert(rule.evidence.report.endsWith('reports/T-001-hardware-wiring-2026-11-04.md'));
  assert.equal(rule.catalog_paths.length,2);
  const d=policy.registry.decisions[rule.resource_sha];
  assert.equal(d.action,'keep');assert.equal(d.category,'hardware_only');assert.equal(d.kind,'resource');
  assert.equal(d.original.sha256_verified,true);assert.equal(d.evidence.mapping_status,'verified');
  assert(d.mapped_controls.some(m=>m.cal_sha===rule.cal_sha&&m.control_id===rule.control_id));
  assert(d.source_paths.some(s=>s.sha256===rule.resource_sha));
  assert.equal(policy.isActive({sha:rule.resource_sha}),true);
 }
 assert(rules.every(r=>policy.resourceExcluded(r.cal_sha,r.control_id,r.resource_sha)));
 assert(!rules.some(r=>policy.resourceExcluded(r.cal_sha,r.control_id+1,r.resource_sha)));
});
test('Each record matches the CAL version, its form element and its reference text',()=>{
 for(const record of records){
  const entry=CAL_CATALOG.entries.find(e=>e.sha===record.cal_sha&&e.path===record.cal);
  assert(entry,'missing CAL: '+record.cal);
  assert(policy.isActive(entry));
  const parsed=engine.parse(Buffer.from(CAL_CATALOG.blobs[record.cal_sha],'base64'));
  const control=parsed.form.controls.find(c=>c.id===record.control);
  assert(control,'missing control '+record.control+' in '+record.cal);
  assert.equal(control.type,'P');
  assert.equal(control.text.trim().toLowerCase(),record.reference.trim().toLowerCase());
  assert.equal(policy.resourceRule(record.cal_sha,record.control).resource_sha,record.candidates[0].sha256);
  assert.equal(policy.resourceRule(record.cal_sha,record.control).reference,record.reference);
 }
});
run('catalogReady');
test('Real app picture() hides exactly the wiring element and shows the sibling board picture',()=>{
 let hidden=0,shown=0;
 for(const rule of rules){
  const entry=CAL_CATALOG.entries.find(e=>e.sha===rule.cal_sha&&e.path===rule.catalog_paths[0]);
  run('select')(entry);
  const parsed=engine.parse(Buffer.from(CAL_CATALOG.blobs[rule.cal_sha],'base64'));
  const controls=parsed.form.controls.filter(c=>c.type==='P');
  const wiring=controls.find(c=>c.id===rule.control_id);
  assert.equal(run('picture')(wiring),null,rule.reference+' must not be displayed');
  hidden++;
  const bmp=controls.filter(c=>c.id!==rule.control_id);
  assert(bmp.length>=1,'expected a sibling board picture in '+rule.catalog_paths[0]);
  for(const other of bmp){const el=run('picture')(other);assert(el&&el.tagName==='IMG',other.text+' must stay visible');shown++;}
 }
 assert.equal(hidden,9);assert(shown>=9);
});
test('The guard suppresses the element even if matching bytes appear; other forms keep the resource',()=>{
 const wiringRule=rules.find(r=>r.reference==='ht4l40k.png');
 const fake='f'.repeat(64);
 CAL_CATALOG.blobs[fake]='AA==';
 run(`entries.push({sha:${JSON.stringify(fake)},path:'Calculators/Pictures/ht4l40k.png',ext:'png',size:1})`);
 const entry=CAL_CATALOG.entries.find(e=>e.sha===wiringRule.cal_sha&&e.path===wiringRule.catalog_paths[0]);
 run('select')(entry);
 const parsed=engine.parse(Buffer.from(CAL_CATALOG.blobs[wiringRule.cal_sha],'base64'));
 const wiring=parsed.form.controls.find(c=>c.id===wiringRule.control_id);
 assert.equal(run('picture')(wiring),null,'policy must suppress the element before byte resolution');
 const unrelated=CAL_CATALOG.entries.find(e=>e.ext==='cal'&&!policy.resourceRule(e.sha,999));
 run('select')(unrelated);
 const otherForm=run('picture')({id:999,text:'ht4l40k.png',type:'P'});
 assert(otherForm&&otherForm.tagName==='IMG','the same file stays available to unrelated forms');
 assert.equal(images.mappings[wiringRule.cal_sha+':'+wiringRule.control_id],undefined,'the wiring picture is not a restored illustration');
});
test('Wiring image bytes are absent from the working catalog and CAL versions stay active',()=>{
 for(const rule of rules){
  assert(!CAL_CATALOG.entries.some(e=>e.sha===rule.resource_sha),'unexpected catalog image '+rule.resource_sha);
  assert.equal(CAL_CATALOG.entries.filter(e=>e.sha===rule.cal_sha&&e.ext==='cal').length,2);
  assert(policy.isActive({sha:rule.cal_sha}));
 }
 assert.match(fs.readFileSync(path.join(root,'app.js'),'utf8'),/function picture\(o\)\{if\(scope\.resourceRule\(selected\.sha,o\.id\)\)return null;/);
});
console.log(JSON.stringify({passed,failed:0,records:records.length,rules:rules.length}));
