// Public catalog originals, synthetic BINs. Not an original-iProg/hardware oracle.
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js'),S=require('../cal-source.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const profiles=require('./fixtures/source-brace-repairs.json');
const raw=sha=>Buffer.from(CAL_CATALOG.blobs[sha],'base64');
const program=sha=>S.parse(raw(sha),{sha});
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('Reviewed brace repairs preserve every original byte and execute all events',()=>{
 for(const {sha,path} of profiles){const bytes=raw(sha),copy=Buffer.from(bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sha,path);
  assert.throws(()=>S.parse(bytes),/ожидалось id, найдено }/,path);const p=program(sha);assert.equal(p.sourceRepairs.length,1);
  for(const fill of [0,255,'pattern']){const input=Uint8Array.from({length:8192},(_,i)=>fill==='pattern'?(i*17+23)&255:fill),original=input.slice();let v=new E.VM(p,input).transaction('show').vm;
   for(const o of p.form.controls)if('HDCB'.includes(o.type))v.input(o.id,o.type==='C'||o.type==='B'?0:o.type==='H'?0x12:123456);
   v=v.transaction('apply').vm;assert.equal(v.buffer.length,input.length);assert.deepEqual(input,original);}
  assert.deepEqual(bytes,copy);
  const changed=Buffer.from(bytes);changed[changed.length-1]^=1;assert.throws(()=>S.parse(changed,{sha}),/профилем/);
 }
});
test('Subaru Tribeka preserves complement pairs and reads back the requested value',()=>{
 for(const {sha} of profiles.slice(0,3)){const p=program(sha),input=new Uint8Array(512),v=new E.VM(p,input);v.input(0,123456);const result=v.transaction('apply').vm;
  const perCopy=123456/16;for(let at=0xe0;at<0x100;at+=4){assert.equal(result.buffer[at]|result.buffer[at+1]<<8,perCopy);assert.equal(result.buffer[at+2]|result.buffer[at+3]<<8,perCopy^0xffff);}
  const reread=new E.VM(p,result.buffer).transaction('show').vm;assert.equal(reread.controls[0].value,123456);
 }
});
test('Mitsubishi Outlender repeats the supplied key without changing other BIN bytes',()=>{
 const p=program('fe6eb1a4467138210a6fe4ae8dcacd92a46326952cb14160c61a295c32a2ff85'),input=new Uint8Array(512).fill(0xa5),v=new E.VM(p,input);
 for(let i=1;i<=4;i++)v.input(p.sourceProgram.names.get('h'+i),i*0x11);
 for(const slot of [0,1]){v.input(p.sourceProgram.names.get('cbx1'),slot);const result=v.transaction('apply').vm,expected=Uint8Array.from(input),start=0x38+slot*8;for(let at=start;at<start+8;at++)expected[at]=[0xee,0xdd,0xcc,0xbb][(at-start)%4];assert.deepEqual(result.buffer,expected);}
});
test('Byte mismatch flags are bounded, independent annotations and clone transactionally',()=>{
 const parse=body=>S.parse(Buffer.from('Size(10,10);Form{} OnApply{'+body+'}'));
 const input=Uint8Array.from([8,9,10,11]),v=new E.VM(parse('@0.mismatch=1;@(1+1).mismatch=1;@0.mismatch=0;@1=77;'),input),result=v.transaction('apply').vm;
 assert.deepEqual([...result.mismatches],[2]);assert.deepEqual([...result.buffer],[8,77,10,11]);assert.equal(v.mismatches.size,0);assert.deepEqual(v.buffer,input);
 const clone=result.clone();clone.mismatches.add(3);assert(!result.mismatches.has(3));
 for(const body of ['@0.mismatch=1;@bufsize.mismatch=1;','@0.mismatch=1;@1.mismatch=2;','@0.mismatch="1";']){const a=new E.VM(parse(body),input);assert.throws(()=>a.transaction('apply'));assert.equal(a.mismatches.size,0);assert.deepEqual(a.buffer,input);}
 assert.throws(()=>parse('@0.unknown=1;'),/неизвестное свойство байта/);
});
test('Unreviewed broken sources remain rejected',()=>{
 for(const text of ['Size(1,1);Form{}OnApply{}}','Size(1,1);Form{}OnApply{@0=(1+2;}','Size(1,1);Form{}OnApply{missing=1;}','Size(1,1);Form{}OnApply{}Form{}OnApply{}'])assert.throws(()=>S.parse(Buffer.from(text)));
 for(const sha of ['de9adb817e522093fdac9f8a841cc1430461110abf2751d11ced40bb1b664d3e','558b8b91314f9f5ee85113f291d3036db24aa43c022428dc3700e5d9a1aac88c'])assert.throws(()=>program(sha));
});
test('Known inconsistent source writers stay blocked while reader annotations remain available',()=>{
 for(const sha of ['5f74901d009f3bca42a60ae00125bc3278892358b61b35907bc8ae8648e6a7be','3a0a0f5ca9f9f754c995da64ab6675914e4e306137d0023d92ac5fc2b047d32b','ecde8e1579b3adee67eba279d1bbdcd2355104a634fb03d69edb3c1eeb23d520']){const p=E.parse(raw(sha),{sha}),input=new Uint8Array(1024),v=new E.VM(p,input).transaction('show').vm;assert.equal(p.partial,true);assert.throws(()=>v.transaction('apply'),/проверки оригинального алгоритма/);assert.deepEqual(v.buffer,input);}
});
console.log(JSON.stringify({passed,braceOriginals:profiles.length,syntheticEventRuns:profiles.length*6}));
