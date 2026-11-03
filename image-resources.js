/* Resolve restored illustrations only for the reviewed original CAL/control. */
(function(root){
  'use strict';
  const data=typeof module==='object'&&module.exports?require('./image-resource-data.js'):root.CAL_IMAGE_DATA;
  function resolve(calSha,control){
    if(!control||control.type!=='P')return null;
    const binding=data.mappings[calSha+':'+control.id];
    if(!binding||binding.reference!==control.text)return null;
    const asset=data.assets[binding.sha];
    return asset?{...asset,sha:binding.sha}:null;
  }
  const api=Object.freeze({resolve});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAL_IMAGES=api;
})(globalThis);
