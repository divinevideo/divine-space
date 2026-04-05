# Divine Page Studio Shell Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/studio/page` into a page-first manual editor with a top bar, full-width canvas, and temporary widget inspector while moving AI and revision history out of the default layout.

**Architecture:** Keep the existing draft/publish and widget models, but simplify the studio shell so the manual route renders one primary page canvas instead of four competing columns. Reuse existing draft hooks, `PageCopilotPanel`, and revision history data, but move AI to `/studio/ai` and history behind a secondary action so the manual route is focused on direct page editing.

**Tech Stack:** React 18, TypeScript, React Router, TanStack Query, shadcn/ui (`Sheet`, `Drawer`, `DropdownMenu`), `react-grid-layout`, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- `src/pages/PageStudio.tsx`
  - Stop rendering side-by-side preview, embedded copilot, and embedded revision history.
  - Own top-level studio state: selected widget, history visibility, add-widget flow, save/publish actions.
- `src/components/page/PageStudioShell.tsx`
  - Replace the left-rail dashboard shell with a thin top-bar shell plus full-width content container.
- `src/components/BentoGridEditor.tsx`
  - Stop owning the add-widget toolbar.
  - Add selection APIs and selected-widget styling so the page canvas can drive an inspector.
- `src/pages/PageStudio.test.tsx`
  - Lock the new shell behavior, route responsibilities, and history/AI absence from the manual route.
- `src/components/BentoGridEditor.test.tsx`
  - Lock widget selection behavior and the toolbar removal.
- `src/AppRouter.tsx`
  - Add `/studio/ai`.

### New files to create

- `src/components/page/PageStudioActionsMenu.tsx`
  - Secondary actions menu for history/recovery and link-out to the AI route.
- `src/components/page/PageStudioAddWidgetMenu.tsx`
  - Top-bar add-widget entry point using the existing widget registry.
- `src/components/page/PageStudioInspector.tsx`
  - Temporary selected-widget inspector using `Sheet` on desktop and `Drawer` on mobile.
- `src/components/page/PageStudioHistorySheet.tsx`
  - Secondary recovery surface that wraps `PageRevisionHistory`.
- `src/pages/PageStudioAi.tsx`
  - Separate AI workflow route using the existing copilot logic.
- `src/pages/PageStudioAi.test.tsx`
  - Route-level tests for the AI screen.

### Existing files to reference

- `src/components/page/PageCopilotPanel.tsx`
- `src/components/page/PageRevisionHistory.tsx`
- `src/hooks/useIsMobile.tsx`
- `src/lib/widgetRegistry.ts`
- `docs/superpowers/specs/2026-04-05-divine-page-studio-shell-design.md`

## Chunk 1: Collapse `/studio/page` Into A Page-First Manual Route

### Task 1: Lock the new manual-route shell in tests

**Files:**
- Modify: `src/pages/PageStudio.test.tsx`
- Reference: `src/pages/PageStudio.tsx`

- [ ] **Step 1: Write the failing shell tests**

Add assertions that the manual route no longer renders:

```tsx
expect(screen.queryByText('Preview')).not.toBeInTheDocument();
expect(screen.queryByTestId('page-copilot-panel')).not.toBeInTheDocument();
expect(screen.queryByTestId('page-revision-history')).not.toBeInTheDocument();
expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused studio test to verify it fails**

Run: `npx vitest run src/pages/PageStudio.test.tsx`

Expected: FAIL because the current page still renders preview, copilot, and revision history in the default layout.

- [ ] **Step 3: Rewrite `PageStudioShell` to a top-bar shell**

Replace the left sidebar grid in `src/components/page/PageStudioShell.tsx` with:

```tsx
<main data-testid="page-studio-shell">
  <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
    <header className="flex items-center justify-between gap-3 rounded-xl border bg-card/90 p-3">
      {/* title + state */}
      {/* add widget / save / publish / actions menu */}
    </header>
    <section className="min-w-0">{children}</section>
  </div>
</main>
```

Do not render the current `aside` cards or publishing explainer.

- [ ] **Step 4: Simplify `PageStudio` to only render the manual editing canvas**

Update `src/pages/PageStudio.tsx` so the route body renders only:

```tsx
<PageStudioShell ...>
  {workingDraft ? (
    <BentoGridEditor ... />
  ) : null}
</PageStudioShell>
```

Remove default rendering of:

- `PagePreview`
- `PageCopilotPanel`
- `PageRevisionHistory`

Keep all existing save/publish/draft bootstrapping logic intact.

- [ ] **Step 5: Run the focused studio test to verify it passes**

Run: `npx vitest run src/pages/PageStudio.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the shell collapse**

```bash
git add src/components/page/PageStudioShell.tsx src/pages/PageStudio.tsx src/pages/PageStudio.test.tsx
git commit -m "refactor: collapse page studio to a single canvas"
```

### Task 2: Move add-widget controls into the top bar

**Files:**
- Create: `src/components/page/PageStudioAddWidgetMenu.tsx`
- Modify: `src/components/BentoGridEditor.tsx`
- Modify: `src/components/BentoGridEditor.test.tsx`
- Modify: `src/pages/PageStudio.tsx`

- [ ] **Step 1: Write the failing editor tests**

Update `src/components/BentoGridEditor.test.tsx` so it asserts the editor no longer owns the add-widget toolbar:

```tsx
expect(screen.queryByTestId('widget-toolbar')).not.toBeInTheDocument();
expect(screen.queryByRole('button', { name: /add widget/i })).not.toBeInTheDocument();
```

Add a `PageStudio` test that still expects `Add Widget` in the route top bar.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npx vitest run src/components/BentoGridEditor.test.tsx src/pages/PageStudio.test.tsx`

Expected: FAIL because `BentoGridEditor` still owns the toolbar.

- [ ] **Step 3: Extract add-widget UI into `PageStudioAddWidgetMenu`**

Create a focused top-bar component that reuses the widget registry:

```tsx
export function PageStudioAddWidgetMenu({ widgets, onAddWidget }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button">Add Widget</Button>
      </PopoverTrigger>
      <PopoverContent>{/* registry-driven widget list */}</PopoverContent>
    </Popover>
  );
}
```

Keep `canAddWidget`, `getDefaultSize`, and registry-driven definitions in one place.

- [ ] **Step 4: Remove the toolbar from `BentoGridEditor` and wire the new top-bar menu from `PageStudio`**

Update `BentoGridEditor` so it only renders the page grid.

Add a `handleAddWidget(type)` path in `PageStudio.tsx` that appends a new widget to the current draft and passes `workingDraft.widgets` to the new top-bar menu.

- [ ] **Step 5: Run the focused tests to verify they pass**

Run: `npx vitest run src/components/BentoGridEditor.test.tsx src/pages/PageStudio.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the toolbar extraction**

```bash
git add src/components/page/PageStudioAddWidgetMenu.tsx src/components/BentoGridEditor.tsx src/components/BentoGridEditor.test.tsx src/pages/PageStudio.tsx src/pages/PageStudio.test.tsx
git commit -m "refactor: move page studio widget adding into the top bar"
```

## Chunk 2: Add A Temporary Inspector Instead Of Permanent Side Panels

### Task 3: Add widget selection plumbing to `BentoGridEditor`

**Files:**
- Modify: `src/components/BentoGridEditor.tsx`
- Modify: `src/components/BentoGridEditor.test.tsx`

- [ ] **Step 1: Write the failing selection tests**

Add tests for a selection API:

```tsx
const onSelectWidget = vi.fn();
render(<BentoGridEditor ... selectedWidgetId={undefined} onSelectWidget={onSelectWidget} />);
fireEvent.click(screen.getByTestId('widget-profile-1'));
expect(onSelectWidget).toHaveBeenCalledWith('profile-1');
```

Also assert selected styling:

```tsx
expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-selected', 'yes');
```

- [ ] **Step 2: Run the focused editor test to verify it fails**

Run: `npx vitest run src/components/BentoGridEditor.test.tsx`

Expected: FAIL because the editor has no selection props.

- [ ] **Step 3: Add selection props and styling**

Update the editor signature:

```tsx
interface BentoGridEditorProps {
  layout: BentoLayout;
  pubkey: string;
  onChange: (layout: BentoLayout) => void;
  selectedWidgetId?: string;
  onSelectWidget?: (widgetId: string) => void;
}
```

Clicking a widget card should select it. Selected cards should expose a stable attribute or class for tests.

- [ ] **Step 4: Run the focused editor test to verify it passes**

Run: `npx vitest run src/components/BentoGridEditor.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the selection plumbing**

```bash
git add src/components/BentoGridEditor.tsx src/components/BentoGridEditor.test.tsx
git commit -m "feat: add page studio widget selection state"
```

### Task 4: Add the temporary inspector surface

**Files:**
- Create: `src/components/page/PageStudioInspector.tsx`
- Modify: `src/pages/PageStudio.tsx`
- Modify: `src/pages/PageStudio.test.tsx`
- Reference: `src/hooks/useIsMobile.tsx`
- Reference: `src/components/ui/sheet.tsx`
- Reference: `src/components/ui/drawer.tsx`

- [ ] **Step 1: Write the failing studio tests**

Add `PageStudio` tests for:

```tsx
fireEvent.click(screen.getByTestId('widget-profile-1'));
expect(screen.getByTestId('page-studio-inspector')).toBeInTheDocument();
expect(screen.getByText(/profile/i)).toBeInTheDocument();
```

Add a close-path assertion so the inspector disappears when dismissed.

- [ ] **Step 2: Run the focused studio test to verify it fails**

Run: `npx vitest run src/pages/PageStudio.test.tsx`

Expected: FAIL because no inspector exists.

- [ ] **Step 3: Create `PageStudioInspector`**

Create a focused component that switches by device size:

```tsx
const isMobile = useIsMobile();

return isMobile ? (
  <Drawer open={open} onOpenChange={onOpenChange}>...</Drawer>
) : (
  <Sheet open={open} onOpenChange={onOpenChange}>...</Sheet>
);
```

Scope it to:

- selected widget identity/type
- remove widget action
- simple layout controls first

Do not move AI or history into this component.

Keep the canvas active on desktop while the inspector is open. Selecting another widget should swap the inspector content in place rather than closing and reopening a second surface.

- [ ] **Step 4: Integrate the inspector into `PageStudio`**

`PageStudio` should own:

```tsx
const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
const selectedWidget = workingDraft?.widgets.find((widget) => widget.id === selectedWidgetId) ?? null;
```

Pass selection props into `BentoGridEditor`, render the inspector conditionally, and wire remove/update actions through existing draft state updates.

- [ ] **Step 5: Run the focused studio tests to verify they pass**

Run: `npx vitest run src/pages/PageStudio.test.tsx src/components/BentoGridEditor.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the inspector**

```bash
git add src/components/page/PageStudioInspector.tsx src/pages/PageStudio.tsx src/pages/PageStudio.test.tsx src/components/BentoGridEditor.tsx src/components/BentoGridEditor.test.tsx
git commit -m "feat: add a temporary page studio widget inspector"
```

## Chunk 3: Move AI And History Into Secondary Surfaces

### Task 5: Bury revision history behind a secondary action

**Files:**
- Create: `src/components/page/PageStudioActionsMenu.tsx`
- Create: `src/components/page/PageStudioHistorySheet.tsx`
- Modify: `src/pages/PageStudio.tsx`
- Modify: `src/pages/PageStudio.test.tsx`

- [ ] **Step 1: Write the failing manual-route tests**

Add tests that history is hidden by default and opens only through a secondary action:

```tsx
expect(screen.queryByTestId('page-revision-history')).not.toBeInTheDocument();
fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
fireEvent.click(screen.getByRole('menuitem', { name: /revision history/i }));
expect(screen.getByTestId('page-revision-history')).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused studio test to verify it fails**

Run: `npx vitest run src/pages/PageStudio.test.tsx`

Expected: FAIL because history is not behind a menu/sheet yet.

- [ ] **Step 3: Create the secondary actions menu and history sheet**

Implement a small top-bar actions menu:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button aria-label="More actions">...</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={openHistory}>Revision history</DropdownMenuItem>
    <DropdownMenuItem asChild><Link to="/studio/ai">Generate with AI</Link></DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Wrap `PageRevisionHistory` in `PageStudioHistorySheet` so it is temporary and secondary.

- [ ] **Step 4: Integrate and wire restore behavior**

Keep `handleRestoreSavedRevision` in `PageStudio`, but render `PageRevisionHistory` only inside the temporary history surface.

- [ ] **Step 5: Run the focused studio test to verify it passes**

Run: `npx vitest run src/pages/PageStudio.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the history surface**

```bash
git add src/components/page/PageStudioActionsMenu.tsx src/components/page/PageStudioHistorySheet.tsx src/pages/PageStudio.tsx src/pages/PageStudio.test.tsx
git commit -m "refactor: move page history behind a secondary studio action"
```

### Task 6: Create the separate AI route

**Files:**
- Create: `src/pages/PageStudioAi.tsx`
- Create: `src/pages/PageStudioAi.test.tsx`
- Modify: `src/AppRouter.tsx`
- Modify: `src/pages/PageStudio.test.tsx`
- Reference: `src/components/page/PageCopilotPanel.tsx`

- [ ] **Step 1: Write the failing AI-route tests**

Add a route-level test:

```tsx
render(<PageStudioAi />);
expect(screen.getByTestId('page-copilot-panel')).toBeInTheDocument();
expect(screen.queryByTestId('page-revision-history')).not.toBeInTheDocument();
expect(screen.getByRole('link', { name: /back to page editor/i })).toBeInTheDocument();
```

Add a router assertion that `/studio/ai` is registered.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npx vitest run src/pages/PageStudioAi.test.tsx src/pages/PageStudio.test.tsx`

Expected: FAIL because the route does not exist yet.

- [ ] **Step 3: Create `PageStudioAi.tsx`**

Build a focused route that reuses the current draft and copilot flow:

```tsx
export default function PageStudioAi() {
  return (
    <Layout>
      <PageStudioShell ...>
        <div className="mx-auto max-w-3xl">
          <PageCopilotPanel ... />
        </div>
      </PageStudioShell>
    </Layout>
  );
}
```

This route may reuse the simplified shell, but it must not reintroduce the four-column manual layout.
It must also operate on the same draft document as `/studio/page`, so accepted AI changes are visible immediately when the owner returns to the manual editor.

- [ ] **Step 4: Register `/studio/ai` and link to it from the secondary actions menu**

Update both apex and subdomain router branches in `src/AppRouter.tsx`.

- [ ] **Step 5: Run the focused tests to verify they pass**

Run: `npx vitest run src/pages/PageStudioAi.test.tsx src/pages/PageStudio.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit the AI split**

```bash
git add src/pages/PageStudioAi.tsx src/pages/PageStudioAi.test.tsx src/AppRouter.tsx src/components/page/PageStudioActionsMenu.tsx src/pages/PageStudio.test.tsx
git commit -m "feat: split page studio ai generation into its own route"
```

## Final Verification

- [ ] **Step 1: Run the focused studio suite**

Run:

```bash
npx vitest run \
  src/pages/PageStudio.test.tsx \
  src/pages/PageStudioAi.test.tsx \
  src/components/BentoGridEditor.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit --pretty false`

Expected: PASS

- [ ] **Step 3: Run full project verification**

Run: `npm test`

Expected: PASS with the same existing lint warnings only.

- [ ] **Step 4: Confirm route responsibilities manually**

Run the app and verify:

- `/studio/page` shows one page canvas with no permanent preview/AI/history panels
- widget selection opens a temporary inspector
- revision history opens only from the secondary actions menu
- `/studio/ai` owns the copilot experience

- [ ] **Step 5: Create the final implementation commit**

```bash
git status --short
git add src/pages/PageStudio.tsx src/components/page src/components/BentoGridEditor.tsx src/components/BentoGridEditor.test.tsx src/AppRouter.tsx src/pages/PageStudioAi.tsx src/pages/PageStudioAi.test.tsx src/pages/PageStudio.test.tsx
git commit -m "refactor: make page studio page-first"
```
