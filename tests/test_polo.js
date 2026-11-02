// Independent direct formulation of the original Polo permutation for synthetic vectors.
// Verifies scratch memory and script execution, not physical-panel compatibility.
const assert=require('assert/strict'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const sha='a0a66442b874d649d9ee00c3bbe5a9a859567cd50ab5a3b7771a6c12bb119956';
const raw=Buffer.from(CAL_CATALOG.blobs[sha],'base64'),program=E.parse(raw,{sha});
function key(word){const bits=[0,1,14,13,15,11,10,12,8,9];let v=0;for(let b=0;b<10;b++)v|=((word>>b)&1)<<bits[b];return v^0xc7;}
function location(k){const v=k^0xc5c5;return ((v&255)*256+(v>>>8))*2;}
function encrypt(clear){const out=new Uint8Array(2048);for(let i=0;i<1024;i++){const k=key(i),a=location(k),v=((clear[a]*256+clear[a+1])^k);out[i*2]=v;out[i*2+1]=v>>>8;}return out;}
function clearFixture(){const b=Uint8Array.from({length:2048},(_,i)=>(i*37+11)&255);for(const a of [0x70a,0x74a,0x60a,0x64a])b[a]=b[a+1]=255;for(const a of [0xe0,0xee,0xfc]){b[a]=0x57;b[a+1]=0x56;}return b;}
const expected=clearFixture(),input=encrypt(expected),original=input.slice();
const shown=new E.VM(program,input).transaction('show').vm;
assert.deepEqual(shown.buffer,expected);assert.deepEqual(input,original);assert.equal(shown.buffer.length,2048);assert.equal(shown.scratch.length,2048);
const masks=[0xce6f,0xf1a9,0x3641,0xe1d9,0x7865,0xc7d7,0x745e,0xfa39];
for(const distance of [100,100000,123456,999900]){
 const want=expected.slice();for(let i=0;i<8;i++){const word=(distance>>>4)^masks[i];want[0x13a+i*2]=word>>>8;want[0x13b+i*2]=word;}
 const v=shown.clone();v.input(0,distance);const applied=v.transaction('apply').vm;
 assert.deepEqual(applied.buffer,encrypt(want));assert.equal(applied.buffer.length,2048);
 const reread=new E.VM(program,applied.buffer).transaction('show').vm;assert.equal(reread.controls[0].value,Math.floor(distance/16)*16);
 assert.deepEqual(shown.buffer,expected);assert.deepEqual(input,original);
}
assert.throws(()=>new E.VM(program,new Uint8Array(4096)),/ровно 2048/);
assert.throws(()=>shown.read(0x2800),/границы/);assert.throws(()=>shown.write(2048,1),/границы/);
const fork=shown.clone();fork.write(0x2000,27);assert.notEqual(shown.read(0x2000),fork.read(0x2000));
assert.throws(()=>new E.VM(E.parse(raw),input).transaction('show'),/границы/);
console.log(JSON.stringify({passed:8,failed:0,scope:'Polo original source: independent permutation, four write/readback vectors, bounded scratch and original preservation'}));
