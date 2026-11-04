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
- Активных CAL-путей: 15,684; активных SHA: 9,665; прямо в разделах без марки/модели: 194.
- Исключено реестром области: 0 CAL; адресных правил ресурсов: 9; утверждённой картой: 5392.
- Групп: 66; покрыто 14,073 путей / 8,138 SHA; вне групп — 1,611 обычных путей.

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
| D-ATV-brpbombardier | direct_section | 25 | 25 | Мототехника/ATV/BRP (Bombardier) | high |
| D-ATV-cfmoto | direct_section | 16 | 16 | Мототехника/ATV/CFMOTO | high |
| D-ATV-polaris | direct_section | 10 | 10 | Мототехника/ATV/Polaris | high |
| D-ATV-stels | direct_section | 8 | 8 | Мототехника/ATV/Stels | high |
| D-ATV-yamaha | direct_section | 5 | 5 | Мототехника/ATV/Yamaha | high |
| D-ATV-honda | direct_section | 4 | 4 | Мототехника/ATV/Honda | high |
| D-ATV-suzuki | direct_section | 4 | 4 | Мототехника/ATV/Suzuki | high |
| D-ATV-baltmotors | direct_section | 2 | 2 | Мототехника/ATV/Baltmotors | high |
| D-ATV-kawasaki | direct_section | 2 | 2 | Мототехника/ATV/Kawasaki | high |
| D-ATV-kymco | direct_section | 2 | 2 | Мототехника/ATV/Kymco | high |
| D-ATV-russkaya-mehanika | direct_section | 2 | 2 | Мототехника/ATV/Русская Механика | high |
| D-root-renault | root_brand_section | 15 | 15 | Приборные панели/Renault | medium |
| D-root-peugeot-bsi | root_brand_section | 5 | 5 | BSI и кузовные блоки/Peugeot | high |
| D-root-peugeot-dash | root_brand_section | 3 | 3 | Приборные панели/Peugeot | high |
| D-root-mb | root_brand_section | 2 | 2 | Иммобилайзеры и ключи/Mercedes-Benz | high |
| D-ecu-generic | direct_section | 2 | 2 | Двигатель/Универсальные | medium |
| D-ecu-citroen-peugeot | direct_section | 1 | 1 | Двигатель/Citroen и Peugeot | medium |
| D-tachograf-off | direct_section | 4 | 4 | Утилиты/Тахографы | high |
| D-immo-off | direct_section | 2 | 2 | Иммобилайзеры и ключи/SsangYong | high |
| D-immo-renault-uch | direct_section | 1 | 1 | Иммобилайзеры и ключи/Renault | high |
| D-china-generic | direct_section | 1 | 1 | Китайские автомобили/Неуточнённые | low |
| D-crc-dash | direct_section | 1 | 1 | Утилиты/CRC | high |
| D-carradio-universal | direct_section | 1 | 1 | Магнитолы и навигация/Универсальные | medium |
| D-cat-atv | category_direct | 255 | 169 | Мототехника/ATV/<марка> | high |
| D-cat-jetski | category_direct | 12 | 11 | Мототехника/Гидроциклы/<марка> | high |
| D-cat-motobikes | category_direct | 2 | 2 | Мототехника/Мотоциклы | low |
| D-cat-snowmobile | category_direct | 2 | 1 | Мототехника/Снегоходы | low |
| D-cat-immo-convertor | category_direct | 2 | 2 | Иммобилайзеры и ключи/Конвертеры ключей | high |
| P01 | parallel_sections | 9259 | 4829 | Приборные панели/<марка> | high |
| P03 | parallel_sections | 86 | 85 | Приборные панели/Универсальные | high |
| P04 | parallel_sections | 96 | 76 | Утилиты/Конвертеры US-EU | high |
| P05 | parallel_sections | 694 | 434 | Мототехника/<ATV|Мотоциклы|Снегоходы> и Грузовые и спецтехника | medium |
| P06 | parallel_sections | 850 | 850 | существующий раздел устройства/<марка> | high |
| P07 | parallel_sections | 2220 | 2220 | существующий раздел устройства/<марка> | medium |
| P08 | parallel_sections | 177 | 177 | Утилиты/<функция> | high |
| P09 | parallel_sections | 373 | 364 | Иммобилайзеры и ключи/<марка> | high |
| P10 | parallel_sections | 61 | 61 | Утилиты/Сервисные функции | medium |
| S-audi | brand_spelling | 9 | 7 | <раздел устройства>/Audi | high |
| S-bentley | brand_spelling | 1 | 1 | <раздел устройства>/Bentley | high |
| S-bmw | brand_spelling | 18 | 18 | <раздел устройства>/BMW | high |
| S-chery | brand_spelling | 12 | 12 | <раздел устройства>/Chery | high |
| S-chevrolet | brand_spelling | 1 | 1 | <раздел устройства>/Chevrolet | medium |
| S-chrysler | brand_spelling | 1 | 1 | <раздел устройства>/Chrysler | medium |
| S-citroen | brand_spelling | 4 | 4 | <раздел устройства>/Citroen | high |
| S-daihatsu | brand_spelling | 3 | 3 | <раздел устройства>/Daihatsu | high |
| S-dongfeng | brand_spelling | 11 | 6 | <раздел устройства>/DongFeng | high |
| S-infiniti | brand_spelling | 91 | 38 | <раздел устройства>/Infiniti | high |
| S-jac | brand_spelling | 4 | 2 | <раздел устройства>/JAC | high |
| S-jaguar | brand_spelling | 28 | 14 | <раздел устройства>/Jaguar | high |
| S-kamaz | brand_spelling | 6 | 6 | <раздел устройства>/KAMAZ | high |
| S-kia | brand_spelling | 242 | 149 | <раздел устройства>/Kia | high |
| S-lada | brand_spelling | 1 | 1 | <раздел устройства>/Lada | high |
| S-landrover | brand_spelling | 51 | 47 | <раздел устройства>/Land Rover | high |
| S-mazda | brand_spelling | 2 | 2 | <раздел устройства>/Mazda | high |
| S-mercedesbenz | brand_spelling | 64 | 64 | <раздел устройства>/Mercedes-Benz | high |
| S-peugeot | brand_spelling | 5 | 5 | <раздел устройства>/Peugeot | high |
| S-porsche | brand_spelling | 2 | 2 | <раздел устройства>/Porsche | high |
| S-saab | brand_spelling | 1 | 1 | <раздел устройства>/Saab | high |
| S-ssangyong | brand_spelling | 69 | 33 | <раздел устройства>/SsangYong | high |
| S-subaru | brand_spelling | 5 | 5 | <раздел устройства>/Subaru | high |
| S-suzuki | brand_spelling | 7 | 7 | <раздел устройства>/Suzuki | high |
| S-tagaz | brand_spelling | 8 | 4 | <раздел устройства>/TAGAZ | high |
| S-volkswagen | brand_spelling | 131 | 116 | <раздел устройства>/Volkswagen | high |
| S-cfmoto | brand_spelling | 13 | 7 | <раздел устройства>/CFMOTO | high |
| E01 | broken_encoding | 59 | 36 | переименовать папку и файл по декодированному имени | high |
| E02 | broken_encoding | 4 | 3 | нормализовать пробелы в имени папки | high |

## Параллельные разделы

### P01 — Dashboard и Car: две раскладки одного содержимого (high)

Car повторяет Dashboard почти побайтно; Car дополнительно смешивает буквенные папки и папки марок. Пересечение с другими разделами — Dashboard: 4414 SHA (93%); Car: 4414 SHA (98%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/Dashboard | 4767 | 4763 | 4414 (93%) | 4763 (100%) |
| Calculators/Car | 4492 | 4480 | 4414 (98%) | 4480 (100%) |

### P03 — I и I_ok: одинаковые имена панелей, разные сборки (high)

43 имени в каждом разделе совпадают, но SHA почти не пересекаются: это не побайтовые дубликаты, а разные версии. Пересечение с другими разделами — I: 1 SHA (2%); I_ok: 1 SHA (2%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/I | 43 | 43 | 1 (2%) | 22 (51%) |
| Calculators/I_ok | 43 | 43 | 1 (2%) | 0 (0%) |

### P04 — US-Euro converter и USA-Euro converter (high)

41 имя совпадает, половина SHA общая; остальное — другие сборки. Пересечение с другими разделами — US-Euro converter: 20 SHA (36%); USA-Euro converter: 20 SHA (49%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/US-Euro converter | 55 | 55 | 20 (36%) | 0 (0%) |
| Calculators/USA-Euro converter | 41 | 41 | 20 (49%) | 0 (0%) |

### P05 — MOTO, MOTO - TRUCK - ATV и ATV (medium)

MOTO полностью входит в MOTO - TRUCK - ATV, ATV почти полностью; при этом в MOTO - TRUCK - ATV есть уникальные грузовые и спецтехника. Пересечение с другими разделами — MOTO: 182 SHA (100%); MOTO - TRUCK - ATV: 259 SHA (60%); ATV: 77 SHA (96%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/MOTO | 182 | 182 | 182 (100%) | 1 (0%) |
| Calculators/MOTO - TRUCK - ATV | 432 | 431 | 259 (60%) | 226 (52%) |
| Calculators/ATV | 80 | 80 | 77 (96%) | 77 (96%) |

### P06 — Региональные France, Germany, CHINA повторяют Dashboard (high)

96%, 78% и 96% SHA соответственно уже есть в Dashboard/Car; отдельная региональная папка не нужна. Пересечение с другими разделами — France: 0 SHA (0%); Germany: 0 SHA (0%); CHINA: 0 SHA (0%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/France | 392 | 392 | 0 (0%) | 377 (96%) |
| Calculators/Germany | 358 | 358 | 0 (0%) | 281 (78%) |
| Calculators/CHINA | 100 | 100 | 0 (0%) | 96 (96%) |

### P07 — Asia и EU_US_RU: альтернативные сборки тех же моделей (medium)

Имена моделей почти совпадают с Dashboard, но SHA общие лишь на 3%: байтовое слияние запрещено, нужна сверка версий. Пересечение с другими разделами — Asia: 0 SHA (0%); EU_US_RU: 0 SHA (0%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/Asia | 1458 | 1458 | 0 (0%) | 48 (3%) |
| Calculators/EU_US_RU | 762 | 762 | 0 (0%) | 24 (3%) |

### P08 — OTHER: зеркало утилит в корне каталога (high)

OTHER повторяет корневые PIN, Service calc, US-Euro converter и CRC побайтно; остальные функции совпадают по именам.

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/OTHER | 177 | 177 | 0 (0%) | 1 (1%) |

Зеркала `OTHER`: PIN — 54 файлов, общих SHA 54; Service calc — 52 файлов, общих SHA 52; Synchronization — 11 файлов, общих SHA 4; Tachograf off — 4 файлов, общих SHA 0; CRC — 1 файлов, общих SHA 1; US-Euro converter — 55 файлов, общих SHA 55.

### P09 — Immo off вложен в Immo (high)

Все SHA Immo off уже есть в Immo; отдельный раздел не нужен. Пересечение с другими разделами — Immo: 3 SHA (1%); Immo off: 3 SHA (100%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/Immo | 368 | 364 | 3 (1%) | 4 (1%) |
| Calculators/Immo off | 5 | 3 | 3 (100%) | 0 (0%) |

### P10 — Service и Service calc (medium)

Имена совпадают, общих SHA нет: это разные сборки одной функции. Пересечение с другими разделами — Service: 0 SHA (0%); Service calc: 0 SHA (0%).

| Раздел | Файлов | SHA | Пересечение с остальными | Совпадает с Dashboard/Car |
|---|---:|---:|---:|---:|
| Calculators/Service | 9 | 9 | 0 (0%) | 0 (0%) |
| Calculators/Service calc | 52 | 52 | 0 (0%) | 1 (2%) |

## Очередные группы

Порядок: сначала уверенность, затем размер.

| ID | Группа | Файлов | SHA | Уверенность |
|---|---|---:|---:|---|
| P01 | Dashboard и Car: две раскладки одного содержимого | 9259 | 4829 | high |
| P06 | Региональные France, Germany, CHINA повторяют Dashboard | 850 | 850 | high |
| P09 | Immo off вложен в Immo | 373 | 364 | high |
| D-cat-atv | ATV: файлы прямо в папке категории, без марки | 255 | 169 | high |
| S-kia | Kia: варианты написания папки | 242 | 149 | high |
| P08 | OTHER: зеркало утилит в корне каталога | 177 | 177 | high |
| S-volkswagen | Volkswagen: варианты написания папки | 131 | 116 | high |
| P04 | US-Euro converter и USA-Euro converter | 96 | 76 | high |
| S-infiniti | Infiniti: варианты написания папки | 91 | 38 | high |
| P03 | I и I_ok: одинаковые имена панелей, разные сборки | 86 | 85 | high |
| S-ssangyong | SsangYong: варианты написания папки | 69 | 33 | high |
| S-mercedesbenz | Mercedes-Benz: варианты написания папки | 64 | 64 | high |

## Ограничения

- Это реестр путей, а не перенос файлов: ни один путь, SHA или экспорт не изменён.
- Совпадение имён при разных SHA — разные сборки; байтовое слияние для них запрещено.
- `Asia` и `EU_US_RU` требуют сверки версий, а не механического объединения.
- Содержимое CAL не даёт читаемых названий; уточнение марок для `CHINA 24C08`,
  `ECU 95080`, `EDC16` и `Any model by dump` остаётся открытым.
