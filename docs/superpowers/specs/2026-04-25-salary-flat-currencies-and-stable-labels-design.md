# Salary Flat Currencies And Stable Labels Design

Date: 2026-04-25

## Goal

Refine the dashboard `Зарплаты` card so:

- `Не указан` is fully removed from the salary legend and salary render model
- currencies no longer render as separate visual containers
- `RUR`, `USD`, and `EUR` render inside one shared flat salary area
- point value labels sit next to their points instead of floating above them
- label placement becomes stable and readable instead of jumping between rows

## Scope

This spec covers only the dashboard `Зарплаты` module.

It does not change:

- salary data semantics
- other dashboard cards
- the overall donut-style legend language
- the existing inline parent/child status rule

## UX Rules

The salary card remains one dashboard card with one shared internal chart area.

Currency structure:

- render `RUR`, `USD`, `EUR` as flat sections inside the same shared body
- each currency section uses only a compact heading
- do not wrap each currency section in its own visual panel/card/container chrome
- do not render `Другая`
- do not render `Не заполнена`

Experience legend:

- remove `Не указан` completely
- `Не указан` must not appear in legend, track points, or chart calculations
- this is not conditional; it is treated as invalid for this card

Status rows:

- keep the current status logic
- `Новые` belongs under `Активные`
- `Опубл. и архивир.` belongs under `Архивные`
- child rows appear only through inline drilldown

## Visual Rules

Overall structure:

- one shared `salary-module` body
- no separate bordered or filled currency panels
- currency sections are separated only by spacing and a compact currency label

Point labels:

- value labels render next to the point marker, not stacked above it
- labels stay visually attached to their own point
- labels use a stable side-placement rule rather than ad hoc overlap avoidance

Stable placement rules:

- single point in a row: label renders on the right side of the point
- multiple points in a row: labels are assigned deterministic side slots based on sorted point order
- the same point order must produce the same label side and vertical slot on every render
- placement logic should prefer readability over perfectly symmetric distribution
- label layout must not depend on incidental DOM timing or browser reflow

Readability:

- labels should not overlap the track line
- labels should not jump between top/bottom stacks across renders with the same data
- spacing should remain compact on desktop and mobile

## Data And Rendering Rules

Model filtering:

- remove `Не указан` from the experience legend source
- exclude `Не указан` before building legend items and before assigning point rows
- exclude currencies outside `RUR`, `USD`, `EUR` from the salary overview renderer

Renderer structure:

- replace currency panel wrappers with flat currency sections in the existing module
- keep runtime and static renderers aligned
- do not add a parallel salary component or a second layout system

## Code Constraints

- modify current runtime and static salary files
- delete now-unused currency panel chrome styles if they become dead
- keep the salary legend styling consistent with the donut legend scheme
- avoid layering new styles over obsolete salary panel styles

## Testing

Add or update regression coverage for:

- `Не указан` absent from the salary legend
- `Другая` absent from the salary chart
- flat currency sections render without currency panel containers
- point value labels render beside points
- label placement remains deterministic for the same input order

Manual browser verification on `http://127.0.0.1:9000/report.html`:

- confirm `Не указан` is gone from the salary legend
- confirm only `RUR`, `USD`, `EUR` remain in the salary card
- confirm currencies render as flat sections inside one shared area
- confirm point labels sit beside their points on desktop and mobile
- confirm labels do not visibly jump or stack erratically
