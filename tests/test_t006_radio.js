'use strict';
// Exact original SHA profiles; synthetic EEPROMs, no hardware/iProg oracle.
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const targets=require('./fixtures/t006-radio-braces.json');
function kind(t){const p=t.paths[0];return /Mitsubishi/.test(p)?'mitsubishi':/Alpine/.test(p)?'alpine':/Renault/.test(p)?'renault':/Iveco/.test(p)?'iveco':'delco';}
function fixture(t,seed=1){const k=kind(t),size=k==='mitsubishi'?128:k==='alpine'?512:k==='delco'?256:k==='renault'&&!t.sha.startsWith('2223')?512:4096;const b=Uint8Array.from({length:size},(_,i)=>(i*37+seed*11)&255);let code;
 if(k==='mitsubishi'){[0,4,8,12].forEach((a,i)=>b[a]=0xa0+i+seed);b[16]=0;code=Array.from([0,4,8,12]).reduce((v,a)=>v*16+(b[a]&15),0);}
 if(k==='alpine'){b[0x189]=0x12;b[0x18a]=0x34;b[0x18b]=0x56;b[0x191]=0xed;b[0x159]=0;code=0x23456;}
 if(k==='renault'){const a=t.sha.startsWith('2223')?0xddf:0x1fd,s=a===0xddf?[0x50,0x30,0x49]:[0x56,0x46,0x31],base=a===0xddf?0:0x100;b.set(s,a);b[base+0x73]=0x34;b[base+0x74]=0x12;b[base+0x77]=1;code=0x1234;}
 if(k==='iveco'){b[0x1d5]=0x38;b.set([0x1c,0xc6,0x70,0x72],0x100);b[0x166]=0xba;code=0x1234;}
 if(k==='delco'){b.set(Buffer.from('SEZ4Z1'),0x52);b[0x28]=0x12;b[0x29]=0x34;code=0x1234;}
 return {input:b,code};
}
function expected(t,input,choice){const out=input.slice(),k=kind(t);if(k==='mitsubishi'&&choice)out[16]=3;
 if(k==='alpine'&&choice)for(const [a,b]of [[0x159,2],[0x15b,3],[0x15c,1],[0x161,0x1c],[0x16f,1],[0x187,0],[0x188,255]])out[a]=b;
 if(k==='renault'&&choice)out[t.sha.startsWith('2223')?0x77:0x177]=0;
 if(k==='iveco'){out[0x166]=choice?0xba:0xc6;out[0x167]=choice?0x79:0x5c;}return out;}
function program(t){const raw=Buffer.from(CAL_CATALOG.blobs[t.sha],'base64');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),t.sha);return E.parse(raw,{sha:t.sha});}
function checks(){let vectors=0;for(const t of targets){const p=program(t),raw=Buffer.from(CAL_CATALOG.blobs[t.sha],'base64');assert(p.executable);assert.equal(p.partial,undefined);assert.throws(()=>E.parse(raw));assert.throws(()=>E.parse(raw,{sha:'unknown'}));const changed=Buffer.from(raw);changed[changed.length-1]^=1;assert.throws(()=>E.parse(changed,{sha:t.sha}),/профилем/);
 for(const seed of [1,2,3]){const {input,code}=fixture(t,seed),before=input.slice(),shown=new E.VM(p,input).transaction('show').vm;assert.equal(shown.controls[0].value,code);assert.deepEqual(shown.buffer,input);
  for(const choice of [0,1]){const v=shown.clone(),control=p.form.controls.find(c=>'BC'.includes(c.type));if(control)v.input(control.id,choice);const out=v.transaction('apply').vm,want=expected(t,input,choice);assert.deepEqual(out.buffer,want);assert.deepEqual(v.buffer,input);assert.deepEqual(input,before);assert.equal(out.buffer.length,input.length);assert.deepEqual(v.transaction('apply').vm.buffer,want);assert.deepEqual(out.transaction('apply').vm.buffer,want);assert.equal(new E.VM(p,out.buffer).transaction('show').vm.controls[0].value,code);vectors++;}
 }
 if(kind(t)!=='mitsubishi'){const bad=new Uint8Array(4096),v=new E.VM(p,bad).transaction('show').vm;assert.equal(v.controls[0].value,0);if(kind(t)==='renault'||kind(t)==='iveco'){const out=v.transaction('apply').vm;assert.deepEqual(out.buffer,bad);}}
 const short=new Uint8Array(1),v=new E.VM(p,short);assert.throws(()=>v.transaction('show'),/границы/);assert.deepEqual(v.buffer,short);
 }
 assert.throws(()=>E.parse(Buffer.from('Size(1,1);Form{}OnShow{}}OnApply{}')));
 console.log(JSON.stringify({recovered:targets.length,vectors,passed:true,scope:'synthetic exact-byte checks and readback; strict unknown-source rejection preserved'}));}
module.exports={targets,fixture,expected,program,kind};if(require.main===module)checks();
