"""Independent MT19937 word oracle (NumPy), no original executable is run."""
from pathlib import Path
import json,sys
import numpy as np
seeds={}
for seed in range(1000):
 lo,hi=map(int,np.random.RandomState(seed).randint(0,2**32,size=2,dtype=np.uint32))
 seeds.setdefault((((hi&0x7fffffff)<<32)|lo)%28,seed)
 if len(seeds)==28:break
assert len(seeds)==28
bounds=[0,1,2,28,0x80000000,0xffffffff];vectors=[]
for seed in [0,1,5489,0x80000000,0xffffffff]:
 words=list(map(int,np.random.RandomState(seed).randint(0,2**32,size=700,dtype=np.uint32)))
 values=[]
 for i in range(350):
  bound=bounds[i%len(bounds)]
  values.append((((words[i*2+1]&0x7fffffff)<<32)|words[i*2])%bound if bound else 0)
 vectors.append(dict(seed=seed,bounds=bounds,values=values,firstWords=words[:10]))
result={'reference':'NumPy RandomState legacy MT19937 raw uint32 words; Python integer 63-bit concatenation/mod, independent of JS engine','numpyVersion':np.__version__,'seedByIndex':[seeds[i] for i in range(28)],'vectors':vectors}
p=Path('tests/fixtures/t003-random-vectors.json')
if '--write' in sys.argv:p.write_text(json.dumps(result,indent=2)+'\n')
else:
 previous=json.loads(p.read_text());assert previous['seedByIndex']==result['seedByIndex'] and previous['vectors']==result['vectors']
print(json.dumps(dict(seeds=28,samples=1750,passed=True)))
