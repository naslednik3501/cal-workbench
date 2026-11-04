'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),E=require('../engine.js');
require('../catalog.js');for(const f of require('../catalog-parts.json'))require('../'+f);
const targets=require('./fixtures/t006-stage2.json');
const code=sha=>Buffer.from(CAL_CATALOG.blobs[sha],'base64');
function program(t){const b=code(t.sha);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),t.sha);return E.parse(b,{sha:t.sha});}
function fixture(t,seed=1){const size=t.family==='daewoo'?256:t.family==='accent'||t.family==='audi'?2048:4096;const b=Uint8Array.from({length:size},(_,i)=>(i*17+seed*13)&255);let expected;
 if(t.family==='honda'){b[0xf50]=0x12;b[0xf51]=0x3a;expected=0x123*(/miles/.test(t.paths[0])?64:94);}
 if(t.family==='audi'){b[0x326]=0;const w=65535-10000;b[0x57e]=t.sha.startsWith('85c29')?w>>>8:w&255;b[0x57f]=t.sha.startsWith('85c29')?w&255:w>>>8;expected=159000;}
 if(t.family==='vag'){b[0x80c]=0xca;b[0x80d]=0xf3;expected=100000;}
 if(t.family==='accent'){b[6]=0xca;b[7]=0xf3;expected=100000;}
 if(t.family==='daewoo'){for(const [i,a]of t.keyStarts.entries()){b[a-1]=0;for(let k=0;k<4;k++)b[a+k]=seed===0?0:seed===255?255:(seed*29+i*13+k*7)&255;}expected=t.keyStarts.map(a=>megamos(b.slice(a,a+4)));}
 return {input:b,expected};}
// Independent 64-bit construction of the literal source permutation, omitting
// the original display-delay loops from the oracle only (VM executes them).
function megamos(bytes){let frame=0x481ffn;const offsets=[54,49,44,39,34,29,24,19];const nib=[];for(let i=3;i>=0;i--)nib.push(bytes[i]&15,bytes[i]>>>4);
 const pop=n=>{let s=0;for(;n;n>>=1n)s+=Number(n&1n);return s;};
 nib.forEach((n,i)=>{const parity=(4-pop(BigInt(n)))%2;frame|=BigInt(n+parity*16)<<BigInt(offsets[i]);});
 const masks=[[0x00421084,0x21084200],[0x00842108,0x42108400],[0x01084210,0x84210800],[0x02108421,0x08421000]];
 masks.forEach(([hi,lo],i)=>{const word=((frame>>32n)&BigInt(hi))|(frame&BigInt(lo));frame|=BigInt(pop(word)%2)<<BigInt(59+i);});
 return Array.from({length:8},(_,i)=>Number((frame>>BigInt(i*8))&255n).toString(16).toUpperCase().padStart(2,'0')).join(' ');
}
function hondaExpected(input,distance,constant){const out=input.slice();if(distance>999900)return out;const n=Math.floor(distance/constant),lut=[0,13,7,10,14,3,9,4,1,12,6,11,15,2,8,5];let chk=5;for(let s=0;s<12;s+=4)chk=lut[((n>>>s)&15)^chk];chk^=(n>>>12)&15;for(let a=0xefc;a<0xf9c;a+=4){out[a]=(n>>>4)&255;out[a+1]=((n&15)<<4)|chk;}return out;}
function checks(){let vectors=0;for(const t of targets){const p=program(t);assert(p.executable);assert.throws(()=>E.parse(code(t.sha)));const broken=code(t.sha);broken[broken.length-1]^=1;assert.throws(()=>E.parse(broken,{sha:t.sha}),/профилем/);
 for(const seed of [0,1,255]){const {input,expected}=fixture(t,seed),before=input.slice(),v=new E.VM(p,input),shown=v.transaction('show').vm;
  assert.deepEqual(input,before);assert.deepEqual(shown.buffer,input);assert.deepEqual(v.buffer,input);
  if(t.family==='daewoo'){for(let i=0;i<4;i++){const id=p.sourceProgram.names.get('tdata'+(i+1));assert.equal(shown.controls[id].text,expected[i]);}assert.equal(p.partial,undefined);assert.deepEqual(shown.transaction('apply').vm.buffer,input);}
  else {assert.equal(shown.controls[0].value,expected);assert.equal(p.partial,true);assert.throws(()=>shown.transaction('apply'),/Запись заблокирована/);assert.deepEqual(shown.buffer,input);}
  vectors++;
 }
 if(t.family==='daewoo'){const input=fixture(t).input,absent=input.slice();absent.fill(255,t.keyStarts[0]-1,t.keyStarts[0]+4);const shown=new E.VM(p,absent).transaction('show').vm;assert.equal(shown.controls[p.sourceProgram.names.get('tdata1')].text,'Не опознан');assert.deepEqual(shown.buffer,absent);const invalid=new Uint8Array(256).fill(255),v=new E.VM(p,invalid).transaction('show').vm;assert(v.controls.some(c=>c.text==='Неверный дамп !'));assert.deepEqual(v.buffer,invalid);}
 if(t.family==='honda'){
  const research={...p,eventErrors:{},partial:false},constant=/miles/.test(t.paths[0])?64:94;
  for(const d of [0,constant,4095*constant,4096*constant,999900,999901]){const {input}=fixture(t),v=new E.VM(research,input).transaction('show').vm;v.input(0,d);const out=v.transaction('apply').vm,want=hondaExpected(input,d,constant);assert.deepEqual(out.buffer,want);assert.deepEqual(v.transaction('apply').vm.buffer,want);const read=new E.VM(research,out.buffer).transaction('show').vm.controls[0].value;if(d<=999900)assert.equal(read,(Math.floor(d/constant)%4096)*constant);if(d===4096*constant)assert.equal(read,0);assert.deepEqual(v.buffer,input);vectors++;}
  const v=new E.VM(research,fixture(t).input).transaction('show').vm;v.input(p.sourceProgram.names.get('constant'),0);assert.throws(()=>v.transaction('apply'),/ноль/);
 }
 const short=new Uint8Array(1),v=new E.VM(p,short);assert.throws(()=>v.transaction('show'),/границы/);assert.deepEqual(v.buffer,short);
 }
 assert.throws(()=>E.parse(Buffer.from('Size(1,1);Form{}OnShow{}else{}')),/else/);
 console.log(JSON.stringify({recovered:20,readOnlyWritersBlocked:14,fullOriginalHandlers:6,vectors,passed:true,scope:'synthetic source-derived expected values, unchanged algorithms and strict SHA guards'}));}
module.exports={targets,fixture,program};if(require.main===module)checks();
