/* Verified thematic names and folders for CAL SHA-256; original paths stay untouched. */
(function(root){
'use strict';
const node=typeof module==='object'&&module.exports;
// Device maps are generated separately; Node tests can load this file alone.
if(node&&!root.CAL_ORGANIZATION_DASHBOARD)require('./catalog-organization-dashboard.js');
if(node&&!root.CAL_ORGANIZATION_IMMO)require('./catalog-organization-immo.js');
if(node&&!root.CAL_ORGANIZATION_RADIO)require('./catalog-organization-radio.js');
if(node&&!root.CAL_ORGANIZATION_UTILITIES)require('./catalog-organization-utilities.js');
if(node&&!root.CAL_ORGANIZATION_REMAINDER)require('./catalog-organization-remainder.js');
if(node&&!root.CAL_ORGANIZATION_AIRBAG)require('./catalog-organization-airbag.js');
const dashboard=root.CAL_ORGANIZATION_DASHBOARD||{entries:{}};
const immo=root.CAL_ORGANIZATION_IMMO||{entries:{}};
const radio=root.CAL_ORGANIZATION_RADIO||{entries:{}};
const utilities=root.CAL_ORGANIZATION_UTILITIES||{entries:{}};
const airbag=root.CAL_ORGANIZATION_AIRBAG||{entries:{}};
const remainder=root.CAL_ORGANIZATION_REMAINDER||{entries:{}};
const approved={
  'faa4784def192d83d899083b360c2cc805dd9f6653bf7042c571980bf31b2c1a':{name:'Skoda Fabia 2006 — декриптор EEPROM 93C86',folder:'Dashboard/Skoda'},
  '2ebd61f105e5ce3fcaae4d2ffad46aca471ff22cdf3616e50582dc30a42d4970':{name:'Skoda Superb — декриптор EEPROM 93C86',folder:'Dashboard/Skoda'},
  'd0920cc81247ab7dd31d013dc130dd092747b666546e024382e67d8196ee9877':{name:'Philips — заготовка калькулятора кода',folder:'CarRadio',reason:'назначение кода не подтверждено формой; Renault — только поисковая подсказка'},
  'b3503228dbb6c6b5e45352dd753f61c4d1b472bf04f84f1ff15a0c3fe57a2224':{name:'Hitag2 — контрольная сумма CRC по выделению',folder:'OTHER/CRC'},
  '4f38ff98c567bd82e80821515a7e948c214cdc2a30aa26e15de3fc27bc7da1f1':{name:'Mitsubishi Outlander — CRC и VIN в IMMO по выделению',folder:'Immo/Mitsubishi'},
  'b5d3f7c4be6434423a32c1a2f0c09a0bbf640cbddd0f16c9547022d5efe49621':{name:'CRC и VIN в дампе панели — правка по выделению',folder:'OTHER/CRC'},
  '21b6963bdadeb104e7fe4b807542c56b79931aac78a5d388ac67e14729c01f9b':{name:'MasterKey → Kmrw — конвертер данных транспондера (8 или 16 байт)',folder:'Immo/Convertor'},
  '89db59ed2be0d1cdd84c78d59a31cc15775a6712833b03de406f2e531e185d9f':{name:'Etsmart — справочник цветовых кодов',folder:'OTHER',reason:'общая утилита: марка и модель автомобиля не применимы'},
  '7498ed09f8cdcfed8b151c496de2c73e13e4baa3dfcb7a7b32d01806bd5689d2':{name:'Инверсия первых 128 КиБ дампа',folder:'OTHER',reason:'общая обработка дампа: марка и модель автомобиля не подтверждены'},
  '44bcc22cdd9de8ae5e7ecdff4e34e3b6373110b10ba7cb0ccbfc0b2598cc1045':{name:'Toyota 89170-02810 — сброс Crash (SRS)',folder:'Airbag/Toyota'},
  '31ef5b19a0c4c02c73ca84c2aafcc7230679c94758b75a4441b9dc6bc0ac2d79':{name:'Nissan 28556 3AP1B — сброс Crash (SRS)',folder:'Airbag/Nissan'},
  'a20a16b57c2ec83a2ebd27a51d7eceec63035545f272a2afc815e6919cde9eaf':{name:'Chevrolet 96 806 850 (5WY67070) — сброс Crash (SRS)',folder:'Airbag/Chevrolet'}
};
// Confirmed SRS calculators inside the source Service/Service calc sections.
// The utility map remains reproducible; the display map routes these three
// SHA to the original Airbag section instead of claiming a generic service job.
const relocated={
  '31ce967ff091cb0c668a5ee842090f2bae06249eb8d0c7145ee40a4e6c3bf41a':{name:'Mercedes-Benz E W211 AB 68HC912DG128 — сброс Crash (SRS)',folder:'Airbag/Mercedes-Benz'},
  '41f4b57432a60aec26cc736de0cae27835acf4b9df9571c97586d014d0663a71':{name:'Mercedes-Benz E W211 AB MC9S12DG128 — сброс Crash (SRS)',folder:'Airbag/Mercedes-Benz'},
  '95dd70b2ee6bc95c7f7a3efda11c2c3eb58adbc14bd740114856d246ef2292b7':{name:'Mercedes-Benz E W211 AB 68HC912DG128 var2 — сброс Crash (SRS)',folder:'Airbag/Mercedes-Benz'}
};
const data={
 schema:1,
 source_report:'reports/catalog-organization-root-airbag.md',
 airbag_report:airbag.source_report||'',
 dashboard_report:dashboard.source_report||'',
 immo_report:immo.source_report||'',
 radio_report:radio.source_report||'',
 utilities_report:utilities.source_report||'',
 remainder_report:remainder.source_report||'',
 entries:{...remainder.entries,...dashboard.entries,...immo.entries,...radio.entries,...utilities.entries,...airbag.entries,...approved,...relocated},
 relocated,
 search_aliases:{'d0920cc81247ab7dd31d013dc130dd092747b666546e024382e67d8196ee9877':['Renault']}
};
const sha=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const legacyRoots={
 Airbag:['Подушки безопасности','SRS'],
 Dashboard:['Приборные панели','Dashboard'],
 Immo:['Иммобилайзеры и ключи','Immo off','MB'],
 CarRadio:['Магнитолы и навигация'],
 OTHER:['Утилиты','CRC','PIN','Service','Service calc','Synchronization','Tachograf off','US-Euro converter','USA-Euro converter']
};
function validate(d){
 if(d?.schema!==1||!d.entries||Array.isArray(d.entries)||typeof d.entries!=='object'||!d.source_report)throw Error('Invalid catalog organization');
 const seen=new Set();
 for(const [hash,item] of Object.entries(d.entries)){
  if(!sha(hash)||!item||typeof item.name!=='string'||typeof item.folder!=='string')throw Error('Invalid catalog organization entry: '+hash);
  const parts=item.folder.split('/');
  if(!parts.length||parts.some(part=>!part||part==='.'||part==='..'||/[\\/]/.test(part)))throw Error('Invalid folder: '+item.folder);
  if(!item.name.trim()||item.name.length>140||/[\\/\\\\]/.test(item.name)||/\\.cal$/i.test(item.name))throw Error('Invalid name: '+item.name);
  if(item.reason!==undefined&&(typeof item.reason!=='string'||!item.reason.trim()||item.reason.length>240))throw Error('Invalid reason: '+hash); if(item.manufacturer!==undefined&&(typeof item.manufacturer!=='string'||!item.manufacturer.trim()||item.manufacturer.length>80))throw Error('Invalid panel manufacturer: '+hash); if(item.brands!==undefined&&(!Array.isArray(item.brands)||!item.brands.length||item.brands.some(brand=>typeof brand!=='string'||!brand.trim()||brand.length>80)))throw Error('Invalid brands: '+hash);
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
// Search covers the original path, the new name/folder and the former section
// names. Aliases are hints, not confirmed brands.
function hints(entry){return entry&&data.search_aliases[entry.sha]||[];}
function legacyParts(item){
 if(!item)return [];
 const [root,...rest]=item.folder.split('/'),tail=rest.join('/');
 return (legacyRoots[root]||[]).flatMap(alias=>[alias,...(tail?[alias+'/'+tail]:[])]);
}
function searchParts(entry){if(!entry)return [];const item=resolved(entry),own=item?[item.folder+'/'+item.name+'.cal',...(item.old_name?[item.old_name]:[]),...(item.previous_name?[item.previous_name]:[]),...(item.brands||[]),...(item.manufacturer?[item.manufacturer]:[]),...legacyParts(item),...(data.search_aliases[entry.sha]||[])]:[];return [entry.path,...own].map(x=>x.toLowerCase());}
function searchText(entry){return searchParts(entry).join(' ');}
function matches(entry,query){const q=String(query||'').toLowerCase();return !!q&&searchParts(entry).some(x=>x.includes(q));}
const api=Object.freeze({data,get,title,folder,displayPath,reason,hints,searchText,matches});
root.CatalogOrganization=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
