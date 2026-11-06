/* Display-only navigation layout modelled on the original iProg sections.
 * Original paths, CAL bytes, SHA-256 identities and display names stay unchanged.
 * Every calculator is placed in exactly one section; nothing is removed. */
(function(root){
'use strict';
const BRAND_SECTIONS={
  "Acura": "Asia",
  "Admiral": "Asia",
  "Alfa Romeo": "EU_US_RU",
  "Ankai": "Asia",
  "Aston Martin": "EU_US_RU",
  "Audi": "Germany",
  "Baltmotors": "Mototechnics",
  "BAW": "Asia",
  "Belarus": "Special technics",
  "Bentley": "EU_US_RU",
  "BMW": "Germany",
  "Bogdan": "Asia",
  "Brilliance": "Asia",
  "BRP": "Mototechnics",
  "Buick": "EU_US_RU",
  "BYD": "Asia",
  "Cadillac": "EU_US_RU",
  "CAMC": "Asia",
  "Case": "Special technics",
  "CAT": "Special technics",
  "CFMOTO": "Mototechnics",
  "Changan": "Asia",
  "Chery": "Asia",
  "Chevrolet": "EU_US_RU",
  "Chrysler": "EU_US_RU",
  "Citroen": "France",
  "Curtis": "Special technics",
  "Dacia": "France",
  "Daewoo": "Asia",
  "Daf": "EU_US_RU",
  "Daihatsu": "Asia",
  "Datsun": "Asia",
  "Denso": "Прочие панели",
  "Dodge": "EU_US_RU",
  "DongFeng": "Asia",
  "FAW": "Asia",
  "Feeler": "Special technics",
  "Ferrari": "EU_US_RU",
  "Fiat": "EU_US_RU",
  "Force": "Asia",
  "Ford": "EU_US_RU",
  "Foton": "Asia",
  "Freightliner": "EU_US_RU",
  "GAZ": "EU_US_RU",
  "Geely": "Asia",
  "GMC": "EU_US_RU",
  "Golden Dragon": "Asia",
  "Great Wall": "Asia",
  "Hafei": "Asia",
  "Haima": "Asia",
  "Hamm": "Special technics",
  "Haval": "Asia",
  "Hidromek": "Special technics",
  "Higer": "Asia",
  "Hino": "Asia",
  "Hitachi": "Special technics",
  "Honda": "Asia",
  "Hummer": "EU_US_RU",
  "Hyundai": "Asia",
  "I": "Прочие панели",
  "I_ok": "Прочие панели",
  "Infiniti": "Asia",
  "International": "EU_US_RU",
  "Iran Khodro": "Asia",
  "Isuzu": "Asia",
  "Iveco": "EU_US_RU",
  "JAC": "Asia",
  "Jaguar": "EU_US_RU",
  "JCB": "Special technics",
  "Jeep": "EU_US_RU",
  "John Deere": "Special technics",
  "KAMAZ": "EU_US_RU",
  "Kansey": "Прочие панели",
  "KATO": "Special technics",
  "Kia": "Asia",
  "Kirovec": "Special technics",
  "Komatsu": "Special technics",
  "Kymco": "Mototechnics",
  "Lada": "EU_US_RU",
  "Lancia": "EU_US_RU",
  "Land Rover": "EU_US_RU",
  "LDV": "EU_US_RU",
  "Lexus": "Asia",
  "Lifan": "Asia",
  "Lincoln": "EU_US_RU",
  "Luxgen": "Asia",
  "Mahindra": "Asia",
  "MAN": "EU_US_RU",
  "Maserati": "EU_US_RU",
  "MAZ": "EU_US_RU",
  "Mazda": "Asia",
  "Mercedes-Benz": "Germany",
  "Mercury": "EU_US_RU",
  "MG": "Asia",
  "Mini": "Germany",
  "Mitsubishi": "Asia",
  "New Holland": "Special technics",
  "Nissan": "Asia",
  "Opel": "Germany",
  "Peugeot": "France",
  "Polaris": "Mototechnics",
  "Pontiac": "EU_US_RU",
  "Porsche": "Germany",
  "Renault": "France",
  "Rolls Royce": "EU_US_RU",
  "Rover": "EU_US_RU",
  "Saab": "EU_US_RU",
  "Samand": "Asia",
  "Samsung": "Asia",
  "Scion": "Asia",
  "Seat": "Germany",
  "Shaanxi": "Asia",
  "Shantui": "Special technics",
  "Sinotruk": "Asia",
  "Skoda": "Germany",
  "Smart": "Germany",
  "SsangYong": "Asia",
  "Stels": "Mototechnics",
  "Subaru": "Asia",
  "Suzuki": "Asia",
  "TAGAZ": "Asia",
  "Tager": "EU_US_RU",
  "TATA": "Asia",
  "TCM": "Special technics",
  "Terex": "Special technics",
  "TFN": "Special technics",
  "Toyota": "Asia",
  "Trend": "Прочие панели",
  "UAZ": "EU_US_RU",
  "VAZ": "EU_US_RU",
  "Visteon": "Прочие панели",
  "Volkswagen": "Germany",
  "Volvo": "EU_US_RU",
  "Vortex": "Asia",
  "XCMG": "Special technics",
  "Yamaha": "Mototechnics",
  "Yazaki": "Прочие панели",
  "ZAZ": "EU_US_RU",
  "Русская Механика": "Mototechnics"
};
const BRAND_BY_LOWER=new Map(Object.entries(BRAND_SECTIONS).map(([name,section])=>[name.toLowerCase(),section]));
const SUBSECTIONS=Object.freeze(['Asia','CRYPTO','EU_US_RU','France','Germany','Mototechnics','Service calc','Special technics','Прочие панели']);
const SUBSECTION_SET=new Set(SUBSECTIONS);
const MOTO_CATEGORIES=Object.freeze({motobikes:'Motobikes',moto:'Motobikes',atv:'ATV',atvs:'ATV',snowmobile:'Snowmobiles',snowmobiles:'Snowmobiles','jet ski':'Jet Ski',jetski:'Jet Ski'});
const SPECIAL_BRAND=new Set(Object.entries(BRAND_SECTIONS).filter(([,section])=>section==='Special technics').map(([name])=>name.toLowerCase()));
const MOTO_BRAND=new Set(Object.entries(BRAND_SECTIONS).filter(([,section])=>section==='Mototechnics').map(([name])=>name.toLowerCase()));
function brandSection(name){return BRAND_BY_LOWER.get(String(name||'').toLowerCase())||null;}
function categoryOf(text){
 if(/ski-?doo|mxz|summit|snow|taiga|arctic|renegade|expedition|lynx/i.test(text))return 'Snowmobiles';
 if(/sea-?doo|wave|waverunner|jet|fx.?1100|gtx|rxt|spark/i.test(text))return 'Jet Ski';
 return 'ATV';
}
function motoPath(value){
 let parts=value.split('/');
 if(parts[0]==='Dashboard'&&parts[1]==='Mototechnics')parts=parts.slice(2);
 else if(parts[0]==='Dashboard')parts=parts.slice(1);
 else if(parts[0]==='MOTO - TRUCK - ATV')parts=parts.slice(1);
 else if(parts[0]==='Asia')parts=parts.slice(1);
 else if(parts[0]==='ATV'){parts=parts.slice(1);return ['Dashboard','Mototechnics','ATV',...parts].join('/');}
 if(!parts.length)return 'Dashboard/Mototechnics';
 const first=parts[0],low=first.toLowerCase();
 if(low==='forklift truck')return ['Dashboard','Special technics',...parts.slice(1)].join('/');
 if(low==='kobuta')return ['Dashboard','Special technics',...parts].join('/');
 if(low==='ski-doo')return ['Dashboard','Mototechnics','Snowmobiles',...parts].join('/');
 const known=MOTO_CATEGORIES[low];
 if(known)return ['Dashboard','Mototechnics',known,...parts.slice(1)].join('/');
 const text=[first,...parts.slice(1)].join(' ');
 return ['Dashboard','Mototechnics',categoryOf(text),...parts].join('/');
}
function dashboardPath(value){
 const parts=value.split('/'),second=parts[1];
 if(!second)return value;
 if(second==='Mototechnics')return motoPath(value);
 if(SUBSECTION_SET.has(second))return value;
 const low=second.toLowerCase();
 if(MOTO_CATEGORIES[low])return motoPath(value);
 if(low==='forklift truck')return ['Dashboard','Special technics',...parts.slice(2)].join('/');
 const section=brandSection(second);
 if(section==='Mototechnics')return motoPath(value);
 if(section==='Прочие панели')return ['Dashboard','Прочие панели',...parts.slice(1)].join('/');
 if(section)return ['Dashboard',section,...parts.slice(1)].join('/');
 return ['Dashboard','Прочие панели',...parts.slice(1)].join('/');
}
function residualPath(value,fallbackRegion){
 const parts=value.split('/'),second=parts[1];
 if(!second)return ['Dashboard',fallbackRegion].join('/');
 const low=second.toLowerCase();
 if(low==='china')return ['Dashboard','Asia',...parts.slice(2)].join('/');
 if(MOTO_CATEGORIES[low]||['forklift truck','ski-doo','kobuta'].includes(low)||MOTO_BRAND.has(low))return motoPath(value);
 if(SPECIAL_BRAND.has(low))return ['Dashboard','Special technics',...parts.slice(1)].join('/');
 const section=brandSection(second);
 if(section&&section!=='Mototechnics')return ['Dashboard',section,...parts.slice(1)].join('/');
 return ['Dashboard',fallbackRegion,...parts.slice(1)].join('/');
}
function folder(value){
 if(typeof value!=='string'||!value)return value;
 const parts=value.split('/'),rootName=parts[0];
 if(rootName==='Dashboard')return dashboardPath(value);
 if(rootName==='ECU')return ['Engine',...parts.slice(1)].join('/');
 if(rootName==='Bikes')return ['Immo','Bikes',...parts.slice(1)].join('/');
 if(rootName==='Car')return ['Immo','Car',...parts.slice(1)].join('/');
 if(rootName==='CRYPTO+')return ['Dashboard','CRYPTO',...parts.slice(1)].join('/');
 if(rootName==='MOTO - TRUCK - ATV')return motoPath(value);
 if(rootName==='ATV')return ['Dashboard','Mototechnics','ATV',...parts.slice(1)].join('/');
 if(rootName==='Peugeot')return ['Dashboard','France','Peugeot',...parts.slice(1)].join('/');
 if(rootName==='CHINA')return ['Dashboard','Asia',...parts.slice(1)].join('/');
 if(rootName==='Asia')return residualPath(value,'Asia');
 if(rootName==='EU_US_RU')return residualPath(value,'EU_US_RU');
 return value;
}
function path(value){
 if(typeof value!=='string'||!value)return value;
 const cut=value.lastIndexOf('/');
 if(cut<0)return value;
 return folder(value.slice(0,cut))+'/'+value.slice(cut+1);
}
const api=Object.freeze({schema:1,date:'2026-11-06',source:'iProgGuard dashboard lists dated 2026-08-01',subsections:SUBSECTIONS,brandSections:Object.freeze({...BRAND_SECTIONS}),folder,path});
root.CatalogLayout=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
