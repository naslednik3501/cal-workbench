/* Text CAL parser and bounded interpreter. Never evaluates JavaScript from CAL. */
(function(root){'use strict';
const E=root.CalEngine||(typeof require==='function'?require('./engine.js'):null),ErrorCAL=E.CalError;
const cp=new TextDecoder('windows-1251'),MAX_NODES=150000,MAX_DEPTH=150;
function fail(message,t){throw new ErrorCAL('Текстовый CAL: '+message+(t?' (строка '+t.line+')':''));}
function tokenize(text){
 const out=[];let p=0,line=1;
 while(p<text.length){let c=text[p];if(/\s/.test(c)){if(c==='\n')line++;p++;continue;}
  if(text.startsWith('//',p)){while(p<text.length&&text[p]!=='\n')p++;continue;}
  if(text.startsWith('/*',p)){const end=text.indexOf('*/',p+2);if(end<0)fail('незавершённый комментарий',{line});line+=(text.slice(p,end).match(/\n/g)||[]).length;p=end+2;continue;}
  const t={line};
  if(c==='"'){let s='';p++;while(p<text.length&&text[p]!=='"'){if(text[p]==='\n')line++;s+=text[p++];}if(p===text.length)fail('незавершённая строка',t);p++;out.push({...t,k:'str',v:s});}
  else{const rest=text.slice(p),m=/^(?:0x[0-9a-f]+|\d+)/i.exec(rest),id=/^[a-z_][a-z_0-9]*/i.exec(rest);
   if(m){const n=Number(m[0]);if(!Number.isSafeInteger(n)||n>0xffffffff)fail('число вне диапазона 32 бит',t);out.push({...t,k:'num',v:n});p+=m[0].length;}
   else if(id){out.push({...t,k:'id',v:id[0].toLowerCase()});p+=id[0].length;}
   else{const op=['==','!=','<=','>=','<<','>>','&&','||'].find(x=>rest.startsWith(x))||c;if(!'{}();,.+-*/%&|^~!<>=@#'.includes(op[0]))fail('неизвестный символ '+c,t);out.push({...t,k:op,v:op});p+=op.length;}
  }
  if(out.length>MAX_NODES)fail('слишком большой исходник');
 }
 out.push({k:'eof',v:'eof',line});return out;
}
const precedence={'||':1,'&&':2,'|':3,'^':4,'&':5,'=':6,'==':6,'!=':6,'<':7,'>':7,'<=':7,'>=':7,'<<':8,'>>':8,'+':9,'-':9,'*':10,'/':10,'%':10};
class Parser{
 constructor(text,{extraClosings=0}={}){this.extraClosings=extraClosings;this.removedClosings=0;this.ts=tokenize(text);this.p=0;this.depth=0;this.controls=[];this.groups=[];this.objects=[];this.names=new Map();this.variables=new Set();this.procs=new Map();}
 peek(){return this.ts[this.p];} take(k){const t=this.peek();if(t.k===k||t.k==='id'&&t.v===k){this.p++;return t;}return null;}
 need(k){const t=this.take(k);if(!t)fail('ожидалось '+k+', найдено '+this.peek().v,this.peek());return t;}
 node(n){return n;}
 expr(min=1){if(++this.depth>MAX_DEPTH)fail('слишком сложное выражение',this.peek());let t=this.peek(),n;
  if(this.take('(')){n=this.expr();this.need(')');}
  else if(this.take('num'))n={kind:'number',value:t.v};
  else if(this.take('str'))n={kind:'string',value:t.v};
  else if(this.take('#')){const f=this.need('id').v;if(!['b','w','d','i','c'].includes(f))fail('неизвестный формат #'+f,t);this.need('.');n={kind:'format',format:f,value:this.expr(11)};}
  else if(['@','-','+','~','!'].includes(t.k)){this.p++;n={kind:'unary',op:t.k,value:this.expr(11)};}
  else if(this.take('id'))n={kind:'name',name:t.v};
  else fail('ожидалось значение',t);
  while(precedence[this.peek().k]>=min){const op=this.peek().k;this.p++;n={kind:'binary',op,left:n,right:this.expr(precedence[op]+1)};}
  this.depth--;return n;
 }
 args(){this.need('(');const args=[];if(!this.take(')')){do{const t=this.peek();if(t.k==='num'||t.k==='str'||t.k==='id'){this.p++;args.push(t);}else fail('неверное описание поля',t);}while(this.take(','));this.need(')');}return args;}
 form(parent=null,depth=0){if(depth>MAX_DEPTH)fail('слишком глубокая форма');this.need('{');
  while(!this.take('}')){if(this.take(';'))continue;if(this.peek().k==='{'){this.form(parent,depth+1);continue;}
   if(parent===null&&this.peek().k==='id'&&['onshow','onapply','onchange'].includes(this.peek().v)){this.procedure();continue;}
   const t=this.need('id'),types={group:'G',label:'L',picture:'P',hexdigit:'H',digit:'D',combobox:'C',checkbox:'B'},type=types[t.v];if(!type)fail('неизвестное поле '+t.v,t);
   const a=this.args();const sig={G:'snnnn',L:'isnn',P:'isnnnn',H:'isnnnn',D:'isnnn',C:'isnnn',B:'isnn'}[type];
   if(a.length<sig.length||type!=='C'&&a.length!==sig.length)fail('неверное число параметров '+t.v,t);
   [...sig].forEach((s,i)=>{if(a[i].k!==({s:'str',n:'num',i:'id'}[s]))fail('неверный параметр '+t.v,a[i]);});
   const k=type==='G'?0:1,o={type,text:a[k].v,x:a[k+1].v,y:a[k+2].v,parent};if('GPHCD'.includes(type))o.width=a[k+3].v;if('GP'.includes(type))o.height=a[k+4].v;if(type==='H')o.digits=a[k+4].v;
   if(type==='C'){if(a.length<6||a.slice(5).some(x=>x.k!=='str'))fail('неверные пункты списка',t);o.items=a.slice(5).map(x=>x.v);}
   if(type==='G'){o.group=this.groups.length;this.groups.push(o);this.objects.push(o);this.form(o.group,depth+1);}
   else{if(this.names.has(a[0].v))fail('повторное имя поля '+a[0].v,a[0]);o.id=this.controls.length;o.name=a[0].v;this.names.set(o.name,o.id);this.controls.push(o);this.objects.push(o);this.take(';');}
   if(this.objects.length>2048)fail('слишком много полей');
  }
 }
 block(depth=0){if(depth>MAX_DEPTH)fail('слишком глубокая вложенность');this.need('{');const body=[];while(!this.take('}'))body.push(this.statement(depth+1));return body;}
 procedure(){const t=this.need('id');if(this.procs.has(t.v))fail('повторная процедура '+t.v,t);this.procs.set(t.v,this.block());}
 statement(depth){if(depth>MAX_DEPTH)fail('слишком глубокая вложенность',this.peek());const t=this.peek();if(this.take(';'))return {kind:'empty'};
  if(t.k==='{')return {kind:'block',body:this.block(depth)};
  if(this.take('if')){this.need('(');const test=this.expr();this.need(')');const yes=this.statement(depth+1),no=this.take('else')?this.statement(depth+1):null;return {kind:'if',test,yes,no};}
  if(this.take('while')){this.need('(');const test=this.expr();this.need(')');return {kind:'while',test,body:this.statement(depth+1)};}
  if(this.take('return')){this.need(';');return {kind:'return'};}
  let target;
  if(this.take('@')){target={kind:'memory',address:this.expr(11)};if(this.take('.')){const property=this.need('id');if(property.v!=='mismatch')fail('неизвестное свойство байта '+property.v,property);target.kind='mismatch';}}
  else{const name=this.need('id').v;if(this.take(';'))return {kind:'call',name};if(this.take('.'))target={kind:'property',name,property:this.need('id').v};else target={kind:'name',name};}
  this.need('=');const value=this.expr();this.need(';');return {kind:'assign',target,value};
 }
 parse(){this.need('size');const a=this.args();if(a.length!==2||a.some(x=>x.k!=='num'||x.v>10000))fail('неверный размер формы');this.need(';');this.need('form');this.form();
  while(this.peek().k!=='eof'){if(this.take(';'))continue;
   if(this.extraClosings>this.removedClosings&&this.take('}')){this.removedClosings++;continue;}if(this.take('var')){do{this.variables.add(this.need('id').v);}while(this.take(','));this.need(';');continue;}
   this.procedure();}
  if(this.removedClosings!==this.extraClosings)fail('исходник не совпадает с числом лишних скобок');
  if(!['onshow','onapply','onchange'].some(k=>this.procs.has(k)))fail('не найдено обработчиков калькулятора');
  const validName=n=>this.names.has(n)||this.variables.has(n)||/^(var|str)\d+$/.test(n)&&Number(n.match(/\d+$/)[0])<256||['selstart','selend','bufsize','cursoradr','true','false'].includes(n);
  const visit=(n,depth=0)=>{if(depth>MAX_DEPTH*2)fail('слишком сложный исходник');if(!n||typeof n!=='object')return;if(n.kind==='name'&&!validName(n.name))fail('неизвестное имя '+n.name);if(n.kind==='call'&&!this.procs.has(n.name))fail('неизвестная процедура '+n.name);if(n.kind==='property'&&(!this.names.has(n.name)||!['color','bold','alignment'].includes(n.property)))fail('неизвестное свойство '+n.name+'.'+n.property);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>visit(x,depth+1));else if(v&&typeof v==='object')visit(v,depth+1);};
  for(const body of this.procs.values())body.forEach(n=>visit(n));
  const form={width:a[0].v,height:a[1].v,events:Object.fromEntries(['show','apply','change'].map(k=>[k,this.procs.has('on'+k)?0:65535])),controls:this.controls,groups:this.groups,objects:this.objects,codeStart:0};
  return {form,sourceProgram:{procedures:this.procs,names:this.names,variables:this.variables},bytes:new Uint8Array(),code:{},unsupported:[],executable:true,format:'text'};
 }
}
// Reviewed originals with one unmatched final closing brace. The supplied SHA
// identifies the original; length/CRC also prevent accidental stale-SHA repair.
// No procedure or expression is removed, and the repaired program is parsed strictly.
const finalBraceRepairs=Object.freeze({
 '6df1bcd59ae4515b76fd96c01122bfc32efa5218350779fcbd7c043cb34d64da':[3232,23146],
 '8392a4ef79f8e356b5372a3c06d112890d5ca64e8a7802584365565bc5e731f2':[3232,64808],
 '536f5b44285e1b581f456526175015fbd98bc495d8e117118990991c6c1cd5a0':[4426,56298],
 '122917e0828da10de334cb170df256c0238c1ae03d38ed88d49ad6b0b1c21a08':[3229,58730],
 '9a31abd65e04c23ecde5e92140c9af992a533e95251740467c41f166025dad38':[3120,22648],
 'f6291c80f0a29e62627af1b1d7330ee5c8471540989f7ee68c5af11d66ca2199':[3332,4480],
 'b1a9cee8c33ae2a6618c9502e0f52767b4d8e6fe1680713648aadc8e9a676483':[4612,48414],
 'fe6eb1a4467138210a6fe4ae8dcacd92a46326952cb14160c61a295c32a2ff85':[4618,52559],
 '3e158243de8394cb9b7fd2a187cff5f5491822f93fcca516709e9ca0ad5121ae':[4329,24469],
 '2c93fdc39b703fa16bac621222a4680d5901416a2df48f973a485e3a2939c15d':[4329,37581],
 '421d829d82aead83980bf6b07c58cf5b7c48e5f1faade9718570dc3e98d92aba':[4323,32445],
 '6b85059c35ade8be9cabdb83e125422ecebee85f03da2a7e3284d22306165b44':[4022,31076],
 'fc73f45de8854227468abb7b6c45debd8c72c538155f8b16c9701f84db2c5c43':[4323,29684],
 '651b4f2722c7a873fd535ff231031a8cf436ebc8bf61a5b644c7231eb8da3e3a':[4032,22207],
 '8179e0c8d11000a0de30e806218d64195fbed5673eaf2b23ea0ebfd099597b1e':[4625,64191],
 'fc8b7ae31cad042a7bce7d0704d65ecb70ee6f7db932405d8b55d3c1f798ce37':[4221,47508],
 '6a2033bf21324fc1a524c6543e0deb3404857bfdd767451d9a332afb1d96180a':[4411,16036],
 'd89c622fcf2691be2f38953050182a29ca95ca8946102bcd874470a6bb0f4e3c':[4413,34816],
});
// T-012: exact-source evidence and required references are in reports/T-012-writers-2026-11-04.md.
// Preserve the original operations; no guessed login-copy repair or shift precedence.
// T-006: exact originals with redundant closing braces at top level only.
// Length/CRC and an exact count guard against stale caller-provided SHA values.
const topLevelBraceRepairs=Object.freeze({
 '2fe29b54c997f905fa737b0690ec881253eb7c0a28ba8c7750e6c649227abf00':[1669, 56323, 1],
 '7b980a37403c0f20f40bdf22a41c95f162d65bb257cd51d2ad7659a081d6f56f':[1680, 4555, 1],
 'a3fb4ac79b80993d6bdc9ca5a4014950dc4dd4407a21bcdb644e9db9a9447a68':[1672, 37814, 1],
 '268a83695dcbb8385b8524686da5835edb994a0e6566e521f3a6d49d68502e43':[1683, 42787, 1],
 'e0098cff725446d55d378be2be016f51a8684ddcce6b3d4ab57d625a12e174d0':[1679, 46760, 1],
 '2e9f8a7e81f06ff7063bd5aa641d80b2b12e9ffb61355a93a651dee6c1eb0ee6':[2599, 22485, 2],
 '22232dd142725b2fd8f774bbcbb7a838fbfb6bce6740363e89b25f45212ac3fe':[2321, 26318, 1],
 'ab663457a6c78d268ba7a80757ab334465abdae08fe8e73b09a3779ea66c0fe2':[2342, 38324, 1],
 '6422ccbc2c12235c38dd4dff37b5904f1e793753c9c3235dc847e94feba9b111':[4110, 12383, 1],
 'db8b519ba516ef497cc138332ca2181b9665033982449b9bea5cd34d55417dd0':[2469, 17014, 1],
});
const unverifiedWriters=Object.freeze({
 '5f74901d009f3bca42a60ae00125bc3278892358b61b35907bc8ae8648e6a7be':'Запись заблокирована: в оригинальном CAL OnApply меняет 0x32–0x3F, но OnShow сравнивает логин с неизменёнными 0x42–0x43. После смены логина оригинал отвергает собственный результат. Нужен исправленный авторский CAL или эталон записи iProg; алгоритм не изменён.',
 '3a0a0f5ca9f9f754c995da64ab6675914e4e306137d0023d92ac5fc2b047d32b':'Запись заблокирована: при текущем разборе Var6 >> 16 + Var6 оригинал формирует разные копии 0x00 и 0x20 и отвергает результат. Приоритет сдвига в iProg не подтверждён. Нужны правила языка, точная скомпилированная версия или эталон записи; алгоритм не изменён.',
 'ecde8e1579b3adee67eba279d1bbdcd2355104a634fb03d69edb3c1eeb23d520':'Запись заблокирована: при текущем разборе Var6 >> 16 + Var6 оригинал формирует разные копии 0x00 и 0x20 и отвергает результат. Приоритет сдвига в iProg не подтверждён. Нужны правила языка, точная скомпилированная версия или эталон записи; алгоритм не изменён.',
});
function parse(raw,{sha}={}){if(raw.length>3*1048576)fail('файл слишком большой');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(raw);}catch{text=cp.decode(raw);}
 // CAL metadata precedes Size; only a section title, ! lines and comments are accepted there.
 text=text.replace(/^\uFEFF/,'').replace(/^\s*\[[^\r\n\]]*\]\s*/,'').replace(/^\s*![^\r\n]*$/gm,'');
 const repair=Object.hasOwn(finalBraceRepairs,sha)?finalBraceRepairs[sha]:null;
 if(repair){if(raw.length!==repair[0]||E.crc16(raw)!==repair[1])fail('исходник не совпадает с профилем исправления');if(!/}\s*$/.test(text))fail('не найдено исправляемой скобки');text=text.replace(/}\s*$/,'');}
 const topRepair=Object.hasOwn(topLevelBraceRepairs,sha)?topLevelBraceRepairs[sha]:null;
 if(topRepair&&(raw.length!==topRepair[0]||E.crc16(raw)!==topRepair[1]))fail('исходник не совпадает с профилем исправления');
 const program=new Parser(text,{extraClosings:topRepair?topRepair[2]:0}).parse();
 if(topRepair)program.sourceRepairs=['Пропущены лишние закрывающие скобки верхнего уровня: '+topRepair[2]+'. Обработчики и выражения сохранены.'];if(repair)program.sourceRepairs=['Удалена одна лишняя завершающая скобка из известной версии CAL; оригинал сохранён.'];
 if(Object.hasOwn(unverifiedWriters,sha)){program.partial=true;program.writerBlockReason=unverifiedWriters[sha];program.eventErrors={apply:unverifiedWriters[sha]};program.validEvents=['show'];program.unsupported=['apply: '+unverifiedWriters[sha]];}
 return program;
}
class SourceVM extends E.VM{
 constructor(program,dump){super({...program,sourceProgram:null},dump);this.program=program;this.variables=new Map([...program.sourceProgram.variables].map(n=>[n,0]));this.mismatches=new Set();}
 clone(){const v=new SourceVM(this.program,this.buffer);if(this.scratch)v.scratch.set(this.scratch);v.r.set(this.r);v.s=[...this.s];v.controls=this.controls.map(c=>({...c}));v.logs=[...this.logs];v.variables=new Map(this.variables);v.mismatches=new Set(this.mismatches);return v;}
  execute(event,options={}){if(this.program.eventErrors?.[event])fail(this.program.eventErrors[event]);if(!['show','apply','change'].includes(event))fail('неизвестное событие');const source=this.program.sourceProgram,body=source.procedures.get('on'+event);if(!body)return {steps:0};let steps=0,calls=0;const start=Date.now(),limit=options.maxSteps??2000000;
  const tick=()=>{if(++steps>limit||(steps%4096===0&&Date.now()-start>2000))fail('превышен лимит выполнения');};
  const special={selstart:48,selend:49,bufsize:50,cursoradr:51};
  const numeric=v=>{if(typeof v!=='number'||!Number.isFinite(v))fail('ожидалось число');return v>>>0;};
  const bounded=s=>{s=String(s);if(s.length>65536)fail('слишком длинная строка');return s;};
  const get=n=>{if(n==='true')return 1;if(n==='false')return 0;if(source.names.has(n)){const id=source.names.get(n);return this.program.form.controls[id].type==='L'?this.controls[id].text:this.controls[id].value;}if(Object.hasOwn(special,n))return this.r[special[n]];if(/^var\d+$/.test(n))return this.r[Number(n.slice(3))];if(/^str\d+$/.test(n))return this.s[Number(n.slice(3))];if(this.variables.has(n))return this.variables.get(n);fail('неизвестное имя '+n);};
  const set=(n,v)=>{if(source.names.has(n)){const id=source.names.get(n),o=this.program.form.controls[id];if(o.type==='L')this.controls[id].text=bounded(v);else if('HDCB'.includes(o.type))this.controls[id].value=numeric(v);else fail('поле не поддерживает присваивание');}else if(Object.hasOwn(special,n))this.r[special[n]]=numeric(v);else if(/^var\d+$/.test(n))this.r[Number(n.slice(3))]=numeric(v);else if(/^str\d+$/.test(n))this.s[Number(n.slice(3))]=bounded(v);else if(this.variables.has(n))this.variables.set(n,numeric(v));else fail('неизвестное имя '+n);};
  const value=n=>{tick();switch(n.kind){case 'number':case 'string':return n.value;case 'name':return get(n.name);case 'format':{const v=numeric(value(n.value));if(n.format==='i')return String(v);if(n.format==='c')return cp.decode(new Uint8Array([v&255]));const width={b:2,w:4,d:8}[n.format],masked=width===2?v&255:width===4?v&65535:v;return masked.toString(16).toUpperCase().padStart(width,'0');}
   case 'unary':{const v=numeric(value(n.value));switch(n.op){case '@':return this.read(v);case '-':return -v>>>0;case '+':return v;case '~':return ~v>>>0;case '!':return Number(!v);}break;}
   case 'binary':{const a=value(n.left),b=value(n.right);if(n.op==='+'&&(typeof a==='string'||typeof b==='string')){if(typeof a!=='string'||typeof b!=='string')fail('для числа в строке нужен формат #i, #b, #w или #d');return bounded(a+b);}const x=numeric(a),y=numeric(b);switch(n.op){case '+':return x+y>>>0;case '-':return x-y>>>0;case '*':return Math.imul(x,y)>>>0;case '/':case '%':if(!y)fail('деление на ноль');return n.op==='/'?Math.floor(x/y):x%y;case '&':return (x&y)>>>0;case '|':return (x|y)>>>0;case '^':return (x^y)>>>0;case '<<':return x<<(y&31)>>>0;case '>>':return x>>>(y&31);case '=':case '==':return Number(x===y);case '!=':return Number(x!==y);case '<':return Number(x<y);case '>':return Number(x>y);case '<=':return Number(x<=y);case '>=':return Number(x>=y);case '&&':return Number(!!x&&!!y);case '||':return Number(!!x||!!y);}break;}
  }fail('неизвестное выражение');};
  const run=body=>{for(const n of body)if(statement(n))return true;return false;};
  const statement=n=>{tick();switch(n.kind){case 'empty':return false;case 'return':return true;case 'block':return run(n.body);case 'if':return value(n.test)?statement(n.yes):n.no?statement(n.no):false;case 'while':while(value(n.test))if(statement(n.body))return true;return false;case 'call':if(++calls>128)fail('слишком глубокие вызовы');run(source.procedures.get(n.name));calls--;return false;case 'assign':{const t=n.target;const address=['memory','mismatch'].includes(t.kind)?numeric(value(t.address)):null,v=value(n.value);if(t.kind==='name')set(t.name,v);else if(t.kind==='memory')this.write(address,numeric(v));else if(t.kind==='mismatch'){
   // An editor annotation on a BIN byte, separate from the byte value itself.
   this.address(address);const flag=numeric(v);if(flag>1)fail('mismatch должен быть 0 или 1');if(flag)this.mismatches.add(address);else this.mismatches.delete(address);
  }else{const prop={color:1,bold:2,alignment:3}[t.property];this.property(source.names.get(t.name),(prop<<24)|(numeric(v)&0xffffff));}return false;}}fail('неизвестная команда');};
  run(body);return {steps};
 }
}
const api={parse,VM:SourceVM};root.CalSource=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
