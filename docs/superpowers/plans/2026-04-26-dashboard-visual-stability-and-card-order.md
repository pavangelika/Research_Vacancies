# Dashboard Visual Stability And Card Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a calmer, more legible dashboard by returning the vacancy donut to its earlier size, redesigning `Формат работы` as a quieter comparison card, tightening chart-card spacing, stabilizing `Зарплаты`, and applying the new card order.

**Architecture:** Keep the existing dashboard data flow and card render functions, but recompose the layout in the current dashboard render tree and simplify the visual hierarchy inside each card. Runtime and static UI files remain mirrored, and the work is split between render order changes, comparative work-format markup, spacing adjustments in shared CSS, and salary-specific spacing/stability tuning.

**Tech Stack:** Vanilla JS dashboard renderers in `reports/*.js`, mirrored static bundle files, shared CSS, Node-based UI regression tests, browser verification on local `report.html`.

---

## File Map

- `reports/report.ui.js`
  Runtime dashboard composition, vacancy donut shell sizing, work-format card markup, burnup/employer card spacing hooks, and salary-module markup if minor structure tweaks are needed.
- `reports/static/report.ui.js`
  Static mirror of the runtime dashboard renderer.
- `reports/styles.css`
  Dashboard card order/layout styles, donut sizing, work-format comparative styles, chart density spacing, and salary spacing rules.
- `reports/static/styles.css`
  Static mirror of dashboard styles.
- `tests/ui/dashboard-layout-regression.test.js`
  Regression coverage for dashboard order and layout structure.
- `tests/ui/dashboard-compensation-availability.test.js`
  Regression coverage for the work-format card structure.
- `tests/ui/donut-legend-regression.test.js`
  Regression coverage for donut sizing and legend-related dashboard shell expectations.
- `tests/ui/salary-overview-chart.test.js`
  Regression coverage for salary spacing and stable label markup.

### Task 1: Reorder Dashboard Cards And Restore Donut Scale

**Files:**
- Modify: `tests/ui/dashboard-layout-regression.test.js`
- Modify: `tests/ui/donut-legend-regression.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectation for dashboard card order**

```js
runTest('dashboard renderer keeps the new semantic card order', () => {
  const html = renderDashboardOverviewHtml(fixtureData);
  const vacanciesIdx = html.indexOf('>Вакансии<');
  const workFormatIdx = html.indexOf('>Формат работы<');
  const salaryIdx = html.indexOf('>Зарплаты<');
  const burnupIdx = html.indexOf('>Сгорание вакансий<');
  const funnelIdx = html.indexOf('>Воронка откликов<');
  const employerIdx = html.indexOf('>Анализ работодателей<');

  assert.ok(vacanciesIdx < workFormatIdx);
  assert.ok(workFormatIdx < salaryIdx);
  assert.ok(salaryIdx < burnupIdx);
  assert.ok(burnupIdx < funnelIdx);
  assert.ok(funnelIdx < employerIdx);
});
```

- [ ] **Step 2: Write the failing regression expectation for the restored donut footprint**

```js
assert.match(styles, /\.donut-chart\s*\{\s*width:\s*320px;/);
assert.match(styles, /\.donut-chart-shell\s*\{\s*min-height:\s*320px;/);
```

Use the actual earlier values found in the stylesheet if they differ from `320px`.

- [ ] **Step 3: Run the focused regressions and verify they fail**

Run: `node tests\ui\dashboard-layout-regression.test.js`
Expected: FAIL because the current order still reflects the previous arrangement.

Run: `node tests\ui\donut-legend-regression.test.js`
Expected: FAIL because donut sizing currently reflects the smaller tightened version.

- [ ] **Step 4: Reorder the dashboard cards in the runtime renderer**

Update the current dashboard overview composition in `reports/report.ui.js` so the card render order becomes:

```js
[
  buildVacancyDonutCard(...),
  buildWorkFormatCard(...),
  buildTotalsSalaryOverviewSectionHtml(...),
  buildBurnupCard(...),
  buildResponseFunnelCard(...),
  buildEmployerOverviewCardHtml(...)
]
```

- [ ] **Step 5: Mirror the same dashboard card order in the static renderer**

Update `reports/static/report.ui.js` to match the runtime card order exactly.

- [ ] **Step 6: Restore the earlier donut scale in both stylesheets**

Bring back the larger donut shell values in both CSS files. The target should match the earlier stronger visual footprint, for example:

```css
.donut-chart-shell {
    min-height: 320px;
}

.donut-chart {
    width: 320px;
    height: 320px;
}
```

Keep the current mobile centering rule intact while restoring size.

- [ ] **Step 7: Re-run the focused regressions and verify they pass**

Run: `node tests\ui\dashboard-layout-regression.test.js`
Expected: PASS

Run: `node tests\ui\donut-legend-regression.test.js`
Expected: PASS

- [ ] **Step 8: Commit the dashboard order and donut sizing change**

```bash
git add tests/ui/dashboard-layout-regression.test.js tests/ui/donut-legend-regression.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: restore dashboard order and donut scale"
```

### Task 2: Redesign The Work-Format Card As A Calm Comparison Matrix

**Files:**
- Modify: `tests/ui/dashboard-compensation-availability.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectation for the calmer comparative work-format structure**

```js
assert.match(html, /dashboard-work-format-matrix/);
assert.match(html, /dashboard-work-format-row/);
assert.match(html, /dashboard-work-format-row-label/);
assert.match(html, /dashboard-work-format-cell/);
assert.doesNotMatch(html, /dashboard-work-format-tile/);
```

- [ ] **Step 2: Run the work-format regression and verify it fails**

Run: `node tests\ui\dashboard-compensation-availability.test.js`
Expected: FAIL because the current card still uses the tile-heavy structure.

- [ ] **Step 3: Replace the runtime work-format card markup with a two-column comparison matrix**

Use one shared matrix structure similar to:

```js
return '<div class="dashboard-card dashboard-card-compensation dashboard-work-format-card">' +
    '<h3 class="dashboard-card-title">Формат работы</h3>' +
    '<div class="dashboard-card-body">' +
        '<div class="dashboard-work-format-matrix">' +
            '<div class="dashboard-work-format-header"></div>' +
            '<div class="dashboard-work-format-header">ONLINE</div>' +
            '<div class="dashboard-work-format-header">OFFLINE / HYBRID</div>' +
            buildMetricRow('Всего', online.total, online.totalMeta, offline.total, offline.totalMeta) +
            buildMetricRow('С з/п', online.withSalary, online.withSalaryMeta, offline.withSalary, offline.withSalaryMeta) +
            buildMetricRow('RUR', online.rur, online.rurMeta, offline.rur, offline.rurMeta) +
            buildMetricRow('USD', online.usd, online.usdMeta, offline.usd, offline.usdMeta) +
            buildMetricRow('EUR', online.eur, online.eurMeta, offline.eur, offline.eurMeta) +
            buildMetricRow('Другая', online.other, online.otherMeta, offline.other, offline.otherMeta) +
        '</div>' +
    '</div>' +
'</div>';
```

- [ ] **Step 4: Mirror the same comparative work-format markup in the static renderer**

Implement the same matrix structure in `reports/static/report.ui.js`.

- [ ] **Step 5: Replace tile-oriented styles with calm matrix styles in both stylesheets**

```css
.dashboard-work-format-matrix {
    display: grid;
    grid-template-columns: minmax(110px, 0.9fr) repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
    align-items: start;
}

.dashboard-work-format-row {
    display: contents;
}

.dashboard-work-format-row-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-secondary);
}

.dashboard-work-format-cell {
    display: grid;
    gap: 2px;
}
```

Keep all current information, but reduce decorative emphasis and remove the loud tile surface treatment.

- [ ] **Step 6: Re-run the work-format regression and verify it passes**

Run: `node tests\ui\dashboard-compensation-availability.test.js`
Expected: PASS

- [ ] **Step 7: Commit the work-format card redesign**

```bash
git add tests/ui/dashboard-compensation-availability.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: calm the work-format comparison card"
```

### Task 3: Tighten Burnup And Employer Chart Density

**Files:**
- Modify: `tests/ui/dashboard-layout-regression.test.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectation for reduced chart-card padding**

```js
assert.match(styles, /\.totals-employer-overview-card\s+\.dashboard-card-title\s*\{\s*margin-bottom:\s*8px;/);
assert.match(styles, /\.totals-employer-overview-graph\s*\{\s*min-height:\s*360px;/);
assert.match(styles, /\.dashboard-card-burnup\s+\.dashboard-card-body\s*\{\s*padding-top:\s*8px;/);
```

Use the exact selectors that already exist around the burnup/employer dashboard cards.

- [ ] **Step 2: Run the layout regression and verify it fails**

Run: `node tests\ui\dashboard-layout-regression.test.js`
Expected: FAIL because chart-card spacing is currently still too loose.

- [ ] **Step 3: Tighten burnup and employer chart spacing in the runtime stylesheet**

Adjust the relevant selectors in `reports/styles.css` so:

- the gap between title and chart shrinks
- inner side padding around the chart host shrinks
- graph min-height remains generous enough to use the freed space

Example pattern:

```css
.dashboard-card-burnup .dashboard-card-body,
.totals-employer-overview-card .dashboard-card-body {
    padding-top: 8px;
    padding-inline: 14px;
    padding-bottom: 14px;
}
```

- [ ] **Step 4: Mirror the same density adjustments in the static stylesheet**

Apply the same burnup/employer spacing rules in `reports/static/styles.css`.

- [ ] **Step 5: Re-run the layout regression and verify it passes**

Run: `node tests\ui\dashboard-layout-regression.test.js`
Expected: PASS

- [ ] **Step 6: Commit the chart-density cleanup**

```bash
git add tests/ui/dashboard-layout-regression.test.js reports/styles.css reports/static/styles.css
git commit -m "fix: tighten dashboard chart card spacing"
```

### Task 4: Stabilize Salary Card Spacing And Label Rhythm

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectation for calmer salary spacing**

```js
assert.match(styles, /\.salary-module-body\s*\{\s*display:\s*grid;\s*gap:\s*20px;/);
assert.match(styles, /\.salary-module-status-list\s*\{\s*display:\s*grid;\s*gap:\s*12px;/);
assert.match(styles, /\.salary-module-track\s*\{\s*position:\s*relative;\s*min-height:\s*54px;/);
```

Add one markup-side assertion that stable label slots remain present:

```js
assert.match(html, /salary-module-track-point-label is-side-right/);
assert.match(html, /data-label-slot="1"/);
```

- [ ] **Step 2: Run the salary regression and verify it fails**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: FAIL because the current spacing remains tighter than the calmer target.

- [ ] **Step 3: Tune runtime salary spacing for calmer rhythm**

Adjust `reports/styles.css` so:

- currency-section gap increases
- status-row gap increases slightly
- track min-height increases
- side labels have enough breathing room from the track and one another

Example pattern:

```css
.salary-module-body {
    gap: 20px;
}

.salary-module-status-list {
    gap: 12px;
}

.salary-module-track {
    min-height: 54px;
}
```

- [ ] **Step 4: Mirror the same salary spacing adjustments in the static stylesheet**

Apply the same values to `reports/static/styles.css`.

- [ ] **Step 5: Re-run the salary regression and verify it passes**

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: PASS

- [ ] **Step 6: Commit the salary spacing stabilization**

```bash
git add tests/ui/salary-overview-chart.test.js reports/styles.css reports/static/styles.css
git commit -m "fix: stabilize salary spacing and label rhythm"
```

### Task 5: Full Verification In Browser

**Files:**
- Modify: none
- Verify: `http://127.0.0.1:9000/report.html`

- [ ] **Step 1: Run the focused verification suite**

Run: `node tests\ui\dashboard-layout-regression.test.js`
Expected: PASS

Run: `node tests\ui\dashboard-compensation-availability.test.js`
Expected: PASS

Run: `node tests\ui\donut-legend-regression.test.js`
Expected: PASS

Run: `node tests\ui\salary-overview-chart.test.js`
Expected: PASS

- [ ] **Step 2: Rebuild the dashboard page**

Run: `docker compose up -d --build report-to-db`
Expected: report page rebuilds successfully and serves the updated static bundle on `http://127.0.0.1:9000/report.html`

- [ ] **Step 3: Verify desktop dashboard behavior in browser**

Check:

- card order is `Вакансии → Формат работы → Зарплаты → Сгорание вакансий → Воронка откликов → Анализ работодателей`
- vacancy donut looks like the earlier larger version
- `Формат работы` reads as one calm comparison card, not a noisy tile grid
- burnup and employer charts sit closer to their titles and use more area
- salary labels remain stable and the module feels less cramped

- [ ] **Step 4: Verify mobile dashboard behavior in browser**

Check:

- vacancy donut remains centered after the size restoration
- `Формат работы` remains readable and comparison-first
- burnup and employer cards still feel dense but readable
- salary side labels remain stable and readable on narrow width

- [ ] **Step 5: Commit any final browser polish if needed**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/dashboard-layout-regression.test.js tests/ui/dashboard-compensation-availability.test.js tests/ui/donut-legend-regression.test.js tests/ui/salary-overview-chart.test.js
git commit -m "fix: polish dashboard visual stability"
```
