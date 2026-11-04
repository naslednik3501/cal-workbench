'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const targets=require('./fixtures/t006-bcd.json');
function expected(t,input,n){const out=input.slice();if(n>=100&&n<=999900){const w=(0xffffffff-parseInt(String(n).padStart(8,'0'),16))>>>0;for(let a=t.base;a<t.base+12;a++)out[a]=Math.floor(w/(256**((a-t.base)%4)))%256;}return out;}
function fixture(t,n=123456){const input=Uint8Array.from({length:t.size},(_,i)=>(i*31+17)&255);return expected(t,input,n);}
function program(t){const raw=Buffer.from(CAL_CATALOG.blobs[t.sha],'base64');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),t.sha);return E.parse(raw,{sha:t.sha});}
function checks(){let vectors=0;for(const t of targets){const raw=Buffer.from(CAL_CATALOG.blobs[t.sha],'base64'),p=program(t);assert(p.executable&&!p.partial);assert.throws(()=>E.parse(raw));const changed=Buffer.from(raw);changed[changed.length-1]^=1;assert.throws(()=>E.parse(changed,{sha:t.sha}),/профилем/);
 const input=fixture(t),shown=new E.VM(p,input).transaction('show').vm;assert.equal(shown.controls[0].value,123456);
 for(const n of [0,99,100,101,100000,123456,999900,999901,0xffffffff]){const v=shown.clone();v.input(0,n);const out=v.transaction('apply').vm,want=expected(t,input,n);assert.deepEqual(out.buffer,want);assert.deepEqual(shown.buffer,input);assert.deepEqual(v.buffer,input);assert.equal(out.buffer.length,t.size);assert.deepEqual(v.transaction('apply').vm.buffer,want);assert.deepEqual(out.transaction('apply').vm.buffer,want);assert.equal(new E.VM(p,want).transaction('show').vm.controls[0].value,n>=100&&n<=999900?n:123456);vectors++;}
 const bad=input.slice();bad[t.base+4]^=1;assert.equal(new E.VM(p,bad).transaction('show').vm.controls[0].value,0);
 const short=new Uint8Array(t.base+11),v=new E.VM(p,short);assert.throws(()=>v.transaction('show'),/границы/);assert.deepEqual(v.buffer,short);
 }
 console.log(JSON.stringify({recovered:3,vectors,passed:true,scope:'independent decimal BCD bytes, exact readback, limits and transactional originals'}));}
module.exports={targets,fixture,expected,program};if(require.main===module)checks();
