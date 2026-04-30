# Dashboard Chart Readability And Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve dashboard chart readability and ordering so legends stay inside cards, salary labels and rows align correctly, the salary card moves after work format, and employer-analysis/lifetime charts render cleanly on desktop and mobile.

**Architecture:** Keep data and analytics logic unchanged and limit the work to report rendering, card ordering, chart config, and CSS contracts. Update both `reports/*` and `reports/static/*` so repository source and browser-served assets stay consistent.

**Tech Stack:** Vanilla JavaScript, Plotly, static HTML string rendering, CSS, Node.js UI regression tests, browser verification in Chrome DevTools.

---

### Task 1: Lock Updated Salary Chart Markup Expectations

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Test: `tests/ui/salary-overview-chart.test.js`

- [ ] **Step 1: Write the failing test**

Extend the existing salary overview HTML test to require the wrapped legend contract and reduced-gap centered label contract:

```js
  assert.match(html, /salary-module-track-point-label is-centered-above/);
  assert.doesNotMatch(html, /data-label-side=/);
```

Keep the legend root assertion:

```js
  assert.match(html, /donut-legend salary-module-legend/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/ui/salary-overview-chart.test.js`
Expected: FAIL if any stale side-based label contract remains.

- [ ] **Step 3: Do not commit red state**

Proceed directly to implementation.

### Task 2: Update Salary Module Layout And Legend Behavior

**Files:**
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/static/styles.css`
- Test: `tests/ui/salary-overview-chart.test.js`

- [ ] **Step 1: Keep centered-above salary labels and reduce vertical gap by 50%**

Use the existing centered-above rendering and reduce the CSS gap from `6px` to `3px`:

```css
.salary-module-track-point-label {
    bottom: calc(100% + 3px);
}

.salary-module-track-point-label.is-centered-above {
    bottom: calc(100% + 3px);
}
```

- [ ] **Step 2: Make salary legend wrap instead of scroll**

Replace salary legend overflow scrolling with wrapping behavior:

```css
.salary-module-legend {
    flex-wrap: wrap;
    overflow-x: visible;
    overflow-y: visible;
}

.salary-module-legend .donut-legend-item {
    width: auto;
    min-width: 0;
    flex: 0 0 auto;
}

.salary-module-legend .donut-legend-label {
    white-space: nowrap;
}
```

- [ ] **Step 3: Align `Активные` and `Архивные` visually with the chart**

Adjust the salary module row/grid alignment so the label cell and track cell sit on the same visual baseline:

```css
.salary-module-status-row {
    align-items: center;
}

.salary-module-status-row.is-parent {
    align-items: center;
}
```

- [ ] **Step 4: Run salary regression test**

Run: `node tests/ui/salary-overview-chart.test.js`
Expected: PASS.

### Task 3: Move Salary Card After Work Format

**Files:**
- Modify: `reports/static/report.ui.js`
- Modify: `reports/static/report.ui.js`

- [ ] **Step 1: Locate dashboard card composition order**

Find the section renderer that assembles dashboard cards for the `Общее` tab and identify where `Формат работы` and `Зарплата` are appended.

- [ ] **Step 2: Reorder salary card**

Move the salary section append/render call so `Зарплата` is emitted immediately after `Формат работы`.

- [ ] **Step 3: Verify by reload**

Reload the report in the browser and confirm the card order changed.

### Task 4: Refine Employer Analysis Chart Title, Colors, And Clipping

**Files:**
- Modify: `reports/report.charts.js`
- Modify: `reports/static/report.charts.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Remove the redundant employer-analysis title text**

Find the code that sets `Анализ работодателей · Средняя зарплата (RUR)` and remove or suppress that visible title while leaving the chart intact.

- [ ] **Step 2: Improve dashboard-chart readability colors**

Adjust chart colors to a more readable dashboard-consistent palette:

```js
// Use darker text / line colors and clearer accents in the existing dashboard family,
// avoiding washed-out combinations.
```

This applies only to the affected dashboard charts, not unrelated report views.

- [ ] **Step 3: Ensure chart drawing stays clipped to the container**

Adjust chart/card CSS and Plotly layout if needed so lines or plot layers do not visually extend outside the card bounds.

- [ ] **Step 4: Verify employer-analysis title removal and clipping in browser**

Reload and confirm:

```text
- the title text is gone
- chart lines stay inside the container
- colors are more readable
```

### Task 5: Keep Lifetime Legend Inside The Card

**Files:**
- Modify: `reports/report.charts.js`
- Modify: `reports/static/report.charts.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Locate the `Вакансии / Ср. время жизни` legend config**

Find the Plotly legend/layout configuration for the lifetime chart.

- [ ] **Step 2: Adjust legend spacing and bounds**

Update layout/CSS so the legend stays inside the container and uses spacing consistent with other dashboard legend items.

- [ ] **Step 3: Verify no overflow**

Check in browser that the legend does not cross the container edge on desktop or mobile.

### Task 6: Run Verification

**Files:**
- Verify: `reports/static/report.ui.js`
- Verify: `reports/report.charts.js`
- Verify: `reports/styles.css`
- Verify: `reports/static/report.ui.js`
- Verify: `reports/static/report.charts.js`
- Verify: `reports/static/styles.css`
- Verify: `tests/ui/salary-overview-chart.test.js`

- [ ] **Step 1: Run regression tests**

Run:

```powershell
node tests/ui/salary-overview-chart.test.js
node tests/ui/chart-font-regression.test.js
```

Expected: PASS.

- [ ] **Step 2: Verify in desktop browser**

Confirm:

```text
- salary legend wraps only when needed and never scrolls horizontally
- salary labels remain centered above points with smaller gap
- `Активные` and `Архивные` align with the graph row
- salary card is after work format
- employer-analysis title text is removed
- chart lines do not escape card bounds
- lifetime legend stays inside its card
```

- [ ] **Step 3: Verify in mobile browser**

Confirm the same conditions again on mobile.

- [ ] **Step 4: Commit**

```bash
git add tests/ui/salary-overview-chart.test.js reports/static/report.ui.js reports/report.charts.js reports/styles.css reports/static/report.ui.js reports/static/report.charts.js reports/static/styles.css docs/superpowers/specs/2026-04-29-dashboard-chart-readability-and-order-design.md docs/superpowers/plans/2026-04-29-dashboard-chart-readability-and-order.md
git commit -m "fix: refine dashboard chart readability and order"
```

