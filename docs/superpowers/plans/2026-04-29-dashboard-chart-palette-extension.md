# Dashboard Chart Palette Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved eight-color reusable dashboard palette and switch the `Отклики` and `Анализ работодателей` graphs to use palette-backed flat colors instead of local hardcoded hex values.

**Architecture:** Extend the existing `:root` palette in both stylesheet entrypoints, then centralize graph color mapping in the dashboard JS renderers so both source and static bundles use the same named palette keys. Keep the change narrow: no redesign of unrelated charts, no removal of backward-compatible legacy tokens.

**Tech Stack:** Vanilla JS, CSS custom properties, Node-based UI regression tests, browser verification in Chrome DevTools

---

### Task 1: Extend the Shared Dashboard Palette

**Files:**
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`

- [ ] **Step 1: Add the eight approved colors to the main palette block**

Add new `--palette-*` tokens in the existing `:root` palette section, next to the current `--palette-cyan`, `--palette-blue`, and related tokens. Use stable names so other dashboard components can reuse them later.

Target values:

```css
--palette-cyan-strong: #00ABCB;
--palette-pink-soft: #D47CEA;
--palette-magenta-strong: #F10096;
--palette-blue-strong: #007EDE;
--palette-green-strong: #00BD00;
--palette-violet-strong: #9C41E5;
--palette-purple-strong: #D24DEE;
--palette-orange-strong: #FF9200;
```

- [ ] **Step 2: Mirror the same palette tokens into the static stylesheet**

Repeat the same token block in `reports/static/styles.css` under the matching `:root` palette section so browser-loaded assets stay in sync.

- [ ] **Step 3: Sanity-check there are no duplicate names with conflicting values**

Run:

```powershell
rg -n --fixed-strings -- "--palette-cyan-strong" reports/styles.css reports/static/styles.css
rg -n --fixed-strings -- "--palette-magenta-strong" reports/styles.css reports/static/styles.css
rg -n --fixed-strings -- "--palette-orange-strong" reports/styles.css reports/static/styles.css
```

Expected: each token appears once per stylesheet with the approved hex value.

### Task 2: Centralize Palette Mapping for Target Graphs

**Files:**
- Modify: `reports/report.ui.js`
- Modify: `reports/static/report.ui.js`
- Test: `tests/ui/chart-font-regression.test.js`

- [ ] **Step 1: Add a small palette-key-to-CSS-var helper for dashboard chart colors**

Near the existing chart helpers in both JS files, add a helper that converts a palette key into `var(--palette-...)` so graph renderers stop carrying local hex values.

Target shape:

```js
function getDashboardPaletteColor(paletteKey) {
    var key = String(paletteKey || '').trim();
    if (!key) return 'var(--palette-blue)';
    return 'var(--' + key + ')';
}
```

- [ ] **Step 2: Convert the funnel stage colors to palette keys**

In `buildFunnelChartHtml(...)`, replace direct hex values with palette token names and resolve them through the helper before writing inline styles.

Target mapping:

```js
var stages = [
    { label: 'Отклики', value: responseCount, filterKey: null, filterValue: null, paletteKey: 'palette-cyan-strong' },
    { label: 'Собес назначен', value: interviewCount, filterKey: 'interview', filterValue: 'yes', paletteKey: 'palette-blue-strong' },
    { label: 'Результат указан', value: resultCount, filterKey: 'result', filterValue: 'yes', paletteKey: 'palette-violet-strong' },
    { label: 'Оффер', value: offerCount, filterKey: 'offer', filterValue: 'yes', paletteKey: 'palette-orange-strong' }
];
```

And style resolution:

```js
var stageColor = getDashboardPaletteColor(stage.paletteKey);
return '<div class="funnel-stage funnel-stage-' + index + '" style="width:' + widthPct + '%;margin:0 auto;background:' + escapeHtml(stageColor) + ';"' + clickHandler + '>' +
```

- [ ] **Step 3: Convert employer analysis colors to palette keys**

Replace `getEmployerAnalysisColor(...)` hardcoded hex return values with palette-backed `var(...)` results through the same helper.

Target mapping:

```js
function getEmployerAnalysisColor(factorKey) {
    if (factorKey === 'accreditation') return getDashboardPaletteColor('palette-cyan-strong');
    if (factorKey === 'cover_letter_required') return getDashboardPaletteColor('palette-blue-strong');
    if (factorKey === 'has_test') return getDashboardPaletteColor('palette-violet-strong');
    if (factorKey === 'rating_bucket') return getDashboardPaletteColor('palette-orange-strong');
    return getDashboardPaletteColor('palette-blue');
}
```

- [ ] **Step 4: Keep target graphs flat and readable**

Do not reintroduce gradients. Preserve the current flat rendering contract:

- `funnel-stage` backgrounds remain a single color
- `employer-funnel-bar` backgrounds remain a single color
- employer labels/values stay white for contrast

- [ ] **Step 5: Update regression assertions for palette-backed flat colors if needed**

Keep the existing checks that the target charts use flat bars and no employer gradient helpers. If needed, add assertions that the palette helper exists and the target renderers reference palette keys rather than local hex literals.

Suggested assertions:

```js
assert.match(source, /function getDashboardPaletteColor\(paletteKey\)/);
assert.match(source, /palette-cyan-strong/);
assert.match(source, /palette-blue-strong/);
assert.match(source, /palette-violet-strong/);
assert.match(source, /palette-orange-strong/);
```

### Task 3: Verify Source, Static, and Browser Output

**Files:**
- Test: `tests/ui/chart-font-regression.test.js`
- Test: `tests/ui/salary-overview-chart.test.js`

- [ ] **Step 1: Run the existing UI regression tests**

Run:

```powershell
node tests/ui/salary-overview-chart.test.js
node tests/ui/chart-font-regression.test.js
```

Expected: both commands PASS.

- [ ] **Step 2: Verify no local target-chart hex values remain in the JS renderers**

Run:

```powershell
rg -n "#00ABCB|#D47CEA|#F10096|#007EDE|#00BD00|#9C41E5|#D24DEE|#FF9200" reports/report.ui.js reports/static/report.ui.js
```

Expected: no direct hits inside target chart renderers after the palette helper refactor, or only palette-definition-adjacent cases outside those renderers if intentionally retained elsewhere.

- [ ] **Step 3: Verify in browser on desktop**

Open the dashboard and confirm:

- `Отклики` cards use flat colors only, no `linear-gradient`
- `Анализ работодателей` bars use flat colors only, no `linear-gradient`
- colors come from the approved new palette
- bars and stages remain inside their container bounds

- [ ] **Step 4: Verify in browser on mobile**

Repeat the same checks on a mobile viewport:

- `Отклики` stays flat and readable
- `Анализ работодателей` stays flat and readable
- no overflow beyond the card container

- [ ] **Step 5: Commit**

```bash
git add reports/styles.css reports/static/styles.css reports/report.ui.js reports/static/report.ui.js tests/ui/chart-font-regression.test.js
git commit -m "feat: add reusable dashboard chart palette"
```
