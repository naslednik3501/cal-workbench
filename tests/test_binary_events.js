// Binary event isolation preserves original bytes and validates every reachable
// instruction. Synthetic buffers are algorithm checks, not hardware fixtures.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),E=require('../engine.js');
require('../catalog.js');for(const part of require('../catalog-parts.json'))require('../'+part);
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
const ECU='545d98cd88f60f92405bcd00e9eff8df1412d10ef700cc315787bd42accd2a';
const ecuSha='545d98cd88f60f924bf05bcd00e9eff8df1412d10ef700cc315787bd42accd2a';
const raw=sha=>Buffer.from(CAL_CATALOG.blobs[sha],'base64');
// Encode small test programs using the documented CAL permutation and CRC.
function encoded({show=13,apply=65535,change=65535,instructions={13:[0x1f]}}={}){
 const bytes=new Uint8Array(96).fill(0xff),word=(at,v)=>{bytes[at]=v&255;bytes[at+1]=v>>>8;};
 word(0,show);word(2,apply);word(4,change);word(6,65535);word(8,100);word(10,100);bytes[12]=255;
 for(const [at,values] of Object.entries(instructions))bytes.set(values,+at);
 const crc=E.crc16(bytes),out=new Uint8Array(bytes.length+32);let key=(14^(crc>>>8)^crc)&255;
 for(let block=0;block<bytes.length;block+=32)for(let i=0;i<32;i++){out[block+i]=bytes[block+(i^14)]^key;key=(key+85)&255;}
 out[bytes.length]=crc>>>8;out[bytes.length+1]=crc&255;
 return Buffer.from(Buffer.from(out).toString('hex'));
}
let ecu;
test('Original ECU 95080 exact profile exposes only its validated reader and preserves invalid writer address',()=>{
 const original=raw(ecuSha),copy=Buffer.from(original);assert.equal(crypto.createHash('sha256').update(original).digest('hex'),ecuSha);
 const strict=E.parse(original);assert.equal(strict.partial,true);assert.match(strict.eventErrors.apply,/адрес события apply/);
 ecu=E.parse(original,{sha:ecuSha});assert.equal(ecu.executable,true);assert.equal(ecu.partial,false);assert.equal(ecu.readOnly,true);assert.deepEqual(ecu.validEvents,['show']);assert.deepEqual(ecu.absentEvents,['apply']);
 assert.deepEqual(ecu.form.events,{show:153,apply:36972,change:65535});assert.deepEqual(ecu.eventErrors,{});
 assert.deepEqual(original,copy);assert.deepEqual(ecu.bytes,E.decode(original));assert.throws(()=>E.parseForm(ecu.bytes),/адрес события apply/);
});
test('Original ECU reader extracts PIN directly from little-endian EEPROM bytes on three vectors',()=>{
 for(const [low,high] of [[0,0],[0xff,0xff],[0x34,0x12]]){
  const dump=Uint8Array.from({length:1024},(_,i)=>(i*17+23)&255);dump[0x10e]=low;dump[0x10f]=high;
  const copy=dump.slice(),vm=new E.VM(ecu,dump).transaction('show').vm;
  assert.equal(vm.controls[0].value,low+high*256);assert.equal(vm.controls[1].text,'Дамп ОК.');assert.deepEqual(vm.buffer,copy);assert.deepEqual(dump,copy);
  assert.throws(()=>vm.transaction('apply'),/отсутствует в оригинальном CAL/);assert.deepEqual(vm.buffer,copy);assert.equal(vm.transaction('change').steps,0);
 }
});
test('Original readable-only ECU still rejects undersized BIN without mutation',()=>{
 const dump=new Uint8Array(16).fill(7),vm=new E.VM(ecu,dump);assert.throws(()=>vm.transaction('show'),/границы BIN/);assert.deepEqual(vm.buffer,dump);
});
test('Original FIS unknown opcode stays blocked while show graph is available',()=>{
 const p=E.parse(raw('5528e06fab6ef5ed02d38c90ff651efce87c81f13b6968b8607b5e10aaa76069'));
 assert.equal(p.partial,true);assert.deepEqual(p.validEvents,['show']);assert.match(p.eventErrors.apply,/0x4d/);
 const vm=new E.VM(p,new Uint8Array(1024));assert.throws(()=>vm.transaction('apply'),/0x4d/);assert(!Object.values(p.code).some(i=>i.op===0x4d));
});
test('Original invalid initialization cannot be bypassed through a valid apply handler',()=>{
 const p=E.parse(raw('7498ed09f8cdcfed8b151c496de2c73e13e4baa3dfcb7a7b32d01806bd5689d2'));
 assert.equal(p.executable,false);assert.match(p.eventErrors.show,/адрес события show/);assert.throws(()=>new E.VM(p,new Uint8Array(1024)),/show/);
});
test('Unknown opcode isolates failed event without inserting return or retaining failed code',()=>{
 const p=E.parse(encoded({apply:20,instructions:{13:[1,0,1,0,0,0,0x1f,0xc3]}}));assert.equal(p.partial,true);assert.equal(p.form.events.apply,20);
 assert.deepEqual(Object.keys(p.code),['13','19']);assert.match(p.eventErrors.apply,/0xc3/);assert.throws(()=>new E.VM(p,new Uint8Array(1)).execute('apply'),/0xc3/);
});
test('Invalid show prevents execution even when apply independently validates',()=>{
 const p=E.parse(encoded({apply:14,instructions:{13:[0xc3,0x1f]}}));assert.equal(p.executable,false);assert.deepEqual(p.validEvents,['apply']);assert.throws(()=>new E.VM(p,new Uint8Array(1)),/0xc3/);
});
test('Cross-event jumps into instruction operands invalidate both handlers',()=>{
 const p=E.parse(encoded({apply:15,instructions:{13:[1,0,0x1f,0,0,0,0x1f]}}));assert.equal(p.executable,false);
 assert.match(p.eventErrors.show,/внутрь команды/);assert.match(p.eventErrors.apply,/внутрь команды/);
});
test('A handler may end at a referenced string start, but a jump into its interior stays blocked',()=>{
 const p=E.parse(encoded({apply:33,instructions:{13:[0x36,32,32,0,0x1f],32:[0xc1,0x41,0,0,0x1f]}}));assert.equal(p.partial,true);
 assert.deepEqual(p.validEvents,['show']);assert.match(p.eventErrors.apply,/Переход внутрь строки/);
});
test('Partial reader transaction rolls back writes if a later read exceeds BIN',()=>{
 const p=E.parse(encoded({apply:90,instructions:{13:[0x28,0,0,0,0,7,0x23,0,100,0,0,0,0x1f]}})),dump=new Uint8Array(8),vm=new E.VM(p,dump);
 assert.equal(p.partial,true);assert.throws(()=>vm.transaction('show'),/границы BIN/);assert.deepEqual(vm.buffer,dump);assert.equal(vm.buffer[0],0);
});
test('Shared valid event instructions remain supported; all-absent program is unavailable',()=>{
 const p=E.parse(encoded({apply:13,instructions:{13:[1,0,1,0,0,0,0x1f]}}));assert.equal(p.executable,true);assert.equal(p.partial,false);assert.deepEqual(p.validEvents,['show','apply']);assert.deepEqual(p.eventErrors,{});
 assert.equal(E.parse(encoded({show:65535})).executable,false);
});
test('Truncated source and checksum tampering remain hard parse failures',()=>{
 assert.throws(()=>E.parse(raw(ecuSha).subarray(0,37)));
 const source=encoded();source[0]=source[0]===48?49:48;assert.throws(()=>E.parse(source),/контрольная сумма/);
});
console.log(JSON.stringify({passed,failed:0,note:'Synthetic BINs; no original-iProg or hardware validation.'}));
