"""Portable storage tests, using synthetic archives only."""
import argparse
import base64
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import random
import tempfile
import zipfile

script = Path(__file__).resolve().parents[1] / 'tools/source_store.py'
spec = importlib.util.spec_from_file_location('source_store', script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    zpath = root / 'fixture.zip'
    data = random.Random(319).randbytes(700000)
    files = [('folder/a.cal', b'hello'), ('other/a.cal', b'hello'),
             ('folder/empty.cal', b''), ('../outside.bin', b'kept as data'),
             ('random.bin', data), ('long.log', b'abcdef' * 200000)]
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, raw in files:
            z.writestr(name, raw)
    out = root / 'store'
    with contextlib.redirect_stdout(io.StringIO()):
        module.build(argparse.Namespace(out=str(out), archives=[str(zpath)]))
    manifest = json.loads((out / 'MANIFEST.json').read_text())
    assert manifest['files'] == 6 and manifest['unique_contents'] == 5
    store = module.Store(argparse.Namespace(root=str(out), repo=None, ref='main'))
    for name, raw in files:
        sha = hashlib.sha256(raw).hexdigest()
        restored = io.BytesIO()
        module.restore(store, sha, restored)
        assert restored.getvalue() == raw
    assert not (root / 'outside.bin').exists()
    sha = hashlib.sha256(data).hexdigest()
    obj = json.loads(store.read(module.object_path(sha)))
    assert len(obj['chunks']) > 1
    chunk = out / obj['chunks'][0]['path']
    chunk.write_text(base64.b64encode(b'corrupted').decode())
    try:
        module.restore(store, sha, io.BytesIO())
        raise AssertionError('Corrupt chunk accepted')
    except ValueError as error:
        assert 'Corrupt compressed chunk' in str(error)
    try:
        store.read('../outside')
        raise AssertionError('Unsafe path accepted')
    except ValueError:
        pass
print('PASS duplicate preservation, exact byte restoration, chunking, empty files, bounded streaming, corruption rejection and path isolation')
