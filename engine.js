/* Independent CAL bytecode reader/runtime. Format reference: local iProgDecompiler.
   No eval, native program execution, hardware access or network calls. */
(function(root){'use strict';
const MAX_CODE=1048576, MAX_STEPS=2000000;
const cp=new TextDecoder('windows-1251');
class CalError extends Error {}
class Reader {
 constructor(bytes,p=0){this.b=bytes;this.p=p;}
 u8(){if(this.p>=this.b.length)throw new CalError('Неожиданный конец CAL');return this.b[this.p++];}
 u16(){return this.u8()+this.u8()*256;}
 u32(){return (this.u16()+this.u16()*65536)>>>0;}
 text(key){let a=[];for(let n=0;n<65536;n++){let b=this.u8()^key;if(!b)return {value:cp.decode(new Uint8Array(a)),key};a.push(b);if(b!==13)key=(key+1)&255;}throw new CalError('Слишком длинная строка');}
}
function crc16(a){let c=65535;for(const b of a){c^=b<<8;for(let k=0;k<8;k++)c=((c<<1)^((c&32768)?0x1021:0))&65535;}return c;}
function decode(raw){
 if(raw.length>MAX_CODE*3)throw new CalError('CAL слишком большой');
 const text=new TextDecoder().decode(raw).replace(/^\uFEFF/,'').replace(/\s/g,'');
 if(!/^[0-9a-f]+$/i.test(text)||text.length%2)throw new CalError('Исходный текст, внешняя программа или другой формат: исполнение пока не поддерживается');
 const a=Uint8Array.from(text.match(/../g),x=>parseInt(x,16));
 if(a.length<64||a.length%32)throw new CalError('Некорректная длина блоков CAL');
 let len=a.length-32, crc=a[len]*256+a[len+1];
 const table=[31,14,29,12,27,10,25,8,23,6,21,4,19,2,17,5],seen=new Set();let decodedBytes=0;
 function attempt(sn,extended=false){
  const x=table[sn&15],initial=((x*((sn>>8)^sn))^(crc>>8)^crc)&255,key=x*256+initial;
  if(seen.has(key))return null;seen.add(key);let z=initial;
  const first=new Uint8Array(32);for(let i=0;i<32;i++){first[i^x]=a[i]^z;z=(z+85)&255;}
  if(extended){for(const at of [0,2,4]){const ep=first[at]+first[at+1]*256;if(ep!==65535&&(ep<12||ep>=len))return null;}if(first[8]+first[9]*256>10000||first[10]+first[11]*256>10000)return null;}
  decodedBytes+=len;if(decodedBytes>64*MAX_CODE)throw new CalError('Превышен лимит проверки кодирования CAL');
  const b=new Uint8Array(len);b.set(first);for(let p=32;p<len;p+=32)for(let i=0;i<32;i++){b[p+(i^x)]=a[p+i]^z;z=(z+85)&255;}
  if(crc16(b)!==crc)return null;
  if(extended){try{parseForm(b);}catch{return null;}}
  return b;
 }
 for(const sn of [1,777,19,35,45,55,325,2048,49339]){const b=attempt(sn);if(b)return b;}
 // The 16-bit parameter collapses to a small set of (permutation, XOR seed)
 // combinations. Probe each once, rejecting implausible headers before full CRC.
 let match=null;
 for(let sn=0;sn<65536;sn++){const b=attempt(sn,true);if(b){if(match&&b.some((v,i)=>v!==match[i]))throw new CalError('Неоднозначное кодирование CAL');match=b;}}
 if(match)return match;
 throw new CalError('Кодирование не распознано или контрольная сумма CAL не совпала');
}
function parseForm(b){
 const r=new Reader(b),events={show:r.u16(),apply:r.u16(),change:r.u16()},reserved=r.u16();
 const width=r.u16(),height=r.u16(),controls=[],groups=[];let stack=[],objects=[];
 if(width>10000||height>10000)throw new CalError('Некорректные размеры формы');
 while(true){
  if(objects.length>2048)throw new CalError('Слишком много элементов формы');
  let c=r.u8();if(c===255)break;
  let type=String.fromCharCode(c);
  if(type==='g'){if(!stack.length)throw new CalError('Нарушена вложенность формы');stack.pop();continue;}
  if(!'GLPHBCD'.includes(type))throw new CalError('Неподдержанный элемент формы: '+type+' (0x'+c.toString(16)+')');
  let t=r.text(c),o={type,text:t.value,x:r.u16(),y:r.u16(),parent:stack.at(-1)??null};
  if('GPHCD'.includes(type))o.width=r.u16();
  if('GP'.includes(type))o.height=r.u16();
  if(type==='H')o.digits=r.u16();
  if(type==='C')o.items=r.text(t.key).value.split('\r');
  if(type==='G'){o.group=groups.length;groups.push(o);objects.push(o);stack.push(o.group);}
  else{o.id=controls.length;controls.push(o);objects.push(o);}
 }
 if(stack.length)throw new CalError('Незакрытая группа формы');
 for(const [k,ep] of Object.entries(events))if(ep!==65535&&(ep<r.p||ep>=b.length))throw new CalError('Некорректный адрес события '+k);
 return {events,reserved,width,height,controls,groups,objects,codeStart:r.p};
}
const layouts={};
for(let op=0;op<=0x4f;op++)layouts[op]='bb';
for(const op of [1,5,7,9,11,13,15,17,19,0x23,0x24,0x25,0x39,0x44,0x4d])layouts[op]='bd';
for(const op of [0x15,0x17])layouts[op]='bb';
for(let op=0x18;op<=0x1d;op++)layouts[op]='bbw';
for(const op of [0x1e,0x4b])layouts[op]='w';layouts[0x1f]='';
layouts[0x27]='db';layouts[0x28]='db';
for(const op of [0x2a,0x2c,0x2e,0x30,0x32,0x34,0x36,0x38,0x43,0x46,0x48,0x4a])layouts[op]='bw';
layouts[0x35]='b';layouts[0x4f]='b';
function stringAt(b,at){const r=new Reader(b,at),first=r.u8()^128,a=[first];for(let n=0;n<65536;n++){let v=r.u8()^first;if(!v)return {text:cp.decode(new Uint8Array(a)),end:r.p};a.push(v);}throw new CalError('Незавершённая строка');}
// Explicitly reviewed scratch-memory contract for the original RAR source.
// The caller supplies the catalog/import SHA; unknown CALs retain strict BIN bounds.
const memoryProfiles=Object.freeze({
 'a0a66442b874d649d9ee00c3bbe5a9a859567cd50ab5a3b7771a6c12bb119956':Object.freeze({dumpBytes:2048,start:0x2000,length:2048})
});
function parse(raw,{sha}={}){
 if(raw.length>MAX_CODE*3)throw new CalError('CAL слишком большой');
 const sourceText=cp.decode(raw).replace(/^\uFEFF/,'');
 if(/\bSize\s*\(/i.test(sourceText)&&/\bForm\s*\{/i.test(sourceText)){
  const source=root.CalSource||(typeof require==='function'?require('./cal-source.js'):null);
  if(!source)throw new CalError('Не загружен обработчик текстовых калькуляторов');
  const program=source.parse(raw);if(Object.hasOwn(memoryProfiles,sha))program.memory=memoryProfiles[sha];return program;
 }
 const bytes=decode(raw),form=parseForm(bytes),code={},occupied=new Map(),strings=[],pending=Object.values(form.events).filter(x=>x!==65535),unsupported=new Set();
 function control(id){if(!form.controls[id])throw new CalError('Ссылка на отсутствующий элемент '+id);}
 while(pending.length){let pc=pending.pop();if(code[pc])continue;
  if(pc<form.codeStart||pc>=bytes.length)throw new CalError('Переход за границы кода');
  const r=new Reader(bytes,pc),op=r.u8();if(layouts[op]===undefined)throw new CalError('Неизвестная команда 0x'+op.toString(16));
  const args=[...layouts[op]].map(x=>x==='b'?r.u8():x==='w'?r.u16():r.u32());
  for(let i=pc;i<r.p;i++){if(occupied.has(i)&&occupied.get(i)!==pc)throw new CalError('Переход внутрь команды');occupied.set(i,pc);}
  let ins={pc,op,args,next:r.p};code[pc]=ins;
  if([0x43,0x44,0x4c,0x4d,0x4f].includes(op))unsupported.add('Команда 0x'+op.toString(16)+' ещё не проверена');
  if(op===0x36){let s=stringAt(bytes,args[1]);ins.text=s.text;strings.push([args[1],s.end]);}
  if([2].includes(op))control(args[1]);
  if([3,0x24,0x25,0x26,0x42].includes(op))control(args[0]);
  if(op===0x25&&![1,2,3].includes(args[1]>>>24))unsupported.add('Неизвестное свойство элемента');
  if(op===0x1e)pending.push(args[0]);
  else if(op!==0x1f){pending.push(r.p);if(op>=0x18&&op<=0x1d)pending.push(args[2]);if(op===0x4b)pending.push(args[0]);}
 }
 for(const [start,end] of strings)for(let i=start;i<end;i++)if(occupied.has(i))throw new CalError('Строка пересекает исполняемый код');
 // These special registers depend on host editor state and are initialized explicitly by VM.
 return {bytes,form,code,unsupported:[...unsupported],executable:unsupported.size===0};
}
class VM {
 constructor(program,dump){
  if(program.sourceProgram){const source=root.CalSource||(typeof require==='function'?require('./cal-source.js'):null);return new source.VM(program,dump);}
  if(!program.executable)throw new CalError(program.unsupported.join('; '));
  if(!dump.length||dump.length>16777216)throw new CalError('Размер BIN должен быть от 1 байта до 16 МиБ');
  if(program.memory&&dump.length!==program.memory.dumpBytes)throw new CalError('Для этой версии CAL нужен BIN ровно '+program.memory.dumpBytes+' байт');
  this.program=program;this.buffer=dump.slice();this.scratch=program.memory?new Uint8Array(program.memory.length):null;this.r=new Uint32Array(256);this.r[50]=dump.length;this.r[49]=dump.length-1;
  this.s=Array(256).fill('');this.controls=program.form.controls.map(o=>({value:0,text:o.text,color:null,bold:false,align:'left'}));this.logs=[];
 }
 clone(){const v=new VM(this.program,this.buffer);if(this.scratch)v.scratch.set(this.scratch);v.r.set(this.r);v.s=[...this.s];v.controls=this.controls.map(c=>({...c}));v.logs=[...this.logs];return v;}
 address(a){if(!Number.isInteger(a)||a<0||a>=this.buffer.length)throw new CalError('Выход за границы BIN: 0x'+a.toString(16));return a;}
 scratchAddress(a){const m=this.program.memory;return m&&Number.isInteger(a)&&a>=m.start&&a<m.start+m.length?a-m.start:-1;}
 read(a){const s=this.scratchAddress(a);return s>=0?this.scratch[s]:this.buffer[this.address(a)];}
 write(a,b){const s=this.scratchAddress(a);if(s>=0)this.scratch[s]=b&255;else this.buffer[this.address(a)]=b&255;}
 property(id,v){const c=this.controls[id],type=v>>>24,value=v&0xffffff;if(type===1)c.color=value;else if(type===2)c.bold=!!value;else if(type===3){if(value>2)throw new CalError('Неизвестное выравнивание');c.align=['left','center','right'][value];}else throw new CalError('Неизвестное свойство формы');}
 input(id,value){const o=this.program.form.controls[id];if(!o||!'HDCB'.includes(o.type))throw new CalError('Поле недоступно для ввода');if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new CalError('Число должно быть целым от 0 до 4294967295');if(o.type==='C'&&value>=o.items.length)throw new CalError('Неверный пункт списка');if(o.type==='B'&&value>1)throw new CalError('Неверное значение флажка');this.controls[id].value=value;}
 execute(event,options={}){
  let pc=this.program.form.events[event];if(pc===undefined)throw new CalError('Неизвестное событие');if(pc===65535)return {steps:0};
  const r=this.r,s=this.s,c=this.controls,stack=[],limit=options.maxSteps??MAX_STEPS,start=Date.now();let steps=0;
  function div(a,b){if(!b)throw new CalError('Деление на ноль');return Math.floor(a/b);}
  const append=(id,t)=>{s[id]+=t;if(s[id].length>65536)throw new CalError('Лимит длины строки');};
  while(true){
   if(++steps>limit||(steps%4096===0&&Date.now()-start>2000))throw new CalError('Превышен лимит выполнения');
   const i=this.program.code[pc];if(!i)throw new CalError('Переход на недопустимую команду');
   const op=i.op,[a,b,d]=i.args;pc=i.next;
   if(op>=4&&op<=0x17){let x=r[a],y=(op%2===0)?r[b]:b;switch(op>>1){case 2:r[a]=x+y;break;case 3:r[a]=x-y;break;case 4:r[a]=div(x,y);break;case 5:if(!y)throw new CalError('Деление на ноль');r[a]=x%y;break;case 6:r[a]=Math.imul(x,y);break;case 7:r[a]=x&y;break;case 8:r[a]=x|y;break;case 9:r[a]=x^y;break;case 10:r[a]=x>>>(y&31);break;case 11:r[a]=x<<(y&31);break;}continue;}
   if(op>=0x18&&op<=0x1d){let x=r[a],y=r[b];if([x===y,x!==y,x>y,x<y,x>=y,x<=y][op-0x18])pc=d;continue;}
   switch(op){
    case 0:r[a]=r[b];break;case 1:case 0x29:case 0x2a:r[a]=b;break;case 2:r[a]=c[b].value;break;case 3:c[a].value=r[b];break;
    case 0x1e:pc=a;break;case 0x1f:if(stack.length)pc=stack.pop();else return {steps};break;
    case 0x20:this.write(r[a],r[b]);break;case 0x21:this.write(r[a],b);break;case 0x22:r[a]=this.read(r[b]);break;case 0x23:r[a]=this.read(b);break;
    case 0x24:c[a].value=b;break;case 0x25:this.property(a,b);break;case 0x26:this.property(a,r[b]);break;
    case 0x27:this.write(a,r[b]);break;case 0x28:this.write(a,b);break;
    case 0x2b:case 0x2c:r[a]+=b;break;case 0x2d:case 0x2e:r[a]-=b;break;case 0x2f:case 0x30:r[a]=div(r[a],b);break;
    case 0x31:case 0x32:r[a]=Math.imul(r[a],b);break;case 0x33:case 0x34:if(!b)throw new CalError('Деление на ноль');r[a]%=b;break;
    case 0x35:s[a]='';break;case 0x36:append(a,i.text);break;
    case 0x37:case 0x38:case 0x39:append(a,(b>>>0).toString(16).toUpperCase().padStart([2,4,8][op-0x37],'0'));break;
    case 0x3a:append(a,cp.decode(new Uint8Array([b])));break;case 0x3b:append(a,String(b));break;
    case 0x3c:case 0x3d:case 0x3e:{let len=[2,4,8][op-0x3c],v=r[b];if(len===2)v&=255;if(len===4)v&=65535;append(a,v.toString(16).toUpperCase().padStart(len,'0'));break;}
    case 0x3f:append(a,String(r[b]));break;case 0x40:append(a,cp.decode(new Uint8Array([r[b]&255])));break;case 0x41:append(a,s[b]);break;case 0x42:c[a].text=s[b];break;
    case 0x45:case 0x46:r[a]&=b;break;case 0x47:case 0x48:r[a]|=b;break;case 0x49:case 0x4a:r[a]^=b;break;
    case 0x4b:if(stack.length>=256)throw new CalError('Переполнение стека');stack.push(pc);pc=a;break;case 0x4e:s[a]=s[b];break;
    default:throw new CalError('Неподдержанная команда 0x'+op.toString(16));
   }
  }
 }
 transaction(event,options={}){const v=this.clone();const result=v.execute(event,options);return {vm:v,...result};}
}
function diff(a,b){if(a.length!==b.length)throw new CalError('Изменился размер BIN');const ranges=[];let count=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){count++;let last=ranges.at(-1);if(last&&last.end===i)last.end++;else ranges.push({start:i,end:i+1});}return {count,ranges};}
const api={decode,parse,parseForm,crc16,VM,CalError,diff};if(typeof module!=='undefined')module.exports=api;root.CalEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
