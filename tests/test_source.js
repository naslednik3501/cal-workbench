// Portable tests: synthetic BINs only; no hardware compatibility claim.
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),E=require('../engine.js');
require('../catalog.js');for(const p of require('../catalog-parts.json'))require('../'+p);
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const parse=s=>E.parse(Buffer.from(s));
const source=(body,form='Digit(km,"Value",0,0,100); Label(msg,"",0,20);')=>'Size(300,100); Form{'+form+'} '+body;
const vm=s=>new E.VM(parse(source(s)),new Uint8Array(16));
test('Unsigned arithmetic, precedence, shifts, memory and control input',()=>{
 const v=vm('OnApply{ var0=0xffffffff+2; @0=var0; @1=2+3*4; @2=0x80000000>>31; @3=1<<33; @4=(0xffffffff*3)&255; km=0xffffffff/2; }');
 v.execute('apply');assert.deepEqual([...v.buffer.slice(0,5)],[1,14,1,2,253]);assert.equal(v.controls[0].value,2147483647);
});
test('Form nesting, inner event declarations and case-insensitive identifiers',()=>{
 const p=parse('Size(200,100); Form{Group("G",1,2,180,80){Digit(Km,"v",0,0,90);} OnShow{km=42;}}');
 const v=new E.VM(p,new Uint8Array(2));v.execute('show');assert.equal(v.controls[0].value,42);assert.equal(p.form.controls[0].parent,0);
});
test('Loops, procedure return, named variables and conditional assignment',()=>{
 const v=vm('var index; OnApply{index=0; while(index<4){@index=index+1;index=index+1;} helper; if(index=4){@4=9;}else{@4=0;}} helper{ @5=7; return; @5=8;}');
 v.execute('apply');assert.deepEqual([...v.buffer.slice(0,6)],[1,2,3,4,9,7]);
});
test('Formatting, literal backslashes, labels and properties',()=>{
 const v=vm('OnShow{str0="C:\\CAL\\file"; msg=str0+" "+#b.0x1234+" "+#w.0x12345+" "+#d.0xffffffff+" "+#i.42; msg.Color=0xff00;msg.Bold=1;msg.Alignment=2;}');
 v.execute('show');assert.equal(v.controls[1].text,'C:\\CAL\\file 34 2345 FFFFFFFF 42');assert.equal(v.controls[1].color,65280);assert.equal(v.controls[1].bold,true);assert.equal(v.controls[1].align,'right');
});
test('CP1251 section headings, comments and strings',()=>{
 const raw=Buffer.concat([Buffer.from('[test]\r\n! note\r\nSize(1,1);Form{Label(msg,"'),Buffer.from([0xcf,0xf0,0xe8,0xe2,0xe5,0xf2]),Buffer.from('",0,0);}OnShow{}')]);
 assert.equal(E.parse(raw).form.controls[0].text,'Привет');
});
test('Selection and buffer-size registers',()=>{
 const v=vm('OnChange{@selstart=bufsize;@selend=cursoradr;}');v.r[48]=2;v.r[49]=5;v.r[51]=3;v.execute('change');assert.equal(v.buffer[2],16);assert.equal(v.buffer[5],3);
});
test('Failed events preserve buffer, variables, registers and controls in parent VM',()=>{
 const v=vm('var index; OnApply{@0=5;index=3;var0=4;km=9;@bufsize=7;}');
 assert.throws(()=>v.transaction('apply'),/границы/);assert.equal(v.buffer[0],0);assert.equal(v.variables.get('index'),0);assert.equal(v.r[0],0);assert.equal(v.controls[0].value,0);
});
test('Successful transactions use an independent working copy',()=>{
 const v=vm('OnApply{@0=@0+1;}'),a=v.transaction('apply').vm,b=v.transaction('apply').vm;
 assert.equal(v.buffer[0],0);assert.equal(a.buffer[0],1);assert.equal(b.buffer[0],1);
});
test('Runaway loops, recursion, divide by zero and strings stop explicitly',()=>{
 assert.throws(()=>vm('OnApply{while(1){}}').transaction('apply',{maxSteps:100}),/лимит/);
 assert.throws(()=>vm('OnApply{repeat;} repeat{repeat;}').transaction('apply'),/глубокие/);
 assert.throws(()=>vm('OnApply{var0=1/0;}').transaction('apply'),/ноль/);
 assert.throws(()=>vm('OnApply{str0="a";while(1){str0=str0+str0;}}').transaction('apply'),/длинная строка/);
});
test('Malformed code, unknown procedures and foreign executable syntax are rejected',()=>{
 for(const s of ['OnApply{missing;}','OnApply{unknown=1;}','OnApply{@0=1;','OnApply{km=process.exit();}','OnApply{km=1+;}','OnApply{km.Alignment=3;}']){
  assert.throws(()=>vm(s).transaction('apply'));
 }
 assert.throws(()=>parse(source('OnApply{} OnApply{}')),/повторная/);
 assert.throws(()=>parse(source('OnApply{km='+ '('.repeat(160)+'1'+')'.repeat(160)+';}')),/сложное/);
});
test('Real EDC16 CAL decodes with extended parameter search and valid CRC',()=>{
 const sha='327d7115f4c6b0ebd77d19dc882f62c9ef5ed5a3adc3c1115d8b7413377ffeac';
 const raw=Buffer.from(CAL_CATALOG.blobs[sha],'base64'),p=E.parse(raw);
 assert.equal(p.bytes.length,928);assert.equal(p.form.events.show,310);assert.equal(p.form.events.apply,359);assert.equal(p.executable,true);
 const corrupt=Buffer.from(raw);const i=100;corrupt[i]=corrupt[i]===48?49:48;assert.throws(()=>E.parse(corrupt),/сумма|кодирован/);
});
test('Binary CAL fixture behavior remains supported',()=>{
 for(const name of ['ceed-2011.cal','rav4.cal','mitsubishi.cal','vw.cal'])assert(E.parse(fs.readFileSync(path.join(__dirname,'fixtures',name))).executable);
});
test('Classic browser script loading works without CommonJS or eval',()=>{
 const context=require('vm').createContext({TextDecoder,Uint8Array,Uint32Array,Date});
 for(const f of ['engine.js','cal-source.js'])require('vm').runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),context);
 context.raw=Buffer.from(source('OnApply{@0=7;}'));
 assert.equal(require('vm').runInContext('new CalEngine.VM(CalEngine.parse(raw),new Uint8Array(4)).transaction("apply").vm.buffer[0]',context),7);
});
console.log(JSON.stringify({passed,failed:0,scope:'Synthetic data and real CAL parsing; no hardware validation'}));
