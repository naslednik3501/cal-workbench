// Regression inventory for the 254 binary CALs isolated by the 2026-11-03 audit.
'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const E=require('../engine.js'),profiles=require('../binary-event-profiles.js');
require('../catalog.js');for(const part of require('../catalog-parts.json'))require('../'+part);

const baseline=JSON.parse(fs.readFileSync('reports/calculator-coverage-2026-11-03.json','utf8'));
const target=[...new Set(baseline.unavailable.filter(x=>x.status==='partial'&&x.format==='binary').map(x=>x.sha))];
assert.equal(target.length,254);
const state={readOnly:[],full:[],partial:[],unsupported:[]};
for(const sha of target){
 const original=Buffer.from(CAL_CATALOG.blobs[sha],'base64');
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),sha);
 const p=E.parse(original,{sha});
 const bucket=p.partial?'partial':p.readOnly?'readOnly':p.executable?'full':'unsupported';
 state[bucket].push({sha,p,original});
}

assert.deepEqual(Object.fromEntries(Object.entries(state).map(([k,v])=>[k,v.length])),{readOnly:216,full:32,partial:4,unsupported:2});
assert.equal(profiles.readOnlyShas.length,216);
assert.equal(new Set(profiles.readOnlyShas).size,216);
const structuralShas=new Set([
 '679c9ec0143099817273017908c6b9934767e3966b278d0d3020de2e7e0599ee',
 'd7ae28ab672582f59045017799e6612ed05d20a8feb87be8a13f51201db166fc'
]);
for(const sha of profiles.readOnlyShas){
 const row=state.readOnly.find(x=>x.sha===sha);assert(row,'profile SHA must stay inside the reviewed target set');
 assert.deepEqual(row.p.validEvents,['show']);assert.deepEqual(row.p.absentEvents,['apply']);assert.deepEqual(row.p.eventErrors,{});
 const strict=E.parse(row.original,{sha,skipEventProfiles:true});assert.equal(strict.partial,true);
 assert.match(strict.eventErrors.apply,structuralShas.has(sha)?/строковые данные/:/Некорректный адрес события apply/);
 const vm=new E.VM(row.p,new Uint8Array(1));assert.throws(()=>vm.transaction('apply'),/отсутствует в оригинальном CAL/);
}

const structuralReaders=state.readOnly.filter(x=>structuralShas.has(x.sha));
assert.deepEqual(structuralReaders.map(x=>x.sha).sort(),[
 '679c9ec0143099817273017908c6b9934767e3966b278d0d3020de2e7e0599ee',
 'd7ae28ab672582f59045017799e6612ed05d20a8feb87be8a13f51201db166fc'
]);
for(const {p} of structuralReaders){assert.deepEqual(p.absentEvents,['apply']);assert.deepEqual(p.validEvents,['show']);}

for(const {p} of state.full){
 assert.deepEqual(p.eventErrors,{});assert(p.validEvents.includes('show'));assert(p.validEvents.includes('apply'));
 assert.equal(p.eventTermination.apply,'string-boundary');assert(p.eventImplicitReturnPcs.apply.length>0);
}
for(const {sha,original} of state.full){const strict=E.parse(original,{sha,skipEventProfiles:true});assert.equal(strict.partial,true);assert(strict.eventErrors.apply);}
const bsi=state.full.find(x=>x.sha==='a090c5f30a2cc91612cddc83e9860ab345dfa08e72d67b514ae0765dcf300877');
const dump=new Uint8Array(256),opened=new E.VM(bsi.p,dump).transaction('show').vm;opened.input(0,123456);
const written=opened.transaction('apply').vm;assert.deepEqual(E.diff(dump,written.buffer).ranges,[{start:211,end:214}]);assert.deepEqual([...written.buffer.slice(211,214)],[242,202,36]);assert.deepEqual(dump,new Uint8Array(256));
const tooSmall=new Uint8Array(1),smallVm=new E.VM(bsi.p,tooSmall);assert.throws(()=>smallVm.transaction('show'),/границы BIN/);assert.deepEqual(smallVm.buffer,tooSmall);

function writerSize(path){
 if(/CFMOTO.*256/i.test(path))return 256;if(/CFMOTO.*512/i.test(path))return 512;if(/Windstorm/i.test(path))return 2048;
 if(/H940S/i.test(path))return 4096;if(/KATO/i.test(path))return 512;if(/BSI/i.test(path))return 256;if(/Atego/i.test(path))return 512;
 if(/Sprinter|Vito|Liberty/i.test(path))return 128;if(/Range Rover|Kamaz/i.test(path))return 4096;throw Error('No test size for '+path);
}
function executeWriter(sha,size,value,pattern){
 const row=state.full.find(x=>x.sha===sha),source=Uint8Array.from({length:size},(_,i)=>pattern?(i*37+11)&255:0),copy=source.slice();
 let vm=new E.VM(row.p,source).transaction('show').vm;for(const c of row.p.form.controls)if('DH'.includes(c.type))vm.input(c.id,value);
 const output=vm.transaction('apply').vm.buffer;assert.deepEqual(source,copy,'transaction mutated caller buffer');return output;
}
for(const row of require('../reports/binary-resolution-2026-11-03.json').writers){
 const size=writerSize(row.paths[0]);for(const pattern of [0,1])for(const value of [1,123456])executeWriter(row.sha,size,value,pattern);
}
const equivalentGroups=[
 ['e0e8e1c9d786266ace9d8b9329be51c32264206e4ece6ca4688b47cf077bf334','2706317a5a6d0724b0e4657d0425f195914ba0012c6cee5e260541952bd999db'],
 ['2dfd2b1fae0e10b90cc5141924722c41e98cebec2f9c4173b0c9c1f7d5a16c10','a37ff24f88c17a67df744922eec5fbe418caa10e6772598b3da0be8bb7ba6e2e'],
 ['315c652c0beac0eb4a5076f1da345755770001c11efe66669044baa98eb89cd7','956a2ed105e434df5ce461b9dccfba2989221502786be45d562359b2881008ef','824e6ab0a3bc0d877c99d496db6ef58b87ce17f0937d31054f5a548cc605be5d'],
 ['e42e7b03603ff0f48b5c4fc602988d58353d78e13bc448dba66dc5e4190855e2','ace179c2bb40589a5035346b63c4d717a391db16233c815094dc6eed3ccd0867'],
 ['b205f4cf493efb11e5a1da7a7321352b1671dc1266701630430cb9ca3072600f','2569f04b1b2ceceba3472a48ab268b818772458fc72ba19847cbba691829a6a8'],
 ['72707ad1670162ade95badec010900871d1b8773548c6ed64a4819aeb20f7a90','8474ed3873251b38cb909209f4ee57ac1fa47a72da6639bd8fd17165a717a1ec'],
 ['3aab5bdbb4cef9ab2a57437379b3a3b96b63dda61c31bc036ebf10d03ef48745','74121f68e6eedf8a5e691c475a8bd37c4cad9ba52e6398c611a5bc612e1e7e67'],
 ['9d62e1e0a12123db2e4dd713505a3f802244b61e660641007b79e8b3a59cf658','af4b86898990324f46d846d49fc3ab5efaab4161b5eb5307dea36bafc69e6c9c'],
 ['1112968804097a2aab94755e9ef67c575e85b58b720fa0941dffca4493b92ef4','c0d1f6a2fbbf2911863a6af9d074920d20e363297991160e93d48fc836d29c73'],
 ['cedc41d312c4dd7f2d3f265af65dfd414f3820e1959d0abd8ce11e23d5390a26','a8895ef0476c30de934a02b5a792dc98cc5a691b065f91efc6c849470780527e']
];
for(const group of equivalentGroups){const path=CAL_CATALOG.entries.find(e=>e.sha===group[0]).path,size=writerSize(path);for(const pattern of [0,1])for(const value of [0,1,123456]){const outputs=group.map(sha=>executeWriter(sha,size,value,pattern));for(const output of outputs.slice(1))assert.deepEqual(output,outputs[0]);}}

for(const {p} of state.partial){assert.deepEqual(p.validEvents,['show']);assert.match(p.eventErrors.apply,/0x4d/);}
assert.deepEqual(state.unsupported.map(x=>x.sha).sort(),[
 'dfc2f328da0c07d0141e0f832fedf2c271785c7ec10be40ca595c9fafb7d0df4',
 'e8abebc4b6ba200bf62b4e1bcdc2f8bc9ee67d1a8b315e18f0a03ae6925cc602'
]);
for(const {p} of state.unsupported){assert.equal(p.executable,false);assert.match(p.eventErrors.apply,/адрес события apply/);}

const baselineUnsupported=[...new Set(baseline.unavailable.filter(x=>x.status==='unsupported'&&x.format==='binary').map(x=>x.sha))];
assert.equal(baselineUnsupported.length,16);
const t013Readers=new Set(Object.keys(require('./fixtures/t013-readers.json')));assert.equal(t013Readers.size,15);
for(const sha of baselineUnsupported){const bytes=Buffer.from(CAL_CATALOG.blobs[sha],'base64');const strict=E.parse(bytes,{sha,skipEventProfiles:true});assert.equal(strict.executable,false,'unprofiled original remains unsupported: '+sha);const p=E.parse(bytes,{sha});if(t013Readers.has(sha)){assert(p.executable&&p.readOnly);assert.deepEqual(p.validEvents,['show']);assert.deepEqual(p.absentEvents,['apply']);}else assert.equal(p.executable,false,'invalid initialization remains blocked: '+sha);}

console.log(JSON.stringify({target:target.length,readOnly:216,full:32,partial:4,unsupported:2,writerExecution:'BSI Partner D780949: 256-byte synthetic buffer'}));
