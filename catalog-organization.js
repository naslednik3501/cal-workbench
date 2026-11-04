/* Verified thematic names and folders for CAL SHA-256; original paths stay untouched. */
(function(root){
'use strict';
const node=typeof module==='object'&&module.exports;
// The Airbag/SRS map is generated separately; Node tests can load this file alone.
if(node&&!root.CAL_ORGANIZATION_AIRBAG)require('./catalog-organization-airbag.js');
const airbag=root.CAL_ORGANIZATION_AIRBAG||{entries:{}};
const approved={
  'faa4784def192d83d899083b360c2cc805dd9f6653bf7042c571980bf31b2c1a':{name:'Skoda Fabia 2006 — декриптор EEPROM 93C86',folder:'Приборные панели/Skoda'},
  '2ebd61f105e5ce3fcaae4d2ffad46aca471ff22cdf3616e50582dc30a42d4970':{name:'Skoda Superb — декриптор EEPROM 93C86',folder:'Приборные панели/Skoda'},
  'd0920cc81247ab7dd31d013dc130dd092747b666546e024382e67d8196ee9877':{name:'Philips — заготовка калькулятора кода',folder:'Магнитолы и навигация/Неуточнённые'},
  'b3503228dbb6c6b5e45352dd753f61c4d1b472bf04f84f1ff15a0c3fe57a2224':{name:'Hitag2 — контрольная сумма CRC по выделению',folder:'Утилиты/CRC'},
  '4f38ff98c567bd82e80821515a7e948c214cdc2a30aa26e15de3fc27bc7da1f1':{name:'Mitsubishi Outlander — CRC и VIN в IMMO по выделению',folder:'Иммобилайзеры и ключи/Mitsubishi'},
  'b5d3f7c4be6434423a32c1a2f0c09a0bbf640cbddd0f16c9547022d5efe49621':{name:'CRC и VIN в дампе панели — правка по выделению',folder:'Утилиты/CRC'},
  '21b6963bdadeb104e7fe4b807542c56b79931aac78a5d388ac67e14729c01f9b':{name:'MasterKey → Kmrw — конвертер данных транспондера (8 или 16 байт)',folder:'Иммобилайзеры и ключи/Конвертеры ключей'},
  '89db59ed2be0d1cdd84c78d59a31cc15775a6712833b03de406f2e531e185d9f':{name:'Etsmart — справочник цветовых кодов',folder:'Утилиты/Справочники'},
  '7498ed09f8cdcfed8b151c496de2c73e13e4baa3dfcb7a7b32d01806bd5689d2':{name:'Инверсия первых 128 КиБ дампа',folder:'Утилиты/Инверсия'},
  '44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045':{name:'Toyota 89170-02810 — сброс Crash (SRS)',folder:'Подушки безопасности/Toyota'},
  '31ef5b19a0c4c02c73ca84c2aafcc7230679c94758b75a4441b9dc6bc0ac2d79':{name:'Nissan 28556 3AP1B — сброс Crash (SRS)',folder:'Подушки безопасности/Nissan'},
  'a20a16b57c2ec83a2ebd27a51d7eceec63035545f272a2afc815e6919cde9eaf':{name:'Chevrolet 96 806 850 (5WY67070) — сброс Crash (SRS)',folder:'Подушки безопасности/Chevrolet'}
};
const data={
 schema:1,
 source_report:'reports/catalog-organization-root-airbag.md',
 airbag_report:airbag.source_report||'',
 entries:{...airbag.entries,...approved},
 search_aliases:{'d0920cc81247ab7dd31d013dc130dd092747b666546e024382e67d8196ee9877':['Renault']}
};
const sha=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const sections=['Подушки безопасности','Приборные панели','Иммобилайзеры и ключи','Магнитолы и навигация','Утилиты'];
function validate(d){
 if(d?.schema!==1||!d.entries||Array.isArray(d.entries)||typeof d.entries!=='object'||!d.source_report)throw Error('Invalid catalog organization');
 const seen=new Set();
 for(const [hash,item] of Object.entries(d.entries)){
  if(!sha(hash)||!item||typeof item.name!=='string'||typeof item.folder!=='string')throw Error('Invalid catalog organization entry: '+hash);
  const parts=item.folder.split('/');
  if(parts.length!==2||!sections.includes(parts[0])||!parts[1]||parts[1]==='.'||parts[1]==='..')throw Error('Invalid folder: '+item.folder);
  if(!item.name.trim()||item.name.length>140||/[\\/\\\\]/.test(item.name)||/\\.cal$/i.test(item.name))throw Error('Invalid name: '+item.name);
  if(item.reason!==undefined&&(typeof item.reason!=='string'||!item.reason.trim()||item.reason.length>240))throw Error('Invalid reason: '+hash);
  const key=(item.folder+'/'+item.name).toLowerCase();
  if(seen.has(key))throw Error('Duplicate display path: '+key);seen.add(key);
 }
 for(const [hash,list] of Object.entries(d.search_aliases||{})){
  if(!d.entries[hash]||!Array.isArray(list)||!list.length)throw Error('Invalid search alias owner: '+hash);
  for(const alias of list)if(typeof alias!=='string'||!alias.trim()||alias.length>80)throw Error('Invalid search alias: '+hash);
 }
 return d;
}
validate(data);
function resolved(entry){return entry&&sha(entry.sha)?data.entries[entry.sha]||null:null;}
function get(hash){return sha(hash)?data.entries[hash]||null:null;}
function title(entry){const item=resolved(entry);return item?item.name:entry?entry.path.split('/').at(-1):'';}
function folder(entry){const item=resolved(entry);return item?item.folder:null;}
function displayPath(entry){const item=resolved(entry);return item?item.folder+'/'+item.name+'.cal':null;}
function reason(entry){const item=resolved(entry);return item&&item.reason||'';}
// Search covers the original path and the new name/folder; aliases are hints, not confirmed brands.
function hints(entry){return entry&&data.search_aliases[entry.sha]||[];}
function searchParts(entry){if(!entry)return [];const item=resolved(entry),own=item?[item.folder+'/'+item.name+'.cal',...(data.search_aliases[entry.sha]||[])]:[];return [entry.path,...own].map(x=>x.toLowerCase());}
function searchText(entry){return searchParts(entry).join(' ');}
function matches(entry,query){const q=String(query||'').toLowerCase();return !!q&&searchParts(entry).some(x=>x.includes(q));}
const api=Object.freeze({data,get,title,folder,displayPath,reason,hints,searchText,matches});
root.CatalogOrganization=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
