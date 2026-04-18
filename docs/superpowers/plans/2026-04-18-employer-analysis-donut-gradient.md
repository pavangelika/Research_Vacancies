# Employer Analysis Donut-Gradient Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the employer-analysis salary chart with the donut chart by tightening title spacing, removing chart grid lines, and applying donut-matched gradient fills per employer factor.

**Architecture:** Keep Plotly as the rendering engine for employer-analysis and add a focused post-render SVG gradient pass for the chart bars. Reuse existing donut palette values and scope all spacing/grid changes to the employer-analysis salary chart so other dashboard charts remain unchanged.

**Tech Stack:** Vanilla JavaScript, Plotly, dashboard CSS, Node-based UI regression checks

---

### Task 1: Add a focused regression check for employer-analysis chart config

**Files:**
- Modify: `tests/ui/chart-font-regression.test.js`
- Test: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Write the failing test**

Add assertions that inspect the employer-analysis render helpers and CSS text for the three requested changes:

```js
assert(
  reportUiSource.includes("composeChartTitle('Анализ работодателей · ' + metricLabel + ' зарплата (' + currencyLabel + ')', chartContext)"),
  'employer-analysis salary chart title should still be built in the dedicated employer chart renderer'
);
assert(
  reportUiSource.includes("showgrid: false") && reportUiSource.includes("zeroline: false"),
  'employer-analysis salary chart axes should disable grid and zero lines'
);
assert(
  reportUiSource.includes('applyEmployerAnalysisBarGradients') || reportUiSource.includes('ensureEmployerAnalysisBarGradients'),
  'employer-analysis salary chart should apply donut-style SVG gradients after Plotly render'
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .\tests\ui\chart-font-regression.test.js`
Expected: FAIL because the employer-analysis gradient helper does not exist yet and the salary chart still relies on the old flat-color path.

- [ ] **Step 3: Write minimal implementation in the test file**

Extend the existing source-based regression script so it loads:

```js
const reportUiSource = fs.readFileSync(path.join(repoRoot, 'reports', 'report.ui.js'), 'utf8');
const staticReportUiSource = fs.readFileSync(path.join(repoRoot, 'reports', 'static', 'report.ui.js'), 'utf8');
```

Then add the same employer-analysis assertions for both files:

```js
[
  ['reports/report.ui.js', reportUiSource],
  ['reports/static/report.ui.js', staticReportUiSource],
].forEach(([label, source]) => {
  assert(source.includes('showgrid: false'), `${label} should disable employer-analysis grid lines`);
  assert(source.includes('zeroline: false'), `${label} should disable employer-analysis zero lines`);
  assert(
    source.includes('applyEmployerAnalysisBarGradients') || source.includes('ensureEmployerAnalysisBarGradients'),
    `${label} should include an employer-analysis gradient post-render helper`
  );
});
```

- [ ] **Step 4: Run test to verify it passes once implementation is done**

Run: `node .\tests\ui\chart-font-regression.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/ui/chart-font-regression.test.js
git commit -m "test: cover employer analysis chart gradients"
```

### Task 2: Update employer-analysis chart rendering to remove grid and reduce title gap

**Files:**
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Test: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Write the failing test**

Add explicit string checks for the dedicated employer-analysis Plotly layout:

```js
assert(
  reportUiSource.includes("margin: { t: 28, r: 16, b: 40, l: 220 }"),
  'employer-analysis salary chart should use a tighter top margin'
);
assert(
  reportUiSource.includes("xaxis: { title: 'Зарплата, ' + currencyLabel, automargin: true, showgrid: false, zeroline: false }"),
  'employer-analysis salary chart x-axis should explicitly disable grid and zeroline'
);
assert(
  reportUiSource.includes("yaxis: { title: '', automargin: true, autorange: 'reversed', showgrid: false, zeroline: false }"),
  'employer-analysis salary chart y-axis should explicitly disable grid and zeroline'
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .\tests\ui\chart-font-regression.test.js`
Expected: FAIL because the current layout still has `margin.t: 56` and does not explicitly disable both axes grid lines.

- [ ] **Step 3: Write minimal implementation**

In both `reports/report.ui.js` and `reports/static/report.ui.js`, update the employer-analysis Plotly layout inside the salary chart renderer from:

```js
    Plotly.react(graph.__chartHostEl, [{
        type: 'bar',
        orientation: 'h',
        x: values,
        y: labels,
        marker: { color: colors, line: { width: 0 } },
```

to a layout that explicitly disables grid/zero lines and tightens the title gap:

```js
    Plotly.react(graph.__chartHostEl, [{
        type: 'bar',
        orientation: 'h',
        x: values,
        y: labels,
        marker: { color: colors, line: { width: 0 } },
```

and:

```js
    }], {
        title: { text: composeChartTitle('Анализ работодателей · ' + metricLabel + ' зарплата (' + currencyLabel + ')', chartContext), x: 0.5, xanchor: 'center' },
        xaxis: { title: 'Зарплата, ' + currencyLabel, automargin: true, showgrid: false, zeroline: false },
        yaxis: { title: '', automargin: true, autorange: 'reversed', showgrid: false, zeroline: false },
        margin: { t: 28, r: 16, b: 40, l: 220 },
        height: 420,
        showlegend: false
    }, { responsive: true, displayModeBar: false });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node .\tests\ui\chart-font-regression.test.js`
Expected: PASS for the new spacing/grid assertions

- [ ] **Step 5: Commit**

```bash
git add reports/report.ui.js reports/static/report.ui.js tests/ui/chart-font-regression.test.js
git commit -m "feat: tighten employer analysis chart layout"
```

### Task 3: Apply donut-matched gradient fills to employer-analysis bars by factor

**Files:**
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Test: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Write the failing test**

Add assertions for the factor-to-gradient mapping helper:

```js
assert(
  reportUiSource.includes("if (factorKey === 'accreditation')"),
  'employer-analysis gradient mapping should handle accreditation'
);
assert(
  reportUiSource.includes("if (factorKey === 'cover_letter_required')"),
  'employer-analysis gradient mapping should handle cover-letter-required'
);
assert(
  reportUiSource.includes("if (factorKey === 'has_test')"),
  'employer-analysis gradient mapping should handle has_test'
);
assert(
  reportUiSource.includes("if (factorKey === 'rating_bucket')"),
  'employer-analysis gradient mapping should handle rating_bucket'
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node .\tests\ui\chart-font-regression.test.js`
Expected: FAIL because the employer chart still derives bar colors from `palette.light`, `palette.dark`, and `palette.medium`.

- [ ] **Step 3: Write minimal implementation**

In both JS files, replace the current color assignment loop:

```js
    var labels = [];
    var values = [];
    var colors = [];
```

with factor-aware metadata:

```js
    var labels = [];
    var values = [];
    var colors = [];
    var factorKeys = [];
```

and update row collection:

```js
        var factorKey = normalizeEmployerFactor(String(row.dataset.factor || row.dataset.factorLabel || '').trim());
        labels.push(factorLabel + ': ' + valueLabel);
        values.push(value);
        factorKeys.push(factorKey);
        colors.push(getEmployerAnalysisGradientFallbackColor(factorKey));
```

Add dedicated helpers near the employer-analysis utilities:

```js
function getEmployerAnalysisGradientStops(factorKey) {
    if (factorKey === 'accreditation') return ['#00C3D3', '#007AD8'];
    if (factorKey === 'cover_letter_required') return ['#8fe9f7', '#5f95ff'];
    if (factorKey === 'has_test') return ['#f38bff', '#8b5cf6'];
    if (factorKey === 'rating_bucket') return ['#efc3ff', '#b58cff'];
    return ['#00C3D3', '#007AD8'];
}

function getEmployerAnalysisGradientFallbackColor(factorKey) {
    return getEmployerAnalysisGradientStops(factorKey)[1];
}
```

After each successful Plotly render, apply SVG gradients:

```js
function applyEmployerAnalysisBarGradients(host, factorKeys) {
    if (!host || !Array.isArray(factorKeys) || !factorKeys.length) return;
    var svg = host.querySelector('svg');
    if (!svg) return;
    var ns = 'http://www.w3.org/2000/svg';
    var defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(ns, 'defs'), svg.firstChild);
    var bars = Array.from(svg.querySelectorAll('.barlayer .trace.bars path'));
    bars.forEach(function(bar, index) {
        var factorKey = factorKeys[index] || 'accreditation';
        var stops = getEmployerAnalysisGradientStops(factorKey);
        var gradientId = 'employer-analysis-gradient-' + factorKey + '-' + index;
        var gradient = svg.querySelector('#' + gradientId);
        if (!gradient) {
            gradient = document.createElementNS(ns, 'linearGradient');
            gradient.setAttribute('id', gradientId);
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '100%');
            gradient.setAttribute('y2', '0%');
            defs.appendChild(gradient);
        }
        gradient.innerHTML = '';
        stops.forEach(function(color, stopIndex) {
            var stop = document.createElementNS(ns, 'stop');
            stop.setAttribute('offset', stopIndex === 0 ? '0%' : '100%');
            stop.setAttribute('stop-color', color);
            gradient.appendChild(stop);
        });
        bar.style.fill = 'url(#' + gradientId + ')';
    });
}
```

Then call it immediately after `Plotly.react()` / `Plotly.newPlot()`:

```js
    applyEmployerAnalysisBarGradients(graph.__chartHostEl, factorKeys);
```

For CSS, add a scoped helper only if needed for host stability:

```css
.employer-analysis-chart-host {
    width: 100%;
    min-width: 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node .\tests\ui\chart-font-regression.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/chart-font-regression.test.js
git commit -m "feat: add donut gradients to employer analysis chart"
```

### Task 4: Validate on the live report and inspect the final SVG in DevTools

**Files:**
- Modify: none
- Test: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Run the focused regression test**

Run: `node .\tests\ui\chart-font-regression.test.js`
Expected: PASS

- [ ] **Step 2: Reload the local report and inspect employer-analysis**

Run the local report server if needed, open the report, and verify:

```text
- chart title sits closer to the bars
- no grid lines are visible behind the employer-analysis salary chart
- accreditation, cover letter, has test, and rating bars each render with their assigned donut gradient family
```

- [ ] **Step 3: Inspect the SVG structure in DevTools**

Confirm:

```text
- the employer-analysis SVG contains gradient definitions in <defs>
- each rendered bar path has fill: url(#employer-analysis-gradient-...)
- other dashboard charts remain on their existing render path
```

- [ ] **Step 4: Record the final verification in the task notes**

Capture the commands run and the exact checks observed in DevTools.

- [ ] **Step 5: Commit**

```bash
git status --short
```

Expected: no unexpected files beyond the planned employer-analysis changes
