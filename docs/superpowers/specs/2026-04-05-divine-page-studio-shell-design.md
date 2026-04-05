# Divine Page Studio Shell Design

**Date:** 2026-04-05

## Goal

Replace the current four-column `PageStudio` dashboard with a page-first editing shell that feels like editing a hosted page, not operating a control panel.

## Problem

The current `/studio/page` screen tries to show too many primary surfaces at once:

- left sidebar with draft metadata and publish flow
- manual editor
- separate live preview
- AI copilot panel
- revision history

That creates a cramped four-column layout where the actual page becomes too narrow to understand, preview and edit are redundantly separated, and secondary tools consume the same visual priority as the primary editing task.

The result is exactly what the user called out: too much on screen, unclear hierarchy, and no obvious single job for the page.

## Product Decisions

### 1. `/studio/page` is manual page editing only

This route exists for direct page editing. It should not permanently display AI generation or revision recovery tools.

### 2. `/studio/ai` is a separate surface

AI generation and conversational page building are important, but they are a different task from manual page editing. They should live on their own route instead of competing for space inside the manual studio.

### 3. Revision history is recovery, not primary navigation

Revision history only matters when something went wrong or the owner explicitly wants to restore older work. It should be hidden behind a secondary action or overflow menu, not displayed as a persistent panel.

### 4. Edit and preview are the same surface

The page being edited is the preview. The studio should not render a side-by-side preview pane. If the product wants alternate preview modes later, those should be temporary overlays or mode toggles, not a permanent second column.

## Information Architecture

The hosted page studio splits into three surfaces:

- `/studio/page`: manual page editing
- `/studio/ai`: AI-assisted page generation and structured suggestions
- recovery/history access: secondary entry from the manual studio, not a top-level visual panel

This keeps each route focused on one primary job.

## `/studio/page` Layout

### Top Bar

The screen should start with a thin, persistent top bar containing only primary controls:

- page title or draft name
- draft state indicator
- `Add Widget`
- `Save Draft`
- `Publish`
- overflow menu for secondary actions like history/recovery

The top bar replaces the current left-column draft summary and publish explainer card.

### Main Canvas

The main area should be one full-width hosted page canvas using the same rendering style and approximate width as the public page.

This is the center of the route. It should dominate the layout visually and spatially.

There should be:

- no permanent metadata sidebar
- no permanent preview column
- no permanent AI column
- no permanent revision/history panel

### Selection-Based Inspector

Widget configuration should move into a temporary inspector that opens only when a widget is selected.

Recommended behavior:

- desktop: right-side drawer
- mobile: bottom sheet

The inspector owns:

- widget-specific settings
- move/remove actions
- size/layout controls where relevant
- any widget-level toggles

When no widget is selected, the inspector is closed and the canvas gets the full width.

## Editing Model

The owner is always acting on the page itself.

Primary interactions:

- click or tap a widget to select it
- drag and resize widgets on the page canvas
- use `Add Widget` from the top bar to insert new blocks
- use the inspector only when deeper controls are needed

Inspector behavior should be stable:

- selecting a different widget swaps the inspector content in place
- on desktop, the inspector does not fully replace the canvas
- the page remains visible while the inspector is open
- dragging or resizing the selected widget updates the same draft while the inspector stays open

The inspector is temporary support chrome, not a separate editing mode.

This creates a clear hierarchy:

1. page
2. selected widget
3. temporary controls

instead of the current hierarchy of multiple competing panels.

## Add Widget Flow

`Add Widget` remains part of the primary studio flow, but it should open as a lightweight menu, popover, or drawer anchored to the top bar rather than occupying permanent screen space.

The insertion flow should feel like “add something to my page,” not “manage widgets from a control sidebar.”

## AI Surface

`/studio/ai` should own the AI workflow completely:

- prompt entry
- generated layout suggestions
- structured draft changes
- apply/dismiss review flow

Manual editing should not permanently display those controls.

`/studio/page` can link to `/studio/ai`, but it should not embed the copilot panel by default.

AI and manual editing still operate on the same draft document:

- `/studio/ai` reads the current draft
- accepted AI changes write back into that same draft
- returning to `/studio/page` shows those draft changes immediately

This is a route split, not a data-model split.

## History and Recovery

Revision history should move behind a secondary affordance in the manual studio, such as:

- overflow menu item in the top bar
- modal
- drawer
- separate recovery route if needed later

It should not consume first-screen real estate on desktop.

## Mobile Behavior

The same model should hold on mobile:

- top bar with primary actions
- single page canvas
- no stacked dashboard sections above or below the page
- widget inspector opens as a bottom sheet

The mobile studio should still feel page-first, not form-first.

## Implementation Direction

The current `PageStudioShell` should be replaced or radically simplified into a canvas-first shell. `PageStudio` should stop rendering side-by-side preview, embedded copilot, and embedded revision history. Existing hooks for draft save/publish, copilot, and revision history stay valuable, but they move behind a different route/layout structure.

## Non-Goals

This redesign does not change:

- the underlying draft/publish model
- the widget model itself
- AI suggestion semantics
- revision storage format

This is a studio-shell and route-responsibility redesign, not a rebuild of the page system.

## Testing Focus

The redesign should be validated with tests that confirm:

- `/studio/page` no longer renders side-by-side edit/preview columns
- copilot is not rendered on the manual page route
- revision history is not rendered by default on the manual page route
- top bar actions still save and publish correctly
- widget selection opens the inspector
- mobile mode uses sheet/drawer presentation rather than permanent columns
