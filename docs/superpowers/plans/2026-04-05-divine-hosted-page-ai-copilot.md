# Divine Hosted Page AI Copilot Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe AI copilot to the hosted page studio so owners can describe the page they want, get structured draft changes back, review them, and apply them without bypassing the canonical draft/publish workflow.

**Architecture:** Keep AI on top of the existing hosted-page draft model rather than introducing a second renderer. The copilot should ask Shakespeare for a strict JSON response, parse that into a small set of page patch operations, apply those operations locally to the draft preview, and only persist them when the owner explicitly saves or publishes. This plan intentionally excludes persistent AI history on Nostr, mobile-first AI UI, streaming chat polish, and arbitrary HTML generation.

**Tech Stack:** React 18, TanStack Query, TypeScript, Vitest, shadcn/ui, Shakespeare API hook, existing hosted page studio/page model

---

## Scope Note

This plan covers the first useful AI copilot slice:

- structured prompt-to-draft suggestions
- strict response parsing and validation
- local apply/reject workflow in the page studio
- reuse of the existing save draft / publish flow

This plan does **not** cover:

- persistent AI conversation history across sessions
- full conversational memory stored in Nostr events
- mobile-specific AI UI
- arbitrary code/HTML generation
- custom domain, billing, or Social Lite interactions

## File Structure

### Create

- `src/types/pageCopilot.ts`
  Structured AI response and patch operation types for page editing.
- `src/lib/pageDraftPatches.ts`
  Validation and application logic for AI patch operations against `PageDocument`.
- `src/lib/pageCopilotPrompt.ts`
  Build the AI system/user prompt payload and parse strict JSON responses.
- `src/hooks/usePageCopilot.ts`
  Shakespeare-backed copilot hook with request, apply, reject, and pending suggestion state.
- `src/components/page/PageCopilotPanel.tsx`
  Studio-side AI prompt UI with apply/reject controls and preset prompts.
- `src/components/page/PageDraftChanges.tsx`
  Human-readable summary list of pending AI operations before apply.
- `src/lib/pageDraftPatches.test.ts`
  Tests for patch application, validation, and safety behavior.
- `src/lib/pageCopilotPrompt.test.ts`
  Tests for prompt construction and JSON response parsing.
- `src/hooks/usePageCopilot.test.tsx`
  Tests for Shakespeare integration, error handling, and apply/reject flow.
- `src/components/page/PageCopilotPanel.test.tsx`
  Tests for prompt submission, loading states, and suggestion review UI.

### Modify

- `src/pages/PageStudio.tsx`
  Integrate the AI copilot panel with the existing manual editor and preview.
- `src/components/page/PageStudioShell.tsx`
  Add space for AI-related draft status messaging if needed.
- `src/pages/PageStudio.test.tsx`
  Cover AI panel rendering and apply/reject behavior inside the studio.
- `src/hooks/useShakespeare.ts`
  Only if necessary for model/default option ergonomics; avoid changing transport behavior unless tests require it.
- `src/types/page.ts`
  Add only the minimum draft-local AI metadata needed for the studio session, if any.

## Chunk 1: Structured AI Page Patch Protocol

### Task 1: Define safe page copilot operation types and patch application

**Files:**
- Create: `src/types/pageCopilot.ts`
- Create: `src/lib/pageDraftPatches.ts`
- Test: `src/lib/pageDraftPatches.test.ts`

- [ ] **Step 1: Write the failing patch engine tests**

```ts
import { describe, expect, it } from 'vitest';
import { applyPagePatchOperations } from './pageDraftPatches';

describe('applyPagePatchOperations', () => {
  it('adds a widget using registry defaults', () => {
    const next = applyPagePatchOperations(basePage, [
      { op: 'add-widget', widgetType: 'events' },
    ]);

    expect(next.widgets.map((widget) => widget.type)).toContain('events');
  });

  it('updates page title and summary', () => {
    const next = applyPagePatchOperations(basePage, [
      { op: 'set-page-meta', title: 'Comedian HQ', summary: 'tour dates and clips' },
    ]);

    expect(next.title).toBe('Comedian HQ');
    expect(next.summary).toBe('tour dates and clips');
  });

  it('rejects unknown widget types', () => {
    expect(() =>
      applyPagePatchOperations(basePage, [
        { op: 'add-widget', widgetType: 'unknown-widget' as never },
      ])
    ).toThrow(/unknown widget/i);
  });
});
```

- [ ] **Step 2: Run the patch tests to verify failure**

Run: `npx vitest run src/lib/pageDraftPatches.test.ts`
Expected: FAIL because patch types and helpers do not exist.

- [ ] **Step 3: Add the page copilot types**

```ts
export type PagePatchOperation =
  | { op: 'set-page-meta'; title?: string; summary?: string }
  | { op: 'add-widget'; widgetType: WidgetType; position?: { x: number; y: number }; size?: { w: number; h: number }; config?: WidgetConfig }
  | { op: 'remove-widget'; widgetId: string }
  | { op: 'move-widget'; widgetId: string; x: number; y: number }
  | { op: 'resize-widget'; widgetId: string; w: number; h: number }
  | { op: 'update-widget-config'; widgetId: string; config: WidgetConfig };

export interface PageCopilotSuggestion {
  message: string;
  operations: PagePatchOperation[];
}
```

- [ ] **Step 4: Implement the patch application helper**

```ts
export function applyPagePatchOperations(
  page: PageDocument,
  operations: PagePatchOperation[]
): PageDocument {
  // clone page
  // validate each op against widget registry/current widgets
  // apply sequentially
  // enforce widget size constraints
  // return updated page
}
```

- [ ] **Step 5: Re-run the patch tests**

Run: `npx vitest run src/lib/pageDraftPatches.test.ts`
Expected: PASS for add/remove/move/resize/meta-update safety checks.

- [ ] **Step 6: Commit**

```bash
git add src/types/pageCopilot.ts src/lib/pageDraftPatches.ts src/lib/pageDraftPatches.test.ts
git commit -m "feat: add structured hosted page copilot patch engine"
```

### Task 2: Build the copilot prompt contract and strict response parser

**Files:**
- Create: `src/lib/pageCopilotPrompt.ts`
- Test: `src/lib/pageCopilotPrompt.test.ts`

- [ ] **Step 1: Write the failing prompt/parser tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildPageCopilotMessages, parsePageCopilotResponse } from './pageCopilotPrompt';

describe('buildPageCopilotMessages', () => {
  it('describes the current page and allowed widget types', () => {
    const messages = buildPageCopilotMessages({
      page: basePage,
      userPrompt: 'make this feel more tumblr',
    });

    expect(JSON.stringify(messages)).toContain('profile');
    expect(JSON.stringify(messages)).toContain('events');
    expect(JSON.stringify(messages)).toContain('strict JSON');
  });
});

describe('parsePageCopilotResponse', () => {
  it('parses a valid JSON suggestion', () => {
    const suggestion = parsePageCopilotResponse('{"message":"done","operations":[{"op":"set-page-meta","title":"New"}]}');
    expect(suggestion.message).toBe('done');
    expect(suggestion.operations).toHaveLength(1);
  });

  it('rejects invalid JSON', () => {
    expect(() => parsePageCopilotResponse('not-json')).toThrow(/invalid ai response/i);
  });
});
```

- [ ] **Step 2: Run the prompt/parser tests to verify failure**

Run: `npx vitest run src/lib/pageCopilotPrompt.test.ts`
Expected: FAIL because the prompt builder/parser does not exist.

- [ ] **Step 3: Implement the prompt builder**

```ts
export function buildPageCopilotMessages(input: {
  page: PageDocument;
  userPrompt: string;
}): ChatMessage[] {
  // system: you are a hosted page copilot, return strict JSON only
  // include current page metadata, current widgets, allowed widget types, and operation schema
  // user: raw prompt
}
```

- [ ] **Step 4: Implement strict JSON parsing and validation**

```ts
export function parsePageCopilotResponse(content: string): PageCopilotSuggestion {
  // JSON.parse
  // validate shape
  // reject missing message/operations
}
```

- [ ] **Step 5: Re-run the prompt/parser tests**

Run: `npx vitest run src/lib/pageCopilotPrompt.test.ts`
Expected: PASS for prompt content and parser validation behavior.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pageCopilotPrompt.ts src/lib/pageCopilotPrompt.test.ts
git commit -m "feat: add hosted page copilot prompt contract"
```

## Chunk 2: Shakespeare-Backed Copilot Hook and Review UI

### Task 3: Create a hosted page copilot hook on top of Shakespeare

**Files:**
- Create: `src/hooks/usePageCopilot.ts`
- Test: `src/hooks/usePageCopilot.test.tsx`

- [ ] **Step 1: Write the failing hook tests**

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePageCopilot } from './usePageCopilot';

describe('usePageCopilot', () => {
  it('requests a suggestion from Shakespeare and stores the pending result', async () => {
    const { result } = renderHook(() => usePageCopilot({ page: basePage }));

    await result.current.requestSuggestion('make it more like tumblr');

    await waitFor(() => {
      expect(result.current.pendingSuggestion?.message).toBeTruthy();
    });
  });

  it('applies the pending suggestion to the page draft', async () => {
    const { result } = renderHook(() => usePageCopilot({ page: basePage }));
    await result.current.requestSuggestion('add upcoming shows');

    const nextPage = result.current.applyPendingSuggestion();
    expect(nextPage.widgets.map((widget) => widget.type)).toContain('events');
  });
});
```

- [ ] **Step 2: Run the hook tests to verify failure**

Run: `npx vitest run src/hooks/usePageCopilot.test.tsx`
Expected: FAIL because no hosted-page AI hook exists.

- [ ] **Step 3: Implement the hook**

```ts
export function usePageCopilot({ page }: { page: PageDocument | null }) {
  const { sendChatMessage, isLoading, error, clearError } = useShakespeare();
  const [pendingSuggestion, setPendingSuggestion] = useState<PageCopilotSuggestion | null>(null);

  const requestSuggestion = async (userPrompt: string) => {
    // build messages
    // call sendChatMessage
    // parse assistant content
    // set pending suggestion
  };

  const applyPendingSuggestion = () => {
    // apply patch ops to current page and clear pending suggestion
  };

  const rejectPendingSuggestion = () => {
    setPendingSuggestion(null);
  };
}
```

- [ ] **Step 4: Re-run the hook tests**

Run: `npx vitest run src/hooks/usePageCopilot.test.tsx`
Expected: PASS for request, apply, reject, and error surfacing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePageCopilot.ts src/hooks/usePageCopilot.test.tsx
git commit -m "feat: add hosted page copilot hook"
```

### Task 4: Build the page copilot panel and suggestion review UI

**Files:**
- Create: `src/components/page/PageCopilotPanel.tsx`
- Create: `src/components/page/PageDraftChanges.tsx`
- Test: `src/components/page/PageCopilotPanel.test.tsx`

- [ ] **Step 1: Write the failing component tests**

```tsx
it('submits a prompt and shows apply/reject controls for the pending suggestion', async () => {
  render(<PageCopilotPanel {...props} />);

  fireEvent.change(screen.getByLabelText(/describe your page/i), {
    target: { value: 'make this feel more like tumblr' },
  });
  fireEvent.click(screen.getByRole('button', { name: /generate draft changes/i }));

  expect(await screen.findByRole('button', { name: /apply changes/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the component tests to verify failure**

Run: `npx vitest run src/components/page/PageCopilotPanel.test.tsx`
Expected: FAIL because no copilot panel exists.

- [ ] **Step 3: Implement the panel UI**

```tsx
export function PageCopilotPanel(props: PageCopilotPanelProps) {
  // textarea
  // preset prompts
  // generate button
  // pending suggestion summary
  // PageDraftChanges list
  // apply / reject buttons
}
```

- [ ] **Step 4: Re-run the component tests**

Run: `npx vitest run src/components/page/PageCopilotPanel.test.tsx`
Expected: PASS for prompt submit, loading, error, and review controls.

- [ ] **Step 5: Commit**

```bash
git add src/components/page/PageCopilotPanel.tsx src/components/page/PageDraftChanges.tsx src/components/page/PageCopilotPanel.test.tsx
git commit -m "feat: add hosted page copilot review panel"
```

## Chunk 3: Integrate the Copilot Into the Studio Draft Workflow

### Task 5: Wire AI suggestions into `PageStudio` draft state

**Files:**
- Modify: `src/pages/PageStudio.tsx`
- Modify: `src/components/page/PageStudioShell.tsx`
- Test: `src/pages/PageStudio.test.tsx`

- [ ] **Step 1: Write the failing studio integration tests**

```tsx
it('renders the AI copilot panel in the studio', async () => {
  render(
    <TestApp>
      <PageStudio />
    </TestApp>
  );

  expect(await screen.findByText(/AI Copilot/i)).toBeInTheDocument();
});

it('marks the draft dirty when AI changes are applied', async () => {
  render(
    <TestApp>
      <PageStudio />
    </TestApp>
  );

  fireEvent.click(await screen.findByRole('button', { name: /apply changes/i }));
  expect(screen.getByText(/draft has unpublished changes/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the studio tests to verify failure**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: FAIL because the studio does not yet render or apply AI suggestions.

- [ ] **Step 3: Integrate the copilot panel with local draft state**

```tsx
const copilot = usePageCopilot({ page: workingDraft });

const handleApplyCopilotChanges = () => {
  const nextPage = copilot.applyPendingSuggestion();
  setDraftPage(nextPage);
  setHasDraftChanges(true);
};
```

- [ ] **Step 4: Place the panel in the studio layout**

```tsx
<div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
  <section>{manual editor}</section>
  <section>{preview}</section>
  <aside>{copilot panel}</aside>
</div>
```

- [ ] **Step 5: Keep save/publish behavior unchanged except for AI-applied edits**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: PASS for render, apply, reject, and dirty-draft behavior.

- [ ] **Step 6: Commit**

```bash
git add src/pages/PageStudio.tsx src/components/page/PageStudioShell.tsx src/pages/PageStudio.test.tsx
git commit -m "feat: add ai copilot to hosted page studio"
```

## Verification Sweep

- [ ] Run focused copilot coverage:

```bash
npx vitest run \
  src/lib/pageDraftPatches.test.ts \
  src/lib/pageCopilotPrompt.test.ts \
  src/hooks/usePageCopilot.test.tsx \
  src/components/page/PageCopilotPanel.test.tsx \
  src/components/BentoGridEditor.test.tsx \
  src/pages/PageStudio.test.tsx
```

Expected: PASS

- [ ] Run typecheck and production verification:

```bash
npx tsc --noEmit --pretty false
npm run build
```

Expected: PASS

- [ ] Run the full repo verification command:

```bash
npm test
```

Expected: PASS, with only the existing non-blocking eslint warnings already tolerated by the project.
