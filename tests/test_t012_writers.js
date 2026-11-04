// Only the three assigned originals. Synthetic evidence; no iProg or vehicle oracle.
'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const shas=['5f74901d009f3bca42a60ae00125bc3278892358b61b35907bc8ae8648e6a7be','3a0a0f5ca9f9f754c995da64ab6675914e4e306137d0023d92ac5fc2b047d32b','ecde8e1579b3adee67eba279d1bbdcd2355104a634fb03d69edb3c1eeb23d520'];
const raw=sha=>Buffer.from(CAL_CATALOG.blobs[sha],'base64');
function fixture(sha){const b=Uint8Array.from({length:sha===shas[0]?1024:512},(_,i)=>(i*37+11)&255);if(sha===shas[0]){b[0x32]=b[0x42]=0x12;b[0x33]=b[0x43]=0x34;}else{b[0]=b[0x20]=0xf3;b[1]=b[0x21]=0xca;}return b;}
// Closed-form expected bytes for the CURRENT parse, not a claim about iProg's
// undocumented source evaluator. Division/powers avoid using a JS shift oracle.
function expected(sha,input,n,rotateHypothesis=false){
 const b=input.slice();if(sha===shas[0]){if(n<=65535)for(let a=0x32;a<0x40;a+=2){b[a]=Math.floor(n/256);b[a+1]=n%256;}return b;}
 if(n<100||n>999900)return b;
 let w=65535-Math.floor(n/32);
 for(let a=0;a<64;a+=2){b[a]=Math.floor(w/256);b[a+1]=w%256;const twice=w*2;w=rotateHypothesis?(Math.floor(twice/65536)+twice)%65536:Math.floor(twice/(2**((16+twice)%32)))%65536;}
 return b;
}
function study(){
 const result={task:'T-012',scope:'Three original text CALs; current engine vs independent arithmetic. Alternate shift grouping is an unverified hypothesis, never enabled in production.',restored:0,blocked:3,files:[]};
 for(const sha of shas){
  const bytes=raw(sha);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sha);
  const p=E.parse(bytes,{sha}),input=fixture(sha),snapshot=input.slice();assert(p.partial);assert.equal(p.validEvents.join(','),'show');
  assert.match(p.eventErrors.apply,/Запись заблокирована/);assert.equal(p.writerBlockReason,p.eventErrors.apply);
  const short=new Uint8Array(sha===shas[0]?0x43:0x20),shortVM=new E.VM(p,short);assert.throws(()=>shortVM.transaction('show'),/границы BIN/);assert.deepEqual(shortVM.buffer,short);assert.throws(()=>shortVM.transaction('apply'),/Запись заблокирована/);
  const shown=new E.VM(p,input).transaction('show').vm;assert.equal(shown.controls[0].value,sha===shas[0]?0x1234:100000);
  assert.throws(()=>shown.transaction('apply'),/Запись заблокирована/);assert.deepEqual(input,snapshot);assert.deepEqual(shown.buffer,input);
  // Deliberately omit SHA ONLY to investigate unchanged source operations;
  // the website uses SHA-scoped production blocking and is tested separately.
  const research=E.parse(bytes),rows=[];
  const values=sha===shas[0]?[0,1,0x1234,0x1235,65535,65536,0xffffffff]:[0,99,100,127,128,160,100000,123456,999900,999901,0xffffffff];
  for(const n of values){
   const v=new E.VM(research,input).transaction('show').vm;v.input(0,n);const original=v.buffer.slice();
   const out=v.transaction('apply').vm,want=expected(sha,input,n);assert.deepEqual(out.buffer,want);assert.equal(out.buffer.length,input.length);
   assert.deepEqual(v.buffer,original);assert.deepEqual(input,snapshot);assert.equal(v.mismatches.size,0);
   assert.deepEqual(v.transaction('apply').vm.buffer,want);assert.deepEqual(out.transaction('apply').vm.buffer,want);
   const reread=new E.VM(research,out.buffer).transaction('show').vm;
   const message=reread.controls.map(c=>c.text).find(t=>/Дамп|дамп/.test(t));
   const valid=sha===shas[0]?n<=65535:n>=100&&n<=999900;
   const changed=[];for(let i=0;i<input.length;i++)if(input[i]!==out.buffer[i])changed.push(i);
   assert(changed.every(a=>sha===shas[0]?a>=0x32&&a<0x40:a<0x40));
   if(valid){assert.equal(out.mismatches.size,sha===shas[0]?14:64);if(sha===shas[0]){assert.equal(out.buffer[0x42],0x12);assert.equal(out.buffer[0x43],0x34);assert.equal(message==='Неверный дамп!',n!==0x1234);}else{assert.equal(out.buffer[0x20],0);assert.equal(out.buffer[0x21],0);assert.equal(message,'Неверный дамп!');}}
   else {assert.deepEqual(out.buffer,input);assert.equal(out.mismatches.size,0);}
   rows.push({input:n,acceptedBySource:valid,outputHex:Buffer.from(out.buffer.slice(sha===shas[0]?0x30:0,sha===shas[0]?0x44:0x40)).toString('hex'),readback:reread.controls[0].value,readMessage:message,changedBytes:changed.length});
  }
  if(sha!==shas[0]){
   const body=research.sourceProgram.procedures.get('onapply'),nodes=[];
   function walk(n){if(!n||typeof n!=='object')return;if(n.kind==='assign'&&n.target.name==='var7')nodes.push(n.value);for(const x of Object.values(n)){if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object')walk(x);}}body.forEach(walk);
   const shifts=nodes.filter(n=>n.op==='&'&&n.left.op==='>>');assert.equal(shifts.length,2);for(const n of shifts){assert.equal(n.left.right.op,'+');assert.equal(n.left.right.left.value,16);assert.equal(n.left.right.right.name,'var6');}
   for(const n of [100,128,100000,123456,999900]){const hypothesis=expected(sha,input,n,true);assert.deepEqual(hypothesis.slice(0,32),hypothesis.slice(32,64));assert.equal(new E.VM(research,hypothesis).transaction('show').vm.controls[0].value,Math.floor(n/32)*32);}
   const sample=rows.find(r=>r.input===100000);assert.equal(sample.outputHex,'f3ca1e790f3c001e'+'00'.repeat(56));
  }
  result.files.push({sha,bytes:bytes.length,paths:CAL_CATALOG.entries.filter(e=>e.sha===sha).map(e=>e.path),status:sha===shas[0]?'blocked-original-self-inconsistency':'blocked-missing-original-shift-semantics',required:sha===shas[0]?'Corrected author source or exact original-iProg output/format reference establishing intended login copies.':'Authoritative source operator precedence or compiled version of this exact source; alternatively original-iProg BIN output for a defined input.',rows});
 }
 return result;
}
module.exports={shas,raw,fixture,expected,study};
if(require.main===module){const r=study();if(process.argv[2])require('fs').writeFileSync(process.argv[2],JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({files:r.files.length,rows:r.files.reduce((n,f)=>n+f.rows.length,0),restored:r.restored,blocked:r.blocked,passed:true}));}
