# Salary Chart Legend And Label Alignment

## Goal

Fix the dashboard salary chart so that:

- the legend is rendered in a single horizontal row;
- point colors match the legend colors;
- each value label is centered above its point;
- every value label uses the same vertical offset from the point;
- the same behavior is preserved on desktop and mobile.

## Current Problem

The current chart uses side-based label placement (`is-side-left` / `is-side-right`) and multiple vertical label slots. That creates three visible regressions:

- the legend wraps into multiple rows;
- value labels are shifted left or right from the point center;
- value labels use different vertical offsets and some labels are not above the point at all.

The point colors already match the legend colors and must remain unchanged.

## Chosen Approach

Use a simplified presentation contract for the salary chart:

- keep the existing salary data model and point color mapping;
- keep the existing chart structure and currency sections;
- remove side-dependent value label placement as a behavioral requirement;
- render every value label in one consistent mode: centered above the point;
- keep the legend as one horizontal flex row without wrapping.

This is a presentation-layer fix only. The salary data model, value computation, and legend color mapping do not change.

## UI Changes

### Legend

- `.salary-module-legend` must render as a single row.
- Legend items must not wrap.
- If the row becomes wider than the container, horizontal overflow is acceptable; wrapping is not.

### Point Labels

- Every `.salary-module-track-point-value` must be visually centered relative to the point dot.
- Every value label must appear above the point dot.
- Every value label must use the same vertical offset.
- Existing point color styling must remain intact.

### Mobile

- The same centered-above-point behavior must apply on mobile.
- Mobile must not introduce alternate side placement for labels.
- The legend must still remain one row on mobile, even if it requires horizontal scrolling.

## Testing

Add or update a regression test that verifies the salary chart markup and styling contract needed for:

- a one-row legend;
- centered value labels above points;
- removal of side-based label positioning as the primary behavior.

Then verify the result in a browser on:

- desktop viewport;
- mobile viewport.

## Out Of Scope

- changing chart data;
- changing point colors;
- redesigning the chart layout beyond legend and value-label positioning;
- adding new interactions or new responsive breakpoints.
