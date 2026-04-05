# Divine AI Draft Workflow Design

Date: 2026-04-05
Status: Approved for planning

## Summary

The next hosted-page slice should turn the existing AI copilot into a trusted draft workflow instead of a single all-or-nothing patch button.

This slice combines three user-facing improvements into one coherent system:

- selective apply for AI proposals
- better proposal UX with readable summaries and grouped actions
- durable draft revision history for saved and published states

The result should make the studio feel less like an AI experiment and more like a real page editor with review, control, and recovery.

## Goals

- Let owners review AI suggestions as structured draft change sets
- Let owners apply only selected operations from an AI proposal
- Replace raw operation-name output with clearer proposal summaries
- Create durable revision history entries whenever the owner saves or publishes
- Keep unsaved local editing fast with lightweight in-memory revert behavior
- Reuse existing Nostr standards where possible instead of inventing a new Divine-only revision kind

## Non-Goals

- Full Photoshop-style local undo history for every drag and keystroke
- Multi-user collaborative editing
- Cross-device real-time merge handling
- Automatic AI publishing
- Persistent arbitrary AI chat memory beyond the current studio conversation
- Branching or named draft trees

## Product Behavior

Inside `PageStudio`, AI suggestions should no longer be rendered as a bare list of raw operation types plus one `Apply suggestion` button.

Instead, each copilot response should become a proposal with:

- a concise headline describing the intended change
- grouped operations presented in readable language
- per-operation checkboxes or toggles
- a clear count of selected operations
- an apply action for only the selected subset
- a dismiss action that clears the current proposal only

When the owner applies selected operations, the local draft updates immediately and remains unsaved until the user explicitly saves or publishes.

When the owner saves the draft or publishes the page, the app should create a durable revision snapshot before or alongside the write so the owner can later inspect and restore prior saved states.

## User Experience

### Proposal Review

The copilot panel should feel like a change review tool.

For each supported operation, the UI should render a friendlier description such as:

- `Rename page title to "Creator Home"`
- `Add text widget near the bottom of the page`
- `Resize links widget to 2 x 1`
- `Remove spacer widget`

Where enough information exists, the UI should also show the target widget label or widget type. The owner should not need to read raw JSON semantics to understand what will happen.

### Selective Apply

All operations in a proposal start selected by default. The owner can deselect any operation before applying.

Applying a subset should:

- validate the filtered suggestion
- update only the local working draft
- preserve the original proposal in UI state until replaced or dismissed
- enable the existing immediate AI revert against the last local apply snapshot

This keeps AI helpful without requiring users to accept a mixed-quality proposal wholesale.

### Revision History

The studio should expose a revision history view or panel showing durable saved states.

Each revision entry should include:

- whether it came from `Save Draft` or `Publish`
- a timestamp
- a compact label or summary
- enough metadata to restore it into the local draft

The initial version does not need diff visualizations or branching. A simple chronological list with preview metadata and restore action is enough.

## Architectural Approach

### Proposal Layer

The existing `PageCopilotSuggestion` structure remains the canonical AI payload, but the studio adds a presentation layer on top of it.

That layer should derive:

- readable operation summaries
- operation identifiers stable enough for selection state
- grouped proposal sections for display

This keeps the AI transport and patch engine simple while allowing a more human reviewable UI.

### Selective Patch Application

Selective apply should not invent a second patch engine.

Instead, the app should filter the selected operations from the validated suggestion and then pass that filtered suggestion through the existing patch application helper. This keeps behavior consistent between full apply and partial apply and reduces logic duplication.

### Durable Revision Storage

Durable revisions should use NIP-37 `kind:31234` draft events rather than a new custom public revision kind.

Each saved revision should store a serialized page snapshot as an unsigned `kind:30512`-shaped payload encrypted to the owner. This is a good fit because:

- revisions are owner-facing editor history, not public content
- it avoids creating a new public Divine-specific event kind
- it fits the existing Nostr pattern for draft storage

The saved page document remains public through the existing `kind:30512` draft and published identifiers. Revision history is private support data around that main model.

## Data Model

### Proposal Types

Add AI draft workflow types for:

- proposal operation view models
- selection state keyed by stable operation IDs
- revision snapshot metadata
- revision restore payloads

The underlying patch engine should still operate on `PageCopilotSuggestion` and `PageCopilotOperation`.

### Revision Snapshot

Each durable revision should contain:

- owner pubkey
- revision event id
- timestamp
- source action: `save-draft` or `publish`
- page identifier being snapshotted
- serialized page snapshot content

The client can derive a lightweight preview label from the stored page title and widget mix after decryption.

## Nostr Model

### Public Page State

Continue using `kind:30512` as the canonical page state for:

- `profile-draft`
- `profile`

### Private Revision State

Store durable revisions as private `kind:31234` draft events addressed to the owner.

The encrypted payload should contain an unsigned serialized page snapshot plus small revision metadata such as source action and identifier. The event should include an `alt` tag describing it as a Divine page revision draft and enough tags to let the client filter revisions by owner and page identifier after decryption support is in place.

This is an inference from NIP-37 usage patterns: the NIP defines `kind:31234` as a draft wrapper for unsigned events, so using it for private page snapshot history aligns better than creating a new custom revision kind.

## Local Draft Safety

The studio must now distinguish among:

- persisted draft state from the current `kind:30512` draft event
- unsaved local working draft
- last AI-applied local snapshot for immediate revert
- durable saved revisions loaded from private history storage

Immediate revert remains a local convenience for the most recent AI apply. Durable revisions are the recovery mechanism after save or publish.

If the owner manually edits after an AI apply, the one-step local AI revert should still be invalidated as it is today. Durable revision history covers longer-lived recovery.

## Components and Responsibilities

- `src/lib/pageCopilot.ts`
  Add proposal summary and operation labeling helpers on top of the existing patch engine
- `src/types/pageCopilot.ts`
  Add view-model and revision metadata types for AI workflow state
- `src/hooks/usePageHistory.ts`
  Query, decrypt, publish, and restore durable page revisions
- `src/hooks/usePageHistory.test.tsx`
  Tests for revision publish/query/restore behavior
- `src/components/page/PageCopilotPanel.tsx`
  Replace raw operation list with selectable proposal UI
- `src/components/page/PageRevisionHistory.tsx`
  Render saved revision list and restore controls
- `src/pages/PageStudio.tsx`
  Integrate selective apply, history panel, and revision creation on save/publish
- `src/pages/PageStudio.test.tsx`
  Add tests for selective apply, revision creation, and restore flow

## Failure States

The workflow should show clear errors when:

- AI returns invalid or unsupported operations
- no operations remain selected for apply
- revision snapshot publish fails during save or publish
- revision history cannot be decrypted
- revision restore fails validation

Failures in history creation should block completion of the corresponding save or publish action. If the product promises durable revisions on save/publish, those writes should not silently succeed without the snapshot.

## Testing Strategy

### Unit Tests

- readable operation summaries for each supported AI operation
- selected-operation filtering preserves valid patch behavior
- revision payload serialization and parsing
- prompt context still includes enough information for targeted widget updates

### Hook Tests

- revision publish on save-draft source
- revision publish on publish source
- revision list query and decrypt behavior
- restore returns the expected page snapshot

### Integration Tests

- owner can deselect part of an AI proposal and apply only the remaining changes
- save draft creates a revision before completing
- publish creates a revision before publishing
- restoring a saved revision updates the working draft without immediate publish
- failed revision creation blocks save/publish completion

## Recommended Scope Boundary

This slice should stop at:

- selectable AI proposals
- readable proposal UX
- durable saved revision history

Separate future work should cover:

- visual diffs between revisions
- named revisions or branching
- cross-session conversational AI memory
- mobile-specific history UI polish
- timeline-style local undo for every studio interaction
