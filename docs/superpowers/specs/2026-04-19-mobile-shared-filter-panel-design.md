# Mobile Shared Filter Panel Design

## Goal

Убрать отдельную плавающую кнопку `mobile-filter-toggle` и перевести мобильную панель фильтров на единый механизм самой `shared-filter-panel`.

В мобильном режиме панель должна иметь два состояния:

- `collapsed`: горизонтальная лента секций фильтров с иконками групп
- `expanded`: полноэкранная мобильная overlay-панель с тем же содержимым и оформлением `shared-filter-panel`

## Approved Approach

Используется вариант `1`:

- переиспользовать существующую мобильную overlay-логику
- отвязать её от внешнего `mobile-filter-toggle`
- привязать открытие/закрытие overlay к встроенному `shared-filter-panel-toggle` и состоянию самой панели

Это минимальный и безопасный путь, потому что он сохраняет текущую мобильную раскладку и не требует пересборки всей архитектуры фильтров.

## Behavior

### Mobile collapsed state

При ширине viewport `<= 960px` свёрнутая `shared-filter-panel`:

- отображается как горизонтальная лента
- содержит `shared-filter-panel-rail-toggle`
- содержит `shared-filter-panel-rail-button` для секций
- не использует внешний `mobile-filter-toggle`

### Mobile expanded state

При раскрытии через встроенный `shared-filter-panel-toggle`:

- панель открывается как mobile overlay
- используется текущее mobile overlay-поведение панели фильтров
- содержимое и оформление остаются частью `shared-filter-panel`
- `dashboard-topbar-meta` остаётся доступным в overlay-режиме согласно последней правке

### Toggle rules

В мобильном режиме:

- `shared-filter-panel-toggle` открывает expanded overlay из collapsed состояния
- `shared-filter-panel-toggle` закрывает expanded overlay обратно в collapsed rail
- секционные кнопки в rail могут раскрывать нужную секцию панели

На desktop текущее поведение панели не меняется.

## Scope of changes

### JavaScript

Обновить:

- `reports/report.ui.js`
- `reports/static/report.ui.js`

Изменения:

- удалить функции и привязки, связанные с `mobile-filter-toggle` и `mobile-filter-backdrop`
- убрать создание внешней мобильной кнопки и backdrop
- перевести mobile open/close на состояние самой `shared-filter-panel`
- при необходимости оставить хелпер определения mobile viewport

### CSS

Обновить:

- `reports/styles.css`
- `reports/static/styles.css`

Изменения:

- удалить стили `#mobile-filter-toggle` и `#mobile-filter-backdrop`
- удалить CSS, который зависит от старой внешней кнопки как точки входа
- сохранить mobile overlay-оформление, но переключать его через состояние самой панели
- сохранить horizontal rail в mobile collapsed state

### Tests

Обновить регрессии:

- `tests/ui/mobile-filter-panel-regression.test.js`
- при необходимости `tests/ui/shared-filter-panel-regression.test.js`

Нужно зафиксировать:

- внешний `mobile-filter-toggle` больше не используется
- mobile collapsed state остаётся горизонтальным
- встроенный toggle панели открывает mobile overlay
- оформление expanded state остаётся оформлением `shared-filter-panel`

## Data flow

Источник истины остаётся прежним:

- `uiState.shared_filter_panel_state`
- `data-panel-open`
- `.is-collapsed`

Новый отдельный источник состояния для mobile toggle не вводится.

## Error handling and compatibility

- Desktop-поведение не должно регрессировать
- Если viewport выходит из mobile режима, панель должна возвращаться к desktop-поведению без зависшего overlay-состояния
- Не должно остаться мёртвых DOM-элементов или CSS-веток, завязанных на удалённую кнопку

## Verification

Минимальная проверка после реализации:

- UI-тесты shared/mobile filter panel
- ручная проверка mobile viewport в браузере
- подтверждение, что overlay открывается встроенным toggle панели
- подтверждение, что collapsed rail горизонтальный
