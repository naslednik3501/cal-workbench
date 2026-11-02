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
 constructor(text){this.ts=tokenize(text);this.p=0;this.depth=0;this.controls=[];this.groups=[];this.objects=[];this.names=new Map();this.variables=new Set();this.procs=new Map();}
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
  if(this.take('@'))target={kind:'memory',address:this.expr(11)};
  else{const name=this.need('id').v;if(this.take(';'))return {kind:'call',name};if(this.take('.'))target={kind:'property',name,property:this.need('id').v};else target={kind:'name',name};}
  this.need('=');const value=this.expr();this.need(';');return {kind:'assign',target,value};
 }
 parse(){this.need('size');const a=this.args();if(a.length!==2||a.some(x=>x.k!=='num'||x.v>10000))fail('неверный размер формы');this.need(';');this.need('form');this.form();
  while(this.peek().k!=='eof'){if(this.take(';'))continue;if(this.take('var')){do{this.variables.add(this.need('id').v);}while(this.take(','));this.need(';');continue;}
   this.procedure();}
  if(!['onshow','onapply','onchange'].some(k=>this.procs.has(k)))fail('не найдено обработчиков калькулятора');
  const validName=n=>this.names.has(n)||this.variables.has(n)||/^(var|str)\d+$/.test(n)&&Number(n.match(/\d+$/)[0])<256||['selstart','selend','bufsize','cursoradr','true','false'].includes(n);
  const visit=(n,depth=0)=>{if(depth>MAX_DEPTH*2)fail('слишком сложный исходник');if(!n||typeof n!=='object')return;if(n.kind==='name'&&!validName(n.name))fail('неизвестное имя '+n.name);if(n.kind==='call'&&!this.procs.has(n.name))fail('неизвестная процедура '+n.name);if(n.kind==='property'&&(!this.names.has(n.name)||!['color','bold','alignment'].includes(n.property)))fail('неизвестное свойство '+n.name+'.'+n.property);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>visit(x,depth+1));else if(v&&typeof v==='object')visit(v,depth+1);};
  for(const body of this.procs.values())body.forEach(n=>visit(n));
  const form={width:a[0].v,height:a[1].v,events:Object.fromEntries(['show','apply','change'].map(k=>[k,this.procs.has('on'+k)?0:65535])),controls:this.controls,groups:this.groups,objects:this.objects,codeStart:0};
  return {form,sourceProgram:{procedures:this.procs,names:this.names,variables:this.variables},bytes:new Uint8Array(),code:{},unsupported:[],executable:true,format:'text'};
 }
}
function parse(raw){if(raw.length>3*1048576)fail('файл слишком большой');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(raw);}catch{text=cp.decode(raw);}
 // CAL metadata precedes Size; only a section title, ! lines and comments are accepted there.
 text=text.replace(/^\uFEFF/,'').replace(/^\s*\[[^\r\n\]]*\]\s*/,'').replace(/^\s*![^\r\n]*$/gm,'');
 return new Parser(text).parse();
}
class SourceVM extends E.VM{
 constructor(program,dump){super({...program,sourceProgram:null},dump);this.program=program;this.variables=new Map([...program.sourceProgram.variables].map(n=>[n,0]));}
 clone(){const v=new SourceVM(this.program,this.buffer);if(this.scratch)v.scratch.set(this.scratch);v.r.set(this.r);v.s=[...this.s];v.controls=this.controls.map(c=>({...c}));v.logs=[...this.logs];v.variables=new Map(this.variables);return v;}
 execute(event,options={}){if(!['show','apply','change'].includes(event))fail('неизвестное событие');const source=this.program.sourceProgram,body=source.procedures.get('on'+event);if(!body)return {steps:0};let steps=0,calls=0;const start=Date.now(),limit=options.maxSteps??2000000;
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
  const statement=n=>{tick();switch(n.kind){case 'empty':return false;case 'return':return true;case 'block':return run(n.body);case 'if':return value(n.test)?statement(n.yes):n.no?statement(n.no):false;case 'while':while(value(n.test))if(statement(n.body))return true;return false;case 'call':if(++calls>128)fail('слишком глубокие вызовы');run(source.procedures.get(n.name));calls--;return false;case 'assign':{const t=n.target;const address=t.kind==='memory'?numeric(value(t.address)):null,v=value(n.value);if(t.kind==='name')set(t.name,v);else if(t.kind==='memory')this.write(address,numeric(v));else{const prop={color:1,bold:2,alignment:3}[t.property];this.property(source.names.get(t.name),(prop<<24)|(numeric(v)&0xffffff));}return false;}}fail('неизвестная команда');};
  run(body);return {steps};
 }
}
const api={parse,VM:SourceVM};root.CalSource=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
