# Mobile Filter Panel Switch And Desktop Spacing Design

## Scope

This spec covers only the mobile behavior of the expanded shared filter panel.

Desktop behavior must remain unchanged.

The change has two goals:

1. When the user switches to another filter group on mobile, the selected group should be brought to a stable position near the top of the panel.
2. The expanded mobile panel should use the same spacing rhythm as the desktop filter panel instead of a separate compact mobile spacing system.

## Current Problem

In the current mobile fullscreen panel, switching between ordinary groups works, but the experience is visually inconsistent:

- some groups fit without any panel scrolling;
- long groups, especially `skills`, dramatically increase the panel content height;
- mobile-specific spacing overrides make the panel denser than desktop, so the same filter UI has a different visual rhythm depending on viewport.

This produces a mobile UX where switching groups can feel jumpy and where spacing no longer matches the desktop reference panel.

## Approved Direction

Use a mobile-only behavior change with desktop spacing inheritance:

- keep the fullscreen/mobile panel layout itself;
- keep the current desktop panel styles unchanged;
- remove mobile-only compact spacing overrides for the expanded panel;
- add mobile-only auto-scroll when switching the active group in the expanded panel.

## Behavior

### 1. Mobile-only active group alignment

When the user taps a different filter group title in the expanded mobile panel:

- the tapped group becomes the active and open group;
- the panel scroll container moves only if needed;
- the selected group title is aligned near the top edge of the panel body with a small top offset;
- the page viewport must not scroll;
- only the panel's own scroll container may move.

The alignment target should be visually stable and desktop-compatible, not an edge-to-edge snap.

If the selected group is already close to the desired top position, no scroll adjustment should be applied.

### 2. Desktop spacing inheritance on mobile

In the expanded mobile panel, spacing must inherit the desktop panel rhythm for shared filter groups and their contents.

This includes:

- spacing between filter groups;
- group outer margins and paddings;
- group title paddings;
- spacing between controls inside the opened group body;
- spacing around nested dropdown/filter blocks where the spacing currently comes from panel-specific mobile overrides.

The mobile fullscreen shell is still allowed to stay mobile-specific:

- fixed/fullsreen positioning;
- viewport height handling;
- mobile overlay stacking and layout containment.

Only the component spacing overrides should be normalized back to the desktop values.

## Non-Goals

- No desktop UI changes.
- No redesign of the filter panel structure.
- No special fullscreen submode for `skills`.
- No change to dropdown content logic beyond inherited spacing and existing scroll behavior.

## Implementation Outline

### JS

Update shared filter group switching logic in the report UI runtime:

- detect expanded mobile shared filter mode;
- after activating a new group, measure the selected group title against the panel body scroll container;
- if needed, adjust the panel body scroll position so the group title lands near the top inset;
- keep existing desktop behavior as-is.

### CSS

For the expanded mobile shared filter panel:

- remove the mobile-only compact spacing overrides that compress the shared filter body and group stack;
- let the desktop shared filter spacing rules apply by default;
- preserve only the mobile overlay/layout rules required for fullscreen behavior.

## Testing

Add or update regression checks for:

1. mobile group switching keeps the selected group near the top of the panel body;
2. expanded mobile panel does not use the compact mobile spacing override set anymore;
3. desktop shared filter regression behavior remains unchanged.

Manual browser verification should cover:

- switching from `roles` to `vacancy`;
- switching from `vacancy` to `skills`;
- switching back to `roles`;
- confirming that the page itself does not scroll during panel group switching;
- confirming that spacing in the expanded mobile panel visually matches desktop rhythm rather than the compact mobile variant.

## Risks

- If the desktop spacing is significantly larger, some mobile viewports may no longer fit every group at once in the expanded panel.
- Long sections such as `skills` may still require internal scrolling even after group alignment is improved.

These are acceptable tradeoffs because the approved direction explicitly prioritizes desktop spacing consistency over the previous compact mobile fit.

## Review Notes

This spec intentionally limits the change to mobile-only behavior and spacing normalization. It does not expand scope into redesigning long-section handling.
