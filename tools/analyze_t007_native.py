"""Static metadata/Delphi-method evidence for exactly two T-007 PE files.
Use the catalog's original bytes named SHA.cal in --dir. No code is executed.
Research dependency: pefile. --write stores the short proof, not the executables.
"""
import argparse,json,hashlib,struct
from pathlib import Path
import pefile
ap=argparse.ArgumentParser();ap.add_argument('--dir',required=True);ap.add_argument('--write',action='store_true');a=ap.parse_args()
shas=['f8607236f8dcf2d50e3cd6658bbb1967a0d255e6bfdfaf488f6be30bc0e39096','1835b7bd0c920dd79c169af7dc2744fb0e478fee79d2b687a2bba4c9f5f1a353'];rows=[]
for sha in shas:
 b=(Path(a.dir)/(sha+'.cal')).read_bytes();assert hashlib.sha256(b).hexdigest()==sha;p=pefile.PE(data=b)
 row={'sha':sha,'machine':p.FILE_HEADER.Machine,'entryRva':p.OPTIONAL_HEADER.AddressOfEntryPoint,'entryBytes':p.get_data(p.OPTIONAL_HEADER.AddressOfEntryPoint,32).hex(),'versionStrings':{},'resources':[]}
 for files in getattr(p,'FileInfo',[]):
  for item in files:
   for table in getattr(item,'StringTable',[]):row['versionStrings'].update({k.decode():v.decode('cp1251')for k,v in table.entries.items()})
 for e in p.DIRECTORY_ENTRY_RESOURCE.entries:
  if e.id!=10:continue
  for n in e.directory.entries:
   d=n.directory.entries[0].data.struct;v=p.get_data(d.OffsetToData,d.Size);row['resources'].append({'name':str(n.name or n.id),'bytes':len(v),'prefix':v[:16].hex(),'sha256':hashlib.sha256(v).hexdigest()})
 assert row['versionStrings']['ProductName']=='Audi VDO Crypto calculator'
 if sha.startswith('1835'):
  methods=[]
  for name in [b'Make_Decrypt',b'Open_encrypted_buttonClick',b'Open_decrypted_buttonClick',b'Save_encrypted_buttonClick',b'Save_decrypted_buttonClick',b'Set_KM_buttonClick']:
   off=b.find(name);assert b[off-1]==len(name);va=struct.unpack_from('<I',b,off-5)[0];assert 0x400000<va<0x470000;methods.append({'name':name.decode(),'va':hex(va),'tableFileOffset':hex(off-5)})
  row['methods']=methods;row['decryptionEntryProof']={'va':'0x44f454','fileOffset':hex(p.get_offset_from_rva(0x4f454)),'firstBytes':p.get_data(0x4f454,256).hex(),'operations':'Static code references 16-bit transformation 0x44f2c0, 1024-word loop, XOR and lookup table 0x4549ec; further GUI/file routines not ported.'}
 rows.append(row)
result={'scope':'Static PE metadata and named method addresses only, not a recovered algorithm or execution test','files':rows};out=Path('reports/T-007-native-evidence-2026-11-04.json')
if a.write:out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
else:assert json.loads(out.read_text())==result
print(json.dumps({'nativePE':2,'executed':0,'metadataVerified':True}))
