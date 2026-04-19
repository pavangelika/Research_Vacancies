# Filter Panel 5 Percent Scale Reduction

## Goal

Reduce the visual scale of the shared filter panel by `5%` while preserving the current layout structure and responsive behavior.

## Scope

Apply the `5%` reduction to shared filter panel sizing tokens and dependent control dimensions, including:

- field text size
- section label size
- field heights
- related vertical and horizontal paddings
- dropdown item sizing inside the panel

Do not reduce chipsets. This exclusion applies to:

- top filter chips
- skills chips
- any pill-style chip rows already used inside the filter panel

## Approach

Implement the change through existing CSS custom properties that drive the filter panel, rather than patching individual selectors with hardcoded pixel overrides.

The intended result is:

- panel typography becomes slightly smaller
- standard input and dropdown controls become slightly shorter
- spacing remains visually consistent because dependent values continue to derive from shared variables
- chipsets keep their current dimensions and remain visually unchanged

## Constraints

- keep values relative where possible
- avoid one-off per-control tweaks unless a control cannot inherit the shared scale tokens
- preserve current desktop and mobile behavior
- do not alter chipset dimensions as part of this task

## Verification

- confirm the panel renders with slightly smaller typography and fields
- confirm chip rows remain unchanged
- run the existing UI regression test suite that covers shared filter behavior
