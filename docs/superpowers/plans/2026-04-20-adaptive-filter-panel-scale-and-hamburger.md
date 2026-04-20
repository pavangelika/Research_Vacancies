# Adaptive Filter Panel Scale And Hamburger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the full shared filter panel to a unified adaptive sizing system across desktop and mobile, remove spacing conflicts that make gaps look too large, and replace the panel toggle glyph with a hamburger icon.

**Architecture:** Keep the current shared filter panel structure and interaction logic, but centralize sizing into panel-level CSS variables and remove conflicting rigid overrides. JS changes are limited to the toggle icon output and preserving the existing section-open behavior and mobile alignment.

**Tech Stack:** Plain JavaScript, CSS, Node-based regression tests, Chrome DevTools manual verification.

---

### Task 1: Add Toggle Icon And Adaptive-Scale Regression Coverage

**Files:**
- Modify: `tests/ui/mobile-filter-panel-regression.test.js`
- Modify: `tests/ui/shared-filter-panel-regression.test.js`
- Test: `tests/ui/mobile-filter-panel-regression.test.js`
- Test: `tests/ui/shared-filter-panel-regression.test.js`

- [ ] **Step 1: Write the failing tests**

```js
runTest('shared filter toggle uses a hamburger glyph for collapsed and expanded states', () => {
  [FILES.reportFilters, FILES.staticReportFilters].forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /function getSharedFilterPanelToggleGlyph\(collapsed\)\s*\{[\s\S]*return '\u2630';[\s\S]*\}/,
      `${path.basename(filePath)} should render the shared filter toggle as a hamburger icon`
    );
  });
});

runTest('adaptive filter panel scale removes rigid panel px sizing from mobile-expanded spacing overrides', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(
      source,
      /body\.report-dashboard\.shared-filters-expanded\s+#role-selector\s+\.shared-filter-group\[data-section-open="1"\]\s*\+\s*\.shared-filter-group\s*\{[\s\S]*margin-top:\s*12px\s*!important;/,
      `${path.basename(filePath)} should not hardcode the mobile post-open gap in pixels`
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
node tests\ui\mobile-filter-panel-regression.test.js
node tests\ui\shared-filter-panel-regression.test.js
```

Expected:
- `mobile-filter-panel-regression` fails because the mobile post-open spacing rule still contains `12px`.
- `shared-filter-panel-regression` or a new toggle assertion fails because the toggle glyph is not a hamburger yet.

- [ ] **Step 3: Add the minimal test helpers needed for toggle verification**

```js
function evaluateToggleGlyph(content) {
  const script = [
    extractFunctionSource(content, 'getSharedFilterPanelToggleGlyph'),
    'module.exports = { getSharedFilterPanelToggleGlyph };'
  ].join('\n\n');
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-toggle.vm.js' });
  return {
    expanded: sandbox.module.exports.getSharedFilterPanelToggleGlyph(false),
    collapsed: sandbox.module.exports.getSharedFilterPanelToggleGlyph(true)
  };
}

runTest('shared filter toggle uses a hamburger glyph for collapsed and expanded states', () => {
  [FILES.reportFilters, FILES.staticReportFilters].forEach((filePath) => {
    const result = evaluateToggleGlyph(read(filePath));
    assert.equal(result.expanded, '\u2630', `${path.basename(filePath)} should use hamburger in expanded state`);
    assert.equal(result.collapsed, '\u2630', `${path.basename(filePath)} should use hamburger in collapsed state`);
  });
});
```

- [ ] **Step 4: Run tests again to verify they still fail for the right reason**

Run:

```powershell
node tests\ui\mobile-filter-panel-regression.test.js
node tests\ui\shared-filter-panel-regression.test.js
```

Expected:
- toggle test fails because runtime still returns arrows or dash;
- spacing test fails because CSS still contains rigid `12px` mobile gap.

- [ ] **Step 5: Commit**

```bash
git add tests/ui/mobile-filter-panel-regression.test.js tests/ui/shared-filter-panel-regression.test.js
git commit -m "test: cover adaptive filter panel scale and hamburger toggle"
```

### Task 2: Normalize Panel Tokens And Replace Rigid Sizing In Core Panel Shell

**Files:**
- Modify: `reports/styles.css:7381-8185`
- Modify: `reports/static/styles.css:7381-8185`
- Test: `tests/ui/mobile-filter-panel-regression.test.js`

- [ ] **Step 1: Write the failing test for adaptive shell tokens**

```js
runTest('adaptive filter panel scale defines panel shell sizes through clamp-based variables', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /--filters-panel-shell-gap:\s*clamp\(/,
      `${path.basename(filePath)} should define an adaptive shell gap token`
    );
    assert.match(
      source,
      /--filters-panel-group-stack-gap:\s*clamp\(/,
      `${path.basename(filePath)} should define an adaptive group stack gap token`
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node tests\ui\mobile-filter-panel-regression.test.js
```

Expected: FAIL because the new shell tokens do not exist yet.

- [ ] **Step 3: Write the minimal shell-token implementation**

```css
body.report-dashboard {
    --filters-panel-shell-gap: clamp(0.5rem, 0.35rem + 0.45vw, 0.85rem);
    --filters-panel-group-stack-gap: clamp(0.25rem, 0.15rem + 0.35vw, 0.75rem);
    --filters-panel-open-group-separation: clamp(0.5rem, 0.35rem + 0.55vw, 0.95rem);
    --filters-panel-group-radius: clamp(0.875rem, 0.78rem + 0.22vw, 1.125rem);
}

body.report-dashboard #global-shared-filter-panel .shared-filter-panel-body {
    gap: var(--filters-panel-shell-gap) !important;
}
```

- [ ] **Step 4: Expand the implementation to replace rigid shell sizing in the panel**

```css
body.report-dashboard #role-selector .shared-filter-group {
    margin-top: 0 !important;
    border-radius: var(--filters-panel-group-radius) !important;
}

body.report-dashboard #role-selector .shared-filter-group + .shared-filter-group {
    margin-top: 0 !important;
}

body.report-dashboard.shared-filters-expanded #role-selector .shared-filter-group[data-section-open="1"] + .shared-filter-group {
    margin-top: var(--filters-panel-open-group-separation) !important;
}
```

- [ ] **Step 5: Run tests to verify the shell-token change passes**

Run:

```powershell
node tests\ui\mobile-filter-panel-regression.test.js
```

Expected: PASS for the new adaptive shell token test and the existing mobile panel regressions.

- [ ] **Step 6: Commit**

```bash
git add reports/styles.css reports/static/styles.css tests/ui/mobile-filter-panel-regression.test.js
git commit -m "feat: normalize adaptive filter panel shell sizing"
```

### Task 3: Convert Group, Title, Body, And Panel-Owned Controls To Adaptive Sizes

**Files:**
- Modify: `reports/styles.css:6617-6809`
- Modify: `reports/styles.css:7259-7364`
- Modify: `reports/styles.css:8069-8185`
- Modify: `reports/static/styles.css:6617-6809`
- Modify: `reports/static/styles.css:7259-7364`
- Modify: `reports/static/styles.css:8069-8185`
- Test: `tests/ui/mobile-filter-panel-regression.test.js`

- [ ] **Step 1: Write a failing test that forbids targeted rigid panel px declarations**

```js
runTest('adaptive filter panel scale removes targeted rigid px sizing from the shared filter groups', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    [
      /body\.report-dashboard\s+#role-selector\s+\.shared-filter-group\s*\{[\s\S]*margin-top:\s*8px;/,
      /body\.report-dashboard\s+#role-selector\s+\.shared-filter-group-title\s*\{[\s\S]*min-height:\s*32px;/,
      /body\.report-dashboard\s+#role-selector\s+\.shared-filter-group-body\s*\{[\s\S]*padding:\s*2px 10px 6px !important;/
    ].forEach((pattern) => {
      assert.doesNotMatch(source, pattern, `${path.basename(filePath)} should remove rigid shared filter group sizing`);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node tests\ui\mobile-filter-panel-regression.test.js
```

Expected: FAIL because the rigid `px` declarations still exist.

- [ ] **Step 3: Replace the targeted rigid sizes with tokenized values**

```css
body.report-dashboard {
    --filters-panel-group-title-min-h: clamp(2rem, 1.85rem + 0.35vw, 2.35rem);
    --filters-panel-group-title-pad-inline: clamp(0.75rem, 0.62rem + 0.4vw, 1rem);
    --filters-panel-group-title-pad-block: clamp(0.5rem, 0.42rem + 0.25vw, 0.7rem);
    --filters-panel-group-body-pad-inline: clamp(0.625rem, 0.52rem + 0.32vw, 0.85rem);
    --filters-panel-group-body-pad-bottom: clamp(0.45rem, 0.35rem + 0.28vw, 0.75rem);
    --filters-panel-inner-gap: clamp(0.25rem, 0.18rem + 0.22vw, 0.5rem);
}

body.report-dashboard #role-selector .shared-filter-group-title {
    min-height: var(--filters-panel-group-title-min-h);
    padding:
        var(--filters-panel-group-title-pad-block)
        var(--filters-panel-group-title-pad-inline)
        var(--filters-panel-group-title-pad-block)
        calc(var(--filters-panel-group-title-pad-inline) * 1.35) !important;
}

body.report-dashboard #role-selector .shared-filter-group-body {
    gap: var(--filters-panel-inner-gap) !important;
    padding:
        calc(var(--filters-panel-inner-gap) * 0.5)
        var(--filters-panel-group-body-pad-inline)
        var(--filters-panel-group-body-pad-bottom) !important;
}
```

- [ ] **Step 4: Replace panel-owned control dimensions with adaptive tokens**

```css
body.report-dashboard {
    --filters-panel-control-pad-inline: clamp(0.625rem, 0.52rem + 0.35vw, 0.9rem);
    --filters-panel-control-radius: clamp(0.625rem, 0.55rem + 0.25vw, 0.9rem);
}

body.report-dashboard #role-selector .global-filter-trigger,
body.report-dashboard #role-selector .skills-search-favorites-panel-input,
body.report-dashboard #role-selector .skills-search-favorites-panel-save {
    min-height: var(--filters-panel-control-min-h) !important;
    padding-inline: var(--filters-panel-control-pad-inline) !important;
    border-radius: var(--filters-panel-control-radius) !important;
}
```

- [ ] **Step 5: Run tests to verify the group/control sizing passes**

Run:

```powershell
node tests\ui\mobile-filter-panel-regression.test.js
```

Expected: PASS, with the new rigid-size forbiddance test and all prior mobile panel regressions green.

- [ ] **Step 6: Commit**

```bash
git add reports/styles.css reports/static/styles.css tests/ui/mobile-filter-panel-regression.test.js
git commit -m "feat: convert shared filter groups and controls to adaptive sizing"
```

### Task 4: Replace Toggle Glyph With Hamburger Icon

**Files:**
- Modify: `reports/report.filters.js:99-104`
- Modify: `reports/static/report.filters.js:99-104`
- Test: `tests/ui/shared-filter-panel-regression.test.js`

- [ ] **Step 1: Reuse the failing toggle test from Task 1**

```js
runTest('shared filter toggle uses a hamburger glyph for collapsed and expanded states', () => {
  [FILES.reportFilters, FILES.staticReportFilters].forEach((filePath) => {
    const result = evaluateToggleGlyph(read(filePath));
    assert.equal(result.expanded, '\u2630');
    assert.equal(result.collapsed, '\u2630');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node tests\ui\shared-filter-panel-regression.test.js
```

Expected: FAIL because the current function returns arrow or dash glyphs.

- [ ] **Step 3: Write the minimal JS implementation**

```js
function getSharedFilterPanelToggleGlyph(collapsed) {
    return '\u2630';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```powershell
node tests\ui\shared-filter-panel-regression.test.js
node tests\ui\mobile-filter-panel-regression.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add reports/report.filters.js reports/static/report.filters.js tests/ui/shared-filter-panel-regression.test.js
git commit -m "feat: use hamburger glyph for shared filter toggle"
```

### Task 5: Verify In Browser On Desktop And Mobile

**Files:**
- Modify: `reports/styles.css` if verification reveals final adaptive cleanup
- Modify: `reports/static/styles.css` if verification reveals final adaptive cleanup
- Test: `tests/ui/mobile-filter-panel-regression.test.js`
- Test: `tests/ui/shared-filter-panel-regression.test.js`

- [ ] **Step 1: Run the full targeted regression suite**

Run:

```powershell
node tests\ui\mobile-filter-panel-regression.test.js
node tests\ui\shared-filter-panel-regression.test.js
```

Expected: PASS for both suites.

- [ ] **Step 2: Reload the report and verify mobile expanded panel**

Run browser checks for:

```text
Viewport: 390x844
- Expand panel
- Switch between Role, Vacancy, Skills
- Confirm Skills remains visible when expected
- Confirm the open-group gap no longer feels exaggerated
- Confirm hamburger icon is used for the panel toggle
```

Expected:
- mobile panel spacing is adaptive and visually balanced;
- no obviously rigid oversized gaps remain;
- toggle displays hamburger icon.

- [ ] **Step 3: Verify desktop expanded and collapsed states**

Run browser checks for:

```text
Viewport: 1440x1200
- Expanded panel
- Collapsed rail
- Toggle icon remains hamburger
- Group spacing and control sizing still look consistent
```

Expected:
- desktop panel still looks coherent;
- collapsed rail remains usable;
- no regression in section switching.

- [ ] **Step 4: Apply final minimal cleanup if browser verification reveals one residual rigid declaration**

```css
/* Only if needed after browser verification */
body.report-dashboard #global-shared-filter-panel .shared-filter-panel-rail-button {
    padding:
        calc(var(--filters-panel-pad-y) * 0.95)
        calc(var(--filters-panel-pad-x) * 0.85);
}
```

- [ ] **Step 5: Re-run tests after any cleanup**

Run:

```powershell
node tests\ui\mobile-filter-panel-regression.test.js
node tests\ui\shared-filter-panel-regression.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add reports/styles.css reports/static/styles.css reports/report.filters.js reports/static/report.filters.js tests/ui/mobile-filter-panel-regression.test.js tests/ui/shared-filter-panel-regression.test.js
git commit -m "feat: normalize adaptive filter panel scale"
```
