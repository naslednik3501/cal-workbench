'use strict';
// Exact original CALs and synthetic BINs; not an original-iProg/vehicle oracle.
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const targets=require('./fixtures/t013-targets.json').targets,profiles=require('./fixtures/t013-readers.json');
const readers=targets.filter(t=>profiles[t.sha]);
const raw=t=>Buffer.from(CAL_CATALOG.blobs[t.sha],'base64');
function family(t){const p=t.paths[0];return /0L72A/.test(p)?'chery-mcu':/Chery/.test(p)?'chery-ecu':/CD 70/.test(p)?'cd70':/Vectra/.test(p)?'vectra':/TMS 370/.test(p)?'tms':/Meriva/.test(p)?'meriva':/Berlingo/.test(p)?'berlingo':'passat';}
function fixture(t,pattern='ascii',flag=1){const k=family(t),size=k==='cd70'?8192:k==='berlingo'?4096:k==='chery-ecu'||k==='meriva'?1024:k==='passat'||k==='chery-mcu'?512:256;const b=Uint8Array.from({length:size},(_,i)=>pattern==='ascii'?48+(i%10):pattern);b[4]=flag;return b;}
function expected(t,b){const k=family(t),seq=(start,n)=>Array.from({length:n},(_,i)=>start+i),cp=new TextDecoder('windows-1251'),chars=as=>as.map(a=>cp.decode(new Uint8Array([b[a]]))).join(''),hex=as=>as.map(a=>b[a].toString(16).toUpperCase().padStart(2,'0')).join('');const text={};let pin,status;
 if(k==='chery-ecu'||k==='chery-mcu'){const at=k==='chery-ecu'?226:180,start=k==='chery-ecu'?110:190;pin=b[at]*256+b[at+1];text[3]='VIN: '+chars(seq(start,17));status=4;}
 if(k==='cd70'){pin=b[0];text[3]='CARPASS: '+chars(seq(687,4));text[4]='CARPASS: '+chars(seq(695,4));text[2]='SIMENS VDO '+chars([316,317]);status=5;}
 if(k==='vectra'){pin=b[0]*257;text[3]='VIN: '+chars(seq(65,17));text[2]='PIN: '+chars(seq(87,4));status=4;}
 if(k==='tms'){pin=b[0]*257;text[3]='VIN:  '+chars(seq(32,17));text[2]='PIN:    '+hex([133,134]);text[4]='GM:  '+chars(seq(1,8));status=5;}
 if(k==='meriva'){pin=b[0]*257;text[3]='VIN:  '+chars(seq(128,17));text[2]='PIN:    '+chars(seq(266,4));status=5;}
 if(k==='berlingo'){pin=b[0]*257;text[3]='ID: '+chars(seq(4022,10));text[2]='PIN: '+chars(seq(66,4));status=4;}
 if(k==='passat'){pin=b[0]*257;text[3]='  '+chars(Array.from({length:18},(_,i)=>420+(i^1)));text[2]='LOGIN:     0'+hex([504,505]);text[4]=':  '+chars(seq(1,8));status=5;}
 text[status]=b[4]?' Дамп OK.':' ';return {pin,checkbox:1,text};
}
function checkView(t,v,b){const x=expected(t,b);assert.equal(v.controls[0].value,x.pin);assert.equal(v.controls[1].value,x.checkbox);for(const [id,text]of Object.entries(x.text))assert.equal(v.controls[id].text,text,t.sha+' control '+id);}
function checks(){let vectors=0;assert.equal(readers.length,15);for(const t of targets)assert.equal(crypto.createHash('sha256').update(raw(t)).digest('hex'),t.sha);
 for(const t of readers){const bytes=raw(t),p=E.parse(bytes,{sha:t.sha}),profile=profiles[t.sha];assert(p.executable&&p.readOnly&&!p.partial);assert.deepEqual(p.validEvents,['show']);assert.deepEqual(p.absentEvents,['apply']);assert.deepEqual(p.bytes,E.decode(bytes));assert.equal(p.form.events.apply,profile.apply);assert.deepEqual(p.eventImplicitReturnPcs.show,[profile.terminal]);assert.equal(p.eventTermination.show,'string-boundary');assert.equal(Object.values(p.code).filter(i=>i.op===0x1f).length,0);
  for(const opt of [{},{sha:'unknown'},{sha:t.sha,skipEventProfiles:true}]){const strict=E.parse(bytes,opt);assert(!strict.executable);assert.match(strict.eventErrors.show,/строковые данные/);}
  assert.throws(()=>E.parse(Buffer.concat([bytes,Buffer.from(' ')]),{sha:t.sha}),/профилем событий/);
  for(const pat of [0,255,'ascii'])for(const flag of [0,1]){const input=fixture(t,pat,flag),snapshot=input.slice(),v=new E.VM(p,input),out=v.transaction('show').vm;checkView(t,out,input);assert.deepEqual(out.buffer,input);assert.deepEqual(v.buffer,input);assert.deepEqual(input,snapshot);checkView(t,out.transaction('show').vm,input);assert.throws(()=>out.transaction('apply'),/отсутствует в оригинальном CAL/);assert.deepEqual(out.buffer,input);vectors++;}
  const short=new Uint8Array(1),v=new E.VM(p,short);assert.throws(()=>v.transaction('show'),/границы/);assert.deepEqual(v.buffer,short);
 }
 const inv=targets.find(t=>t.sha.startsWith('7498')),p=E.parse(raw(inv),{sha:inv.sha});assert(!p.executable);assert.equal(p.bytes.length,288);assert.equal(p.form.events.show,1379);assert.equal(p.form.events.apply,194);assert.throws(()=>new E.VM(p,new Uint8Array(131072)),/адрес события show/);
 console.log(JSON.stringify({targets:16,readerRecovered:15,writerRecovered:0,blocked:1,vectors,passed:true,scope:'exact original data, independent source-derived values, both conditional exits, unchanged BIN and strict unknown-source bounds'}));
}
module.exports={targets,readers,raw,family,fixture,expected,checkView};if(require.main===module)checks();
