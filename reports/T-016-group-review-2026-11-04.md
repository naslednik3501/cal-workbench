# T-016 — проверка групп 62 + 112 (2026-11-04)

Исполнитель: `cline-deepseek-20261104-T016-groups`. Ветка:
`task/T-016-cline-catalog-groups-2`. Это только карта отображения: исходные
CAL, SHA-256, пути, байты, экспорт, изображения и алгоритмы не изменялись.

## Объём

| Группа | Записей | Уникальных SHA |
|---|---:|---:|
| 62 записи с убранным общим описанием (`generic_phrase_before=true`) | 62 | 62 |
| 112 записей из `ambiguous_entries` остатка | 112 | 112 |
| **Объединение по полному SHA-256** | **174** | **174** |

Пересечений между группами нет. Это проверено по исходным отчётам, а не
предположено: `source_groups` в
[`T-016-group-review-2026-11-04.json`](T-016-group-review-2026-11-04.json).

## Что проверялось

- Исходная папка, полный путь, соседние файлы и другие версии того же имени.
- Форма CAL: подписи, поля, чекбоксы, списки, кнопки, изображения.
- Обработчики чтения/применения, доступный текст и исходные строки.
- Уже разобранные похожие калькуляторы и отчёты предыдущих этапов T-016.
- Синтетические BIN не использовались; проверка на автомобиле не заявляется.

Для одного текстового CAL `953b3182…` текущий движок не разбирает `else` в
строке 75, но исходный текст содержит `ASSYSTPLUS`, `Reset Oil change`,
`OnApply` и запись пробега. Это использовано только для назначения; статус
поддержки движком не смешивается с назначением.

## 62 записи: подтверждённые операции

| Операция | Записей |
|---|---:|
| Коррекция пробега и сервисные интервалы / сброс сервисных интервалов | 36 |
| Только коррекция пробега | 11 |
| ISN и коррекция пробега | 5 |
| Коррекция пробега и данные TPMS | 4 |
| Коррекция моточасов | 4 |
| Коррекция пробега и отключение тахографа | 2 |

Примеры доказательств: Acura/Honda — чекбокс `reset maintenance` и поля
`MAIN MAINTENANCE`/`RESET 1..6`; BMW — путь `ISN` и подпись `Кальк пробега и
ISN`; Mercedes ASSYST — поля `ASSYST`, `Entry#`, `D`, чекбоксы `Reset Oil
change`/`Reinitialize ASSYST`; Mercedes ESP/TPM — поля `warning`/`reactivation`/
`deactivation`; W211/W164/W169/S221 — поле `Hours`; VW T4/Sprinter — список
`Tachograf On/Off`. Названия без подтверждённой операции не дополнялись.

## 112 записей: марка, модель, узел и направление

Подтверждённые брендовые подпапки созданы только внутри исходных разделов:
`Asia/ATV/Bombardier`, `Asia/ATV/CFMOTO`, `Asia/ATV/Polaris`,
`Asia/ATV/Stels`, `Asia/ATV/Yamaha`, `Asia/ATV/Suzuki`,
`Asia/ATV/Honda`, `Asia/ATV/Kawasaki`, `Asia/ATV/Kymco`,
`Asia/ATV/Baltmotors`, `Asia/ATV/Russkaya Mehanika`, `Asia/ATV/BRP`,
`Asia/Jet ski/{Honda,BRP,Yamaha}`, `ATV/{BRP,Kymco}`,
`MOTO - TRUCK - ATV/Snowmobile/BRP`,
`MOTO - TRUCK - ATV/Snowmobile/Jet ski/{Honda,BRP,Yamaha}`,
`ECU/{Audi,Citroen-Peugeot}`. Корневые названия `ATV`, `Asia`, `ECU`, `CHINA`,
`EU_US_RU`, `MOTO - TRUCK - ATV` не переводились.

Перемещено **99** записей. **13** уже находились в подходящей исходной папке
(`Asia/Nissan`, `Asia/Shaanxi`, `Asia/Motobikes/Suzuki`, `EU_US_RU/VAZ`,
`MOTO - TRUCK - ATV/Motobikes`, `MOTO - TRUCK - ATV/Snowmobile/BRP`).
Направление указано в имени: коррекция пробега, моточасов или обе операции;
для Sea-Doo/Yamaha/Aquatrax использована подпись «Калькулятор часов/пробега»,
а не догадка по полю `HR`.

## Остаток на уточнение — 18

Не распределялись принудительно. У 13 записей марка подтверждена, но конкретная
модель в пути/форме не указана; у 5 недостаточно данных о марке или операции.

| SHA-256 (начало) | Имя | Папка | Что не установлено |
|---|---|---|---|
| `68948a2d…` | Bombardier 908AZ60A — коррекция пробега | `Asia/ATV/Bombardier` | модель |
| `4f261f43…` | Bombardier 9S12HZ256 — коррекция пробега | `Asia/ATV/Bombardier` | модель |
| `376faeb9…` | Bombardier 9S12HZ64 V1 — коррекция пробега | `Asia/ATV/Bombardier` | модель |
| `db8d8a6c…` | Bombardier 9S12HZ64 V2 — коррекция пробега | `Asia/ATV/Bombardier` | модель |
| `7ad59825…` | Bombardier 9S12HZ64 V3 — коррекция пробега | `Asia/ATV/Bombardier` | модель |
| `6b3e3d35…` | Bombardier 9S12HZ64 V4 — коррекция пробега | `Asia/ATV/Bombardier` | модель |
| `a73d9388…` | Bombardier 9S12HZ64 V5 — коррекция пробега | `Asia/ATV/Bombardier` | модель |
| `d0d99db7…` | Bombardier 9S12HZ64 — коррекция пробега | `Asia/ATV/Bombardier` | модель |
| `1b2268be…` | CFMOTO 24C02 — коррекция пробега | `Asia/ATV/CFMOTO` | модель |
| `8bb9b6ac…` | CFMOTO 24C04 — коррекция пробега | `Asia/ATV/CFMOTO` | модель |
| `f77564b8…` | CFMOTO 24C08 — коррекция пробега | `Asia/ATV/CFMOTO` | модель |
| `556bb48d…` | BRP 24C04 Proba — коррекция пробега и моточасов | `MOTO - TRUCK - ATV/Snowmobile/BRP` | модель |
| `4774b3b2…` | BRP 24C164 Proba — коррекция пробега и моточасов | `MOTO - TRUCK - ATV/Snowmobile/BRP` | модель |
| `2abefdbe…` | CHINA 24C08 — коррекция пробега | `CHINA` | марка и модель |
| `327d7115…` | EDC16 — параметры | `ECU` | марка, модель и операция |
| `545d98cd…` | ECU Audi 95080 | `ECU/Audi` | операция |
| `a313e4da…` | MT 9 — коррекция пробега | `MOTO - TRUCK - ATV/Motobikes` | марка и модель |
| `0c43ae85…` | SLASH-93C56-SPSM-14H18-115 | `MOTO - TRUCK - ATV/Motobikes` | марка, модель и операция |

## Проверки

- `node tests/test_t016_group_review.js` — **174/174**: точный состав групп,
  отсутствие пересечений, исходные пути, старые/новые имена, отсутствие
  дублей отображения, 99 перемещений и 18 причин остатка.
- `node tests/test_t016_organization.js` — **9/9**: 15 057 SHA, оригинальные
  корни, сортировка и счётчики, поиск, экспорт и `picture()`.
- `node tests/test_catalog.js` и `test_catalog_dedup.js` — PASS; 8 300
  повторных путей сохранены, разные SHA не слиты.
- `node tests/test_t001_hardware_refs.js` — **6/6**, `node tests/test_scope.js` —
  **8/8**, `python3 tests/test_scope.py` — PASS.
- `python3 tools/package_release.py` — **419 файлов**, профильные тесты прошли;
  `python3 build_static.py` — **253 ресурса**; `py_compile` и `git diff --check`
  чисто. `catalog_inventory.py` — **0** групп вне карты.
- Реальный Chrome **155.0.8059.40** через CDP: 1440×1050 и 390×844, **385**
  проверок, 0 ошибок страницы; `Asia/ATV` и вложенные брендовые папки
  отсортированы по уникальному числу CAL, счётчики совпадают; старые и новые
  имена ищутся; `Acura.bmp` и экспорт исходного CAL проверены. На 390 px
  `scrollWidth=390`, горизонтального переполнения нет.
- `test_engine`/`test_ui_state` требуют отсутствующие приватные BIN-фикстуры —
  это прежнее ограничение, не результат этой группы.

## Публикация

Исходные пути, SHA-256, байты, экспорт и изображения не изменялись; реестр
является контрольной точкой продолжения.

- Commit в `main`: `29444b62ac3fc13820c15eab94514ee876ea59ff`.
- Pages run [41894121049](https://github.com/naslednik3501/cal-workbench/actions/runs/41894121049) — **success**.
- На живом сайте побайтно совпали локальные и опубликованные
  `catalog-organization.js` (`71fbac788098df29bf84f79a91e9b00dc9ec14251e100c7d46cda36d351819db`),
  `catalog-organization-utilities.js` (`5786c2b81f9e8c973930fbd9921578796a891caeb88a9b05a14879261bcaa747`),
  `catalog-organization-remainder.js` (`0664f2ba6c077e4957064d74370e3f7481a54c8e985f02cf2ca7836f795174c2`)
  и реестр `T-016-group-review-2026-11-04.json` (`7700d8a7d06da95e05c4ec9c9142787bbe5e44a592dd6e960801e459e5d56e88`).
