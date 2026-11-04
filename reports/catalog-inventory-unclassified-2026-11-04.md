# Инвентаризация оставшихся CAL — 2026-11-04

Продолжение T-001/T-016. Документ фиксирует только **инвентаризацию**: дерево сайта,
пути, байты, SHA, экспорт CAL, алгоритмы и изображения не изменяются.
Машиночитаемый реестр: `reports/catalog-inventory-unclassified-2026-11-04.json`.

## Метод

- Источники: `catalog.js`, `scope-registry.json`, `catalog-organization.js`, `catalog-organization-airbag.js`.
- 5 392 CAL с утверждённой картой отображения исключены по SHA (12 из первого этапа,
  5 380 новых записей Airbag/SRS); это 5 383 уникальных SHA Airbag/SRS плюс 9 корневых CAL.
- CAL читались только для неоднозначных записей; полезная нагрузка — hex-код без
  читаемого заголовка, поэтому основание — путь, имя и совпадения SHA.
- Большие группы в Markdown не дублируются: полные пути и статистика по папкам — в JSON.

## Каталог

- Записей: 23,946; CAL-путей: 23,357; уникальных CAL SHA: 15,057.
- Активных CAL-путей: 3,213; активных SHA: 2,846; прямо в разделах без марки/модели: 12.
- Исключено реестром области: 0 CAL; адресных правил ресурсов: 9; утверждённой картой: 12211.
- Групп: 31; покрыто 3,028 путей / 2,712 SHA; вне групп — 185 обычных путей.

## Словарь разделов

| Раздел | Назначение | Исходные разделы |
|---|---|---|
| Подушки безопасности | SRS: сброс Crash, чтение и ремонт блоков подушек. | Airbag, SRS |
| Приборные панели | Щитки, панели приборов, одометры и CRC панели. | Dashboard, Car, I, I_ok |
| BSI и кузовные блоки | BSI, BCM, CJB и другие кузовные блоки. | Peugeot |
| Иммобилайзеры и ключи | IMMO, UCH/BCM/EZS, транспондеры и конвертеры ключей. | Immo, Immo off |
| Магнитолы и навигация | Автомагнитолы, навигация и их коды. | CarRadio |
| Двигатель | ЭБУ двигателя и связанные с ним блоки. | ECU |
| Мототехника | ATV, мотоциклы, снегоходы, гидроциклы. | ATV, MOTO, Bikes |
| Грузовые и спецтехника | Грузовики, автобусы, погрузчики, сельхозтехника. | MOTO - TRUCK - ATV, Forklift truck |
| Китайские автомобили | Китайские марки, выделенные из CHINA и Asia/China. | CHINA, Asia/China |
| Криптография дампов | Декрипторы и крипто-калькуляторы BSI/ECU; функциональный раздел до разнесения по устройствам. | CRYPTO, CRYPTO+ |
| Утилиты | PIN, сервисные функции, конвертеры, синхронизация, тахографы, CRC и справочники. | PIN, Service calc, Service, Synchronization, Tachograf off, CRC, US-Euro converter, USA-Euro converter, OTHER |

Марка всегда уточняет раздел устройства: `Приборные панели/Renault`,
`Подушки безопасности/Hyundai`, `Утилиты/Тахографы`. Отдельный раздел создаётся
только для устойчивой категории, а не для одного файла.

## Словарь марок

| Эталон | Варианты в каталоге |
|---|---|
| Audi | AUDI |
| Bentley | BENTLEY |
| BMW | Bmw |
| Chery | Cherry |
| Chevrolet | CHEVROLEY |
| Chrysler | Crysler |
| Citroen | CITROEN |
| Daihatsu | DAIHATSU |
| DongFeng | DONG FENG |
| Hyundai | Huyndai |
| Infiniti | Infinity |
| JAC | Jac |
| Jaguar | jaguar |
| KAMAZ | Kamaz |
| Kia | KIA |
| Lada | LADA |
| Land Rover | LAND ROVER, Land rover LR2, All Rovers, Range Rover |
| Mazda | MAZDA |
| Mercedes-Benz | Mersedes, Mers, Benz |
| Peugeot | Pegeot |
| Pontiac | Pontiak |
| Porsche | PORSCHE |
| Saab | SAAB |
| SsangYong | Ssang Yong |
| Subaru | SUBARU |
| Suzuki | SUZUKI |
| TAGAZ | TaGAZ |
| Volkswagen | VW, Vw |
| CFMOTO | CFmoto |

## Группы

| ID | Тип | Файлов | SHA | Предложение | Уверенность |
|---|---|---:|---:|---|---|
| D-ATV-brpbombardier | direct_section | 2 | 2 | Мототехника/ATV/BRP (Bombardier) | high |
| D-ATV-kymco | direct_section | 1 | 1 | Мототехника/ATV | medium |
| D-root-peugeot-bsi | root_brand_section | 3 | 3 | BSI и кузовные блоки/Peugeot | high |
| D-ecu-generic | direct_section | 2 | 2 | Двигатель/Универсальные | medium |
| D-ecu-citroen-peugeot | direct_section | 1 | 1 | Двигатель/Citroen и Peugeot | medium |
| D-tachograf-off | direct_section | 4 | 4 | Утилиты/Тахографы | high |
| D-china-generic | direct_section | 1 | 1 | Китайские автомобили/Неуточнённые | low |
| D-crc-dash | direct_section | 1 | 1 | Утилиты/CRC | high |
| D-cat-atv | category_direct | 84 | 84 | Мототехника/ATV/<марка> | high |
| D-cat-jetski | category_direct | 5 | 5 | Мототехника/Гидроциклы/<марка> | high |
| D-cat-motobikes | category_direct | 2 | 2 | Мототехника/Мотоциклы | low |
| D-cat-snowmobile | category_direct | 2 | 1 | Мототехника/Снегоходы | low |
| P01 | parallel_sections | 1 | 1 | Приборные панели/<марка> | high |
| P04 | parallel_sections | 96 | 76 | Утилиты/Конвертеры US-EU | high |
| P05 | parallel_sections | 389 | 208 | Мототехника/<ATV|Мотоциклы|Снегоходы> и Грузовые и спецтехника | medium |
| P06 | parallel_sections | 96 | 96 | существующий раздел устройства/<марка> | high |
| P07 | parallel_sections | 2148 | 2148 | существующий раздел устройства/<марка> | medium |
| P08 | parallel_sections | 176 | 176 | Утилиты/<функция> | high |
| P10 | parallel_sections | 60 | 60 | Утилиты/Сервисные функции | medium |
| S-bmw | brand_spelling | 13 | 13 | <раздел устройства>/BMW | high |
| S-chery | brand_spelling | 10 | 10 | <раздел устройства>/Chery | high |
| S-dongfeng | brand_spelling | 1 | 1 | <раздел устройства>/DongFeng | high |
| S-infiniti | brand_spelling | 1 | 1 | <раздел устройства>/Infiniti | high |
| S-kia | brand_spelling | 49 | 49 | <раздел устройства>/Kia | high |
| S-landrover | brand_spelling | 38 | 38 | <раздел устройства>/Land Rover | high |
| S-peugeot | brand_spelling | 5 | 5 | <раздел устройства>/Peugeot | high |
| S-ssangyong | brand_spelling | 1 | 1 | <раздел устройства>/SsangYong | high |
| S-volkswagen | brand_spelling | 23 | 23 | <раздел устройства>/Volkswagen | high |
| S-cfmoto | brand_spelling | 13 | 7 | <раздел устройства>/CFMOTO | high |
| E01 | broken_encoding | 18 | 14 | переименовать папку и файл по декодированному имени | high |
| E02 | broken_encoding | 2 | 1 | нормализовать пробелы в имени папки | high |

## Параллельные разделы

### P01 — Dashboard и Car: две раскладки одного содержимого (high)

Car повторяет Dashboard почти побайтно; Car дополнительно смешивает буквенные папки и папки марок. Пересечение с другими разделами — Dashboard: 0 SHA (0%); Car: 0 SHA (0%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/Dashboard | 0 | 0 | 0 (0%) | 0 (0%) |
| Calculators/Car | 1 | 1 | 0 (0%) | 1 (100%) |

### P04 — US-Euro converter и USA-Euro converter (high)

41 имя совпадает, половина SHA общая; остальное — другие сборки. Пересечение с другими разделами — US-Euro converter: 20 SHA (36%); USA-Euro converter: 20 SHA (49%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/US-Euro converter | 55 | 55 | 20 (36%) | 0 (0%) |
| Calculators/USA-Euro converter | 41 | 41 | 20 (49%) | 0 (0%) |

### P05 — MOTO, MOTO - TRUCK - ATV и ATV (medium)

MOTO полностью входит в MOTO - TRUCK - ATV, ATV почти полностью; при этом в MOTO - TRUCK - ATV есть уникальные грузовые и спецтехника. Пересечение с другими разделами — MOTO: 181 SHA (100%); MOTO - TRUCK - ATV: 181 SHA (88%); ATV: 0 SHA (0%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/MOTO | 181 | 181 | 181 (100%) | 0 (0%) |
| Calculators/MOTO - TRUCK - ATV | 205 | 205 | 181 (88%) | 0 (0%) |
| Calculators/ATV | 3 | 3 | 0 (0%) | 0 (0%) |

### P06 — Региональные France, Germany, CHINA повторяют Dashboard (high)

96%, 78% и 96% SHA соответственно уже есть в Dashboard/Car; отдельная региональная папка не нужна. Пересечение с другими разделами — France: 0 SHA (0%); Germany: 0 SHA (0%); CHINA: 0 SHA (0%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/France | 15 | 15 | 0 (0%) | 0 (0%) |
| Calculators/Germany | 77 | 77 | 0 (0%) | 0 (0%) |
| Calculators/CHINA | 4 | 4 | 0 (0%) | 0 (0%) |

### P07 — Asia и EU_US_RU: альтернативные сборки тех же моделей (medium)

Имена моделей почти совпадают с Dashboard, но SHA общие лишь на 3%: байтовое слияние запрещено, нужна сверка версий. Пересечение с другими разделами — Asia: 0 SHA (0%); EU_US_RU: 0 SHA (0%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/Asia | 1410 | 1410 | 0 (0%) | 0 (0%) |
| Calculators/EU_US_RU | 738 | 738 | 0 (0%) | 0 (0%) |

### P08 — OTHER: зеркало утилит в корне каталога (high)

OTHER повторяет корневые PIN, Service calc, US-Euro converter и CRC побайтно; остальные функции совпадают по именам.

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/OTHER | 176 | 176 | 0 (0%) | 0 (0%) |

Зеркала `OTHER`: PIN — 54 файлов, общих SHA 54; Service calc — 51 файлов, общих SHA 51; Synchronization — 11 файлов, общих SHA 4; Tachograf off — 4 файлов, общих SHA 0; CRC — 1 файлов, общих SHA 1; US-Euro converter — 55 файлов, общих SHA 55.

### P10 — Service и Service calc (medium)

Имена совпадают, общих SHA нет: это разные сборки одной функции. Пересечение с другими разделами — Service: 0 SHA (0%); Service calc: 0 SHA (0%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/Service | 9 | 9 | 0 (0%) | 0 (0%) |
| Calculators/Service calc | 51 | 51 | 0 (0%) | 0 (0%) |

## Очередные группы

Порядок: сначала уверенность, затем размер.

| ID | Группа | Файлов | SHA | Уверенность |
|---|---|---:|---:|---|
| P08 | OTHER: зеркало утилит в корне каталога | 176 | 176 | high |
| P04 | US-Euro converter и USA-Euro converter | 96 | 76 | high |
| P06 | Региональные France, Germany, CHINA повторяют Dashboard | 96 | 96 | high |
| D-cat-atv | ATV: файлы прямо в папке категории, без марки | 84 | 84 | high |
| S-kia | Kia: варианты написания папки | 49 | 49 | high |
| S-landrover | Land Rover: варианты написания папки | 38 | 38 | high |
| S-volkswagen | Volkswagen: варианты написания папки | 23 | 23 | high |
| E01 | Пути с битой кодировкой UTF-8 | 18 | 14 | high |
| S-bmw | BMW: варианты написания папки | 13 | 13 | high |
| S-cfmoto | CFMOTO: варианты написания папки | 13 | 7 | high |
| S-chery | Chery: варианты написания папки | 10 | 10 | high |
| D-cat-jetski | Jet ski: гидроциклы без папки марки | 5 | 5 | high |

## Ограничения

- Это реестр путей, а не перенос файлов: ни один путь, SHA или экспорт не изменён.
- Совпадение имён при разных SHA — разные сборки; байтовое слияние для них запрещено.
- `Asia` и `EU_US_RU` требуют сверки версий, а не механического объединения.
- Содержимое CAL не даёт читаемых названий; уточнение марок для `CHINA 24C08`,
  `ECU 95080` и `EDC16` остаётся открытым. `Any model by dump` уже отображён в P10.
