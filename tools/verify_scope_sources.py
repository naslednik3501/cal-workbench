"""Verify only registered originals in a local private store; never run source code.
Usage: python tools/verify_scope_sources.py /path/to/iprocal-sources
"""
import argparse
import io
import json
from pathlib import Path
from scope_policy import load_registry
from source_store import Store, restore


def verify(root):
    registry = load_registry()
    store = Store(argparse.Namespace(root=str(root), repo=None, ref=registry['source_ref']))
    checked = []
    indexes = {}
    for sha, decision in registry['decisions'].items():
        original = decision.get('original')
        if not original:
            continue
        output = io.BytesIO()
        restore(store, sha, output)  # Recomputes SHA-256 and validates object/chunks.
        if len(output.getvalue()) != original['bytes']:
            raise ValueError('Registered source length differs: ' + sha)
        for source in decision.get('source_paths', []):
            archive = source['archive']
            if archive not in indexes:
                rel = f'indexes/by-archive/{archive}.jsonl'
                indexes[archive] = [json.loads(line) for line in store.read(rel).decode().splitlines()]
            if source not in indexes[archive]:
                raise ValueError('Registered source provenance differs: ' + sha)
        checked.append({'sha256': sha, 'bytes': len(output.getvalue()),
                        'source_paths': len(decision.get('source_paths', []))})
    return {'verified_originals': checked, 'scope': 'Selected local byte integrity and provenance only; no calculator execution or remote availability check'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    print(json.dumps(verify(parser.parse_args().root), indent=2))
