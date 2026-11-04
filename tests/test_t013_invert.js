'use strict';
// Investigates ONLY the already-validated OnApply graph of the original file.
// The production program remains non-executable because OnShow is invalid.
const assert=require('assert/strict'),E=require('../engine.js');const {targets,raw}=require('./test_t013_readers.js');
const t=targets.find(t=>t.sha.startsWith('7498')),p=E.parse(raw(t),{sha:t.sha});
assert.equal(p.executable,false);assert.deepEqual(p.validEvents,['apply']);assert.equal(p.form.events.show,1379);assert.equal(p.bytes.length,288);assert.equal(p.form.events.apply,194);
for(const size of [131072,131073]){
 const input=Uint8Array.from({length:size},(_,i)=>(i*37+11)&255),snapshot=input.slice();assert.throws(()=>new E.VM(p,input),/адрес события show/);
 const isolated={...p,executable:true,eventErrors:{}}; // research copy, never returned by parse()
 const vm=new E.VM(isolated,input),out=vm.transaction('apply').vm,want=input.slice();for(let i=0;i<131072;i++)want[i]^=255;
 assert.deepEqual(out.buffer,want);assert.deepEqual(input,snapshot);assert.deepEqual(vm.buffer,input);assert.deepEqual(vm.transaction('apply').vm.buffer,want);assert.deepEqual(out.transaction('apply').vm.buffer,input);assert.equal(out.buffer.length,size);
}
const short=new Uint8Array(131071),vm=new E.VM({...p,executable:true,eventErrors:{}},short);assert.throws(()=>vm.transaction('apply'),/границы/);assert.deepEqual(vm.buffer,short);
assert.throws(()=>new E.VM(p,new Uint8Array(131072)),/адрес события show/);
console.log(JSON.stringify({original:'7498ed09',production:'blocked',isolatedApply:'128-KiB XOR checked on exact-size and larger buffers; short BIN rollback',pointerRepair:'none',passed:true}));
