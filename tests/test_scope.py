"""Synthetic build tests; original ZIPs and source store are not modified."""
import copy, hashlib, importlib.util, json, pathlib, shutil, subprocess, tempfile, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('scope_policy',ROOT/'tools/scope_policy.py')
P=importlib.util.module_from_spec(spec);spec.loader.exec_module(P)
def digest(b):return hashlib.sha256(b).hexdigest()
a,b,c=map(digest,[b'hardware',b'changed',b'image'])
def decision(sha,kind='standalone_program'):
 return dict(category='hardware_only',kind=kind,action='keep' if kind=='resource' else 'exclude',date='2026-11-03',reason='synthetic evidence',evidence={'report':'synthetic'},original={'sha256_verified':True,'object_path':f'objects/{sha[:2]}/{sha}.json'})
r=dict(schema=1,default_action='keep',source_repository='owner/private',source_ref='1'*40,decisions={a:decision(a),c:decision(c,'resource')},resource_rules=[],element_rules=[])
variants=[r]
for field,value in [('category','mixed'),('kind','resource'),('action','invalid')]:
 bad=copy.deepcopy(r);bad['decisions'][a][field]=value;variants.append(bad)
bad=copy.deepcopy(r);bad['decisions'][a]['original']['sha256_verified']=False;variants.append(bad)
bad=copy.deepcopy(r);bad['source_ref']='main';variants.append(bad)
rule=dict(cal_sha=b,resource_sha=c,control_id=0,action='exclude',mapping_verified=True,evidence={'report':'synthetic'})
with_rule=copy.deepcopy(r);with_rule['resource_rules']=[rule];variants.append(with_rule)
for field,value in [('mapping_verified',False),('control_id',True),('resource_sha',a)]:
 bad=copy.deepcopy(with_rule);bad['resource_rules'][0][field]=value;variants.append(bad)
element=dict(cal_sha=b,element_type='L',element_id=1,reference='hardware note',action='exclude',mapping_verified=True,evidence={'report':'synthetic'})
with_element=copy.deepcopy(r);with_element['element_rules']=[element];variants.append(with_element)
for field,value in [('mapping_verified',False),('element_type','B')]:
 bad=copy.deepcopy(with_element);bad['element_rules'][0][field]=value;variants.append(bad)
bad=copy.deepcopy(with_element);bad['element_rules'].append(copy.deepcopy(element));variants.append(bad)
group=copy.deepcopy(r);group['element_rules']=[dict(cal_sha=b,element_type='G',element_id=1,reference='warning',action='exclude',mapping_verified=True,evidence={'report':'synthetic'})];variants.append(copy.deepcopy(group))
group['element_rules'][0]['evidence']['children']=[dict(id=2,type='L',text='hardware')];variants.append(copy.deepcopy(group))
picture=copy.deepcopy(r);picture['element_rules']=[dict(cal_sha=b,element_type='P',element_id=1,reference='24c16.png',action='exclude',mapping_verified=True,evidence={'report':'synthetic'})];variants.append(copy.deepcopy(picture))
picture['element_rules'][0]['evidence']['candidate_images']=[dict(sha256=c,category='hardware_wiring',path='EEPROM/24C16.png')];variants.append(copy.deepcopy(picture))
results=[]
for x in variants:
 try:P.validate_registry(x);results.append(True)
 except (ValueError,KeyError,TypeError):results.append(False)
js="const p=require('./catalog-scope.js');const rs=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(rs.map(r=>{try{p.validate(r);return true}catch{return false}})))"
assert json.loads(subprocess.check_output(['node','-e',js],input=json.dumps(variants).encode(),cwd=ROOT))==results
assert results==[True,False,False,False,False,False,True,False,False,False,True,False,False,False,False,True,False,True]
with tempfile.TemporaryDirectory() as tmp:
 root=pathlib.Path(tmp);(root/'tools').mkdir()
 for file in ['build_catalog.py','scope_policy.py']:shutil.copy(ROOT/'tools'/file,root/'tools'/file)
 (root/'scope-registry.json').write_text(json.dumps(r))
 archive=root/'original.zip'
 with zipfile.ZipFile(archive,'w') as z:
  z.writestr('one.cal',b'hardware');z.writestr('duplicate.cal',b'hardware');z.writestr('different/one.cal',b'changed');z.writestr('copy.cal',b'changed');z.writestr('shared.png',b'image')
 before=digest(archive.read_bytes())
 subprocess.run(['python3',str(root/'tools/build_catalog.py'),str(archive)],check=True,capture_output=True)
 assert digest(archive.read_bytes())==before
 db=json.loads((root/'catalog.js').read_text().split('=',1)[1].strip()[:-1]);assert len(db['entries'])==3
 assert db['meta']['calculators']==2 and db['meta']['uniqueCal']==1
 assert [e['path'] for e in db['entries']]==['different/one.cal','copy.cal','shared.png']
 # A packaging input can still contain archived entries: the dist filter must use its passed parts.
 db['entries'].append(dict(sha=a,path='archived.cal',ext='cal',size=8));(root/'catalog.js').write_text('globalThis.CAL_CATALOG='+json.dumps(db)+';\n')
 part='catalog-data/custom-part.js';(root/part).write_text('Object.assign(globalThis.CAL_CATALOG.blobs,'+json.dumps({a:'aGFyZHdhcmU=',b:'Y2hhbmdlZA==',c:'aW1hZ2U='})+');\n')
 assert P.filter_web_catalog(root,r,[part])==1
 assert a not in (root/part).read_text() and c in (root/part).read_text()
 assert P.filter_web_catalog(root,r,[part])==0
 print('PASS JS/Python policy agreement, ZIP rebuild exclusion, original ZIP preservation, duplicate paths, shared resources, dist filter and repeat build')
