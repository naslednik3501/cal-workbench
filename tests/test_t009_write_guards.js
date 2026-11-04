'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a,'App function boundaries changed: '+start);return source.slice(a,b);}
const functions=section('function eventAvailable(event){','function clearResult(){')+'\n'+section('function sync(){','function calcDiff(){');
function check(label,overrides,expected){
 const elements=new Map(),inputs=new Map([[0,{disabled:false}]]);
 const base={executable:true,partial:false,readOnly:false,validEvents:['show','apply','change'],form:{events:{show:0,apply:1,change:2}}};
 const state={program:{...base,...overrides.program},original:new Uint8Array(1),session:{},candidate:null,dirtyInputs:false,selected:{},binLoading:false,logLines:[],inputs,$:id=>{if(!elements.has(id))elements.set(id,{disabled:false,hidden:false,open:true});return elements.get(id);}};
 for(const [key,value] of Object.entries(overrides))if(key!=='program')state[key]=value;
 const context=vm.createContext(state);vm.runInContext(functions+'\nsync();',context);
 for(const [key,value] of Object.entries(expected)){if(key==='inputDisabled')assert.equal(inputs.get(0).disabled,value,label+' input');else assert.equal(state.$(key).disabled,value,label+' '+key);}
 console.log('PASS '+label);
}
check('Writable CAL',{},{apply:false,selection:false,inputDisabled:false,save:true});
check('Partial CAL',{program:{partial:true}},{apply:true,selection:true,inputDisabled:true});
check('Original reader without writer',{program:{readOnly:true,validEvents:['show']}},{apply:true,selection:true,inputDisabled:true});
check('No apply event',{program:{validEvents:['show','change']}},{apply:true,selection:false,inputDisabled:true});
check('No session',{session:null},{apply:true,selection:true,inputDisabled:true});
check('No BIN',{original:null},{apply:true,selection:true,inputDisabled:true,saveOriginal:true});
check('Unavailable program',{program:{executable:false}},{apply:true,selection:true,inputDisabled:true});
check('Legacy event error',{program:{validEvents:undefined,eventErrors:{apply:'blocked'}}},{apply:true,inputDisabled:true});
console.log('8 guard cases completed. Node state adapter only; not browser, algorithm, download-handler or transaction validation.');
