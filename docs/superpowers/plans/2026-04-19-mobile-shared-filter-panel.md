# Mobile Shared Filter Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать внешний `mobile-filter-toggle` и сделать мобильную `shared-filter-panel` единственной точкой входа: collapsed как горизонтальный rail, expanded как текущий mobile overlay.

**Architecture:** Сохраняем существующую `shared-filter-panel` и её состояние `uiState.shared_filter_panel_state`. Удаляем отдельную мобильную кнопку и backdrop, а mobile overlay-поведение переключаем встроенным `shared-filter-panel-toggle` и CSS-состоянием самой панели.

**Tech Stack:** Vanilla JavaScript, CSS, node-based regression tests

---

### Task 1: Update mobile regression coverage

**Files:**
- Modify: `tests/ui/mobile-filter-panel-regression.test.js`
- Test: `tests/ui/mobile-filter-panel-regression.test.js`

- [ ] **Step 1: Write the failing test**

```js
runTest('mobile shared filter panel no longer depends on floating mobile toggle', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(
      source,
      /#mobile-filter-toggle|#mobile-filter-backdrop|mobile-filter-toggle|mobile-filter-backdrop/,
      `${path.basename(filePath)} should not reference legacy mobile filter toggle styles`
    );
  });
});

runTest('mobile expanded shared filter panel is driven by panel state selectors', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="1"\][\s\S]*body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed[\s\S]*/,
      `${path.basename(filePath)} should contain mobile panel-state driven selectors`
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/ui/mobile-filter-panel-regression.test.js`
Expected: FAIL because styles and scripts still reference `mobile-filter-toggle` / `mobile-filter-backdrop`.

- [ ] **Step 3: Keep existing regression assertions for horizontal collapsed rail**

```js
runTest('mobile collapsed shared filter rail stays horizontal', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="0"\]\s+\.shared-filter-panel-rail,\s*[\r\n]+\s*body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed\s+\.shared-filter-panel-rail\s*\{[\s\S]*flex-direction:\s*row\s*!important;[\s\S]*overflow-x:\s*auto\s*!important;/,
      `${path.basename(filePath)} should keep collapsed shared filter rail horizontal on mobile`
    );
  });
});
```

- [ ] **Step 4: Run test again to make sure the new failure is the intended one**

Run: `node tests/ui/mobile-filter-panel-regression.test.js`
Expected: FAIL on legacy mobile toggle references or missing panel-state selector coverage, not on syntax errors.

- [ ] **Step 5: Commit**

```bash
git add tests/ui/mobile-filter-panel-regression.test.js
git commit -m "test: cover mobile shared filter panel state"
```

### Task 2: Remove legacy mobile toggle logic from scripts

**Files:**
- Modify: `reports/report.ui.js:6814-6877`
- Modify: `reports/static/report.ui.js:6814-6877`
- Test: `tests/ui/shared-filter-panel-regression.test.js`

- [ ] **Step 1: Write the failing test**

```js
runTest('shared filter mobile helpers no longer create floating mobile toggle controls', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(source, /function setMobileFilterPanelOpen\(/, `${path.basename(filePath)} should not keep legacy mobile open helper`);
    assert.doesNotMatch(source, /function ensureMobileFilterPanelControls\(/, `${path.basename(filePath)} should not keep legacy mobile control builder`);
    assert.doesNotMatch(source, /mobile-filter-toggle|mobile-filter-backdrop/, `${path.basename(filePath)} should not reference floating mobile controls`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/ui/shared-filter-panel-regression.test.js`
Expected: FAIL after adding the assertion because the old helper functions still exist.

- [ ] **Step 3: Write minimal implementation**

```js
function isMobileFilterViewport() {
    return !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 960px)').matches);
}
```

Удалить:

- `setMobileFilterPanelOpen(...)`
- `ensureMobileFilterPanelControls(...)`
- вызов `ensureMobileFilterPanelControls();` из `syncSharedFilterPanel(...)`

И обновить `setSharedFilterPanelOpen(open)` так, чтобы в mobile режиме он только переключал `uiState.shared_filter_panel_state.open` / `collapsed`, а не зависел от внешней кнопки.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/ui/shared-filter-panel-regression.test.js`
Expected: PASS for the new helper assertions and existing shared panel regressions.

- [ ] **Step 5: Commit**

```bash
git add reports/report.ui.js reports/static/report.ui.js tests/ui/shared-filter-panel-regression.test.js
git commit -m "refactor: remove floating mobile filter toggle logic"
```

### Task 3: Move mobile overlay behavior onto shared filter panel state

**Files:**
- Modify: `reports/report.filters.js`
- Modify: `reports/static/report.filters.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Test: `tests/ui/mobile-filter-panel-regression.test.js`

- [ ] **Step 1: Write the failing test**

```js
runTest('mobile expanded shared filter panel uses panel-open selectors instead of body mobile toggle state', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="1"\]\s*\{/,
      `${path.basename(filePath)} should style mobile expanded state from shared panel open state`
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/ui/mobile-filter-panel-regression.test.js`
Expected: FAIL because mobile expanded state still depends on `body.mobile-filters-open`.

- [ ] **Step 3: Write minimal implementation**

```css
@media (max-width: 960px) {
    body.report-dashboard #global-shared-filter-panel[data-panel-open="1"] {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
    }

    body.report-dashboard #global-shared-filter-panel[data-panel-open="1"] .shared-filter-panel-body {
        display: flex !important;
    }
}
```

Обновить mobile CSS так, чтобы:

- collapsed horizontal rail управлялся через `#global-shared-filter-panel[data-panel-open="0"]` и `.is-collapsed`
- expanded overlay управлялся через `#global-shared-filter-panel[data-panel-open="1"]`
- селекторы `body.mobile-filters-open ...` были удалены
- стили `#mobile-filter-toggle` и `#mobile-filter-backdrop` были удалены

В `report.filters.js` / `static/report.filters.js` оставить mobile glyph для встроенного panel toggle, но не опираться на внешний floating toggle.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/ui/mobile-filter-panel-regression.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add reports/report.filters.js reports/static/report.filters.js reports/styles.css reports/static/styles.css tests/ui/mobile-filter-panel-regression.test.js
git commit -m "feat: drive mobile filter panel from shared panel state"
```

### Task 4: Verify integrated behavior

**Files:**
- Test: `tests/ui/mobile-filter-panel-regression.test.js`
- Test: `tests/ui/shared-filter-panel-regression.test.js`

- [ ] **Step 1: Run mobile regression suite**

Run: `node tests/ui/mobile-filter-panel-regression.test.js`
Expected:

```text
ok - mobile filter overlay keeps dashboard topbar meta visible
ok - mobile collapsed shared filter rail stays horizontal
ok - mobile collapsed shared filter rail does not depend on overlay open state
ok - mobile shared filter panel no longer depends on floating mobile toggle
ok - mobile expanded shared filter panel uses panel-open selectors instead of body mobile toggle state
```

- [ ] **Step 2: Run shared panel regression suite**

Run: `node tests/ui/shared-filter-panel-regression.test.js`
Expected:

```text
ok - shared filter panel state defaults to roles section only
ok - shared filter accordion keeps only the newly opened section visible
ok - opening a filter menu keeps shared filter scroll stable and uses menu max-height instead
ok - skills section opening does not auto-scroll the shared filter panel
ok - skills dropdown opening does not auto-scroll panel or window
```

- [ ] **Step 3: Manual mobile verification checklist**

```text
1. Open report in mobile viewport <= 960px.
2. Confirm there is no floating mobile-filter-toggle button.
3. Confirm collapsed shared filter panel shows horizontal section icons.
4. Tap shared-filter-panel-toggle and confirm panel opens in mobile overlay.
5. Confirm expanded content keeps shared-filter-panel styling.
6. Tap toggle again and confirm panel returns to horizontal collapsed rail.
```

- [ ] **Step 4: Commit**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/report.filters.js reports/static/report.filters.js reports/styles.css reports/static/styles.css tests/ui/mobile-filter-panel-regression.test.js tests/ui/shared-filter-panel-regression.test.js
git commit -m "feat: unify mobile shared filter panel behavior"
```
