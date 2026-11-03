'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),data=require('../image-resource-data.js'),images=require('../image-resources.js'),E=require('../engine.js');
const policy=require('../catalog-scope.js');
require('../catalog.js');
for(const part of JSON.parse(fs.readFileSync(path.join(root,'catalog-parts.json'))))require(path.join(root,part));
const db=globalThis.CAL_CATALOG,parsed=new Map();
const packaged=JSON.parse(fs.readFileSync(path.join(root,'image-assets.json')));
assert.deepEqual(packaged,Object.values(data.assets).map(x=>x.src).sort());
for(const [sha,asset] of Object.entries(data.assets)){
  assert.match(asset.src,new RegExp('^image-assets/'+sha+'\\.(png|jpg|bmp)$'));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,asset.src))).digest('hex'),sha);
  assert.ok(asset.width>0&&asset.height>0);
  assert.ok(['logo','board_chip_location','device_identification'].includes(asset.category));
}
for(const [key,binding] of Object.entries(data.mappings)){
  const [sha,id]=key.split(':');
  if(!parsed.has(sha))parsed.set(sha,E.parse(Buffer.from(db.blobs[sha],'base64')));
  const control=parsed.get(sha).form.controls.find(c=>String(c.id)===id);
  assert.equal(control.type,'P');assert.equal(control.text,binding.reference);
  assert.equal(images.resolve(sha,control).sha,binding.sha);
  assert.equal(policy.resourceExcluded(sha,control.id,binding.sha),false);
  assert.equal(images.resolve(sha,{...control,text:control.text+' changed'}),null);
  assert.equal(images.resolve('0'.repeat(64),control),null);
}
assert.equal(images.resolve('',null),null);
// Generic names are bound to their individual source context, never globally.
const vm=require('node:vm'),sandbox={CAL_IMAGE_DATA:{assets:{a:{src:'a.png'},b:{src:'b.png'}},mappings:{'calA:1':{reference:'1.png',sha:'a'},'calB:1':{reference:'1.png',sha:'b'}}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'image-resources.js'),'utf8'),sandbox);
assert.equal(sandbox.CAL_IMAGES.resolve('calA',{type:'P',id:1,text:'1.png'}).src,'a.png');
assert.equal(sandbox.CAL_IMAGES.resolve('calB',{type:'P',id:1,text:'1.png'}).src,'b.png');
assert.equal(sandbox.CAL_IMAGES.resolve('calC',{type:'P',id:1,text:'1.png'}),null);
console.log(`Image integrity and exact control bindings: ${Object.keys(data.assets).length} assets, ${Object.keys(data.mappings).length} controls, ${parsed.size} CAL contents passed`);
