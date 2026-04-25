# Dashboard Visual Stability And Card Order Design

Date: 2026-04-26

## Goal

Refine the dashboard so:

- the vacancy donut returns to its earlier visual size
- `Формат работы` becomes quieter and easier to compare
- `Сгорание вакансий` and `Анализ работодателей` use more of their card area
- `Зарплаты` stops feeling jumpy and cramped
- card order better matches meaning and reading flow

## Scope

This spec covers only the dashboard tab.

It includes:

- card order changes
- donut size restoration
- work-format card redesign
- chart spacing cleanup
- salary spacing and label stability tuning

It does not change:

- data semantics
- `Топ`
- `Тренды рынка`
- the salary drilldown logic itself

## Card Order

Use this dashboard order:

1. `Вакансии`
2. `Формат работы`
3. `Зарплаты`
4. `Сгорание вакансий`
5. `Воронка откликов`
6. `Анализ работодателей`

Reasoning:

- `Формат работы` is a direct continuation of the vacancy volume card
- `Зарплаты` should appear after the market structure cards
- `Сгорание вакансий` and `Анализ работодателей` read better as lower analytical layers

## Vacancy Donut

The vacancy donut should return to the previous stronger visual size.

Rules:

- restore the donut chart area to the earlier larger footprint
- keep the total centered relative to the ring
- do not reintroduce the earlier mobile centering bug
- preserve the current drilldown behavior

## Work-Format Card

The current work-format block is too loud relative to its informational value.

Replace the tile-heavy presentation with a quieter comparison card.

Structure:

- one card titled `Формат работы`
- two columns:
  - `ONLINE`
  - `OFFLINE / HYBRID`
- each column uses the same fixed metric rows:
  - `Всего`
  - `С з/п`
  - `RUR`
  - `USD`
  - `EUR`
  - `Другая`

Visual rules:

- avoid loud per-metric tiles
- use one shared visual system with compact rows
- keep secondary share text, but reduce its emphasis
- preserve all current information
- comparison should feel like one matrix, not two separate mini-dashboards

## Burnup And Employer Cards

The chart cards currently waste too much space around the chart area.

Apply to:

- `Сгорание вакансий`
- `Анализ работодателей`

Rules:

- reduce vertical gap between card title and chart
- reduce excessive side padding
- increase effective chart area inside the same card shell
- keep titles readable, but make the chart the dominant element

## Salary Card

The salary card now has the opposite problem:

- labels feel unstable
- spacing is too tight
- the module reads as jittery instead of calm

Adjustments:

- keep side labels next to points
- keep deterministic label placement
- increase spacing enough to restore readability
- stabilize row rhythm so labels do not feel visually noisy
- avoid overly compressed gaps between status rows, currency sections, and label stacks
- mobile should keep the same structure, but with tuned spacing rather than a different component

## Code Constraints

- modify current runtime and static renderers
- modify current styles rather than layering a parallel style system
- remove dead or replaced styles after the redesign
- keep browser behavior stable while changing visual spacing

## Testing

Add or update regression coverage for:

- card order on the dashboard
- restored donut sizing expectations where practical
- calmer work-format comparative structure
- reduced chart padding expectations for burnup and employer cards
- salary spacing and deterministic label-placement expectations

Manual browser verification on `http://127.0.0.1:9000/report.html`:

- desktop viewport
- mobile viewport
- confirm new card order
- confirm vacancy donut looks like the earlier larger version
- confirm `Формат работы` reads as one calm comparison card
- confirm burnup and employer cards waste less space
- confirm salary labels remain stable and easier to read
