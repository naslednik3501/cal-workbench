"""Publish a prepared source store and its exact ZIPs to a PRIVATE GitHub repo.

Requires git and an already authenticated GitHub CLI (gh). No credentials are
read or printed. Public/non-empty repositories are refused. All input ZIPs are
matched by SHA-256 before any remote mutation. This is a one-time publisher.
"""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from source_store import digest_file, write_json


def run(argv, **kw):
    return subprocess.check_output(argv, text=True, **kw).strip()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo', required=True, help='owner/name of a new private data repository')
    p.add_argument('--store', required=True)
    p.add_argument('archives', nargs='+')
    args = p.parse_args()
    if len(args.repo.split('/')) != 2 or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_./' for c in args.repo):
        raise ValueError('Invalid repository name')
    root = Path(args.store).resolve()
    manifest = json.loads((root / 'MANIFEST.json').read_text())
    paths = {digest_file(f): Path(f).resolve() for f in args.archives}
    for a in manifest['archives']:
        if a['sha256'] not in paths or paths[a['sha256']].stat().st_size != a['bytes']:
            raise ValueError('Missing or changed original ZIP: ' + a['name'])
    if not shutil.which('gh') or not shutil.which('git'):
        raise RuntimeError('Install official GitHub CLI and git; authenticate gh before publishing')
    login = json.loads(run(['gh', 'api', 'user']))['login']
    if args.repo.split('/')[0].casefold() != login.casefold():
        raise ValueError('Repository owner does not match authenticated GitHub user')
    # Verify every restored file locally before anything is uploaded.
    subprocess.run([sys.executable, str(Path(__file__).with_name('source_store.py')),
                    'verify', '--root', str(root)], check=True)
    existing = subprocess.run(['gh', 'api', f'repos/{args.repo}'], capture_output=True, text=True)
    if existing.returncode == 0:
        info = json.loads(existing.stdout)
        if not info.get('private'):
            raise ValueError('Refusing to publish source files into a public repository')
        branches = json.loads(run(['gh', 'api', f'repos/{args.repo}/branches']))
        if branches:
            raise ValueError('Repository must be empty; existing branches will not be changed')
    else:
        if '404' not in existing.stderr:
            raise RuntimeError('Cannot verify target repository access')
        subprocess.run(['gh', 'repo', 'create', args.repo, '--private', '--description',
                        'Verified original iProCal source materials and selective file access'], check=True)
    info = json.loads(run(['gh', 'api', f'repos/{args.repo}']))
    if not info['private']:
        raise ValueError('Target repository is not private')
    if (root / '.git').exists():
        raise ValueError('Use a fresh prepared store directory; .git already exists')
    subprocess.run(['git', 'init', '-b', 'main'], cwd=root, check=True)
    subprocess.run(['git', 'config', 'user.name', login], cwd=root, check=True)
    subprocess.run(['git', 'config', 'user.email', f'{login}@users.noreply.github.com'], cwd=root, check=True)
    for name in ['MANIFEST.json', '.gitignore', 'objects', 'chunks', 'indexes', 'README.md', 'tools/source_store.py']:
        if (root / name).exists():
            subprocess.run(['git', 'add', '--', name], cwd=root, check=True)
    subprocess.run(['git', 'commit', '-m', 'Store verified source indexes and lossless file objects'], cwd=root, check=True)
    url = info['clone_url']
    subprocess.run(['git', 'remote', 'add', 'origin', url], cwd=root, check=True)
    # Uses gh's existing credential store for this invocation only.
    subprocess.run(['git', '-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential',
                    'push', '-u', 'origin', 'main'], cwd=root, check=True)
    commit = run(['git', 'rev-parse', 'HEAD'], cwd=root)
    remote = json.loads(run(['gh', 'api', f'repos/{args.repo}/git/ref/heads/main']))
    if remote['object']['sha'] != commit:
        raise ValueError('Remote commit mismatch')
    tag = manifest['original_release_tag']
    subprocess.run(['gh', 'release', 'create', tag, '--repo', args.repo, '--target', commit,
                    '--title', 'Verified original archives', '--notes',
                    'Original ZIP bytes. MANIFEST.json records names, SHA-256 and sizes.'], check=True)
    with tempfile.TemporaryDirectory() as tmp:
        for a in manifest['archives']:
            staged = Path(tmp) / a['asset']
            try:
                os.link(paths[a['sha256']], staged)
            except OSError:
                shutil.copyfile(paths[a['sha256']], staged)
            subprocess.run(['gh', 'release', 'upload', tag, '--repo', args.repo, str(staged)], check=True)
            staged.unlink()
        release = json.loads(run(['gh', 'api', f'repos/{args.repo}/releases/tags/{tag}']))
        assets = {a['name']: a for a in release['assets']}
        verified = []
        for a in manifest['archives']:
            asset = assets.get(a['asset'])
            if not asset or asset['size'] != a['bytes']:
                raise ValueError('Missing or truncated release asset')
            digest = asset.get('digest')
            if digest:
                if digest != 'sha256:' + a['sha256']:
                    raise ValueError('Release asset checksum mismatch')
                method = 'GitHub SHA-256 digest'
            else:
                subprocess.run(['gh', 'release', 'download', tag, '--repo', args.repo,
                                '--pattern', a['asset'], '--dir', tmp], check=True)
                downloaded = Path(tmp) / a['asset']
                if digest_file(downloaded) != a['sha256']:
                    raise ValueError('Downloaded original checksum mismatch')
                downloaded.unlink()
                method = 'downloaded and SHA-256 verified'
            verified.append({'name': a['asset'], 'sha256': a['sha256'], 'verification': method,
                             'url': asset['browser_download_url']})
    result = {'repository': args.repo, 'commit': commit, 'release': release['html_url'],
              'original_archives_verified': verified}
    # Outside the repository: publication status must not be mistaken for input data.
    write_json(root.parent / 'publication-result.json', result)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
