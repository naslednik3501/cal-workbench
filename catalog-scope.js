/* Conservative SHA-based scope policy. Unknown bytes stay active. */
(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const registry=node?require('./scope-registry.json'):root.CAL_SCOPE_REGISTRY;
const sha=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
function validate(r){
 if(r?.schema!==1||r.default_action!=='keep'||!r.decisions||Array.isArray(r.decisions)||typeof r.decisions!=='object'||!Array.isArray(r.resource_rules)||!r.source_repository||!/^[0-9a-f]{40}$/.test(r.source_ref))throw Error('Invalid scope registry');
 for(const [hash,d] of Object.entries(r.decisions)){
  if(!sha(hash)||!['dump_calculation','hardware_only','mixed','auxiliary','unknown'].includes(d.category)||!['calculator','standalone_program','resource'].includes(d.kind)||!['keep','exclude'].includes(d.action)||!d.reason||!d.date||!d.evidence?.report)throw Error('Invalid scope decision: '+hash);
  if(d.action==='exclude'&&(d.category!=='hardware_only'||d.kind!=='standalone_program'||d.original?.sha256_verified!==true||d.original.object_path!==`objects/${hash.slice(0,2)}/${hash}.json`))throw Error('Unverified or shared-resource exclusion: '+hash);
 }
 for(const rule of r.resource_rules){
  if(!sha(rule.cal_sha)||!sha(rule.resource_sha)||!Number.isInteger(rule.control_id)||rule.control_id<0||rule.action!=='exclude'||rule.mapping_verified!==true||!rule.evidence?.report)throw Error('Unverified resource relationship');
  const d=registryDecision(rule.resource_sha);if(d?.category!=='hardware_only'||d.kind!=='resource'||d.original?.sha256_verified!==true||d.original.object_path!==`objects/${rule.resource_sha.slice(0,2)}/${rule.resource_sha}.json`)throw Error('Unverified resource original');
 }
 function registryDecision(hash){return r.decisions[hash];}
 return r;
}
validate(registry);
function isActive(entry,r=registry){return r.decisions[entry.sha]?.action!=='exclude';}
function resourceExcluded(calSha,controlId,resourceSha,r=registry){return r.resource_rules.some(x=>x.cal_sha===calSha&&x.control_id===controlId&&x.resource_sha===resourceSha);}
function sameCalculator(a,b){return !!a&&!!b&&(a===b||(a.ext==='cal'&&b.ext==='cal'&&sha(a.sha)&&a.sha===b.sha));}
// A display index only: original entries and their relative resource paths are retained.
function calculatorGroups(entries,r=registry){
 const groups=[],bySha=new Map();
 const path=e=>e.path.replaceAll('\\','/').replace(/^Calculators\//i,'');
 const rank=e=>[e.user?1:0,/^Car\//i.test(path(e))?2:path(e).includes('/')?0:1,path(e),e.source||''];
 function preferred(a,b){const x=rank(a),y=rank(b);for(let n=0;n<x.length;n++){if(x[n]<y[n])return true;if(x[n]>y[n])return false;}return false;}
 entries.forEach((e,i)=>{
  if(e.ext!=='cal'||!isActive(e,r))return;
  let group=sha(e.sha)?bySha.get(e.sha):null;
  if(!group){group={e,i,aliases:[]};groups.push(group);if(sha(e.sha))bySha.set(e.sha,group);}
  group.aliases.push(e);if(preferred(e,group.e)){group.e=e;group.i=i;}
 });
 const byPath=new Map();for(const group of groups){const key=path(group.e).toLowerCase();if(!byPath.has(key))byPath.set(key,[]);byPath.get(key).push(group);}
 for(const versions of byPath.values())if(versions.length>1){versions.sort((a,b)=>(a.e.sha||'').localeCompare(b.e.sha||''));versions.forEach((g,i)=>{g.version=i+1;g.versionCount=versions.length;});}
 return groups;
}
function activeCatalog(db,r=registry){
 validate(r);const entries=db.entries.filter(e=>isActive(e,r)),used=new Set(entries.map(e=>e.sha)),blobs=Object.fromEntries(Object.entries(db.blobs).filter(([hash])=>used.has(hash)));
 const counts={};for(const e of entries)counts[e.ext]=(counts[e.ext]||0)+1;
 return {...db,entries,blobs,meta:{...db.meta,entries:entries.length,calculators:counts.cal||0,uniqueCal:new Set(entries.filter(e=>e.ext==='cal').map(e=>e.sha)).size,counts}};
}
const api={registry,validate,isActive,resourceExcluded,sameCalculator,calculatorGroups,activeCatalog};root.CatalogScope=api;
if(node)module.exports=api;else{if(!root.CAL_CATALOG)throw Error('Catalog must load before scope policy');root.CAL_CATALOG=activeCatalog(root.CAL_CATALOG);}
})(globalThis);
