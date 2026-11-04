import hashlib
from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'app.js'
b = p.read_bytes()
sha = hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
expected = '0e8a547fef137bfab99bcc2fab3de085bdebca35'
if sha != expected:
    raise SystemExit('Refusing unexpected app.js blob: ' + sha + '; review current source first')
old = "session=res.vm;dirtyInputs=true;clearResult();updateForm(session);log('Диапазон передан: '".encode()
new = "session=res.vm;dirtyInputs=true;clearResult();updateForm(session);$('calcError').hidden=true;log('Диапазон передан: '".encode()
if b.count(old) != 1:
    raise SystemExit('Expected exactly one selection-handler match')
p.write_bytes(b.replace(old, new, 1))
print('Patched selection success banner reset. Run tests and refresh MANIFEST.json before release.')
