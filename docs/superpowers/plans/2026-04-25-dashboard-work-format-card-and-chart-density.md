# Dashboard Work-Format Card And Chart Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `ONLINE` and `OFFLINE or HYBRID` into one compact shared card, increase chart density across the dashboard, and fix the vacancy donut total centering on mobile.

**Architecture:** Keep the current dashboard rendering pipeline and CSS system. Update the existing work-format helper in runtime and static UI, tighten the current chart/card spacing tokens instead of layering new wrappers, and adjust donut sizing/anchoring so the center label is tied to the ring geometry rather than the shell bounds.

**Tech Stack:** Vanilla JS UI renderers, shared CSS stylesheets, Node-based UI regression tests, browser verification via local `report.html`.

---

## File Map

- `reports/report.ui.js`
  Current runtime dashboard renderer. Modify the work-format card markup and donut shell sizing hooks here.
- `reports/static/report.ui.js`
  Static build mirror of the runtime dashboard renderer. Keep it in sync with `reports/report.ui.js`.
- `reports/styles.css`
  Runtime dashboard styles. Update the shared work-format card layout, compact KPI tiles, chart-area density, and donut mobile centering.
- `reports/static/styles.css`
  Static stylesheet mirror. Keep it in sync with `reports/styles.css`.
- `tests/ui/dashboard-compensation-availability.test.js`
  Update renderer/style expectations from two separate work-format cards to one shared two-column card.
- `tests/ui/dashboard-layout-regression.test.js`
  Extend layout expectations for tighter chart density and stronger donut mobile-centering constraints.
- `tests/ui/donut-legend-regression.test.js`
  Update donut shell expectations if shell sizing tokens or chart-area wrappers change.

### Task 1: Redesign The Work-Format KPI Card

**Files:**
- Modify: `tests/ui/dashboard-compensation-availability.test.js`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Write the failing regression test for the shared work-format card**

```js
function assertUiContracts(source, label) {
  assert.match(source, /function buildDashboardCompensationAvailabilityHtml\(summary\)/, `${label} should define the compensation KPI helper`);
  assert.match(source, /dashboard-work-format-card/, `${label} should render one shared work-format card`);
  assert.match(source, /dashboard-work-format-columns/, `${label} should render two work-format columns inside one card`);
  assert.match(source, /dashboard-work-format-column-title[^\\n]*ONLINE/, `${label} should render the ONLINE column title`);
  assert.match(source, /dashboard-work-format-column-title[^\\n]*OFFLINE or HYBRID/, `${label} should render the OFFLINE or HYBRID column title`);
  assert.match(source, /dashboard-work-format-grid/, `${label} should render a KPI tile grid per work-format column`);
  assert.match(source, /dashboard-work-format-tile/, `${label} should render compact KPI tiles`);
  assert.match(source, /RUR/, `${label} should expose the RUR split`);
  assert.match(source, /USD/, `${label} should expose the USD split`);
  assert.match(source, /EUR/, `${label} should expose the EUR split`);
  assert.match(source, /Другая/, `${label} should expose the OTHER split`);
  assert.doesNotMatch(source, /card\('ONLINE',\s*remote,/, `${label} should remove the standalone ONLINE card helper`);
  assert.doesNotMatch(source, /card\('OFFLINE or HYBRID',\s*nonRemote,/, `${label} should remove the standalone OFFLINE card helper`);
}

function assertStyleContracts(source, label) {
  assert.match(source, /\.dashboard-work-format-card\s*\{/, `${label} should style the shared work-format card`);
  assert.match(source, /\.dashboard-work-format-columns\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, `${label} should use two work-format columns`);
  assert.match(source, /\.dashboard-work-format-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, `${label} should use a 2x3 KPI tile grid`);
  assert.match(source, /\.dashboard-work-format-tile\s*\{/, `${label} should style compact KPI tiles`);
  assert.doesNotMatch(source, /\.dashboard-remote-section\s*\{/, `${label} should remove the old standalone remote section styles`);
}
```

- [ ] **Step 2: Run the compensation regression test and verify it fails**

Run: `node tests\ui\dashboard-compensation-availability.test.js`

Expected: FAIL with missing `dashboard-work-format-card` / `dashboard-work-format-columns` expectations because the renderer still emits two standalone cards.

- [ ] **Step 3: Implement the shared two-column work-format card in the runtime renderer**

```js
function buildDashboardCompensationAvailabilityHtml(summary) {
    var data = summary && summary.compensation_availability ? summary.compensation_availability : null;
    if (!data) return '';
    var remote = data.remote || {};
    var nonRemote = data.non_remote || {};
    function tile(label, value, note) {
        return '<div class="dashboard-work-format-tile">' +
            '<div class="dashboard-work-format-tile-label">' + escapeHtml(label) + '</div>' +
            '<div class="dashboard-work-format-tile-value">' + escapeHtml(String(value || 0)) + '</div>' +
            '<div class="dashboard-work-format-tile-note">' + escapeHtml(note || '0%') + '</div>' +
        '</div>';
    }
    function column(title, bucket) {
        var currencies = bucket && bucket.with_salary_currencies ? bucket.with_salary_currencies : {};
        return '<section class="dashboard-work-format-column">' +
            '<div class="dashboard-work-format-column-title">' + escapeHtml(title) + '</div>' +
            '<div class="dashboard-work-format-grid">' +
                tile('Всего', bucket && bucket.total, bucket && bucket.total_share_label) +
                tile('С з/п', bucket && bucket.with_salary, bucket && bucket.with_salary_share_label) +
                tile('RUR', currencies.RUR, bucket && bucket.with_salary_currency_share_labels && bucket.with_salary_currency_share_labels.RUR) +
                tile('USD', currencies.USD, bucket && bucket.with_salary_currency_share_labels && bucket.with_salary_currency_share_labels.USD) +
                tile('EUR', currencies.EUR, bucket && bucket.with_salary_currency_share_labels && bucket.with_salary_currency_share_labels.EUR) +
                tile('Другая', currencies.OTHER, bucket && bucket.with_salary_currency_share_labels && bucket.with_salary_currency_share_labels.OTHER) +
            '</div>' +
        '</section>';
    }
    return '<section class="dashboard-card dashboard-work-format-card">' +
        '<div class="dashboard-card-header"><h3>Формат работы</h3></div>' +
        '<div class="dashboard-card-body">' +
            '<div class="dashboard-work-format-columns">' +
                column('ONLINE', remote) +
                column('OFFLINE or HYBRID', nonRemote) +
            '</div>' +
        '</div>' +
    '</section>';
}
```

- [ ] **Step 4: Mirror the renderer change in the static UI file**

```js
function buildDashboardCompensationAvailabilityHtml(summary) {
    var data = summary && summary.compensation_availability ? summary.compensation_availability : null;
    if (!data) return '';
    var remote = data.remote || {};
    var nonRemote = data.non_remote || {};
    function tile(label, value, note) {
        return '<div class="dashboard-work-format-tile">' +
            '<div class="dashboard-work-format-tile-label">' + escapeHtml(label) + '</div>' +
            '<div class="dashboard-work-format-tile-value">' + escapeHtml(String(value || 0)) + '</div>' +
            '<div class="dashboard-work-format-tile-note">' + escapeHtml(note || '0%') + '</div>' +
        '</div>';
    }
    function column(title, bucket) {
        var currencies = bucket && bucket.with_salary_currencies ? bucket.with_salary_currencies : {};
        return '<section class="dashboard-work-format-column">' +
            '<div class="dashboard-work-format-column-title">' + escapeHtml(title) + '</div>' +
            '<div class="dashboard-work-format-grid">' +
                tile('Всего', bucket && bucket.total, bucket && bucket.total_share_label) +
                tile('С з/п', bucket && bucket.with_salary, bucket && bucket.with_salary_share_label) +
                tile('RUR', currencies.RUR, bucket && bucket.with_salary_currency_share_labels && bucket.with_salary_currency_share_labels.RUR) +
                tile('USD', currencies.USD, bucket && bucket.with_salary_currency_share_labels && bucket.with_salary_currency_share_labels.USD) +
                tile('EUR', currencies.EUR, bucket && bucket.with_salary_currency_share_labels && bucket.with_salary_currency_share_labels.EUR) +
                tile('Другая', currencies.OTHER, bucket && bucket.with_salary_currency_share_labels && bucket.with_salary_currency_share_labels.OTHER) +
            '</div>' +
        '</section>';
    }
    return '<section class="dashboard-card dashboard-work-format-card">' +
        '<div class="dashboard-card-header"><h3>Формат работы</h3></div>' +
        '<div class="dashboard-card-body">' +
            '<div class="dashboard-work-format-columns">' +
                column('ONLINE', remote) +
                column('OFFLINE or HYBRID', nonRemote) +
            '</div>' +
        '</div>' +
    '</section>';
}
```

- [ ] **Step 5: Replace the old remote section styles with compact shared-card styles**

```css
.dashboard-work-format-card .dashboard-card-body {
    padding: 18px 20px 20px;
}

.dashboard-work-format-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.dashboard-work-format-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.dashboard-work-format-column-title {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--chart-title-color);
}

.dashboard-work-format-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.dashboard-work-format-tile {
    display: grid;
    gap: 4px;
    padding: 12px 12px 10px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 16px;
    background: rgba(248, 250, 252, 0.9);
}

.dashboard-work-format-tile-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--chart-muted-color);
}

.dashboard-work-format-tile-value {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--chart-title-color);
}

.dashboard-work-format-tile-note {
    font-size: 0.76rem;
    color: var(--chart-muted-color);
}

@media (max-width: 900px) {
    .dashboard-work-format-columns {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 6: Mirror the CSS change in the static stylesheet**

```css
.dashboard-work-format-card .dashboard-card-body {
    padding: 18px 20px 20px;
}

.dashboard-work-format-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.dashboard-work-format-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.dashboard-work-format-column-title {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--chart-title-color);
}

.dashboard-work-format-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.dashboard-work-format-tile {
    display: grid;
    gap: 4px;
    padding: 12px 12px 10px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 16px;
    background: rgba(248, 250, 252, 0.9);
}

.dashboard-work-format-tile-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--chart-muted-color);
}

.dashboard-work-format-tile-value {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--chart-title-color);
}

.dashboard-work-format-tile-note {
    font-size: 0.76rem;
    color: var(--chart-muted-color);
}

@media (max-width: 900px) {
    .dashboard-work-format-columns {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 7: Run the compensation regression test and verify it passes**

Run: `node tests\ui\dashboard-compensation-availability.test.js`

Expected: PASS

- [ ] **Step 8: Commit the shared work-format card changes**

```bash
git add tests/ui/dashboard-compensation-availability.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: merge work format dashboard cards"
```

### Task 2: Increase Dashboard Chart Density And Fix Donut Mobile Centering

**Files:**
- Modify: `tests/ui/dashboard-layout-regression.test.js`
- Modify: `tests/ui/donut-legend-regression.test.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`

- [ ] **Step 1: Write the failing layout regression for denser chart areas and stronger donut centering**

```js
function assertStyleContracts(source, label) {
  assert.match(source, /\.donut-chart-shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(240px,\s*1.15fr\)\s*minmax\(220px,\s*0.85fr\);/, `${label} should give more width to the donut chart area on desktop`);
  assert.match(source, /\.donut-chart\s*\{[\s\S]*width:\s*clamp\(220px,\s*28vw,\s*320px\);[\s\S]*aspect-ratio:\s*1\s*\/\s*1;/, `${label} should size the donut against the ring area instead of free shell space`);
  assert.match(source, /\.dashboard-card-body\s*\{[\s\S]*padding:\s*18px 20px 20px;/, `${label} should tighten chart card body spacing`);
  assert.match(source, /\.employer-analysis-ranked-chart\s*\{[\s\S]*gap:\s*10px;/, `${label} should tighten ranked chart spacing`);
  assert.match(source, /\.donut-center-label\s*\{[\s\S]*inset:\s*50%\s+auto\s+auto\s+50%;[\s\S]*transform:\s*translate\(-50%,\s*-50%\);/, `${label} should anchor the donut center label to the donut ring center`);
  assert.match(source, /@media[\s\S]*?\.donut-chart-shell\s*\{[\s\S]*grid-template-columns:\s*1fr;[\s\S]*justify-items:\s*center;/, `${label} should keep the mobile shell centered around the donut ring`);
}
```

- [ ] **Step 2: Run the layout regressions and verify they fail**

Run: `node tests\ui\dashboard-layout-regression.test.js`

Expected: FAIL on the new density and donut sizing assertions because the current styles still use the looser shell proportions and existing padding.

- [ ] **Step 3: Tighten the shared chart spacing and donut geometry in the runtime stylesheet**

```css
.dashboard-card-body {
    padding: 18px 20px 20px;
}

.donut-chart-shell {
    display: grid;
    grid-template-columns: minmax(240px, 1.15fr) minmax(220px, 0.85fr);
    align-items: center;
    gap: 18px;
}

.donut-chart {
    position: relative;
    width: clamp(220px, 28vw, 320px);
    aspect-ratio: 1 / 1;
    margin: 0 auto;
}

.donut-center-label {
    position: absolute;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%);
}

.employer-analysis-ranked-chart {
    gap: 10px;
}

.salary-module-body,
.dashboard-card-plotly,
.dashboard-card-plotly .js-plotly-plot {
    min-height: 100%;
}

@media (max-width: 900px) {
    .donut-chart-shell {
        grid-template-columns: 1fr;
        justify-items: center;
        gap: 14px;
    }
}
```

- [ ] **Step 4: Mirror the chart-density and donut changes in the static stylesheet**

```css
.dashboard-card-body {
    padding: 18px 20px 20px;
}

.donut-chart-shell {
    display: grid;
    grid-template-columns: minmax(240px, 1.15fr) minmax(220px, 0.85fr);
    align-items: center;
    gap: 18px;
}

.donut-chart {
    position: relative;
    width: clamp(220px, 28vw, 320px);
    aspect-ratio: 1 / 1;
    margin: 0 auto;
}

.donut-center-label {
    position: absolute;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%);
}

.employer-analysis-ranked-chart {
    gap: 10px;
}

.salary-module-body,
.dashboard-card-plotly,
.dashboard-card-plotly .js-plotly-plot {
    min-height: 100%;
}

@media (max-width: 900px) {
    .donut-chart-shell {
        grid-template-columns: 1fr;
        justify-items: center;
        gap: 14px;
    }
}
```

- [ ] **Step 5: Keep donut markup compatible with the tighter chart geometry if needed**

```js
return '<div class="donut-chart-shell">' +
    '<div class="donut-chart-stage">' +
        '<div class="donut-chart">' +
            svg +
            '<div class="donut-center-label">' +
                '<span class="donut-center-value">' + escapeHtml(totalValue) + '</span>' +
                '<span class="donut-center-caption">ВСЕГО</span>' +
            '</div>' +
        '</div>' +
    '</div>' +
    legendHtml +
'</div>';
```

Apply the same markup shape in:

- `reports/report.ui.js`
- `reports/static/report.ui.js`

Only add `donut-chart-stage` if the CSS change needs an explicit chart-only centering wrapper. Do not add any extra wrapper beyond that.

- [ ] **Step 6: Update donut regression expectations if the shell markup changes**

```js
assert.match(donutFn, /<div class="donut-chart-shell">/);
assert.match(donutFn, /donut-chart-stage/);
assert.match(donutCss, /\.donut-chart\s*\{[\s\S]*aspect-ratio:\s*1\s*\/\s*1;/);
assert.match(donutMedia, /\.donut-chart-shell\s*\{[\s\S]*justify-items:\s*center;/);
```

- [ ] **Step 7: Run the updated layout regressions and verify they pass**

Run: `node tests\ui\dashboard-layout-regression.test.js`

Expected: PASS

Run: `node tests\ui\donut-legend-regression.test.js`

Expected: PASS

- [ ] **Step 8: Commit the density and donut-centering changes**

```bash
git add tests/ui/dashboard-layout-regression.test.js tests/ui/donut-legend-regression.test.js reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css
git commit -m "feat: tighten dashboard chart density"
```

### Task 3: Browser Verification Across Desktop And Mobile

**Files:**
- Modify: none
- Verify: `http://127.0.0.1:9000/report.html`

- [ ] **Step 1: Run the focused UI regression suite**

Run: `node tests\ui\dashboard-compensation-availability.test.js`

Expected: PASS

Run: `node tests\ui\dashboard-layout-regression.test.js`

Expected: PASS

Run: `node tests\ui\donut-legend-regression.test.js`

Expected: PASS

- [ ] **Step 2: Verify the dashboard in a desktop browser viewport**

Check on `http://127.0.0.1:9000/report.html`:

- `Формат работы` renders as one card
- inside it, `ONLINE` and `OFFLINE or HYBRID` are separate columns
- each column shows 6 KPI tiles
- donut area uses more of the card
- `Сгорание вакансий` and `Анализ работодателей` show less empty padding

- [ ] **Step 3: Verify the dashboard in a mobile browser viewport**

Check on `http://127.0.0.1:9000/report.html`:

- the shared `Формат работы` card remains one card
- the columns stack cleanly if required by viewport width
- the KPI tiles remain readable
- the donut total stays centered relative to the ring
- chart cards still look denser without clipping labels

- [ ] **Step 4: Commit any final verification-driven tweaks if needed**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/dashboard-compensation-availability.test.js tests/ui/dashboard-layout-regression.test.js tests/ui/donut-legend-regression.test.js
git commit -m "fix: polish dashboard work format layout"
```
