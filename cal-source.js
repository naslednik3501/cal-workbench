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
 constructor(text,{extraClosings=0,closeOuterForm=false}={}){this.closeOuterForm=closeOuterForm;this.closedOuterForm=false;this.extraClosings=extraClosings;this.removedClosings=0;this.ts=tokenize(text);this.p=0;this.depth=0;this.controls=[];this.groups=[];this.objects=[];this.names=new Map();this.variables=new Set();this.procs=new Map();}
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
  while(!this.take('}')){if(depth===0&&this.closeOuterForm&&this.peek().k==='eof'){this.closedOuterForm=true;break;}if(this.take(';'))continue;if(this.peek().k==='{'){this.form(parent,depth+1);continue;}
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
 procedure(){const t=this.need('id');if(t.v==='else')fail('else без соответствующего if',t);if(this.procs.has(t.v))fail('повторная процедура '+t.v,t);this.procs.set(t.v,this.block());}
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
  if(this.closeOuterForm&&!this.closedOuterForm)fail('не найден незакрытый внешний Form');
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
 'd20c466d1b53a7c8396c85c3f386a9b94382d0e32f2e1f5e13de96039f85a95b':[3830, 7390, 1],
 '21192efbfa431fc5f303357ce13af1eb3c32de2e7ab70715f36d1a35b752652d':[3824, 60152, 1],
 '40fd400d053de6d366f947364d07daaeee51a6931bf704fd2ca52de690448ebf':[15044, 25316, 1],
 '78ff5aa6157668fb144f6042cb2f3e2b5eefb818a83da6ad0b9c88d226a3becf':[15024, 34003, 1],
 'db469036905e3875444fa6e3d0f3fd4413c72dfb8a0171ce38147680aebd7434':[15010, 10224, 1],
 '64e12bb4c92b08b1ea9975f6e081d8c3d8b46c34d167898e0ace488c3635ef25':[15012, 44995, 1],
 '193209b8cc7a72196a8b84fb01a0dee20b06e875f68494596397d0b372394060':[15010, 9964, 1],
 '9b917bb49257287c892b39ebf029eecb0f8904a3ca710c86cd52b021d4ce1c07':[15015, 3830, 1],

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
// T-006: structural container repairs; all original operations remain parsed.
const formRepairs=Object.freeze({
 'de9adb817e522093fdac9f8a841cc1430461110abf2751d11ced40bb1b664d3e':[47555, 10674, "outer-form-eof"],
 'af87798d2870aad676984920b492d72f8427ef304ff21014477e24217c390b90':[47557, 17371, "outer-form-eof"],
 '97a93a56215f7d5bd60a4b86b25c1793bfb02a8dd3b01160a86a44593a0c9bb5':[47567, 29589, "outer-form-eof"],
 '3fe02b9bb8a1d59c3cf562a33fc0deb44b7fb7e37b82e2cad075d761f6f7d23f':[47570, 64590, "outer-form-eof"],
 'e5e921a649aa76fef1c8f055c713bebbcefbe056ed286242e0f8255a10dbda7c':[47315, 16537, "outer-form-eof"],
 'fabf6b54e364d707d6df4510f7950deea097059336e5c477f3365e5357e73742':[47568, 41303, "outer-form-eof"],
 'e7fd2460972d2741a612709424218851a097a2d236f371cc41605cc9ae219ca6':[2892, 22694, "outer-form-eof"],
 '558b8b91314f9f5ee85113f291d3036db24aa43c022428dc3700e5d9a1aac88c':[2245, 11451, "duplicate-form"],
 'e4078a63ad3b0dc2c2bfd46f787632ebf518ed2ce4b88cc7a7631c0e660f3c4c':[2255, 35292, "duplicate-form"],
 '85c29f98a4029a9ee892f205f12190e95a8e59d5d2e34fc53c26eae2797b97a3':[2250, 18628, "duplicate-form"],
 '95abc3363193b5b470179159dac0d54a0b9ec5e0d522dbf2f2e74a303e13d160':[47559, 29007, "outer-form-eof"],
 '405bb8c731b7160952f95969e52fa865f3c4517d1288a3056fb7fffa9cccb314':[47567, 5741, "outer-form-eof"],
"5d3836f45b7773fe71a4005ea3cd51e09b4af80ee6ce07e0bcd9729112b589de":[4916,10557,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/Asia/Suzuki/Jimny 68HC908AZ60A.cal
"d1721c0a84af22c0e6695f3755a3fc78b29207c2c014aba0c91dd86d2b5a134b":[1749,63150,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/Audi/A6VDO9366.cal
"a89665f36245a01e37a6ecbc75815c514823d3bfc83df239ab606590b565f31e":[2234,2431,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/CRYPTO/Audi/A8 VDO 93C86 V1.cal
"789de0fbd4ee35caba54e952a51c81c3a909a0b1c9a12957dcf0969624805371":[4286,27552,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Alfa Romeo/146 68HC05B16.cal
"9d6c5ebee7ff18133016859cc35d7a7f942f3b59841cbadee0a3286b71850af8":[5455,49061,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Alfa Romeo/156 68HC11KG4.cal
"b8751d9ee9f02fe2be52bd4ee19fc754ad2db4a5ddcacb5fe7e9bc46248d909b":[4428,2811,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Alfa Romeo/164 68HC05B16.cal
"4dd2a7d62d974e2e917776aabdcae75cd96ab0108c84faf89c3d2d9baa2e29ce":[5443,10799,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Alfa Romeo/166 68HC11KG4.cal
"379d36a7aefe6302737779f34b53b01625aedea47d0f9ecf8d6f4148bc87d4eb":[2548,46279,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Alfa Romeo/166 93C56.cal
"2f3128573a19db130f6b90987b05eff9d8bab67973a7decabbf8039bc13a08ca":[4412,50848,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Alfa Romeo/GTV 68HC05B16.cal
"823b89aa873177b7e8b116ab9d74511307591c9e3c0e12c86b95c9bde215a6cc":[2203,23721,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A3 UKNSI 93C56.cal
"7bb1d1fed4d97c37da280221c9653f025ac809c05ab3cdc7c6fecb39894a6be8":[2148,21482,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A3 VDO 93C66.cal
"e34c79f4ee8c9f4547af9af94ed1d3b8a12df41e1cfd8e9b2cd9f76b7f78056a":[2141,46963,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A4 BOSCH 24C08 no crypt.cal
"79c867ef9e4e5d738b2f688c1ed95a9fb3e17b5629ecb05a200ae5e2249ab9e8":[13226,57617,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A4 MM73 912dg128.cal
"aa635efc46f6e62d06c59551f897913b8d011082a006c94edb2110a426eaadf5":[2148,38926,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A4 VDO 93C66.cal
"66835f93d518a55f9311f6419bd13e8ccabf7ba0cbf6f8197206e30eaa902a64":[13226,9587,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A6 MM73 912dg128.cal
"62afa2dd0c7acf41ca1f7ac13c8c930d4902d2fd0c234feb07efa8d1cea7f155":[2881,14653,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A6 VDO 93C66 type1.cal
"7c6980956dd33b290363e685e2459837845457cb9193e4a0ae851f41f3261e36":[3032,18523,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A6 VDO 93C66 type2.cal
"9447bdb271185fe9fc8bc0ec39f2054b05c585404de6dbd2be440163601ceca3":[2148,41941,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A6 VDO 93C86 no crypt.cal
"d654caa5de20c6b577370dcdcada9b21786c122285326d0ababdb0bff00f85a6":[2197,4938,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/A8 VDO 93C66.cal
"2d3587033f4e6d09bad07131013d94bec1bec4cd67d7b4110acb77f5d27f87e8":[13142,37366,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/TT MM73 912D60.cal
"13dcf9da9aafd4088d1d6aecbf223fbbe32ee561ea4394bbe37c227fea288f79":[13237,37635,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Audi/TT MM73 912dg128.cal
"0eda2fb3a2ce2502116f8133765b9977f5376594227829d62e10146f696b1958":[2369,58875,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Cadillac/CTS 93C66 v2.cal
"bcc9c2725033b12ddadc91367dfe2e9299d5efde7118b442b3d5a154b608dbdb":[2656,56215,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Cadillac/SRX 93C66.cal
"9b6c4cc3d2a41b35c2a6874920b2d5a1c8125405ab6c234e856e507245b3813a":[4866,63159,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Citroen/Jumpy 68HC908AZ32.cal
"8f44091bb97c3a5be12dca7de5bfc71bb0dda239e10afacfca5f4f5eb823add2":[4476,9873,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Fiat/Brava 68HC05B16.cal
"9e2378f106831e97b27a5ba399d7c678012512179fe52c25f2902f48d2a133c1":[5447,33107,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Fiat/Brava 68HC711KG4.cal
"cd5033a6c60a111edac7724e96661a5cfefbb9bf73d1dfe5cf8fbd00894c8871":[4833,55555,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Fiat/Brava 68HC908AZ32.cal
"11649ed12c8c043c7e4e9487aa7a0ac194043aba7e080852b610beb15a3fc0f5":[4420,10974,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Fiat/Marea 68HC05E6.cal
"03e3d2092f2280a1889e6489974a812480580860c14f6eb211978bc7cc9b89e5":[5447,11039,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Fiat/Marea 68HC711KG4.cal
"aa87d10a3acd8471b9ea0f9bea770113b5b752c7ae7433ee77402588c800aa8f":[4833,30673,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Fiat/Marea 68HC908AZ32.cal
"60b3106eaff9778e1cb0924cc123975dd731dac39ee5075f1cb3c3f7191360ee":[4872,10742,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Fiat/Scudo 68HC908AZ32.cal
"e1a491f0345052b44e29ea7c739ea977618056df8dcbf8c4015de3f8f7380ec8":[1501,6712,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Opel/Frontera DELCO 93C46.cal
"a6226d8ed54b753a93a9a362b71742269bfefa3ac017069debf6db671e9ec77c":[1557,12330,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Opel/Monterey 93C46.cal
"78f3a5bec30e319be9e11f3efbcd6191564033aeae03aa598aac9110bee1d7ba":[1555,33169,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Opel/Montery 93C46.cal
"2ef7c0f59dbaf6a5a117bb0672cc30c9b890831e0eaa5bc76a1f5edfbf28c60c":[1753,13413,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Opel/Omega 93C46.cal
"a3e9e84d9d0292c8ac3cf8c84f15b41b16d20073b20b28820f7d83c754c90e91":[1757,38884,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Opel/Senator 93C46.cal
"dc84942b6a37c1cd8ce059ca3f4783573018e037c9f19cde7ed5f8c10523a418":[4869,6711,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Peugeot/Expert 68HC908AZ32.cal
"ef5d731405061a366395eb0658731dd9def746811c19ff14b9b0fb625b1a0eaa":[1466,57284,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Skoda/Oktavia A5.cal
"78f7b3fe0ca311836a286c97b9da0c36125eca9c2dd4c4bfbf36068ed0495261":[1377,3546,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Skoda/Oktavia VDO 93C66.cal
"226250a2062891e49f883e14e676989d01a54524d60ccf0222afb34bdabd5e0b":[1379,20505,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Skoda/Oktavia VDO 93LC86.cal
"90d0eab7ba40614f9cf89eb2d74ee90603bb19c80bb8a4961b1fa37b5035a841":[1349,3066,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Skoda/Super B 93C86.cal
"6755ea9a711998aa4091ae63bd2e8e99f3ad90d0298e243e6610870ad242d625":[1458,40640,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/VW/Touareg/VWTouareg2004.cal
"ca77fb66a63be7162c9cc48e13526ed8e075253ec88a603a071ee7881ebe84fb":[3055,19714,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Volkswagen/Passat B5 VDO_Type1 93C66.cal
"298484bc70d2545c0e233b9283b63b6a1e9f6febc31ffd02bc4a5c45a848f6d5":[3051,59203,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Volkswagen/Passat B5 VDO_Type2 93C66.cal
"2c0b024c0800390a155b970aecf308aa105cc1e41b7d15f6bc672993d9fb857f":[2890,6411,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Volkswagen/Passat b5 vdo 93c86.cal
"9ac77072d2b88fd860ab2a82c4ad99eaada49d82c742977dc93ae89bbc02f9a6":[2182,5977,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Volkswagen/Passat b5+ from 2001 vdo 93c86.cal
"56d84ca2c75cef0ac2cdcb3763f2fbdadd5e3f661597a0341507deaa4a559472":[2187,28627,"duplicate-form"], // ETSmartUSB/iProg+/Calculators/Dashboard/EU_US_RU/Volkswagen/Passat b5+ from 2004 vdo 93c86.cal
"13dee4e9443bf3683a624ebfa037c102a95f5a2534d3d176ee8bd5158f390746":[1471,38271,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Volkswagen/VWTouareg2004.cal
"dfa760d9343cf5711a3e7fbf56b07b5b5ae10d89508c38fbffa93063197ac691":[2883,57492,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Volkswagen/Vw passat b5 vdo 93c86.cal
"a9d2c88bf6a9a9b6d970626792b3c39a50ae98ed485f97e36ddd96956f805e5c":[2175,11419,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Volkswagen/Vw passat b5+ from 2001 vdo 93c86.cal
"9dd12fabc9b8bf87e5caa8fe4d8ebcbbe97af9afcc29eed7b451abe9bb6886e8":[2180,53518,"duplicate-form"], // ETSmartUSB/Calculators/Dashboard/EU_US_RU/Volkswagen/Vw passat b5+ from 2004 vdo 93c86.cal
});
// T-006: five missing closing groups around explicit decimal BCD terms.
const bcdGroupRepairs=Object.freeze({
 'e500b7532dd82cc429a177c26ed66ab2ab5cd32af52661de94a050c404ac5537':[3138, 63524, 5],
 '56fd7927eacabb99060112a83d30c31f70ed7798ed1664c62671a6d54c7f83cc':[3164, 58384, 5],
 '3297c7f9c749580a2e1f1b6d0bbfeb68ef18029a92ca41996e297e7938b5cc04':[3609, 14572, 5],
});
const unverifiedWriters=Object.freeze({
 'd20c466d1b53a7c8396c85c3f386a9b94382d0e32f2e1f5e13de96039f85a95b':'Восстановлено чтение. Запись заблокирована: оригинальный CAL пишет только 12 бит значения Distance / Constant, хотя допускает больший пробег. При значении 4096 * Constant повторное чтение даёт ноль. Нужен исправленный оригинал или эталон; алгоритм не изменён.',
 '21192efbfa431fc5f303357ce13af1eb3c32de2e7ab70715f36d1a35b752652d':'Восстановлено чтение. Запись заблокирована: оригинальный CAL пишет только 12 бит значения Distance / Constant, хотя допускает больший пробег. При значении 4096 * Constant повторное чтение даёт ноль. Нужен исправленный оригинал или эталон; алгоритм не изменён.',

 'de9adb817e522093fdac9f8a841cc1430461110abf2751d11ced40bb1b664d3e':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 'af87798d2870aad676984920b492d72f8427ef304ff21014477e24217c390b90':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 '97a93a56215f7d5bd60a4b86b25c1793bfb02a8dd3b01160a86a44593a0c9bb5':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 '3fe02b9bb8a1d59c3cf562a33fc0deb44b7fb7e37b82e2cad075d761f6f7d23f':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 'e5e921a649aa76fef1c8f055c713bebbcefbe056ed286242e0f8255a10dbda7c':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 'fabf6b54e364d707d6df4510f7950deea097059336e5c477f3365e5357e73742':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 'e7fd2460972d2741a612709424218851a097a2d236f371cc41605cc9ae219ca6':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 '558b8b91314f9f5ee85113f291d3036db24aa43c022428dc3700e5d9a1aac88c':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 'e4078a63ad3b0dc2c2bfd46f787632ebf518ed2ce4b88cc7a7631c0e660f3c4c':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 '85c29f98a4029a9ee892f205f12190e95a8e59d5d2e34fc53c26eae2797b97a3':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 '95abc3363193b5b470179159dac0d54a0b9ec5e0d522dbf2f2e74a303e13d160':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',
 '405bb8c731b7160952f95969e52fa865f3c4517d1288a3056fb7fffa9cccb314':'Восстановлено чтение. Запись заблокирована: приоритет Var6 >> 16 + Var6 в оригинальном iProg не подтверждён; нужен точный скомпилированный аналог, правила языка или эталон результата. Исходные операции сохранены.',

 '5f74901d009f3bca42a60ae00125bc3278892358b61b35907bc8ae8648e6a7be':'Запись заблокирована: в оригинальном CAL OnApply меняет 0x32–0x3F, но OnShow сравнивает логин с неизменёнными 0x42–0x43. После смены логина оригинал отвергает собственный результат. Нужен исправленный авторский CAL или эталон записи iProg; алгоритм не изменён.',
 '3a0a0f5ca9f9f754c995da64ab6675914e4e306137d0023d92ac5fc2b047d32b':'Запись заблокирована: при текущем разборе Var6 >> 16 + Var6 оригинал формирует разные копии 0x00 и 0x20 и отвергает результат. Приоритет сдвига в iProg не подтверждён. Нужны правила языка, точная скомпилированная версия или эталон записи; алгоритм не изменён.',
 'ecde8e1579b3adee67eba279d1bbdcd2355104a634fb03d69edb3c1eeb23d520':'Запись заблокирована: при текущем разборе Var6 >> 16 + Var6 оригинал формирует разные копии 0x00 и 0x20 и отвергает результат. Приоритет сдвига в iProg не подтверждён. Нужны правила языка, точная скомпилированная версия или эталон записи; алгоритм не изменён.',
});
function parse(raw,{sha}={}){if(raw.length>3*1048576)fail('файл слишком большой');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(raw);}catch{text=cp.decode(raw);}
 // CAL metadata precedes Size: section title, !/@/# reference lines, comments and a
 // bare image/document filename. Code is not accepted before Size.
 text=text.replace(/^\uFEFF/,'');
 const sizeAt=text.search(/\bSize\s*\(/i);
 if(sizeAt>0){
  const preamble=text.slice(0,sizeAt);
  const leftover=preamble
   .replace(/^\s*\[[^\r\n\]]*\]\s*$/gm,'')
   .replace(/^\s*[!@#][^\r\n]*$/gm,'')
   .replace(/^\s*\/\/[^\r\n]*$/gm,'')
   .replace(/^\s*[^\s{};=]+\.(?:htm|html|doc|docx|jpg|jpeg|png|bmp|gif|txt)\s*$/gmi,'')
   .replace(/^\s*$/gm,'');
  if(leftover)fail('\u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u0435\u0440\u0435\u0434 Size');
  text=preamble.replace(/[^\r\n]/g,'')+text.slice(sizeAt);
 }
 text=text.replace(/^\s*![^\r\n]*$/gm,'');
 const repair=Object.hasOwn(finalBraceRepairs,sha)?finalBraceRepairs[sha]:null;
 if(repair){if(raw.length!==repair[0]||E.crc16(raw)!==repair[1])fail('исходник не совпадает с профилем исправления');if(!/}\s*$/.test(text))fail('не найдено исправляемой скобки');text=text.replace(/}\s*$/,'');}
 const topRepair=Object.hasOwn(topLevelBraceRepairs,sha)?topLevelBraceRepairs[sha]:null;
 if(topRepair&&(raw.length!==topRepair[0]||E.crc16(raw)!==topRepair[1]))fail('исходник не совпадает с профилем исправления');
 const formRepair=Object.hasOwn(formRepairs,sha)?formRepairs[sha]:null;
 if(formRepair&&(raw.length!==formRepair[0]||E.crc16(raw)!==formRepair[1]))fail('исходник не совпадает с профилем исправления');
 if(formRepair?.[2]==='duplicate-form'){if(!/\bForm\s*\{\s*Form\s*\{/i.test(text))fail('не найден дублированный внешний Form');text=text.replace(/\bForm\s*\{\s*Form\s*\{/i,'Form{');}
 const bcdRepair=Object.hasOwn(bcdGroupRepairs,sha)?bcdGroupRepairs[sha]:null;
 if(bcdRepair){
  if(raw.length!==bcdRepair[0]||E.crc16(raw)!==bcdRepair[1])fail('исходник не совпадает с профилем исправления');
  let count=0;for(const [shift,multiplier] of [[20,100000],[16,10000],[12,1000],[8,100],[4,10]]){
   const pattern=new RegExp('(Var0\\s*=\\s*Var0\\s*\\+\\s*\\(\\(\\(Var1\\s*>>\\s*'+shift+'\\)\\s*&\\s*15\\)\\s*\\*\\s*'+multiplier+')\\s*;','gi');
   let matches=0;text=text.replace(pattern,(_,term)=>{matches++;return term+');';});if(matches!==1)fail('не найден однозначный незакрытый BCD-терм');count+=matches;
  }if(count!==bcdRepair[2])fail('число исправляемых BCD-групп не совпадает');
 }
 const program=new Parser(text,{extraClosings:topRepair?topRepair[2]:0,closeOuterForm:formRepair?.[2]==='outer-form-eof'}).parse();
 if(bcdRepair)program.sourceRepairs=['Закрыты пять внешних групп BCD-термов перед точкой с запятой; все операнды и операции сохранены.'];
 if(formRepair)program.sourceRepairs=[formRepair[2]==='outer-form-eof'?'Закрыт внешний контейнер Form после всех завершённых обработчиков; оригинал сохранён.':'Устранён дублированный внешний Form; обработчики и выражения сохранены.'];
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
