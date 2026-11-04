// Synthetic original-algorithm checks, not vehicle or original-iProg tests.
'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const pairs=require('../reports/T-008-pair-differences-2026-11-04.json').pairs.filter(p=>[4,5,6,7].includes(p.id));
const variants=[...new Map(pairs.flatMap(p=>['text','binary'].map(k=>[p[k].sha,{...p[k],model:p.id<6?'Fabia':'Superb'}]))).values()];
const signatures={Fabia:[{10:0xbf39,26:0x9f39,42:0x3f39,58:0x1f39},{224:0x534b,238:0x534b,252:0x534b}],Superb:[{0:0xff44,16:0xff45,48:0x7f45},{224:0x534b,238:0x534b,252:0x534b}]};
// Independent bit-permutation formulation from the original sources. No VM reads,
// scratch buffer or instruction execution is used to construct expected results.
function mapping(model,i){
 const bits=model==='Fabia'?[0,1,14,13,15,11,10,12,8,9]:[6,9,5,8,7,2,0,4,3,1];
 let key=model==='Fabia'?0xc7:0xbb00;
 bits.forEach((b,n)=>{key^=((i>>>n)&1)<<b;});
 const a=key^(model==='Fabia'?0xc5c5:0xb9b9);
 return {key,address:2*(model==='Fabia'?((a&255)*256+(a>>>8)):a)};
}
function reference(model,input,mode){
 const out=new Uint8Array(2048);
 for(let i=0;i<1024;i++){
  const {key,address:a}=mapping(model,i),n=2*i;
  if(mode===0){const w=(model==='Fabia'?input[n]+256*input[n+1]:256*input[n]+input[n+1])^key;out[a]=model==='Fabia'?w>>>8:w;out[a+1]=model==='Fabia'?w:w>>>8;}
  else {const w=(model==='Fabia'?256*input[a]+input[a+1]:input[a]+256*input[a+1])^key;out[n]=model==='Fabia'?w:w>>>8;out[n+1]=model==='Fabia'?w>>>8:w;}
 }
 return out;
}
function fixture(model,mode,seed){const b=Uint8Array.from({length:2048},(_,i)=>(i*29+(i>>>3)*seed+seed*17)&255);for(const [a,w]of Object.entries(signatures[model][mode])){b[+a]=w&255;b[+a+1]=w>>>8;}return b;}
function program(v){const raw=Buffer.from(CAL_CATALOG.blobs[v.sha],'base64');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),v.sha);return E.parse(raw,{sha:v.sha});}
function checks(){
 let vectors=0;
 for(const model of ['Fabia','Superb']){const addresses=Array.from({length:1024},(_,i)=>mapping(model,i).address).sort((a,b)=>a-b);assert.deepEqual(addresses,Array.from({length:1024},(_,i)=>i*2));}
 for(const v of variants){
  const p=program(v),raw=Buffer.from(CAL_CATALOG.blobs[v.sha],'base64');
  assert.deepEqual(p.memory,{dumpBytes:2048,start:0x2000,length:2048});
  for(const size of [2047,2049,4096,10240])assert.throws(()=>new E.VM(p,new Uint8Array(size)),/ровно 2048/);
  const strict=new E.VM(E.parse(raw),new Uint8Array(2048));assert.throws(()=>strict.read(0x2000),/границы/);assert.throws(()=>strict.write(0x2000,1),/границы/);
  const wrong=new E.VM(E.parse(raw,{sha:'unknown'}),new Uint8Array(2048));assert.throws(()=>wrong.read(0x2000),/границы/);
  for(const mode of [0,1])for(const seed of [1,2,3]){
   const input=fixture(v.model,mode,seed),copy=input.slice();
   const shown=new E.VM(p,input).transaction('show').vm,control=p.form.controls.findIndex(c=>c.type==='C');shown.input(control,mode);
   const before=shown.buffer.slice(),scratch=shown.scratch.slice();
   const applied=shown.transaction('apply').vm,want=reference(v.model,input,mode);
   assert.deepEqual(applied.buffer,want);assert.equal(applied.buffer.length,2048);assert(applied.controls.some(c=>c.text==='Готово'));
   assert.deepEqual(input,copy);assert.deepEqual(shown.buffer,before);assert.deepEqual(shown.scratch,scratch);
   assert.deepEqual(shown.transaction('apply').vm.buffer,want);
   assert.deepEqual(reference(v.model,want,1-mode),input);
   for(const a of [-1,2048,0x1fff,0x2800,1.5]){assert.throws(()=>applied.read(a),/границы/);assert.throws(()=>applied.write(a,1),/границы/);}
   const clone=applied.clone();clone.write(0x2000,applied.read(0x2000)^255);assert.notEqual(clone.read(0x2000),applied.read(0x2000));
   // Equivalent to T-008's padded-buffer comparison, explicitly without the
   // production 2-KB profile. Scratch initial contents must have no influence.
   const padded=new Uint8Array(0x2800).fill(0xa5);padded.set(input);
   const legacy=new E.VM({...p,memory:undefined},padded);legacy.input(control,mode);
   assert.deepEqual(legacy.transaction('apply').vm.buffer.slice(0,2048),want);
   const unprofiled=new E.VM(E.parse(raw),input);unprofiled.input(control,mode);assert.throws(()=>unprofiled.transaction('apply'),/границы/);
   vectors++;
  }
  const invalid=new E.VM(p,new Uint8Array(2048)).transaction('show').vm;
  const rejected=invalid.transaction('apply').vm;assert(rejected.controls.some(c=>c.text==='Неверный дамп!'));assert.deepEqual(rejected.buffer,invalid.buffer);
 }
 console.log(JSON.stringify({variants:variants.length,vectors,permutationAddresses:2048,passed:true,scope:'synthetic encode/decode, independent permutation, bounds, transactions, original preservation'}));
}
module.exports={variants,fixture,reference,program};if(require.main===module)checks();
