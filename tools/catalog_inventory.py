#!/usr/bin/env python3
"""Inventory the remaining non-systematised CAL groups without touching the site.

The catalogue already keeps every original path and byte-identical aliases. This
script only reads the shipped metadata (catalog.js, scope-registry.json and
catalog-organization.js) and writes a reproducible registry of the path-level
defects that are still outside the approved display map:

* CAL stored directly in a section, without a brand/model folder;
* parallel sections that repeat or re-build the same calculators;
* folders with obvious typos, competing spellings or broken encoding.

No CAL bytes are parsed: the shipped CAL payload is a hex-encoded compiled form
without readable titles, so opening it would not add path-level evidence. The
handful of ambiguous files was opened only to confirm that limitation.
"""
from __future__ import annotations

import collections
import difflib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "catalog.js"
CATALOG_PARTS = ROOT / "catalog-data"
ORGANIZATION = ROOT / "catalog-organization.js"
ORGANIZATION_AIRBAG = ROOT / "catalog-organization-airbag.js"
ORGANIZATION_DASHBOARD = ROOT / "catalog-organization-dashboard.js"
ORGANIZATION_IMMO = ROOT / "catalog-organization-immo.js"
ORGANIZATION_RADIO = ROOT / "catalog-organization-radio.js"
ORGANIZATION_UTILITIES = ROOT / "catalog-organization-utilities.js"
ORGANIZATION_REMAINDER = ROOT / "catalog-organization-remainder.js"
SCOPE = ROOT / "scope-registry.json"
OUT_JSON = ROOT / "reports" / "catalog-inventory-unclassified-2026-11-04.json"
OUT_MD = ROOT / "reports" / "catalog-inventory-unclassified-2026-11-04.md"
DATE = "2026-11-04"

FULL_PATHS_LIMIT = 400
MOJIBAKE = "╨╤╬╧╪╫╩╦╠╣╝╜╛║╗╔╓╒╕"


def load_catalog():
    text = CATALOG.read_text(encoding="utf-8")
    return json.loads(text[text.index("{"):].rstrip().rstrip(";"))


def load_mapped():
    mapped = set()
    for source in (
        ORGANIZATION,
        ORGANIZATION_AIRBAG,
        ORGANIZATION_DASHBOARD,
        ORGANIZATION_IMMO,
        ORGANIZATION_RADIO,
        ORGANIZATION_UTILITIES,
        ORGANIZATION_REMAINDER,
    ):
        text = source.read_text(encoding="utf-8")
        mapped.update(re.findall(r"['\"]([0-9a-f]{64})['\"]\s*:", text))
    return mapped


def load_scope():
    data = json.loads(SCOPE.read_text(encoding="utf-8"))
    excluded = {h for h, d in data["decisions"].items() if d.get("action") == "exclude"}
    return data, excluded


def parts(entry):
    return entry["path"].split("/")


def section(entry):
    return parts(entry)[1]


def is_car_letter(name):
    return len(name) == 1 and name.isalpha() and name.upper() == name


CATEGORY_DIRS = {
    "Motobikes", "Snowmobile", "Snowmobiles", "ATV", "Special vehicles", "Jet ski",
    "Forklift truck", "China", "Car", "Bikes", "Convertor", "Immo off", "IDEN",
}


def brand_dir(entry):
    """Brand folder, skipping category folders and the letter-first Car layout."""
    p = parts(entry)
    if p[1] == "Car" and len(p) >= 5 and is_car_letter(p[2]):
        return p[3]
    if p[1] != "Car" and len(p) >= 5 and p[2] in CATEGORY_DIRS:
        return p[3]
    if len(p) >= 4:
        return p[2]
    return None


def directory(entry):
    return entry["path"].rsplit("/", 1)[0]


def repair_mojibake(text):
    try:
        return text.encode("cp437").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return None


def norm_name(text):
    return re.sub(r"[^a-z0-9а-яё]", "", text.lower())


def sha_set(entries):
    return {e["sha"] for e in entries}


SECTIONS = [
    {
        "name": "Airbag",
        "purpose": "SRS: сброс Crash, чтение и ремонт блоков подушек.",
        "source_sections": ["Airbag", "SRS"],
    },
    {
        "name": "Dashboard",
        "purpose": "Щитки, панели приборов, одометры и CRC панели.",
        "source_sections": ["Dashboard", "Car", "I", "I_ok"],
    },
    {
        "name": "Peugeot",
        "purpose": "BSI, BCM, CJB и другие кузовные блоки.",
        "source_sections": ["Peugeot"],
        "note": "Раздел пока не выделен в исходном каталоге; файлы лежат в CRYPTO, Car и Peugeot.",
    },
    {
        "name": "Immo",
        "purpose": "IMMO, UCH/BCM/EZS, транспондеры и конвертеры ключей.",
        "source_sections": ["Immo", "Immo off"],
    },
    {
        "name": "CarRadio",
        "purpose": "Автомагнитолы, навигация и их коды.",
        "source_sections": ["CarRadio"],
    },
    {
        "name": "ECU",
        "purpose": "ЭБУ двигателя и связанные с ним блоки.",
        "source_sections": ["ECU"],
    },
    {
        "name": "MOTO - TRUCK - ATV",
        "purpose": "ATV, мотоциклы, снегоходы, гидроциклы.",
        "source_sections": ["ATV", "MOTO", "Bikes"],
    },
    {
        "name": "MOTO - TRUCK - ATV (Forklift truck)",
        "purpose": "Грузовики, автобусы, погрузчики, сельхозтехника.",
        "source_sections": ["MOTO - TRUCK - ATV", "Forklift truck"],
    },
    {
        "name": "CHINA",
        "purpose": "Китайские марки, выделенные из CHINA и Asia/China.",
        "source_sections": ["CHINA", "Asia/China"],
    },
    {
        "name": "CRYPTO / CRYPTO+",
        "purpose": "Декрипторы и крипто-калькуляторы BSI/ECU; функциональный раздел до разнесения по устройствам.",
        "source_sections": ["CRYPTO", "CRYPTO+"],
    },
    {
        "name": "OTHER",
        "purpose": "PIN, сервисные функции, конвертеры, синхронизация, тахографы, CRC и справочники.",
        "source_sections": [
            "PIN", "Service calc", "Service", "Synchronization", "Tachograf off", "CRC",
            "US-Euro converter", "USA-Euro converter", "OTHER",
        ],
    },
]

BRANDS = [
    {"name": "Audi", "aliases": ["AUDI"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "Bentley", "aliases": ["BENTLEY"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "BMW", "aliases": ["Bmw"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "Chery", "aliases": ["Cherry"], "confidence": "high", "note": "Опечатка; в Airbag/SRS те же модели T11, Bonus, QQ."},
    {"name": "Chevrolet", "aliases": ["CHEVROLEY"], "confidence": "medium", "note": "Опечатка в единственной папке CarRadio."},
    {"name": "Chrysler", "aliases": ["Crysler"], "confidence": "medium", "note": "Опечатка в единственной папке CarRadio."},
    {"name": "Citroen", "aliases": ["CITROEN"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "Daihatsu", "aliases": ["DAIHATSU"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "DongFeng", "aliases": ["DONG FENG"], "confidence": "high", "note": "Вариант с пробелом."},
    {"name": "Hyundai", "aliases": ["Huyndai"], "confidence": "high", "note": "Опечатка; те же модели, что в Hyundai, но другие сборки."},
    {"name": "Infiniti", "aliases": ["Infinity"], "confidence": "high", "note": "Опечатка; модели G35/M45/QX56 совпадают с Infiniti."},
    {"name": "JAC", "aliases": ["Jac"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "Jaguar", "aliases": ["jaguar"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "KAMAZ", "aliases": ["Kamaz"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "Kia", "aliases": ["KIA"], "confidence": "high", "note": "Различие только в регистре; сборки местами различаются."},
    {"name": "Lada", "aliases": ["LADA"], "confidence": "high", "note": "Различие только в регистре."},
    {
        "name": "Land Rover",
        "aliases": ["LAND ROVER", "Land rover LR2", "All Rovers", "Range Rover"],
        "confidence": "high",
        "note": "Модель Range Rover и семейство LR2 используются как папки марок; All Rovers содержит Range Rover, Discovery и Freelander.",
    },
    {"name": "Mazda", "aliases": ["MAZDA"], "confidence": "high", "note": "Различие только в регистре."},
    {
        "name": "Mercedes-Benz",
        "primary": "Mercedes",
        "aliases": ["Mersedes", "Mers", "Benz"],
        "confidence": "high",
        "note": "Mersedes — опечатка, Mers и Benz — короткие варианты в CarRadio; файлы BENZ SOUND повторяются.",
    },
    {"name": "Peugeot", "aliases": ["Pegeot"], "confidence": "high", "note": "Опечатка; в Bikes те же модели Peugeot (Speedfight, Elystar, Squab)."},
    {"name": "Pontiac", "aliases": ["Pontiak"], "confidence": "high", "note": "Опечатка; модель Vibe совпадает с Pontiac, но это отдельные SRS-файлы с номерами блоков."},
    {"name": "Porsche", "aliases": ["PORSCHE"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "Saab", "aliases": ["SAAB"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "SsangYong", "aliases": ["Ssang Yong"], "confidence": "high", "note": "Вариант с пробелом."},
    {"name": "Subaru", "aliases": ["SUBARU"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "Suzuki", "aliases": ["SUZUKI"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "TAGAZ", "aliases": ["TaGAZ"], "confidence": "high", "note": "Различие только в регистре."},
    {"name": "Volkswagen", "aliases": ["VW", "Vw"], "confidence": "high", "note": "Общеупотребительное сокращение и вариант регистра."},
    {"name": "CFMOTO", "primary": None, "aliases": ["CFmoto"], "confidence": "high", "note": "Вариант регистра; в ATV и MOTO марка также указана в имени файла без папки."},
]


def describe(entries):
    shas = sha_set(entries)
    return {
        "files": len(entries),
        "unique_sha": len(shas),
        "duplicate_sha": len(entries) - len(shas),
    }


def dir_stats(entries):
    files = collections.Counter()
    shas = collections.defaultdict(set)
    for e in entries:
        files[directory(e)] += 1
        shas[directory(e)].add(e["sha"])
    return [
        {"path": path, "files": files[path], "unique_sha": len(shas[path])}
        for path in sorted(files)
    ]


def attachments(entries):
    """Full paths for small groups, per-directory stats for large ones."""
    items = sorted(e["path"] for e in entries)
    if len(items) <= FULL_PATHS_LIMIT:
        return {"paths": items, "paths_complete": True}
    return {
        "paths_complete": False,
        "paths_note": "Paths are listed per source directory; sample file paths are included.",
        "path_samples": items[:10],
        "directories": dir_stats(entries),
    }


def make_group(group_id, kind, title, proposed, confidence, basis, entries, extra=None):
    group = {
        "id": group_id,
        "type": kind,
        "title": title,
        "proposed": proposed,
        "confidence": confidence,
        "basis": basis,
        "counts": describe(entries),
    }
    if extra:
        group.update(extra)
    group.update(attachments(entries))
    return group


ATV_RULES = [
    ("atv kymco", "Kymco"),
    ("polaris", "Polaris"),
    ("bombardier", "BRP (Bombardier)"),
    ("brp", "BRP (Bombardier)"),
    ("cfmoto", "CFMOTO"),
    ("cf moto", "CFMOTO"),
    ("stels", "Stels"),
    ("suzuki", "Suzuki"),
    ("honda", "Honda"),
    ("grizzly", "Yamaha"),
    ("rhino", "Yamaha"),
    ("kawasaki", "Kawasaki"),
    ("kymco", "Kymco"),
    ("baltmotors", "Baltmotors"),
    ("russkaya mehanika", "Русская Механика"),
]


def atv_brand(filename):
    low = filename.lower()
    for needle, brand in ATV_RULES:
        if needle in low:
            return brand
    return "Неуточнённые"


def build_direct(active, dc_sha):
    groups = []
    covered = []
    direct = [e for e in active if len(parts(e)) == 3]

    def add(group, entries):
        groups.append(group)
        covered.extend(entries)

    atv = [e for e in direct if section(e) == "ATV"]
    buckets = collections.defaultdict(list)
    for e in atv:
        buckets[atv_brand(parts(e)[-1])].append(e)
    for brand, entries in sorted(buckets.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        multi = len(entries) >= 2 and brand != "Неуточнённые"
        folder = f"Мототехника/ATV/{brand}" if multi else "Мототехника/ATV"
        dup = len(sha_set(entries) & dc_sha)
        basis = (
            "CAL лежит прямо в ATV без папки марки; марка и модель читаются из имени файла. "
            f"{dup} SHA уже встречаются в Dashboard/Car, то есть это альтернативные копии."
        )
        add(
            make_group(
                "D-ATV-" + ("russkaya-mehanika" if brand == "Русская Механика" else (norm_name(brand) or "other")),
                "direct_section",
                f"ATV: файлы марки {brand} без папки марки",
                {"section": "Мототехника", "folder": folder},
                "high" if multi else "medium",
                basis,
                entries,
                {"brand": brand, "duplicate_sha_in_dashboard_car": dup},
            ),
            entries,
        )

    renault = [e for e in active if section(e) == "Renault"]
    if renault:
        dup = len(sha_set(renault) & dc_sha)
        add(
            make_group(
                "D-root-renault",
                "root_brand_section",
                "Renault: марка вынесена в корень каталога",
                {"section": "Приборные панели", "folder": "Приборные панели/Renault"},
                "medium",
                f"Вся папка Renault ({len(renault)} CAL, {dup} SHA) уже присутствует в Dashboard/Car; "
                "имена делятся на dash, ABS и ser, поэтому раздел панели предложен условно.",
                renault,
                {"duplicate_sha_in_dashboard_car": dup},
            ),
            renault,
        )


    peugeot = [e for e in active if section(e) == "Peugeot"]
    bsi = [e for e in peugeot if parts(e)[-1].lower().startswith("bsi")]
    dash = [e for e in peugeot if e not in bsi]
    if bsi:
        add(
            make_group(
                "D-root-peugeot-bsi",
                "root_brand_section",
                "Peugeot: BSI в корне каталога",
                {"section": "BSI и кузовные блоки", "folder": "BSI и кузовные блоки/Peugeot"},
                "high",
                "Имена файлов явно называют BSI 308/Partner/Expert; отдельного раздела BSI в каталоге нет.",
                bsi,
                {"duplicate_sha_in_dashboard_car": len(sha_set(bsi) & dc_sha)},
            ),
            bsi,
        )
    if dash:
        add(
            make_group(
                "D-root-peugeot-dash",
                "root_brand_section",
                "Peugeot: панели в корне каталога",
                {"section": "Приборные панели", "folder": "Приборные панели/Peugeot"},
                "high",
                "Имена файлов начинаются с Dash; 2 из 3 SHA уже есть в Dashboard/Car.",
                dash,
                {"duplicate_sha_in_dashboard_car": len(sha_set(dash) & dc_sha)},
            ),
            dash,
        )

    mb = [e for e in active if section(e) == "MB"]
    if mb:
        add(
            make_group(
                "D-root-mb",
                "root_brand_section",
                "MB: EZS Mercedes-Benz в корне каталога",
                {"section": "Иммобилайзеры и ключи", "folder": "Иммобилайзеры и ключи/Mercedes-Benz"},
                "high",
                "V W639 EZS — блок замка Mercedes-Benz V639; оба SHA уже есть в Car/Mercedes.",
                mb,
                {"duplicate_sha_in_dashboard_car": len(sha_set(mb) & dc_sha)},
            ),
            mb,
        )

    ecu = [e for e in direct if section(e) == "ECU"]
    ecu_generic = [e for e in ecu if "CITROEN" not in parts(e)[-1].upper()]
    ecu_french = [e for e in ecu if "CITROEN" in parts(e)[-1].upper()]
    if ecu_generic:
        add(
            make_group(
                "D-ecu-generic",
                "direct_section",
                "ECU: универсальные файлы без марки",
                {"section": "Двигатель", "folder": "Двигатель/Универсальные"},
                "medium",
                "EDC16 и ECU 95080 не называют марку; содержимое CAL — hex-полезная нагрузка без читаемого заголовка.",
                ecu_generic,
            ),
            ecu_generic,
        )
    if ecu_french:
        add(
            make_group(
                "D-ecu-citroen-peugeot",
                "direct_section",
                "ECU: Citroen/Peugeot с опечаткой в имени",
                {"section": "Двигатель", "folder": "Двигатель/Citroen и Peugeot"},
                "medium",
                "Имя CITROEN PEUGEOUT содержит опечатку; конкретный ЭБУ не уточнён.",
                ecu_french,
            ),
            ecu_french,
        )

    tacho = [e for e in active if section(e) == "Tachograf off"]
    if tacho:
        add(
            make_group(
                "D-tachograf-off",
                "direct_section",
                "Tachograf off: файлы в корне раздела",
                {"section": "Утилиты", "folder": "Утилиты/Тахографы"},
                "high",
                "Имена содержат Tachograf off; копии с теми же именами есть в OTHER/Tachograf off, но SHA другие (другие сборки).",
                tacho,
            ),
            tacho,
        )

    immo_off = [e for e in active if section(e) == "Immo off" and len(parts(e)) == 3]
    if immo_off:
        add(
            make_group(
                "D-immo-off",
                "direct_section",
                "Immo off: SsangYong без папки марки",
                {"section": "Иммобилайзеры и ключи", "folder": "Иммобилайзеры и ключи/SsangYong"},
                "high",
                "Имя SsangYong 95160 V1/V2; раздел Immo off дублирует Immo/Immo off.",
                immo_off,
            ),
            immo_off,
        )

    immo_root = [e for e in active if section(e) == "Immo" and len(parts(e)) == 3]
    if immo_root:
        add(
            make_group(
                "D-immo-renault-uch",
                "direct_section",
                "Immo: Renault UCH без папки марки",
                {"section": "Иммобилайзеры и ключи", "folder": "Иммобилайзеры и ключи/Renault"},
                "high",
                "Имя Renault UCH 93C66 HITAG2; остальные CAL Immo лежат в Immo/Car/<марка>.",
                immo_root,
            ),
            immo_root,
        )

    china = [e for e in active if section(e) == "CHINA" and len(parts(e)) == 3]
    if china:
        add(
            make_group(
                "D-china-generic",
                "direct_section",
                "CHINA: единственный файл без марки и модели",
                {"section": "Китайские автомобили", "folder": "Китайские автомобили/Неуточнённые"},
                "low",
                "Имя CHINA 24C08 не содержит марки; содержимое CAL не даёт читаемого заголовка, поэтому раздел предложен условно.",
                china,
            ),
            china,
        )

    crc = [e for e in active if section(e) == "CRC" and len(parts(e)) == 3]
    if crc:
        add(
            make_group(
                "D-crc-dash",
                "direct_section",
                "CRC: dash_crc_vin без папки функции",
                {"section": "Утилиты", "folder": "Утилиты/CRC"},
                "high",
                "Имя dash_crc_vin совпадает с утверждённой утилитой CRC, но SHA другой — это отдельная сборка, а не тот же файл.",
                crc,
            ),
            crc,
        )

    radio = [e for e in active if section(e) == "CarRadio" and len(parts(e)) == 3]
    if radio:
        add(
            make_group(
                "D-carradio-universal",
                "direct_section",
                "CarRadio: универсальный файл без марки",
                {"section": "Магнитолы и навигация", "folder": "Магнитолы и навигация/Универсальные"},
                "medium",
                "Имя Any model by dump описывает универсальный калькулятор по дампу.",
                radio,
            ),
            radio,
        )

    return groups, covered



PARALLEL = [
    {
        "id": "P01",
        "sections": ["Dashboard", "Car"],
        "title": "Dashboard и Car: две раскладки одного содержимого",
        "proposed": {"section": "Приборные панели", "folder": "Приборные панели/<марка>"},
        "confidence": "high",
        "note": "Car повторяет Dashboard почти побайтно; Car дополнительно смешивает буквенные папки и папки марок.",
    },
    {
        "id": "P02",
        "sections": ["Airbag", "SRS"],
        "title": "Airbag и SRS: параллельные разделы подушек безопасности",
        "proposed": {"section": "Подушки безопасности", "folder": "Подушки безопасности/<марка>"},
        "confidence": "high",
        "note": "Имена совпадают полностью, общая часть — 2 231 SHA; уникальные хвосты следует сохранить как варианты сборок.",
    },
    {
        "id": "P03",
        "sections": ["I", "I_ok"],
        "title": "I и I_ok: одинаковые имена панелей, разные сборки",
        "proposed": {"section": "Приборные панели", "folder": "Приборные панели/Универсальные"},
        "confidence": "high",
        "note": "43 имени в каждом разделе совпадают, но SHA почти не пересекаются: это не побайтовые дубликаты, а разные версии.",
    },
    {
        "id": "P04",
        "sections": ["US-Euro converter", "USA-Euro converter"],
        "title": "US-Euro converter и USA-Euro converter",
        "proposed": {"section": "Утилиты", "folder": "Утилиты/Конвертеры US-EU"},
        "confidence": "high",
        "note": "41 имя совпадает, половина SHA общая; остальное — другие сборки.",
    },
    {
        "id": "P05",
        "sections": ["MOTO", "MOTO - TRUCK - ATV", "ATV"],
        "title": "MOTO, MOTO - TRUCK - ATV и ATV",
        "proposed": {
            "section": "Мототехника",
            "folder": "Мототехника/<ATV|Мотоциклы|Снегоходы> и Грузовые и спецтехника",
        },
        "confidence": "medium",
        "note": "MOTO полностью входит в MOTO - TRUCK - ATV, ATV почти полностью; при этом в MOTO - TRUCK - ATV есть уникальные грузовые и спецтехника.",
    },
    {
        "id": "P06",
        "sections": ["France", "Germany", "CHINA"],
        "title": "Региональные France, Germany, CHINA повторяют Dashboard",
        "proposed": {"section": "по марке", "folder": "существующий раздел устройства/<марка>"},
        "confidence": "high",
        "note": "96%, 78% и 96% SHA соответственно уже есть в Dashboard/Car; отдельная региональная папка не нужна.",
    },
    {
        "id": "P07",
        "sections": ["Asia", "EU_US_RU"],
        "title": "Asia и EU_US_RU: альтернативные сборки тех же моделей",
        "proposed": {"section": "по марке", "folder": "существующий раздел устройства/<марка>"},
        "confidence": "medium",
        "note": "Имена моделей почти совпадают с Dashboard, но SHA общие лишь на 3%: байтовое слияние запрещено, нужна сверка версий.",
    },
    {
        "id": "P08",
        "sections": [
            "OTHER",
        ],
        "title": "OTHER: зеркало утилит в корне каталога",
        "proposed": {"section": "Утилиты", "folder": "Утилиты/<функция>"},
        "confidence": "high",
        "note": "OTHER повторяет корневые PIN, Service calc, US-Euro converter и CRC побайтно; остальные функции совпадают по именам.",
    },
    {
        "id": "P09",
        "sections": ["Immo", "Immo off"],
        "title": "Immo off вложен в Immo",
        "proposed": {"section": "Иммобилайзеры и ключи", "folder": "Иммобилайзеры и ключи/<марка>"},
        "confidence": "high",
        "note": "Все SHA Immo off уже есть в Immo; отдельный раздел не нужен.",
    },
    {
        "id": "P10",
        "sections": ["Service", "Service calc"],
        "title": "Service и Service calc",
        "proposed": {"section": "Утилиты", "folder": "Утилиты/Сервисные функции"},
        "confidence": "medium",
        "note": "Имена совпадают, общих SHA нет: это разные сборки одной функции.",
    },
]



MIRRORED_UTILITIES = [
    "PIN", "Service calc", "Synchronization", "Tachograf off", "CRC",
    "US-Euro converter", "USA-Euro converter",
]


def build_parallel(active, dc_sha):
    by = collections.defaultdict(list)
    for e in active:
        by[section(e)].append(e)
    groups = []
    covered = []
    for spec in PARALLEL:
        sections = spec["sections"]
        sets = {s: sha_set(by[s]) for s in sections}
        names = {s: {parts(e)[-1].lower() for e in by[s]} for s in sections}
        union = set().union(*sets.values())
        common = set.intersection(*sets.values())
        entries = [e for s in sections for e in by[s]]
        if not entries:
            continue
        per_section = []
        for s in sections:
            current = sets[s]
            others = set().union(*(sets[other] for other in sections if other != s))
            shared = len(current & others)
            per_section.append(
                {
                    "section": f"Calculators/{s}",
                    "files": len(by[s]),
                    "unique_sha": len(current),
                    "shared_sha_with_other_sections": shared,
                    "containment": round(shared / len(current), 3) if current else 0,
                    "shared_sha_with_dashboard_car": len(current & dc_sha),
                    "share_with_dashboard_car": round(len(current & dc_sha) / len(current), 3) if current else 0,
                }
            )
        pairwise = []
        for index, left in enumerate(sections):
            for right in sections[index + 1:]:
                pairwise.append(
                    {
                        "a": left,
                        "b": right,
                        "shared_sha": len(sets[left] & sets[right]),
                        "shared_names": len(names[left] & names[right]),
                    }
                )
        extra = {
            "sections": [f"Calculators/{s}" for s in sections],
            "per_section": per_section,
            "pairwise": pairwise,
            "shared_sha_all_sections": len(common),
            "duplicate_sha_in_dashboard_car": len(sha_set(entries) & dc_sha),
        }
        if spec["id"] == "P07":
            dashboard_names = {parts(e)[-1].lower() for e in by["Dashboard"]}
            extra["name_overlap_with_dashboard"] = {
                s: len(names[s] & dashboard_names) for s in sections
            }
            extra["name_totals"] = {s: len(names[s]) for s in sections}
        if spec["id"] == "P08":
            mirrors = []
            for name in MIRRORED_UTILITIES:
                nested = [e for e in by["OTHER"] if e["path"].startswith(f"Calculators/OTHER/{name}/")]
                root = by[name]
                if not nested:
                    continue
                mirrors.append(
                    {
                        "utility": name,
                        "other_files": len(nested),
                        "root_files": len(root),
                        "same_sha": len(sha_set(nested) & sha_set(root)),
                    }
                )
            extra["mirrors"] = mirrors
        if len(sections) == 1:
            basis = spec["note"]
        else:
            overlap = "; ".join(
                f"{p['section'].split('/')[-1]}: {p['shared_sha_with_other_sections']} SHA "
                f"({p['containment']:.0%})"
                for p in per_section
            )
            basis = f"{spec['note']} Пересечение с другими разделами — {overlap}."
        groups.append(
            make_group(
                spec["id"],
                "parallel_sections",
                spec["title"],
                spec["proposed"],
                spec["confidence"],
                basis,
                entries,
                extra,
            )
        )
        covered.extend(entries)
    return groups, covered



def build_spelling(active, dc_sha):
    index = collections.defaultdict(list)
    for e in active:
        brand = brand_dir(e)
        if brand:
            index[brand].append(e)
    groups = []
    covered = []
    for spec in BRANDS:
        canonical = spec["name"]
        primary_name = spec.get("primary", canonical)
        primary = index.get(primary_name, []) if primary_name else []
        if primary_name and not primary:
            continue
        psha = sha_set(primary)
        pnames = {parts(e)[-1].lower() for e in primary}
        aliases = []
        entries = []
        for alias in spec["aliases"]:
            found = index.get(alias, [])
            if not found:
                continue
            entries.extend(found)
            aliases.append(
                {
                    "name": alias,
                    "files": len(found),
                    "unique_sha": len(sha_set(found)),
                    "sections": sorted({f"Calculators/{section(e)}" for e in found}),
                    "directories": sorted({directory(e) for e in found}),
                    "case_only": norm_name(alias) == norm_name(canonical),
                    "similarity": round(
                        difflib.SequenceMatcher(None, alias.lower(), canonical.lower()).ratio(), 2
                    ),
                    "same_sha_as_canonical": len(sha_set(found) & psha),
                    "same_model_names_as_canonical": len(
                        {parts(e)[-1].lower() for e in found} & pnames
                    ),
                }
            )
        if not entries:
            continue
        shared = len(sha_set(entries) & psha)
        reference = f"папкой {primary_name}" if primary_name else "эталонной папкой (её нет)"
        basis = (
            f"{spec['note']} Вариантов: {len(aliases)}, файлов: {len(entries)}; "
            f"общих SHA с {reference}: {shared}."
        )
        group = make_group(
            "S-" + norm_name(canonical),
            "brand_spelling",
            f"{canonical}: варианты написания папки",
            {"section": "по разделу устройства", "folder": f"<раздел устройства>/{canonical}"},
            spec["confidence"],
            basis,
            entries,
            {
                "brand": canonical,
                "canonical_counts": describe(primary),
                "same_sha_as_canonical": shared,
                "aliases": aliases,
                "duplicate_sha_in_dashboard_car": len(sha_set(entries) & dc_sha),
            },
        )
        groups.append(group)
        covered.extend(entries)
    return groups, covered



def broken(text):
    return any(ch in MOJIBAKE for ch in text) or text != text.strip() or "  " in text


def build_encoding(active):
    groups = []
    covered = []
    mojibake = [
        e for e in active
        if any(any(ch in MOJIBAKE for ch in part) for part in parts(e))
    ]
    if mojibake:
        repaired = collections.defaultdict(list)
        filenames = {}
        for e in mojibake:
            dir_parts = parts(e)[:-1]
            path_parts = []
            for part in dir_parts:
                fixed = repair_mojibake(part) if any(ch in MOJIBAKE for ch in part) else part
                path_parts.append(fixed or part)
            if any(any(ch in MOJIBAKE for ch in part) for part in dir_parts):
                repaired["/".join(path_parts)].append(e)
            name = parts(e)[-1]
            if any(ch in MOJIBAKE for ch in name):
                filenames[name] = repair_mojibake(name) or name
        directories = []
        for path, entries in sorted(repaired.items()):
            directories.append(
                {
                    "repaired_path": path,
                    "original_paths": sorted({directory(e) for e in entries}),
                    "files": len(entries),
                    "unique_sha": len(sha_set(entries)),
                }
            )
        groups.append(
            make_group(
                "E01",
                "broken_encoding",
                "Пути с битой кодировкой UTF-8",
                {"section": "без изменения раздела", "folder": "переименовать папку и файл по декодированному имени"},
                "high",
                "Имена декодируются из cp437 в UTF-8: папки «Обновы»/«обновы» и «ПА 8090 Беларусь», а также имена файлов с русскими буквами; байты CAL не затронуты.",
                mojibake,
                {
                    "repaired_directories": directories,
                    "repaired_filenames": [
                        {"original": old, "repaired": new} for old, new in sorted(filenames.items())
                    ],
                },
            )
        )
        covered.extend(mojibake)

    spaced = [e for e in active if any(broken(part) for part in parts(e)[:-1])]
    spaced = [e for e in spaced if e not in mojibake]
    if spaced:
        directories = []
        for path in sorted({directory(e) for e in spaced}):
            entries = [e for e in spaced if directory(e) == path]
            directories.append({"path": path, "files": len(entries), "unique_sha": len(sha_set(entries))})
        groups.append(
            make_group(
                "E02",
                "broken_encoding",
                "Папки с двойными пробелами в имени",
                {"section": "без изменения раздела", "folder": "нормализовать пробелы в имени папки"},
                "high",
                "Двойные пробелы в RENRNC640-10  NAVI_TV и B5 Dash VDO  93c66; смысл имени не меняется.",
                spaced,
                {"directories": directories},
            )
        )
        covered.extend(spaced)
    return groups, covered



CATEGORY_DIRECT = [
    {
        "id": "D-cat-atv",
        "names": ["ATV"],
        "title": "ATV: файлы прямо в папке категории, без марки",
        "proposed": {"section": "Мототехника", "folder": "Мототехника/ATV/<марка>"},
        "confidence": "high",
        "note": "85 имён повторяются в Asia/ATV, Dashboard/ATV и MOTO - TRUCK - ATV/ATV; Dashboard и MOTO совпадают побайтно (85 SHA), Asia — другие сборки. Марка читается из имени файла.",
    },
    {
        "id": "D-cat-jetski",
        "names": ["Jet ski"],
        "title": "Jet ski: гидроциклы без папки марки",
        "proposed": {"section": "Мототехника", "folder": "Мототехника/Гидроциклы/<марка>"},
        "confidence": "high",
        "note": "Имена Yamaha WaveRunner/FX и Aquatrax (Honda) называют марку; 6 имён повторяются в Asia и Dashboard, но общий SHA только 1 — сборки различаются.",
    },
    {
        "id": "D-cat-motobikes",
        "names": ["Motobikes"],
        "title": "Motobikes: файлы без марки",
        "proposed": {"section": "Мототехника", "folder": "Мототехника/Мотоциклы"},
        "confidence": "low",
        "note": "Имена MT 9 и SLASH не называют марку; папка марки не создаётся до уточнения.",
    },
    {
        "id": "D-cat-snowmobile",
        "names": ["Snowmobile", "Snowmobiles"],
        "title": "Snowmobile: файлы без марки",
        "proposed": {"section": "Мототехника", "folder": "Мототехника/Снегоходы"},
        "confidence": "low",
        "note": "24C164 Proba выглядит тестовым дампом; марка не указана.",
    },
    {
        "id": "D-cat-immo-convertor",
        "names": ["Convertor"],
        "title": "Immo/Convertor: конвертеры ключей без марки",
        "proposed": {"section": "Иммобилайзеры и ключи", "folder": "Иммобилайзеры и ключи/Конвертеры ключей"},
        "confidence": "high",
        "note": "EtsmartTemic12 ↔ Kmrw — конвертеры транспондеров, марка не нужна.",
    },
    {
        "id": "D-cat-china",
        "names": ["China"],
        "title": "China: файлы без марки в Airbag и SRS",
        "proposed": {"section": "Китайские автомобили", "folder": "Китайские автомобили/Неуточнённые"},
        "confidence": "low",
        "note": "J3858186 не называет марку; содержимое CAL не даёт читаемого заголовка.",
    },
]


def build_category_direct(active, dc_sha):
    groups = []
    covered = []
    for spec in CATEGORY_DIRECT:
        entries = [
            e for e in active
            if len(parts(e)) == 4 and parts(e)[2] in spec["names"]
        ]
        if not entries:
            continue
        dup = len(sha_set(entries) & dc_sha)
        basis = f"{spec['note']} Файлов: {len(entries)}, уникальных SHA: {len(sha_set(entries))}."
        groups.append(
            make_group(
                spec["id"],
                "category_direct",
                spec["title"],
                spec["proposed"],
                spec["confidence"],
                basis,
                entries,
                {"duplicate_sha_in_dashboard_car": dup},
            )
        )
        covered.extend(entries)
    return groups, covered


def build_non_merges(active):
    by = collections.defaultdict(list)
    for e in active:
        by[section(e)].append(e)

    def compare(a, b):
        sa, sb = sha_set(by[a]), sha_set(by[b])
        na = {parts(e)[-1].lower() for e in by[a]}
        nb = {parts(e)[-1].lower() for e in by[b]}
        return {
            "a": f"Calculators/{a}",
            "b": f"Calculators/{b}",
            "files_a": len(by[a]),
            "files_b": len(by[b]),
            "shared_sha": len(sa & sb),
            "shared_names": len(na & nb),
        }

    return [
        {
            "kind": "keep_separate",
            "pair": compare("CRYPTO", "CRYPTO+"),
            "reason": "Разные назначения и 0 общих SHA: CRYPTO — BSI/декрипторы, CRYPTO+ — ECU/CJB/панели. Похожее имя не повод сливать.",
        },
        {
            "kind": "keep_separate",
            "pair": compare("Bikes", "MOTO"),
            "reason": "0 общих SHA; Bikes — мотоциклы, MOTO — снегоходы и гидроциклы. Объединять можно только на уровне раздела «Мототехника».",
        },
        {
            "kind": "keep_versions",
            "pair": compare("Asia", "Dashboard"),
            "reason": "Имена моделей почти совпадают, но SHA общие лишь частично: это альтернативные сборки, а не дубликаты. Нужна сверка версий, байтовое слияние запрещено.",
        },
        {
            "kind": "keep_versions",
            "pair": compare("EU_US_RU", "Dashboard"),
            "reason": "То же: альтернативная региональная сборка, не побайтовый дубликат.",
        },
    ]


def summarize_group(group):
    return {
        "id": group["id"],
        "title": group["title"],
        "type": group["type"],
        "files": group["counts"]["files"],
        "unique_sha": group["counts"]["unique_sha"],
        "confidence": group["confidence"],
        "proposed": group["proposed"],
    }



def build_report():
    catalog = load_catalog()
    mapped = load_mapped()
    scope, scope_excluded = load_scope()
    all_cal = [e for e in catalog["entries"] if e["ext"] == "cal"]
    active = [e for e in all_cal if e["sha"] not in scope_excluded and e["sha"] not in mapped]
    if len(mapped) != 15057:
        raise SystemExit(f"Expected 15057 mapped CALs, got {len(mapped)}")
    if sha_set(active) & mapped:
        raise SystemExit("Approved CAL leaked into the inventory")

    by_section = collections.defaultdict(list)
    for e in active:
        by_section[section(e)].append(e)
    dc_sha = sha_set(by_section["Dashboard"]) | sha_set(by_section["Car"])

    groups = []
    covered = []
    for builder in (build_direct, build_category_direct, build_parallel, build_spelling):
        part, entries = builder(active, dc_sha)
        groups.extend(part)
        covered.extend(entries)
    for builder in (build_encoding,):
        part, entries = builder(active)
        groups.extend(part)
        covered.extend(entries)

    seen_ids = set()
    for group in groups:
        if group["id"] in seen_ids:
            raise SystemExit(f"Duplicate group id: {group['id']}")
        seen_ids.add(group["id"])

    covered_paths = {e["path"] for e in covered}
    covered_shas = sha_set(covered)
    known_paths = {e["path"] for e in all_cal}
    direct_paths = {e["path"] for e in active if len(parts(e)) == 3}
    missing_direct = direct_paths - covered_paths
    if missing_direct:
        raise SystemExit(f"Direct CAL not grouped: {sorted(missing_direct)[:3]}")
    for group in groups:
        if group.get("paths_complete"):
            if len(group["paths"]) != group["counts"]["files"]:
                raise SystemExit(f"Path count mismatch in {group['id']}")
            missing = [p for p in group["paths"] if p not in known_paths]
            if missing:
                raise SystemExit(f"Unknown path in {group['id']}: {missing[0]}")

    rank = {"high": 0, "medium": 1, "low": 2}
    next_groups = sorted(
        (summarize_group(g) for g in groups),
        key=lambda g: (rank[g["confidence"]], -g["files"], g["id"]),
    )[:12]

    report = {
        "schema": 1,
        "generated": DATE,
        "purpose": (
            "Инвентаризация оставшихся несистематизированных CAL по путям и метаданным. "
            "Дерево сайта, байты, SHA, экспорт и изображения не изменяются."
        ),
        "method": {
            "sources": [
                "catalog.js",
                "scope-registry.json",
                "catalog-organization.js",
                "catalog-organization-airbag.js",
                "catalog-organization-dashboard.js",
                "catalog-organization-immo.js",
                "catalog-organization-radio.js",
                "catalog-organization-utilities.js",
            ],
            "approved_map": "reports/catalog-organization-{root-airbag,airbag-srs,dashboard,immo,radio,utilities}*",
            "path_rules": [
                "CAL прямо в разделе: Calculators/<раздел>/<файл>.cal",
                "Марка: второй уровень, кроме буквенных папок Car и папок-категорий (Car, Bikes, ATV, China и т.п.)",
                "Параллельные разделы: совпадение SHA и/или имён файлов между разделами",
                "Опечатки: сравнение папок марок с эталонным написанием и редакционное расстояние",
            ],
            "content_policy": (
                "Содержимое CAL открывалось только для неоднозначных записей (EDC16, ECU 95080, CHINA 24C08, "
                "Any model by dump, CITROEN PEUGEOUT, dash_crc_vin, Help.cal). Полезная нагрузка — hex-код "
                "без читаемого заголовка, поэтому решения опираются на пути, имена и совпадения SHA; "
                "неподтверждённый Help.cal оставлен в «Неуточнённые»."
            ),
            "confidence": {
                "high": "Однозначная опечатка/регистр/кодировка либо побайтовое совпадение подтверждено SHA.",
                "medium": "Опечатка или параллельный раздел очевидны, но цель требует уточнения по содержимому.",
                "low": "Нет марки/модели и нет подтверждающего совпадения.",
            },
            "full_paths_limit": FULL_PATHS_LIMIT,
        },
        "catalog": {
            "entries": len(catalog["entries"]),
            "cal_paths": len(all_cal),
            "cal_unique_sha": len(sha_set(all_cal)),
            "active_cal_paths": len(active),
            "active_cal_unique_sha": len(sha_set(active)),
            "direct_cal_paths": sum(1 for e in active if len(parts(e)) == 3),
            "approved_map_sha": len(mapped),
            "scope_excluded_sha": len(scope_excluded),
            "scope_decisions": len(scope["decisions"]),
            "scope_resource_rules": len(scope["resource_rules"]),
        },
        "dictionary": {
            "sections": SECTIONS,
            "brands": BRANDS,
            "non_merges": build_non_merges(active),
        },
        "groups": groups,
        "coverage": {
            "groups": len(groups),
            "files": len(covered_paths),
            "unique_sha": len(covered_shas),
            "group_listings": len(covered),
            "remaining_active_cal_paths": len(active) - len(covered_paths),
            "note": "Файл может входить в две группы разного типа (например, Huyndai в SRS и в опечатках); покрытие считается по уникальным путям.",
        },
        "next_groups": next_groups,
    }
    return report



def render_markdown(report):
    c = report["catalog"]
    d = report["dictionary"]
    lines = [
        "# Инвентаризация оставшихся CAL — 2026-11-04",
        "",
        "Продолжение T-001/T-016. Документ фиксирует только **инвентаризацию**: дерево сайта,",
        "пути, байты, SHA, экспорт CAL, алгоритмы и изображения не изменяются.",
        "Машиночитаемый реестр: `reports/catalog-inventory-unclassified-2026-11-04.json`.",
        "",
        "## Метод",
        "",
        "- Источники: `catalog.js`, `scope-registry.json`, `catalog-organization.js`, `catalog-organization-airbag.js`, `catalog-organization-{dashboard,immo,radio,utilities}.js`.",
        "- Все 15 057 уникальных CAL SHA распределены картой отображения; остаток — 0.",
        "  Исходные разделы сохранены как OTHER/CRC, OTHER/PIN, OTHER/Service calc и т. п.",
        "- CAL читались только для неоднозначных записей; полезная нагрузка — hex-код без",
        "  читаемого заголовка, поэтому основание — путь, имя и совпадения SHA.",
        "- Большие группы в Markdown не дублируются: полные пути и статистика по папкам — в JSON.",
        "",
        "## Каталог",
        "",
        f"- Записей: {c['entries']:,}; CAL-путей: {c['cal_paths']:,}; уникальных CAL SHA: {c['cal_unique_sha']:,}.",
        f"- Активных CAL-путей: {c['active_cal_paths']:,}; активных SHA: {c['active_cal_unique_sha']:,}; прямо в разделах без марки/модели: {c['direct_cal_paths']:,}.",
        f"- Исключено реестром области: {c['scope_excluded_sha']} CAL; адресных правил ресурсов: {c['scope_resource_rules']}; утверждённой картой: {c['approved_map_sha']}.",
        f"- Групп: {report['coverage']['groups']}; покрыто {report['coverage']['files']:,} путей / "
        f"{report['coverage']['unique_sha']:,} SHA; вне групп — {report['coverage']['remaining_active_cal_paths']:,} обычных путей.",
        "",
        "## Словарь разделов",
        "",
        "| Раздел | Назначение | Исходные разделы |",
        "|---|---|---|",
    ]
    for s in d["sections"]:
        sources = ", ".join(s["source_sections"]) or "—"
        lines.append(f"| {s['name']} | {s['purpose']} | {sources} |")
    lines += [
        "",
        "Марка всегда уточняет раздел устройства: `Dashboard/Renault`,",
        "`Airbag/Hyundai`, `OTHER/Tachograf off`. Отдельный раздел создаётся",
        "только для устойчивой категории, а не для одного файла.",
        "",
        "## Словарь марок",
        "",
        "| Эталон | Варианты в каталоге |",
        "|---|---|",
    ]
    for b in d["brands"]:
        lines.append(f"| {b['name']} | {', '.join(b['aliases'])} |")
    lines += [
        "",
        "## Группы",
        "",
        "| ID | Тип | Файлов | SHA | Предложение | Уверенность |",
        "|---|---|---:|---:|---|---|",
    ]
    for g in report["groups"]:
        folder = g["proposed"].get("folder", "")
        lines.append(
            f"| {g['id']} | {g['type']} | {g['counts']['files']} | {g['counts']['unique_sha']} | "
            f"{folder} | {g['confidence']} |"
        )

    lines += ["", "## Параллельные разделы", ""]
    for g in report["groups"]:
        if g["type"] != "parallel_sections":
            continue
        lines.append(f"### {g['id']} — {g['title']} ({g['confidence']})")
        lines.append("")
        lines.append(g["basis"])
        lines.append("")
        lines.append("| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |")
        lines.append("|---|---:|---:|---:|---:|")
        for p in g["per_section"]:
            lines.append(
                f"| {p['section']} | {p['files']} | {p['unique_sha']} | "
                f"{p['shared_sha_with_other_sections']} ({p['containment']:.0%}) | "
                f"{p['shared_sha_with_dashboard_car']} ({p['share_with_dashboard_car']:.0%}) |"
            )
        lines.append("")
        if g.get("mirrors"):
            lines.append("Зеркала `OTHER`: " + "; ".join(
                f"{m['utility']} — {m['other_files']} файлов, общих SHA {m['same_sha']}"
                for m in g["mirrors"]
            ) + ".")
            lines.append("")
    lines += [
        "## Очередные группы",
        "",
        "Порядок: сначала уверенность, затем размер.",
        "",
        "| ID | Группа | Файлов | SHA | Уверенность |",
        "|---|---|---:|---:|---|",
    ]
    for g in report["next_groups"]:
        lines.append(
            f"| {g['id']} | {g['title']} | {g['files']} | {g['unique_sha']} | {g['confidence']} |"
        )
    lines += [
        "",
        "## Ограничения",
        "",
        "- Это реестр путей, а не перенос файлов: ни один путь, SHA или экспорт не изменён.",
        "- Совпадение имён при разных SHA — разные сборки; байтовое слияние для них запрещено.",
        "- `Asia` и `EU_US_RU` требуют сверки версий, а не механического объединения.",
        "- Содержимое CAL не даёт читаемых названий; уточнение марок для `CHINA 24C08`,",
        "  `ECU 95080` и `EDC16` остаётся открытым. `Any model by dump` уже отображён",
        "  в разделе магнитол, `Help.cal` — в `Утилиты/Неуточнённые`.",
        "",
    ]
    return "\n".join(lines)


def main():
    report = build_report()
    OUT_JSON.write_text(
        json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    OUT_MD.write_text(render_markdown(report), encoding="utf-8")
    print(
        f"groups={len(report['groups'])} files={report['coverage']['files']} "
        f"sha={report['coverage']['unique_sha']} -> {OUT_JSON.name}, {OUT_MD.name}"
    )


if __name__ == "__main__":
    main()

