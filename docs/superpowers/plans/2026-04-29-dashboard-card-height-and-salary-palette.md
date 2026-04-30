# Dashboard Card Height And Salary Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all dashboard overview cards equal height on desktop with centered body content under a top-aligned title, and switch the salary chart to use the main `:root` palette colors.

**Architecture:** Update the shared dashboard overview card layout rules in CSS so equal height is achieved through the existing grid/flex structure rather than JS measurements. Then replace the salary chart’s local color array with palette-backed colors in both source and static renderers, keeping the existing chart structure intact.

**Tech Stack:** Vanilla JS, CSS, Node-based UI regression tests, browser verification in Chrome DevTools

---

### Task 1: Normalize Dashboard Card Height And Vertical Alignment

**Files:**
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Update the desktop overview layout so cards can stretch to equal height**

Adjust the overview wrappers so both columns stretch their child cards to the full available track height on desktop.

Target direction:

```css
.dashboard-overview {
    align-items: stretch;
}

.dashboard-overview-column {
    height: 100%;
}
```

- [ ] **Step 2: Convert dashboard cards into a top-title plus flexible body contract**

Make `.dashboard-card` a full-height flex container where the title stays at the top and the remaining content area can center itself vertically.

Target direction:

```css
.dashboard-card {
    height: 100%;
    min-height: 0;
}

.dashboard-card-body,
.dashboard-chart-host-funnel,
.totals-employer-overview-graph,
.totals-burnup-graph,
.salary-module {
    flex: 1 1 auto;
}
```

- [ ] **Step 3: Center card content vertically below the title without moving the title**

Apply vertical centering only to the body/content region, not to `.dashboard-card-title`.

Target direction:

```css
.dashboard-card-body,
.dashboard-chart-host-funnel,
.totals-employer-overview-graph,
.totals-burnup-graph {
    display: flex;
    flex-direction: column;
    justify-content: center;
}
```

If a host container already needs a more specific layout, adapt the rule rather than forcing a generic one that breaks the chart.

- [ ] **Step 4: Keep mobile in natural-height mode**

Inside the mobile breakpoint, explicitly avoid the equal-height desktop behavior.

Target direction:

```css
@media (max-width: 900px) {
    .dashboard-card {
        height: auto;
    }
}
```

- [ ] **Step 5: Mirror the same card-layout rules in `reports/static/styles.css`**

Keep the browser-loaded stylesheet synchronized with the source stylesheet.

### Task 2: Move Salary Chart Colors To The Main Palette

**Files:**
- Modify: `reports/static/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Test: `tests/ui/salary-overview-chart.test.js`

- [ ] **Step 1: Replace the local salary color array with palette-backed values**

Update `SALARY_GRADIENT_COLORS` so the salary chart draws from the main dashboard palette instead of standalone local hues.

Target shape:

```js
var SALARY_GRADIENT_COLORS = [
    'var(--palette-cyan)',
    'var(--palette-blue)',
    'var(--palette-purple)',
    'var(--palette-orange)',
    'var(--palette-green)'
];
```

If ordering looks better with a slightly different sequence, keep the source limited to the main `:root` palette only.

- [ ] **Step 2: Mirror the salary color array change in the static renderer**

Apply the same update in `reports/static/report.ui.js`.

- [ ] **Step 3: Keep salary points and labels flat**

Do not reintroduce gradient text or gradient dots. The salary chart should continue using flat `background:` and `color:` styles, but now with the main palette values.

- [ ] **Step 4: Update salary regression expectations if needed**

If current tests encode the old salary color source, update them to assert flat rendering and palette-based color usage instead of old local hues.

Suggested assertion direction:

```js
assert.match(source, /var SALARY_GRADIENT_COLORS = \\[/);
assert.match(source, /var\\(--palette-cyan\\)/);
assert.match(source, /var\\(--palette-blue\\)/);
assert.match(source, /var\\(--palette-purple\\)/);
```

### Task 3: Verify Desktop And Mobile Behavior

**Files:**
- Test: `tests/ui/salary-overview-chart.test.js`
- Test: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Run the UI regression tests**

Run:

```powershell
node tests/ui/salary-overview-chart.test.js
node tests/ui/chart-font-regression.test.js
```

Expected: both commands PASS.

- [ ] **Step 2: Verify desktop equal-height behavior in the browser**

Check that:

- all dashboard overview cards have the same rendered height
- titles remain top-aligned
- content below titles is vertically centered within the card area
- graphs still stay inside their containers

- [ ] **Step 3: Verify mobile behavior in the browser**

Check that:

- cards return to natural height on mobile
- no excessive empty vertical space appears
- salary chart still renders correctly with palette-based colors

- [ ] **Step 4: Commit**

```bash
git add reports/styles.css reports/static/styles.css reports/static/report.ui.js reports/static/report.ui.js tests/ui/salary-overview-chart.test.js tests/ui/chart-font-regression.test.js
git commit -m "feat: align dashboard card heights and unify salary palette"
```

