'use strict';
// T-001: exact-CAL, exact-form-element hiding of hardware instructions and pinout images.
// This uses the real catalog, real parser and real app renderForm()/picture() in a Node DOM adapter.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const policy=require('../catalog-scope.js'),engine=require('../engine.js'),org=require('../catalog-organization.js');
const rules=policy.registry.element_rules;
class Element{
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.parentNode=null;this.dataset={};this.style={};this.attrs={};this.events={};this._text='';this.className='';this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.open=false;this.files=[];this.classList={contains:n=>this.className.split(/\s+/).includes(n),toggle:(n,on)=>{const s=new Set(this.className.split(/\s+/).filter(Boolean));if(on??!s.has(n))s.add(n);else s.delete(n);this.className=[...s].join(' ');},remove:n=>this.classList.toggle(n,false)};}
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
const bySha=new Map();for(const e of CAL_CATALOG.entries)if(e.ext==='cal'){if(!bySha.has(e.sha))bySha.set(e.sha,[]);bySha.get(e.sha).push(e);}
const parsed=new Map();function parse(sha){if(!parsed.has(sha))parsed.set(sha,engine.parse(Buffer.from(CAL_CATALOG.blobs[sha],'base64'),{sha}));return parsed.get(sha);}
function rendered(entry){run('select')(entry);return doc.ids.formArea;}
function pageText(area){return area.textContent+doc.ids.calcDescription.textContent;}


test('Every form rule points to one exact element of an active CAL version',()=>{
 assert.equal(rules.length,145);assert.equal(new Set(rules.map(r=>r.cal_sha)).size,134);
 for(const rule of rules){
  assert.equal(rule.action,'exclude');assert.equal(rule.mapping_verified,true);
  const aliases=bySha.get(rule.cal_sha);assert(aliases&&aliases.length>=1,'missing CAL '+rule.cal_sha);
  assert(aliases.every(e=>policy.isActive(e)));assert(rule.catalog_paths.length===aliases.length);
  const p=parse(rule.cal_sha);
  if(rule.element_type==='G'){
   const group=p.form.groups.find(g=>g.group===rule.element_id);assert(group,'missing group '+rule.element_id);
   assert.equal(group.text.trim(),rule.reference);
   const actual=p.form.controls.filter(c=>c.parent===rule.element_id&&String(c.text).trim()&&!/^[_\s!.,;:—-]*$/.test(String(c.text).trim())).map(c=>`${c.id}:${c.type}:${String(c.text).trim()}`);
   const evidence=rule.evidence.children.map(c=>`${c.id}:${c.type}:${c.text.trim()}`);assert.deepEqual(actual,evidence);
   assert(!p.form.controls.some(c=>c.parent===rule.element_id&&['D','H','C','B'].includes(c.type)),'hidden group must not contain input');
  }else{
   const control=p.form.controls.find(c=>c.id===rule.element_id);assert(control,'missing control '+rule.element_id);
   assert.equal(control.type,rule.element_type);assert.equal(String(control.text).trim(),rule.reference);
   if(rule.element_type==='P')assert(rule.evidence.candidate_images.length>0);
  }
 }
});


test('Representative rendered forms hide only hardware prompts and keep calculation/input/identification',()=>{
 const cases=[
  {sha:'5e0e221a61340c43580aa767fa403055ccb842ea4e5bcc6fc1286dc197f1e2c6',hidden:['EEPROM и Точки подключения','Под задней крышкой'],visible:['Калькулятор пробега для Subaru WRX','Введите нужное значение'],input:3},
  {sha:'25629fba95d0b8f736c4a3492785d1ab25eaa7b5771ccba8a8b2591e717dfcbd',hidden:['Считать FLASH','Считать EEPROM','Считать FUSE','Обнулить процессор','Залить сохраненный FLASH','Залить EEPROM'],visible:['Скалькулировать пробег','Кальк пробега'],input:0},
  {sha:'b9e4a5247d78eaba1a0a981868831aba449172aebe74ee9ba1c26d15d654037b',hidden:['Take 5V from pin8'],visible:['Disable CanCheck','Code calculator'],input:null},
  {sha:'d0fa815edf48211548d326c3deff3a7c5388372e1be296ec4e309748b2b56353',hidden:['Полный разбор шитка','EEPROM находится','со стороны разъемов'],visible:['Кальк пробега'],input:0}
 ];
 for(const c of cases){
  const entry=bySha.get(c.sha)[0],area=rendered(entry),text=pageText(area);
  for(const s of c.hidden)assert(!text.includes(s),'must hide '+s+' in '+entry.path);
  for(const s of c.visible)assert(text.includes(s),'must keep '+s+' in '+entry.path);
  if(c.input!==null)assert(doc.ids['cal-input-'+c.input],'calculation input must remain in '+entry.path);
 }
});

test('The exact Land Rover P element is hidden even if both image names are present; sibling stays visible',()=>{
 const sha='d838b610f47862612a3365d76a3416a7831f4e3a4de3f4b1950710d6998b7623';
 const a='e'.repeat(64),b='d'.repeat(64);CAL_CATALOG.blobs[a]='AA==';CAL_CATALOG.blobs[b]='AA==';
 run(`entries.push({sha:${JSON.stringify(a)},path:'Calculators/Pictures/24c16.png',ext:'png',size:1})`);
 run(`entries.push({sha:${JSON.stringify(b)},path:'Calculators/Pictures/24c161.png',ext:'png',size:1})`);
 const entry=bySha.get(sha)[0],area=rendered(entry),p=parse(sha);
 const pin=area.querySelectorAll('img');
 assert(!pin.some(el=>el.alt==='24c16.png'),'pinout must be hidden');
 assert(pin.some(el=>el.alt==='24c161.png'),'adjacent image must remain');
 assert.equal(run('picture')(p.form.controls.find(c=>c.id===3)),null,'picture() must guard the exact element');
 assert(doc.ids['cal-input-0'],'calculation input must remain');
});


test('Hidden prompts are removed across every rule; all affected CALs stay searchable and export unchanged',()=>{
 for(const rule of rules){
  const entry=bySha.get(rule.cal_sha)[0],area=rendered(entry),text=area.textContent;
  const hidden=rule.element_type==='G'?rule.evidence.children.map(c=>c.text):[rule.reference];
  for(const s of hidden)assert(!text.includes(s),'still visible in '+entry.path+': '+s);
 }
 for(const rule of rules){const entry=bySha.get(rule.cal_sha)[0];assert(org.matches(entry,entry.path.split('/').at(-1).replace(/\.cal$/i,'')),'search must retain '+entry.path);}
 const entry=bySha.get('5e0e221a61340c43580aa767fa403055ccb842ea4e5bcc6fc1286dc197f1e2c6')[0];
 rendered(entry);doc.downloads.length=0;doc.ids.exportCal.click();
 assert.equal(doc.downloads.length,1);assert.equal(doc.downloads[0].name,entry.path.split('/').at(-1));
 assert.equal(doc.downloads[0].blob.size,entry.size);
 assert.equal(policy.registry.element_rules.length,145);
});
console.log(JSON.stringify({passed,failed:0,rules:rules.length,cal:new Set(rules.map(r=>r.cal_sha)).size}));

