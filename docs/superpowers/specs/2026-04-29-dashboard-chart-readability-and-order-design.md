# Dashboard Chart Readability And Order

## Goal

Refine dashboard chart presentation so the charts remain readable and visually stable on desktop and mobile.

## Requirements

### Salary Chart

- The salary chart legend must not use horizontal scrolling.
- If legend items fit, they remain on a single row.
- If legend items do not fit, they wrap to the next row automatically.
- Value labels must remain centered above their points.
- The distance between a value label and its point must be reduced by 50% from the current fixed offset.
- The row labels `Активные` and `Архивные` must align cleanly with the chart grid instead of looking vertically offset from it.

### Card Order

- The `Зарплата` dashboard block must appear immediately after `Формат работы`.

### Employer Analysis Chart

- Remove the heading text `Анализ работодателей · Средняя зарплата (RUR)` from the chart card.
- Preserve the chart itself.
- Ensure chart lines and plot area do not overflow outside the visual card/container bounds.

### Vacancy Lifetime Chart

- For the `Вакансии / Ср. время жизни` chart, the legend must stay within the container bounds.
- Legend item spacing must match the spacing used by other dashboard legend items.

### Color Readability

- Improve chart readability using a new color treatment that still fits the existing dashboard tab palette.
- Keep the dashboard visual language light and consistent with the current tab.
- Increase contrast for labels, lines, and chart accents where current combinations are hard to read.

## Chosen Approach

Use a focused presentation-layer refinement across the affected dashboard cards:

- keep the data sources and analytics logic unchanged;
- update HTML/CSS layout contracts for legends, labels, and card ordering;
- adjust chart configuration/styling only where needed for clipping, titles, and readability;
- apply the same fixes to both source and static report bundles so browser behavior matches repository source behavior.

## UI Behavior

### Legends

- Legends must prefer a single-row layout when there is enough width.
- Legends must wrap onto additional rows when width is insufficient.
- Legends must stay within the card container and must not rely on horizontal scrolling.
- Legend item padding and spacing should remain visually consistent across cards.

### Labels And Rows

- Salary point labels remain centered above the point.
- The label-to-point gap is reduced by half from the current gap.
- `Активные` and `Архивные` align with the chart rows rather than appearing visually dropped or detached.

### Containers

- Chart drawings, lines, and overlays must remain clipped within the card/container area.
- No chart line should visually cross card boundaries on desktop or mobile.

## Testing

Verification must include:

- updated UI regression coverage where practical for the salary chart contract;
- browser verification on desktop;
- browser verification on mobile.

The browser checks must confirm:

- legend wrapping behavior without horizontal scrolling;
- centered salary labels with reduced gap;
- correct salary card order;
- removed employer-analysis heading text;
- no chart overflow beyond container bounds;
- vacancy lifetime legend remains inside the container with correct spacing.

## Out Of Scope

- changing analytics calculations;
- redesigning unrelated dashboard cards;
- adding new filters, interactions, or chart types;
- changing the underlying report data model.
