'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const proof=require('./fixtures/t003-fis.json'),reference=require('./fixtures/t003-random-vectors.json');
const raw=t=>Buffer.from(CAL_CATALOG.blobs[t.sha],'base64');
function fixture(mode,size=128,pattern=0){const d=Uint8Array.from({length:size},(_,i)=>pattern?(i*37+11)&255:0);if(mode===0){d[16]=d[32]=d[48]=170;d[64]=187;d[96]=204;}else{d[32]=d[64]=d[96]=170;d[16]=187;d[48]=204;}return d;}
function expected(input,mode,index){const out=input.slice();for(const at of proof.modes[mode])out.set(proof.table[index].bytes,at);return out;}
function encoded(body){
 const n=Math.ceil((15+body.length)/32)*32,b=new Uint8Array(n).fill(255),word=(at,x)=>{b[at]=x&255;b[at+1]=x>>>8;};
 word(0,13);word(2,14);word(4,65535);word(6,65535);word(8,100);word(10,100);b[12]=255;b[13]=31;b.set(body,14);
 const crc=E.crc16(b),out=new Uint8Array(n+32);let key=(14^(crc>>>8)^crc)&255;
 for(let block=0;block<n;block+=32)for(let i=0;i<32;i++){out[block+i]=b[block+(i^14)]^key;key=(key+85)&255;}out[n]=crc>>>8;out[n+1]=crc&255;return Buffer.from(Buffer.from(out).toString('hex'));
}
function checkRandom(){let samples=0;
 for(const v of reference.vectors){let body=[0x35,0];for(let i=0;i<v.values.length;i++){let bound=v.bounds[i%v.bounds.length];body.push(0x4d,255,bound&255,(bound>>>8)&255,(bound>>>16)&255,bound>>>24,0x3e,0,255);}body.push(31);
  const p=E.parse(encoded(body)),vm=new E.VM(p,new Uint8Array(1)),a=vm.transaction('apply',{randomSeed:v.seed}).vm,want=v.values.map(n=>n.toString(16).toUpperCase().padStart(8,'0')).join('');
  assert.equal(a.s[0],want);assert.equal(vm.s[0],'');assert.equal(vm.transaction('apply',{randomSeed:v.seed}).vm.s[0],want);samples+=v.values.length;
 }
 const p=E.parse(encoded([0x4d,255,28,0,0,0,31])),vm=new E.VM(p,new Uint8Array(1));
 for(const seed of [-1,0x100000000,0.5,NaN,Infinity,'1'])assert.throws(()=>vm.transaction('apply',{randomSeed:seed}),/Seed/);
 // Other unsupported operations are still rejected; 0x4c is outside this task.
 for(const op of [0x4c,0x43,0x44,0x4f,0xc3])assert(E.parse(encoded([op,0,0,0,0,0,31])).eventErrors.apply);
 return samples;
}
function checks(){const randomSamples=checkRandom();let vectors=0,bounds=0;
 for(const t of proof.targets){const source=raw(t),copy=Buffer.from(source),p=E.parse(source,{sha:t.sha});assert.equal(crypto.createHash('sha256').update(source).digest('hex'),t.sha);assert(p.executable&&!p.partial&&!p.readOnly);assert.deepEqual(p.eventErrors,{});assert.equal(p.code[t.randomInstruction.pc].op,0x4d);
  for(const mode of [0,1])for(let index=0;index<28;index++){
   const input=fixture(mode,128,index%2),snapshot=input.slice(),vm=new E.VM(p,input),opened=vm.transaction('show').vm;assert.match(opened.controls[0].text,/Дамп ОК/);
   const opts={randomSeed:reference.seedByIndex[index]},out=opened.transaction('apply',opts).vm,want=expected(input,mode,index);
   assert.equal(out.r[255],index);assert.deepEqual(out.buffer,want);assert.equal(out.controls[0].text,proof.table[index].message);assert.equal(out.buffer.length,input.length);
   assert.deepEqual(input,snapshot);assert.deepEqual(vm.buffer,snapshot);assert.deepEqual(opened.buffer,snapshot);assert.equal(opened.r[255],0);
   assert.deepEqual(opened.transaction('apply',opts).vm.buffer,want);assert.deepEqual(out.transaction('apply',opts).vm.buffer,want);
   assert.match(out.transaction('show').vm.controls[0].text,/Дамп ОК/);assert.deepEqual(source,copy);vectors++;
  }
  for(const [mode,size,success]of [[0,97,true],[1,104,true],[1,103,false]]){
   const input=fixture(mode,size,1),snapshot=input.slice(),opened=new E.VM(p,input).transaction('show').vm;
   if(success)assert.deepEqual(opened.transaction('apply',{randomSeed:0}).vm.buffer,expected(input,mode,8));else assert.throws(()=>opened.transaction('apply',{randomSeed:0}),/границы BIN/);
   assert.deepEqual(input,snapshot);assert.deepEqual(opened.buffer,snapshot);bounds++;
  }
  const small=new Uint8Array(96),s=new E.VM(p,small);assert.throws(()=>s.transaction('show'),/границы BIN/);assert.throws(()=>s.transaction('apply',{randomSeed:0}),/границы BIN/);assert.deepEqual(s.buffer,small);
  const invalid=Uint8Array.from({length:128},(_,i)=>i),v=new E.VM(p,invalid);const result=v.transaction('apply',{randomSeed:0}).vm;assert.deepEqual(result.buffer,invalid);assert.match(result.controls[0].text,/Неверный дамп/);
  const parent=new E.VM(p,fixture(1));assert.throws(()=>parent.transaction('apply',{randomSeed:0,maxSteps:606600}),/лимит/);assert.deepEqual(parent.buffer,fixture(1));assert.deepEqual(parent.transaction('apply',{randomSeed:0}).vm.buffer,expected(fixture(1),1,8));
 }
 console.log(JSON.stringify({targets:4,restored:4,writerVectors:vectors,randomSamples,boundaryVectors:bounds,passed:true,scope:'Exact originals, synthetic BINs, static native implementation proof; no iProg/vehicle execution'}));
}
if(require.main===module)checks();module.exports={proof,reference,raw,fixture,expected,encoded};
