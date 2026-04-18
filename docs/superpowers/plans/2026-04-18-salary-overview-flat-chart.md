# Salary Overview Flat Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the compact salary overview chart, remove currency card nesting, and add deterministic anti-overlap point placement verified in tests and DevTools.

**Architecture:** Keep the existing salary summary model pipeline in `reports/report.ui.js`, but extend point finalization with a second layout pass that assigns vertical rows after `leftPct` is computed. Update the compact chart HTML renderer to emit flat currency sections instead of nested currency cards, then scope CSS changes to the compact point-chart variant so non-compact salary charts keep their current behavior.

**Tech Stack:** Plain JavaScript renderer helpers, CSS in `reports/styles.css` and `reports/static/styles.css`, Node-based UI tests in `tests/ui/*.test.js`, Chrome DevTools for visual verification.

---

### Task 1: Add TDD coverage for compact point layout and vertical anti-overlap rows

**Files:**
- Modify: `tests/ui/salary-chart-mode.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`

- [ ] **Step 1: Write the failing tests for flat compact HTML and point row assignment**

Add two tests to `tests/ui/salary-chart-mode.test.js`:

```js
runTest('assignCompactSalaryPointRows spreads close points across vertical rows', () => {
  const script = [
    extractFunctionSource('assignCompactSalaryPointRows')
  ].join('\n\n') + '\nmodule.exports = { assignCompactSalaryPointRows };';
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    isFinite
  };
  vm.runInNewContext(script, sandbox, { filename: 'salary-point-rows.vm.js' });
  const { assignCompactSalaryPointRows } = sandbox.module.exports;

  const points = assignCompactSalaryPointRows([
    { label: 'Мин', leftPct: 10, valueLabel: '90K' },
    { label: 'Мода', leftPct: 14, valueLabel: '100K' },
    { label: 'Медиана', leftPct: 18, valueLabel: '110K' },
    { label: 'Макс', leftPct: 70, valueLabel: '150K' }
  ]);

  assert.deepEqual(points.map((point) => point.pointRow), [0, 1, 2, 0]);
  assert.deepEqual(points.map((point) => point.leftPct), [10, 14, 18, 70]);
});

runTest('buildTotalsSalarySummaryChartHtml renders flat currency sections for compact chart', () => {
  const script = extractFunctionSource('buildTotalsSalarySummaryChartHtml')
    + '\nmodule.exports = { buildTotalsSalarySummaryChartHtml };';
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
  vm.runInNewContext(script, sandbox, { filename: 'salary-summary-html-flat.vm.js' });
  const { buildTotalsSalarySummaryChartHtml } = sandbox.module.exports;

  const html = buildTotalsSalarySummaryChartHtml({
    title: 'Медиана зарплаты',
    legendMode: 'metric',
    legend: [
      { label: 'Мин', color: '#00C3D3' },
      { label: 'Мода', color: '#007AD8' }
    ],
    currencies: [
      {
        currency: 'RUR',
        statuses: [
          {
            statusKey: 'open',
            label: 'Открытые',
            points: [
              { label: 'Мин', color: '#00C3D3', valueLabel: '90K', leftPct: 0, pointRow: 0 },
              { label: 'Мода', color: '#007AD8', valueLabel: '110K', leftPct: 8, pointRow: 1 }
            ]
          }
        ]
      },
      {
        currency: 'USD',
        statuses: []
      }
    ]
  });

  assert.match(html, /salary-summary-chart-compact/);
  assert.equal((html.match(/salary-summary-chart-currency-card/g) || []).length, 0);
  assert.equal((html.match(/salary-summary-chart-currency-section/g) || []).length, 2);
  assert.match(html, /salary-summary-chart-currency-head/);
  assert.match(html, /--salary-point-row:1/);
});
```

- [ ] **Step 2: Run the focused test file to verify it fails**

Run: `node tests\ui\salary-chart-mode.test.js`

Expected: FAIL because `assignCompactSalaryPointRows` does not exist yet and the compact HTML still renders `salary-summary-chart-currency-card`.

- [ ] **Step 3: Implement the minimal row-assignment helper and wire it into point finalization**

In `reports/report.ui.js`, add a new helper near `distributePointPositions(...)` and use it inside `finalizeRowPoints(...)`:

```js
function assignCompactSalaryPointRows(points) {
    var list = Array.isArray(points) ? points.map(function(point) {
        return Object.assign({}, point);
    }) : [];
    var minHorizontalGap = 12;
    var maxRows = 3;
    var lastLeftByRow = [];
    list.forEach(function(point) {
        var left = Number(point && point.leftPct);
        var assignedRow = maxRows - 1;
        for (var rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
            var lastLeft = lastLeftByRow[rowIndex];
            if (!isFinite(lastLeft) || left - lastLeft >= minHorizontalGap) {
                assignedRow = rowIndex;
                break;
            }
        }
        point.pointRow = assignedRow;
        lastLeftByRow[assignedRow] = left;
    });
    return list;
}
```

Update `finalizeRowPoints(...)` to apply the helper after `leftPct` is computed:

```js
var positionedPoints = list.map(function(point, index) {
    return {
        label: point.label,
        color: point.color,
        gradient: point.gradient,
        value: point.value,
        valueLabel: point.valueLabel,
        leftPct: positions[index]
    };
});
return assignCompactSalaryPointRows(positionedPoints);
```

Mirror the same code in `reports/static/report.ui.js`.

- [ ] **Step 4: Re-run the focused test file to verify the helper and HTML expectations now pass**

Run: `node tests\ui\salary-chart-mode.test.js`

Expected: PASS for the new row-assignment test and the updated compact chart HTML test.

- [ ] **Step 5: Commit the first TDD slice**

```bash
git add tests/ui/salary-chart-mode.test.js reports/report.ui.js reports/static/report.ui.js
git commit -m "test: cover flat compact salary point layout"
```

### Task 2: Flatten compact salary chart HTML structure without touching non-compact charts

**Files:**
- Modify: `tests/ui/salary-chart-mode.test.js`
- Modify: `reports/report.ui.js:6097-6150`
- Modify: `reports/static/report.ui.js:6097-6150`

- [ ] **Step 1: Tighten the compact chart test around the new flat body structure**

Extend the existing compact chart test in `tests/ui/salary-chart-mode.test.js` so it asserts the old nesting is gone and the new flat section structure is present:

```js
assert.equal((html.match(/salary-summary-chart-currency-card/g) || []).length, 0);
assert.equal((html.match(/salary-summary-chart-currencies/g) || []).length, 0);
assert.equal((html.match(/salary-summary-chart-body salary-summary-chart-body-points/g) || []).length, 1);
assert.equal((html.match(/salary-summary-chart-currency-section/g) || []).length, 3);
assert.equal((html.match(/salary-summary-chart-currency-head/g) || []).length, 3);
```

- [ ] **Step 2: Run the focused test file to verify the stronger HTML assertions fail first**

Run: `node tests\ui\salary-chart-mode.test.js`

Expected: FAIL because the compact chart still renders `salary-summary-chart-currencies` and `salary-summary-chart-currency-card`.

- [ ] **Step 3: Replace nested currency cards with flat sections in the compact renderer**

Update only the `if (currencyModels.length)` branch in `buildTotalsSalarySummaryChartHtml(...)`:

```js
return '<div class="salary-summary-chart salary-summary-chart-compact salary-summary-chart-points">' +
    '<div class="salary-summary-chart-head">' +
        '<div class="salary-summary-chart-title">' + escapeHtml(String(summary.title || ((summary.metricLabel ? String(summary.metricLabel) + ' зарплаты' : 'Средняя зарплата')))) + '</div>' +
    '</div>' +
    (legend.length ? '<div class="salary-summary-chart-legend salary-summary-chart-legend-text">' + legend.map(function(item) {
        var color = String(item && item.color || '#94a3b8');
        return '<div class="salary-summary-chart-legend-item">' +
            '<span class="salary-summary-chart-legend-label" style="color:' + escapeHtml(color) + ';">' + escapeHtml(item && item.label || '—') + '</span>' +
        '</div>';
    }).join('') + '</div>' : '') +
    '<div class="salary-summary-chart-body salary-summary-chart-body-points">' +
        currencyModels.map(function(currencyModel) {
            var rows = Array.isArray(currencyModel && currencyModel.statuses) ? currencyModel.statuses : [];
            return '<section class="salary-summary-chart-currency-section">' +
                '<div class="salary-summary-chart-currency-head">' +
                    '<div class="salary-summary-chart-currency-name">' + escapeHtml(currencyModel && currencyModel.currency || '—') + '</div>' +
                '</div>' +
                pointRowsHtml(rows) +
            '</section>';
        }).join('') +
    '</div>' +
'</div>';
```

Keep the non-compact `hasPointChart` branch unchanged.

- [ ] **Step 4: Re-run the focused test file to verify the flat renderer passes**

Run: `node tests\ui\salary-chart-mode.test.js`

Expected: PASS with no `salary-summary-chart-currency-card` or `salary-summary-chart-currencies` in compact output.

- [ ] **Step 5: Commit the renderer refactor**

```bash
git add tests/ui/salary-chart-mode.test.js reports/report.ui.js reports/static/report.ui.js
git commit -m "feat: flatten compact salary overview chart"
```

### Task 3: Update compact chart CSS and verify the real UI in DevTools

**Files:**
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Verify: real dashboard page rendering in Chrome DevTools

- [ ] **Step 1: Add CSS expectations to the plan and keep scope on compact point charts**

Prepare to remove only the compact-only nesting styles and add flat section / vertical row positioning styles. The non-compact selectors like `.salary-summary-chart-line`, `.salary-summary-chart-point`, and `.salary-summary-chart-empty` should remain, but compact overrides should change.

- [ ] **Step 2: Update compact chart CSS for flat sections and vertical rows**

Replace the compact nesting styles in `reports/styles.css` and `reports/static/styles.css` with compact-scoped flat-section rules:

```css
.salary-summary-chart-compact .salary-summary-chart-body-points {
    gap: 14px;
}

.salary-summary-chart-currency-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(226, 232, 240, 0.9);
}

.salary-summary-chart-currency-section:first-child {
    padding-top: 0;
    border-top: 0;
}

.salary-summary-chart-compact .salary-summary-chart-line {
    min-height: 74px;
}

.salary-summary-chart-compact .salary-summary-chart-line-track {
    top: 46px;
}

.salary-summary-chart-compact .salary-summary-chart-point {
    top: calc(var(--salary-point-row, 0) * 12px);
    gap: 3px;
}

.salary-summary-chart-compact .salary-summary-chart-empty {
    top: 26px;
}
```

Remove no-longer-used selectors if they are now dead in both CSS files:

```css
.salary-summary-chart-currencies { ... }
.salary-summary-chart-currency-card { ... }
```

- [ ] **Step 3: Run both UI test files after CSS-adjacent changes**

Run:

```bash
node tests\ui\salary-chart-mode.test.js
node tests\ui\salary-progress-panels.test.js
```

Expected: PASS. `salary-progress-panels` remains green to prove the compact chart refactor did not regress the separate salary progress renderer.

- [ ] **Step 4: Verify the real dashboard in DevTools on desktop and mobile widths**

Use Chrome DevTools against the local report page and verify:

```text
1. Open the dashboard page that contains the overview salary chart.
2. Inspect the compact salary chart DOM and confirm `.salary-summary-chart-currency-section` exists while `.salary-summary-chart-currency-card` does not.
3. Check a dense row where two or more labels are close in value and confirm adjacent points use different `--salary-point-row` values.
4. Resize to a narrow mobile viewport and confirm labels, markers, and track still do not overlap.
5. If overlap remains, adjust only the compact constants first: `minHorizontalGap`, `maxRows`, compact line height, compact track top.
```

- [ ] **Step 5: Commit the CSS and verified UI pass**

```bash
git add reports/styles.css reports/static/styles.css reports/report.ui.js reports/static/report.ui.js tests/ui/salary-chart-mode.test.js
git commit -m "style: prevent compact salary point overlap"
```

### Self-Review Checklist

- [ ] The plan covers all spec areas: flat compact DOM, anti-overlap helper, CSS updates, automated tests, DevTools verification.
- [ ] No task changes salary data calculation semantics; only presentation and point layout are touched.
- [ ] Every production-code change is preceded by a failing test step.
- [ ] Every file path in the plan exists in the repo today and matches the current renderer/test split.
