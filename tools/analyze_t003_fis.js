/* Targeted T-003 proof: reads only the four original FIS. Never executes unknown code. */
'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const targets=require('../reports/binary-resolution-2026-11-03.json').remaining.filter(x=>x.eventErrors?.apply?.includes('0x4d'));
// Once resolution is updated, use the pinned target list instead of changing scope.
const fixed=fs.existsSync('tests/fixtures/t003-fis.json')?require('../tests/fixtures/t003-fis.json').targets:targets;
assert.equal(fixed.length,4);const rows=[];let common;
for(const t of fixed){
 const raw=Buffer.from(CAL_CATALOG.blobs[t.sha],'base64');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),t.sha);
 const p=E.parse(raw,{sha:t.sha});assert.deepEqual(p.eventErrors,{});assert.deepEqual(p.validEvents,['show','apply']);assert(!p.partial&&!p.readOnly);
 const code=Object.values(p.code).sort((a,b)=>a.pc-b.pc),rnd=code.filter(i=>i.op===0x4d);assert.equal(rnd.length,1);assert.deepEqual(rnd[0].args,[255,28]);
 const blocks=[];
 for(let n=0;n<code.length-2;n++){
  const [move,idx,branch]=code.slice(n,n+3);
  if(move.op!==0||move.args[0]!==128||move.args[1]!==10||idx.op!==0x29||idx.args[0]!==127||branch.op!==0x19)continue;
  const body=code.filter(i=>i.pc>=branch.next&&i.pc<branch.args[2]);
  const writes=body.filter(i=>i.op===0x28),msg=body.filter(i=>i.op===0x36);assert.equal(writes.length,24);assert.equal(msg.length,1);
  assert.match(msg[0].text,/^Новый код \d{4} записан\.$/);
  const starts=[writes[0].args[0],writes[8].args[0],writes[16].args[0]],bytes=writes.slice(0,8).map(i=>i.args[1]);
  for(let copy=0;copy<3;copy++)for(let j=0;j<8;j++)assert.deepEqual(writes[copy*8+j].args,[starts[copy]+j,bytes[j]]);
  blocks.push({index:idx.args[1],starts,bytes,message:msg[0].text});
 }
 assert.equal(blocks.length,58);const modes=[blocks.slice(0,29),blocks.slice(29)];
 for(let mode=0;mode<2;mode++)for(let i=0;i<29;i++){assert.equal(modes[mode][i].index,i);assert.deepEqual(modes[mode][i].starts,mode?[32,64,96]:[16,32,48]);}
 const normalized=modes.map(m=>m.map(({index,bytes,message})=>({index,bytes,message})));
 assert.deepEqual(normalized[0],normalized[1]);if(common)assert.deepEqual(normalized[0],common);else common=normalized[0];
 rows.push({sha:t.sha,paths:t.paths,rawBytes:raw.length,decodedBytes:p.bytes.length,codeStart:p.form.codeStart,events:p.form.events,randomInstruction:rnd[0],instructions:code.length,tableBranches:blocks.length});
}
const proof={scope:'Only the four T-003 originals; literal writer tables independently extracted from original CAL commands',targets:rows,modes:[[16,32,48],[32,64,96]],table:common};
if(process.argv.includes('--write'))fs.writeFileSync('tests/fixtures/t003-fis.json',JSON.stringify(proof,null,2)+'\n');
else assert.deepEqual(require('../tests/fixtures/t003-fis.json'),proof);
console.log(JSON.stringify({targets:rows.length,tableBranches:232,reachableBranches:224,literalRows:common.length,passed:true}));
