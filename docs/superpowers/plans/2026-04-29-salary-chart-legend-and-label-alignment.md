# Salary Chart Legend And Label Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard salary chart keep its legend in one horizontal row and render every value label centered above its point with a uniform vertical offset on desktop and mobile.

**Architecture:** Keep the existing salary data model and point color mapping intact, but simplify the presentation contract in the salary chart renderer. The fix is limited to the salary chart template and CSS so the legend becomes a non-wrapping horizontal row and point values no longer rely on side-based placement.

**Tech Stack:** Vanilla JavaScript, static HTML string rendering in `reports/static/report.ui.js`, CSS in `reports/styles.css`, Node.js UI regression tests in `tests/ui`.

---

### Task 1: Lock The New Markup Contract With A Failing Test

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Test: `tests/ui/salary-overview-chart.test.js`

- [ ] **Step 1: Write the failing test**

Add assertions to the existing `buildSalaryOverviewChartHtml renders flat currency sections and side labels for points` test so it instead checks the new contract:

```js
  assert.match(html, /donut-legend salary-module-legend/);
  assert.match(html, /salary-module-track-point-label is-centered-above/);
  assert.doesNotMatch(html, /salary-module-track-point-label is-side-right/);
  assert.doesNotMatch(html, /salary-module-track-point-label is-side-left/);
  assert.doesNotMatch(html, /data-label-side=/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/ui/salary-overview-chart.test.js`
Expected: FAIL because the current renderer still emits `is-side-right` / `is-side-left` label classes and `data-label-side`.

- [ ] **Step 3: Commit the failing test state only after implementation is done**

Do not commit during red state. Keep moving to Task 2.

### Task 2: Simplify Salary Point Label Rendering

**Files:**
- Modify: `reports/static/report.ui.js`
- Test: `tests/ui/salary-overview-chart.test.js`

- [ ] **Step 1: Replace side-based label class emission with a single centered-above class**

In the salary point HTML builder, replace:

```js
                    '<span class="salary-module-track-point-label ' + placement.sideClass + '" data-label-slot="' + escapeHtml(String(placement.slot || 0)) + '" data-label-side="' + escapeHtml(placement.sideClass) + '">' +
```

with:

```js
                    '<span class="salary-module-track-point-label is-centered-above" data-label-slot="' + escapeHtml(String(placement.slot || 0)) + '">' +
```

- [ ] **Step 2: Keep the value color mapping untouched**

Do not change:

```js
var valueStyle = 'color:' + pointColor + ';';
```

and do not change the dot color / gradient generation.

- [ ] **Step 3: Run test to verify the HTML contract passes**

Run: `node tests/ui/salary-overview-chart.test.js`
Expected: PASS for the updated HTML contract assertions, but CSS behavior is not yet verified.

### Task 3: Make The Legend One Row And Center Value Labels Above Points

**Files:**
- Modify: `reports/styles.css`
- Test: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Update legend layout to one horizontal row without wrapping**

Adjust `.salary-module-legend` to enforce one row:

```css
.salary-module-legend {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.75rem;
    overflow-x: auto;
    overflow-y: hidden;
}
```

- [ ] **Step 2: Replace side-based point label positioning with centered-above positioning**

Update the label rules so the centered mode is the only active behavior:

```css
.salary-module-track-point-label {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 0.375rem);
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    pointer-events: none;
}

.salary-module-track-point-label.is-centered-above {
    left: 50%;
    right: auto;
    bottom: calc(100% + 0.375rem);
    transform: translateX(-50%);
}
```

- [ ] **Step 3: Neutralize obsolete side-specific CSS so it no longer affects layout**

Either remove or stop using:

```css
.salary-module-track-point-label.is-side-right { ... }
.salary-module-track-point-label.is-side-left { ... }
```

The resulting stylesheet must leave the centered-above class as the active layout path.

- [ ] **Step 4: Run the chart-related UI regression tests**

Run:

```powershell
node tests/ui/salary-overview-chart.test.js
node tests/ui/chart-font-regression.test.js
```

Expected: both commands PASS.

### Task 4: Browser Verification On Desktop And Mobile

**Files:**
- Verify: `reports/report.html`
- Verify: `reports/static/report.ui.js`
- Verify: `reports/styles.css`

- [ ] **Step 1: Open the local report in a desktop viewport**

Check:

```text
- legend items stay on a single horizontal row
- point colors match legend colors
- every value label is centered above its point
- every value label has the same vertical offset
```

- [ ] **Step 2: Open the same report in a mobile viewport**

Check the same four conditions again and confirm mobile does not reintroduce side placement or wrapped legend items.

- [ ] **Step 3: Commit the fix**

```bash
git add tests/ui/salary-overview-chart.test.js reports/static/report.ui.js reports/styles.css docs/superpowers/specs/2026-04-29-salary-chart-legend-and-label-alignment-design.md docs/superpowers/plans/2026-04-29-salary-chart-legend-and-label-alignment.md
git commit -m "fix: align salary chart legend and labels"
```

