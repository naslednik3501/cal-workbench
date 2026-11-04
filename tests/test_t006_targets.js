'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const fixture=require('./fixtures/t006-targets.json'),report=require('../reports/T-006-results-2026-11-04.json');
assert.equal(fixture.targets.length,60);assert.deepEqual(report.files.map(t=>t.sha),fixture.targets.map(t=>t.sha));
let full=0,partial=0,blocked=0;
for(const t of report.files){const raw=Buffer.from(CAL_CATALOG.blobs[t.sha],'base64'),before=Buffer.from(raw);assert.equal(raw.length,t.bytes);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),t.sha);assert.throws(()=>E.parse(raw));
 if(t.status==='blocked'){assert(t.reason&&t.next);assert.throws(()=>E.parse(raw,{sha:t.sha}));blocked++;}
 else {const p=E.parse(raw,{sha:t.sha});assert(p.executable);assert(p.sourceRepairs?.length);if(t.status==='reader-writer-blocked'){assert(p.partial);assert.match(p.eventErrors.apply,/Запись заблокирована/);partial++;}else{assert(!p.partial);full++;}}
 assert.deepEqual(raw,before);
}
assert.deepEqual([full,partial,blocked],[19,14,27]);console.log(JSON.stringify({initial:60,restored:full+partial,originalHandlers:full,readerOnly:partial,blocked,shaVerified:60,passed:true,scope:'Only assigned target set; no general database re-audit'}));
