// Static catalog coverage, not proof of successful calculation on a real BIN.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..');
const E=require(path.join(root,'engine.js'));require(path.join(root,'catalog.js'));
for(const f of require(path.join(root,'catalog-parts.json')))require(path.join(root,f));
if(!process.argv[2])throw Error('Usage: node tools/audit-calculators.js OUTPUT.json');
const policy=require('../catalog-scope.js'),catalog=policy.activeCatalog(CAL_CATALOG);
const cache=new Map(),details=[];
for(const e of catalog.entries.filter(e=>e.ext==='cal')){
 let r=cache.get(e.sha);
 if(!r){try{const p=E.parse(Buffer.from(CAL_CATALOG.blobs[e.sha],'base64'),{sha:e.sha});r={format:p.format||'binary',status:p.executable?'supported':'unsupported',warnings:p.unsupported};}catch(err){r={status:'rejected',error:err.message};}cache.set(e.sha,r);}
 details.push({path:e.path,sha:e.sha,...r});
}
const counts=a=>a.reduce((s,e)=>{const k=e.status==='supported'?e.format:e.status;s[k]=(s[k]||0)+1;return s;},{});
const report={scopePolicy:{registry:'scope-registry.json',archivedEntries:CAL_CATALOG.entries.length,activeEntries:catalog.entries.length,excludedEntries:CAL_CATALOG.entries.length-catalog.entries.length},scope:'Static parsing and supported command vocabulary only; not execution/hardware validation',
 engineSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'engine.js'))).digest('hex'),
 sourceEngineSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'cal-source.js'))).digest('hex'),
 entries:counts(details),unique:counts([...cache.values()]),unavailable:details.filter(e=>e.status!=='supported')};
fs.mkdirSync(path.dirname(path.resolve(process.argv[2])),{recursive:true});fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({entries:report.entries,unique:report.unique}));
