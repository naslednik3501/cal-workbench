const fs=require('fs'),path=require('path'),E=require('../engine.js');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const db=global.CAL_CATALOG,seen=new Map(),counts={},rows=[];
for(const e of db.entries){if(e.ext!=='cal')continue;let result=seen.get(e.sha);if(!result){try{const p=E.parse(new Uint8Array(Buffer.from(db.blobs[e.sha],'base64')));result={status:p.executable?'parsed_experimental':'unsupported_commands',reason:p.unsupported.join('; '),instructions:Object.keys(p.code).length};}catch(err){result={status:'unsupported_format_or_parse_error',reason:err.message};}seen.set(e.sha,result);}
 rows.push({path:e.path,sha256:e.sha,...result});counts[result.status]=(counts[result.status]||0)+1;
}
const out={catalog:db.meta,counts,unique:seen.size,note:'Static parsing only; not runtime or vehicle compatibility validation.'};fs.writeFileSync(path.join(__dirname,'../static-audit-summary.json'),JSON.stringify(out,null,2));fs.writeFileSync(path.join(__dirname,'../static-audit.json'),JSON.stringify(rows));console.log(out);
