"""Verify the release manifest and build CAL Workbench web assets into dist/."""
from pathlib import Path
import hashlib
import json
import shutil
from html.parser import HTMLParser
from tools.scope_policy import load_registry, browser_data, filter_web_catalog

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"
registry = load_registry(ROOT)
if (ROOT / 'scope-data.js').read_text() != browser_data(registry):
    raise SystemExit('Scope data is stale: run python tools/scope_policy.py')
manifest = json.loads((ROOT / "MANIFEST.json").read_text())
for entry in manifest["files"]:
    path = ROOT / entry["path"]
    data = path.read_bytes()
    if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
        raise SystemExit("Source differs from release manifest: " + entry["path"])

assets = ["index.html", "README.html", "style.css", "favicon.svg", "app.js", "binary-event-profiles.js", "engine.js", "cal-source.js",
          "catalog.js", "catalog-store.js", "scope-data.js", "catalog-scope.js", "image-resource-data.js", "image-resources.js",
          "catalog-organization-dashboard.js", "catalog-organization-immo.js", "catalog-organization-radio.js", "catalog-organization-utilities.js", "catalog-organization-airbag.js", "catalog-organization-remainder.js", "catalog-organization.js"]
assets += json.loads((ROOT / "catalog-parts.json").read_text())
assets += json.loads((ROOT / "image-assets.json").read_text())
for name in assets:
    path = (ROOT / name).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise SystemExit("Invalid asset: " + name)

class References(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("src", "href") and value and not value.startswith("#"):
                if value not in assets:
                    raise SystemExit("Unpackaged reference: " + value)
References().feed((ROOT / "index.html").read_text())

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
for name in assets:
    target = OUT / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / name, target)
excluded = filter_web_catalog(OUT, registry, json.loads((ROOT / 'catalog-parts.json').read_text()))
(OUT / '.nojekyll').touch()
print(f'Scope: {excluded} approved standalone entries excluded; resources remain shared')
print(f"Built {len(assets)} verified assets into {OUT}")
print("Static assets are ready for hosting. GitHub Pages can also serve the repository root directly.")
