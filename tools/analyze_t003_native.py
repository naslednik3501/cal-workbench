"""Static T-003 evidence; never load or execute the PE. Requires pefile/capstone.
Original retrieval: SOURCE_STORAGE.md, SHA below. --write updates only the proof.
"""
import argparse,hashlib,json,struct
from pathlib import Path
import pefile,capstone
ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--write',action='store_true');a=ap.parse_args()
sha='14a476590cc6b8f2396036cc4083087146263ab3c5d393c679883da234789f57'
b=Path(a.exe).read_bytes();assert len(b)==5843987 and hashlib.sha256(b).hexdigest()==sha
p=pefile.PE(data=b);base=p.OPTIONAL_HEADER.ImageBase;assert base==0x400000
m=p.get_memory_mapped_image();read=lambda va,n:m[va-base:va-base+n]
dispatch=0x78cc94
handlers={hex(op):hex(struct.unpack('<I',read(dispatch+op*4,4))[0]) for op in [0,1,0x4b,0x4c,0x4d,0x4e,0x4f]}
assert handlers['0x4d']=='0x451ddd'
assert read(0x451ea0,5)==bytes.fromhex('e8bbd7fbff') # call 0x40f660
assert read(0x40f676,5)==bytes.fromhex('e825feffff') and read(0x40f682,5)==bytes.fromhex('e819feffff')
assert read(0x40f695,6)==bytes.fromhex('81e7ffffff7f') # high & 0x7fffffff
assert read(0x40f6b3,5)==bytes.fromhex('e85898ffff') # signed int64 remainder helper
assert read(0x44da1f,5)==bytes.fromhex('e8dc6afcff') # per-event randomize
assert read(0x414500,11)==bytes.fromhex('e81bcbfeffa310608500c3')
assert read(0x401020,6)==bytes.fromhex('ff25ecf98b00')
assert any(i.name==b'GetTickCount' and i.address==0x8bf9ec for d in p.DIRECTORY_ENTRY_IMPORT for i in d.imports)
md=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32)
spans=[]
for name,at,end in [('dispatch',0x44db24,0x44db38),('opcode_4d',0x451ddd,0x451ec6),('random63_mod',0x40f660,0x40f6d3),('mt_seed',0x40f450,0x40f494),('mt_word',0x40f4a0,0x40f614),('signed_remainder',0x408f10,0x408fee),('event_seed_call',0x44da12,0x44da24),('randomize',0x414500,0x41450b),('tick_stub',0x401020,0x401026)]:
 raw=read(at,end-at);spans.append(dict(name=name,va=hex(at),fileOffset=hex(p.get_offset_from_rva(at-base)),bytes=raw.hex(),sha256=hashlib.sha256(raw).hexdigest(),instructions=[dict(va=hex(i.address),op=i.mnemonic,args=i.op_str) for i in md.disasm(raw,at)]))
proof=dict(scope='Static original PE bytes only; PE was not executed',originalSha256=sha,originalBytes=len(b),sourceRepository='naslednik3501/iprocal-sources',sourceCommit='ab589e2bad449d7a94275f8365c1d44e6f700cc6',imageBase=hex(base),dispatchTable=hex(dispatch),handlers=handlers,semantics='R[byte] = ((MTword2 & 0x7fffffff) << 32 | MTword1) mod uint32_immediate; bound 0 returns 0 after consuming both words. MT19937 resets per event with host millisecond timer seed.',spans=spans)
out=Path('reports/T-003-native-proof-2026-11-04.json')
if a.write:out.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
else:assert json.loads(out.read_text())==proof
print(json.dumps(dict(sha=sha,spans=len(spans),opcodeHandler=handlers['0x4d'],passed=True)))
