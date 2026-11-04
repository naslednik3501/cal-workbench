'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('../catalog-scope.js');
const a='a'.repeat(64), b='b'.repeat(64), c='c'.repeat(64);
const registry=()=>({schema:1,default_action:'keep',source_repository:'owner/private',source_ref:'1'.repeat(40),decisions:{},resource_rules:[]});
const decision=(hash,kind='standalone_program')=>({category:'hardware_only',kind,action:kind==='resource'?'keep':'exclude',date:'2026-11-03',reason:'synthetic reviewed evidence',evidence:{report:'synthetic'},original:{sha256_verified:true,object_path:`objects/${hash.slice(0,2)}/${hash}.json`}});
const entry=(sha,path,ext='cal')=>({sha,path,ext,size:1});
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const db={meta:{},entries:[entry(a,'one.cal'),entry(a,'duplicate.cal'),entry(b,'one.cal'),entry(c,'shared.png','png')],blobs:{[a]:'AA==',[b]:'AQ==',[c]:'Ag=='}};
test('Unknown and same-name changed bytes stay active; approved SHA removes all exact copies only',()=>{
 const r=registry();r.decisions[a]=decision(a);const filtered=P.activeCatalog(db,r);
 assert.deepEqual(filtered.entries.map(e=>e.sha),[b,c]);assert.deepEqual(Object.keys(filtered.blobs),[b,c]);
 assert.equal(filtered.meta.calculators,1);assert.equal(filtered.meta.uniqueCal,1);assert.equal(db.entries.length,4);
 assert.equal(P.isActive(entry(b,'one.cal'),r),true);
});
test('Retained duplicates keep every path and count distinct CAL contents',()=>{
 const filtered=P.activeCatalog(db,registry());assert.deepEqual(filtered.entries,db.entries);
 assert.equal(filtered.meta.calculators,3);assert.equal(filtered.meta.uniqueCal,2);
});
test('Mixed/unknown/resources cannot receive global exclusion; missing original evidence rejects',()=>{
 for(const mutate of [d=>d.category='mixed',d=>d.category='unknown',d=>d.kind='resource',d=>d.original.sha256_verified=false,d=>d.original.object_path='wrong']){
  const r=registry();r.decisions[a]=decision(a);mutate(r.decisions[a]);assert.throws(()=>P.validate(r));
 }
});
test('Resource suppression requires verified exact CAL/control/resource relation; resource stays shared',()=>{
 const r=registry();r.decisions[c]=decision(c,'resource');r.resource_rules.push({cal_sha:a,resource_sha:c,control_id:2,action:'exclude',mapping_verified:true,evidence:{report:'synthetic'}});
 P.validate(r);assert(P.resourceExcluded(a,2,c,r));assert(!P.resourceExcluded(b,2,c,r));assert(!P.resourceExcluded(a,3,c,r));assert(!P.resourceExcluded(a,2,b,r));
 assert.equal(P.resourceRule(a,2,r).resource_sha,c);assert.equal(P.resourceRule(a,3,r),null);assert.equal(P.resourceRule(b,2,r),null);
 assert.equal(P.resourceRule(a,2,r).action,'exclude');
 assert.equal(P.activeCatalog(db,r).entries.length,4);
 r.resource_rules[0].mapping_verified=false;assert.throws(()=>P.validate(r));
 r.resource_rules[0].mapping_verified=true;r.decisions[c].original.object_path='wrong';assert.throws(()=>P.validate(r));
});
test('Checked-in registry and generated browser data agree',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../scope-data.js'),'utf8'),context);
 assert.equal(JSON.stringify(context.CAL_SCOPE_REGISTRY),JSON.stringify(P.registry));
});
test('Classic browser scripts apply policy before app; invalid policy fails to load',()=>{
 const r=registry();r.decisions[a]=decision(a);
 const context=vm.createContext({CAL_SCOPE_REGISTRY:r,CAL_CATALOG:structuredClone(db)});
 vm.runInContext(fs.readFileSync(require.resolve('../catalog-scope.js'),'utf8'),context);
 assert.deepEqual(Array.from(context.CAL_CATALOG.entries,e=>e.sha),[b,c]);assert(context.CatalogScope);
 const bad=vm.createContext({CAL_SCOPE_REGISTRY:{},CAL_CATALOG:structuredClone(db)});
 assert.throws(()=>vm.runInContext(fs.readFileSync(require.resolve('../catalog-scope.js'),'utf8'),bad));assert.equal(bad.CatalogScope,undefined);
 // app.js must require a successfully loaded policy rather than silently admitting excluded entries.
 assert.throws(()=>vm.runInContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),vm.createContext({document:{},CalEngine:{},CAL_CATALOG:db})),/CatalogScope/);
});
test('Real registry keeps every file and hides only verified hardware resources per CAL/control',()=>{
 for(const d of Object.values(P.registry.decisions))assert.equal(d.action,'keep');
 assert.equal(P.registry.resource_rules.length,9);
 for(const rule of P.registry.resource_rules){
  assert.equal(rule.action,'exclude');assert.equal(rule.mapping_verified,true);
  assert(rule.evidence.report);assert.equal(rule.catalog_paths.length,2);
  const d=P.registry.decisions[rule.resource_sha];
  assert.equal(d.category,'hardware_only');assert.equal(d.kind,'resource');assert.equal(d.action,'keep');
  assert.equal(d.original.sha256_verified,true);
  assert(P.resourceRule(rule.cal_sha,rule.control_id)===rule);
  assert.equal(P.resourceRule(rule.cal_sha,rule.control_id+1),null);
  assert.equal(P.resourceRule((rule.cal_sha[0]==='0'?'1':'0')+rule.cal_sha.slice(1),rule.control_id),null);
  assert(P.resourceExcluded(rule.cal_sha,rule.control_id,rule.resource_sha));
  assert(!P.resourceExcluded(rule.cal_sha,rule.control_id+1,rule.resource_sha));
 }
});
test('Registry preserves every current path for each reviewed CAL SHA',()=>{
 require('../catalog.js');
 for(const [hash,d] of Object.entries(P.registry.decisions))if(d.catalog_paths){
  const paths=CAL_CATALOG.entries.filter(e=>e.sha===hash).map(e=>e.path);
  assert.deepEqual(d.catalog_paths,paths);assert.equal(paths.length,2);
 }
});
console.log(JSON.stringify({passed:count,failed:0}));
