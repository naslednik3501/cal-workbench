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
function activeCatalog(db,r=registry){
 validate(r);const entries=db.entries.filter(e=>isActive(e,r)),used=new Set(entries.map(e=>e.sha)),blobs=Object.fromEntries(Object.entries(db.blobs).filter(([hash])=>used.has(hash)));
 const counts={};for(const e of entries)counts[e.ext]=(counts[e.ext]||0)+1;
 return {...db,entries,blobs,meta:{...db.meta,entries:entries.length,calculators:counts.cal||0,uniqueCal:new Set(entries.filter(e=>e.ext==='cal').map(e=>e.sha)).size,counts}};
}
const api={registry,validate,isActive,resourceExcluded,activeCatalog};root.CatalogScope=api;
if(node)module.exports=api;else{if(!root.CAL_CATALOG)throw Error('Catalog must load before scope policy');root.CAL_CATALOG=activeCatalog(root.CAL_CATALOG);}
})(globalThis);
