// Group active and unresolved contents by SHA; preserve every catalog path instance.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),policy=require('../catalog-scope.js');
require('../catalog.js');for(const part of require('../catalog-parts.json'))require('../'+part);
const groups=new Map();
for(const e of CAL_CATALOG.entries){if(!groups.has(e.sha))groups.set(e.sha,{sha:e.sha,bytes:e.size,paths:[]});groups.get(e.sha).paths.push({path:e.path,source:e.source,ext:e.ext});}
const rows=[...groups.values()].map(g=>({...g,category:policy.registry.decisions[g.sha]?.category||'unknown',action:policy.registry.decisions[g.sha]?.action||'keep',evidence:policy.registry.decisions[g.sha]?.evidence||null}));
const active=rows.filter(r=>r.action==='keep'),unresolved=rows.filter(r=>['unknown','mixed'].includes(r.category));
const report={date:policy.registry.date,scope:'Initial evidence-backed scope review; unknown and mixed files remain active. No correctness claim.',catalog:{entries:CAL_CATALOG.entries.length,uniqueContents:rows.length,activeEntries:active.reduce((n,r)=>n+r.paths.length,0),activeUniqueContents:active.length,excludedEntries:rows.filter(r=>r.action==='exclude').reduce((n,r)=>n+r.paths.length,0)},reviewedInCatalog:rows.filter(r=>r.evidence).length,decisionsOutsideCatalog:Object.keys(policy.registry.decisions).filter(s=>!groups.has(s)),unresolvedContents:unresolved.length,unresolved};
const output=process.argv[2];if(!output)throw Error('Usage: node tools/audit-scope.js OUTPUT.json');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,unresolved:undefined}));
