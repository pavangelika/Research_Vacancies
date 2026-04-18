# Employer Analysis Donut-Gradient Alignment

## Goal

Bring the `employer-analysis` salary chart in line with the donut chart visual language:

- reduce the gap between the chart title and the plotted bars
- remove the background grid
- apply the same four gradient color families used by the donut chart

The change must be scoped to `employer-analysis` only.

## Current State

The employer salary chart is rendered with Plotly in `reports/report.ui.js` and duplicated in `reports/static/report.ui.js`.

Current issues:

- the title-to-chart spacing is driven mostly by a large Plotly top margin (`margin.t: 56`)
- grid lines are still enabled through default Plotly axis behavior
- series colors are assigned from a generic palette and do not match donut gradients

## Design

### 1. Spacing

Reduce the visual gap between the chart title and the bars by lowering the Plotly top margin for the employer salary chart. Do not change surrounding panel spacing unless needed for alignment.

### 2. Grid Removal

Disable background grid lines and zero lines on both axes for the employer salary chart. Keep axis labels and bar value labels intact.

### 3. Gradient Palette Mapping

Map employer factors to the same gradient families already used in the donut chart:

- `accreditation` -> donut `active`
- `cover_letter_required` -> donut `new`
- `has_test` -> donut `archived`
- `rating_bucket` -> donut `published_archived`

This mapping applies to the chart bars, not just legends or chips.

### 4. Rendering Strategy

Keep Plotly as the rendering engine. After `Plotly.react()` / `Plotly.newPlot()`, apply SVG gradient fills to the employer salary bars so the bars visually match donut gradients instead of using flat colors.

This avoids a larger chart rewrite and keeps resizing/tooling behavior intact.

## Scope

Files expected to change:

- `reports/report.ui.js`
- `reports/static/report.ui.js`
- `reports/styles.css`
- `reports/static/styles.css`

Possible test update:

- extend or add a focused UI regression check for employer chart visual config where feasible

## Non-Goals

- no redesign of other Plotly charts
- no refactor of donut rendering
- no change to employer table structure or data logic

## Validation

Validation will confirm:

- title sits closer to the plotted bars than before
- employer-analysis chart shows no background grid
- all four employer factor families use donut-matched gradients
- other charts keep their current appearance
