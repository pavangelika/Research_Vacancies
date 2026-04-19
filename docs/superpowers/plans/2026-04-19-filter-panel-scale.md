# Filter Panel Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce shared filter panel sizing by 5% while keeping chipset sizes unchanged.

**Architecture:** Update the shared `--filters-panel-*` CSS tokens that drive typography, spacing, and control heights in the filter panel. Leave chip-specific selectors untouched so pill chips preserve their existing size.

**Tech Stack:** Static HTML/CSS/JS report UI, Node-based UI regression test

---

### Task 1: Scale Shared Filter Panel Tokens

**Files:**
- Modify: `reports/styles.css`
- Modify: `reports/static/styles.css`
- Test: `tests/ui/shared-filter-panel-regression.test.js`

- [ ] **Step 1: Update the shared filter panel CSS variables**

Reduce only the shared panel sizing tokens by about 5% in both stylesheet copies:

```css
--filters-panel-toggle-size: clamp(2.375rem, 2.1375rem + 0.38vw, 2.6125rem);
--filters-panel-control-min-h: clamp(2.6125rem, 2.3275rem + 0.4275vw, 2.85rem);
--filters-panel-control-min-h-compact: clamp(2.375rem, 2.185rem + 0.3325vw, 2.6125rem);
--filters-panel-icon-size: clamp(1.1875rem, 0.9975rem + 0.3325vw, 1.425rem);
--filters-panel-gap: clamp(0.475rem, 0.3325rem + 0.38vw, 0.7125rem);
--filters-panel-group-gap: clamp(0.35625rem, 0.2375rem + 0.285vw, 0.59375rem);
--filters-panel-pad-x: clamp(0.83125rem, 0.665rem + 0.5225vw, 0.95rem);
--filters-panel-pad-y: clamp(0.59375rem, 0.475rem + 0.4275vw, 0.83125rem);
--filters-panel-field-height: clamp(2.1375rem, 1.995rem + 0.2375vw, 2.25625rem);
--filters-panel-head-pad-top: clamp(0.95rem, 0.76rem + 0.57vw, 1.06875rem);
--filters-panel-head-pad-bottom: clamp(0.7125rem, 0.57rem + 0.38vw, 0.83125rem);
--filters-panel-title-size: clamp(0.9025rem, 0.836rem + 0.171vw, 0.95rem);
--filters-panel-label-size: clamp(0.779rem, 0.741rem + 0.152vw, 0.83125rem);
--filters-panel-footer-size: clamp(0.703rem, 0.684rem + 0.114vw, 0.76rem);
```

- [ ] **Step 2: Verify chipset selectors remain unchanged**

Check that these selectors are not reduced as part of the token change:

```css
.totals-top-filter-chip
.skills-search-top-skill-chip
.totals-top-filter-chip-row
.skills-search-top-chipset-row
```

- [ ] **Step 3: Run the shared filter regression test**

Run: `node tests\\ui\\shared-filter-panel-regression.test.js`

Expected: all tests pass

- [ ] **Step 4: Quick visual verification in browser**

Confirm:

```text
- filter panel labels look slightly smaller
- field heights are slightly shorter
- chipset pills remain visually unchanged
```
