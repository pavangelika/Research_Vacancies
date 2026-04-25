# Dashboard Work-Format Card And Chart Density Design

Date: 2026-04-25

## Goal

Refine the `Дашборд` tab so the work-format KPI area reads as one coherent card, chart cards waste less space around visual content, and the vacancy donut total stays visually centered on mobile.

## Scope

This spec covers:

- merging `ONLINE` and `OFFLINE or HYBRID` into one card
- compact KPI layout inside that shared card
- increasing usable chart area inside dashboard cards
- fixing mobile donut-center alignment for the vacancy total

This spec does not change:

- `Топ`
- `Тренды рынка`
- underlying analytics semantics for the work-format and salary payload

## UX Intent

The dashboard should read as one system:

- KPI blocks should feel compact and scan-friendly
- chart cards should prioritize the graphic area over decorative whitespace
- mobile should use the same components as desktop, not alternate chart types or separate layouts

## Work-Format Card

Replace the two standalone cards `ONLINE` and `OFFLINE or HYBRID` with one shared dashboard card.

Structure:

- card title: `Формат работы`
- inside the card: two equal columns
- left column heading: `ONLINE`
- right column heading: `OFFLINE or HYBRID`

Each column contains exactly 6 KPI tiles in a `2 x 3` grid:

1. `Всего`
2. `С з/п`
3. `RUR`
4. `USD`
5. `EUR`
6. `Другая`

Rules:

- keep the current data mapping and counts
- keep the current donut-system visual language
- avoid nested heavy sub-cards inside the shared card
- tiles should be visually compact, with reduced padding and tighter vertical rhythm
- on narrow mobile widths, the inner KPI grid may collapse to one tile per row inside each column, but the shared parent card remains one card

## Chart Density

The dashboard currently leaves too much empty space around charts. Adjust existing card and chart spacing so the visual area expands without changing the overall system.

Apply to:

- `Вакансии` donut area
- `Сгорание вакансий`
- `Анализ работодателей`
- other dashboard chart cards that use the same shell spacing, if affected by the shared styles

Required changes:

- reduce excess card-body padding around charts
- reduce unused stage padding inside chart hosts
- increase the effective width/height allocated to the chart itself
- preserve readability of legends, labels, and controls

Non-goals:

- no separate mobile component tree
- no new decorative wrappers
- no new parallel style layer on top of the existing dashboard system

## Donut Mobile Centering

The vacancy total (`202` in the current dataset) is still not visually centered on mobile.

Fix criteria:

- center the total relative to the donut ring, not the full shell and not the card bounds
- mobile legend/layout changes must not shift the center label
- desktop centering must remain correct

The solution may require changing:

- donut shell sizing
- chart-area sizing
- center-label anchoring

It should not rely on brittle offset tuning tied to a specific count value.

## Code Constraints

- modify current renderers and current styles
- remove obsolete styles after the new layout replaces them
- keep runtime and static UI files in sync
- preserve existing data contracts unless a clear cleanup is required

## Testing

Add or update regression coverage for:

- shared `Формат работы` card structure
- `2 x 3` KPI grid presence per work-format column
- reduced wrapper nesting in the work-format card
- chart-density CSS expectations where practical
- mobile donut center alignment expectations

Manual browser verification on `http://127.0.0.1:9000/report.html`:

- desktop viewport
- mobile viewport
- confirm `Формат работы` is one card with two columns
- confirm the donut total is centered visually on mobile
- confirm chart cards use more of their available area
