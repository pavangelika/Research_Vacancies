# Adaptive Filter Panel Scale And Hamburger Toggle Design

## Scope

This spec covers the entire shared filter panel for both desktop and mobile layouts.

The goal is to replace the panel's remaining rigid pixel-based sizing with a single adaptive sizing system and to replace the panel toggle icon with a hamburger icon.

This change applies to:

- the shared filter panel shell;
- panel header, footer, rail, and toggle;
- shared filter groups and their titles and bodies;
- filter controls rendered inside the panel under `#role-selector`;
- dropdown triggers and menus that visually belong to the panel.

## Problem

The filter panel currently mixes two sizing models:

1. newer adaptive custom properties already expressed through `clamp(...)`;
2. older hardcoded `px` paddings, gaps, heights, widths, radii, and offsets layered on top.

This creates several problems:

- desktop and mobile rhythm are only partially related;
- spacing can accumulate from multiple rules and look larger than intended;
- visual scale changes unpredictably between panel subsections;
- future maintenance is hard because a visible size often depends on several unrelated declarations.

The panel toggle icon also still uses a state glyph model rather than the requested hamburger icon.

## Approved Direction

Use a full panel-scale normalization:

- introduce or expand a single source of truth through filter-panel sizing variables;
- migrate panel-relevant rigid sizes to adaptive tokenized values;
- keep business logic unchanged;
- keep the current panel architecture and interaction model;
- replace the visible panel toggle icon with a hamburger icon in both expanded and collapsed states.

## Design

### 1. Single adaptive sizing system

The panel must use panel-level custom properties for all primary visual dimensions:

- panel widths;
- header and footer padding;
- body padding;
- vertical group spacing;
- spacing between fields inside opened groups;
- control heights and minimum heights;
- title and label typography scales;
- icon sizes;
- rail button sizing;
- border radii where panel components still use direct values.

The preferred units are:

- `clamp(...)` for adaptive scale;
- `rem` for typographic and control sizing;
- `%` and logical sizing for width behavior;
- small fixed values only where subpixel or hairline behavior is intentional.

### 2. Remove multi-source spacing conflicts

The visible distance between groups must not be produced by accidental accumulation of:

- panel body `gap`;
- group `margin-top`;
- group `margin-bottom`;
- special mobile-only post-open spacing overrides.

Instead, one controlled rule set must define:

- base spacing between closed groups;
- spacing before and after an opened group;
- field spacing inside opened groups.

This is required because the current panel can look like it has a large gap even when no single rule seems large in isolation.

### 3. Desktop and mobile alignment

Desktop and mobile should use the same sizing vocabulary, but not necessarily identical numeric outputs.

That means:

- a desktop token and a mobile token may resolve through different `clamp(...)` ranges;
- both still come from the same panel scale system and not from unrelated hardcoded rules.

The fullscreen mobile overlay behavior remains mobile-specific, but its internals should still be sized through the same token family as desktop.

### 4. Hamburger toggle icon

The panel toggle must use a hamburger icon rather than the current glyph system.

Requirements:

- the toggle remains a button with current accessibility behavior;
- the icon change does not alter open/close logic;
- the icon must scale with the same adaptive size system as the rest of the panel;
- collapsed and expanded states may differ by orientation, rotation, or styling if needed, but the visible base icon must still read as a hamburger.

## Non-Goals

- No refactor of filter business rules.
- No redesign of filter group order or semantics.
- No change to which filters exist.
- No change to dropdown data sources.
- No new panel mode or route-level behavior.

## Implementation Outline

### CSS

Refactor panel sizing around shared variables and progressively replace panel-related rigid `px` values.

Priority order:

1. shell, widths, toggle, rail;
2. group containers and titles;
3. group body spacing;
4. panel-owned dropdown triggers and menus;
5. residual panel-adjacent controls inside `#role-selector`.

When migrating, remove duplicated or conflicting declarations instead of layering a new adaptive rule on top of an old rigid one.

### JS

Only the toggle icon behavior should change in JS:

- update the icon glyph returned for the shared filter panel toggle;
- preserve aria labels and expanded/collapsed semantics;
- do not change the state machine itself.

## Testing

Regression coverage should verify:

1. panel toggle icon output is the hamburger icon in the shared panel states;
2. mobile and desktop panel sizing no longer depend on the targeted rigid spacing overrides;
3. group spacing is defined by the intended adaptive rules rather than conflicting accumulated margins;
4. existing mobile alignment and dropdown scroll behavior still work.

Manual browser verification should cover:

- desktop expanded panel;
- desktop collapsed rail;
- mobile expanded panel at `390x844`;
- mobile collapsed rail;
- switching between short and long groups such as `roles`, `vacancy`, and `skills`;
- visual confirmation that `skills` remains visible when expected and that spacing no longer feels exaggerated.

## Risks

- A full sizing normalization can expose hidden coupling between panel and nested controls.
- Replacing rigid values too aggressively may shift line breaks or label wrapping.
- Some existing tests may implicitly rely on old pixel values and need to be rewritten around adaptive intent rather than literal numbers.

These are acceptable because the approved option is explicitly a systemic cleanup rather than a local patch.

## Review Notes

This spec intentionally prefers a broad, unified sizing system over incremental patching. The success criterion is not “fewer px literals everywhere in the repo”, but “the full filter panel behaves as one adaptive component system across desktop and mobile”.
