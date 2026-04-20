# Mobile Filter Panel Fullscreen Design

## Goal

Исправить мобильную панель фильтров так, чтобы:

- в collapsed-состоянии она оставалась горизонтальной лентой с иконками;
- в expanded-состоянии она полностью перекрывала экран;
- expanded-состояние использовало базовый стиль `shared-filter-panel`, а не отдельную mobile-геометрию с частичным overlay.

## Approved approach

Используется минимальный целевой фикс:

- сохранить текущую логику `shared-filter-panel` и её состояние;
- не менять механику collapsed rail;
- убрать mobile `top-offset` и зависимую от него высоту expanded-панели;
- оставить только fullscreen mobile overrides для позиционирования и скролла;
- не вводить новый источник состояния и не возвращать legacy mobile toggle.

## Changes

### CSS

Обновить:

- `reports/styles.css`
- `reports/static/styles.css`

Изменения:

- убрать использование `--mobile-shared-filter-top-offset` для mobile expanded panel;
- перевести mobile expanded panel в `position: fixed` с `top: 0`, `right: 0`, `bottom: 0`, `left: 0`;
- задать fullscreen размеры через `100dvh`;
- сохранить базовый visual style `#global-shared-filter-panel`, не вводя отдельную mobile expanded theme;
- сохранить горизонтальный rail для mobile collapsed state.

### Tests

Обновить:

- `tests/ui/mobile-filter-panel-regression.test.js`

Зафиксировать:

- mobile collapsed panel остаётся горизонтальной;
- mobile expanded panel открывается от верхней границы viewport;
- mobile expanded panel занимает весь экран по высоте;
- expanded-состояние по-прежнему управляется `shared-filter-panel` selectors.

## Risks

- Возможна регрессия мобильного отступа относительно topbar, если какой-то контент не рассчитан на fullscreen overlay.
- Возможна разница между `100vh` и `100dvh`, поэтому нужно проверять именно текущую `100dvh` ветку.

## Verification

- `node tests/ui/mobile-filter-panel-regression.test.js`
- ручная проверка в мобильном viewport через браузер:
  - collapsed rail горизонтальный;
  - expanded panel полноэкранная;
  - контент страницы не виден над opened panel.
