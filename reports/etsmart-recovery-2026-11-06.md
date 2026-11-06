# ETSmartUSB CAL recovery — 2026-11-06

Продолжение [reports/etsmart-import-2026-11-06.md](etsmart-import-2026-11-06.md).
Из 822 CAL, отклонённых строгим текстовым парсером после четвёртой партии,
восстановлен **791** калькулятор. Каждый принят только после проверки SHA-256,
байтовой длины и запуска `OnShow` и `OnApply` на буферах 1 МиБ из нулей и
из `0xFF`. Исходные байты не изменяются: правка выполняется над копией текста
и применяется только к перечисленным SHA-256.

## Итоговые счётчики

| Показатель | Было | Добавлено | Стало |
|---|---:|---:|---:|
| CAL-путей | 25 686 | 791 | **26 477** |
| Уникальных CAL | 17 386 | 791 | **18 177** |
| Записей каталога | 26 275 | 791 | **27 066** |

Перенесено всего 3 120 CAL из ETSmartUSB (9,52 МиБ исходных байт).
В этой партии 40 версий совпадают по пути с базовым каталогом и получили
суффикс «— ETSmart», 751 образуют новый путь. Все 791 SHA-256 уникальны;
дублей с уже опубликованным каталогом нет.

## Правила восстановления

| Правило | Исправлений | Файлов |
|---|---:|---:|
| Недостающие закрывающие `}` добавлены в конец | 36 | 36 |
| Лишние закрывающие `}` пропущены | 340 | 325 |
| Повторное `else` удалено | 1 | 1 |
| Незакрытые `(` закрыты перед `;` или `}` | 1485 | 329 |
| Команда между `}` и `else` перенесена в ветку `else` | 70 | 70 |
| `Var(5+1)` восстановлено как `(Var5+1)` по соседней однотипной строке | 29 | 29 |
| `Var N` записан слитно как `VarN` | 53 | 53 |
| Маркер комментария `/$` исправлен на `//$` | 2 | 2 |
| Сопоставлены сокращённое и полное имена поля (`msg` ↔ `message`) | 26 | 26 |
| `@xHH` заменено на `@0xHH` | 9 | 9 |
| Убраны служебные символы перед заголовком CAL | 1 | 1 |
| Убраны служебные строки перед `Size` | 1 | 1 |
| Вложенная обёртка `Form { Form {` убрана | 21 | 21 |

Правка применяется только после отказа строгого разбора и только для SHA-256
из списка `RECOVERY_SHAS` в `cal-source.js`. Неизвестный или подменённый SHA
по-прежнему получает исходную ошибку; синтетический текст без SHA не
восстанавливается. Шаги `Var N`, `@xHH`, `/$` и вложенный `Form` правятся
детерминированно по грамматике; `Var(5+1)` — по соседней строке того же блока,
где уже стоит `@(Var5+1)`.

## Не приняты (31)

25 файлов остаются синтаксически неоднозначными: обрыв файла, одиночный
`else`, отсутствующий заголовок, битая кавычка в `Picture`, 48-битная
константа и т. п. Ещё 6 вариантов Subaru Tribeka исключены сознательно:
в них используется поле `Miles`, объявление которого закомментировано в
оригинале. Неявная переменная вместо поля молча изменила бы расчёт, поэтому
эти файлы не импортированы — так же, как ранее был заблокирован однотипный
`Tribeka 93c66` в T-006.

| Путь | Ошибка |
|---|---|
| `Calculators/Dashboard/Asia/Subaru/Tribeka 3.6 93c66.cal` | неявные переменные без объявления: miles (поле исключено из формы в оригинале) |
| `Calculators/Dashboard/Asia/Subaru/Tribeka B9 93c66.cal` | неявные переменные без объявления: miles (поле исключено из формы в оригинале) |
| `iProg+/Calculators/US-Euro converter/Subaru/Tribeka dash 93c66 var1.cal` | неявные переменные без объявления: miles (поле исключено из формы в оригинале) |
| `iProg+/Calculators/US-Euro converter/Subaru/Tribeka dash 93c66 var1_ok.cal` | неявные переменные без объявления: miles (поле исключено из формы в оригинале) |
| `iProg+/Calculators/US-Euro converter/Subaru/Tribeka dash 93c66 var2.cal` | неявные переменные без объявления: miles (поле исключено из формы в оригинале) |
| `iProg+/Calculators/US-Euro converter/Subaru/Tribeka FULL 93C66.cal` | неявные переменные без объявления: miles (поле исключено из формы в оригинале) |
| `iProg+/Calculators/Carradio/Carradio/Blaupunkt/FIS AUDI VW coder.cal` | Текстовый CAL: неизвестный символ ? (строка 30) |
| `iProg+/Calculators/Carradio/Immo/Alpine/BUSINESS CD CD53 R50 no immo.cal` | Текстовый CAL: ожидалось =, найдено { (строка 90) |
| `iProg+/Calculators/Carradio/Immo/Alpine/BUSINESS MD MD53 E46 wide  no immo.cal` | Текстовый CAL: ожидалось =, найдено { (строка 90) |
| `Calculators/Dashboard/Asia/Suzuki/Aerio 93C46 Denco.cal` | Текстовый CAL: неизвестный символ [ (строка 1) |
| `Calculators/Dashboard/Asia/Suzuki/GSXR1000 93C56.cal` | Текстовый CAL: неизвестный символ Н (строка 60) |
| `iProg+/Calculators/Dashboard/Asia/Toyota/Toyota Echo LC46A.cal` | Текстовый CAL: ожидалось ), найдено ( (строка 64) |
| `iProg+/Calculators/Dashboard/Asia/Toyota/Toyota Funcargo lc46a.cal` | Текстовый CAL: ожидалось ;, найдено ( (строка 71) |
| `iProg+/Calculators/Dashboard/Asia/Toyota/Toyota Raum lc46a JECO.cal` | Текстовый CAL: ожидалось ;, найдено ( (строка 71) |
| `Calculators/Dashboard/EU_US_RU/Audi/audi_a4_bosch_24C08.cal` | Текстовый CAL: неизвестный символ [ (строка 1) |
| `iProg+/Calculators/Dashboard/EU_US_RU/Buick/Rivira TC97101.cal` | Текстовый CAL: ожидалось id, найдено - (строка 84) |
| `iProg+/Calculators/Dashboard/EU_US_RU/jaguar/Service/Jaguar XF 24C64(service plus).cal` | Текстовый CAL: ожидалось =, найдено { (строка 147) |
| `iProg+/Calculators/Dashboard/EU_US_RU/Jeep/Wrangler Dash 93C56.cal` | Текстовый CAL: неизвестный символ [ (строка 1) |
| `iProg+/Calculators/Dashboard/EU_US_RU/Land Rover/LR3 9S12DG256(body).cal` | Текстовый CAL: else без соответствующего if (строка 46) |
| `Calculators/Dashboard/EU_US_RU/Lincoln/Town car HC11E20.cal` | Текстовый CAL: неизвестное свойство lb3.color |
| `iProg+/Calculators/Dashboard/EU_US_RU/Mercedes/Service/W169 CGW(ASSYSTPLUS).cal` | Текстовый CAL: else без соответствующего if (строка 78) |
| `iProg+/Calculators/Dashboard/EU_US_RU/Mini/Cooper BCU 93C76.cal` | Текстовый CAL: else без соответствующего if (строка 41) |
| `iProg+/Calculators/Dashboard/EU_US_RU/Mini/Cooper BCU HC912DG128.cal` | Текстовый CAL: else без соответствующего if (строка 41) |
| `iProg+/Calculators/Dashboard/Development/Antara 93c86 Vasilich.cal` | Текстовый CAL: else без соответствующего if (строка 89) |
| `iProg+/Calculators/Dashboard/EU_US_RU/Renault/Kangoo 68HC908.cal` | Текстовый CAL: else без соответствующего if (строка 53) |
| `iProg+/Calculators/Dashboard/EU_US_RU/Volkswagen/Gol 24C08.cal` | Текстовый CAL: ожидалось значение (строка 32) |
| `iProg+/Calculators/Dashboard/EU_US_RU/Volkswagen/Touran 24C32.cal` | Текстовый CAL: else без соответствующего if (строка 40) |
| `iProg+/Calculators/Airbag/Honda/SEA-G820-M1.cal` | Текстовый CAL: ожидалось {, найдено . (строка 67) |
| `iProg+/Calculators/immo/Car/Honda/Honda_Immo_0D28J_PCF7931.cal` | Текстовый CAL: неизвестное поле on (строка 65) |
| `iProg+/Calculators/immo/Car/Nissan/Terrano_HC05E6_7931.cal` | Текстовый CAL: ожидалось =, найдено { (строка 49) |
| `iProg+/Calculators/immo/Car/Opel/hitag2.cal` | Текстовый CAL: число вне диапазона 32 бит (строка 62) |

## Проверка

- `tests/test_etsmart_import.js`: 6 проверок, включая запуск `OnShow` и
  `OnApply` для всех 791 восстановленного CAL на нулевом и `0xFF`-буфере,
  а также запрет восстановления по чужому SHA.
- `tests/test_source.js` (13), `test_text_variants.js` (6), `test_t006_bcd.js`,
  `test_t006_radio.js`, `test_t006_stage2.js`, `test_t006_targets.js` —
  без изменений проходят: профильные исправления и защитные блокировки
  применяются раньше общего восстановления.
- `test_catalog.js` проверяет все 23 946 базовых записей, а
  `test_t016_organization.js` — карту разделов базовой поставки.

Разбор и запуск формы не доказывают правильность расчёта на реальном дампе.
Аппаратная проверка не выполнялась. Пошаговый список — в
`reports/etsmart-recovery-2026-11-06.json`.
