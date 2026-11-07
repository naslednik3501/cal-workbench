/* ETSmartUSB overlay: appended after the verified base catalog. */
/*
 * Owner accounting (2026-11-07): 18,177 unique CALs = 17,749 full
 * (read + write, accepted as working) + 428 not full.
 * Imports contribute 2,982 full + 138 read-only; 5 test-only failures
 * were rechecked and are not defects.
 * See COMPATIBILITY.md, "Учётная градация владельца".
 * Comment only; import behavior is unchanged.
 */
(function(root){
'use strict';
const db=root.CAL_CATALOG;if(!db||!Array.isArray(db.entries)||!db.blobs)throw Error('CAL_CATALOG is not loaded');
const added=(root.CAL_ENTRIES_IMPORT||[]).slice();
const known=new Set(db.entries.filter(e=>e.ext==='cal').map(e=>e.sha));
const seen=new Set();
for(const e of added){if(known.has(e.sha)||seen.has(e.sha))throw Error('duplicate imported CAL: '+e.sha);seen.add(e.sha);}
for(const e of added)if(!db.blobs[e.sha])throw Error('missing imported CAL blob: '+e.sha);
db.entries.push(...added);
db.meta.entries=(db.meta.entries||0)+added.length;
db.meta.calculators=(db.meta.calculators||0)+added.length;
db.meta.uniqueCal=(db.meta.uniqueCal||0)+added.length;
db.meta.counts=db.meta.counts||{};db.meta.counts.cal=(db.meta.counts.cal||0)+added.length;
db.meta.sources=[...new Set([...(db.meta.sources||[]),'ETSmartUSB.rar'])];
db.meta.imported={source:'ETSmartUSB.rar',count:added.length};
root.CAL_ENTRIES_IMPORT=undefined;
})(globalThis);
