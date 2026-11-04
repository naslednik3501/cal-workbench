"""T-015: find nested containers in the private store and match unresolved T-010 references.

Usage (POSIX shell):
  python tools/t015_nested_archives.py scan     --store ../iprocal-sources --work /tmp/t015
  python tools/t015_nested_archives.py extract  --store ../iprocal-sources --work /tmp/t015
  python tools/t015_nested_archives.py classify --work /tmp/t015
  python tools/t015_nested_archives.py match    --work /tmp/t015

`all` runs the four steps in order. Every step only reads bytes: containers are
unpacked as data with libarchive (`bsdtar -xf`), no program from an archive is
ever started. A missing store checkout is reported, never invented: the private
repository is required for the scan, the extraction and the classification.
"""
import argparse
import base64
import collections
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import zipfile
import zlib

from source_store import Store, object_path, restore

ROOT = Path(__file__).resolve().parents[1]
REMAINDER = ROOT / 'reports' / 'T-010-remainder-2026-11-04.json'
CATALOG = ROOT / 'catalog.js'
IMAGE_ASSETS = ROOT / 'image-assets.json'

MAGIC = {
    b'PK\x03\x04': 'zip', b'PK\x05\x06': 'zip-empty', b'PK\x07\x08': 'zip-spanned',
    b'Rar!\x1a\x07': 'rar', b'7z\xbc\xaf\x27\x1c': '7z',
    b'\x1f\x8b': 'gzip', b'BZh': 'bzip2', b'\xfd7zXZ': 'xz',
    b'\x28\xb5\x2f\xfd': 'zstd', b'MSCF': 'cab', b'!<arch>': 'ar',
}
CONTAINER_EXT = {'rar', 'zip', '7z', 'cab', 'arj', 'lzh', 'lha', 'ace', 'gz', 'tar',
                 'bz2', 'xz', 'iso', 'odt'}
IMAGE_EXT = {'png', 'bmp', 'jpg', 'jpeg', 'gif'}


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def magic_of(head):
    for signature, kind in MAGIC.items():
        if head.startswith(signature):
            return kind
    return None


def decompressed_head(path, store):
    """First bytes of an object without restoring the whole file."""
    head = Path(path).read_bytes()[:8192]
    at = head.find(b'"data": "')
    if at >= 0:
        chunk = head[at + 9:].split(b'"')[0][:1024]
    else:
        doc = json.loads(Path(path).read_text(encoding='utf-8'))
        if 'chunks' not in doc:
            return b''
        chunk = store.read(doc['chunks'][0]['path']).split(b'\n')[0][:1024]
    chunk = base64.b64decode(chunk + b'=' * (-len(chunk) % 4))
    return zlib.decompressobj().decompress(chunk)


def index_rows(store):
    rows = []
    for path in sorted((Path(store.root) / 'indexes' / 'by-archive').glob('*.jsonl')):
        for line in path.read_text(encoding='utf-8').splitlines():
            if line.strip():
                rows.append(json.loads(line))
    return rows



def norm(path):
    parts = []
    for item in str(path).replace('\\', '/').split('/'):
        if item == '..':
            if parts:
                parts.pop()
        elif item and item != '.':
            parts.append(item)
    return '/'.join(parts)


def scan(store, work):
    rows = index_rows(store)
    containers = []
    for row in rows:
        name = row['path'].rsplit('/', 1)[-1]
        ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
        if ext in CONTAINER_EXT:
            containers.append({'outer_archive': row['archive'], 'path': row['path'],
                               'sha256': row['sha256'], 'bytes': row['bytes'], 'ext': ext})
    by_ext = collections.Counter(row['ext'] for row in containers)

    magic = collections.Counter()
    magic_sha = {}
    scanned = 0
    for path in sorted(Path(store.root).glob('objects/*/*.json')):
        scanned += 1
        sha = path.stem
        try:
            kind = magic_of(decompressed_head(path, store))
        except Exception as error:  # a broken object must be reported, not skipped silently
            print('scan error', path.name, error, file=sys.stderr)
            continue
        if kind:
            magic[kind] += 1
            magic_sha.setdefault(sha, kind)

    index_sha = {row['sha256'] for row in containers}
    result = {
        'store': str(store.root),
        'objects_scanned': scanned,
        'magic_by_format': dict(sorted(magic.items())),
        'container_index_rows': len(containers),
        'rows_by_extension': dict(sorted(by_ext.items())),
        'unique_containers': len(index_sha),
        'found_by_magic_only': sorted(sha for sha in magic_sha if sha not in index_sha),
        'found_by_extension_only': sorted(sha for sha in index_sha if sha not in magic_sha),
        'containers': containers,
    }
    write(Path(work) / 'scan.json', result)
    print(json.dumps({k: v for k, v in result.items() if k != 'containers'}, ensure_ascii=False))
    return result


def extract(store, work, only=None):
    scan_doc = json.loads((Path(work) / 'scan.json').read_text(encoding='utf-8'))
    containers, seen = [], set()
    for row in scan_doc['containers']:
        sha = row['sha256']
        if only and only not in row['path']:
            continue
        if sha in seen:
            continue
        seen.add(sha)
        target = Path(work) / 'containers' / f'{sha}.{row["ext"]}'
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('wb') as out:
            restore(store, sha, out)
        outdir = Path(work) / 'extract' / sha
        outdir.mkdir(parents=True, exist_ok=True)
        process = subprocess.run(['bsdtar', '-xf', str(target), '-C', str(outdir)],
                                 capture_output=True)
        members, nested = [], []
        for path in sorted(outdir.rglob('*')):
            if not path.is_file():
                continue
            data = path.read_bytes()
            inner = norm(path.relative_to(outdir))
            digest = hashlib.sha256(data).hexdigest()
            members.append({'inner': inner, 'bytes': len(data), 'sha256': digest})
            if magic_of(data[:64]):
                nested.append(inner)
        containers.append({
            'sha256': sha, 'outer_archive': row['outer_archive'], 'path': row['path'],
            'format': row['ext'], 'bytes': row['bytes'],
            'extract_rc': process.returncode,
            'extract_error': process.stderr.decode('utf-8', 'replace').strip()[:400],
            'members_total': len(members),
            'unique_member_sha256': len({m['sha256'] for m in members}),
            'second_level_containers': nested, 'members': members,
        })
    write(Path(work) / 'members.json', {'containers': containers})
    for item in containers:
        print(f"{item['sha256'][:12]} rc={item['extract_rc']} members={item['members_total']:>4} "
              f"nested={len(item['second_level_containers'])} {item['path']}")
    return containers


def classify(store, work):
    raw = CATALOG.read_text(encoding='utf-8')
    catalog = json.loads(raw[raw.index('=') + 1:].rstrip().rstrip(';'))
    cal_shas = {entry['sha'] for entry in catalog['entries'] if entry['ext'] == 'cal'}
    all_shas = {entry['sha'] for entry in catalog['entries']}
    asset_shas = {Path(name).stem for name in json.loads(IMAGE_ASSETS.read_text(encoding='utf-8'))}
    store_shas = {row['sha256'] for row in index_rows(store)} if store else set()

    document = json.loads((Path(work) / 'members.json').read_text(encoding='utf-8'))
    report = []
    for container in document['containers']:
        members = []
        for member in container['members']:
            inner = member['inner']
            ext = inner.rsplit('.', 1)[-1].lower() if '.' in inner else ''
            if ext == 'cal':
                if member['sha256'] in cal_shas:
                    kind = 'cal_present'
                elif member['sha256'] in store_shas:
                    kind = 'cal_in_store_other'
                else:
                    kind = 'cal_unclassified'
            elif ext in IMAGE_EXT and container['format'] == 'odt':
                kind = 'document_part'
            elif ext in IMAGE_EXT:
                if member['sha256'] in asset_shas:
                    kind = 'image_present'
                elif member['sha256'] in all_shas:
                    kind = 'image_present_catalog'
                else:
                    kind = 'image_new'
            elif ext in {'exe', 'dll'}:
                kind = 'program'
            else:
                kind = 'other'
            members.append(dict(member, ext=ext, kind=kind, name=inner.rsplit('/', 1)[-1]))
        report.append({
            'sha256': container['sha256'], 'path': container['path'],
            'format': container['format'], 'members_total': container['members_total'],
            'unique_member_sha256': container['unique_member_sha256'],
            'second_level_containers': container['second_level_containers'],
            'counts': dict(collections.Counter(m['kind'] for m in members)),
            'members': members,
        })
    write(Path(work) / 'classified.json', {'containers': report})
    summary = {
        'containers': len(report),
        'new_unique_cal': len({m['sha256'] for c in report for m in c['members']
                              if m['kind'] == 'cal_unclassified'}),
        'new_unique_images': len({m['sha256'] for c in report for m in c['members']
                                  if m['kind'] == 'image_new'}),
        'second_level_containers': sum(len(c['second_level_containers']) for c in report),
    }
    print(json.dumps(summary, ensure_ascii=False))
    return summary


def match(store, work):
    document = json.loads((Path(work) / 'classified.json').read_text(encoding='utf-8'))
    remainder = json.loads(REMAINDER.read_text(encoding='utf-8'))['references']
    containers, by_folder, seen = [], collections.defaultdict(set), set()
    name_index = collections.defaultdict(list)
    for container in document['containers']:
        if container['sha256'] in seen:
            continue
        seen.add(container['sha256'])
        folder = norm(container['path'].rsplit('/', 1)[0] if '/' in container['path'] else '')
        images = [m for m in container['members'] if m['ext'] in IMAGE_EXT]
        containers.append(dict(path=container['path'], sha=container['sha256'],
                               folder=folder, images=images))
        for member in images:
            name_index[member['name'].casefold()].append((containers[-1], member))
        by_folder[folder].add(container['sha256'])

    original = collections.defaultdict(set)
    if store:
        for row in index_rows(store):
            if row['path'].rsplit('.', 1)[-1].lower() == 'cal':
                original[row['sha256']].add(norm(row['path']).rsplit('/', 1)[0])

    by_name, by_member_path, by_path, by_original = [], [], [], []
    for reference in remainder:
        base = norm(reference['reference']).casefold().rsplit('/', 1)[-1]
        if not base:
            continue
        cal_folder = norm(reference['cal']).rsplit('/', 1)[0] if '/' in reference['cal'] else ''
        targets = {norm(f'{cal_folder}/{reference["reference"]}'),
                   norm(f'Calculators/Pictures/{reference["reference"]}')}
        for container, member in name_index.get(base, []):
            hit = dict(cal=reference['cal'], reference=reference['reference'],
                       reason=reference['reason'], container=container['path'],
                       container_sha256=container['sha'], inner=member['inner'])
            by_name.append(hit)
            if norm(member['inner']).casefold() == base:
                by_member_path.append(hit)
            full = norm(f'{container["folder"]}/{member["inner"]}')
            if full in targets:
                by_path.append(dict(cal=reference['cal'], reference=reference['reference'],
                                    reason=reference['reason'], target=full,
                                    container=container['path'], inner=member['inner']))
        for folder in sorted(original.get(reference['cal_sha'], ())):
            for sha in sorted(by_folder.get(folder, ())):
                container = next(c for c in containers if c['sha'] == sha)
                for member in container['images']:
                    if member['name'].casefold() == base:
                        by_original.append(dict(cal=reference['cal'],
                                                reference=reference['reference'],
                                                reason=reference['reason'],
                                                original_folder=folder,
                                                container=container['path'],
                                                inner=member['inner']))
    result = {
        't010_remainder': len(remainder),
        'by_reason': dict(collections.Counter(r['reason'] for r in remainder)),
        'matched_by_container_name_naive': len(by_name),
        'matched_by_container_member_path': len(by_member_path),
        'matched_by_exact_target_path': len(by_path),
        'matched_from_original_cal_folder': len(by_original),
        'original_folders_checked': bool(store),
        'naive_name_references': len({(h['cal'], h['reference']) for h in by_name}),
        'hits': {'by_container_name_naive': by_name, 'by_container_member_path': by_member_path,
                 'by_exact_target_path': by_path, 'from_original_cal_folder': by_original},
    }
    write(Path(work) / 'match.json', result)
    print(json.dumps({k: v for k, v in result.items() if k != 'hits'}, ensure_ascii=False))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('step', choices=['scan', 'extract', 'classify', 'match', 'all'])
    parser.add_argument('--store', type=Path, default=ROOT.parent / 'iprocal-sources',
                        help='local checkout of the private source store')
    parser.add_argument('--work', type=Path, default=Path('/tmp/t015-nested-archives'),
                        help='directory for containers, extracted members and intermediate JSON')
    parser.add_argument('--only', default=None,
                        help='extract only containers whose archive path contains this text')
    args = parser.parse_args()

    store = None
    if args.step in {'scan', 'extract', 'classify', 'match', 'all'}:
        if args.store.is_dir():
            store = Store(argparse.Namespace(root=str(args.store.resolve()), repo=None, ref=None))
        elif args.step != 'match':
            parser.error(f'store checkout not found: {args.store}')
        else:
            print('store checkout missing: matching by original CAL folder is skipped', file=sys.stderr)

    args.work.mkdir(parents=True, exist_ok=True)
    if args.step in {'scan', 'all'}:
        scan(store, args.work)
    if args.step in {'extract', 'all'}:
        extract(store, args.work, args.only)
    if args.step in {'classify', 'all'}:
        classify(store, args.work)
    if args.step in {'match', 'all'}:
        match(store, args.work)


if __name__ == '__main__':
    main()

