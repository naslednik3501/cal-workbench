# Инвентаризация оставшихся CAL — 2026-11-04

Продолжение T-001/T-016. Документ фиксирует только **инвентаризацию**: дерево сайта,
пути, байты, SHA, экспорт CAL, алгоритмы и изображения не изменяются.
Машиночитаемый реестр: `reports/catalog-inventory-unclassified-2026-11-04.json`.

## Метод

- Источники: `catalog.js`, `scope-registry.json`, `catalog-organization.js`, `catalog-organization-airbag.js`, `catalog-organization-{dashboard,immo,radio,utilities}.js`.
- Все 15 057 уникальных CAL SHA распределены картой отображения; остаток — 0.
  Исходные разделы сохранены как OTHER/CRC, OTHER/PIN, OTHER/Service calc и т. п.
- CAL читались только для неоднозначных записей; полезная нагрузка — hex-код без
  читаемого заголовка, поэтому основание — путь, имя и совпадения SHA.
- Большие группы в Markdown не дублируются: полные пути и статистика по папкам — в JSON.

## Каталог

- Записей: 23,946; CAL-путей: 23,357; уникальных CAL SHA: 15,057.
- Активных CAL-путей: 0; активных SHA: 0; прямо в разделах без марки/модели: 0.
- Исключено реестром области: 0 CAL; адресных правил ресурсов: 9; утверждённой картой: 15057.
- Групп: 0; покрыто 0 путей / 0 SHA; вне групп — 0 обычных путей.

## Словарь разделов

| Раздел | Назначение | Исходные разделы |
|---|---|---|
| Airbag | SRS: сброс Crash, чтение и ремонт блоков подушек. | Airbag, SRS |
| Dashboard | Щитки, панели приборов, одометры и CRC панели. | Dashboard, Car, I, I_ok |
| Peugeot | BSI, BCM, CJB и другие кузовные блоки. | Peugeot |
| Immo | IMMO, UCH/BCM/EZS, транспондеры и конвертеры ключей. | Immo, Immo off |
| CarRadio | Автомагнитолы, навигация и их коды. | CarRadio |
| ECU | ЭБУ двигателя и связанные с ним блоки. | ECU |
| MOTO - TRUCK - ATV | ATV, мотоциклы, снегоходы, гидроциклы. | ATV, MOTO, Bikes |
| MOTO - TRUCK - ATV (Forklift truck) | Грузовики, автобусы, погрузчики, сельхозтехника. | MOTO - TRUCK - ATV, Forklift truck |
| CHINA | Китайские марки, выделенные из CHINA и Asia/China. | CHINA, Asia/China |
| CRYPTO / CRYPTO+ | Декрипторы и крипто-калькуляторы BSI/ECU; функциональный раздел до разнесения по устройствам. | CRYPTO, CRYPTO+ |
| OTHER | PIN, сервисные функции, конвертеры, синхронизация, тахографы, CRC и справочники. | PIN, Service calc, Service, Synchronization, Tachograf off, CRC, US-Euro converter, USA-Euro converter, OTHER |

Марка всегда уточняет раздел устройства: `Dashboard/Renault`,
`Airbag/Hyundai`, `OTHER/Tachograf off`. Отдельный раздел создаётся
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

## Параллельные разделы

## Очередные группы

Порядок: сначала уверенность, затем размер.

| ID | Группа | Файлов | SHA | Уверенность |
|---|---|---:|---:|---|

## Ограничения

- Это реестр путей, а не перенос файлов: ни один путь, SHA или экспорт не изменён.
- Совпадение имён при разных SHA — разные сборки; байтовое слияние для них запрещено.
- `Asia` и `EU_US_RU` требуют сверки версий, а не механического объединения.
- Содержимое CAL не даёт читаемых названий; уточнение марок для `CHINA 24C08`,
  `ECU 95080` и `EDC16` остаётся открытым. `Any model by dump` уже отображён
  в разделе магнитол, `Help.cal` — в `Утилиты/Неуточнённые`.
