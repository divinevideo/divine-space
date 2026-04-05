# Divine AI Draft Workflow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current AI copilot into a trusted draft workflow with selective apply, readable proposal UX, and best-effort private revision history for page saves and publishes.

**Architecture:** Build on the existing `PageStudio`, `usePageCopilot`, and `kind:30512` draft/published page flow. Add a private revision layer using NIP-37 `kind:31234` draft-wrap events published through the current write path, then decrypt and filter them client-side by page identifier. Add a presentation layer that converts raw AI operations into readable, selectable proposal items before applying them to the local working draft.

**Tech Stack:** React 18, TypeScript, TanStack Query, Vitest, Testing Library, Nostrify, existing Keycast/Nostr signers with NIP-44 support

---

## Scope Note

This plan covers only the next AI draft workflow slice:

- proposal summaries and grouped operation review
- selective apply for AI operations
- best-effort private revision snapshots on save draft and publish
- revision restore into the local working draft

This plan intentionally excludes:

- visual diffing between revisions
- branching or named revisions
- streaming AI UI
- per-keystroke timeline undo
- mobile-specific history UI polish

## File Structure

### Create

- `src/types/pageHistory.ts`
  Revision metadata and restored snapshot types
- `src/lib/pageHistory.ts`
  Revision serialization, NIP-37 tag builders, decrypt/parse helpers
- `src/lib/pageHistory.test.ts`
  Unit tests for revision helpers
- `src/hooks/usePageHistory.ts`
  Query, publish, and restore private revisions
- `src/hooks/usePageHistory.test.tsx`
  Hook tests for revision publish/query/restore
- `src/components/page/PageRevisionHistory.tsx`
  Saved revision list and restore UI
- `src/components/page/PageRevisionHistory.test.tsx`
  UI tests for revision rendering and restore interactions

### Modify

- `src/types/pageCopilot.ts`
  Add proposal item view-model types and selection metadata
- `src/lib/pageCopilot.ts`
  Add readable proposal summaries, stable operation IDs, and selective-filter helpers
- `src/lib/pageCopilot.test.ts`
  Add tests for proposal summaries and filtered patch application
- `src/components/page/PageCopilotPanel.tsx`
  Render proposal items with per-operation selection and selected apply
- `src/components/page/PageCopilotPanel.test.tsx`
  Add tests for proposal selection and partial apply
- `src/pages/PageStudio.tsx`
  Wire selective apply, revision creation, history panel, and restore behavior
- `src/pages/PageStudio.test.tsx`
  Add studio tests for save/publish revision creation and restore flow

## Chunk 1: Private Revision Foundation

### Task 1: Define revision types and NIP-37 helpers

**Files:**
- Create: `src/types/pageHistory.ts`
- Create: `src/lib/pageHistory.ts`
- Test: `src/lib/pageHistory.test.ts`

- [ ] **Step 1: Write failing helper tests**

```ts
it('builds revision tags for a private 30512 snapshot', () => {
  const tags = buildPageRevisionTags('profile-draft', 'save-draft', 'rev-1');
  expect(tags).toContainEqual(['k', '30512']);
  expect(tags).toContainEqual(['d', 'rev-1']);
});

it('serializes a page snapshot into an unsigned 30512 event payload', () => {
  const payload = createPageRevisionSnapshot(page, 'save-draft');
  expect(payload.kind).toBe(30512);
  expect(payload.tags).toContainEqual(['d', 'profile-draft']);
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npx vitest run src/lib/pageHistory.test.ts`
Expected: FAIL with missing page history helpers.

- [ ] **Step 3: Implement minimal revision types and helpers**

```ts
export interface PageRevisionSnapshot {
  source: 'save-draft' | 'publish';
  pageIdentifier: string;
  createdAt: number;
  unsignedEvent: {
    kind: 30512;
    created_at: number;
    tags: string[][];
    content: string;
  };
}

export function buildPageRevisionTags(identifier: string, source: PageRevisionSource, revisionId: string): string[][] {
  return [
    ['d', revisionId],
    ['k', '30512'],
    ['alt', 'DiVine Space page revision'],
  ];
}
```

- [ ] **Step 4: Re-run the test**

Run: `npx vitest run src/lib/pageHistory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/pageHistory.ts src/lib/pageHistory.ts src/lib/pageHistory.test.ts
git commit -m "feat: add page revision helpers"
```

### Task 2: Build revision query/publish/restore hook

**Files:**
- Create: `src/hooks/usePageHistory.ts`
- Create: `src/hooks/usePageHistory.test.tsx`
- Modify: `src/lib/pageHistory.ts`

- [ ] **Step 1: Write failing hook tests**

```tsx
it('publishes a private revision snapshot encrypted to the owner', async () => {
  const { result } = renderHook(() => usePageHistory('profile-draft'), { wrapper });
  await result.current.createRevision.mutateAsync({ page, source: 'save-draft' });
  expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({ kind: 31234 }));
});

it('queries and decrypts page revisions for the current owner', async () => {
  const { result } = renderHook(() => usePageHistory('profile-draft'), { wrapper });
  await waitFor(() => expect(result.current.data).toHaveLength(1));
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npx vitest run src/hooks/usePageHistory.test.tsx`
Expected: FAIL with missing hook.

- [ ] **Step 3: Implement the hook**

```ts
export function usePageHistory(identifier = 'profile-draft') {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  const revisionsQuery = useQuery({
    queryKey: ['page-history', user?.pubkey, identifier],
    queryFn: async () => {
      // query kind 31234 authored by the user with #k 30512
      // decrypt each payload, parse it, then filter by decrypted pageIdentifier
    },
  });

  const createRevision = useMutation({
    mutationFn: async ({ page, source }) => {
      if (!user?.signer?.nip44) throw new Error('NIP-44 encryption not available');
      const snapshot = createPageRevisionSnapshot(page, source);
      const ciphertext = await user.signer.nip44.encrypt(user.pubkey, JSON.stringify(snapshot.unsignedEvent));
      return publish({ kind: 31234, content: ciphertext, tags: buildPageRevisionTags(page.identifier, source, crypto.randomUUID()) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['page-history', user?.pubkey, identifier] });
    },
  });

  return {
    ...revisionsQuery,
    revisions: revisionsQuery.data ?? [],
    createRevision,
  };
}
```

- [ ] **Step 4: Re-run the tests**

Run: `npx vitest run src/hooks/usePageHistory.test.tsx src/lib/pageHistory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePageHistory.ts src/hooks/usePageHistory.test.tsx src/lib/pageHistory.ts
git commit -m "feat: add page revision history hook"
```

## Chunk 2: Proposal Review and Selective Apply

### Task 3: Add proposal summaries and stable operation selection

**Files:**
- Modify: `src/types/pageCopilot.ts`
- Modify: `src/lib/pageCopilot.ts`
- Modify: `src/lib/pageCopilot.test.ts`

- [ ] **Step 1: Write failing proposal helper tests**

```ts
it('builds readable proposal items from a suggestion', () => {
  const items = buildProposalItems(page, suggestion);
  expect(items[0].label).toMatch(/rename page title/i);
  expect(items[0].operationId).toBeDefined();
});

it('filters a suggestion down to selected operation ids', () => {
  const filtered = filterSuggestionOperations(suggestion, new Set(['op-1']));
  expect(filtered.operations).toHaveLength(1);
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npx vitest run src/lib/pageCopilot.test.ts`
Expected: FAIL with missing proposal helpers.

- [ ] **Step 3: Implement minimal helpers**

```ts
export interface PageCopilotProposalItem {
  operationId: string;
  label: string;
  operation: PageCopilotOperation;
}

export function buildProposalItems(page: PageDocument, suggestion: PageCopilotSuggestion): PageCopilotProposalItem[] {
  return suggestion.operations.map((operation, index) => ({
    operationId: `${operation.type}-${index}`,
    label: summarizePageOperation(page, operation),
    operation,
  }));
}
```

- [ ] **Step 4: Re-run the tests**

Run: `npx vitest run src/lib/pageCopilot.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/pageCopilot.ts src/lib/pageCopilot.ts src/lib/pageCopilot.test.ts
git commit -m "feat: add copilot proposal summaries"
```

### Task 4: Replace raw proposal list with selectable proposal UI

**Files:**
- Modify: `src/components/page/PageCopilotPanel.tsx`
- Modify: `src/components/page/PageCopilotPanel.test.tsx`

- [ ] **Step 1: Write failing panel tests**

```tsx
it('applies only selected proposal items', async () => {
  render(<PageCopilotPanel page={page} onApply={onApply} onRevert={onRevert} canRevert={false} />);
  await screen.findByTestId('copilot-suggestion');
  fireEvent.click(screen.getByLabelText(/rename page title/i));
  fireEvent.click(screen.getByRole('button', { name: /apply selected changes/i }));
  expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ operations: [expect.objectContaining({ type: 'add_widget' })] }));
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npx vitest run src/components/page/PageCopilotPanel.test.tsx`
Expected: FAIL because the panel only supports all-or-nothing apply.

- [ ] **Step 3: Implement the panel selection flow**

```tsx
const proposalItems = copilot.suggestion ? buildProposalItems(page, copilot.suggestion) : [];
const [selectedOperationIds, setSelectedOperationIds] = useState<Set<string>>(new Set());

const filteredSuggestion = filterSuggestionOperations(copilot.suggestion, selectedOperationIds);
onApply(filteredSuggestion);
```

- [ ] **Step 4: Re-run the tests**

Run: `npx vitest run src/components/page/PageCopilotPanel.test.tsx src/lib/pageCopilot.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/page/PageCopilotPanel.tsx src/components/page/PageCopilotPanel.test.tsx
git commit -m "feat: add selective apply to copilot proposals"
```

## Chunk 3: Studio Integration and Revision Restore

### Task 5: Add revision history panel UI

**Files:**
- Create: `src/components/page/PageRevisionHistory.tsx`
- Create: `src/components/page/PageRevisionHistory.test.tsx`

- [ ] **Step 1: Write failing history panel tests**

```tsx
it('renders saved revisions and restores one on click', () => {
  render(<PageRevisionHistory revisions={revisions} onRestore={onRestore} isLoading={false} />);
  fireEvent.click(screen.getByRole('button', { name: /restore creator home/i }));
  expect(onRestore).toHaveBeenCalledWith('rev-1');
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npx vitest run src/components/page/PageRevisionHistory.test.tsx`
Expected: FAIL with missing component.

- [ ] **Step 3: Implement the history panel**

```tsx
export function PageRevisionHistory({ revisions, onRestore }: PageRevisionHistoryProps) {
  return revisions.map((revision) => (
    <button key={revision.id} onClick={() => onRestore(revision.id)}>
      Restore {revision.title ?? revision.pageIdentifier}
    </button>
  ));
}
```

- [ ] **Step 4: Re-run the tests**

Run: `npx vitest run src/components/page/PageRevisionHistory.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/page/PageRevisionHistory.tsx src/components/page/PageRevisionHistory.test.tsx
git commit -m "feat: add page revision history panel"
```

### Task 6: Wire selective apply and revisions into PageStudio

**Files:**
- Modify: `src/pages/PageStudio.tsx`
- Modify: `src/pages/PageStudio.test.tsx`
- Modify: `src/components/page/PageCopilotPanel.tsx`

- [ ] **Step 1: Write failing studio integration tests**

```tsx
it('attempts a revision before saving the draft', async () => {
  render(<PageStudio />);
  fireEvent.click(screen.getByRole('button', { name: /save draft/i }));
  await waitFor(() => expect(createRevision).toHaveBeenCalledWith(expect.objectContaining({ source: 'save-draft' })));
});

it('shows a warning and still saves when revision creation fails', async () => {
  createRevision.mockRejectedValueOnce(new Error('revision failed'));
  render(<PageStudio />);
  fireEvent.click(screen.getByRole('button', { name: /save draft/i }));
  await waitFor(() => {
    expect(updateDraft).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringMatching(/revision/i),
      variant: 'destructive',
    }));
  });
});

it('restores a saved revision into the working draft without publishing', async () => {
  render(<PageStudio />);
  fireEvent.click(screen.getByRole('button', { name: /restore creator home/i }));
  expect(screen.getAllByText('Creator Home').length).toBeGreaterThan(0);
  expect(publishDraft).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: FAIL because PageStudio does not create revisions or restore them.

- [ ] **Step 3: Implement minimal studio integration**

```ts
const revisionHistory = usePageHistory(workingDraft?.identifier ?? 'profile-draft');
const { toast } = useToast();

const handleSaveDraft = async () => {
  try {
    await revisionHistory.createRevision.mutateAsync({ page: workingDraft, source: 'save-draft' });
  } catch (error) {
    toast({ title: 'Revision history failed to save', variant: 'destructive' });
  }
  await saveDraft.mutateAsync(pageDocumentToSiteConfigInput(workingDraft));
};

const handleRestoreRevision = async (revisionId: string) => {
  const restored = await revisionHistory.restoreRevision(revisionId);
  setDraftPage(restored);
};
```

- [ ] **Step 4: Re-run the tests**

Run: `npx vitest run src/pages/PageStudio.test.tsx src/components/page/PageRevisionHistory.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/PageStudio.tsx src/pages/PageStudio.test.tsx src/components/page/PageCopilotPanel.tsx
git add src/components/page/PageRevisionHistory.tsx src/hooks/usePageHistory.ts
git commit -m "feat: add AI draft workflow revisions"
```

## Final Verification

- [ ] **Step 1: Run focused workflow tests**

Run:

```bash
npx vitest run \
  src/lib/pageHistory.test.ts \
  src/hooks/usePageHistory.test.tsx \
  src/lib/pageCopilot.test.ts \
  src/components/page/PageCopilotPanel.test.tsx \
  src/components/page/PageRevisionHistory.test.tsx \
  src/pages/PageStudio.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run typecheck**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected: PASS

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run build
npm test
git status --short --branch
```

Expected:

- build succeeds
- test suite succeeds
- working tree clean or only intended docs changes

- [ ] **Step 4: Final commit**

```bash
git add docs/superpowers/specs/2026-04-05-divine-ai-draft-workflow-design.md
git add docs/superpowers/plans/2026-04-05-divine-ai-draft-workflow.md
git commit -m "docs: add AI draft workflow spec and plan"
```

## Notes for Agentic Workers

- Do not invent a new public custom revision kind unless you find a concrete blocker in NIP-37 usage.
- Keep proposal selection on top of the existing patch engine; do not fork patch logic for partial apply.
- Query revision history with `authors: [user.pubkey]` and `#k: ['30512']`, then filter by page identifier after decrypt.
- In this first slice, revision creation failures should warn but not block save/publish.
- Keep the history UI narrow. A simple list plus restore is enough.
