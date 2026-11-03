'use strict';
// Read-only P-control inventory. Mirrors picture() path matching in app.js.
// Usage: node tools/audit-image-references.js OUTPUT.json
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const E=require(path.join(root,'engine.js'));require(path.join(root,'catalog.js'));
for(const p of JSON.parse(fs.readFileSync(path.join(root,'catalog-parts.json'))))require(path.join(root,p));
const policy=require('../catalog-scope.js'),db=policy.activeCatalog(globalThis.CAL_CATALOG),images=db.entries.filter(e=>['bmp','jpg','jpeg','png'].includes(e.ext));
function norm(p){const a=[];for(const x of p.replaceAll('\\','/').split('/')){if(x==='..')a.pop();else if(x&&x!=='.')a.push(x);}return a.join('/');}
const cache=new Map(),refs=[],errors=[],excludedResources=[];let parsed=0;
for(const e of db.entries.filter(e=>e.ext==='cal')){
 if(!cache.has(e.sha)){try{cache.set(e.sha,{p:E.parse(Buffer.from(db.blobs[e.sha],'base64'))});}catch(err){cache.set(e.sha,{error:err.message});}}
 const {p,error}=cache.get(e.sha);if(error){errors.push({cal:e.path,sha:e.sha,error});continue;}parsed++;
 for(const c of p.form.controls.filter(c=>c.type==='P')){
  const targets=[norm(e.path.split('/').slice(0,-1).join('/')+'/'+c.text),norm('Calculators/Pictures/'+c.text)];
  const found=images.find(i=>targets.map(t=>t.toLowerCase()).includes(i.path.toLowerCase()));
  if(found&&policy.resourceExcluded(e.sha,c.id,found.sha)){excludedResources.push({cal:e.path,cal_sha:e.sha,control:c.id,resource_sha:found.sha});continue;}
  refs.push({cal:e.path,cal_sha:e.sha,control:c.id,reference:c.text,width:c.width,height:c.height,
   group:c.parent===null?null:p.form.groups[c.parent]?.text,context:p.form.controls.filter(x=>x.type==='L').map(x=>x.text),
   targets,resolved:found?{path:found.path,sha:found.sha}:null,executable:p.executable});
 }
}
const missing=refs.filter(r=>!r.resolved),summary={catalog_entries:db.entries.length,cal_entries:db.entries.filter(e=>e.ext==='cal').length,
 parsed_cal_entries:parsed,parse_failures:errors.length,image_entries:images.length,references:refs.length,
 excluded_resource_references:excludedResources.length,resolved:refs.length-missing.length,unresolved:missing.length,unresolved_cal_paths:new Set(missing.map(r=>r.cal)).size,
 unresolved_cal_contents:new Set(missing.map(r=>r.cal_sha)).size,unresolved_reference_strings:new Set(missing.map(r=>r.reference)).size};
fs.writeFileSync(process.argv[2],JSON.stringify({summary,images,refs,errors,excludedResources},null,2));console.log(JSON.stringify(summary,null,2));
