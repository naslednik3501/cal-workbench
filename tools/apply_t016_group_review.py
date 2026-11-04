#!/usr/bin/env python3
"""Apply the reviewed display decisions for the two T-016 groups.

This changes only display maps and their reports. Original CAL files, SHA-256
values, source paths, bytes, exports, images and algorithms are untouched.
Run from the repository root: python3 tools/apply_t016_group_review.py
"""
from __future__ import annotations

import collections
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "reports" / "T-016-group-review-2026-11-04.json"
UTILITIES = ROOT / "catalog-organization-utilities.js"
REMAINDER = ROOT / "catalog-organization-remainder.js"
NAME_AUDIT = ROOT / "reports" / "T-016-name-audit-2026-11-04.json"
REMAINDER_REPORT = ROOT / "reports" / "catalog-organization-remainder-2026-11-04.json"
UTILITIES_REPORT = ROOT / "reports" / "catalog-organization-utilities-2026-11-04.json"
REMAINDER_MD = ROOT / "reports" / "catalog-organization-remainder-2026-11-04.md"
SYSTEMATIZATION_MD = ROOT / "reports" / "T-016-systematization-2026-11-04.md"
SHA_RE = re.compile(r"^(\s*)(['\"])([0-9a-f]{64})\2:(\{.*\})(,?)\s*$")


def read_registry():
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    decisions = data["decisions"]
    if len(decisions) != 174 or len({x["sha"] for x in decisions}) != 174:
        raise SystemExit("Registry must contain 174 unique SHA")
    if collections.Counter(x["group"] for x in decisions) != {"generic": 62, "ambiguous": 112}:
        raise SystemExit("Registry groups are not 62 + 112")
    return data


def update_map(path: Path, decisions, expected_group):
    wanted = {x["sha"]: x for x in decisions if x["group"] == expected_group}
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    found = set()
    output = []
    for line in lines:
        match = SHA_RE.match(line.rstrip("\n"))
        if not match or match.group(3) not in wanted:
            output.append(line)
            continue
        sha = match.group(3)
        decision = wanted[sha]
        found.add(sha)
        item = {"name": decision["new_name"], "folder": decision["new_folder"]}
        if decision["old_name"] != decision["new_name"]:
            item["old_name"] = decision["old_name"]
        if decision.get("previous_name") and decision["previous_name"] != decision["new_name"]:
            item["previous_name"] = decision["previous_name"]
        if decision.get("reason"):
            item["reason"] = decision["reason"]
        rendered = json.dumps(item, ensure_ascii=False, separators=(",", ":"))
        output.append(f'{match.group(1)}{match.group(2)}{sha}{match.group(2)}:{rendered}{match.group(5) or ""}\n')
    if found != set(wanted):
        missing = sorted(set(wanted) - found)
        raise SystemExit(f"Map coverage mismatch in {path.name}: missing {missing[:5]}")
    path.write_text("".join(output), encoding="utf-8")
    return len(found)


def update_name_audit(data):
    by_sha = {x["sha"]: x for x in data["decisions"] if x["group"] == "generic"}
    report = json.loads(NAME_AUDIT.read_text(encoding="utf-8"))
    changed = sum(1 for decision in by_sha.values() if (decision.get("previous_name") or decision["old_name"]) != decision["new_name"])
    for row in report["changed_utility_names"]:
        decision = by_sha.get(row["sha"])
        if not decision:
            continue
        row["after"]["name"] = decision["new_name"]
        row["after"]["folder"] = decision["new_folder"]
        row["after"]["review_evidence"] = decision["evidence"]
    report["review"] = {
        "date": "2026-11-04",
        "registry": "reports/T-016-group-review-2026-11-04.json",
        "checked_generic": len(by_sha),
        "changed_names": changed,
        "note": "Проверены только 62 записи с generic_phrase_before=true; остальные 155 изменённых утилит не переисследовались.",
    }
    NAME_AUDIT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed


def update_remainder(data):
    by_sha = {x["sha"]: x for x in data["decisions"] if x["group"] == "ambiguous"}
    report = json.loads(REMAINDER_REPORT.read_text(encoding="utf-8"))
    changed = 0
    for row in report["decisions"]:
        decision = by_sha.get(row["sha"])
        if not decision:
            continue
        changed += 1
        row["name"] = decision["new_name"]
        row["folder"] = decision["new_folder"]
        if decision.get("reason"):
            row["reason"] = decision["reason"]
        else:
            row.pop("reason", None)
        row["review_evidence"] = decision["evidence"]
        row["review_confidence"] = decision["confidence"]
    unresolved = [row for row in report["decisions"] if row.get("reason")]
    report["ambiguous"] = len(unresolved)
    report["ambiguous_entries"] = unresolved
    report["after"]["reviewed_sha"] = len(by_sha)
    report["after"]["resolved_sha"] = len(by_sha) - len(unresolved)
    report["after"]["remaining_review_sha"] = len(unresolved)
    report["policy"]["unresolved"] = (
        "После адресной проверки 112 записей 18 оставлены с причиной: "
        "13 — марка подтверждена, но конкретная модель в пути/форме не указана; "
        "5 — недостаточно данных о марке/операции. Остальные получили подтверждённую папку и имя."
    )
    report["review"] = {
        "date": "2026-11-04",
        "registry": "reports/T-016-group-review-2026-11-04.json",
        "checked_ambiguous": len(by_sha),
        "resolved": len(by_sha) - len(unresolved),
        "remaining": len(unresolved),
    }
    REMAINDER_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed, len(unresolved)


def update_utilities_report(data):
    by_sha = {x["sha"]: x for x in data["decisions"] if x["group"] == "generic"}
    report = json.loads(UTILITIES_REPORT.read_text(encoding="utf-8"))
    changed = 0
    for row in report["decisions"]:
        decision = by_sha.get(row["sha"])
        if not decision:
            continue
        changed += 1
        row["name"] = decision["new_name"]
        row["folder"] = decision["new_folder"]
        row["review_evidence"] = decision["evidence"]
    report["review"] = {
        "date": "2026-11-04",
        "registry": "reports/T-016-group-review-2026-11-04.json",
        "checked_generic": len(by_sha),
        "changed_records": changed,
    }
    UTILITIES_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed


def update_summary_md(data):
    counts = data["counts"]
    text = REMAINDER_MD.read_text(encoding="utf-8")
    old = "- Неоднозначных с причиной: **112**."
    new = (
        f"- После адресной проверки 112 записей: **{112 - counts['needs_review']}** "
        f"из 112 подтверждены, **{counts['needs_review']}** "
        "оставлены с причиной (13 — не указана модель, 5 — недостаточно данных о марке/операции)."
    )
    if old in text:
        text = text.replace(old, new, 1)
    marker = "Машиночитаемые решения по каждому SHA, все исходные пути и причины —"
    note = (
        "Реестр проверки двух групп (62 + 112): "
        "[T-016-group-review-2026-11-04.json](T-016-group-review-2026-11-04.json)."
    )
    if note not in text:
        text = text.replace(marker, note + "\n\n" + marker, 1)
    REMAINDER_MD.write_text(text, encoding="utf-8")

    text = SYSTEMATIZATION_MD.read_text(encoding="utf-8")
    section = (
        "\n## Уточнение двух групп 62 + 112\n\n"
        "Проверены 62 записи с убранным общим описанием и 112 неоднозначных записей; "
        "объединение по полному SHA-256 дало **174** уникальных CAL, пересечений нет. "
        "Подтверждены 156, оставлены с конкретной причиной 18 (13 — не указана модель, "
        "5 — недостаточно данных о марке/операции). Перемещено в подтверждённые "
        "брендовые подпапки 99 записей. Реестр решений: "
        "[T-016-group-review-2026-11-04.json](T-016-group-review-2026-11-04.json).\n"
    )
    if "## Уточнение двух групп 62 + 112" not in text:
        text = text.rstrip() + section
    SYSTEMATIZATION_MD.write_text(text, encoding="utf-8")


def main():
    data = read_registry()
    utilities = update_map(UTILITIES, data["decisions"], "generic")
    remainder = update_map(REMAINDER, data["decisions"], "ambiguous")
    generic_changed = update_name_audit(data)
    remainder_changed, unresolved = update_remainder(data)
    utility_report_changed = update_utilities_report(data)
    update_summary_md(data)
    print(json.dumps({
        "registry_sha": data["counts"]["reviewed_sha"],
        "utilities_map": utilities,
        "remainder_map": remainder,
        "generic_names_changed": generic_changed,
        "remainder_records_updated": remainder_changed,
        "unresolved": unresolved,
        "utility_report_records": utility_report_changed,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
