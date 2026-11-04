# Разработка iProCal

Задание задаётся текущим промптом владельца. Постоянной очереди нет.
Правила работы: [AGENTS.md](AGENTS.md). Границы: [PROJECT_SCOPE.md](PROJECT_SCOPE.md).
Ограничения: [COMPATIBILITY.md](COMPATIBILITY.md).

## Основные компоненты
- engine.js и cal-source.js: исполнение двоичных и текстовых CAL.
- app.js: формы, BIN, рабочая копия, сравнение, скачивание.
- catalog.js, catalog-data/ и catalog-parts.json: оригинальные записи и байты.
- catalog-organization*.js: карта отображения; исходные пути не меняются.
- catalog-store.js: пользовательский импорт и локальное хранение.
- scope-registry.json и catalog-scope.js: адресные правила аппаратных исключений.
- image-resources.js и image-resource-data.js: проверенные привязки изображений.

## Проверки и сборка
Требуются Node.js для JS-тестов и Python для сборки. Запускайте профильные
тесты изменённого поведения. Например:

    node tests/test_catalog.js
    node tests/test_t016_organization.js
    node tools/test-image-resources.js

После проверки изменений осознанно обновите манифест штатной упаковкой:

    python3 tools/package_release.py /tmp/iprocal-release.zip
    python3 build_static.py

package_release.py запускает свой набор проверок и обновляет MANIFEST.json;
он не заменяет все предметные и браузерные тесты. build_static.py проверяет
контрольные суммы и формирует dist/. Проверки с личными BIN и браузерные
требования перечислены в tests/README.md.

Датированные технические отчёты — справочные доказательства. Старые планы,
ограничения прежнего окружения и назначения из них не переносите в новую работу.
