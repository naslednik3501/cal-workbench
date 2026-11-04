"""Shared build policy: unknown bytes remain active; resources need per-CAL rules."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def validate_registry(registry):
    def is_sha(value, length=64):
        return isinstance(value, str) and len(value) == length and all(c in '0123456789abcdef' for c in value)
    if (registry.get('schema') != 1 or registry.get('default_action') != 'keep'
            or not isinstance(registry.get('decisions'), dict)
            or not isinstance(registry.get('resource_rules'), list)
            or not isinstance(registry.get('element_rules'), list)
            or not registry.get('source_repository') or not is_sha(registry.get('source_ref'), 40)):
        raise ValueError('Invalid scope registry')
    for sha, d in registry['decisions'].items():
        if (not is_sha(sha) or d.get('category') not in ('dump_calculation', 'hardware_only', 'mixed', 'auxiliary', 'unknown')
                or d.get('kind') not in ('calculator', 'standalone_program', 'resource')
                or d.get('action') not in ('keep', 'exclude') or not d.get('reason') or not d.get('date')
                or not d.get('evidence', {}).get('report')):
            raise ValueError('Invalid scope decision')
        if d['action'] == 'exclude':
            original = d.get('original', {})
            if (d['category'] != 'hardware_only' or d['kind'] != 'standalone_program'
                    or original.get('sha256_verified') is not True
                    or original.get('object_path') != f'objects/{sha[:2]}/{sha}.json'):
                raise ValueError('Unverified or shared-resource exclusion')
    for rule in registry['resource_rules']:
        resource = rule.get('resource_sha')
        if (not is_sha(rule.get('cal_sha')) or not is_sha(resource)
                or type(rule.get('control_id')) is not int or rule['control_id'] < 0
                or rule.get('action') != 'exclude' or rule.get('mapping_verified') is not True
                or not rule.get('evidence', {}).get('report')):
            raise ValueError('Unverified resource relationship')
        d = registry['decisions'].get(resource, {})
        original = d.get('original', {})
        if (d.get('category') != 'hardware_only' or d.get('kind') != 'resource'
                or original.get('sha256_verified') is not True
                or original.get('object_path') != f'objects/{resource[:2]}/{resource}.json'):
            raise ValueError('Unverified resource original')
    seen_elements = set()
    for rule in registry['element_rules']:
        if (not is_sha(rule.get('cal_sha')) or rule.get('element_type') not in ('G', 'L', 'P')
                or type(rule.get('element_id')) is not int or rule['element_id'] < 0
                or rule.get('action') != 'exclude' or rule.get('mapping_verified') is not True
                or not isinstance(rule.get('reference'), str) or not rule['reference'].strip()
                or not rule.get('evidence', {}).get('report')):
            raise ValueError('Unverified form element')
        key = (rule['cal_sha'], rule['element_type'], rule['element_id'])
        if key in seen_elements:
            raise ValueError('Duplicate form element rule')
        seen_elements.add(key)
        if rule['element_type'] == 'G' and not rule['evidence'].get('children'):
            raise ValueError('Group rule needs exact child evidence')
        if rule['element_type'] == 'P' and not rule['evidence'].get('candidate_images'):
            raise ValueError('Picture rule needs candidate evidence')
    return registry


def load_registry(root=ROOT):
    return validate_registry(json.loads((root / 'scope-registry.json').read_text()))

def active(entry, registry):
    return registry['decisions'].get(entry['sha'], {}).get('action') != 'exclude'

def browser_data(registry):
    return 'globalThis.CAL_SCOPE_REGISTRY=' + json.dumps(registry, ensure_ascii=True, separators=(',', ':')) + ';\n'

def filter_web_catalog(destination, registry, parts):
    """Omit only approved standalone files, preserving all other paths and bytes."""
    catalog = destination / 'catalog.js'
    prefix = 'globalThis.CAL_CATALOG='
    text = catalog.read_text()
    if not text.startswith(prefix) or not text.rstrip().endswith(';'):
        raise ValueError('Unexpected catalog format')
    db = json.loads(text[len(prefix):].strip()[:-1])
    before = len(db['entries'])
    db['entries'] = [e for e in db['entries'] if active(e, registry)]
    used = {e['sha'] for e in db['entries']}
    validate_registry(registry)
    for part in parts:
        file = destination / part
        text = file.read_text()
        prefix_part = 'Object.assign(globalThis.CAL_CATALOG.blobs,'
        if not text.startswith(prefix_part) or not text.rstrip().endswith(');'):
            raise ValueError('Unexpected catalog part format')
        blobs = json.loads(text[len(prefix_part):].strip()[:-2])
        filtered = {sha: data for sha, data in blobs.items() if sha in used}
        if len(filtered) != len(blobs):
            file.write_text(prefix_part + json.dumps(filtered, separators=(',', ':')) + ');\n')
    if before != len(db['entries']):
        counts = {}
        for e in db['entries']:
            counts[e['ext']] = counts.get(e['ext'], 0) + 1
        db['meta'].update(entries=len(db['entries']), calculators=counts.get('cal', 0),
                          uniqueCal=len({e['sha'] for e in db['entries'] if e['ext'] == 'cal'}), counts=counts)
        catalog.write_text(prefix + json.dumps(db, separators=(',', ':')) + ';\n')
    return before - len(db['entries'])

if __name__ == '__main__':
    (ROOT / 'scope-data.js').write_text(browser_data(load_registry()))
