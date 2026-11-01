"""Build the unchanged CAL Workbench 0.5 web assets into dist/."""
from pathlib import Path
import hashlib
import json
import shutil
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"
manifest = json.loads((ROOT / "MANIFEST.json").read_text())
for entry in manifest["files"]:
    path = ROOT / entry["path"]
    data = path.read_bytes()
    if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
        raise SystemExit("Source differs from original 0.5 manifest: " + entry["path"])

assets = ["index.html", "README.html", "style.css", "app.js", "engine.js",
          "catalog.js", "catalog-store.js"]
assets += json.loads((ROOT / "catalog-parts.json").read_text())
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
(OUT / ".nojekyll").touch()
print(f"Built {len(assets)} unchanged assets into {OUT}")
print("Static assets are ready for hosting. GitHub Pages can also serve the repository root directly.")
