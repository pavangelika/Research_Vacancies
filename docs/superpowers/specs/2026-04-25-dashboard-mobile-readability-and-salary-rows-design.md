# Dashboard Mobile Readability And Salary Rows Design

## Scope

This spec covers three targeted dashboard changes:

1. Replace the current `Анализ работодателей` chart with a single component that reads well on both desktop and mobile.
2. Re-center the donut total (`всего`) in the `Вакансии` card on mobile so it remains visually centered inside the donut.
3. Extend `Зарплаты` currency sections so period sub-statuses appear under the correct base statuses without introducing a second visualization pattern.

`Топ` and `Тренды рынка` remain out of scope.

## Goals

- Keep one visual system across desktop and mobile.
- Preserve the existing donut-driven dashboard language.
- Improve mobile readability without creating separate mobile-only chart types.
- Reuse current code paths where possible and remove obsolete styling after replacement.

## Non-Goals

- No redesign of the employer analysis data model.
- No new analytics endpoint.
- No separate mobile layout variant for employer analysis.
- No additional donut interactions beyond current behavior.

## Agreed UX

### Employer Analysis

The current employer chart is hard to read on mobile because it depends on a wide plotting area, axis ticks, and labels placed far apart. It will be replaced with a single ranked-list chart component used in both desktop and mobile.

Each row will contain:

- a short factor label on the left
- a compact absolute value on the right, formatted like `108к`
- a thin horizontal track with a gradient-filled bar

Rules:

- rows are sorted descending by value
- all rows share the same max scale within the card
- no axis line, no tick labels, no secondary outer labels
- colors/gradients reuse the existing donut gradient mapping for employer factors
- desktop and mobile use the same markup; only spacing and wrapping are responsive

This keeps the dashboard visually coherent while removing the main mobile readability failure.

### Vacancy Donut Center

The `всего` block inside the vacancy donut currently shifts on mobile. The center label container will be centered by layout, not by incidental spacing.

Rules:

- the donut center label wrapper is positioned relative to the donut shell
- horizontal and vertical centering must remain stable regardless of legend height or surrounding card layout
- mobile styles must not introduce compensating offsets that push the center away from the geometric donut center

### Salary Module Status Rows

The salary module currently shows base statuses but does not fully reflect the period subsets requested by the user.

Each currency section will render rows in this fixed order:

1. `Активные`
2. `Новые` if present
3. `Архивные` if present
4. `Опубл. и архивир.` if present

Rules:

- `Новые` belongs directly under the active group
- `Опубл. и архивир.` belongs directly under the archived group
- rows reuse the current salary track-row component
- no second chart, no tabs, no extra legend system
- rows with no data are omitted

## Architecture

### Employer Analysis Renderer

The current employer dashboard renderer already computes factor values and maps factors to donut gradients. That data shaping will remain, but the final card renderer will switch from the current SVG/axis-based chart to a ranked-list renderer.

The new renderer will:

- normalize factor rows into `{ key, label, value, compactValue, ratio }`
- sort rows descending by `value`
- render simple semantic rows in HTML
- apply width using an inline ratio or CSS custom property

This avoids Plotly-style chart behavior and removes width-sensitive axis layout problems on mobile.

### Donut Center Layout

The donut shell already contains a dedicated center label block. The change is structural only if needed, but primarily CSS:

- ensure the center container uses absolute centering from the donut shell
- remove any mobile-specific transform or spacing rule that causes drift

### Salary Row Composition

The salary overview chart model already distinguishes status groups. Its row-building logic will be extended so the period-specific subsets are emitted in the requested order.

Expected status mapping:

- `open` -> `Активные`
- `new` -> `Новые`
- `archived` -> `Архивные`
- `period_archived` -> `Опубл. и архивир.`

The renderer will stay on the existing `salary-module-status-row` abstraction.

## Data Flow

### Employer Analysis

- existing analytics source produces factor totals
- renderer converts totals to ranked rows
- UI renders rows using donut gradient tokens

No backend contract change is required.

### Salary Module

- existing salary overview model provides per-currency status rows
- model or row-normalization step inserts `new` and `period_archived` into the output order when data exists
- HTML renderer renders the resulting ordered rows directly

No new endpoint is required. This is a presentational/model composition change.

## Styling

### Employer Analysis

Introduce a focused card-local style set for the ranked-list chart:

- row spacing tuned for one-column mobile reading
- compact typography for labels and values
- thin neutral track
- gradient fill using existing donut palette tokens

Delete old chart-only rules that become unused after replacement, especially rules tied to:

- axis ticks
- chart host sizing for the old employer SVG frame
- unused subgraph wrappers if they are no longer referenced by the dashboard card

### Donut Center

Keep current visual style, change only alignment mechanics.

### Salary Module

Keep current salary module look and legend system. Only row ordering and visibility change.

## Testing

### Automated

Add or update UI regression tests to cover:

- employer analysis uses the new ranked-list markup instead of the old axis-based chart
- salary module renders `Новые` and `Опубл. и архивир.` in the correct order when present
- donut center uses the expected centered container structure/class hooks

Existing salary overview tests should be expanded rather than replaced.

### Browser Verification

Verify on:

- desktop viewport
- mobile viewport

Checks:

- employer analysis is readable without horizontal scanning
- donut total remains centered in the vacancy ring
- salary sections show `Новые` below `Активные` and `Опубл. и архивир.` below `Архивные` when the rows exist

## Risks

- removing old employer chart styles may affect non-dashboard employer analysis views if selectors are too broad
- salary row insertion could accidentally duplicate statuses if normalization is not centralized
- donut centering fixes could regress desktop alignment if the shell/container relationship is not preserved

## Implementation Notes

- change current renderers and current CSS, do not layer a second style system on top
- keep runtime and static report files in sync
- remove obsolete styles only after the new renderer is confirmed to use different hooks
