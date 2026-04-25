# Dashboard Donut System Redesign

## Context

This redesign is scoped to the `Dashboard` tab only.

The current dashboard mixes multiple visual languages:

- the vacancy donut card already feels intentional and product-like;
- the burnup chart, salary card, salary coverage card, funnel, and employer analysis card feel like adjacent but separate systems;
- the vacancy donut click interaction shifts the donut arcs and makes the card feel unstable;
- when donut drilldown opens, the current two-column layout leaves awkward empty space or visually mismatched rows;
- on mobile, an expanded filter panel can interfere with tapping dashboard content.

Out of scope for this work:

- `Top` sub-tab
- `Market Trends` sub-tab
- broader report-wide redesign outside the dashboard

## Goals

1. Make all dashboard cards feel like one coherent system using the donut card as the visual benchmark.
2. Remove donut arc movement on interaction; keep the donut geometry stable.
3. Convert the vacancy drilldown into an inline downward expansion that works with a height-aware two-column layout.
4. Rework the salary-related dashboard content so it matches the donut system and avoids duplicated meaning.
5. Replace the current salary coverage card with a KPI-first card that includes explicit `REMOTE` vs `non-REMOTE` salary coverage metrics.
6. Keep the code clean by modifying the current renderers and styles rather than layering parallel styling systems on top.

## Non-Goals

- No redesign of `Top` or `Market Trends`.
- No large cross-report refactor unrelated to dashboard composition.
- No new global design language separate from the current donut palette.
- No preservation of old dashboard-specific styling if it conflicts with the new unified system.

## Source of Truth

The redesign will be implemented in the existing dashboard render and style paths:

- `reports/report.ui.js`
- `reports/static/report.ui.js`
- `reports/styles.css`
- `reports/static/styles.css`

The dashboard must continue to use the current duplicated runtime/static structure already used by the project.

## Design Direction

The vacancy donut card becomes the reference component for the whole dashboard:

- same tonal balance;
- same gradient families;
- same typographic hierarchy;
- same card density and corner language;
- same interaction restraint.

Other dashboard cards do not need to copy the donut literally, but they must feel authored within the same system.

## Dashboard Composition

### Layout Model

The dashboard should move away from row-equalized card behavior and toward a height-aware two-column composition on desktop.

Required behavior:

- cards stack in two columns;
- each card keeps its natural height;
- when a card grows because of expanded content, neighboring cards do not stretch to match;
- following cards should flow upward to fill available space in the shorter column;
- mobile remains a single-column flow.

This is functionally a masonry-like dashboard layout, but it should be implemented with the cleanest approach compatible with the current codebase and browser support expectations.

### Reading Order

Dashboard cards must be arranged for readability first, not legacy order alone.

The intended reading rhythm is:

1. `Vacancies`
2. `Burnup`
3. `Responses Funnel`
4. `Compensation Availability` card (renamed from salary coverage)
5. `Salary Landscape` card (current salary card, redesigned)
6. `Employer Analysis`

The exact visual placement may shift slightly if needed for height balance, but the semantic reading order should remain stable in DOM and accessible traversal.

## Card-by-Card Design

### 1. Vacancies

This remains the primary hero card.

#### What stays

- donut chart structure;
- total vacancy count in the center;
- legend-first interaction model;
- active/archive/new/published-archived segmentation logic.

#### What changes

- clicking legend items or donut segments must not displace arcs, explode slices, or visually move the donut;
- the donut remains geometrically stable in all states;
- interaction only changes active selection styling and drilldown content;
- the drilldown opens below the donut/legend content inside the card;
- drilldown styling should use the same card language as the donut legend, not look like a bolted-on analytics block.

#### Drilldown behavior

- clicking an already active legend item collapses the drilldown;
- clicking another legend item switches the drilldown in place;
- segment click and legend click must stay synchronized;
- drilldown content opens downward and participates in natural card height expansion;
- no neighboring card should be forced to stretch to the same height.

### 2. Burnup

This remains a line chart, but it must feel like it belongs to the donut system.

#### Required visual changes

- use the same gradient/palette families already used in donut semantics;
- reduce technical-chart feel from grid/axes;
- simplify line styling and emphasis hierarchy;
- keep the dominant series visually primary;
- secondary series should stay readable but quieter;
- hover should feel consistent with the dashboard system rather than default Plotly styling.

#### Interaction

- hover remains supported;
- no new drilldown behavior is required in this redesign unless it already exists;
- if click behavior is absent today, it should remain absent rather than introducing partial interactions.

### 3. Responses Funnel

This stays HTML-based.

#### Required changes

- align gradients with donut palette families;
- normalize card spacing, heading treatment, value hierarchy, and internal density;
- reduce the feeling that it is a separate decorative widget;
- preserve the funnel metaphor, but make it feel structurally consistent with the other dashboard cards.

### 4. Compensation Availability

This replaces the current `Покрытие зарплат` card and should be renamed to reflect its broader purpose.

Working naming direction:

- `Доступность зарплаты`
- `Зарплатная доступность`
- `Зарплата и формат работы`

Final naming should prefer the most product-clear option during implementation, but the card must no longer read as a narrow salary coverage widget if it now includes work-format analysis.

#### Content model

This card becomes KPI-first and HTML-based.

It must include:

- overall vacancies with salary;
- overall vacancies without salary;
- overall percentage with salary;
- `REMOTE` vacancies total;
- `REMOTE` vacancies with salary;
- share of `REMOTE` vacancies with salary within `REMOTE`;
- `non-REMOTE` vacancies total;
- `non-REMOTE` vacancies with salary;
- share of `non-REMOTE` vacancies with salary within `non-REMOTE`.

#### Business rule

`REMOTE` means only vacancies with explicit `REMOTE` work format.

Mixed, hybrid, or inferred remote-compatible vacancies must not be merged into this bucket unless they are explicitly marked `REMOTE` by current report data.

#### Design rule

The card must not duplicate the same meaning in multiple visual forms.

Avoid combinations like:

- total with salary;
- percent with salary;
- another mini-grid repeating the same split with different labels;
- work-format splits that restate the same top-level coverage without adding new meaning.

The card should present one clear overview and then one clear `REMOTE` / `non-REMOTE` breakdown.

### 5. Salary Landscape

This is the current `Зарплаты` card and must be redesigned, not just lightly restyled.

#### Required changes

- bring controls into the same component language as the donut legend/actions;
- make the card feel authored in the same system as donut rather than as an older analytics module;
- reduce visual fragmentation from currency panels, tracks, and point labels;
- preserve the analytical purpose of comparing salary levels by experience and status;
- simplify the structure if current subcomponents create unnecessary complexity or visual noise.

#### Design intent

This should feel like the dashboard's salary module in the donut system, not a legacy chart that received new colors.

#### Implementation rule

If the current renderer structure creates duplicated or awkward logic, it should be cleaned up during redesign rather than patched with additive style exceptions.

### 6. Employer Analysis

This remains an employer analysis card and should stay visually aligned with the donut family.

#### Required changes

- maintain the donut-matched gradient families already introduced for employer analysis;
- align heading spacing, content framing, and hover behavior with the redesigned dashboard system;
- make the card feel like a peer to the donut and salary cards, not a special-case module.

## Interaction Rules

### Donut Stability

The vacancy donut must not animate by moving arcs outward or altering the chart footprint during selection.

Allowed interaction signals:

- legend active state;
- segment active state via color/opacity/stroke emphasis;
- drilldown open/close below the chart;
- synchronized selection state in legend and chart.

Disallowed interaction signals:

- segment explosion;
- chart center shifts;
- layout wobble caused by donut geometry changes.

### Mobile Safety

Dashboard interactions must remain tappable when the filter panel is expanded or collapsed.

The redesign should explicitly avoid the current situation where taps intended for dashboard cards can be intercepted by the expanded mobile filter layer.

This means the implementation must verify dashboard click targets on mobile after the layout and card changes.

## Data Requirements

The redesigned `Compensation Availability` card requires dashboard payload support for:

- total vacancies;
- total vacancies with salary;
- total vacancies without salary;
- explicit `REMOTE` vacancy count;
- explicit `REMOTE` vacancies with salary count;
- explicit `non-REMOTE` vacancy count;
- explicit `non-REMOTE` vacancies with salary count.

If the current dashboard payload already contains enough raw vacancy data to compute this in the client without duplicating existing logic, reuse it.

If the current payload lacks the required aggregation cleanly, extend the backend dashboard payload in the narrowest way that keeps dashboard render code simple and avoids repeating ad-hoc filtering in multiple client renderers.

## Code Quality Constraints

1. Modify current renderers and CSS instead of creating parallel replacement styles layered over old ones.
2. Remove obsolete dashboard-specific styles if they become dead after redesign.
3. Keep duplicated runtime/static files behaviorally aligned.
4. Prefer extracting focused helpers if the existing dashboard renderer becomes harder to reason about.
5. Do not let the salary card and compensation availability card compute overlapping metrics through separate incompatible logic paths.

## Testing Requirements

The redesign must be covered by focused regression tests where feasible.

Minimum expected coverage:

- donut interaction no longer relies on segment displacement behavior;
- donut drilldown expands inline below the donut content;
- dashboard layout supports natural-height cards without forced equal-height pairing;
- compensation availability card renders the new `REMOTE` / `non-REMOTE` metrics;
- salary card renderer and markup reflect the new unified structure;
- employer analysis stays on donut-aligned palette behavior;
- mobile interaction check confirms dashboard cards remain tappable when filter panel state changes.

The implementation should favor deterministic renderer/markup tests first, with targeted browser verification second.

## Acceptance Criteria

The redesign is complete when all of the following are true:

- all six dashboard cards feel visually coherent as one system;
- the vacancy donut no longer shifts or explodes on click;
- vacancy drilldown opens downward within the card;
- the two-column dashboard no longer leaves artificial empty row gaps when card heights differ;
- the salary coverage card is replaced by a cleaner KPI-first card with explicit `REMOTE` and `non-REMOTE` salary metrics;
- the salary card is visibly redesigned into the donut system rather than lightly recolored;
- the employer analysis card still matches the donut visual family;
- `Top` and `Market Trends` remain untouched by this redesign;
- mobile dashboard interaction remains usable.

## Files Expected To Change

Primary:

- `reports/report.ui.js`
- `reports/static/report.ui.js`
- `reports/styles.css`
- `reports/static/styles.css`

Likely tests:

- `tests/ui/*dashboard*.test.js`
- `tests/ui/*salary*.test.js`
- `tests/ui/*chart*.test.js`
- other focused UI regression files as needed

Potential backend/dashboard payload files if data support is missing:

- dashboard payload service or related analytics service modules
- corresponding backend contract/service tests

