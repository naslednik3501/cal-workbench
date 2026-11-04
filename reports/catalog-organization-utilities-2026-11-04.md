# Утилиты — карта отображения (2026-11-04)

Раздел собран из существующих исходных CAL. Это только виртуальная карта отображения:
оригинальные пути, байты, SHA, экспорт и изображения не перемещены и не изменены.
Машиночитаемые решения по каждому SHA: `reports/catalog-organization-utilities-2026-11-04.json`,
поле `decisions` (217 записей), а также `non_cal_resources` и `hardware_policy`.

## Итог

- Исходных CAL-путей: **404**; уникальных SHA: **218**; записей в карте: **217**.
- Один SHA уже был отображён в приборных панелях и не перезаписан: `4d299384cfd5cec8bed185135b1bd1acd84dfa0460211212561171ea1b0a2159`.
- Групп совпавших имён/версий: **52**; неопределённых: **1**.
- Оригинальные CAL и все их пути сохранены; совпадающие SHA не сливались, разные SHA не объединялись.
- Новых исключений CAL по аппаратной политике нет: подтверждённые аппаратные ссылки уже
  исключены адресными правилами T-001; их ресурсы и CAL сохранены.

## Источники

| Исходный раздел | CAL-путей | Уникальных SHA |
|---|---:|---:|
| `Tachograf off` | 4 | 4 |
| `CRC` | 1 | 1 |
| `USA-Euro converter` | 41 | 41 |
| `PIN` | 54 | 54 |
| `Synchronization` | 11 | 11 |
| `US-Euro converter` | 55 | 55 |
| `OTHER` | 177 | 176 |
| `Service calc` | 52 | 51 |
| `Service` | 9 | 9 |

`OTHER` — зеркало утилит: 166 путей совпадают по SHA с корневыми разделами и сведены к одной
записи; 11 уникальных SHA — 4 тахографа и 7 синхронизаций. `Service` и `Service calc` дают
61 путь, 60 уникальных SHA (одна точная копия). `US-Euro converter` и `USA-Euro converter`
дают 96 путей, 76 SHA: 20 общих сборок отображены один раз, разные версии сохранены.

## Категории

| Категория | Записей | Назначение |
|---|---:|---|
| `Утилиты/CRC` | 1 | CRC и VIN по выделению; утверждённые CRC-калькуляторы остаются отдельно. |
| `Утилиты/PIN и IMMO` | 49 | PIN, ISN, login и данные IMMOBILIZER; марка берётся только из пути/формы. |
| `Утилиты/Конвертеры US-EU` | 76 | конверсия миль ↔ км для панелей/BCU; без выдуманной марки. |
| `Утилиты/Неуточнённые` | 1 | назначение не подтверждено; запись не скрыта. |
| `Утилиты/Сервисные функции` | 60 | сервисные интервалы, ASSYST и коррекция пробега; SRS-операции названы явно. |
| `Утилиты/Синхронизация` | 22 | восстановление синхронизации Dash/ECU/PCM. |
| `Утилиты/Тахографы` | 8 | Tachograf off и связанные сервисные варианты. |

Операции распределены по форме CAL и исходному имени. Для универсальных записей автомобильная
марка не создавалась; марка в названии появляется только при наличии её в исходном пути или форме.

## Аппаратная политика

- В реестре области: 8 решений, 9 адресных правил ресурсов.
- Новых `hardware_only` CAL среди утилит не найдено; `new_cal_exclusions=0`.
- `Calculators/PIN/Mitsubishi/Help.cal` не исключён: имя `Help` и форма не доказывают
  ни аппаратное, ни расчётное назначение. Он оставлен в `Утилиты/Неуточнённые` с причиной.
- Смешанные CAL с аппаратными указаниями (4 dashboard-версии) остаются активными; их расчётная
  часть не менялась. Изображения плат и общие ресурсы не удалялись.

## Не-CAL ресурсы

- Сохранено **193** не-CAL файлов в этих разделах: bc — 5, bmp — 181, jpg — 6, png — 1.
- Ни один файл не объявлен мусором по расширению и не удалён. `bc`-файлы — самостоятельные
  программы/заготовки, а не автоматически подключаемые зависимости; они остаются в каталоге.
- Для P-ссылок проверено наличие совпадающих имён; точная привязка по имени не объявляется.
  Общие картинки и утверждённые восстановленные изображения сохранены. Неразрешённые старые
  ссылки не являются основанием для удаления ресурса.
- В этих CAL найдено 410 P-ссылок; 28 разрешаются утверждённой картой изображений, 23 не-CAL
  файла имеют совпадение базового имени с P-ссылкой, 18 ссылок не нашли точного имени среди
  этих ресурсов. Это результаты проверки ссылок, а не приговор файлам: ничего не удалено и не
  подменено догадкой.

## Решения по SHA

Полная таблица 217 записей; источник — исходный раздел(ы), имя — только отображаемое.

| SHA-256 | Источник | Категория | Отображаемое имя |
|---|---|---|---|
| `b1a2d621d1a65ea8ddb3d5d05ffd2f0768a9e91dbe607bc0b10681be3fe8d9cf` | CRC, OTHER | Утилиты/CRC | CRC и VIN в дампе панели — отдельная сборка |
| `df725cc741a67abddc2cf7cd8287458f7cdcb7f2aa6c5c68d68ce91de75a7c53` | PIN, OTHER | Утилиты/PIN и IMMO | Astra H VDO PIN 35080 — PIN и данные IMMO |
| `c096be74c0b022312239c4a87ea719e6a6aacd23e646b2bf58c8b35ccec5f9c9` | PIN, OTHER | Утилиты/PIN и IMMO | Audi A4 Dash RB4 24C08 — PIN и данные IMMO |
| `23d0262c1e181a9f28e8eadad2cc2f1886c8b6d0d22de692be79966e1194bf9b` | PIN, OTHER | Утилиты/PIN и IMMO | Audi A6 EDC15 LOGIN 24C04 — PIN и данные IMMO |
| `7bd5b41e85d64d8a77224b3ac769fd37896d7cebee973c74a8f3d3e2591f6482` | PIN, OTHER | Утилиты/PIN и IMMO | BMW ISN CAS 3 9S12X-series — ISN и коррекция пробега |
| `7082de546d496132dd0893fa9aff11853aff72b6e340d8d70d3c462c59235ea4` | PIN, OTHER | Утилиты/PIN и IMMO | BMW ISN CAS 3+ 9S12XDP512 — ISN и коррекция пробега |
| `e868b04330b08ed7df0f4d4e0056c83306d4044d2849aa84a9625e037419ee74` | PIN, OTHER | Утилиты/PIN и IMMO | BMW ISN EWS3 68HC11EA9 0D46J — ISN и коррекция пробега |
| `8b2d4d977cb04db29e02272a329ca92c6647a591a2c754a559c787652b471d03` | PIN, OTHER | Утилиты/PIN и IMMO | BMW ISN EWS3+US 68HC11EA9 0D46J — ISN и коррекция пробега |
| `1cd043b4d810d40ee41c506e2777a3c24935f253c575cd56b072b617f5caa3ae` | PIN, OTHER | Утилиты/PIN и IMMO | BMW ISN EWS4 9S12DG64 2L86D KM — ISN и коррекция пробега |
| `cd2c0d2f236efca4a6e80dd30a446a01f884551df7faa57d01b91436184bad2b` | PIN, OTHER | Утилиты/PIN и IMMO | Chevrolet Aveo BCU PIN immo 25160 — PIN и данные IMMO |
| `7b36ffdafbdce79ed39c064da4e8e177d175f5cf03f08c4794774b8dcba744c2` | PIN, OTHER | Утилиты/PIN и IMMO | Chevrolet Aveo BCU PIN immo 25160 — PIN и данные IMMO · вариант 2 |
| `efe44cfd243f40b6bf7d4349f7286bccaedd684ab13887a9f988a2a011511777` | PIN, OTHER | Утилиты/PIN и IMMO | Chevrolet Cobalt BCU PIN immo 25160 — PIN и данные IMMO |
| `c5451e7f838fae7304545947b7b254d8d21c58c176e0c042d731e88e9fb468ce` | PIN, OTHER | Утилиты/PIN и IMMO | Chevrolet Cobalt BCU PIN immo 25160 — PIN и данные IMMO · вариант 2 |
| `6f0ae9c7d4efcbd2f184650a00291e50fdd79629ace9b8c1a2254b4ed5ce6213` | PIN, OTHER | Утилиты/PIN и IMMO | Chevrolet Cruze BCU PIN immo 24C16 — PIN и данные IMMO |
| `8e414a35a190b67fc53e1eba3597f80443ae39c3b847280006f14a2f8aecd0d1` | PIN, OTHER | Утилиты/PIN и IMMO | Chevrolet Cruze BCU PIN immo 24C16 — PIN и данные IMMO · вариант 2 |
| `c58d2f4dbf549cde76ca563f7a33eae683db475d0aa1de36cf76735b1109b65e` | PIN, OTHER | Утилиты/PIN и IMMO | Chrysler PT Cruiser 2003 Immo login — PIN и данные IMMO |
| `04d9a0d0267471e1cc06224e6197e5dc6564dbdd0a3762ce2e5cf0f6b955dea3` | PIN, OTHER | Утилиты/PIN и IMMO | Citroen BSI Berlingo 95128 PIN — PIN и данные IMMO |
| `5127ace4a277270fd005dbf1c815452d1365100f0a10a09ff7f77bfede566483` | PIN, OTHER | Утилиты/PIN и IMMO | Citroen ECU Berlingo Bosch ME7.4.5 95320 PIN — PIN и данные IMMO |
| `4ba530fb71ca83cba3e176572be52a6eb36fc6ffe1689597823ad1ce43663deb` | PIN, OTHER | Утилиты/PIN и IMMO | Citroen Jumper 93c56 Immobox PIN — PIN и данные IMMO |
| `0fbe3d4bf4bf150106550f98a23936f2fcfb54e4ca8b210782f2f8c31ccb3367` | PIN, OTHER | Утилиты/PIN и IMMO | Corsa VDO PIN 35080 new — PIN и данные IMMO |
| `1993eae6703fa8353f175e1522954517c55f30d08bea80d296bc8fa2feb6df16` | PIN, OTHER | Утилиты/PIN и IMMO | Corsa VDO PIN 35080 — PIN и данные IMMO |
| `dfa7c86adf6dd544348a3f3859d68606d1d503a22d21bccd47a666bb61261855` | PIN, OTHER | Утилиты/PIN и IMMO | Fiat Albea 9S12DG256 BCU PIN — PIN и данные IMMO |
| `07d5888e025574f083542fc98640007891c8c5873ff4cf18e8e4c38a48556169` | PIN, OTHER | Утилиты/PIN и IMMO | Fiat Doblo 93c66 BCU PIN — PIN и данные IMMO |
| `abd15bdfc13971150ecf0f672a4f99f27d28a824efb7b74dd68b78d0856f4a33` | PIN, OTHER | Утилиты/PIN и IMMO | Ford Connect Dash immo 9S12H256 — PIN и данные IMMO |
| `e89090eed2a3cd6bf40ae5932866fc70858128e282af2d4f98a3ae2ae88c0ba8` | PIN, OTHER | Утилиты/PIN и IMMO | Ford Connect ECU 95320 — PIN и данные IMMO |
| `b704c7236aa084ad6624bd4cb1dd23c18c57f886e4697ee0a9d2703768806cdb` | PIN, OTHER | Утилиты/PIN и IMMO | Ford IMMO DASH Focus 9S12XHZ512 mask 1M80F 4KB — PIN и данные IMMO |
| `aff3a4150710f3e204146c94c2de9a3850b3fd4c0a18269061c27f4c716293cb` | PIN, OTHER | Утилиты/PIN и IMMO | Ford IMMO ECU Focus 95040 — PIN и данные IMMO |
| `e0ccbcc27549934463993e2fe4b3f8bfd6bf8edc1dbbbc474a21cb85381718f7` | PIN, OTHER | Утилиты/PIN и IMMO | Geely Emgrand immobox 93c56 — PIN и данные IMMO |
| `a78b86e9faa9bf751407c905ec6bcfb27092213460322b7ee2bf61560e375d41` | PIN, OTHER | Утилиты/PIN и IMMO | Great Wall Hover H3 ECU — PIN и данные IMMO |
| `4ae1f1289ec260fe63304aff67d52c54250fb022ca628bf55342419a9b5a7051` | PIN, OTHER | Утилиты/PIN и IMMO | IMMO ECU Ford Ranger 95320 — PIN и данные IMMO |
| `42b9115f20c47e601bde2e57e8b0b28005d9d008b01db75d0cd2ce21564e6723` | PIN, OTHER | Утилиты/PIN и IMMO | IMMO ECU Ford Ranger 95320 — PIN и данные IMMO · вариант 2 |
| `36840b2e3ee626c428ab691986c9409fed8da0996d7f2f65fa34f72462edb416` | PIN, OTHER | Утилиты/PIN и IMMO | Kia IMMO ECU ME17.9.11 TC1762 — PIN и данные IMMO |
| `c249659ff7507ddb5a5efd8a9e52cbfa27371dc1c1d6465a25e4209298e6be6d` | PIN, OTHER | Утилиты/PIN и IMMO | Mercedes-Benz W-210 HC05 — PIN и данные IMMO |
| `3f85d2768cdf6ad1a522b4b8ca0dd8d4a214611a5bafa2d8cf96fc8096e437ab` | PIN, OTHER | Утилиты/PIN и IMMO | Mercedes-Benz W-220 HC08 — PIN и данные IMMO |
| `fabb6cce9843c8eb5e426f03f9ecef720702949940e66365459b9778aedfb8b6` | PIN, OTHER | Утилиты/PIN и IMMO | Mitsubishi Outlander XL BCU PIN immo 24C16 — PIN и данные IMMO |
| `7ffb53a8476d8f4a80536f7a1b303bcf0592fcd3904f74ee135b8b4fca3e994b` | PIN, OTHER | Утилиты/PIN и IMMO | Nissan Yuke BCU PIN immo 93C66 — PIN и данные IMMO |
| `6eb2e19e124668695b407bc8ee0aa38d202950e5119c5f4c5c1a570f88047311` | PIN, OTHER | Утилиты/PIN и IMMO | Opel Astra H Display PIN 25080 — PIN и данные IMMO |
| `23f10bc50f8c943e7d6f064ff080948de2b8c869f2d7463256e3285eef1a8ff7` | PIN, OTHER | Утилиты/PIN и IMMO | Opel Astra J BCU PIN immo 25160 — PIN и данные IMMO |
| `e230942f027f73aedff4d65e03a5faeac78239aff233932888d88f9cf02f7f95` | PIN, OTHER | Утилиты/PIN и IMMO | Opel Corsa D Bosch7.6.2 — PIN и данные IMMO |
| `4f3db2ed0e5ab3f131419915341ff0f52aeeadab22def801195d80fdd601160e` | PIN, OTHER | Утилиты/PIN и IMMO | Opel IMMO-2 TMS 370 — PIN и данные IMMO |
| `076eaccad2ec3be23feecff04a656290f536428ef41de5a2afebd7c208589c88` | PIN, OTHER | Утилиты/PIN и IMMO | Opel Immobox Vectra A 05 — PIN и данные IMMO |
| `7ee2a98f6b596348821a55d164cd675ae63716ae8318b0513775b92d144bc643` | PIN, OTHER | Утилиты/PIN и IMMO | Opel Meriva Dash 95080 — PIN и данные IMMO |
| `efdecad11d6032360a0fb629d61c6b09b5cbae2a0380729c1ea536210dca579e` | PIN, OTHER | Утилиты/PIN и IMMO | Opel Mokko BCU PIN immo 24C16 — PIN и данные IMMO |
| `757957511befbb154f69b8b65d2af2b746c713d9f47d5cd9bf47acaea2e5bc0e` | PIN, OTHER | Утилиты/PIN и IMMO | Opel hitag2 — PIN и данные IMMO |
| `d882cc53d42e4fa66c4e43396afd45d4de9aa1e345a8fe4e6427ee5231acc522` | PIN, OTHER | Утилиты/PIN и IMMO | PIN ECU Mazda BT-50 ED16 eep 95320 — PIN и данные IMMO |
| `2faf31ffdb43f74af953ff7e334dddde4b11cd76e1d34d515df6de0ab3375ee2` | PIN, OTHER | Утилиты/PIN и IMMO | Passat Dash VDO 93c66 — PIN и данные IMMO |
| `5b4a494102b8297dd6612c455d771de009e543541a744ea59743b64b0b8d6c3a` | PIN, OTHER | Утилиты/PIN и IMMO | Pin Chery 0L72A — PIN и данные IMMO |
| `1c2381dc8f9dbe0f2b8eab4cd864bbe3439c8d50816c97bc095b40f3ba3b64b4` | PIN, OTHER | Утилиты/PIN и IMMO | Pin Chery ECU 95080 — PIN и данные IMMO |
| `bea0c1eee76cca87785c4e4c42851a68355953f82762cd4ffd66c424f2499780` | PIN, OTHER | Утилиты/PIN и IMMO | Pin Chery TaGaz ECU 95080 — PIN и данные IMMO |
| `d673e62139fc72c948dbf89476a107a7923ac94b134dd230b6fd865080f6fbe8` | PIN, OTHER | Утилиты/PIN и IMMO | Pin Chery TaGaz immo 24c02 — PIN и данные IMMO |
| `6359ffd5d549b0b794a32578d74191d9bcca195f667791207c08a098246ac8a2` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Acura MDX 93C76 — конверсия миль ↔ км |
| `ed9279a376954662eb2ec46d1d7a040172c4ec4578afc9dea531cfb5cc4d5308` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Acura RDX 93C66 — конверсия миль ↔ км |
| `4af9a2bb47d51f0c02f9e72888569366350d3510d752d36eae556ec6710092f6` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Acura RDX US-EU dash — конверсия миль ↔ км |
| `97d610bfdf1b28b20dc2bea7fc2854c0618c1baf5134bfa283267f1d1cd51f33` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Chevrolet Malibu 93C46 — конверсия миль ↔ км |
| `89bc94f752cbbfd2394c3189106ba65a1eb98d93b072bd52b447875d5a38fb5f` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Hyundai Accent 93S56 — конверсия миль ↔ км |
| `f1a77b139c9e3af5e3eba66a2c38f3fdace26b47c17b76f37acb7ebbc8beca39` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus ES350 US-EU BCU — конверсия миль ↔ км |
| `fb0e1bd83a4fb107fbfaa3c285cb92e7ee1544cf91d7476a619522db17aa71f4` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus ES350 US-EU BCU — конверсия миль ↔ км · вариант 2 |
| `d1410eed661a9cac23d7aeb236e4b9a163bc34efe1472f8d9ffa4ebe0ccb9470` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus ES350 US-EU Dash — конверсия миль ↔ км |
| `fdaf1780999b0c1a5613dcab98e4f7ee09f0122e5ac1972094d5f67d6487ec01` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus ES350 US-EU Dash — конверсия миль ↔ км · вариант 2 |
| `a4d65469fdd2a383a0408675da704fff465b53978d8f4b8e73d603f4b0ba3169` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus GS300 US-EU BCU — конверсия миль ↔ км |
| `9e920b8bf03ec07f7dc96f837d3b5abc1e4ea5aebf6fe7b1cde5ef444debcc45` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus GS300 US-EU BCU — конверсия миль ↔ км · вариант 2 |
| `04e8dd21004903b353f2c608086714d7f672fa466d98a18bcc8e63cb17c8d813` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus GS300 US-EU Dash — конверсия миль ↔ км |
| `6833b28ea7035005d855eff3c71f84410cac741ee320fdce378d55c52ee95a7f` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus GS300 US-EU Dash — конверсия миль ↔ км · вариант 2 |
| `8df5cdc6a893e08a45623b5112b955e1f9b9222bd1cf791e13b80f882c4a03d7` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus LS460 93C56 — конверсия миль ↔ км |
| `ee4e6a84ad6b547d8b9b69ffc645f51ff7fc0a689458bf75c5f14df92e4654c3` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus RX 350 body — конверсия миль ↔ км |
| `5275adb3254b2880c76ae73026a2e618fd6a8343b9e4b5687cdca1c68d8c4ea5` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus RX 350 body — конверсия миль ↔ км · вариант 2 |
| `c79f40e875298ae5f8c9dd81af95ccc2f50e789a8f1f07257c8e984ccc4c71e6` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus RX300 US-EU BCU — конверсия миль ↔ км |
| `57ad68f36aedfcb424dcd8a166618edaf4745ec5178119439f95da4ab3773e72` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus RX300 US-EU BCU — конверсия миль ↔ км · вариант 2 |
| `9644e1f8e81d860b38cbfdca2e770999e5df79fcff84c83cf2c1c6e829805912` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus RX330 US-EU BCU — конверсия миль ↔ км |
| `e513d56c067dc02907cc963149c05ed2d851878b63a0bda38e56c7805a8f9b00` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus RX330 US-EU dash — конверсия миль ↔ км |
| `6f888ebf7a137daee50c5432abc84277c71262de4233268135b926dcdedadb6b` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus RX350 93C66 — конверсия миль ↔ км |
| `2ef69a8a24ac1ed593f5a5c4d9579df55b6a9f41e59bede7e5fa579b285f235b` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus RX350 93C66 — конверсия миль ↔ км · вариант 2 |
| `e86516bb77f78cf72085d69ccdb4a8c498cf97bf5675fdef45046895a59a7a24` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus RX350 US-EU BCU — конверсия миль ↔ км |
| `b050ca11a49cf8fff02f685770d7fac9930fe33057463cbf38f79ff4d0b8ccbf` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus RX350 US-EU BCU — конверсия миль ↔ км · вариант 2 |
| `47aa1eb1b2dfbf8330dbb1c3d383dc7d0b43d5631bdfc6c36166bdfa3ed44c32` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus RX350 US-EU Dash — конверсия миль ↔ км |
| `f255b317bdd5c58021dd6e708ffe036f9965a8f4a4558f459a4a5c536ddfefbc` | USA-Euro converter | Утилиты/Конвертеры US-EU | Lexus RX350 US-EU Dash — конверсия миль ↔ км · вариант 2 |
| `969227db16dfd28fc36bd7443a1bbe437292ee8f3b0847e3ccf04f6e76701cad` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus RX400h US-EU dash — конверсия миль ↔ км |
| `e564a92717eabc0b9387e5a87d00808fee0364d6198a1efaba7bb6749b4799dd` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus es300 dash — конверсия миль ↔ км |
| `3852712f3d9ab13817c276a4578147ad499fb4c90fef2b1cb6ed55acb56be869` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus is250 body — конверсия миль ↔ км |
| `9fab5f19a9d9afe354e30e4c681104e354898cc5a7a3c1a01c989c82e2136800` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus is250 dash — конверсия миль ↔ км |
| `9d3af73d5b67ea112ecdba6a16ee9cf2c5325fc101f1f1b02bc2b34c8c18ed38` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus is350 body — конверсия миль ↔ км |
| `166071bb6a1525f9e7b860e5704974dd08e58007a1d976656fddd400a91edef2` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Lexus is350 dash — конверсия миль ↔ км |
| `af206e1593d364cd8402425ff020350ba34b7a7cc954ff638a6be9d1d26265ac` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Mazda 323 93C46 — конверсия миль ↔ км |
| `290b3559b8d07bc001f7f883d0d18ce66fe12e32ab12805130b39766f4a35d80` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Mazda CX-7 Dash — конверсия миль ↔ км |
| `0e406f2fe5ec0d8c8b3cf51797cdf5002db270e137e4b4a6beba0c1a8c6e3706` | USA-Euro converter | Утилиты/Конвертеры US-EU | Mazda CX-7 Dash — конверсия миль ↔ км · вариант 2 |
| `a76d6e69b77b5bc66eb48800dcfd11b577c85d03361124c5d4d4476e747537fe` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Mercedes-Benz ML W164 Conversion 24C16 — конверсия миль ↔ км |
| `b63e228ad91add0415af513980d1d8e0bd8796200e1624943d44ae2265c5a18d` | USA-Euro converter | Утилиты/Конвертеры US-EU | Mercedes-Benz ML W164 Conversion 24C16 — конверсия миль ↔ км · вариант 2 |
| `75edf57610eb401d5aa90a92859a59f494e66e1a57aacad70758449c97d88e36` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Mercedes-Benz ML W164 Conversion+Russian menu 24C16 — конверсия миль ↔ км |
| `23ac9810fb2e62a216d9b1eca4e702e5c642b9d891682b5a41964bbffddfb33a` | USA-Euro converter | Утилиты/Конвертеры US-EU | Mercedes-Benz ML W164 Conversion+Russian menu 24C16 — конверсия миль ↔ км · вариант 2 |
| `de1378f2822eb3b4389cee33bd368cdb6bdbba03fd7855f6de363bc0d1a65172` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Mercedes-Benz ML W164 Russian menu 24C16 — конверсия миль ↔ км |
| `ca095b0960feef32ce0e44a19d87c1bef30034a0162e981e6a531b1244e44ef3` | USA-Euro converter | Утилиты/Конвертеры US-EU | Mercedes-Benz ML W164 Russian menu 24C16 — конверсия миль ↔ км · вариант 2 |
| `2c1c934e53b32f7cf4d054be2f9ea5663a0b1d5934e36752f2bd5a49d3c871ab` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Nissan 93C66 — конверсия миль ↔ км |
| `3fce856addf2cc0b458eeeb14c0d50f2f8eafd0f293c701eaa89bd9eb37a3211` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Nissan Armada 9S12H256 — конверсия миль ↔ км |
| `a387e36bb793a570c61e250f8f42604e9ea739e81f3a403eda74770f6dc2a058` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Pontiac Vibe 93C46 01 — конверсия миль ↔ км |
| `615b4ea417297975148d920fbc845325e0f79c786c7e25722aa667fa424e5ae9` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Pontiac Vibe 93C46 FD — конверсия миль ↔ км |
| `ad56ed26469267fec6514cf6ef26fe978d7306b132774d214f0ecfaf1623e52a` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Pontiac Vibe 93C46 — конверсия миль ↔ км |
| `79ba1524d63246b99ae78a8f9f6ad8c94ed327ade65d70794445c538124a2c66` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Forester -2002 Dash — конверсия миль ↔ км |
| `72469f0b6a25843c2d50510dbe1a97341c82962dc5e5b35034bc9d284a07ea88` | USA-Euro converter | Утилиты/Конвертеры US-EU | Subaru Forester -2002 Dash — конверсия миль ↔ км · вариант 2 |
| `a2a11e66730ce55227bf04126c72f5eeaf4b2e17f45fc80ec10f2d4a7ccf0abc` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Forester 2002-03 Dash — конверсия миль ↔ км |
| `52d7f024acefc9813d0375c4f958dacf285f57b3b80dc6265c0ea11b12f59719` | USA-Euro converter | Утилиты/Конвертеры US-EU | Subaru Forester 2002-03 Dash — конверсия миль ↔ км · вариант 2 |
| `85ae00361c007b59742cc7c2f4454bc421faf5819fa2a0aa9794377967980341` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Impreza V2 93C56 — конверсия миль ↔ км |
| `c1ac0222b44d30e9a99cd4e0fbdb517e873fbb21dcf3be86d06058abac23726b` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Outback V1 Dash — конверсия миль ↔ км |
| `493192cab6891d45ea64e87ea3aab53e5aab0c522c84d328e123dc01d098e0f9` | USA-Euro converter | Утилиты/Конвертеры US-EU | Subaru Outback V1 Dash — конверсия миль ↔ км · вариант 2 |
| `1b68d25e200e6ce3669b4d7ac6219f24b81c1c5433db0b6acbad255fd4845182` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Tribeca B9 93C56 — конверсия миль ↔ км |
| `536f5b44285e1b581f456526175015fbd98bc495d8e117118990991c6c1cd5a0` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Tribeka FULL 93C66 — конверсия миль ↔ км |
| `e6055b7c4fb78f797a1a991fbf62f2de5303214f5cda23221ff695ad0f9a5aa2` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Tribeka dash 93c66 var1 ok — конверсия миль ↔ км |
| `6df1bcd59ae4515b76fd96c01122bfc32efa5218350779fcbd7c043cb34d64da` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Tribeka dash 93c66 var1 — конверсия миль ↔ км |
| `8392a4ef79f8e356b5372a3c06d112890d5ca64e8a7802584365565bc5e731f2` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Subaru Tribeka dash 93c66 var2 — конверсия миль ↔ км |
| `2378ba0966046998739760999ffc9f3e72ddef1849f2294702b6d3c8c730b54b` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Avalon Dash — конверсия миль ↔ км |
| `e62563acfda5fe04588e2748d38e32f2c1827425dfb09c83011e32c252f0c0e8` | USA-Euro converter | Утилиты/Конвертеры US-EU | Toyota Avalon Dash — конверсия миль ↔ км · вариант 2 |
| `7cce68317110bc17cead78675ceb80de9546affe7c30d01e7b759be8bfaba0a4` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Camry 30 Dash 83800-06653 — конверсия миль ↔ км |
| `0e99b282268086ae4759a50e92075efc0025feb7a43ddad2e9b40fcda9e7054b` | USA-Euro converter | Утилиты/Конвертеры US-EU | Toyota Camry 30 Dash 83800-06653 — конверсия миль ↔ км · вариант 2 |
| `17713b8e261981e113b94476a5f132b081e0df189bf088d89298ddc222dec3b1` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Camry 40 Body — конверсия миль ↔ км |
| `dc280627d5d655c021841acd23eecc6aed19ab68a0f2616964564e3d0b9b4418` | USA-Euro converter | Утилиты/Конвертеры US-EU | Toyota Camry 40 Body — конверсия миль ↔ км · вариант 2 |
| `b6603217ef1b773082572632c7a71367ce89fee829e301bf16f21acccad8a5d8` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Camry 40 Dash — конверсия миль ↔ км |
| `6c75bdb3fa0577293af7200d9b9afbc6d8b3beb48de028dc4f33cfd373c294bb` | USA-Euro converter | Утилиты/Конвертеры US-EU | Toyota Camry 40 Dash — конверсия миль ↔ км · вариант 2 |
| `f62b1eeafb0fe333999800429f8470451b807d5727a29f6e514fc7df7cc7327b` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Matrix 93C46 var2 — конверсия миль ↔ км |
| `796f912d6bcc02b5d3049ce58a5e0404fae821027a08c2a738ca0d1a56e3d6cf` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Matrix 93C46 var2 — конверсия миль ↔ км · вариант 2 |
| `dfa4d7ac72138cd0c26bb82654c3c51b092e66df31637033e442cd96fff1f242` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Matrix 93c46 var1 — конверсия миль ↔ км |
| `e6d64c71209cfef15e5595d7ffa905d687c9077faa3c0400c3118391a0457cf1` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Matrix 93c46 var1 — конверсия миль ↔ км · вариант 2 |
| `ad784840a5534cee7b3a75fa0567246b965fffdee76b21a0b5177986d71de3c6` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Matrix US-EU Dash — конверсия миль ↔ км |
| `ccee9a5d0a5e432bfc66cb9bf4b46d9f834baf90593696850e35f6fdb5d9bd85` | USA-Euro converter | Утилиты/Конвертеры US-EU | Toyota Matrix US-EU Dash — конверсия миль ↔ км · вариант 2 |
| `543b4164ba8336c83de6787c8353cb4df9d58734edb4c5c8baf7f075ab552f51` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota Siena 93C46 — конверсия миль ↔ км |
| `45bf018b99644d54462fe34d062176d8e11bec6652eebb5ae5d1397cf7c3aa50` | US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota camry dash 93c46 — конверсия миль ↔ км |
| `6ca0a875a19df8cf140b5e5f997fc4ad3d6b2f6fbdaf85aef71833c43886d804` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota camry dash 93c46 — конверсия миль ↔ км · вариант 2 |
| `81f924370da3f144c2393d34be201aa9c71a538d0280237e6a93b418d9622005` | USA-Euro converter, US-Euro converter, OTHER | Утилиты/Конвертеры US-EU | Toyota rav4 dash 93c56 — конверсия миль ↔ км |
| `f00fc2546842b3f77ea651383fe5153e5e705fdd03bb44b9cb06c03afb57f66f` | PIN, OTHER | Утилиты/Неуточнённые | Mitsubishi Help — назначение не подтверждено |
| `856c80f73c338fa0f8fe67e068ba380bb481425af1b6c07d7adfc3c35727307e` | Service calc, OTHER | Утилиты/Сервисные функции | Acura MDX 93C76 — сервисные функции и коррекция пробега |
| `01fa7b6a6d63a78d3327f5bbfd1b7e0c20505497b636e2d581e2eace8d1102a6` | Service | Утилиты/Сервисные функции | Acura MDX 93C76 — сервисные функции и коррекция пробега · вариант 2 |
| `c807cc583a315e929000a6f18f14cb53519b5abe0ac516a586e8e1c109c416f8` | Service calc, OTHER | Утилиты/Сервисные функции | Acura TL 93C46 — сервисные функции и коррекция пробега |
| `c6f6eacbffbd28a22b1b868d0456cced1f3ce9ea7cd6e6135452d4c742e3bcd5` | Service | Утилиты/Сервисные функции | Acura TL 93C46 — сервисные функции и коррекция пробега · вариант 2 |
| `35b24e92d0a6d3e2c013ca4754dcb00fdec95a315a1d5b7ee6b14ea4966d4c40` | Service calc, OTHER | Утилиты/Сервисные функции | Honda Accord 93C76 var1 — сервисные функции и коррекция пробега |
| `6461e91804e9970f94bebc23680f7ed07083aac78fed0bc69f6fb6a6df9b2d05` | Service calc, OTHER | Утилиты/Сервисные функции | Honda Accord 93C76 var2 — сервисные функции и коррекция пробега |
| `8158fba73ee8214b11ebc960cfa034aa3e065f7e6b90e40642fa46cef9b09ae6` | Service calc, OTHER | Утилиты/Сервисные функции | Honda Accord 93C76 — сервисные функции и коррекция пробега |
| `cefa20aea49618eb4fd77f6012b54e161a146f18feb77db6cd3dc5fa5b56d23a` | Service | Утилиты/Сервисные функции | Honda Accord 93C76 — сервисные функции и коррекция пробега · вариант 2 |
| `bd86100172f6f72d26cad0b7800b2a1a56432ae50b22443aac40649af64e8f50` | Service calc, OTHER | Утилиты/Сервисные функции | Honda CR-V 93C76 — сервисные функции и коррекция пробега |
| `326fb69b78dc05d3c84e5743a420ebac661012783ba6e10b3f18525e0e1ac788` | Service | Утилиты/Сервисные функции | Honda CR-V 93C76 — сервисные функции и коррекция пробега · вариант 2 |
| `7b76cd1f8ddae600d0f80ee382a21176045052b7f118e065d1d5d4d9104826f9` | Service calc, OTHER | Утилиты/Сервисные функции | Honda Ridgeline 9S12H256 V1 — сервисные функции и коррекция пробега |
| `7c072e61987baee10c0d8afadef26e83395bac0107ae75f599b481c20b20fc42` | Service calc, OTHER | Утилиты/Сервисные функции | Honda Ridgeline 9S12H256 V2 km — сервисные функции и коррекция пробега |
| `608d77f5fdfab430e79fbc5f7be6ba169c52823532c690ffa3f2e60b3241a689` | Service calc, OTHER | Утилиты/Сервисные функции | Honda Ridgeline 9S12H256 V2 ml — сервисные функции и коррекция пробега |
| `93262d22bdb72e4184e45b9c56171e80a33033a9cf3d95598f6a1ba274c6dab6` | Service calc, OTHER | Утилиты/Сервисные функции | Honda Ridgeline 9S12H256 V3 km — сервисные функции и коррекция пробега |
| `237ac5c24de39cdd0f274adc1bc44404fbfcc059f084abafb131973ba538d338` | Service calc, OTHER | Утилиты/Сервисные функции | Honda Ridgeline 9S12H256 V3 ml — сервисные функции и коррекция пробега |
| `c3bfcb27893dc11eec71d5724ddd5fa05b5355f6ca24aa45da05bc9b60993527` | Service calc, OTHER | Утилиты/Сервисные функции | Jaguar XF 24C64 service plus — сервисные функции и коррекция пробега |
| `991e67fc3925c4a5df3e8898a64bd36166eb1e233196e814d1de6fb72e691507` | Service calc, OTHER | Утилиты/Сервисные функции | Jaguar XF 24C64 service plus — сервисные функции и коррекция пробега · вариант 2 |
| `6f78be32245cb09951e7be4a2f8b47ef1b6a9dadf21beeae71ad2e8ad38b0a6d` | Service | Утилиты/Сервисные функции | Jaguar XF 24C64 service plus — сервисные функции и коррекция пробега · вариант 3 |
| `953b31820fbc00376a098930823cafc8214fc199ea8dadd4a52bddd70c2c6aea` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes CGW ASSYSTPLUS — сервисные функции и коррекция пробега |
| `0d72e680037caf104bf3ba11e138be8af3dd29f35dfd22c4039b65486261e47d` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes CGW HC912 ASSYSTPLUS — сервисные функции и коррекция пробега |
| `a52c9390a3ea88612a2d6dc69ba1ef12d60b14518de6f639a870f6511950218c` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz B W169 AB 25320 — сервисные функции и коррекция пробега |
| `a0fc7dc8de28677bbe39c1cf872784492cdb672fb6cf846f47053587bd28a4e6` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz C W203 DASH ASSYST 24c16 — сервисные функции и коррекция пробега |
| `22f811c7a13aa0a7312908f2ee59d20d5e8ad1207f1bda6c388c86d9c1d76a72` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz C W203 DASH SERVICE 24c16 — сервисные функции и коррекция пробега |
| `4124e2057d85ed953c6d8163160b2ffd79e0e654149c4f8b162190dde3fced22` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz C W203 DASH SERVICE 93c86 var1 — сервисные функции и коррекция пробега |
| `05acf602ac4a0b6a095b81363e34b49a0859fa9051b02b53955e04f027297dec` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz C W203 DASH SERVICE 93c86 var2 M — сервисные функции и коррекция пробега |
| `5ae28d3d5752db21314d3a60b46677570bce33fcd7faef3edcc6c469b9e58144` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz C W203 DASH SERVICE 93c86 var2 — сервисные функции и коррекция пробега |
| `a96ab40157ccaa4eb2d5876c3b8d0888de119259792190167ca9d4302fc25cda` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz E W210 DASH SERVICE 93C66 — сервисные функции и коррекция пробега |
| `95dd70b2ee6bc95c7f7a3efda11c2c3eb58adbc14bd740114856d246ef2292b7` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz E W211 AB 68HC912DG128 var2 — сброс Crash (SRS) |
| `31ce967ff091cb0c668a5ee842090f2bae06249eb8d0c7145ee40a4e6c3bf41a` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz E W211 AB 68HC912DG128 — сброс Crash (SRS) |
| `e9e95d276b883512a6d19c2e1b062e9e41e47f1902efca27912a334340cd889b` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz E W211 AB CR16MCS9 — сервисные функции и коррекция пробега |
| `41f4b57432a60aec26cc736de0cae27835acf4b9df9571c97586d014d0663a71` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz E W211 AB MC9S12DG128 — сброс Crash (SRS) |
| `d93a9787f3b5ceebccbbd54afefeecd4ff23db1aa7274932f5abb50884b1191d` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz E W211 CGW 9S12DT256 var2 — сервисные функции и коррекция пробега |
| `3606461dc4646032f072886981e97939b3b9905f237b56dd54405727ce23a379` | Service | Утилиты/Сервисные функции | Mercedes-Benz E W211 CGW 9S12DT256 var2 — сервисные функции и коррекция пробега · вариант 2 |
| `1911391161a6cacc5b769129bd9dee915a58428e3988993106a54d32ae04778a` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz E W211 CGW 9S12DT256 — сервисные функции и коррекция пробега |
| `18c301b5998ac70dac22c9c96e889e352e152a83a108e9384aa9f774372ceb0f` | Service | Утилиты/Сервисные функции | Mercedes-Benz E W211 CGW 9S12DT256 — сервисные функции и коррекция пробега · вариант 2 |
| `29a8ee2a30e217665349f89baeddfc9be7c8654f2ce7d5c1e5cbef97ad486666` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz E W211 CGW HC912DG128 — сервисные функции и коррекция пробега |
| `1d5aba9fb8dd780d2872eea6af42d1a4d85d9fa9fbddb56e4e314aaf5c528e5d` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz ESP tire pressure 95080 — сервисные функции и коррекция пробега |
| `4129b6124aabb5e96bd3bdab59a7735bbec1b07fd8d73e1a7566df22f5fa4922` | Service | Утилиты/Сервисные функции | Mercedes-Benz ESP tire pressure 95080 — сервисные функции и коррекция пробега · вариант 2 |
| `9b37e528e04d0ea83b34f2702c45045d3ea1a851478598d49b9a4ee1f9689b44` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz M W163 DASH SERVICE 93C66 — сервисные функции и коррекция пробега |
| `f6014f22c0b85349ae5dc319a1f20a935f4c2bf9964cefef61c16534c20e267a` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz ML W164 AB 95640 — сервисные функции и коррекция пробега |
| `a032f68abf25dc79c243f8e9617455100a84ac636cb68232ad221cfa263b69e3` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz S W220 DASH SERVICE 24C04 — сервисные функции и коррекция пробега |
| `ecbe231ccba77ffd6b0d22973a922cafc1cff83a297f12e91ab19d7bbe1c6b8a` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz S W220 DASH SERVICE 93c66 — сервисные функции и коррекция пробега |
| `88ba2ecb955ea6d59b0b23da833c13d33b85b91924230cb9f4b1ebbba7c281d3` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz S W221 AB 95640 — сервисные функции и коррекция пробега |
| `b7b02a95b99f2ec0cc525311c29ea6596e73cad11980d7a70e25d49f13737115` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz Sprinter 93C66 km — сервисные функции и коррекция пробега |
| `211c9834d03042f59db1138bfbabde838157ee8d44d77f4335c65ed6070a24f6` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz Sprinter W609 95640 — сервисные функции и коррекция пробега |
| `93fc9390a0d6d3c368d32d29182d2bacee87af62997c66dc8238bca2abdd285a` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz Sprinter W906 95640 — сервисные функции и коррекция пробега |
| `b43185bc9a589a286b3d1e744d199337bdac96691c33ebe76555429a7a2b1a43` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz TPM 3L40K — сервисные функции и коррекция пробега |
| `bfb52f8d65a09de7639447da148ecc4b9abcec5698288e65df8012d5942e8ff4` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz V W639 95640 ASSYST, ASSYST PLUS V1 — сервисные функции и коррекция пробега |
| `0934abc9f784fe4473ef344ea21b338bec0966f783efaba2b4a10386cc8e030e` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz V W639 95640 ASSYST, ASSYST PLUS V2 — сервисные функции и коррекция пробега |
| `85840045b0fb8fb0df99fb82cd419346e71ea7d34946fdebf7409192deda5fb4` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz V W639 95640 ASSYST, ASSYST PLUS V3 — сервисные функции и коррекция пробега |
| `23530534bc9c695ce979e7bd838e99441447aff8fcad3285105dbce366e81e77` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz V W639 MM 95080 — сервисные функции и коррекция пробега |
| `83485aa8d87fe8f0498adb052abfa1511bd805eefc8106366b6d2f568ea0333d` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz W164 Rear SAM V1 — сервисные функции и коррекция пробега |
| `ad1be682031fc02949f2c0dc6ebcd448fde13234cf80fbd37690e5ea3d2cc08a` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz W164 Rear SAM V2 — сервисные функции и коррекция пробега |
| `3e148f42e7ba776189f706df342c4bfa390ed3babd27e71dbd80133e54d97fec` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz W164 Rear SAM V3 — сервисные функции и коррекция пробега |
| `3b16a0893c8debef071fb40df0da4bc129adb0b74f2a6ed438ddb207a570bbb9` | Service calc, OTHER | Утилиты/Сервисные функции | Mercedes-Benz W169 CGW ASSYSTPLUS — сервисные функции и коррекция пробега |
| `3c45e619d29bd5672f7a8849a1aca86bf018ad6b049d8813408bcf72601cee2d` | Service calc, OTHER | Утилиты/Сервисные функции | Renault Kangoo 93C66 — сервисные функции и коррекция пробега |
| `1f0274f6fa432f80c839fa2b9eafa93aa09157f594c1cba9cc7af997a3bc9f41` | Service | Утилиты/Сервисные функции | Renault Kangoo 93C66 — сервисные функции и коррекция пробега · вариант 2 |
| `6710c4eee521f81946e4fd382530929340e5442f994a9e8c8b6f7d2001827592` | Service calc, OTHER | Утилиты/Сервисные функции | Smart TPM 95080 — сервисные функции и коррекция пробега |
| `860cff791152a7fb52538adcc5d4df8d5e79d3daed9f5684db506e9ffc88423d` | Service calc, OTHER | Утилиты/Сервисные функции | Volkswagen Crafter 95640 — сервисные функции и коррекция пробега |
| `9b0ceec5075db7073c7038bb82e041974654fd0fe2c5247be9ffc651e0b20561` | Service calc, OTHER | Утилиты/Сервисные функции | Volkswagen T4 93C86 tacho off — сервисные функции и коррекция пробега |
| `6973c62cf6b1ccbe78fd9de91c409c4d0037541c0d434d90a3c553b22ccf9870` | PIN, OTHER | Утилиты/Синхронизация | Ford Connect Dash — восстановление синхронизации |
| `21f106642dbe670ea1be2929bd405cfb2b27e831ce8f62e4af8b8641c9fe7f4a` | Synchronization, OTHER | Утилиты/Синхронизация | Ford Connect Dash — восстановление синхронизации · вариант 2 |
| `963073ca60a549e393ba7665e7e0f5ab9ff6cfca451d9ae80fe59b50fb6f0853` | OTHER | Утилиты/Синхронизация | Ford Connect ECU — восстановление синхронизации |
| `1d2b057f6281ea82fd1a1322e280aad4bd769ae0ca05bc57e646eaadeffc7faa` | Synchronization | Утилиты/Синхронизация | Ford Connect ECU — восстановление синхронизации · вариант 2 |
| `37971d6d4c8b3964c079facc438e4f5f3f719e022af1585ce63c3c5d3140a2db` | OTHER | Утилиты/Синхронизация | Ford Connect PCM — восстановление синхронизации |
| `4085af84e6876c16cbcc4dbaa56515bdf58d22882120a498ab6e607baf9b1134` | Synchronization | Утилиты/Синхронизация | Ford Connect PCM — восстановление синхронизации · вариант 2 |
| `92f73cff7648a40f1b977fb8e02d1354edaf6218d9b3c46c01aeb911f0a3db3f` | PIN, OTHER | Утилиты/Синхронизация | Ford Focus TDCI Dash — восстановление синхронизации |
| `2e4a084f9ea3f690c634ce4c847a26df1a645f2044b4d803e6d11fcd9d789583` | Synchronization, OTHER | Утилиты/Синхронизация | Ford Focus TDCI Dash — восстановление синхронизации · вариант 2 |
| `8510ce2f020e93460df1fe04da240f1bc18b76122674b20fc4a532b081832437` | OTHER | Утилиты/Синхронизация | Ford Focus TDCI ECU — восстановление синхронизации |
| `395f195bd6473c7c7643f5470efae0d219a6ae6de6117273376ce51fb81229b5` | Synchronization | Утилиты/Синхронизация | Ford Focus TDCI ECU — восстановление синхронизации · вариант 2 |
| `fcb747fcf2fdf6d74b6438f34225589d97a7bae5a7cfb0474446f1f0f91fa41c` | OTHER | Утилиты/Синхронизация | Ford Focus TDCI PCM — восстановление синхронизации |
| `12256d131da3eababf7c22d9e3e5df00d3220c4403dc12c9abfe647b2423462e` | Synchronization | Утилиты/Синхронизация | Ford Focus TDCI PCM — восстановление синхронизации · вариант 2 |
| `5a2c2de1e92d98151aad31a57e93c630f52c58dc8f73f292abdb13ba98dbf175` | PIN, OTHER | Утилиты/Синхронизация | Ford Fusion TDCI Dash — восстановление синхронизации |
| `85adda1d779e9f0c1b7ec32a092857992b505d3bd699ed4fa7cb843046a09d69` | Synchronization, OTHER | Утилиты/Синхронизация | Ford Fusion TDCI Dash — восстановление синхронизации · вариант 2 |
| `221a191115f3b2c2b0d4e8c958cf20aec08afbabac0e23995ef67462926e3d0e` | OTHER | Утилиты/Синхронизация | Ford Fusion TDCI ECU 93c56 — восстановление синхронизации |
| `770dbf617cd071de14d5310e822c6cb6f7df63b178efd7c548b6c232f70914f5` | Synchronization | Утилиты/Синхронизация | Ford Fusion TDCI ECU 93c56 — восстановление синхронизации · вариант 2 |
| `863a1d8c651c678bc80a6cbb08b0229770e06b26c8a90cb868103941eea589c7` | OTHER | Утилиты/Синхронизация | Ford Fusion TDCI ECU 93c86 — восстановление синхронизации |
| `8b70fad2797da190dae545a4f68ecdf52ff3b84cb238ea2ce4fd03396ba0ff27` | Synchronization | Утилиты/Синхронизация | Ford Fusion TDCI ECU 93c86 — восстановление синхронизации · вариант 2 |
| `a78a7e7c3e6d6c2b481541d51a1722b6171de927a03628ea740204d590b7001d` | PIN, OTHER | Утилиты/Синхронизация | Mazda 3 Dash — восстановление синхронизации |
| `18067ef1fb0393e355af0d0e9e0e81106ce18849f91916981bda772807331bb4` | Synchronization, OTHER | Утилиты/Синхронизация | Mazda 3 Dash — восстановление синхронизации · вариант 2 |
| `53a6647d4adb7bb4f0905fd6572d2cecb6a43b3cc8ff4bc2dfb3970945bdab97` | OTHER | Утилиты/Синхронизация | Mazda 3 ECU 93c56 — восстановление синхронизации |
| `8125b98ab9860e898d9f976a3fc699da762b63cca9cd1a652be4cf67bf37c137` | Synchronization | Утилиты/Синхронизация | Mazda 3 ECU 93c56 — восстановление синхронизации · вариант 2 |
| `77cd142598d7f1a0b860c81d52a83c63e321e755fc485e8da37d1b82dbb69b23` | OTHER | Утилиты/Тахографы | Renault Trafic — отключение тахографа |
| `8352b8e260944cbd4e03996663a720c466277019c8e8ea0452dfd7431d8db40d` | Tachograf off | Утилиты/Тахографы | Renault Trafic — отключение тахографа · вариант 2 |
| `ab774ce727f8cec9aba97f88c452229935064334186f2e8fb1b492076568fffb` | OTHER | Утилиты/Тахографы | VW Crafter — отключение тахографа |
| `6722062247e777da2b276675aecd36876f805a3b859c831c1243861d2450627e` | Tachograf off | Утилиты/Тахографы | VW Crafter — отключение тахографа · вариант 2 |
| `7efef1b0524f2fd1f743c9fb7ca390a031579cb94f53a27f7991279cfc2a3b08` | OTHER | Утилиты/Тахографы | VW T5 v1 — отключение тахографа |
| `5965199aaa7076a7b9680251a4f064f8baf7c7c25a0898770764e7169010a374` | Tachograf off | Утилиты/Тахографы | VW T5 v1 — отключение тахографа · вариант 2 |
| `f02a99be3c3a90ba5a5be197ee42ae674615f73ae0d6eb87617c37c32e65ba4c` | OTHER | Утилиты/Тахографы | VW T5 v2 — отключение тахографа |
| `820f39de0ecfd6a9f9196cce1a193f31df93209659d6a4255bea6eebaec98a52` | Tachograf off | Утилиты/Тахографы | VW T5 v2 — отключение тахографа · вариант 2 |

## Проверки

- `node tests/test_t016_organization.js` — карта, исходные пути, поиск, дерево, выбор, экспорт,
  изображения и сохранность 193 не-CAL ресурсов.
- `python3 tools/catalog_inventory.py` — остаток пересчитан с учётом 12 428 утверждённых SHA.
- Сборка и `MANIFEST.json` проверяются отдельными командами; исходные CAL не перемещались.

## Остаток неоднозначного

- В этой группе: `Calculators/PIN/Mitsubishi/Help.cal` (и его копия в `OTHER`) —
  `f00fc2546842b3f77ea651383fe5153e5e705fdd03bb44b9cb06c03afb57f66f`.
- Вне группы остаются 24 инвентарные группы (2 684 пути / 2 502 SHA): P06, P07, P05,
  D-cat-atv, варианты написания марок, E01 и прямые файлы без марки. Их назначение не
  менялось; для `CHINA 24C08`, `ECU 95080`, `EDC16` и `CITROEN PEUGEOUT` марка/модель
  по-прежнему не подтверждена.
