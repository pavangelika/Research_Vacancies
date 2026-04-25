# Dashboard Desktop UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the dashboard desktop UX by fixing the vacancy donut overlap, calming the work-format card, fully unifying the salary legend with the donut legend, tightening chart density, and redesigning employer analysis into the same filled-bar system as the response funnel.

**Architecture:** Keep the existing dashboard data flow and card render tree, but adjust the current runtime and static UI renderers so each affected card uses cleaner layout boundaries and one shared visual language. The work stays inside the current `reports/*.js` renderers and `styles.css` files, with focused regression tests covering structure, style hooks, and browser-visible layout guarantees.

**Tech Stack:** Vanilla JS dashboard renderers, mirrored static bundle files, shared CSS, Node-based UI regression tests, Chrome DevTools browser verification on local `report.html`.

---

## File Map

- `reports/report.ui.js`
  Runtime dashboard composition, vacancy donut shell markup, work-format matrix markup, salary legend/status rendering, and employer-analysis card renderer.
- `reports/static/report.ui.js`
  Static mirror of the runtime dashboard renderer.
- `reports/styles.css`
  Dashboard card layout, donut sizing, work-format matrix density, salary legend/readability, burnup spacing, funnel-like employer bars.
- `reports/static/styles.css`
  Static mirror of the dashboard styles.
- `tests/ui/dashboard-layout-regression.test.js`
  Regression coverage for dashboard card structure, vacancy card shell boundaries, and chart-card spacing.
- `tests/ui/dashboard-compensation-availability.test.js`
  Regression coverage for the work-format card structure and calmer matrix layout hooks.
- `tests/ui/donut-legend-regression.test.js`
  Regression coverage for legend-style reuse between donut and salary legend plus donut shell sizing hooks.
- `tests/ui/salary-overview-chart.test.js`
  Regression coverage for salary legend classes, currency-section structure, and deterministic point-label hooks.
- `tests/ui/chart-font-regression.test.js`
  Regression coverage for employer-analysis textual labels inside bars and stable dashboard typography hooks.

### Task 1: Fix Vacancy Card Boundaries And Tighten Dashboard Chart Spacing

**Files:**
- Modify: `tests/ui/dashboard-layout-regression.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectations for vacancy-card shell boundaries**

```js
runTest('vacancy card keeps separate chart and status areas', () => {
  const html = renderDashboardOverviewHtml(fixtureData);
  assert.match(html, /vacancy-donut-chart-area/);
  assert.match(html, /vacancy-donut-status-area/);
  assert.match(html, /vacancy-donut-status-list/);
});

runTest('dashboard chart cards use tighter inner spacing hooks', () => {
  const styles = readReportStyles();
  assert.match(styles, /\.vacancy-donut-shell\s*\{/);
  assert.match(styles, /\.dashboard-card-burnup\s+\.dashboard-card-body\s*\{/);
  assert.match(styles, /\.totals-employer-overview-card\s+\.dashboard-card-body\s*\{/);
});
```

- [ ] **Step 2: Run the layout regression and verify it fails**

Run: `node tests\ui\dashboard-layout-regression.test.js`  
Expected: FAIL because the vacancy donut card does not yet expose explicit chart/status wrappers and the spacing hooks do not match the new contract.

- [ ] **Step 3: Split the runtime vacancy card into protected chart and status areas**

Update the vacancy card renderer in `reports/report.ui.js` so the shell becomes:

```js
return '<div class="dashboard-card dashboard-card-vacancies">' +
  '<h3 class="dashboard-card-title">Вакансии</h3>' +
  '<div class="dashboard-card-body vacancy-donut-shell">' +
    '<div class="vacancy-donut-chart-area">' +
      donutHtml +
    '</div>' +
    '<div class="vacancy-donut-status-area">' +
      statusLegendHtml +
      lifespanHtml +
    '</div>' +
  '</div>' +
'</div>';
```

Keep the existing drilldown buttons and total-center markup; only change the layout wrappers and ordering needed to prevent overlap.

- [ ] **Step 4: Mirror the same vacancy-card structure in the static renderer**

Apply the same `vacancy-donut-chart-area` and `vacancy-donut-status-area` structure in `reports/static/report.ui.js`.

- [ ] **Step 5: Constrain donut growth and tighten chart-card spacing in both stylesheets**

Add or update the card layout rules so the donut is visually large but cannot invade the legend column:

```css
.vacancy-donut-shell {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 292px;
    gap: 18px;
    align-items: center;
}

.vacancy-donut-chart-area {
    min-width: 0;
    display: grid;
    place-items: center;
}

.vacancy-donut-status-area {
    min-width: 292px;
}

.donut-chart {
    width: clamp(248px, 27vw, 312px);
    height: clamp(248px, 27vw, 312px);
}

.dashboard-card-burnup .dashboard-card-body,
.totals-employer-overview-card .dashboard-card-body {
    padding: 14px 16px 16px;
    gap: 8px;
}
```

Also quiet zero-value vacancy rows and the lifetime row so they do not compete with the main statuses.

- [ ] **Step 6: Re-run the layout regression and verify it passes**

Run: `node tests\ui\dashboard-layout-regression.test.js`  
Expected: PASS

- [ ] **Step 7: Commit the vacancy-boundary and chart-spacing changes**

```bash
git add tests/ui/dashboard-layout-regression.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: tighten dashboard vacancy and chart layout"
```

### Task 2: Calm The Work-Format Card Without Losing Information

**Files:**
- Modify: `tests/ui/dashboard-compensation-availability.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectations for grouped work-format rows**

```js
runTest('work-format card exposes grouped matrix sections', () => {
  const html = buildDashboardCompensationAvailabilityHtml(summaryFixture);
  assert.match(html, /dashboard-work-format-section-heading">Объём</);
  assert.match(html, /dashboard-work-format-section-heading">Валюты</);
  assert.match(html, /dashboard-work-format-row-label">Всего</);
  assert.match(html, /dashboard-work-format-row-label">RUR</);
});
```

- [ ] **Step 2: Run the work-format regression and verify it fails**

Run: `node tests\ui\dashboard-compensation-availability.test.js`  
Expected: FAIL because the current matrix is still flat and does not expose grouped section headings.

- [ ] **Step 3: Add grouped `Объём` and `Валюты` sections in the runtime renderer**

Reshape `buildDashboardCompensationAvailabilityHtml(summary)` in `reports/report.ui.js` to render:

```js
return '<div class="dashboard-card dashboard-work-format-card">' +
  '<h3 class="dashboard-card-title">Формат работы</h3>' +
  '<div class="dashboard-card-body">' +
    '<div class="dashboard-work-format-matrix">' +
      buildMatrixHeaders() +
      buildSectionHeading('Объём') +
      buildMetricRow('Всего', online.total, online.totalMeta, offline.total, offline.totalMeta) +
      buildMetricRow('С з/п', online.withSalary, online.withSalaryMeta, offline.withSalary, offline.withSalaryMeta) +
      buildSectionHeading('Валюты') +
      buildMetricRow('RUR', online.rur, online.rurMeta, offline.rur, offline.rurMeta) +
      buildMetricRow('USD', online.usd, online.usdMeta, offline.usd, offline.usdMeta) +
      buildMetricRow('EUR', online.eur, online.eurMeta, offline.eur, offline.eurMeta) +
      buildMetricRow('Другая', online.other, online.otherMeta, offline.other, offline.otherMeta) +
    '</div>' +
  '</div>' +
'</div>';
```

- [ ] **Step 4: Mirror the grouped work-format matrix in the static renderer**

Apply the same grouped matrix markup and helper structure in `reports/static/report.ui.js`.

- [ ] **Step 5: Tighten matrix row height and subordinate the secondary notes in both stylesheets**

```css
.dashboard-work-format-matrix {
    display: grid;
    grid-template-columns: minmax(110px, 0.86fr) repeat(2, minmax(0, 1fr));
    gap: 8px 14px;
}

.dashboard-work-format-section-heading {
    grid-column: 1 / -1;
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid rgba(148, 163, 184, 0.18);
    font-size: 0.74rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.dashboard-work-format-cell-note {
    opacity: 0.72;
    font-size: 0.73rem;
}
```

Keep all values visible, but make the card shorter and reduce attention on the zero-heavy `OFFLINE / HYBRID` side.

- [ ] **Step 6: Re-run the work-format regression and verify it passes**

Run: `node tests\ui\dashboard-compensation-availability.test.js`  
Expected: PASS

- [ ] **Step 7: Commit the work-format cleanup**

```bash
git add tests/ui/dashboard-compensation-availability.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: refine dashboard work-format matrix"
```

### Task 3: Unify Salary Legend With Donut Legend And Calm Salary Readability

**Files:**
- Modify: `tests/ui/donut-legend-regression.test.js`
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectations for salary legend reuse of donut classes**

```js
runTest('salary legend reuses donut legend classes', () => {
  const html = buildSalaryOverviewChartHtml(salaryFixture);
  assert.match(html, /donut-legend/);
  assert.match(html, /donut-legend-item/);
  assert.doesNotMatch(html, /salary-module-legend-item/);
});

runTest('salary point labels keep stable adjacency hooks', () => {
  const html = buildSalaryOverviewChartHtml(salaryFixture);
  assert.match(html, /salary-module-track-point-label/);
  assert.match(html, /data-label-side=/);
  assert.match(html, /data-label-slot=/);
});
```

- [ ] **Step 2: Run the salary and donut legend regressions and verify they fail**

Run: `node tests\ui\salary-overview-chart.test.js`  
Expected: FAIL because the legend markup still uses salary-specific wrappers or stale hooks.

Run: `node tests\ui\donut-legend-regression.test.js`  
Expected: FAIL because salary legend styling is not yet asserted through the donut legend contract.

- [ ] **Step 3: Rebuild the runtime salary legend with the donut legend markup**

Update the salary legend renderer in `reports/report.ui.js` to emit the same structure as the donut legend:

```js
return '<div class="donut-legend salary-module-legend">' +
  experiences.map(function(item) {
    return '<button type="button" class="donut-legend-item' + item.stateClass + '">' +
      '<span class="donut-legend-dot" style="--legend-color:' + escapeHtml(item.color) + '"></span>' +
      '<span class="donut-legend-label">' + escapeHtml(item.label) + '</span>' +
    '</button>';
  }).join('') +
'</div>';
```

Remove duplicate salary-only legend item wrappers unless they still serve a non-visual structural need.

- [ ] **Step 4: Mirror the same salary legend markup in the static renderer**

Apply the same donut-legend-based structure in `reports/static/report.ui.js`.

- [ ] **Step 5: Delete salary-only legend chrome and retune salary spacing in both stylesheets**

```css
.salary-module-legend {
    gap: 8px;
    margin-bottom: 14px;
}

.salary-module-body {
    gap: 22px;
}

.salary-module-currency-section {
    gap: 10px;
    padding-top: 6px;
}

.salary-module-track {
    min-height: 64px;
}

.salary-module-track-point-label {
    font-size: 0.78rem;
    line-height: 1.1;
}
```

Delete or inline any now-dead selectors specific to the old salary legend treatment.

- [ ] **Step 6: Re-run the salary and donut legend regressions and verify they pass**

Run: `node tests\ui\salary-overview-chart.test.js`  
Expected: PASS

Run: `node tests\ui\donut-legend-regression.test.js`  
Expected: PASS

- [ ] **Step 7: Commit the salary legend unification**

```bash
git add tests/ui/donut-legend-regression.test.js tests/ui/salary-overview-chart.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: unify dashboard salary legend styling"
```

### Task 4: Redesign Employer Analysis As Filled Bars And Verify Typography Hooks

**Files:**
- Modify: `tests/ui/chart-font-regression.test.js`
- Modify: `tests/ui/dashboard-layout-regression.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectations for funnel-style employer bars**

```js
runTest('employer analysis uses filled bars with inline labels and values', () => {
  const html = buildEmployerOverviewCardHtml(employerFixture);
  assert.match(html, /employer-funnel-bar/);
  assert.match(html, /employer-funnel-label/);
  assert.match(html, /employer-funnel-value/);
  assert.doesNotMatch(html, /employer-analysis-ranked-row/);
});
```

- [ ] **Step 2: Run the chart-font regression and verify it fails**

Run: `node tests\ui\chart-font-regression.test.js`  
Expected: FAIL because the current employer-analysis card still renders ranked rows rather than filled bars with inline text.

- [ ] **Step 3: Replace the runtime employer-analysis renderer with filled bars**

Update `buildEmployerOverviewCardHtml(...)` in `reports/report.ui.js` so each factor renders as:

```js
return '<div class="employer-funnel-bar" style="--bar-width:' + widthPct + '%">' +
  '<span class="employer-funnel-label">' + escapeHtml(item.label) + '</span>' +
  '<span class="employer-funnel-value">' + escapeHtml(item.valueLabel) + '</span>' +
'</div>';
```

Sort the bars by descending absolute value before rendering, and keep a compact fallback class for bars too short to fit the full label.

- [ ] **Step 4: Mirror the same employer-analysis renderer in the static file**

Apply the same bar-based renderer in `reports/static/report.ui.js`.

- [ ] **Step 5: Style employer-analysis bars from the same family as the response funnel**

```css
.employer-funnel-stack {
    display: grid;
    gap: 10px;
}

.employer-funnel-bar {
    width: var(--bar-width, 100%);
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    border-radius: 14px;
}

.employer-funnel-label,
.employer-funnel-value {
    color: #fff;
    font-weight: 700;
}
```

Reuse the funnel gradient language rather than introducing a separate palette.

- [ ] **Step 6: Re-run the chart-font and layout regressions and verify they pass**

Run: `node tests\ui\chart-font-regression.test.js`  
Expected: PASS

Run: `node tests\ui\dashboard-layout-regression.test.js`  
Expected: PASS

- [ ] **Step 7: Commit the employer-analysis redesign**

```bash
git add tests/ui/chart-font-regression.test.js tests/ui/dashboard-layout-regression.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: redesign employer analysis as filled bars"
```

### Task 5: Rebuild, Verify In Browser, And Close Out

**Files:**
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Modify: `tests/ui/dashboard-compensation-availability.test.js`
- Modify: `tests/ui/dashboard-layout-regression.test.js`
- Modify: `tests/ui/donut-legend-regression.test.js`
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Run the full focused UI regression suite**

Run: `node tests\ui\dashboard-compensation-availability.test.js`  
Expected: PASS

Run: `node tests\ui\dashboard-layout-regression.test.js`  
Expected: PASS

Run: `node tests\ui\donut-legend-regression.test.js`  
Expected: PASS

Run: `node tests\ui\salary-overview-chart.test.js`  
Expected: PASS

Run: `node tests\ui\chart-font-regression.test.js`  
Expected: PASS

- [ ] **Step 2: Rebuild the local dashboard artifacts**

Run: `docker compose up -d --build report-to-db`  
Expected: service rebuild completes successfully and `report.html` reflects the updated runtime/static assets.

- [ ] **Step 3: Verify the desktop dashboard in the browser**

Use DevTools on `http://127.0.0.1:9000/report.html` and confirm:

- the vacancy donut no longer overlaps the right-side statuses
- the vacancy total stays centered within the ring
- the work-format card is shorter and calmer
- the salary legend matches the donut legend visually
- salary labels feel stable and no longer noisy
- the burnup chart sits closer to the title and uses more card area
- employer analysis uses filled bars with text inside each bar

- [ ] **Step 4: Sanity-check mobile after desktop-focused changes**

Use a mobile viewport on the same page and confirm:

- vacancy donut still centers correctly
- salary labels do not collide
- employer-analysis bars remain readable
- no card develops overflow from the desktop refinements

- [ ] **Step 5: Commit the verification baseline if any final polish changes were required**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/dashboard-compensation-availability.test.js tests/ui/dashboard-layout-regression.test.js tests/ui/donut-legend-regression.test.js tests/ui/salary-overview-chart.test.js tests/ui/chart-font-regression.test.js
git commit -m "test: lock dashboard desktop ux refinements"
```
