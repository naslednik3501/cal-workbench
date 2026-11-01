"""Package the standalone application without personal BIN test fixtures."""
from pathlib import Path
import hashlib
import json
import re
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]).resolve()
version = '0.5.0'

def included(path):
    rel = path.relative_to(root)
    return (path.is_file() and not any(part.startswith('.') for part in rel.parts)
            and '__pycache__' not in rel.parts
            and path.name != 'MANIFEST.json'
            and path.suffix not in {'.pyc', '.zip'}
            and not (rel.parts[0] == 'tests' and path.suffix.lower() in {'.bin', '.png'}))

files = sorted(p for p in root.rglob('*') if included(p))
for log, count in [('engine-results.txt', 15), ('ui-state-results.txt', 29), ('catalog-store-results.txt', 8)]:
    summary=json.loads((root / 'tests' / log).read_text().strip().splitlines()[-1])
    assert summary['passed'] == count and summary['failed'] == 0, f'Incomplete tests: {log}'
html = (root / 'index.html').read_text()
ids = re.findall(r'\bid="([^"]+)"', html)
assert len(ids) == len(set(ids)), 'Duplicate HTML IDs'
for ref in re.findall(r'(?:src|href)="([^"]+)"', html):
    assert (root / ref).is_file(), f'Missing HTML resource: {ref}'
for ref in re.findall(r"\$\('([^']+)'\)", (root / 'app.js').read_text()):
    assert ref in ids, f'Missing app element: {ref}'
assert hashlib.sha256((root / 'engine.js').read_bytes()).hexdigest() == 'c941163a816627fd8361418a639a3de14dc4bd5a1fbb1f7b8775c22f0ac0590b'
manifest = dict(version=version, files=[dict(path=str(p.relative_to(root)), bytes=p.stat().st_size,
    sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in files],
    validation=dict(engine_tests=15, app_state_tests=29, store_tests=8,
        catalog_hashes='passed', zip_to_catalog_identity='passed in 0.3; payload unchanged',
        browser_rendering='not tested', real_browser_storage='not tested', windows='not tested'),
    personal_bin_fixtures_included=False)
(root / 'MANIFEST.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
destination.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in files + [root / 'MANIFEST.json']:
        z.write(p, 'CAL_Workbench/' + str(p.relative_to(root)))
with zipfile.ZipFile(destination) as z:
    assert z.testzip() is None
    assert not any('/tests/' in n and n.lower().endswith('.bin') for n in z.namelist())
print(json.dumps(dict(file=str(destination), bytes=destination.stat().st_size,
    files=len(files)+1, sha256=hashlib.sha256(destination.read_bytes()).hexdigest())))
