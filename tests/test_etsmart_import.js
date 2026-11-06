// Verifies the optional ETSmartUSB CAL overlay without changing the base catalog.
const path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
require('../catalog.js');
for(const f of require('../catalog-parts.json'))require('../'+f);
const parts=require('../catalog-import-parts.json');
for(const f of parts.entries)require('../'+f);
for(const f of parts.blobs)require('../'+f);
require('../catalog-import.js');
const db=globalThis.CAL_CATALOG,source=require('../cal-source.js');
require('../engine.js');
const org=require('../catalog-organization.js'),layout=require('../catalog-layout.js');
const imported=db.entries.filter(e=>e.source==='ETSmartUSB.rar');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const blob=hash=>Uint8Array.from(Buffer.from(db.blobs[hash],'base64'));

test('the overlay appends only the reviewed CALs and updates the counters',()=>{
 assert.equal(imported.length,3120);
 assert.equal(db.meta.entries,27066);
 assert.equal(db.meta.calculators,26477);
 assert.equal(db.meta.uniqueCal,18177);
 assert.deepEqual(db.meta.imported,{source:'ETSmartUSB.rar',count:3120});
 for(const e of imported)assert.equal(e.ext,'cal',e.path);
});

test('every imported identity, byte sequence and display entry is intact',()=>{
 const unique=new Set(imported.map(e=>e.sha));
 assert.equal(unique.size,3120);
 for(const e of imported){
  const raw=blob(e.sha);
  assert.equal(raw.length,e.size,e.path);
  assert.equal(sha(raw),e.sha,e.path);
  const item=org.get(e.sha);
  assert(item,'organization entry '+e.path);
  assert(org.displayPath(e).endsWith('.cal'),'display path '+e.path);
 }
 assert.equal(Object.keys(org.data.entries).length,18177);
});

test('the merged tree keeps the six sections and unique display paths',()=>{
 const groups=require('../catalog-scope.js').calculatorGroups(db.entries.filter(e=>e.ext==='cal'));
 assert.equal(groups.length,18177);
 const counts={};
 for(const g of groups){const top=org.displayFolder(g.e).split('/')[0];counts[top]=(counts[top]||0)+1;}
 assert.deepEqual(counts,{Dashboard:9286,Airbag:5588,CarRadio:2411,Immo:673,OTHER:196,Engine:23});
 const seen=new Set();
 for(const g of groups){
  const shown=org.displayPath(g.e).toLowerCase();
  assert(!seen.has(shown),'duplicate display path '+shown);
  seen.add(shown);
  assert.equal(layout.path(org.displayPath(g.e)),org.displayPath(g.e),'layout idempotence '+shown);
 }
});

test('every imported calculator parses and runs its onShow form',()=>{
 for(const e of imported){
  const program=source.parse(blob(e.sha),{sha:e.sha});
  const vm=new source.VM(program,new Uint8Array(1<<20));
  vm.execute('show',{maxSteps:2000000});
 }
});

test('source-recovered calculators run both events on blank buffers',()=>{
 let recovered=0;
 for(const e of imported){
  const program=source.parse(blob(e.sha),{sha:e.sha});
  if(!program.sourceRecovered)continue;
  recovered++;
  assert(program.sourceRepairs&&program.sourceRepairs.length,'repair notes '+e.path);
  for(const fill of [0,255]){
   const vm=new source.VM(program,new Uint8Array(1<<20).fill(fill));
   vm.execute('show',{maxSteps:2000000});
   vm.execute('apply',{maxSteps:2000000});
  }
 }
 assert.equal(recovered,791);
});

test('recovery is bound to the reviewed SHA-256 identities',()=>{
 const sample=imported.find(e=>source.parse(blob(e.sha),{sha:e.sha}).sourceRecovered);
 assert(sample,'no recovered sample');
 assert.throws(()=>source.parse(blob(sample.sha),{sha:'0'.repeat(64)}));
 assert.throws(()=>source.parse(blob(sample.sha)));
});

console.log(JSON.stringify({passed,scope:'ETSmartUSB overlay: 3,120 CALs, 18,177 unique calculators, 26,477 CAL entries'}));
