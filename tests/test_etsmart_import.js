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
 assert.equal(imported.length,1562);
 assert.equal(db.meta.entries,25508);
 assert.equal(db.meta.calculators,24919);
 assert.equal(db.meta.uniqueCal,16619);
 assert.deepEqual(db.meta.imported,{source:'ETSmartUSB.rar',count:1562});
 for(const e of imported)assert.equal(e.ext,'cal',e.path);
});

test('every imported identity, byte sequence and display entry is intact',()=>{
 const unique=new Set(imported.map(e=>e.sha));
 assert.equal(unique.size,1562);
 for(const e of imported){
  const raw=blob(e.sha);
  assert.equal(raw.length,e.size,e.path);
  assert.equal(sha(raw),e.sha,e.path);
  const item=org.get(e.sha);
  assert(item,'organization entry '+e.path);
  assert(org.displayPath(e).endsWith('.cal'),'display path '+e.path);
 }
 assert.equal(Object.keys(org.data.entries).length,16619);
});

test('the merged tree keeps the six sections and unique display paths',()=>{
 const groups=require('../catalog-scope.js').calculatorGroups(db.entries.filter(e=>e.ext==='cal'));
 assert.equal(groups.length,16619);
 const counts={};
 for(const g of groups){const top=org.displayFolder(g.e).split('/')[0];counts[top]=(counts[top]||0)+1;}
 assert.deepEqual(counts,{Dashboard:8443,Airbag:5390,CarRadio:2152,Immo:438,OTHER:175,Engine:21});
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
  vm.execute('show',{maxSteps:200000});
 }
});

console.log(JSON.stringify({passed,scope:'ETSmartUSB overlay: 1,562 CALs, 16,619 unique calculators, 24,919 CAL entries'}));
