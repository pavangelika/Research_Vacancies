# Dashboard Mobile Readability And Salary Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the employer-analysis dashboard chart with a single readable ranked-list component, re-center the vacancy donut total on mobile, and extend salary currency rows to show `Новые` and `Опубл. и архивир.` in the requested order.

**Architecture:** Keep the existing analytics payloads and dashboard card structure, but swap the employer-analysis renderer from SVG-axis output to HTML ranked rows. Reuse the current salary model/render path and donut shell, changing only row composition and centering mechanics. Runtime and static report files stay in sync, and obsolete chart-only CSS is removed after the new hooks are in place.

**Tech Stack:** Vanilla JS dashboard renderer, CSS, existing report generator/static bundle, Node UI regression tests, DevTools browser verification.

---

## File Map

**Modify:**
- `reports/report.ui.js`
  Responsible for runtime dashboard rendering, employer analysis HTML, donut center markup, and salary module row composition.
- `reports/static/report.ui.js`
  Static mirror of the runtime renderer.
- `reports/styles.css`
  Runtime dashboard styles, including donut center rules, salary module rules, and employer-analysis card rules.
- `reports/static/styles.css`
  Static mirror of the runtime stylesheet.
- `tests/ui/chart-font-regression.test.js`
  Current regression test that still anchors the old employer-analysis donut chart hooks.
- `tests/ui/salary-overview-chart.test.js`
  Current salary overview regression coverage; extend for new status rows and ordering.
- `tests/ui/dashboard-layout-regression.test.js`
  Layout-oriented regression coverage; add donut-center hook assertions if needed.

**Read for context while implementing:**
- `docs/superpowers/specs/2026-04-25-dashboard-mobile-readability-and-salary-rows-design.md`
- `tests/ui/totals-period-metrics.test.js`

**Do not modify unless implementation proves necessary:**
- `backend/services/analytics_service.py`
  Existing data should already be sufficient for these UI-only changes.

---

### Task 1: Replace Employer Analysis Dashboard Chart With Ranked Rows

**Files:**
- Modify: `tests/ui/chart-font-regression.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing UI regression expectation for the new employer-analysis markup**

Replace the old donut-chart assertions in `tests/ui/chart-font-regression.test.js` with ranked-list assertions.

Use expectations along these lines:

```js
assert.match(source, /function buildEmployerAnalysisRankedChartHtml\(labels,\s*values,\s*factorKeys,\s*metricLabel,\s*currencyLabel,\s*chartContext,\s*signature\)/);
assert.match(source, /graph\.__chartHostEl\.innerHTML = buildEmployerAnalysisRankedChartHtml\(labels,\s*values,\s*factorKeys,\s*metricLabel,\s*currencyLabel,\s*chartContext,\s*signature\);/);
assert.match(source, /employer-analysis-ranked-chart/);
assert.match(source, /employer-analysis-ranked-row/);
assert.match(source, /employer-analysis-ranked-track-fill/);
assert.doesNotMatch(source, /employer-analysis-donut-axis-line/);
assert.doesNotMatch(source, /employer-analysis-donut-axis-tick/);
```

- [ ] **Step 2: Run the regression test to verify it fails**

Run:

```powershell
node tests\ui\chart-font-regression.test.js
```

Expected:
- FAIL because `buildEmployerAnalysisRankedChartHtml` does not exist yet
- FAIL because the renderer still uses `buildEmployerAnalysisDonutChartHtml`

- [ ] **Step 3: Implement the ranked-list renderer in the runtime UI**

In `reports/report.ui.js`, replace `buildEmployerAnalysisDonutChartHtml(...)` with a new HTML-ranked renderer.

Target shape:

```js
function buildEmployerAnalysisRankedChartHtml(labels, values, factorKeys, metricLabel, currencyLabel, chartContext, signature) {
    var rows = (labels || []).map(function(label, index) {
        var rawValue = Number(values[index] || 0);
        var factorKey = factorKeys[index] || 'accreditation';
        var meta = getEmployerAnalysisDonutGradientMeta(factorKey);
        return {
            key: factorKey,
            label: String(label || '—'),
            value: rawValue,
            valueLabel: totalsFormatSalaryPointValue(rawValue, currencyLabel === 'Другая валюта' ? '' : currencyLabel),
            gradient: getDonutGradientCssByKey(meta.key)
        };
    }).sort(function(a, b) {
        return b.value - a.value;
    });
    var maxValue = rows.reduce(function(max, row) {
        return Math.max(max, row.value || 0);
    }, 0);
    var title = metricLabel ? metricLabel + ' по факторам' : 'Факторы работодателей';
    return '<div class="employer-analysis-ranked-chart">' +
        '<div class="employer-analysis-ranked-chart-title">' + escapeHtml(title) + '</div>' +
        rows.map(function(row) {
            var ratio = maxValue > 0 ? row.value / maxValue : 0;
            return '<div class="employer-analysis-ranked-row">' +
                '<div class="employer-analysis-ranked-row-head">' +
                    '<div class="employer-analysis-ranked-label">' + escapeHtml(row.label) + '</div>' +
                    '<div class="employer-analysis-ranked-value">' + escapeHtml(row.valueLabel) + '</div>' +
                '</div>' +
                '<div class="employer-analysis-ranked-track">' +
                    '<div class="employer-analysis-ranked-track-fill" style="width:' + escapeHtml(String(ratio * 100)) + '%;background:' + escapeHtml(row.gradient) + ';"></div>' +
                '</div>' +
            '</div>';
        }).join('') +
    '</div>';
}
```

Update the render call:

```js
graph.__chartHostEl.innerHTML = buildEmployerAnalysisRankedChartHtml(labels, values, factorKeys, metricLabel, currencyLabel, chartContext, signature);
```

- [ ] **Step 4: Mirror the ranked-list renderer into the static UI**

Apply the same renderer and call-site change in `reports/static/report.ui.js`.

Keep function name, markup, and hook names identical.

- [ ] **Step 5: Add minimal ranked-list styles and remove old card-local axis styles**

In both stylesheet files, introduce the new hooks:

```css
.employer-analysis-ranked-chart {
    display: grid;
    gap: 10px;
}

.employer-analysis-ranked-chart-title {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-secondary);
}

.employer-analysis-ranked-row {
    display: grid;
    gap: 6px;
}

.employer-analysis-ranked-row-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
}

.employer-analysis-ranked-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-primary);
}

.employer-analysis-ranked-value {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    white-space: nowrap;
}

.employer-analysis-ranked-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.14);
    overflow: hidden;
}

.employer-analysis-ranked-track-fill {
    height: 100%;
    min-width: 10px;
    border-radius: inherit;
}
```

Delete or stop referencing the old card-local selectors that are specific to the axis-based dashboard employer chart:

```css
.employer-analysis-donut-chart { ... }
.employer-analysis-donut-chart-title { ... }
.employer-analysis-donut-chart svg { ... }
.employer-analysis-donut-label { ... }
.employer-analysis-donut-value { ... }
.employer-analysis-donut-axis-line,
.employer-analysis-donut-axis-tick line { ... }
```

- [ ] **Step 6: Run the employer-analysis regression test to verify it passes**

Run:

```powershell
node tests\ui\chart-font-regression.test.js
```

Expected:
- PASS
- No remaining assertions for the removed axis-based hooks

- [ ] **Step 7: Commit the employer-analysis renderer replacement**

```powershell
git add tests/ui/chart-font-regression.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: replace employer dashboard chart with ranked rows"
```

---

### Task 2: Re-Center Vacancy Donut Total On Mobile

**Files:**
- Modify: `tests/ui/dashboard-layout-regression.test.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing layout regression for donut-center hooks**

Add assertions in `tests/ui/dashboard-layout-regression.test.js` that the donut center uses the expected centering hooks.

Example assertions:

```js
assert.match(source, /\.donut-chart-shell\s*\{/);
assert.match(source, /\.donut-center-label\s*\{/);
assert.match(source, /position:\s*absolute/);
assert.match(source, /top:\s*50%/);
assert.match(source, /left:\s*50%/);
assert.match(source, /transform:\s*translate\(-50%,\s*-50%\)/);
```

- [ ] **Step 2: Run the layout regression test to verify it fails if centering is still incomplete**

Run:

```powershell
node tests\ui\dashboard-layout-regression.test.js
```

Expected:
- FAIL if `.donut-center-label` is not fully centered by absolute centering rules

- [ ] **Step 3: Update donut center CSS in the runtime stylesheet**

In `reports/styles.css`, make the donut center layout deterministic:

```css
.donut-chart-shell {
    position: relative;
}

.donut-center-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
}
```

Remove any mobile-specific offset rule that changes center alignment through padding, left/right shifts, or non-symmetric transforms.

- [ ] **Step 4: Mirror the donut center CSS into the static stylesheet**

Apply the same centering rules in `reports/static/styles.css`.

- [ ] **Step 5: Re-run the layout regression test to verify it passes**

Run:

```powershell
node tests\ui\dashboard-layout-regression.test.js
```

Expected:
- PASS

- [ ] **Step 6: Commit the donut-center mobile fix**

```powershell
git add tests/ui/dashboard-layout-regression.test.js reports/styles.css reports/static/styles.css
git commit -m "fix: center vacancy donut total on mobile"
```

---

### Task 3: Add Salary Period Rows In The Requested Order

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`

- [ ] **Step 1: Extend the failing salary regression to require row order and optional subsets**

In `tests/ui/salary-overview-chart.test.js`, update the HTML fixture to include:
- `open`
- `new`
- `archived`
- `period_archived`

Then assert order:

```js
assert.match(html, /Активные[\s\S]*Новые[\s\S]*Архивные[\s\S]*Опубл\. и архивир\./);
```

Also assert omitted rows are not rendered when absent in a dedicated fixture.

- [ ] **Step 2: Run the salary regression test to verify it fails**

Run:

```powershell
node tests\ui\salary-overview-chart.test.js
```

Expected:
- FAIL because the current salary status list does not yet guarantee the requested ordering/subset placement

- [ ] **Step 3: Update salary row normalization in the runtime UI**

In `reports/report.ui.js`, where the salary currency statuses are mapped for `buildTotalsSalaryOverviewSectionHtml(...)`, normalize them through a fixed order list.

Use a helper of this shape:

```js
function orderSalaryStatusRows(statuses) {
    var order = ['open', 'new', 'archived', 'period_archived'];
    return order.map(function(key) {
        return (statuses || []).find(function(item) {
            return String(item && item.statusKey || '') === key;
        }) || null;
    }).filter(function(item) {
        return !!item && Array.isArray(item.points) && item.points.length;
    });
}
```

Then render:

```js
var orderedStatuses = orderSalaryStatusRows(currencyRow && currencyRow.statuses);
```

Keep label mapping aligned with existing short labels:

```js
open -> 'Активные'
new -> 'Новые'
archived -> 'Архивные'
period_archived -> 'Опубл. и архивир.'
```

- [ ] **Step 4: Mirror the salary row ordering logic into the static UI**

Apply the same helper and rendering order in `reports/static/report.ui.js`.

- [ ] **Step 5: Re-run the salary regression test to verify it passes**

Run:

```powershell
node tests\ui\salary-overview-chart.test.js
```

Expected:
- PASS
- The output contains the status rows in the requested order

- [ ] **Step 6: Commit the salary row ordering change**

```powershell
git add tests/ui/salary-overview-chart.test.js reports/report.ui.js reports/static/report.ui.js
git commit -m "feat: add salary period rows in requested order"
```

---

### Task 4: Full Regression Sweep And Browser Verification

**Files:**
- Modify only if verification exposes regressions.

- [ ] **Step 1: Run the focused UI regression suite**

Run:

```powershell
node tests\ui\chart-font-regression.test.js
node tests\ui\salary-overview-chart.test.js
node tests\ui\dashboard-layout-regression.test.js
node tests\ui\dashboard-compensation-availability.test.js
```

Expected:
- PASS for all four scripts

- [ ] **Step 2: Rebuild the report frontend service**

Run:

```powershell
docker compose up -d --build report-to-db
```

Expected:
- Service rebuilds and restarts successfully

- [ ] **Step 3: Verify in the browser on desktop**

Open:

```text
http://127.0.0.1:9000/report.html
```

Check:
- `Анализ работодателей` renders as ranked rows, not the old axis chart
- row labels and values are readable without horizontal scanning
- donut total is visually centered
- salary currency sections show `Новые` under `Активные` when present
- salary currency sections show `Опубл. и архивир.` under `Архивные` when present

- [ ] **Step 4: Verify in the browser on mobile viewport**

Check:
- the same employer-analysis component remains readable
- no axis/tick-label overflow exists
- donut total stays centered in the vacancy ring
- salary rows remain legible and ordered correctly

- [ ] **Step 5: Commit any verification-driven cleanup**

```powershell
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/chart-font-regression.test.js tests/ui/salary-overview-chart.test.js tests/ui/dashboard-layout-regression.test.js
git commit -m "test: finalize dashboard mobile readability updates"
```

---

## Self-Review

### Spec Coverage

- Employer-analysis replacement is covered in Task 1.
- Donut total centering is covered in Task 2.
- Salary row ordering and subset visibility are covered in Task 3.
- Desktop/mobile browser verification is covered in Task 4.

No spec gaps remain.

### Placeholder Scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each code-bearing step names exact files and concrete hook names.
- Verification commands are explicit.

### Type And Naming Consistency

- Employer-analysis renderer name is consistently `buildEmployerAnalysisRankedChartHtml`.
- Salary subset keys stay `open`, `new`, `archived`, `period_archived`.
- Donut centering hook stays `donut-center-label`.

