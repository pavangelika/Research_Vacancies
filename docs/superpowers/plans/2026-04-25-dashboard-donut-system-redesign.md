# Dashboard Donut System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Dashboard tab into one donut-led visual system, remove unstable donut click behavior, add `REMOTE`/`non-REMOTE` compensation KPIs, and recompose the dashboard layout for natural-height cards.

**Architecture:** Extend the existing dashboard payload with a focused compensation-availability summary, then refactor the existing dashboard renderers in `reports/report.ui.js` and `reports/static/report.ui.js` so the donut, burnup, salary, funnel, compensation, and employer cards all share the same component language. Replace row-equalized dashboard composition with a natural-height two-column layout on desktop while keeping mobile single-column and keeping donut drilldown inline inside the vacancies card.

**Tech Stack:** FastAPI backend DTO/service layer, vanilla JS dashboard renderers, dashboard CSS, Node-based UI regression tests, Pytest backend contract/service tests.

---

## File Structure

### Backend

- Modify: `backend/services/analytics_service.py`
  - Extend dashboard payload aggregation with a dedicated compensation availability summary built from the already filtered dashboard vacancy set.
- Modify: `backend/schemas/analytics.py`
  - Add DTO fields for the new dashboard compensation availability summary.
- Test: `tests/backend/test_dashboard_payload_service.py`
  - Verify the new summary values and salary/no-salary counts for `REMOTE` and `non-REMOTE`.
- Test: `tests/backend/test_analytics_contract.py`
  - Verify the dashboard API response includes the new compensation summary shape.

### Frontend Runtime

- Modify: `reports/report.ui.js`
  - Refactor dashboard card composition, donut drilldown behavior, salary card renderer, compensation card renderer, and supporting event binding.
- Modify: `reports/styles.css`
  - Replace legacy dashboard row-equalized layout and legacy card styles with the unified donut-system dashboard styles.

### Frontend Static Mirror

- Modify: `reports/static/report.ui.js`
  - Mirror the runtime renderer changes.
- Modify: `reports/static/styles.css`
  - Mirror the runtime stylesheet changes.

### UI Regression

- Modify: `tests/ui/donut-legend-regression.test.js`
  - Lock in stable donut drilldown behavior and markup changes.
- Modify: `tests/ui/salary-overview-chart.test.js`
  - Lock in the redesigned salary card structure.
- Create: `tests/ui/dashboard-compensation-availability.test.js`
  - Lock in the new KPI-first compensation card and renamed title.
- Create: `tests/ui/dashboard-layout-regression.test.js`
  - Lock in dashboard natural-height layout and ordering markers in markup/CSS.
- Modify: `tests/ui/mobile-filter-panel-regression.test.js`
  - Cover the mobile tap-safety regression for dashboard cards after layout changes.

## Task 1: Extend Dashboard Payload With Compensation Availability Summary

**Files:**
- Modify: `backend/services/analytics_service.py`
- Modify: `backend/schemas/analytics.py`
- Test: `tests/backend/test_dashboard_payload_service.py`
- Test: `tests/backend/test_analytics_contract.py`

- [ ] **Step 1: Write the failing backend service test**

Add a focused service test in `tests/backend/test_dashboard_payload_service.py` that proves dashboard payload now includes salary availability metrics for explicit `REMOTE` and `non-REMOTE` vacancies.

```python
def test_get_dashboard_payload_includes_compensation_availability_summary():
    analytics = AnalyticsService(repo=FakeAnalyticsRepo(), responses_repo=FakeResponsesRepo())

    analytics._get_dashboard_filtered_vacancies = lambda **kwargs: [
        {
            "id": "1",
            "salary_from": 200000,
            "salary_to": None,
            "salary_currency": "RUR",
            "work_format": "REMOTE",
            "published_at": "2026-04-01T00:00:00+03:00",
            "archived_at": None,
            "status": "active",
        },
        {
            "id": "2",
            "salary_from": None,
            "salary_to": None,
            "salary_currency": None,
            "work_format": "REMOTE",
            "published_at": "2026-04-02T00:00:00+03:00",
            "archived_at": None,
            "status": "active",
        },
        {
            "id": "3",
            "salary_from": 180000,
            "salary_to": None,
            "salary_currency": "RUR",
            "work_format": "ONSITE",
            "published_at": "2026-04-03T00:00:00+03:00",
            "archived_at": None,
            "status": "active",
        },
        {
            "id": "4",
            "salary_from": None,
            "salary_to": None,
            "salary_currency": None,
            "work_format": "ONSITE",
            "published_at": "2026-04-04T00:00:00+03:00",
            "archived_at": None,
            "status": "active",
        },
    ]

    result = analytics.get_dashboard_payload(scope="single", role_ids=["96"], period="2026-04")

    assert result["compensation_availability"] == {
        "total": 4,
        "with_salary": 2,
        "without_salary": 2,
        "coverage_percent": 50.0,
        "remote": {
            "total": 2,
            "with_salary": 1,
            "without_salary": 1,
            "coverage_percent": 50.0,
        },
        "non_remote": {
            "total": 2,
            "with_salary": 1,
            "without_salary": 1,
            "coverage_percent": 50.0,
        },
    }
```

- [ ] **Step 2: Run the backend service test to verify it fails**

Run: `pytest tests/backend/test_dashboard_payload_service.py -k compensation_availability -q`

Expected: FAIL because `compensation_availability` is not returned by the dashboard payload yet.

- [ ] **Step 3: Write the failing dashboard contract test**

Add a focused response-shape assertion in `tests/backend/test_analytics_contract.py`.

```python
def test_dashboard_contract_includes_compensation_availability(monkeypatch):
    monkeypatch.setattr(
        analytics_api.service,
        "get_dashboard_payload",
        lambda **kwargs: {
            "kpi": {},
            "salary_coverage": {},
            "period_stats": {},
            "response_funnel": {},
            "burnup_series": {},
            "skills_rows": [],
            "company_rows": [],
            "closing_rows": [],
            "top_vacancies": [],
            "salary_month_data": {},
            "employer_overview": {},
            "market_trends": {},
            "compensation_availability": {
                "total": 10,
                "with_salary": 7,
                "without_salary": 3,
                "coverage_percent": 70.0,
                "remote": {
                    "total": 4,
                    "with_salary": 3,
                    "without_salary": 1,
                    "coverage_percent": 75.0,
                },
                "non_remote": {
                    "total": 6,
                    "with_salary": 4,
                    "without_salary": 2,
                    "coverage_percent": 66.7,
                },
            },
        },
    )

    response = client.get("/api/v1/analytics/dashboard")

    assert response.status_code == 200
    payload = response.json()
    assert payload["compensation_availability"]["remote"]["with_salary"] == 3
    assert payload["compensation_availability"]["non_remote"]["without_salary"] == 2
```

- [ ] **Step 4: Run the contract test to verify it fails**

Run: `pytest tests/backend/test_analytics_contract.py -k compensation_availability -q`

Expected: FAIL because the dashboard response DTO does not include the new field yet.

- [ ] **Step 5: Add the DTO shape in `backend/schemas/analytics.py`**

Add focused Pydantic models near the existing dashboard response DTOs.

```python
class DashboardCompensationAvailabilityBucketDto(BaseModel):
    total: int
    with_salary: int
    without_salary: int
    coverage_percent: float


class DashboardCompensationAvailabilityDto(BaseModel):
    total: int
    with_salary: int
    without_salary: int
    coverage_percent: float
    remote: DashboardCompensationAvailabilityBucketDto
    non_remote: DashboardCompensationAvailabilityBucketDto
```

Then wire the field into the dashboard response DTO:

```python
class DashboardResponseDto(BaseModel):
    kpi: dict
    salary_coverage: dict
    compensation_availability: DashboardCompensationAvailabilityDto
    period_stats: dict
    response_funnel: dict
    burnup_series: dict
    skills_rows: list[dict]
    company_rows: list[dict]
    closing_rows: list[dict]
    top_vacancies: list[dict]
    salary_month_data: dict
    employer_overview: dict
    market_trends: dict
```

- [ ] **Step 6: Add minimal aggregation in `backend/services/analytics_service.py`**

Add a focused helper near `_compute_dashboard_salary_coverage`.

```python
def _compute_dashboard_compensation_availability(self, vacancies: list[dict]) -> dict:
    def has_salary(vacancy: dict) -> bool:
        return vacancy.get("salary_from") is not None or vacancy.get("salary_to") is not None

    def is_remote(vacancy: dict) -> bool:
        work_format = str(vacancy.get("work_format") or "").strip().upper()
        return work_format == "REMOTE"

    def summarize(items: list[dict]) -> dict:
        total = len(items)
        with_salary = sum(1 for item in items if has_salary(item))
        without_salary = total - with_salary
        return {
            "total": total,
            "with_salary": with_salary,
            "without_salary": without_salary,
            "coverage_percent": (with_salary * 100.0 / total) if total else 0.0,
        }

    remote_items = [vacancy for vacancy in vacancies if is_remote(vacancy)]
    non_remote_items = [vacancy for vacancy in vacancies if not is_remote(vacancy)]

    summary = summarize(vacancies)
    summary["remote"] = summarize(remote_items)
    summary["non_remote"] = summarize(non_remote_items)
    return summary
```

Then include it in the dashboard payload:

```python
"salary_coverage": self._compute_dashboard_salary_coverage(filtered_vacancies),
"compensation_availability": self._compute_dashboard_compensation_availability(filtered_vacancies),
"period_stats": self._compute_dashboard_period_stats(filtered_vacancies),
```

- [ ] **Step 7: Run the backend service test to verify it passes**

Run: `pytest tests/backend/test_dashboard_payload_service.py -k compensation_availability -q`

Expected: PASS

- [ ] **Step 8: Run the dashboard contract test to verify it passes**

Run: `pytest tests/backend/test_analytics_contract.py -k compensation_availability -q`

Expected: PASS

- [ ] **Step 9: Commit the backend payload work**

```bash
git add backend/services/analytics_service.py backend/schemas/analytics.py tests/backend/test_dashboard_payload_service.py tests/backend/test_analytics_contract.py
git commit -m "feat: add dashboard compensation availability metrics"
```

## Task 2: Make Donut Interaction Stable and Inline

**Files:**
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Test: `tests/ui/donut-legend-regression.test.js`

- [ ] **Step 1: Write the failing donut regression test**

Add assertions to `tests/ui/donut-legend-regression.test.js` that lock in inline drilldown and remove the old “moving donut” interaction contract.

```javascript
runTest('dashboard donut markup keeps drilldown inline inside the card', () => {
  const source = read('reports/report.ui.js');

  assert.match(source, /<div class="donut-chart-shell">/);
  assert.match(source, /<div class="donut-drilldown" hidden><\\/div>/);
  assert.match(source, /donutContainer\\.dataset\\.activeSelectionKey = nextSelectionKey/);
});

runTest('dashboard donut styles do not use translate-based segment explosion', () => {
  const css = read('reports/styles.css');

  assert.doesNotMatch(css, /transform:\\s*translate\\(/);
  assert.match(css, /\\.donut-chart-segment\\.is-active/);
  assert.match(css, /\\.donut-drilldown\\s*\\{/);
});
```

- [ ] **Step 2: Run the donut regression test to verify it fails**

Run: `node tests\\ui\\donut-legend-regression.test.js`

Expected: FAIL because the new shell/active-state structure is not implemented yet.

- [ ] **Step 3: Refactor donut markup in `reports/report.ui.js`**

Update `buildDonutChartHtml()` so the donut chart and legend live in a stable shell and drilldown always renders beneath that shell.

```javascript
return '<div class="donut-chart-container"' + interactiveAttr + ' data-breakdown="' + breakdownEncoded + '">' +
    '<div class="donut-chart-shell">' +
        '<div class="donut-chart">' +
            svgHtml +
        '</div>' +
        '<div class="donut-legend">' +
            legendHtml +
        '</div>' +
    '</div>' +
    '<div class="donut-drilldown" hidden></div>' +
'</div>';
```

Then update the selection handler so it only toggles active state and drilldown content:

```javascript
actions.forEach(function(action) {
    var isActive = action.dataset.selectionKey === nextSelectionKey;
    action.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    action.classList.toggle('is-active', isActive);
});

Array.from(donutContainer.querySelectorAll('.donut-chart-segment')).forEach(function(segment) {
    var isActive = segment.dataset.selectionKey === nextSelectionKey;
    segment.classList.toggle('is-active', isActive);
    segment.classList.toggle('is-muted', !!nextSelectionKey && !isActive);
});
```

- [ ] **Step 4: Mirror the donut renderer change in `reports/static/report.ui.js`**

Apply the same `buildDonutChartHtml()` and selection-state changes in the static file.

```javascript
return '<div class="donut-chart-container"' + interactiveAttr + ' data-breakdown="' + breakdownEncoded + '">' +
    '<div class="donut-chart-shell">' +
        '<div class="donut-chart">' + svgHtml + '</div>' +
        '<div class="donut-legend">' + legendHtml + '</div>' +
    '</div>' +
    '<div class="donut-drilldown" hidden></div>' +
'</div>';
```

- [ ] **Step 5: Replace legacy donut interaction styles in `reports/styles.css`**

Edit the existing donut styles instead of adding parallel overrides.

```css
.donut-chart-container {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.donut-chart-shell {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(240px, 1fr);
    gap: 22px;
    align-items: center;
}

.donut-chart-segment {
    transition: opacity 180ms ease, stroke-width 180ms ease, filter 180ms ease;
    transform: none;
}

.donut-chart-segment.is-active {
    opacity: 1;
    filter: saturate(1.05);
}

.donut-chart-segment.is-muted {
    opacity: 0.28;
}
```

- [ ] **Step 6: Mirror the donut style change in `reports/static/styles.css`**

Apply the same `.donut-chart-container`, `.donut-chart-shell`, `.donut-chart-segment.is-active`, and `.donut-chart-segment.is-muted` changes in the static stylesheet.

```css
.donut-chart-container {
    display: flex;
    flex-direction: column;
    gap: 18px;
}
```

- [ ] **Step 7: Run the donut regression test to verify it passes**

Run: `node tests\\ui\\donut-legend-regression.test.js`

Expected: PASS

- [ ] **Step 8: Commit the donut interaction refactor**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/donut-legend-regression.test.js
git commit -m "feat: stabilize dashboard donut drilldown"
```

## Task 3: Redesign Dashboard Composition and Compensation Card

**Files:**
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Create: `tests/ui/dashboard-compensation-availability.test.js`
- Create: `tests/ui/dashboard-layout-regression.test.js`
- Modify: `tests/ui/mobile-filter-panel-regression.test.js`

- [ ] **Step 1: Write the failing compensation card regression test**

Create `tests/ui/dashboard-compensation-availability.test.js`.

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function runTest(name, fn) {
  try {
    fn();
    console.log('ok - ' + name);
  } catch (error) {
    console.error('not ok - ' + name);
    throw error;
  }
}

runTest('dashboard renderer uses compensation availability card title and remote buckets', () => {
  const source = read('reports/report.ui.js');

  assert.match(source, /compensation_availability|compensationAvailability/);
  assert.doesNotMatch(source, /Покрытие зарплат/);
  assert.match(source, /REMOTE/);
  assert.match(source, /non_remote|nonRemote/);
});
```

- [ ] **Step 2: Write the failing dashboard layout regression test**

Create `tests/ui/dashboard-layout-regression.test.js`.

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function runTest(name, fn) {
  try {
    fn();
    console.log('ok - ' + name);
  } catch (error) {
    console.error('not ok - ' + name);
    throw error;
  }
}

runTest('dashboard stylesheet uses natural-height column layout instead of equal-height rows', () => {
  const css = read('reports/styles.css');

  assert.match(css, /\\.totals-grid\\s*\\{[\\s\\S]*columns:/);
  assert.doesNotMatch(css, /grid-auto-rows:\\s*1fr/);
});
```

- [ ] **Step 3: Run the new UI regression tests to verify they fail**

Run: `node tests\\ui\\dashboard-compensation-availability.test.js`

Expected: FAIL because the new card and naming are not implemented yet.

Run: `node tests\\ui\\dashboard-layout-regression.test.js`

Expected: FAIL because the dashboard layout still uses the legacy row-based layout.

- [ ] **Step 4: Refactor dashboard composition in `reports/report.ui.js`**

Replace the current dashboard card assembly so the compensation card uses the new payload field and cards remain in the agreed order.

```javascript
var compensationAvailability = totals.compensation_availability || {
    total: 0,
    with_salary: 0,
    without_salary: 0,
    coverage_percent: 0,
    remote: { total: 0, with_salary: 0, without_salary: 0, coverage_percent: 0 },
    non_remote: { total: 0, with_salary: 0, without_salary: 0, coverage_percent: 0 }
};

return '<div class="dashboard-card dashboard-card-compensation">' +
        '<h3 class="dashboard-card-title">Доступность зарплаты</h3>' +
        buildDashboardCompensationAvailabilityHtml(compensationAvailability) +
    '</div>';
```

Add the helper near the existing dashboard render helpers:

```javascript
function buildDashboardCompensationAvailabilityHtml(summary) {
    function metric(label, value, meta, accentClass) {
        return '<section class="dashboard-kpi-tile ' + accentClass + '">' +
            '<div class="dashboard-kpi-label">' + escapeHtml(label) + '</div>' +
            '<div class="dashboard-kpi-value">' + escapeHtml(String(value)) + '</div>' +
            '<div class="dashboard-kpi-meta">' + escapeHtml(meta) + '</div>' +
        '</section>';
    }

    return '<div class="dashboard-kpi-stack">' +
        '<div class="dashboard-kpi-overview">' +
            metric('С з/п', summary.with_salary || 0, totalsFormatNumber(summary.coverage_percent || 0) + '% от всех', 'is-active') +
            metric('Без з/п', summary.without_salary || 0, totalsFormatNumber(100 - (summary.coverage_percent || 0)) + '% от всех', 'is-muted') +
        '</div>' +
        '<div class="dashboard-kpi-split">' +
            metric('REMOTE', (summary.remote && summary.remote.total) || 0, 'с з/п: ' + ((summary.remote && summary.remote.with_salary) || 0), 'is-new') +
            metric('Не REMOTE', (summary.non_remote && summary.non_remote.total) || 0, 'с з/п: ' + ((summary.non_remote && summary.non_remote.with_salary) || 0), 'is-archived') +
        '</div>' +
    '</div>';
}
```

- [ ] **Step 5: Mirror the dashboard composition change in `reports/static/report.ui.js`**

Add the same `compensationAvailability` usage and `buildDashboardCompensationAvailabilityHtml()` helper in the static file.

```javascript
var compensationAvailability = totals.compensation_availability || { /* same fallback */ };
```

- [ ] **Step 6: Replace dashboard row-equalized layout in `reports/styles.css`**

Edit the existing `.totals-grid` and `.dashboard-card` rules to use column flow on desktop and a single column on mobile.

```css
.totals-grid {
    columns: 2 360px;
    column-gap: 24px;
    align-items: start;
}

.dashboard-card,
.totals-employer-overview-card {
    break-inside: avoid;
    margin: 0 0 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

@media (max-width: 900px) {
    .totals-grid {
        columns: 1;
    }
}
```

Then add the new compensation tile styles in the same card system instead of a parallel subsystem:

```css
.dashboard-kpi-stack {
    display: grid;
    gap: 16px;
}

.dashboard-kpi-overview,
.dashboard-kpi-split {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.dashboard-kpi-tile {
    border-radius: 20px;
    padding: 18px 18px 16px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(241,245,249,0.92));
}
```

- [ ] **Step 7: Mirror the dashboard layout and compensation styles in `reports/static/styles.css`**

Apply the same `.totals-grid`, `.dashboard-card`, `.dashboard-kpi-stack`, `.dashboard-kpi-overview`, `.dashboard-kpi-split`, and `.dashboard-kpi-tile` changes in the static stylesheet.

```css
.totals-grid {
    columns: 2 360px;
    column-gap: 24px;
}
```

- [ ] **Step 8: Add the mobile tap-safety regression**

Extend `tests/ui/mobile-filter-panel-regression.test.js` with a focused source assertion that keeps dashboard content above filter interception when collapsed and safely isolated when expanded.

```javascript
runTest('mobile dashboard keeps filter overlay isolated from main card taps', () => {
  const css = read('reports/styles.css');

  assert.match(css, /\\.totals-grid[\\s\\S]*columns:/);
  assert.match(css, /\\.filters-panel|\\.shared-filter-panel|\\.report-sidebar/);
});
```

- [ ] **Step 9: Run the new layout and compensation tests to verify they pass**

Run: `node tests\\ui\\dashboard-compensation-availability.test.js`

Expected: PASS

Run: `node tests\\ui\\dashboard-layout-regression.test.js`

Expected: PASS

Run: `node tests\\ui\\mobile-filter-panel-regression.test.js`

Expected: PASS

- [ ] **Step 10: Commit the dashboard composition work**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/dashboard-compensation-availability.test.js tests/ui/dashboard-layout-regression.test.js tests/ui/mobile-filter-panel-regression.test.js
git commit -m "feat: redesign dashboard layout and compensation card"
```

## Task 4: Redesign Salary, Burnup, Funnel, and Employer Cards Into One System

**Files:**
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Modify: `tests/ui/salary-overview-chart.test.js`
- Modify: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Write the failing salary overview regression**

Extend `tests/ui/salary-overview-chart.test.js` to assert the redesigned salary module structure uses the unified card language rather than the old multi-panel currency stack.

```javascript
runTest('salary overview renderer uses unified dashboard module structure', () => {
  const source = read('reports/report.ui.js');

  assert.match(source, /salary-module/);
  assert.match(source, /salary-module-currency-tabs/);
  assert.match(source, /salary-module-track/);
  assert.doesNotMatch(source, /salary-overview-currencies/);
});
```

- [ ] **Step 2: Write the failing chart style regression**

Extend `tests/ui/chart-font-regression.test.js` with checks for burnup/employer unified chart language.

```javascript
runTest('dashboard chart styles expose unified chart card tokens', () => {
  const css = read('reports/styles.css');

  assert.match(css, /--dashboard-chart-grid-color:/);
  assert.match(css, /\\.dashboard-chart-host/);
  assert.match(css, /\\.employer-analysis-donut-chart-title/);
});
```

- [ ] **Step 3: Run the salary and chart regression tests to verify they fail**

Run: `node tests\\ui\\salary-overview-chart.test.js`

Expected: FAIL because the salary renderer still uses the old structure.

Run: `node tests\\ui\\chart-font-regression.test.js`

Expected: FAIL because the unified dashboard chart tokens are not present yet.

- [ ] **Step 4: Refactor salary renderer in `reports/report.ui.js`**

Replace the old `salary-overview-*` renderer structure with a cleaner unified salary module helper while preserving the underlying salary data semantics.

```javascript
function buildDashboardSalaryLandscapeHtml(summary) {
    var currencies = Array.isArray(summary && summary.currencies) ? summary.currencies : [];
    var activeCurrency = currencies.find(function(item) { return item && item.expanded; }) || currencies[0] || null;

    return '<div class="salary-module">' +
        '<div class="salary-module-head">' +
            '<div class="salary-module-legend">' + renderSalaryLegend(summary && summary.legend) + '</div>' +
            '<div class="salary-module-currency-tabs">' + renderSalaryCurrencyTabs(currencies, activeCurrency) + '</div>' +
        '</div>' +
        '<div class="salary-module-body">' + renderSalaryCurrencyBody(activeCurrency) + '</div>' +
    '</div>';
}
```

Then switch the dashboard card assembly from the old helper to the new one:

```javascript
'<div class="dashboard-card">' +
    '<h3 class="dashboard-card-title">Зарплаты</h3>' +
    buildDashboardSalaryLandscapeHtml(salaryMonthData) +
'</div>'
```

- [ ] **Step 5: Mirror the salary renderer refactor in `reports/static/report.ui.js`**

Apply the same `buildDashboardSalaryLandscapeHtml()` refactor and dashboard card callsite change in the static file.

```javascript
'<div class="dashboard-card">' +
    '<h3 class="dashboard-card-title">Зарплаты</h3>' +
    buildDashboardSalaryLandscapeHtml(salaryMonthData) +
'</div>'
```

- [ ] **Step 6: Replace legacy salary module CSS in `reports/styles.css`**

Edit the current salary overview selectors instead of layering new styles over them. Remove or rename obsolete `salary-overview-*` selectors if no longer used by the renderer.

```css
.salary-module {
    display: grid;
    gap: 18px;
}

.salary-module-head {
    display: grid;
    gap: 14px;
}

.salary-module-currency-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.salary-module-currency-button {
    border-radius: 999px;
    padding: 10px 14px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(255, 255, 255, 0.72);
}

.salary-module-track {
    position: relative;
    min-height: 64px;
}
```

- [ ] **Step 7: Normalize burnup, funnel, and employer card visual tokens in `reports/styles.css`**

Add shared dashboard chart tokens and reuse them in the existing burnup and employer chart wrappers.

```css
:root {
    --dashboard-chart-grid-color: rgba(148, 163, 184, 0.16);
    --dashboard-chart-axis-color: #64748b;
    --dashboard-chart-title-color: #334155;
}

.dashboard-chart-host,
.unified-chart-host,
.employer-analysis-chart-host {
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92));
}
```

Use the same gradient family classes in the funnel card and keep employer title spacing aligned with the shared title rhythm.

- [ ] **Step 8: Mirror the salary and chart CSS refactor in `reports/static/styles.css`**

Apply the same `.salary-module*` and shared dashboard chart token changes in the static stylesheet.

```css
.salary-module {
    display: grid;
    gap: 18px;
}
```

- [ ] **Step 9: Run the salary and chart regression tests to verify they pass**

Run: `node tests\\ui\\salary-overview-chart.test.js`

Expected: PASS

Run: `node tests\\ui\\chart-font-regression.test.js`

Expected: PASS

- [ ] **Step 10: Commit the dashboard card redesign work**

```bash
git add reports/report.ui.js reports/static/report.ui.js reports/styles.css reports/static/styles.css tests/ui/salary-overview-chart.test.js tests/ui/chart-font-regression.test.js
git commit -m "feat: unify dashboard cards with donut system"
```

## Task 5: Final Verification in Browser and Safe Regression Sweep

**Files:**
- Modify: none unless failures are found
- Verify: runtime app at `http://127.0.0.1:9000/report.html`

- [ ] **Step 1: Run the focused backend regression suite**

Run: `pytest tests/backend/test_dashboard_payload_service.py tests/backend/test_analytics_contract.py -q`

Expected: PASS

- [ ] **Step 2: Run the focused UI regression suite**

Run: `node tests\\ui\\donut-legend-regression.test.js`

Expected: PASS

Run: `node tests\\ui\\salary-overview-chart.test.js`

Expected: PASS

Run: `node tests\\ui\\dashboard-compensation-availability.test.js`

Expected: PASS

Run: `node tests\\ui\\dashboard-layout-regression.test.js`

Expected: PASS

Run: `node tests\\ui\\mobile-filter-panel-regression.test.js`

Expected: PASS

- [ ] **Step 3: Verify desktop behavior in the browser**

Open `http://127.0.0.1:9000/report.html` in desktop viewport.

Check:

- donut click opens drilldown downward without moving arcs;
- neighboring cards do not stretch to equal height;
- dashboard cards read as one coherent system;
- compensation card title and metrics render correctly;
- salary card feels visually aligned with the donut system;
- employer card still uses donut-aligned palette.

- [ ] **Step 4: Verify mobile behavior in the browser**

Open the same page in mobile viewport.

Check:

- dashboard is single-column;
- donut interactions still work;
- card taps are not intercepted by the filter panel after collapsing filters;
- compensation and salary cards remain readable without horizontal overflow.

- [ ] **Step 5: Review git diff for scope safety**

Run: `git diff --stat HEAD~4..HEAD`

Expected: changes limited to the dashboard payload, dashboard renderers/styles, and targeted regression tests.

- [ ] **Step 6: Commit any final polish if verification reveals fixes**

```bash
git add <only files changed during verification>
git commit -m "fix: polish dashboard donut redesign"
```

