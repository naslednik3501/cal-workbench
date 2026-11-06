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
if(node&&!root.CAL_ORGANIZATION_GERMANY)require('./catalog-organization-germany.js');
if(node&&!root.CAL_ORGANIZATION_FRANCE)require('./catalog-organization-france.js');
if(node&&!root.CAL_ORGANIZATION_ASIA_ACURA)require('./catalog-organization-asia-acura.js');
if(node&&!root.CAL_ORGANIZATION_ASIA_HONDA)require('./catalog-organization-asia-honda.js');
if(node&&!root.CAL_ORGANIZATION_ASIA_MAZDA)require('./catalog-organization-asia-mazda.js');
if(node&&!root.CAL_ORGANIZATION_ASIA_NISSAN)require('./catalog-organization-asia-nissan.js');
if(node&&!root.CAL_ORGANIZATION_ASIA_MITSUBISHI)require('./catalog-organization-asia-mitsubishi.js');
if(node&&!root.CAL_ORGANIZATION_ASIA_TOYOTA)require('./catalog-organization-asia-toyota.js');
if(node&&!root.CAL_ORGANIZATION_ASIA_SUBARU_SUZUKI)require('./catalog-organization-asia-subaru-suzuki.js');
const dashboard=root.CAL_ORGANIZATION_DASHBOARD||{entries:{}};
const immo=root.CAL_ORGANIZATION_IMMO||{entries:{}};
const radio=root.CAL_ORGANIZATION_RADIO||{entries:{}};
const utilities=root.CAL_ORGANIZATION_UTILITIES||{entries:{}};
const airbag=root.CAL_ORGANIZATION_AIRBAG||{entries:{}};
const germany=root.CAL_ORGANIZATION_GERMANY||{entries:{}};
const france=root.CAL_ORGANIZATION_FRANCE||{entries:{}};
const asiaAcura=root.CAL_ORGANIZATION_ASIA_ACURA||{entries:{}};
const asiaHonda=root.CAL_ORGANIZATION_ASIA_HONDA||{entries:{}};
const asiaMazda=root.CAL_ORGANIZATION_ASIA_MAZDA||{entries:{}};
const asiaNissan=root.CAL_ORGANIZATION_ASIA_NISSAN||{entries:{}};
const asiaMitsubishi=root.CAL_ORGANIZATION_ASIA_MITSUBISHI||{entries:{}};
const asiaToyota=root.CAL_ORGANIZATION_ASIA_TOYOTA||{entries:{}};
const asiaSubaruSuzuki=root.CAL_ORGANIZATION_ASIA_SUBARU_SUZUKI||{entries:{}};
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
// Verified against dashboard/Germany.txt dated 2026-08-01 and the original
// Calculators/Germany/BMW paths. The leading Germany folder is display-only.
const germanBmw={
  '002bf173ab0efa33207bf58783cc46f6d06ff59fd842e9e7d5b93ab3e05ef98e':{name:'BMW CAS3 X5 0L01Y — коррекция пробега',folder:'Dashboard/Germany/BMW/CAS3'},
  '025e73fe623407c264be98328236facfd1c45fef6377cde2d870912c0504a618':{name:'E46_3er_35080 var.2',folder:'Dashboard/Germany/BMW/E46'},
  '08da1b442e7b19ebfc682a44b2baec3bae722c99a8d4ca6b5c7f39fe8dff0e0a':{name:'E36 93c46 Blue',folder:'Dashboard/Germany/BMW/E36'},
  '0fdf9be9a8550a927437bd09d70c18c03c20b4afeac1b5ca164687b3422f5e19':{name:'E34 24C02 Green',folder:'Dashboard/Germany/BMW/E34'},
  '10b15943f6cfb0d6eef033d865bcd5db5e2dccc7edc714cda19969881cc88748':{name:'BMW F10 35160 — коррекция пробега',folder:'Dashboard/Germany/BMW'},
  '18b9460e9a35bd7c155965a2092e8182930139bc2dfb0f5db3cfaaeb8fd0edca':{name:'E63_6er_35080',folder:'Dashboard/Germany/BMW'},
  '1ab9cf812d0c20bd459306191d2ba2154f09bbbf8bb681a83519197029f56a4e':{name:'BMW E84 X1 35160 — коррекция пробега',folder:'Dashboard/Germany/BMW/E84'},
  '1b6f69be2e12fb16582d657ffd811c3da3db9c1afaa6edb3574b816f55ceff84':{name:'E85_Z4_35080',folder:'Dashboard/Germany/BMW'},
  '279775d8fce14a6873aae70396937b90bb294d67c0f8dbd0f65da12aa906edaf':{name:'E53_X5_35080',folder:'Dashboard/Germany/BMW'},
  '3e7abef2a47308214e425b689a1c65c501195481dc243d4c091e5934e6d13c8e':{name:'BMW saved mileage 35080',folder:'Dashboard/Germany/BMW'},
  '44c048628933961b945c8cfaeb730f42d8a82f6c3f9418041d7ee9be5d346028':{name:'BMW CAS2 3 5er 2K79X — коррекция пробега',folder:'Dashboard/Germany/BMW/CAS2'},
  '572ac32d8d33216075f703d55f3147ec32d9b2e6d5fd45ab94c846f3b91b5ac7':{name:'BMW CAS2 2K79X — коррекция пробега',folder:'Dashboard/Germany/BMW/CAS2'},
  '5c83814be17cd06c8e1cab49cc7a616f8e515cf14e587bd813e344af3fb82e44':{name:'BMW LCM2 11PH8 — коррекция пробега · вариант 2',folder:'Dashboard/Germany/BMW/LCM',old_name:'BMW LCM2 11PH8 — коррекция пробега'},
  '5ea0e0fd91116925656fb1ff60d9257c34d2c0356935478ddc615a3868258d71':{name:'E83_X3_35080',folder:'Dashboard/Germany/BMW'},
  '61e286ef80705d2ea4c54d0cb2e7d225bd5f22a4212889aaf241e81fd9cb5d11':{name:'BMW CAS4 1L15Y — коррекция пробега',folder:'Dashboard/Germany/BMW/CAS4'},
  '680653888b72d7ef34b331e6748f9f4aa089feb8402addfe8ffc9353091bcda6':{name:'BMW LCM2 11P2 1E53M — коррекция пробега · вариант 2',folder:'Dashboard/Germany/BMW/LCM',old_name:'BMW LCM2 11P2 1E53M — коррекция пробега'},
  '6d59e1b36f7ab4b18074cc091faa636e346b497c2a7a78d4a8ab263ccf186779':{name:'E38, E39_93S66 high SW12,13_',folder:'Dashboard/Germany/BMW/E38, E39'},
  '711b42944c62fb434745fb99f7c9d0666e94fe9e195d98efcbc7672eb5b09229':{name:'BMW LCM4 2L86D — коррекция пробега · вариант 2',folder:'Dashboard/Germany/BMW/LCM',old_name:'BMW LCM4 2L86D — коррекция пробега'},
  '73825a5064e28980c072fbf336992d469532ed9ec65def3cef2cde9662cb1524':{name:'E60_5er_35080',folder:'Dashboard/Germany/BMW'},
  '7dd23c1e22ef86cccdf42925c27f02ee7e242d05dea2cfe256a0272fecb74456':{name:'BMW LCM5 0L15Y — коррекция пробега · вариант 2',folder:'Dashboard/Germany/BMW/LCM',old_name:'BMW LCM5 0L15Y — коррекция пробега'},
  '84d297a4dd7d03013766b96762475f0af94658f05262356cea7884249646ee7c':{name:'E70_X5_35080',folder:'Dashboard/Germany/BMW'},
  '8eb6e631b68f2d6d0e327aa1f3c97ea51cf619b76cbc9a697bef5bbed0546005':{name:'E39_5er_dash 35080',folder:'Dashboard/Germany/BMW/E38, E39'},
  '979fc41cf431e25f262ecc92a4a123a63c15165823cac3ae38fa259e55345b81':{name:'BMW CAS2 — коррекция пробега',folder:'Dashboard/Germany/BMW/CAS2'},
  '9b2ed1e6408eb6c713ae6596607aa19be501fe016abc47e7624616c705daf729':{name:'BMW LCM3 912D60 0K75F — коррекция пробега · вариант 2',folder:'Dashboard/Germany/BMW/LCM',old_name:'BMW LCM3 912D60 0K75F — коррекция пробега'},
  'a2dacc18bef1fe154fde2424ac73a1d2aeede6eff895ef574823263cf76d4715':{name:'E32 24C02 Green',folder:'Dashboard/Germany/BMW'},
  'a4d7002eaecd4a7421eb51dd309cbd72bcbb45adc158b65791450e5c7a3393ec':{name:'BMW F13 35160 — коррекция пробега',folder:'Dashboard/Germany/BMW'},
  'a59004be52e74fc962c5a662bb48e5a5df4e551d7c1cbf61891d9eadc79e34eb':{name:'BMW F07 35160 — коррекция пробега',folder:'Dashboard/Germany/BMW'},
  'a5bc228f2158a259f359b6ac3f4edafe5d24dfd0d2496b216f2cccfcc9994e75':{name:'BMW CAS3 series — коррекция пробега',folder:'Dashboard/Germany/BMW/CAS3'},
  'a6168780d66519bc142803a9403741a8391b8870101324e87f591c08d9f4b5a8':{name:'BMW F01 35160 — коррекция пробега',folder:'Dashboard/Germany/BMW'},
  'aa178b15fbef55535a05942c7b43b379ed6d432603c62174da9149c55394ff6e':{name:'E38, E39_93S66 high SW12_13',folder:'Dashboard/Germany/BMW/E38, E39'},
  'b2b99a7ad8721b98127dc9f3771922452eafb157ea5166ace8aa2391dc5d5d2f':{name:'E71_X6_35080',folder:'Dashboard/Germany/BMW'},
  'b2ba31c822b6e715673edb025d7204419a9e322774bda26409318802803a42fd':{name:'BMW EWS4 2L86D var 1 — коррекция пробега · вариант 2',folder:'Dashboard/Germany/BMW/EWS4',old_name:'BMW EWS4 2L86D var 1 — коррекция пробега'},
  'c1bde450b9669a0c25a2e028aaaa7d3adda18b584adcd2e2dccc3567bb7c87eb':{name:'E65_7er_35080',folder:'Dashboard/Germany/BMW'},
  'c56619967e66b93a4f8444aaabe88e0bb9b3136ae6c1ee5a3c9eb7a92dd507b7':{name:'BMW EWS4 2L86D var 2 — коррекция пробега · вариант 2',folder:'Dashboard/Germany/BMW/EWS4',old_name:'BMW EWS4 2L86D var 2 — коррекция пробега'},
  'c573aa413dc4f6aae081597a6d091c90af58ef6040aef4312ba7e0fd0a48f47c':{name:'BMW E36 White — коррекция пробега (EEPROM 93C46)',folder:'Dashboard/Germany/BMW/E36'},
  'c6702f24e70766c8c123c5bc6cb133c77564fab1debdf7f6f5124fa0a1a966e3':{name:'BMW EWS4 2L86D — коррекция пробега · вариант 3',folder:'Dashboard/Germany/BMW/EWS4',old_name:'BMW EWS4 2L86D — коррекция пробега'},
  'c83cbf51e2f30751246650e26a62bb6638fc80b2487fb47069c5abb8b6af8355':{name:'E38, E39 93S66, 93S56',folder:'Dashboard/Germany/BMW/E38, E39'},
  'd2c7cc1e9966f093a7246c1be0e1d9b49f945d7d0101e4ab10acd47c8f66db0b':{name:'BMW EWS3 11EA9 0D46J — коррекция пробега',folder:'Dashboard/Germany/BMW/EWS3'},
  'd4c1b644c1dfaa588099a0919b4c8353e46fc26f1a610d2cf97fe5dff7b4858b':{name:'E34 93c56 Blue',folder:'Dashboard/Germany/BMW/E34'},
  'd5ba1bb65af6d94a3927fc683260320f82cba037021e51961ce4ae0a8991ecaf':{name:'E36 93c56 Motometer',folder:'Dashboard/Germany/BMW/E36'},
  'e30195932db28fc11f1952ec4242f859a6e35906b62914930595ece7520404ee':{name:'BMW F20 35160 — коррекция пробега',folder:'Dashboard/Germany/BMW'},
  'e3aec3eb09bc74965f05a7606daeaef95f589ab1ad0c9ea6246081849549050f':{name:'E34 93c46 Brown',folder:'Dashboard/Germany/BMW/E34'},
  'ede2d0b10cfa0afe69d42f9cec939295fa2d2730365ba2803579f1a7955ee649':{name:'BMW E84 X1 35080 — коррекция пробега',folder:'Dashboard/Germany/BMW/E84'},
  'f002d2070da7ddfed042280ada81f6a85e9cebfa58ab2735b9ec40dc72826820':{name:'BMW F25 X3 35160 — коррекция пробега',folder:'Dashboard/Germany/BMW'},
  'f4123d9a863d9f020a6932f8b793476b526715c17c3dc03fa0e55af8b875db84':{name:'E36 93c46 Black',folder:'Dashboard/Germany/BMW/E36'},
  'f61fea9f4c50b15a3bfae30d8eb2e84c946a751f508d251601e510e5dd2695b6':{name:'E90_3er_35080',folder:'Dashboard/Germany/BMW'},
  'fa068f87858c3927bdb0196d6cf2c3916259e26ea7200136d0a10a0b17dc3919':{name:'BMW EWS3+ 11EA9 0D46J — коррекция пробега',folder:'Dashboard/Germany/BMW/EWS3'},
  'fd40d5580ba663cf0e69c3e1a00ddc5b70fed0645055d54cee86f004a692ef98':{name:'E46_3er_35080 var.1',folder:'Dashboard/Germany/BMW/E46'},
  'fe86e5456043be93083ea463bec96f21f190131183f2c284ab053134e624b51f':{name:'E36 Z3 93S56',folder:'Dashboard/Germany/BMW/E36'},
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
 entries:{...remainder.entries,...dashboard.entries,...immo.entries,...radio.entries,...utilities.entries,...airbag.entries,...germanBmw,...approved,...relocated},
 relocated,
 search_aliases:{'d0920cc81247ab7dd31d013dc130dd092747b666546e024382e67d8196ee9877':['Renault']}
};
const sha=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
for(const [hash,folder] of Object.entries(germany.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid Germany display entry: '+hash);
 data.entries[hash]={...item,folder};
}
for(const [hash,folder] of Object.entries(france.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid France display entry: '+hash);
 data.entries[hash]={...item,folder,...(france.name_exceptions?.[hash]||{})};
}
for(const [hash,folder] of Object.entries(asiaAcura.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid Asia/Acura display entry: '+hash);
 data.entries[hash]={...item,folder};
}
for(const [hash,folder] of Object.entries(asiaHonda.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid Asia/Honda display entry: '+hash);
 data.entries[hash]={...item,folder};
}
for(const [hash,folder] of Object.entries(asiaMazda.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid Asia/Mazda display entry: '+hash);
 data.entries[hash]={...item,folder};
}
for(const [hash,folder] of Object.entries(asiaNissan.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid Asia/Nissan display entry: '+hash);
 data.entries[hash]={...item,folder};
}
for(const [hash,folder] of Object.entries(asiaMitsubishi.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid Asia/Mitsubishi display entry: '+hash);
 data.entries[hash]={...item,folder};
}
for(const [hash,folder] of Object.entries(asiaToyota.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid Asia/Toyota display entry: '+hash);
 data.entries[hash]={...item,folder};
}
for(const [hash,folder] of Object.entries(asiaSubaruSuzuki.entries||{})){
 const item=data.entries[hash];
 if(!sha(hash)||!item||typeof folder!=='string')throw Error('Invalid Asia/Subaru/Suzuki display entry: '+hash);
 data.entries[hash]={...item,folder};
}
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
