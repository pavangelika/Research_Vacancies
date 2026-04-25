# Salary Inline Drilldown Rows Design

Date: 2026-04-25

## Goal

Refine the `Зарплаты` card so:

- `Новые` appears only after clicking `Активные`
- `Опубл. и архивир.` appears only after clicking `Архивные`
- `Активные` and `Архивные` are not shown when they have no values to display

## Scope

This spec covers only the `Зарплаты` module inside the dashboard.

It does not change:

- salary data semantics
- other dashboard cards
- the legend layout

## UX Rules

Each currency section keeps one linear status list.

Parent rows:

- `Активные`
- `Архивные`

Child rows:

- `Новые` belongs to `Активные`
- `Опубл. и архивир.` belongs to `Архивные`

Behavior:

- `Новые` is hidden by default
- `Опубл. и архивир.` is hidden by default
- clicking `Активные` toggles `Новые` directly below it
- clicking `Архивные` toggles `Опубл. и архивир.` directly below it
- only one child belongs to each parent; no deeper nesting

Visibility rules:

- if `Активные` has no points, do not render `Активные`
- if `Архивные` has no points, do not render `Архивные`
- child rows may exist in the model, but they render only when the parent exists and is expanded

## Visual Rules

- keep the current `salary-module` structure
- do not add new cards or a separate accordion component
- parent rows become clickable
- child rows render inline, immediately below the parent row
- child rows should look secondary:
  - slightly more inset
  - quieter label styling
- keep the current chart/track language

## State Rules

- expansion state is local to each currency section
- default collapsed for all currencies
- clicking the same parent again collapses its child row
- clicking one parent should not automatically expand the other parent

## Code Constraints

- modify current runtime and static UI files
- keep runtime and static behavior aligned
- remove any now-unused always-show logic for `Новые` / `Опубл. и архивир.`

## Testing

Add or update regression coverage for:

- parent rows hidden when empty
- child rows hidden by default
- `Новые` appears only under expanded `Активные`
- `Опубл. и архивир.` appears only under expanded `Архивные`
- ordering remains parent then child

Manual browser verification on `http://127.0.0.1:9000/report.html`:

- click `Активные` and confirm `Новые` appears below it
- click `Архивные` and confirm `Опубл. и архивир.` appears below it
- confirm empty parent rows do not render
