#!/usr/bin/env python3
"""Build the display-only map for CAL files outside the thematic maps.

The owner asked for original section names, not translations. This generator
therefore keeps the canonical source directory tree (for example Asia/Toyota,
EU_US_RU/Ford or MOTO - TRUCK - ATV/Motobikes/Honda) and only cleans the
visible file name. It never changes catalog paths, CAL bytes or SHA-256.

Inputs are the shipped catalog and the already approved display maps. Groups
of byte-identical aliases are represented once; every alias path is retained in
the machine-readable report.
"""
from __future__ import annotations

import collections
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "catalog.js"
OUT = ROOT / "catalog-organization-remainder.js"
OUT_JSON = ROOT / "reports" / "catalog-organization-remainder-2026-11-04.json"
OUT_MD = ROOT / "reports" / "catalog-organization-remainder-2026-11-04.md"
DATE = "2026-11-04"
MAP_FILES = [
    "catalog-organization.js",
    "catalog-organization-airbag.js",
    "catalog-organization-dashboard.js",
    "catalog-organization-immo.js",
    "catalog-organization-radio.js",
    "catalog-organization-utilities.js",
]
MOJIBAKE = "╨╤╬╧╪╫╩╦╠╣╝╜╛║╗╔╓╒╕"
CATEGORY_DIRS = {
    "ATV", "Bikes", "Car", "China", "Forklift truck", "Jet ski", "Motobikes",
    "Snowmobile", "Snowmobiles", "Special vehicles", "Convertor", "Immo off",
    "IDEN",
}
SOURCE_PRIORITY = {
    "MOTO - TRUCK - ATV": -100,
    "CRYPTO+": -30,
    "CRYPTO": -20,
    "Asia": -10,
    "EU_US_RU": -5,
    "MOTO": 40,
}


def load_catalog():
    text = CATALOG.read_text(encoding="utf-8")
    return json.loads(text[text.index("{"):].rstrip().rstrip(";"))


def load_mapped():
    mapped = set()
    for name in MAP_FILES:
        text = (ROOT / name).read_text(encoding="utf-8")
        mapped.update(re.findall(r"['\"]([0-9a-f]{64})['\"]\s*:", text))
    return mapped


def repair_mojibake(text):
    try:
        return text.encode("cp437").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def has_mojibake(text):
    return any(char in text for char in MOJIBAKE)


def clean_name(path):
    name = path.rsplit("/", 1)[-1]
    name = re.sub(r"(?:\.cal)+$", "", name, flags=re.I)
    if has_mojibake(name):
        name = repair_mojibake(name)
    name = re.sub(r"\s+", " ", name).strip()
    if len(name) > 140:
        name = name[:139].rstrip() + "…"
    return name or "CAL"


def source_section(path):
    parts = path.split("/")
    return parts[1] if len(parts) > 1 else ""


def canonical_score(path):
    parts = path.split("/")
    source = parts[1] if len(parts) > 1 else ""
    score = SOURCE_PRIORITY.get(source, 0)
    if has_mojibake(path):
        score += 1000
    if "/Обновы/" in path or "╨₧╨▒╨╜╨╛╨▓╤ï" in path:
        score += 500
    # Prefer the richer source tree when two aliases have the same depth.
    score -= min(len(parts), 8)
    return (score, len(path), path)


def reason_for(canonical):
    parts = canonical.split("/")
    if has_mojibake(canonical):
        return "в исходном пути нарушена кодировка; отображается восстановленное имя, исходный путь сохранён"
    parent = parts[-2] if len(parts) >= 2 else ""
    if parent in CATEGORY_DIRS:
        return "файл лежит прямо в папке категории; отдельной папки марки/модели в источнике нет"
    if len(parts) == 3 and parts[1] in {"ATV", "ECU", "CHINA"}:
        return "файл лежит прямо в корне исходного раздела; отдельной папки марки/модели в источнике нет"
    if len(parts) == 2:
        return "файл лежит прямо в корне исходного раздела; марка/модель не подтверждены"
    return ""


def main():
    db = load_catalog()
    mapped = load_mapped()
    entries = [
        entry for entry in db["entries"]
        if entry.get("ext") == "cal" and entry["sha"] not in mapped
    ]
    groups = collections.defaultdict(list)
    for entry in entries:
        groups[entry["sha"]].append(entry)
    if not groups:
        raise SystemExit("No unclassified CAL SHA left; refusing to rewrite the map")

    source_counts = collections.defaultdict(lambda: {"paths": 0, "sha": set()})
    for entry in entries:
        section = source_section(entry["path"])
        source_counts[section]["paths"] += 1
        source_counts[section]["sha"].add(entry["sha"])

    canonical_by_sha = {}
    for sha, aliases in groups.items():
        paths = sorted((entry["path"] for entry in aliases), key=canonical_score)
        canonical_by_sha[sha] = paths[0]

    processing_order = sorted(
        source_counts,
        key=lambda section: (-len(source_counts[section]["sha"]), section),
    )
    rows = []
    for section in processing_order:
        for sha in sorted(groups):
            canonical = canonical_by_sha[sha]
            if source_section(canonical) != section:
                continue
            parts = canonical.split("/")
            folder = "/".join(parts[1:-1]) or parts[1]
            rows.append({
                "sha": sha,
                "name": clean_name(canonical),
                "folder": folder,
                "reason": reason_for(canonical),
                "canonical_path": canonical,
                "paths": sorted(entry["path"] for entry in groups[sha]),
                "source_sections": sorted({source_section(entry["path"]) for entry in groups[sha]}),
            })

    # Different SHA must stay separate. Equal visible names in one folder get
    # deterministic version marks; the original path remains searchable.
    by_display = collections.defaultdict(list)
    for row in rows:
        by_display[(row["folder"], row["name"].lower())].append(row)
    collisions = 0
    for list_rows in by_display.values():
        if len(list_rows) < 2:
            continue
        collisions += 1
        list_rows.sort(key=lambda row: (row["canonical_path"], row["sha"]))
        for index, row in enumerate(list_rows[1:], start=2):
            row["name"] += f" · вариант {index}"
            if len(row["name"]) > 140:
                row["name"] = row["name"][:139].rstrip() + "…"

    if len(rows) != len(groups):
        raise SystemExit(f"Coverage {len(rows)} != {len(groups)}")
    if len({row["sha"] for row in rows}) != len(rows):
        raise SystemExit("Duplicate SHA in remainder map")

    decisions = sorted(rows, key=lambda row: (row["folder"], row["name"].lower(), row["sha"]))
    entries_js = []
    for row in decisions:
        item = {"name": row["name"], "folder": row["folder"]}
        if row["reason"]:
            item["reason"] = row["reason"]
        entries_js.append(
            "  " + json.dumps(row["sha"], ensure_ascii=False)
            + ":" + json.dumps(item, ensure_ascii=False, separators=(",", ":")) + ","
        )
    output = (
        f"/* Generated by tools/catalog_remainder_organization.py on {DATE}. Do not edit by hand. */\n"
        "/* Display-only map for the remaining original sections; paths, bytes and SHA stay unchanged. */\n"
        "(function(root){\n'use strict';\nconst data={\n"
        " schema:1,\n"
        " source_report:\"reports/catalog-organization-remainder-2026-11-04.md\",\n"
        " entries:{\n" + "\n".join(entries_js) + "\n },\n"
        " search_aliases:{}\n};\n"
        "root.CAL_ORGANIZATION_REMAINDER=data;\n"
        "if(typeof module==='object'&&module.exports)module.exports=data;\n"
        "})(globalThis);\n"
    )
    OUT.write_text(output, encoding="utf-8")

    by_root = collections.Counter(row["folder"].split("/")[0] for row in rows)
    by_source_assigned = collections.Counter(row["canonical_path"].split("/")[1] for row in rows)
    ambiguous = [row for row in decisions if row["reason"]]
    report = {
        "date": DATE,
        "purpose": "Распределение остатка по исходным названиям и структуре; только отображение.",
        "generated_file": OUT.name,
        "source_report": OUT_MD.name,
        "inputs": ["catalog.js", *MAP_FILES],
        "before": {
            "cal_paths": len(entries),
            "unique_sha": len(groups),
        },
        "after": {
            "distributed_sha": len(rows),
            "distributed_paths_represented": sum(len(row["paths"]) for row in rows),
            "outside_map_sha": len(groups) - len(rows),
        },
        "processing_order": processing_order,
        "source_sections": {
            section: {
                "paths": data["paths"],
                "unique_sha": len(data["sha"]),
            }
            for section, data in sorted(
                source_counts.items(), key=lambda item: (-len(item[1]["sha"]), item[0])
            )
        },
        "assigned_by_root": dict(sorted(by_root.items(), key=lambda item: (-item[1], item[0]))),
        "assigned_by_canonical_source": dict(sorted(by_source_assigned.items(), key=lambda item: (-item[1], item[0]))),
        "collision_groups": collisions,
        "ambiguous": len(ambiguous),
        "decisions": decisions,
        "ambiguous_entries": ambiguous,
        "policy": {
            "folder_names": "Исходные каталоги без перевода: Asia, EU_US_RU, MOTO - TRUCK - ATV и т. д.",
            "names": "Имя файла без .cal, пробелы нормализованы; функции не добавляются.",
            "versions": "Одинаковые видимые имена разных SHA получают · вариант N.",
            "encoding": "Битая кодировка исправлена только в отображаемом имени; исходный путь не изменён.",
            "unresolved": "Неоднозначные записи остаются доступны в исходном разделе с конкретной причиной.",
        },
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    md = [
        "# Остаток каталога по исходным разделам — 2026-11-04",
        "",
        "Только отображение: исходные пути, SHA-256, байты, экспорт и изображения не изменены.",
        "",
        f"- До обработки: **{len(entries)}** путей, **{len(groups)}** уникальных CAL SHA.",
        f"- Распределено: **{len(rows)}** SHA; все пути-алиасы сохранены в реестре.",
        f"- Осталось вне карты: **{len(groups) - len(rows)}**.",
        f"- Неоднозначных с причиной: **{len(ambiguous)}**.",
        f"- Групп совпавших видимых имён: **{collisions}**.",
        "",
        "## Порядок обработки исходных разделов",
        "",
        "| Исходный раздел | Путей | Уникальных SHA |",
        "|---|---:|---:|",
    ]
    for section in processing_order:
        data = source_counts[section]
        md.append(f"| `{section}` | {data['paths']} | {len(data['sha'])} |")
    md += [
        "",
        "## Назначение по корневым папкам",
        "",
        "| Корень | SHA |",
        "|---|---:|",
    ]
    for root, count in sorted(by_root.items(), key=lambda item: (-item[1], item[0])):
        md.append(f"| `{root}` | {count} |")
    md += [
        "",
        "Машиночитаемые решения по каждому SHA, все исходные пути и причины —",
        f"[{OUT_JSON.name}]({OUT_JSON.name}).",
        "",
    ]
    OUT_MD.write_text("\n".join(md), encoding="utf-8")

    print(json.dumps({
        "output": OUT.name,
        "report": OUT_JSON.name,
        "before_paths": len(entries),
        "before_sha": len(groups),
        "distributed": len(rows),
        "remaining": len(groups) - len(rows),
        "ambiguous": len(ambiguous),
        "collisions": collisions,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
