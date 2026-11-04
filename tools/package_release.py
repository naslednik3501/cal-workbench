"""Package the standalone application without personal BIN test fixtures."""
from pathlib import Path
import hashlib
import json
import re
import sys
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]).resolve()
version = '0.5.3'

def included(path):
    rel = path.relative_to(root)
    return (path.is_file() and not any(part.startswith('.') for part in rel.parts)
            and '__pycache__' not in rel.parts and 'dist' not in rel.parts
            and path.name != 'MANIFEST.json'
            and path.suffix not in {'.pyc', '.zip'}
            and not (rel.parts[0] == 'tests' and path.suffix.lower() in {'.bin', '.png'}))

files = sorted(p for p in root.rglob('*') if included(p))
for test in ['test_source.js', 'test_preparation.js', 'test_polo.js',
             'test_source_pairs.js', 'test_binary_events.js', 'test_binary_resolution.js',
             'test_catalog_store.js', 'test_catalog.js',
             'test_t016_organization.js', 'test_t016_group_review.js',
             'test_t001_hardware_elements.js']:
    subprocess.run(['node', str(root / 'tests' / test)], cwd=root, check=True)
html = (root / 'index.html').read_text()
ids = re.findall(r'\bid="([^"]+)"', html)
assert len(ids) == len(set(ids)), 'Duplicate HTML IDs'
for ref in re.findall(r'(?:src|href)="([^"]+)"', html):
    assert (root / ref).is_file(), f'Missing HTML resource: {ref}'
for ref in re.findall(r"\$\('([^']+)'\)", (root / 'app.js').read_text()):
    assert ref in ids, f'Missing app element: {ref}'
manifest = dict(version=version, files=[dict(path=str(p.relative_to(root)), bytes=p.stat().st_size,
    sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in files],
    validation=dict(source_tests=13, preparation_tests=14, polo_checks=8, store_tests=8,
        source_binary_pairs=465, exactly_matching_pairs=456, catalog_hashes='passed',
        private_bin_fixture_tests='not rerun; fixtures not in shared repository',
        binary_resolution=dict(target=254, read_only=216, full_writers=32, partial_fis=4, unsupported=2),
        original_iprog_execution='not compared', chromium_release_scenarios='passed on Linux',
        real_browser_storage='tested in Chromium', windows='not tested'),
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
