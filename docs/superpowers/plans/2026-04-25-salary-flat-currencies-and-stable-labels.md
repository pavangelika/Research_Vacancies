# Salary Flat Currencies And Stable Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the dashboard salary card so `Не указан` is removed, `RUR / USD / EUR` render in one flat shared area, and point value labels sit beside points with deterministic placement.

**Architecture:** Keep the existing `salary-module` and current dashboard data flow, but tighten the salary model before rendering and simplify the renderer layout. The runtime and static salary renderers continue to mirror each other, while CSS removes dead currency-panel chrome and adds stable side-label placement for point values.

**Tech Stack:** Vanilla JS renderers in `reports/*.js`, mirrored static bundle files, shared CSS, Node-based UI regression tests, browser verification on local `report.html`.

---

## File Map

- `reports/report.data.js`
  Runtime salary overview model builder. Filters invalid experiences and currencies before legend and row generation.
- `reports/static/report.data.js`
  Static mirror of the runtime salary overview model builder.
- `reports/report.ui.js`
  Runtime salary card renderer. Flattens currency sections and renders point labels beside points.
- `reports/static/report.ui.js`
  Static mirror of the runtime salary card renderer.
- `reports/styles.css`
  Salary card layout and point-label placement styles.
- `reports/static/styles.css`
  Static mirror of salary card styles.
- `tests/ui/salary-overview-chart.test.js`
  Regression coverage for legend filtering, flat currency structure, and deterministic point-label markup.

### Task 1: Filter Salary Model Inputs

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `reports/report.data.js`
- Modify: `reports/static/report.data.js`

- [ ] **Step 1: Write the failing regression test for removing `Не указан` from the salary model**

```js
runTest('buildSalaryOverviewChartModel excludes Не указан from legend and point rows', () => {
  const script = [
    extractFunctionSourceFrom(DATA_SOURCE, 'buildSalaryOverviewChartModel')
  ].join('\n\n') + '\nmodule.exports = { buildSalaryOverviewChartModel };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    isFinite,
    normalizeExperience(value) {
      return String(value || '').trim() || 'Не указан';
    },
    isSalarySummaryExperience() {
      return false;
    },
    getExperienceOrder() {
      return { 'Нет опыта': 0, 'От 1 года до 3 лет': 1, 'От 3 до 6 лет': 2, 'Более 6 лет': 3, 'Не указан': 4 };
    },
    formatCompactThousandsValue(value) {
      return String(value);
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'salary-overview-model-no-unknown.vm.js' });
  const { buildSalaryOverviewChartModel } = sandbox.module.exports;

  const model = buildSalaryOverviewChartModel({
    experiences: [
      {
        experience: 'Не указан',
        entries: [
          { status: 'Открытая', currency: 'RUR', vacancies_with_salary: 1, avg_salary: 100000, median_salary: 100000, mode_salary: 100000, min_salary: 100000, max_salary: 100000 }
        ]
      },
      {
        experience: 'Нет опыта',
        entries: [
          { status: 'Открытая', currency: 'RUR', vacancies_with_salary: 1, avg_salary: 50000, median_salary: 50000, mode_salary: 50000, min_salary: 50000, max_salary: 50000 }
        ]
      }
    ]
  });

  assert.deepStrictEqual(model.legend.map((item) => item.label), ['Нет опыта']);
  assert.deepStrictEqual(model.currencies.map((row) => row.currency), ['RUR']);
  assert.doesNotMatch(JSON.stringify(model), /Не указан/);
});
```

- [ ] **Step 2: Run the salary overview test to verify it fails**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: FAIL because `Не указан` is currently still present in the legend/model path.

- [ ] **Step 3: Update the runtime salary model builder to exclude `Не указан` and unsupported currencies before legend generation**

```js
function isSupportedSalaryCurrency(currency) {
    return ['RUR', 'USD', 'EUR'].indexOf(String(currency || '').trim()) >= 0;
}
function isSupportedSalaryExperience(experience) {
    return String(experience || '').trim() !== 'Не указан';
}
```

Apply these rules in `buildSalaryOverviewChartModel(payload)` so:

- `getExperienceLegend()` filters out `Не указан`
- experience entries belonging to `Не указан` are ignored before row aggregation
- currencies outside `RUR`, `USD`, `EUR` are ignored before row aggregation

- [ ] **Step 4: Mirror the same filtering logic in the static salary model builder**

```js
function isSupportedSalaryCurrency(currency) {
    return ['RUR', 'USD', 'EUR'].indexOf(String(currency || '').trim()) >= 0;
}
function isSupportedSalaryExperience(experience) {
    return String(experience || '').trim() !== 'Не указан';
}
```

- [ ] **Step 5: Re-run the salary overview test to verify it passes**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: PASS

- [ ] **Step 6: Commit the salary model filtering change**

```bash
git add tests/ui/salary-overview-chart.test.js reports/report.data.js reports/static/report.data.js
git commit -m "feat: filter unsupported salary legend data"
```

### Task 2: Flatten Currency Layout In The Salary Renderer

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression test for flat currency sections without panel wrappers**

```js
runTest('buildSalaryOverviewChartHtml renders flat currency sections without panel containers', () => {
  const script = [
    extractFunctionSourceFrom(UI_SOURCE, 'buildSalaryOverviewChartHtml')
  ].join('\n\n') + '\nmodule.exports = { buildSalaryOverviewChartHtml };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    isFinite,
    escapeHtml(value) {
      return String(value);
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'salary-overview-flat-currencies.vm.js' });
  const { buildSalaryOverviewChartHtml } = sandbox.module.exports;

  const html = buildSalaryOverviewChartHtml({
    legend: [{ label: 'Нет опыта', color: '#00C3D3' }],
    currencies: [
      { currency: 'RUR', expanded: true, statuses: [] },
      { currency: 'USD', expanded: false, statuses: [] },
      { currency: 'EUR', expanded: false, statuses: [] }
    ]
  });

  assert.match(html, /salary-module-currency-section/);
  assert.doesNotMatch(html, /salary-module-currency-panel/);
  assert.doesNotMatch(html, /salary-module-currency-summary-badge/);
});
```

- [ ] **Step 2: Run the salary overview test to verify it fails**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: FAIL because the current renderer still emits `salary-module-currency-panel`.

- [ ] **Step 3: Replace runtime currency panel wrappers with flat currency sections**

```js
return '<section class="salary-module-currency-section" data-currency="' + escapeHtml(currency) + '">' +
    '<div class="salary-module-currency-heading">' + escapeHtml(currency) + '</div>' +
    '<div class="salary-module-status-list">' +
        rowsHtml +
    '</div>' +
'</section>';
```

Keep:

- current parent/child status logic
- current legend block
- current top-level `salary-module` wrapper

Remove:

- `salary-module-currency-panel`
- `salary-module-currency-summary`
- `salary-module-currency-summary-badge`
- any hidden/expanded container logic that exists only for panel wrappers

- [ ] **Step 4: Mirror the same flat currency structure in the static renderer**

```js
return '<section class="salary-module-currency-section" data-currency="' + escapeHtml(currency) + '">' +
    '<div class="salary-module-currency-heading">' + escapeHtml(currency) + '</div>' +
    '<div class="salary-module-status-list">' +
        rowsHtml +
    '</div>' +
'</section>';
```

- [ ] **Step 5: Replace panel styles with flat section spacing styles in both stylesheets**

```css
.salary-module-body {
    display: grid;
    gap: 16px;
}

.salary-module-currency-section {
    display: grid;
    gap: 10px;
}

.salary-module-currency-heading {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-secondary);
}
```

Delete any now-dead `salary-module-currency-panel` chrome rules after the replacement is complete.

- [ ] **Step 6: Re-run the salary overview test to verify it passes**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: PASS

- [ ] **Step 7: Commit the flat currency layout change**

```bash
git add tests/ui/salary-overview-chart.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: flatten salary currency sections"
```

### Task 3: Add Stable Side Labels For Salary Points

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression test for deterministic side-label markup**

```js
runTest('buildSalaryOverviewChartHtml renders deterministic side labels for points', () => {
  const script = [
    extractFunctionSourceFrom(UI_SOURCE, 'buildSalaryOverviewChartHtml')
  ].join('\n\n') + '\nmodule.exports = { buildSalaryOverviewChartHtml };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    isFinite,
    escapeHtml(value) {
      return String(value);
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'salary-overview-side-labels.vm.js' });
  const { buildSalaryOverviewChartHtml } = sandbox.module.exports;

  const html = buildSalaryOverviewChartHtml({
    legend: [{ label: 'Нет опыта', color: '#00C3D3' }],
    currencies: [
      {
        currency: 'RUR',
        expanded: true,
        statuses: [
          {
            statusKey: 'open',
            statusLabel: 'Активные',
            points: [
              { label: 'Нет опыта', color: '#00C3D3', valueLabel: '50K', leftPct: 10, pointRow: 0 },
              { label: 'От 1 года до 3 лет', color: '#007AD8', valueLabel: '96K', leftPct: 45, pointRow: 0 },
              { label: 'От 3 до 6 лет', color: '#8b5cf6', valueLabel: '216K', leftPct: 80, pointRow: 0 }
            ]
          }
        ]
      }
    ]
  });

  assert.match(html, /salary-module-track-point-label/);
  assert.match(html, /salary-module-track-point-label is-side-right/);
  assert.match(html, /salary-module-track-point-label is-side-left/);
  assert.match(html, /data-label-slot=\"0\"/);
  assert.match(html, /data-label-slot=\"1\"/);
});
```

- [ ] **Step 2: Run the salary overview test to verify it fails**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: FAIL because labels currently render above points as floating values.

- [ ] **Step 3: Add deterministic label-slot assignment in the runtime salary renderer**

```js
function getPointLabelPlacement(points, index) {
    var list = Array.isArray(points) ? points : [];
    if (list.length <= 1) {
        return { sideClass: 'is-side-right', slot: 0 };
    }
    var sideClass = index % 2 === 0 ? 'is-side-right' : 'is-side-left';
    var slot = Math.floor(index / 2);
    return { sideClass: sideClass, slot: slot };
}
```

Use it inside `buildTrackHtml(statusRow)` so each point renders:

```js
var placement = getPointLabelPlacement(points, index);
return '<div class="salary-module-track-point" ...>' +
    '<span class="salary-module-track-point-dot" ...></span>' +
    '<span class="salary-module-track-point-label ' + placement.sideClass + '" data-label-slot="' + escapeHtml(String(placement.slot)) + '">' +
        '<span class="salary-module-track-point-value" style="' + valueStyle + '">' + escapeHtml(point && point.valueLabel || '—') + '</span>' +
    '</span>' +
'</div>';
```

- [ ] **Step 4: Mirror the same deterministic label placement logic in the static renderer**

```js
function getPointLabelPlacement(points, index) {
    var list = Array.isArray(points) ? points : [];
    if (list.length <= 1) {
        return { sideClass: 'is-side-right', slot: 0 };
    }
    var sideClass = index % 2 === 0 ? 'is-side-right' : 'is-side-left';
    var slot = Math.floor(index / 2);
    return { sideClass: sideClass, slot: slot };
}
```

- [ ] **Step 5: Add side-label styles in both stylesheets**

```css
.salary-module-track-point-label {
    position: absolute;
    top: calc(4px + (18px * var(--salary-label-slot, 0)));
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
}

.salary-module-track-point-label.is-side-right {
    left: calc(50% + 12px);
}

.salary-module-track-point-label.is-side-left {
    right: calc(50% + 12px);
}

.salary-module-track-point-value {
    position: static;
    transform: none;
    font-size: 0.72rem;
    line-height: 1.1;
}
```

Set `--salary-label-slot` inline on the point or label from the deterministic placement result.

- [ ] **Step 6: Re-run the salary overview test to verify it passes**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: PASS

- [ ] **Step 7: Commit the stable side-label placement change**

```bash
git add tests/ui/salary-overview-chart.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: stabilize salary point labels"
```

### Task 4: Full Verification

**Files:**
- Modify: none
- Verify: `http://127.0.0.1:9000/report.html`

- [ ] **Step 1: Run the focused salary verification suite**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: PASS

- [ ] **Step 2: Run adjacent dashboard regressions**

Run: `node tests\ui\dashboard-layout-regression.test.js`
Expected: PASS

Run: `node tests\ui\dashboard-compensation-availability.test.js`
Expected: PASS

- [ ] **Step 3: Rebuild the dashboard page**

Run: `docker compose up -d --build report-to-db`
Expected: report page rebuilds successfully and serves the updated static bundle on `http://127.0.0.1:9000/report.html`

- [ ] **Step 4: Verify the salary card in browser on desktop and mobile**

Check on `http://127.0.0.1:9000/report.html`:

- `Не указан` is absent from the salary legend
- only `RUR`, `USD`, `EUR` remain in the salary card
- salary currencies render as flat sections without separate panel containers
- point labels sit beside the point markers
- the same data order renders the same side-placement and slot arrangement
- labels do not visibly jump or pile onto the track line

- [ ] **Step 5: Commit any final browser polish if needed**

```bash
git add reports/report.data.js reports/static/report.data.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/salary-overview-chart.test.js
git commit -m "fix: polish salary flat chart layout"
```
