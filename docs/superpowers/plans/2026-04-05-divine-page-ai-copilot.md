# Divine Page AI Copilot Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a draft-only AI copilot to the hosted page studio so owners can describe changes in natural language, inspect a structured proposal, apply or revert it locally, and then save or publish explicitly.

**Architecture:** Build on the existing `PageStudio` draft workflow and `useShakespeare` hook. Introduce a small typed page-operation schema plus validation/apply helpers, wrap Shakespeare in a dedicated `usePageCopilot` hook, and render a copilot sidecar in the studio. AI responses mutate only the local working draft until the owner chooses to save or publish.

**Tech Stack:** React 18, TypeScript, TanStack Query, Vitest, Testing Library, shadcn/ui, existing Shakespeare API hook

---

## Scope Note

This plan covers only the first AI copilot MVP:

- prompt input inside `PageStudio`
- structured page-operation suggestions
- local apply/revert flow
- draft save/publish integration
- tests for validation and studio behavior

This plan intentionally excludes:

- streaming UI
- multi-provider routing
- persisted revision history
- theme/CSS generation
- autonomous multi-turn task execution

## File Structure

### Create

- `src/types/pageCopilot.ts`
  AI message, suggestion payload, and page operation types
- `src/lib/pageCopilot.ts`
  Prompt context builder, response parser, operation validator, and patch-application helpers
- `src/lib/pageCopilot.test.ts`
  Unit tests for copilot parsing and patch application
- `src/hooks/usePageCopilot.ts`
  AI hook that wraps `useShakespeare` and exposes suggestion state/actions
- `src/hooks/usePageCopilot.test.tsx`
  Hook tests for success/error behavior
- `src/components/page/PageCopilotPanel.tsx`
  Copilot sidecar UI
- `src/components/page/PageCopilotPanel.test.tsx`
  Copilot panel tests

### Modify

- `src/pages/PageStudio.tsx`
  Integrate the copilot with local working-draft state and save/publish flow
- `src/pages/PageStudio.test.tsx`
  Add studio tests for AI apply/revert/save/publish behavior

## Chunk 1: Copilot Schema and Patch Engine

### Task 1: Define AI copilot types

**Files:**
- Create: `src/types/pageCopilot.ts`
- Test: `src/lib/pageCopilot.test.ts`

- [ ] **Step 1: Write the failing type-driven tests for supported AI operations**

```ts
import { describe, expect, it } from 'vitest';
import { isPageCopilotOperation } from './pageCopilot';

describe('isPageCopilotOperation', () => {
  it('accepts a supported title update operation', () => {
    expect(isPageCopilotOperation({ type: 'set_page_title', title: 'Creator page' })).toBe(true);
  });

  it('rejects an unsupported operation', () => {
    expect(isPageCopilotOperation({ type: 'launch_missiles' })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/pageCopilot.test.ts`
Expected: FAIL with missing copilot types/helpers.

- [ ] **Step 3: Add the copilot operation and payload types**

```ts
export type PageCopilotOperation =
  | { type: 'set_page_title'; title: string }
  | { type: 'set_page_summary'; summary: string }
  | { type: 'add_widget'; widgetType: WidgetType; position?: { x: number; y: number }; size?: { w: number; h: number }; config?: WidgetConfig }
  | { type: 'update_widget'; widgetId: string; updates: Partial<Pick<Widget, 'x' | 'y' | 'w' | 'h' | 'config'>> }
  | { type: 'remove_widget'; widgetId: string };

export interface PageCopilotSuggestion {
  message: string;
  operations: PageCopilotOperation[];
}

export interface PageCopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
```

- [ ] **Step 4: Re-run the test to verify it passes**

Run: `npx vitest run src/lib/pageCopilot.test.ts`
Expected: PASS for operation guards.

- [ ] **Step 5: Commit**

```bash
git add src/types/pageCopilot.ts src/lib/pageCopilot.test.ts
git commit -m "feat: add page copilot operation types"
```

### Task 2: Build prompt context, parsing, and patch application helpers

**Files:**
- Create: `src/lib/pageCopilot.ts`
- Modify: `src/lib/pageCopilot.test.ts`

- [ ] **Step 1: Write failing tests for parsing and draft patch application**

```ts
it('builds compact prompt context from the current draft', () => {
  const context = buildPageCopilotContext(page);
  expect(context).toContain('title: My Page');
  expect(context).toContain('widgets: profile, links');
});

it('applies supported operations to the page draft', () => {
  const nextPage = applyPageCopilotSuggestion(page, {
    message: 'Updated page',
    operations: [{ type: 'set_page_title', title: 'New Title' }],
  });

  expect(nextPage.title).toBe('New Title');
});

it('throws on malformed AI payload', () => {
  expect(() => parsePageCopilotSuggestion('not json')).toThrow(/invalid/i);
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npx vitest run src/lib/pageCopilot.test.ts`
Expected: FAIL with missing parser/context/apply helpers.

- [ ] **Step 3: Implement prompt context and patch utilities**

```ts
export function buildPageCopilotContext(page: PageDocument): string {
  return [
    `title: ${page.title ?? ''}`,
    `summary: ${page.summary ?? ''}`,
    `widgets: ${page.widgets.map((widget) => widget.type).join(', ')}`,
  ].join('\n');
}

export function parsePageCopilotSuggestion(raw: string): PageCopilotSuggestion {
  const parsed = JSON.parse(raw) as unknown;
  // validate shape and operations
}

export function applyPageCopilotSuggestion(page: PageDocument, suggestion: PageCopilotSuggestion): PageDocument {
  // copy page and apply operations in order
}
```

- [ ] **Step 4: Re-run the tests**

Run: `npx vitest run src/lib/pageCopilot.test.ts`
Expected: PASS for context, parsing, and patch application.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pageCopilot.ts src/lib/pageCopilot.test.ts
git commit -m "feat: add page copilot patch engine"
```

## Chunk 2: AI Hook and Sidecar UI

### Task 3: Wrap Shakespeare in a dedicated page copilot hook

**Files:**
- Create: `src/hooks/usePageCopilot.ts`
- Create: `src/hooks/usePageCopilot.test.tsx`

- [ ] **Step 1: Write the failing hook tests**

```tsx
it('submits the current draft context and returns a validated suggestion', async () => {
  const { result } = renderHook(() => usePageCopilot({ page }));
  await result.current.requestSuggestion('Make it more like Tumblr');
  expect(result.current.suggestion?.operations).toHaveLength(1);
});

it('surfaces malformed AI responses as errors', async () => {
  const { result } = renderHook(() => usePageCopilot({ page }));
  await expect(result.current.requestSuggestion('break it')).rejects.toThrow(/invalid/i);
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npx vitest run src/hooks/usePageCopilot.test.tsx`
Expected: FAIL with missing hook.

- [ ] **Step 3: Implement the hook**

```ts
export function usePageCopilot({ page }: { page: PageDocument | null }) {
  const { sendChatMessage, isLoading, error, clearError } = useShakespeare();
  const [messages, setMessages] = useState<PageCopilotMessage[]>([]);
  const [suggestion, setSuggestion] = useState<PageCopilotSuggestion | null>(null);

  const requestSuggestion = async (prompt: string) => {
    // build system prompt + context, call Shakespeare, parse suggestion, update messages/suggestion
  };

  return { messages, suggestion, requestSuggestion, clearSuggestion, isLoading, error, clearError };
}
```

- [ ] **Step 4: Re-run the tests**

Run: `npx vitest run src/hooks/usePageCopilot.test.tsx src/lib/pageCopilot.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePageCopilot.ts src/hooks/usePageCopilot.test.tsx
git commit -m "feat: add page copilot AI hook"
```

### Task 4: Build the copilot sidecar UI

**Files:**
- Create: `src/components/page/PageCopilotPanel.tsx`
- Create: `src/components/page/PageCopilotPanel.test.tsx`

- [ ] **Step 1: Write the failing panel tests**

```tsx
it('submits a prompt and shows the proposed operations', async () => {
  render(<PageCopilotPanel page={page} onApply={onApply} onRevert={onRevert} canRevert={false} />);
  fireEvent.change(screen.getByLabelText(/copilot prompt/i), { target: { value: 'Add a text block' } });
  fireEvent.click(screen.getByRole('button', { name: /ask copilot/i }));
  expect(await screen.findByText(/set_page_title|add_widget/i)).toBeInTheDocument();
});

it('calls onApply when the owner accepts the suggestion', async () => {
  render(<PageCopilotPanel page={page} onApply={onApply} onRevert={onRevert} canRevert />);
  fireEvent.click(await screen.findByRole('button', { name: /apply suggestion/i }));
  expect(onApply).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx vitest run src/components/page/PageCopilotPanel.test.tsx`
Expected: FAIL with missing component.

- [ ] **Step 3: Implement the panel**

```tsx
export function PageCopilotPanel({ page, onApply, onRevert, canRevert }: Props) {
  const [prompt, setPrompt] = useState('');
  const copilot = usePageCopilot({ page });
  // textarea, ask button, assistant summary, operations list, apply/dismiss/revert buttons
}
```

- [ ] **Step 4: Re-run the tests**

Run: `npx vitest run src/components/page/PageCopilotPanel.test.tsx src/hooks/usePageCopilot.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/page/PageCopilotPanel.tsx src/components/page/PageCopilotPanel.test.tsx
git commit -m "feat: add page copilot studio panel"
```

## Chunk 3: Studio Integration and Draft Safety

### Task 5: Integrate AI apply/revert flow into `PageStudio`

**Files:**
- Modify: `src/pages/PageStudio.tsx`
- Modify: `src/pages/PageStudio.test.tsx`

- [ ] **Step 1: Write failing studio integration tests**

```tsx
it('applies an AI suggestion to the local working draft', async () => {
  render(<PageStudio />);
  fireEvent.click(await screen.findByRole('button', { name: /apply suggestion/i }));
  expect(screen.getByText(/draft has unpublished changes/i)).toBeInTheDocument();
});

it('reverts the last AI-applied suggestion', async () => {
  render(<PageStudio />);
  fireEvent.click(await screen.findByRole('button', { name: /revert ai change/i }));
  expect(screen.getByText(/draft is up to date/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the targeted studio tests**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: FAIL because the copilot sidecar is not integrated.

- [ ] **Step 3: Integrate local AI apply/revert into the studio**

```tsx
const [lastAiSnapshot, setLastAiSnapshot] = useState<PageDocument | null>(null);

const handleApplySuggestion = (suggestion: PageCopilotSuggestion) => {
  setLastAiSnapshot(workingDraft);
  setDraftPage(applyPageCopilotSuggestion(workingDraft, suggestion));
  setHasDraftChanges(true);
};

const handleRevertAi = () => {
  setDraftPage(lastAiSnapshot);
  setLastAiSnapshot(null);
};
```

- [ ] **Step 4: Render the panel in the studio layout**

```tsx
<PageCopilotPanel
  page={workingDraft}
  onApply={handleApplySuggestion}
  onRevert={handleRevertAi}
  canRevert={!!lastAiSnapshot}
/>
```

- [ ] **Step 5: Re-run the studio tests**

Run: `npx vitest run src/pages/PageStudio.test.tsx src/components/page/PageCopilotPanel.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/PageStudio.tsx src/pages/PageStudio.test.tsx
git commit -m "feat: integrate AI copilot into page studio"
```

### Task 6: Verify save/publish behavior after AI apply

**Files:**
- Modify: `src/pages/PageStudio.test.tsx`
- Modify: `src/pages/PageStudio.tsx` if needed

- [ ] **Step 1: Write the failing regression test**

```tsx
it('saves the AI-updated draft before publishing', async () => {
  render(<PageStudio />);
  fireEvent.click(await screen.findByRole('button', { name: /apply suggestion/i }));
  fireEvent.click(screen.getByRole('button', { name: /publish/i }));
  await waitFor(() => {
    expect(updateDraft).toHaveBeenCalled();
    expect(publishDraft).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify failure if needed**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: FAIL if AI-applied local changes are not treated as dirty draft state.

- [ ] **Step 3: Ensure AI-applied edits reuse the existing draft dirty/save flow**

Re-use `setHasDraftChanges(true)` and the existing `handlePublish` path. Do not add a second save pipeline.

- [ ] **Step 4: Re-run the studio test**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/PageStudio.tsx src/pages/PageStudio.test.tsx
git commit -m "test: cover AI draft save and publish flow"
```

## Verification Sweep

- [ ] Run focused coverage:

```bash
npx vitest run \
  src/lib/pageCopilot.test.ts \
  src/hooks/usePageCopilot.test.tsx \
  src/components/page/PageCopilotPanel.test.tsx \
  src/pages/PageStudio.test.tsx \
  src/components/BentoGridEditor.test.tsx \
  src/components/BentoGrid.test.tsx
```

Expected: PASS

- [ ] Run typecheck and full app test command:

```bash
npx tsc --noEmit --pretty false
npm test
```

Expected: PASS

- [ ] Run production build:

```bash
npm run build
```

Expected: PASS

## Follow-On Plans

This AI copilot MVP should be followed by separate plans for:

1. Streaming conversational copilot UX and richer history
2. Hosted publishing/domain management
3. Social Lite event kinds and moderation
4. Theme-generation and styling copilot extensions
