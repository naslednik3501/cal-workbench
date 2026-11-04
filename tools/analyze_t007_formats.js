/* Bounded T-007 inventory and wrapper probes. No original executable is run. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const auditPath='reports/calculator-coverage-binary-resolution-2026-11-03.json',audit=require('../'+auditPath);
function probe(bytes){try{const p=E.parse(bytes);return {accepted:p.executable,partial:p.partial,errors:p.eventErrors};}catch(e){return {accepted:false,error:e.message};}}
function collect(){const target=new Map();for(const r of audit.unavailable)if(r.error?.startsWith('Исходный текст, внешняя программа или другой формат:')){if(!target.has(r.sha))target.set(r.sha,[]);target.get(r.sha).push(r.path);}assert.equal(target.size,12);
 const rows=[];
 for(const [sha,paths]of target){
  const raw=Buffer.from(CAL_CATALOG.blobs[sha],'base64'),copy=Buffer.from(raw);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),sha);
  const text=new TextDecoder('windows-1251').decode(raw),heading=/^\[([^\r\n]+)\]/.exec(text)?.[1]||null,original=probe(raw);assert.equal(original.accepted,false);
  const row={sha,paths,bytes:raw.length,heading,originalProbe:original};
  if(raw.subarray(0,2).toString()==='MZ'){
   const pe=raw.readUInt32LE(0x3c);assert.equal(raw.toString('latin1',pe,pe+4),'PE\0\0');row.format='Windows PE32 native executable';row.machine=raw.readUInt16LE(pe+4);row.entryRva=raw.readUInt32LE(pe+40);row.sections=[];
   const n=raw.readUInt16LE(pe+6),start=pe+24+raw.readUInt16LE(pe+20);for(let i=0;i<n;i++){const off=start+i*40;row.sections.push({name:raw.subarray(off,off+8).toString().replace(/\0.*$/,''),virtualBytes:raw.readUInt32LE(off+8),rawBytes:raw.readUInt32LE(off+16)});}
  }else{
   const body=text.replace(/^\[[^\r\n]+\]\s*/,'');row.headingOnlyProbe=probe(raw.subarray(raw.length-body.length));
   const launch=/^OnShow\s*\{\s*Execute\("([^"]+)","([^"]+)"\)\s*\}\s*$/.exec(body);
   if(launch){row.format='Text OnShow/Execute launcher';row.execute={path:launch[1],args:launch[2]};row.hasOwnBinArithmetic=false;}
   else{
    const lines=body.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('!'));assert(lines.every(s=>/^[\da-f]+$/i.test(s)&&s.length===68));
    const blocks=lines.map(s=>Buffer.from(s,'hex')),payload=Buffer.concat(blocks);row.format=payload.subarray(0,7).toString()==='etsmart'?'etsmart-marked framed hex':'205201ff-marked framed hex';
    row.crc16Raw32Matches={BE:0,LE:0};for(const b of blocks){const c=E.crc16(b.subarray(0,32));if(c===b.readUInt16BE(32))row.crc16Raw32Matches.BE++;if(c===b.readUInt16LE(32))row.crc16Raw32Matches.LE++;}
    row.payloadBytes=payload.length;row.lineBytes=34;row.lineCount=lines.length;row.prefix=payload.subarray(0,8).toString('hex');row.comments=body.split(/\r?\n/).filter(s=>s.startsWith('!'));
    row.hexBodyProbe=probe(Buffer.from(lines.join('\n')));const reduced=Buffer.concat(blocks.map(b=>b.subarray(0,32)));row.dropTwoBytesPerLineProbe=probe(Buffer.from(reduced.toString('hex')));row.dropFirstBlockProbe=probe(Buffer.from(reduced.subarray(32).toString('hex')));
    for(const p of [row.hexBodyProbe,row.dropTwoBytesPerLineProbe,row.dropFirstBlockProbe])assert.equal(p.accepted,false);
   }
  }
  if(row.headingOnlyProbe)assert.equal(row.headingOnlyProbe.accepted,false);assert.deepEqual(raw,copy);rows.push(row);
 }
 return {scope:'Exact 12 original other-format SHA; parser probes are research-only rejected candidates, never enabled in runtime',audit:auditPath,counts:{targets:12,launchers:2,nativePE:2,etsmartFramed:4,marked205201ff:4,restored:0},files:rows};
}
if(require.main===module){const result=collect(),out='reports/T-007-byte-evidence-2026-11-04.json';if(process.argv.includes('--write'))fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(require('../'+out),result);console.log(JSON.stringify(result.counts));}
module.exports={collect};
