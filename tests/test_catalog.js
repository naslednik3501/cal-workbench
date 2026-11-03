const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');require('../catalog.js');for(const part of require('../catalog-parts.json'))require('../'+part);
const db=CAL_CATALOG;assert.equal(db.entries.length,23946);assert.equal(db.entries.filter(x=>x.ext==='cal').length,23357);assert.equal(new Set(db.entries.filter(x=>x.ext==='cal').map(x=>x.sha)).size,15057);
for(const [sha,b64] of Object.entries(db.blobs)){const bytes=Buffer.from(b64,'base64');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sha);}
for(const e of db.entries)assert.equal(Buffer.from(db.blobs[e.sha],'base64').length,e.size);
let html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync(path.join(__dirname,'..',match[1])),match[1]);assert(!/<script(?![^>]*src)[^>]*>/.test(html));
console.log('PASS All 23,946 entries reference intact SHA-256-verified bytes; 8,300 repeated CAL entries preserved. All HTML references exist.');
