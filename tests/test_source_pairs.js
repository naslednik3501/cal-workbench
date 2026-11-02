// Pinned same-name/source-form comparisons; documented source-version differences are retained.
// Both implementations are ours: this is not an original-iProg oracle.
const fs=require('fs'),assert=require('assert/strict'),E=require('../engine.js');require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const pairs=require('./fixtures/source-pairs.json'),out=[];let completed=0;
const program=sha=>E.parse(Buffer.from(CAL_CATALOG.blobs[sha],'base64'));
const view=v=>v.controls.map(c=>[c.value,c.text,c.color,c.bold,c.align]);
for(const pair of pairs){const a=program(pair.sourceSha),b=program(pair.binarySha),cases=[];
 for(const fill of [0,255,'pattern']){const dump=Uint8Array.from({length:pair.size},(_,i)=>fill==='pattern'?(i*17+23)&255:fill);
  function run(p){try{let v=new E.VM(p,dump).transaction('show',{maxSteps:500000}).vm;const show={buffer:Buffer.from(v.buffer),controls:view(v)};for(const o of p.form.controls)if('DHCB'.includes(o.type))v.input(o.id,o.type==='C'?Math.min(1,o.items.length-1):o.type==='B'?1:o.type==='H'?0x1234:123456);v=v.transaction('apply',{maxSteps:500000}).vm;return {show,apply:{buffer:Buffer.from(v.buffer),controls:view(v)}};}catch(e){return {error:e.message};}}
  const av=run(a),bv=run(b);let c={fill};if(av.error||bv.error){c.sourceError=av.error;c.binaryError=bv.error;}else{c.showBytes=av.show.buffer.equals(bv.show.buffer);c.applyBytes=av.apply.buffer.equals(bv.apply.buffer);c.showControls=JSON.stringify(av.show.controls)===JSON.stringify(bv.show.controls);c.applyControls=JSON.stringify(av.apply.controls)===JSON.stringify(bv.apply.controls);}cases.push(c);
 }
 assert.deepEqual(cases,pair.expected,pair.source+' vs '+pair.binary);out.push({...pair,cases});if(++completed%100===0)console.log('Compared',completed);
}
console.log({pairs:out.length,allCasesMatch:out.filter(p=>p.cases.every(c=>c.showBytes&&c.applyBytes&&c.showControls&&c.applyControls)).length,bytesMismatch:out.filter(p=>p.cases.some(c=>c.showBytes===false||c.applyBytes===false)).length,controlsMismatch:out.filter(p=>p.cases.some(c=>c.showControls===false||c.applyControls===false)).length,errors:out.filter(p=>p.cases.some(c=>c.sourceError||c.binaryError)).length});
