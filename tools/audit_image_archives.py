"""Read-only image inventory, including nested RAR/ZIP/7z via libarchive.
Usage: python tools/audit_image_archives.py REFERENCES.json OUTPUT_DIR ZIP...
Requires Pillow and system libarchive. Name matches are candidates, not mappings.
Only image and nested-archive bytes are read; original programs never execute.
"""
import collections, ctypes as C, ctypes.util, hashlib, io, json, sys, zipfile
from pathlib import Path, PurePosixPath as P
from PIL import Image
IMG={'.png','.bmp','.jpg','.jpeg','.gif','.tif','.tiff','.webp','.ico','.svg'}
ARC={'.rar','.zip','.7z'}
refs_path,out_arg,*args=sys.argv[1:];out=Path(out_arg);out.mkdir(parents=True,exist_ok=True)
(out/'images').mkdir(exist_ok=True)
images=[];archives=[];issues=[];sources=[]
def norm(p):
 a=[]
 for x in p.replace('\\','/').split('/'):
  if x=='..':
   if a:a.pop()
  elif x and x!='.':a.append(x)
 return '/'.join(a)
def sha(b):return hashlib.sha256(b).hexdigest()
lib=C.CDLL(ctypes.util.find_library('archive'))
for n,a,r in [('archive_read_new',[],C.c_void_p),('archive_read_support_format_all',[C.c_void_p],C.c_int),('archive_read_support_filter_all',[C.c_void_p],C.c_int),('archive_read_open_memory',[C.c_void_p,C.c_void_p,C.c_size_t],C.c_int),('archive_read_next_header',[C.c_void_p,C.POINTER(C.c_void_p)],C.c_int),('archive_entry_pathname',[C.c_void_p],C.c_char_p),('archive_entry_size',[C.c_void_p],C.c_int64),('archive_read_data',[C.c_void_p,C.c_void_p,C.c_size_t],C.c_ssize_t),('archive_read_data_skip',[C.c_void_p],C.c_int),('archive_read_free',[C.c_void_p],C.c_int),('archive_error_string',[C.c_void_p],C.c_char_p)]:
 f=getattr(lib,n);f.argtypes=a;f.restype=r
def members(data):
 a=lib.archive_read_new();lib.archive_read_support_format_all(a);lib.archive_read_support_filter_all(a)
 buf=C.create_string_buffer(data);e=C.c_void_p()
 try:
  if lib.archive_read_open_memory(a,buf,len(data))<0:raise ValueError(str(lib.archive_error_string(a)))
  while True:
   rc=lib.archive_read_next_header(a,C.byref(e))
   if rc==1:break
   if rc<0:raise ValueError(str(lib.archive_error_string(a)))
   raw=lib.archive_entry_pathname(e) or b''
   try:name=raw.decode('utf8')
   except UnicodeDecodeError:name=raw.decode('cp1251')
   size=lib.archive_entry_size(e);payload=None
   if P(name).suffix.lower() in IMG|ARC and 0<=size<=200*1024*1024:
    chunks=[];tmp=C.create_string_buffer(1024*1024)
    while True:
     n=lib.archive_read_data(a,tmp,len(tmp))
     if n==0:break
     if n<0:raise ValueError(str(lib.archive_error_string(a)))
     chunks.append(tmp.raw[:n])
    payload=b''.join(chunks)
   else:lib.archive_read_data_skip(a)
   yield name,size,payload
 finally:lib.archive_read_free(a)
def add_image(source,path,data,nested=False):
 digest=sha(data);ext=P(path).suffix.lower();target=out/'images'/(digest+ext)
 if not target.exists():target.write_bytes(data)
 r={'source':source,'path':norm(path),'basename':P(norm(path)).name.lower(),'sha256':digest,'bytes':len(data),'nested':nested,'extension':ext,'local':str(target)}
 try:
  with Image.open(io.BytesIO(data)) as im:r.update(width=im.width,height=im.height,format=im.format);im.load()
 except Exception as e:r['image_error']=str(e)
 images.append(r)
def nested(source,path,data,depth=0):
 r={'source':source,'path':path,'sha256':sha(data),'members':0,'images':0,'status':'ok'};archives.append(r)
 if depth>3:r['status']='depth_limit';return
 try:
  for name,size,payload in members(data):
   r['members']+=1
   if payload is None:continue
   ext=P(name).suffix.lower();full=path+'!/'+name
   if ext in IMG:add_image(source,full,payload,True);r['images']+=1
   elif ext in ARC:nested(source,full,payload,depth+1)
 except Exception as e:r.update(status='error',error=str(e))
for arg in args:
 p=Path(arg);h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
 meta={'name':p.name,'zip_sha256':h.hexdigest(),'files':0,'images':0}
 with zipfile.ZipFile(p) as z:
  for i in z.infolist():
   if i.is_dir() or i.filename.startswith('__MACOSX/'):continue
   meta['files']+=1;ext=P(i.filename).suffix.lower()
   if ext not in IMG|ARC:continue
   try:data=z.read(i)
   except Exception as e:issues.append({'source':p.name,'path':i.filename,'error':str(e)});continue
   if ext in IMG:add_image(p.name,i.filename,data);meta['images']+=1
   else:nested(p.name,i.filename,data)
 sources.append(meta);print(json.dumps(meta,ensure_ascii=False),flush=True)
rd=json.loads(Path(refs_path).read_text());by_name=collections.defaultdict(list)
for i,img in enumerate(images):by_name[img['basename']].append(i)
rows=[]
for r in rd['refs']:
 if r['resolved']:continue
 ids=by_name.get(P(norm(r['reference'])).name.lower(),[]);r=dict(r);r['candidate_ids']=ids
 r['candidate_contents']=len({images[i]['sha256'] for i in ids})
 r['match_status']='blank' if not r['reference'].strip() else 'name_candidates' if ids else 'not_found';rows.append(r)
summary={'references':rd['summary'],'sources':sources,'image_entries':len(images),'unique_image_contents':len({x['sha256'] for x in images}),
 'nested_archive_count':len(archives),'nested_archive_errors':[a for a in archives if a['status']!='ok'],
 'nested_image_entries':sum(i['nested'] for i in images),'read_errors':issues,
 'missing_statuses':dict(collections.Counter(r['match_status'] for r in rows)),
 'missing_names_with_candidates':len({r['reference'].lower() for r in rows if r['candidate_ids']}),
 'references_with_different_candidate_contents':sum(r['candidate_contents']>1 for r in rows),
 'matched_candidate_contents':len({images[i]['sha256'] for r in rows for i in r['candidate_ids']})}
(out/'archive-index.json').write_text(json.dumps({'summary':summary,'images':images,'nested_archives':archives,'unresolved':rows},ensure_ascii=False,indent=2))
(out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False,indent=2))
