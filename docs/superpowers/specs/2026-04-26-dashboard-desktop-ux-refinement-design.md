Date: 2026-04-26

# Dashboard Desktop UX Refinement Design

## Goal

Refine the dashboard desktop experience so the cards read as one coherent system, the main KPI card remains legible, and the analytical cards are denser and easier to scan.

This design specifically addresses issues found in desktop browser review:

- the vacancy donut overlaps the right-side legend area
- the work-format card still feels visually noisy
- the salary legend is not fully unified with the donut legend system
- salary labels still feel busy even when they no longer collide
- burnup still wastes vertical space near the title and chart edges
- employer analysis should use the same visual language as the response funnel

## Scope

This spec covers only the `Дашборд` tab in desktop-first layout, with responsive behavior preserved.

It includes:

- vacancy card layout correction
- work-format card cleanup
- salary legend unification and salary readability tuning
- burnup spacing refinement
- employer-analysis redesign
- dashboard card rhythm and spacing consistency

It does not change:

- dashboard data semantics
- `Топ`
- `Тренды рынка`
- filter behavior
- the existing vacancy or salary drilldown rules

## Card Order

Keep this order:

1. `Вакансии`
2. `Формат работы`
3. `Зарплаты`
4. `Сгорание вакансий`
5. `Воронка откликов`
6. `Анализ работодателей`

This order already matches the intended reading flow and should remain unchanged.

## Vacancy Card

The vacancy card must keep the donut visually strong without allowing it to overlap the status legend.

Rules:

- split the card into an explicit left `chart-area` and right `status-area`
- give the right column a protected width so the donut can never intrude into it
- limit donut diameter by the safe width of the chart column, not by the maximum available visual size
- keep a guaranteed gap between the ring and the status list
- preserve exact center alignment of the total label inside the ring
- keep the current drilldown interactions

Secondary cleanup:

- reduce emphasis of zero-value status rows such as `Новые 0` and `Опубл. и архивир. 0`
- keep `Ср. время жизни` visually quieter than the main status rows

## Work-Format Card

Keep one card with two columns:

- `ONLINE`
- `OFFLINE / HYBRID`

Preserve all metrics:

- `Всего`
- `С з/п`
- `RUR`
- `USD`
- `EUR`
- `Другая`

Refinement rules:

- keep the matrix comparison format rather than metric tiles
- reduce row height so the card is shorter and calmer
- visually group rows into:
  - `Объём`: `Всего`, `С з/п`
  - `Валюты`: `RUR`, `USD`, `EUR`, `Другая`
- keep secondary notes, but make them clearly subordinate to the absolute values
- zero-heavy values in `OFFLINE / HYBRID` should stay readable without attracting disproportionate attention

## Salary Card

The salary card should remain data-rich, but stop feeling visually unstable.

### Legend

The salary legend must use the same scheme as the donut legend, not a separate close-enough variant.

Rules:

- reuse the same visual pattern as the donut legend
- match the same background treatment
- match the same border treatment
- match the same internal spacing rhythm
- match the same selected and unselected state styling
- remove residual salary-only legend styles that duplicate donut legend behavior

### Readability

Rules:

- reduce the amount of always-visible emphasis around point labels
- preserve deterministic label placement
- keep labels adjacent to points, but make the whole block calmer
- increase section spacing where needed, while avoiding oversized empty gaps
- make the currency sections feel like one module rather than three stacked mini-screens

## Burnup Card

The burnup card should use more of its card area for the chart itself.

Rules:

- reduce the vertical gap between the title and the chart
- reduce excessive inner side padding
- increase the effective chart footprint inside the card
- keep the title readable, but make the line chart the primary visual object

## Employer Analysis Card

Replace the current employer-analysis presentation with the same visual logic used by `Воронка откликов`.

Structure:

- one horizontal bar per factor
- bar width determined by the absolute value
- label inside the bar on the left
- value inside the bar on the right
- bars sorted by absolute magnitude

Rules:

- reuse the funnel-style filled-bar language so the dashboard feels more unified
- do not keep the current ranked-bar chart with separate outside labels
- if a bar is too short for a full label, use a compact fallback that preserves readability
- keep absolute values, not percentages

## Dashboard Rhythm

The dashboard should feel like one consistent system rather than separate card experiments.

Rules:

- align internal padding logic across cards
- reduce visible mismatches in density between the left and right columns
- avoid cards that look sparse next to cards that look overloaded
- prefer stable layout boundaries over maximum visual expansion of any single chart

## Testing

Add or update regression coverage for:

- vacancy donut not overlapping the status area on desktop
- salary legend using the donut legend styling scheme
- calmer work-format matrix proportions
- tighter burnup spacing
- employer-analysis bar layout based on the funnel presentation model

Manual browser verification on `http://127.0.0.1:9000/report.html`:

- desktop viewport
- confirm no overlap between the vacancy donut and status legend
- confirm `Формат работы` is calmer and shorter
- confirm salary legend matches donut legend styling
- confirm salary labels feel more stable and less visually noisy
- confirm burnup uses more of the card area
- confirm employer analysis reads as funnel-style labeled bars
