# Salary Inline Drilldown Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Новые` appear only after clicking `Активные`, make `Опубл. и архивир.` appear only after clicking `Архивные`, and hide empty parent rows in the dashboard salary module.

**Architecture:** Keep the existing `salary-module` renderer and add inline parent/child row behavior inside each currency section. Parent rows remain part of the current list; child rows become conditionally rendered drilldowns controlled by local per-currency expansion state and lightweight DOM event binding.

**Tech Stack:** Vanilla JS UI renderers, shared CSS stylesheets, Node-based UI regression tests, browser verification on local `report.html`.

---

## File Map

- `reports/report.ui.js`
  Runtime salary-module renderer and any inline row interaction binding.
- `reports/static/report.ui.js`
  Static mirror of the runtime salary-module renderer and interaction binding.
- `reports/styles.css`
  Styles for clickable parent rows and visually secondary child rows.
- `reports/static/styles.css`
  Static mirror of salary-module row styles.
- `tests/ui/salary-overview-chart.test.js`
  Regression coverage for parent visibility, collapsed-by-default children, and inline drilldown ordering.

### Task 1: Update Salary Row Rendering Rules

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`

- [ ] **Step 1: Write the failing UI regression tests for hidden children and missing empty parents**

```js
runTest('buildSalaryOverviewChartHtml hides child rows by default and omits empty parent rows', () => {
  const html = buildSalaryOverviewChartHtml({
    currencies: [
      {
        currency: 'RUR',
        expanded: true,
        statuses: [
          { statusKey: 'open', statusLabel: 'Активные', points: [{ label: 'No experience', color: '#00C3D3', valueLabel: '50K', leftPct: 0, pointRow: 0 }] },
          { statusKey: 'new', statusLabel: 'Новые', points: [] },
          { statusKey: 'archived', statusLabel: 'Архивные', points: [] },
          { statusKey: 'period_archived', statusLabel: 'Опубл. и архивир.', points: [] }
        ]
      }
    ]
  });

  assert.match(html, /salary-module-status-row is-parent/);
  assert.match(html, /data-status-key="open"/);
  assert.match(html, /data-child-key="new"/);
  assert.doesNotMatch(html, /data-status-key="archived"/);
  assert.doesNotMatch(html, /Опубл. и архивир\./);
  assert.doesNotMatch(html, /salary-module-status-row is-child is-visible/);
});
```

- [ ] **Step 2: Run the salary UI regression test and verify it fails**

Run: `node tests\ui\salary-overview-chart.test.js`

Expected: FAIL because child rows are currently always rendered in the flat list and empty parent filtering is not parent-aware.

- [ ] **Step 3: Implement parent/child row selection in the runtime salary renderer**

```js
function partitionSalaryStatusRows(statuses) {
    var ordered = orderSalaryStatusRows(statuses);
    var byKey = {};
    ordered.forEach(function(row) {
        byKey[String(row && row.statusKey || '')] = row;
    });
    var parents = [];
    if (byKey.open && Array.isArray(byKey.open.points) && byKey.open.points.length) {
        parents.push({ row: byKey.open, child: byKey.new || null, childKey: 'new' });
    }
    if (byKey.archived && Array.isArray(byKey.archived.points) && byKey.archived.points.length) {
        parents.push({ row: byKey.archived, child: byKey.period_archived || null, childKey: 'period_archived' });
    }
    return parents;
}
```

Use it inside `buildCurrencySectionHtml(currencyRow)` so it renders:

- only parent rows with non-empty points
- each child row only as hidden inline markup directly after its parent
- no standalone `new` / `period_archived` row in the top-level list

- [ ] **Step 4: Mirror the same rendering logic in the static salary renderer**

```js
function partitionSalaryStatusRows(statuses) {
    var ordered = orderSalaryStatusRows(statuses);
    var byKey = {};
    ordered.forEach(function(row) {
        byKey[String(row && row.statusKey || '')] = row;
    });
    var parents = [];
    if (byKey.open && Array.isArray(byKey.open.points) && byKey.open.points.length) {
        parents.push({ row: byKey.open, child: byKey.new || null, childKey: 'new' });
    }
    if (byKey.archived && Array.isArray(byKey.archived.points) && byKey.archived.points.length) {
        parents.push({ row: byKey.archived, child: byKey.period_archived || null, childKey: 'period_archived' });
    }
    return parents;
}
```

- [ ] **Step 5: Re-run the salary UI regression and verify it passes**

Run: `node tests\ui\salary-overview-chart.test.js`

Expected: PASS

- [ ] **Step 6: Commit the rendering-rule changes**

```bash
git add tests/ui/salary-overview-chart.test.js reports/report.ui.js reports/static/report.ui.js
git commit -m "feat: add salary inline child rows"
```

### Task 2: Add Inline Click Behavior And Secondary Child Styling

**Files:**
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression expectations for clickable parent rows and child styling hooks**

```js
assert.match(html, /salary-module-status-row is-parent is-collapsible/);
assert.match(html, /salary-module-status-toggle/);
assert.match(html, /salary-module-status-row is-child/);
assert.match(html, /hidden/);
assert.match(styles, /\.salary-module-status-row\.is-parent\s*\{/);
assert.match(styles, /\.salary-module-status-row\.is-child\s*\{/);
assert.match(styles, /\.salary-module-status-toggle\s*\{/);
```

- [ ] **Step 2: Run the salary regression test and verify it fails**

Run: `node tests\ui\salary-overview-chart.test.js`

Expected: FAIL because the parent/child state classes and toggle hook are not yet present.

- [ ] **Step 3: Add parent-row buttons and hidden child rows in the runtime renderer**

```js
return '<div class="salary-module-status-row is-parent is-collapsible" data-status-key="' + escapeHtml(parentKey) + '">' +
    '<button type="button" class="salary-module-status-toggle" data-toggle-child="' + escapeHtml(childKey) + '">' +
        '<span class="salary-module-status-label">' + escapeHtml(parentLabel) + '</span>' +
    '</button>' +
    trackHtml +
'</div>' +
childHtml;
```

Where `childHtml` is rendered as:

```js
return '<div class="salary-module-status-row is-child" data-child-key="' + escapeHtml(childKey) + '" hidden>' +
    '<div class="salary-module-status-label">' + escapeHtml(childLabel) + '</div>' +
    childTrackHtml +
'</div>';
```

- [ ] **Step 4: Add local click binding for salary drilldown rows in the runtime UI**

```js
function bindSalaryOverviewInteractions(block) {
    if (!block) return;
    block.querySelectorAll('.salary-module-status-toggle').forEach(function(toggle) {
        if (toggle.dataset.bound === '1') return;
        toggle.dataset.bound = '1';
        toggle.addEventListener('click', function() {
            var parentRow = toggle.closest('.salary-module-status-row.is-parent');
            var currencyPanel = toggle.closest('.salary-module-currency-panel');
            var childKey = String(toggle.dataset.toggleChild || '').trim();
            if (!currencyPanel || !childKey) return;
            var childRow = currencyPanel.querySelector('.salary-module-status-row.is-child[data-child-key="' + childKey + '"]');
            if (!childRow) return;
            var nextExpanded = childRow.hasAttribute('hidden');
            childRow.toggleAttribute('hidden', !nextExpanded);
            parentRow.classList.toggle('is-expanded', nextExpanded);
        });
    });
}
```

Call this after rendering the salary module in the same place current salary UI post-processing is attached.

- [ ] **Step 5: Mirror the click binding in the static UI file**

```js
function bindSalaryOverviewInteractions(block) {
    if (!block) return;
    block.querySelectorAll('.salary-module-status-toggle').forEach(function(toggle) {
        if (toggle.dataset.bound === '1') return;
        toggle.dataset.bound = '1';
        toggle.addEventListener('click', function() {
            var parentRow = toggle.closest('.salary-module-status-row.is-parent');
            var currencyPanel = toggle.closest('.salary-module-currency-panel');
            var childKey = String(toggle.dataset.toggleChild || '').trim();
            if (!currencyPanel || !childKey) return;
            var childRow = currencyPanel.querySelector('.salary-module-status-row.is-child[data-child-key="' + childKey + '"]');
            if (!childRow) return;
            var nextExpanded = childRow.hasAttribute('hidden');
            childRow.toggleAttribute('hidden', !nextExpanded);
            parentRow.classList.toggle('is-expanded', nextExpanded);
        });
    });
}
```

- [ ] **Step 6: Add secondary child-row styles and clickable parent styles in both stylesheets**

```css
.salary-module-status-row.is-parent {
    align-items: start;
}

.salary-module-status-row.is-collapsible .salary-module-status-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    cursor: pointer;
}

.salary-module-status-row.is-child {
    padding-left: 18px;
}

.salary-module-status-row.is-child .salary-module-status-label {
    color: var(--text-secondary);
    font-size: 0.74rem;
}
```

- [ ] **Step 7: Re-run the salary regression tests and verify they pass**

Run: `node tests\ui\salary-overview-chart.test.js`

Expected: PASS

- [ ] **Step 8: Commit the interaction and styling changes**

```bash
git add tests/ui/salary-overview-chart.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: add salary row drilldown toggles"
```

### Task 3: Browser Verification

**Files:**
- Modify: none
- Verify: `http://127.0.0.1:9000/report.html`

- [ ] **Step 1: Run the focused verification suite**

Run: `node tests\ui\salary-overview-chart.test.js`

Expected: PASS

- [ ] **Step 2: Rebuild the dashboard page if needed and verify in browser**

Run: `docker compose up -d --build report-to-db`

Expected: report page rebuilds successfully

- [ ] **Step 3: Verify inline salary behavior in browser**

Check on `http://127.0.0.1:9000/report.html`:

- `Новые` is hidden by default
- `Опубл. и архивир.` is hidden by default
- clicking `Активные` reveals `Новые` directly below
- clicking `Архивные` reveals `Опубл. и архивир.` directly below
- empty parent rows do not render

- [ ] **Step 4: Commit any final polish if browser verification requires it**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/salary-overview-chart.test.js
git commit -m "fix: polish salary inline drilldown rows"
```
