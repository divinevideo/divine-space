# Divine Page AI Copilot Design

Date: 2026-04-05
Status: Approved for planning

## Summary

The next hosted-page slice should add an AI copilot to the page studio in `divine.space`.

This copilot should help owners describe the page they want in natural language, receive a structured draft suggestion, review the proposed changes, and apply them safely to the current draft. The copilot must never publish directly and must never bypass the canonical draft page model.

This is an MVP for conversational page building, not a full autonomous website generator.

## Goals

- Add a real AI entry point to the hosted-page studio
- Reuse the existing `useShakespeare` integration instead of inventing a second AI path
- Keep all AI changes draft-only until the owner saves or publishes
- Use structured operations over the canonical page document rather than arbitrary HTML/CSS generation
- Make AI suggestions inspectable and reversible
- Keep the MVP narrow enough to ship on the current frontend branch

## Non-Goals

- Full freeform page generation with arbitrary runtime HTML
- Automatic publishing
- Cross-session AI revision history in `v1`
- Multi-turn server-side agent memory
- Theme/CSS generation as the primary output of the copilot
- Billing, quotas, or provider routing changes beyond the existing Shakespeare integration

## Product Behavior

Inside `PageStudio`, the owner gets a copilot sidecar.

The owner can:

- type a prompt like “make this feel more like Tumblr”
- submit it against the current draft context
- receive a concise assistant reply plus a structured proposal
- inspect the proposed operations
- apply the proposal locally to the working draft
- revert the last AI-applied change
- continue editing manually, save draft, or publish

The assistant can modify only the local draft state in the studio until the owner explicitly saves or publishes.

## User Experience

### Studio Layout

The existing studio keeps:

- left rail: draft status, save, publish
- main workspace: manual editor + preview

The copilot adds a dedicated sidecar in the studio workspace. It should feel like an editing partner, not a separate page. On desktop, it should remain visible beside the editor/preview. On smaller screens, it can stack below them.

### Copilot Flow

1. Owner opens the page studio
2. Owner types a prompt
3. Copilot sends current draft context and the user prompt to Shakespeare
4. Copilot receives structured JSON
5. UI shows:
   - assistant summary
   - proposed operations
   - apply button
   - dismiss button
6. If owner applies the suggestion, the local draft updates immediately
7. Owner can revert the last AI-applied patch before saving/publishing

### Failure States

The copilot should show clear errors for:

- not logged in
- AI request failed
- AI returned invalid JSON
- AI returned unsupported operations

Failures must not mutate the draft.

## Architectural Approach

The copilot should be built around a structured operation model, not direct page replacement.

### Core Principle

AI responses produce a small set of typed page operations. The app validates them, then applies them to the local `PageDocument`.

This keeps AI output:

- bounded
- testable
- reversible
- compatible with the existing draft/publish flow

### Operation Scope for MVP

The first version should support only a constrained set of operations:

- set page title
- set page summary
- add widget
- remove widget
- move/resize widget
- update widget config for simple supported fields

This is enough for meaningful page-building without inventing a full patch language.

## Data Model

Add copilot-specific types for:

- chat messages shown in the studio
- AI suggestion payload returned by the model
- page operation union
- patch application result

The AI payload should look conceptually like:

```json
{
  "message": "I turned this into more of a creator homepage and surfaced your links earlier.",
  "operations": [
    { "type": "set_page_summary", "summary": "Comedian, video maker, and live performer." },
    { "type": "add_widget", "widgetType": "text", "position": { "x": 1, "y": 4 }, "size": { "w": 2, "h": 1 }, "config": { "content": "Upcoming shows and new releases live here." } }
  ]
}
```

The app should validate this object before using it.

## Prompting Strategy

The copilot should send:

- a system prompt that defines the available widget types and allowed operations
- a compact summary of the current draft
- the user’s natural-language request

The system prompt should instruct the model to:

- respond with valid JSON only
- stay within the supported operation set
- avoid custom HTML or CSS
- preserve the creator-homepage / hosted-page framing

## Local Draft Safety

AI edits should apply only to the studio’s local working draft first.

This means the studio must distinguish between:

- persisted draft from Nostr
- unsaved local draft edits
- last AI-applied snapshot for revert

Applying an AI suggestion should mark the draft dirty. Reverting should restore the pre-apply local snapshot and keep the draft dirty until the owner saves or discards later changes.

## Files and Responsibilities

- `src/types/pageCopilot.ts`
  Copilot payload, operation, and conversation types
- `src/lib/pageCopilot.ts`
  Prompt assembly, JSON parsing, validation, and operation application helpers
- `src/lib/pageCopilot.test.ts`
  Unit tests for prompt context, validation, and patch application
- `src/hooks/usePageCopilot.ts`
  Hook that calls `useShakespeare`, validates responses, and exposes suggestion state/actions
- `src/hooks/usePageCopilot.test.tsx`
  Hook tests for success and failure handling
- `src/components/page/PageCopilotPanel.tsx`
  Studio chat sidecar UI
- `src/components/page/PageCopilotPanel.test.tsx`
  UI tests for prompt submit, suggestion display, and apply/revert controls
- `src/pages/PageStudio.tsx`
  Integrate the copilot into the working draft flow
- `src/pages/PageStudio.test.tsx`
  Studio integration tests for AI suggestion apply/revert and save/publish interaction

## Testing Strategy

### Unit Tests

- prompt context summarizes current draft correctly
- invalid JSON is rejected
- unsupported widget types are rejected
- supported operations mutate the page document as expected
- apply/revert logic preserves local draft safety

### Hook Tests

- successful AI response produces a validated suggestion
- failed request exposes an error and does not mutate local state
- malformed response is handled gracefully

### Integration Tests

- owner can submit a copilot prompt in the studio
- applying a suggestion updates the previewed draft
- reverting restores the previous local draft
- publishing after an AI apply saves the updated draft first

## Recommended Scope Boundary

This MVP should stop at “AI can safely suggest and apply structured page edits in the studio.”

Separate future plans should handle:

- streaming conversational UX
- AI-generated theme systems
- long-lived revision history persisted to Nostr
- autonomous multi-step page generation
- cross-provider AI routing and billing
