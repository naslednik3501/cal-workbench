const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');require('../catalog.js');for(const part of require('../catalog-parts.json'))require('../'+part);
const root=path.join(__dirname,'..');
const db=CAL_CATALOG;assert.equal(db.entries.length,23946);assert.equal(db.entries.filter(x=>x.ext==='cal').length,23357);assert.equal(new Set(db.entries.filter(x=>x.ext==='cal').map(x=>x.sha)).size,15057);
for(const [sha,b64] of Object.entries(db.blobs)){const bytes=Buffer.from(b64,'base64');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sha);}
for(const e of db.entries)assert.equal(Buffer.from(db.blobs[e.sha],'base64').length,e.size);

// A repack that decodes UTF-8 names as CP437 must never reach the published
// catalog (see the 2026-11-09 name repair). A run of CP437 characters that
// decodes back to valid UTF-8 is the defect; ordinary names stay untouched.
const CP437='ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u00a0';
const BYTE=new Map([...CP437].map((c,i)=>[c,i+0x80]));
const undoCp437=text=>{let out='',i=0;while(i<text.length){if(!BYTE.has(text[i])){out+=text[i++];continue;}let j=i;while(j<text.length&&BYTE.has(text[j]))j++;const run=text.slice(i,j);let fixed=null;if(/[\u2500-\u259f]/.test(run)){try{fixed=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.from([...run].map(c=>BYTE.get(c))));}catch{}}out+=fixed??run;i=j;}return out;};
const damaged=text=>/[\u2500-\u259f]/.test(text)&&undoCp437(text)!==text;
for(const e of db.entries)assert(!damaged(e.path),'CP437 mojibake path '+e.path);
const shipped=['index.html','app.js','scope-data.js'].concat(fs.readdirSync(root).filter(n=>/^catalog-organization.*\.js$/.test(n)));
for(const name of shipped)assert(!damaged(fs.readFileSync(path.join(root,name),'utf8')),'CP437 mojibake in '+name);
let html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync(path.join(__dirname,'..',match[1].split('?',1)[0])),match[1]);assert(!/<script(?![^>]*src)[^>]*>/.test(html));
console.log('PASS All 23,946 entries reference intact SHA-256-verified bytes; 8,300 repeated CAL entries preserved. All HTML references exist.');
