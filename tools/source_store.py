"""Lossless, selective source storage. Never executes files from an archive.

Build a private data repository from ZIPs; find by exact basename; restore one
file by SHA-256. GitHub reads use the user's existing authenticated gh CLI.
No token is accepted on the command line or written into the repository.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import zipfile
import zlib

CHUNK = 256 * 1024
MAX_FILE = 1024 * 1024 * 1024


def digest_file(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda: f.read(8 * 1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def bucket(name):
    return hashlib.sha256(name.casefold().encode('utf-8')).hexdigest()[:2]


def basename(name):
    return name.replace('\\', '/').rsplit('/', 1)[-1]


def object_path(sha):
    if len(sha) != 64 or any(c not in '0123456789abcdef' for c in sha):
        raise ValueError('Invalid SHA-256')
    return f'objects/{sha[:2]}/{sha}.json'


def build(args):
    out = Path(args.out).resolve()
    if out.exists() and any(out.iterdir()):
        raise ValueError('Output must be empty; existing data will not be overwritten')
    out.mkdir(parents=True, exist_ok=True)
    archives, entries, objects, buckets = [], [], {}, {}
    for source in args.archives:
        source = Path(source).resolve()
        archive_sha = digest_file(source)
        record = {'name': source.name, 'sha256': archive_sha,
                  'bytes': source.stat().st_size, 'asset': f'archive-{archive_sha[:12]}.zip',
                  'files': 0, 'directories': 0, 'uncompressed_bytes': 0}
        with zipfile.ZipFile(source) as archive:
            for ordinal, info in enumerate(archive.infolist()):
                if info.is_dir():
                    record['directories'] += 1
                    continue
                if info.file_size > MAX_FILE:
                    raise ValueError('Member exceeds the supported size limit: ' + info.filename)
                hasher, compressor, count = hashlib.sha256(), zlib.compressobj(6), 0
                # Streaming preserves even large logs without holding them in RAM.
                with tempfile.TemporaryFile(dir=out) as packed:
                    with archive.open(info) as f:
                        for block in iter(lambda: f.read(1024 * 1024), b''):
                            count += len(block)
                            if count > MAX_FILE:
                                raise ValueError('Oversized member')
                            hasher.update(block)
                            packed.write(compressor.compress(block))
                    packed.write(compressor.flush())
                    compressed_size = packed.tell()
                    sha = hasher.hexdigest()
                    if count != info.file_size:
                        raise ValueError('ZIP size mismatch')
                    if sha not in objects:
                        packed.seek(0)
                        obj = {'schema': 1, 'sha256': sha, 'bytes': count,
                               'encoding': 'zlib+base64', 'compressed_bytes': compressed_size}
                        if compressed_size <= CHUNK:
                            obj['data'] = base64.b64encode(packed.read()).decode('ascii')
                        else:
                            obj['chunks'] = []
                            for i, data in enumerate(iter(lambda: packed.read(CHUNK), b'')):
                                rel = f'chunks/{sha[:2]}/{sha}/{i:05d}.b64'
                                target = out / rel
                                target.parent.mkdir(parents=True, exist_ok=True)
                                target.write_text(base64.b64encode(data).decode('ascii') + '\n')
                                obj['chunks'].append({'path': rel, 'bytes': len(data),
                                                      'sha256': hashlib.sha256(data).hexdigest()})
                        write_json(out / object_path(sha), obj)
                        objects[sha] = count
                entry = {'archive': archive_sha, 'member': ordinal, 'path': info.filename,
                         'sha256': sha, 'bytes': count, 'crc32': f'{info.CRC:08x}'}
                entries.append(entry)
                buckets.setdefault(bucket(basename(info.filename)), []).append(entry)
                record['files'] += 1
                record['uncompressed_bytes'] += count
        archives.append(record)
        print(json.dumps(record, ensure_ascii=False), flush=True)
    index_paths = []
    for prefix, rows in sorted(buckets.items()):
        rel = f'indexes/by-name/{prefix}.jsonl'
        target = out / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(''.join(json.dumps(x, ensure_ascii=False, separators=(',', ':')) + '\n'
                                  for x in rows), encoding='utf-8')
        index_paths.append(rel)
    for archive in archives:
        rows = [e for e in entries if e['archive'] == archive['sha256']]
        rel = f"indexes/by-archive/{archive['sha256']}.jsonl"
        target = out / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(''.join(json.dumps(x, ensure_ascii=False, separators=(',', ':')) + '\n'
                                  for x in rows), encoding='utf-8')
        index_paths.append(rel)
    manifest = {'schema': 1, 'format': 'iprocal-source-store',
                'original_release_tag': 'originals-2026-11-02', 'archives': archives,
                'files': len(entries), 'unique_contents': len(objects),
                'unique_bytes': sum(objects.values()), 'chunk_bytes': CHUNK,
                'index_files': [{'path': p, 'sha256': digest_file(out / p)} for p in index_paths]}
    write_json(out / 'MANIFEST.json', manifest)
    (out / '.gitignore').write_text('*.zip\n__pycache__/\n.restore/\n')
    print(json.dumps({k: v for k, v in manifest.items() if k not in ['archives', 'index_files']}))


class Store:
    def __init__(self, args):
        self.root, self.repo, self.ref = args.root, args.repo, args.ref

    def read(self, rel):
        if rel.startswith('/') or '..' in Path(rel).parts:
            raise ValueError('Unsafe object path')
        if self.root:
            return (Path(self.root) / rel).read_bytes()
        if not self.repo:
            raise ValueError('Specify --root or --repo')
        # gh returns GitHub's base64 response, never its access token.
        from urllib.parse import quote
        endpoint = f'repos/{self.repo}/contents/{quote(rel, safe="/")}?ref={quote(self.ref, safe="")}'
        result = json.loads(subprocess.check_output(['gh', 'api', endpoint]))
        if result.get('encoding') == 'none' and result.get('sha'):
            result = json.loads(subprocess.check_output(['gh', 'api', f'repos/{self.repo}/git/blobs/{result["sha"]}']))
        if result.get('encoding') != 'base64':
            raise ValueError('GitHub did not return file bytes')
        return base64.b64decode(result['content'])


def restore(store, sha, output):
    obj = json.loads(store.read(object_path(sha)))
    if obj.get('schema') != 1 or obj.get('sha256') != sha or obj.get('encoding') != 'zlib+base64':
        raise ValueError('Unexpected object manifest')
    expected = obj['bytes']
    if not isinstance(expected, int) or not 0 <= expected <= MAX_FILE:
        raise ValueError('Invalid output size')
    def parts():
        if 'data' in obj:
            yield base64.b64decode(obj['data'], validate=True)
        else:
            for chunk in obj['chunks']:
                b = base64.b64decode(store.read(chunk['path']).strip(), validate=True)
                if len(b) != chunk['bytes'] or hashlib.sha256(b).hexdigest() != chunk['sha256']:
                    raise ValueError('Corrupt compressed chunk')
                yield b
    h, decoder, count, compressed = hashlib.sha256(), zlib.decompressobj(), 0, 0
    for data in parts():
        compressed += len(data)
        while data:
            b = decoder.decompress(data, min(1024 * 1024, expected - count + 1))
            data = decoder.unconsumed_tail
            count += len(b)
            if count > expected:
                raise ValueError('Decompressed file too large')
            h.update(b)
            output.write(b)
    tail = decoder.flush()
    count += len(tail)
    if count > expected:
        raise ValueError('Decompressed file too large')
    h.update(tail)
    output.write(tail)
    if not decoder.eof or decoder.unused_data or count != expected or h.hexdigest() != sha:
        raise ValueError('Restored bytes do not match the original SHA-256')
    if compressed != obj['compressed_bytes']:
        raise ValueError('Compressed size mismatch')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('build'); p.add_argument('--out', required=True); p.add_argument('archives', nargs='+')
    for name in ['find', 'get', 'verify']:
        p = sub.add_parser(name)
        group = p.add_mutually_exclusive_group(required=True)
        group.add_argument('--root'); group.add_argument('--repo')
        p.add_argument('--ref', default='main')
        if name == 'find':
            p.add_argument('--name', required=True)
        if name == 'get':
            p.add_argument('--sha', required=True); p.add_argument('--output', required=True)
    args = parser.parse_args()
    if args.command == 'build':
        build(args); return
    store = Store(args)
    if args.command == 'find':
        rel = f'indexes/by-name/{bucket(args.name)}.jsonl'
        for line in store.read(rel).decode('utf-8').splitlines():
            entry = json.loads(line)
            if basename(entry['path']).casefold() == args.name.casefold():
                print(json.dumps(entry, ensure_ascii=False))
    elif args.command == 'get':
        target = Path(args.output)
        if target.exists():
            raise ValueError('Output already exists; refusing to overwrite')
        target.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as f:
            temporary = Path(f.name)
            try:
                restore(store, args.sha, f)
            except BaseException:
                temporary.unlink(missing_ok=True); raise
        os.replace(temporary, target)
        print(json.dumps({'file': str(target), 'sha256': args.sha, 'verified': True}))
    else:
        manifest = json.loads(store.read('MANIFEST.json'))
        unique, entries = set(), 0
        for index in manifest['index_files']:
            raw = store.read(index['path'])
            if hashlib.sha256(raw).hexdigest() != index['sha256']:
                raise ValueError('Index hash mismatch: ' + index['path'])
            if index['path'].startswith('indexes/by-archive/'):
                for line in raw.decode('utf-8').splitlines():
                    e = json.loads(line); unique.add(e['sha256']); entries += 1
        if entries != manifest['files'] or len(unique) != manifest['unique_contents']:
            raise ValueError('Index totals mismatch')
        with open(os.devnull, 'wb') as sink:
            for n, sha in enumerate(sorted(unique), 1):
                restore(store, sha, sink)
                if n % 2000 == 0:
                    print('Verified', n, flush=True)
        print(json.dumps({'verified_files': entries, 'verified_unique_contents': len(unique)}))


if __name__ == '__main__':
    main()
