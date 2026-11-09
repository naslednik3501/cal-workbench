"""Build a lossless catalog from authorized local archives; never deduplicate paths."""
import zipfile,hashlib,json,sys,pathlib,base64,collections
from scope_policy import load_registry, active, repair_name
registry=load_registry()
out=pathlib.Path(__file__).resolve().parents[1]
entries=[];blobs={};counts=collections.Counter();excluded=0;repaired=0
for archive in sys.argv[1:]:
 with zipfile.ZipFile(archive) as z:
  for info in z.infolist():
   name=repair_name(info.filename)
   if name!=info.filename:repaired+=1
   if info.is_dir() or name.startswith('__MACOSX/'):continue
   raw=z.read(info);sha=hashlib.sha256(raw).hexdigest()
   if not active({'sha':sha},registry):
    excluded+=1;continue
   if sha not in blobs:blobs[sha]=base64.b64encode(raw).decode()
   ext=name.rsplit('.',1)[-1].lower();counts[ext]+=1
   entries.append({'path':name,'sha':sha,'size':len(raw),'ext':ext,'source':pathlib.Path(archive).name})
meta={'version':'0.1.0','entries':len(entries),'calculators':counts['cal'],'uniqueCal':len({x['sha'] for x in entries if x['ext']=='cal'}),'sources':[pathlib.Path(x).name for x in sys.argv[1:]],'counts':dict(counts)}
(out/'catalog.js').write_text('globalThis.CAL_CATALOG='+json.dumps({'meta':meta,'entries':entries,'blobs':{}},ensure_ascii=True,separators=(',',':'))+';\n',encoding='utf8')
chunkdir=out/'catalog-data';chunkdir.mkdir(exist_ok=True)
for old in chunkdir.glob('part-*.js'):old.unlink()
chunks=[];part={};size=0
def flush():
 global part,size
 if not part:return
 name='part-%03d.js'%len(chunks)
 (chunkdir/name).write_text('Object.assign(globalThis.CAL_CATALOG.blobs,'+json.dumps(part,separators=(',',':'))+');\n',encoding='utf8')
 chunks.append('catalog-data/'+name);part={};size=0
for sha,data in blobs.items():
 if size+len(data)>1500000:flush()
 part[sha]=data;size+=len(data)
flush()
(out/'catalog-parts.json').write_text(json.dumps(chunks),encoding='utf8')
index=out/'index.html'
if index.exists():
 import re
 html=index.read_text()
 html=re.sub(r'<script src="catalog-data/part-\d+\.js"></script>', '', html)
 html=html.replace('<script src="catalog.js"></script>', '<script src="catalog.js"></script>'+''.join('<script src="'+x+'"></script>' for x in chunks))
 index.write_text(html,encoding='utf8')
(out/'catalog-summary.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'active':meta,'excluded_entries':excluded,'repaired_names':repaired},ensure_ascii=False))
