# Divine Hosted Page Core Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed profile/customization split with a canonical draft/published hosted page system that powers a real studio in `divine.space` and a sidebar-bento public page on `username.divine.video`, with enough mixed-media and upcoming-events support to function like a real creator homepage.

**Architecture:** Build on the existing `kind:30512` site-config path instead of inventing a second page model. Introduce a shared canonical page document with draft and published identifiers, render the published document through a dedicated public page renderer, and move owner editing into a first-class studio route that migrates legacy Divine profile/MySpace data into a starter draft. Include a first-class upcoming/events widget backed by `NIP-52` calendar events so the public page reads like a creator site, not only a social profile. This plan intentionally excludes AI copilot behavior, guestbook/follow event kinds, and self-host export; it creates the foundation they will plug into.

**Tech Stack:** React 18, React Router 6, TanStack Query, Nostrify, TypeScript, Vitest, react-grid-layout, shadcn/ui

---

## Scope Note

The approved spec spans multiple independent subsystems. This plan covers only the critical path:

- canonical hosted page model
- draft/published `30512` document flow
- public sidebar-bento rendering
- owner studio and manual widget editing
- mixed-media creator archive support through existing posts/media widgets
- first-class upcoming/events support using `NIP-52`
- migration from legacy profile/MySpace data

Follow-on plans are still required for:

- AI copilot and draft patching
- Social Lite event kinds and moderation
- self-host/NIP-5A export
- custom domain billing/admin

## File Structure

### Create

- `src/types/page.ts`
  Canonical page document, draft/publish identifiers, social-lite/widget-ready types shared by studio and public rendering.
- `src/lib/pageIdentifiers.ts`
  Helpers for `profile` / `profile-draft` identifiers and public URL calculations.
- `src/lib/pageMigration.ts`
  Convert existing profile, MySpace, and site-config data into a starter draft page.
- `src/lib/sidebarBentoLayout.ts`
  Canonical sidebar-bento defaults and layout helpers, extracted away from legacy `defaultLayout.ts`.
- `src/hooks/usePageDocument.ts`
  Query/mutation hooks for draft page, published page, publish action, and starter-draft creation.
- `src/hooks/useCalendarEvents.ts`
  Read and validate `NIP-52` calendar events for creator upcoming/appearance rendering.
- `src/components/page/PublicPageShell.tsx`
  Shared layout wrapper for the hosted sidebar-bento public page.
- `src/components/page/PublicPageRenderer.tsx`
  Render a canonical page document into widget components.
- `src/components/page/PageStudioShell.tsx`
  Owner-facing studio wrapper with draft status, preview affordances, and publish controls.
- `src/components/page/PagePreview.tsx`
  Draft preview renderer reused by the studio.
- `src/pages/PageStudio.tsx`
  First-class owner studio route inside `divine.space`.
- `src/components/widgets/EventsWidget.tsx`
  Upcoming events widget backed by validated `NIP-52` calendar events.
- `src/lib/pageMigration.test.ts`
  Tests for starter-draft generation and identifier behavior.
- `src/hooks/usePageDocument.test.tsx`
  Tests for draft/published fetch and publish mutations.
- `src/hooks/useCalendarEvents.test.tsx`
  Tests for `NIP-52` querying, validation, and sorting.
- `src/components/page/PublicPageRenderer.test.tsx`
  Tests for widget-backed public rendering and legacy fallback behavior.
- `src/components/widgets/EventsWidget.test.tsx`
  Tests for events widget rendering and empty states.
- `src/pages/PageStudio.test.tsx`
  Tests for studio bootstrapping, preview, and publish controls.

### Modify

- `src/types/site.ts`
  Stop duplicating widget concepts; align site-config types with the canonical page document.
- `src/types/widgets.ts`
  Ensure widget types/configs remain the single source of widget shape and constraints.
- `src/lib/parseSiteConfig.ts`
  Allow arbitrary `d` identifiers (`profile`, `profile-draft`) and preserve canonical page fields.
- `src/lib/defaultLayout.ts`
  Repoint legacy defaults to sidebar-bento helpers or deprecate legacy-only exports.
- `src/hooks/useSiteConfig.ts`
  Generalize fetch/update helpers to accept page identifiers and avoid hardcoding `profile`.
- `src/hooks/useDivineProfile.ts`
  Read the published hosted page where appropriate and stop treating dormant site config as unrelated metadata.
- `src/components/BentoGrid.tsx`
  Render canonical page/widget data for preview/public use.
- `src/components/BentoGridEditor.tsx`
  Replace placeholder-only editing with real widget-backed preview tiles and stable draft onChange behavior.
- `src/lib/widgetRegistry.ts`
  Register the `events` widget and set appropriate default sizing/constraints.
- `src/pages/Profile.tsx`
  Render the published hosted page when it exists; keep a legacy fallback only while migrating.
- `src/pages/Settings.tsx`
  Point profile editing users toward the new studio.
- `src/pages/MySpaceSettings.tsx`
  Retire or narrow this page to legacy migration/settings that are not moved into the studio yet.
- `src/components/Layout.tsx`
  Add a clear `My Page` / `Studio` navigation entry.
- `src/AppRouter.tsx`
  Add the studio route and route public subdomain traffic through the hosted page renderer path.
- `src/hooks/useSubdomain.ts`
  Detect hosted public pages on `.divine.video` in addition to existing behavior.

## Chunk 1: Canonical Page Document and Draft/Publish Plumbing

### Task 1: Create canonical page types and identifier helpers

**Files:**
- Create: `src/types/page.ts`
- Create: `src/lib/pageIdentifiers.ts`
- Modify: `src/types/site.ts`
- Modify: `src/types/widgets.ts`
- Test: `src/lib/pageMigration.test.ts`

- [ ] **Step 1: Write the failing tests for page identifiers and draft/publish metadata**

```ts
import { describe, expect, it } from 'vitest';
import { getPublishedPageIdentifier, getDraftPageIdentifier } from './pageIdentifiers';

describe('page identifiers', () => {
  it('uses profile for the published page', () => {
    expect(getPublishedPageIdentifier()).toBe('profile');
  });

  it('uses profile-draft for the owner draft', () => {
    expect(getDraftPageIdentifier()).toBe('profile-draft');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/pageMigration.test.ts`
Expected: FAIL with missing page identifier helpers/types.

- [ ] **Step 3: Add the canonical page types and helpers**

```ts
export interface PageDocument {
  identifier: 'profile' | 'profile-draft' | string;
  title?: string;
  summary?: string;
  shell: { type: 'sidebar-bento' };
  widgets: Widget[];
  contentMode?: 'profile' | 'creator-site';
  draftState?: { lastPublishedAt?: number };
}

export function getPublishedPageIdentifier() {
  return 'profile';
}

export function getDraftPageIdentifier() {
  return 'profile-draft';
}
```

- [ ] **Step 4: Update `src/types/site.ts` and `src/types/widgets.ts` to remove duplicate widget drift**

```ts
import type { Widget, WidgetType } from '@/types/widgets';
import type { PageDocument } from '@/types/page';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/pageMigration.test.ts`
Expected: PASS for identifier assertions.

- [ ] **Step 6: Commit**

```bash
git add src/types/page.ts src/lib/pageIdentifiers.ts src/types/site.ts src/types/widgets.ts src/lib/pageMigration.test.ts
git commit -m "refactor: add canonical hosted page types"
```

### Task 2: Generalize site-config parsing for draft and published pages

**Files:**
- Modify: `src/lib/parseSiteConfig.ts`
- Modify: `src/hooks/useSiteConfig.ts`
- Test: `src/hooks/usePageDocument.test.tsx`

- [ ] **Step 1: Write the failing tests for arbitrary page identifiers**

```ts
it('parses a published profile page config', () => {
  expect(parseSiteConfig(profileEvent)?.identifier).toBe('profile');
});

it('parses a draft page config', () => {
  expect(parseSiteConfig(draftEvent)?.identifier).toBe('profile-draft');
});
```

- [ ] **Step 2: Run the targeted tests and confirm failure**

Run: `npx vitest run src/hooks/usePageDocument.test.tsx`
Expected: FAIL because `useSiteConfig` and `siteConfigToTags` are still hardcoded to `profile`.

- [ ] **Step 3: Make `parseSiteConfig` and `siteConfigToTags` identifier-aware**

```ts
export function siteConfigToTags(input: SiteConfigInput, pubkey: string, identifier = 'profile'): string[][] {
  return [
    ['d', identifier],
    ['alt', identifier === 'profile-draft' ? 'Divine Space draft page configuration' : 'Divine Space site configuration'],
  ];
}
```

- [ ] **Step 4: Generalize `useSiteConfig` into an identifier-aware primitive**

```ts
export function useSiteConfig(pubkey: string | undefined, identifier = 'profile') {
  // query with authors + #d:[identifier]
}
```

- [ ] **Step 5: Run the tests to verify parsing and querying now pass**

Run: `npx vitest run src/hooks/usePageDocument.test.tsx src/hooks/useSiteConfig.test.tsx`
Expected: PASS for both published and draft identifier cases.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parseSiteConfig.ts src/hooks/useSiteConfig.ts src/hooks/usePageDocument.test.tsx
git commit -m "refactor: support draft and published page identifiers"
```

### Task 3: Implement starter draft migration from legacy profile data

**Files:**
- Create: `src/lib/sidebarBentoLayout.ts`
- Create: `src/lib/pageMigration.ts`
- Modify: `src/lib/defaultLayout.ts`
- Test: `src/lib/pageMigration.test.ts`

- [ ] **Step 1: Write the failing migration tests**

```ts
it('builds a sidebar-bento starter draft from profile metadata and MySpace settings', () => {
  const draft = createStarterDraft({
    profile: { name: 'alice', about: 'hello', website: 'https://example.com' },
    myspace: { music: { url: 'https://track.test' } },
  });

  expect(draft.identifier).toBe('profile-draft');
  expect(draft.widgets.map((w) => w.type)).toContain('profile');
  expect(draft.widgets.map((w) => w.type)).toContain('links');
  expect(draft.widgets.map((w) => w.type)).toContain('music');
});
```

- [ ] **Step 2: Run the migration test and verify failure**

Run: `npx vitest run src/lib/pageMigration.test.ts`
Expected: FAIL because starter draft helpers do not exist.

- [ ] **Step 3: Implement sidebar-bento defaults and migration helpers**

```ts
export function createSidebarBentoWidgets(): Widget[] {
  return cloneLayoutWidgets(defaultWidgets);
}

export function createStarterDraft(input: StarterDraftInput): PageDocument {
  return {
    identifier: getDraftPageIdentifier(),
    shell: { type: 'sidebar-bento' },
    contentMode: 'creator-site',
    widgets: mergeLegacyDataIntoSidebarLayout(input),
  };
}
```

- [ ] **Step 4: Update `src/lib/defaultLayout.ts` to source sidebar defaults from the new helper**

```ts
export { defaultSidebarWidgets as defaultWidgets } from '@/lib/sidebarBentoLayout';
```

- [ ] **Step 5: Run the migration tests again**

Run: `npx vitest run src/lib/pageMigration.test.ts src/lib/widgets.test.ts`
Expected: PASS, with legacy defaults still producing valid widget layouts.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sidebarBentoLayout.ts src/lib/pageMigration.ts src/lib/defaultLayout.ts src/lib/pageMigration.test.ts
git commit -m "feat: generate starter draft pages from legacy profile data"
```

## Chunk 2: Public Hosted Page Rendering

### Task 4: Add a published-page hook and publish mutation

**Files:**
- Create: `src/hooks/usePageDocument.ts`
- Modify: `src/hooks/useSiteConfig.ts`
- Test: `src/hooks/usePageDocument.test.tsx`

- [ ] **Step 1: Write the failing hook tests**

```ts
it('fetches the published page with identifier profile', async () => {
  const { result } = renderHook(() => usePublishedPageDocument(pubkey), { wrapper });
  await waitFor(() => expect(result.current.data?.identifier).toBe('profile'));
});

it('publishes the draft page into the published identifier', async () => {
  await result.current.publishDraft.mutateAsync();
  expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
    tags: expect.arrayContaining([['d', 'profile']]),
  }));
});
```

- [ ] **Step 2: Run the hook tests and verify failure**

Run: `npx vitest run src/hooks/usePageDocument.test.tsx`
Expected: FAIL because no published/draft orchestration exists.

- [ ] **Step 3: Implement draft/published hooks and publish action**

```ts
export function useDraftPageDocument(pubkey?: string) {
  return useSiteConfig(pubkey, getDraftPageIdentifier());
}

export function usePublishedPageDocument(pubkey?: string) {
  return useSiteConfig(pubkey, getPublishedPageIdentifier());
}

export function usePublishPageDocument() {
  // read draft, write published, invalidate both caches
}
```

- [ ] **Step 4: Add starter-draft bootstrap mutation**

```ts
export function useEnsureStarterDraft() {
  // if no draft exists, create one from legacy migration helpers
}
```

- [ ] **Step 5: Re-run the hook tests**

Run: `npx vitest run src/hooks/usePageDocument.test.tsx src/hooks/useSiteConfig.test.tsx`
Expected: PASS for draft fetch, published fetch, bootstrap, and publish.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePageDocument.ts src/hooks/useSiteConfig.ts src/hooks/usePageDocument.test.tsx
git commit -m "feat: add draft and published hosted page hooks"
```

### Task 5: Add an upcoming/events widget backed by `NIP-52`

**Files:**
- Create: `src/hooks/useCalendarEvents.ts`
- Create: `src/components/widgets/EventsWidget.tsx`
- Modify: `src/types/widgets.ts`
- Modify: `src/lib/widgetRegistry.ts`
- Modify: `src/components/BentoGrid.tsx`
- Test: `src/hooks/useCalendarEvents.test.tsx`
- Test: `src/components/widgets/EventsWidget.test.tsx`

- [ ] **Step 1: Write the failing tests for `NIP-52` calendar querying and validation**

```ts
it('returns upcoming time-based and date-based calendar events for an author', async () => {
  const { result } = renderHook(() => useCalendarEvents(pubkey), { wrapper });
  await waitFor(() => expect(result.current.data).toHaveLength(2));
});

it('filters out malformed calendar events missing required NIP-52 tags', async () => {
  const { result } = renderHook(() => useCalendarEvents(pubkey), { wrapper });
  await waitFor(() => expect(result.current.data?.every(isValidCalendarEvent)).toBe(true));
});
```

- [ ] **Step 2: Run the calendar tests and verify failure**

Run: `npx vitest run src/hooks/useCalendarEvents.test.tsx`
Expected: FAIL because no calendar hook or validator exists.

- [ ] **Step 3: Implement `NIP-52` calendar querying with author filtering and validation**

```ts
export function useCalendarEvents(pubkey: string | undefined) {
  return useQuery({
    queryKey: ['calendar-events', pubkey],
    queryFn: async () => {
      const events = await nostr.query([{ kinds: [31922, 31923], authors: [pubkey], limit: 50 }]);
      return events.filter(validateCalendarEvent).sort(sortUpcomingFirst);
    },
    enabled: !!pubkey,
  });
}
```

- [ ] **Step 4: Add an `events` widget type and render it through `BentoGrid`**

```ts
export type WidgetType = /* existing */ | 'events';

events: {
  type: 'events',
  name: 'Upcoming Events',
  icon: 'Calendar',
  defaultSize: { w: 2, h: 2 },
}
```

- [ ] **Step 5: Implement the widget and its tests**

```tsx
export function EventsWidget({ pubkey, widget, isEditing }: WidgetProps) {
  const { data: events = [] } = useCalendarEvents(pubkey);
  // render upcoming appearances/shows with empty/edit states
}
```

- [ ] **Step 6: Re-run the events tests**

Run: `npx vitest run src/hooks/useCalendarEvents.test.tsx src/components/widgets/EventsWidget.test.tsx src/components/BentoGrid.test.tsx`
Expected: PASS for validated `NIP-52` queries, upcoming sorting, and widget rendering.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useCalendarEvents.ts src/components/widgets/EventsWidget.tsx src/types/widgets.ts src/lib/widgetRegistry.ts src/components/BentoGrid.tsx src/hooks/useCalendarEvents.test.tsx src/components/widgets/EventsWidget.test.tsx
git commit -m "feat: add upcoming events widget using NIP-52 calendar events"
```

### Task 6: Build the public sidebar-bento renderer

**Files:**
- Create: `src/components/page/PublicPageShell.tsx`
- Create: `src/components/page/PublicPageRenderer.tsx`
- Modify: `src/components/BentoGrid.tsx`
- Test: `src/components/page/PublicPageRenderer.test.tsx`

- [ ] **Step 1: Write the failing renderer tests**

```tsx
it('renders profile and links widgets in the public shell', () => {
  render(<PublicPageRenderer page={page} pubkey={pubkey} />);
  expect(screen.getByTestId('bento-grid')).toBeInTheDocument();
  expect(screen.getByTestId('profile-widget')).toBeInTheDocument();
});

it('falls back gracefully when a widget type is unknown', () => {
  render(<PublicPageRenderer page={pageWithUnknownWidget} pubkey={pubkey} />);
  expect(screen.getByTestId('placeholder-widget')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the renderer tests and verify failure**

Run: `npx vitest run src/components/page/PublicPageRenderer.test.tsx`
Expected: FAIL because the public renderer does not exist.

- [ ] **Step 3: Implement the public shell and renderer**

```tsx
export function PublicPageRenderer({ page, pubkey }: Props) {
  return (
    <PublicPageShell page={page}>
      <BentoGrid layout={{ type: 'bento', gridCols: 4, rowHeight: 150, widgets: page.widgets }} pubkey={pubkey} />
    </PublicPageShell>
  );
}
```

- [ ] **Step 4: Keep `BentoGrid` preview-safe and page-document friendly**

```tsx
export function BentoGrid({ layout, pubkey, isEditing = false, className }: BentoGridProps) {
  // no page-specific assumptions beyond widget/layout shape
}
```

- [ ] **Step 5: Re-run the public rendering tests**

Run: `npx vitest run src/components/page/PublicPageRenderer.test.tsx src/components/BentoGrid.test.tsx`
Expected: PASS for public rendering and widget placeholders.

- [ ] **Step 6: Commit**

```bash
git add src/components/page/PublicPageShell.tsx src/components/page/PublicPageRenderer.tsx src/components/BentoGrid.tsx src/components/page/PublicPageRenderer.test.tsx
git commit -m "feat: render published hosted pages with sidebar bento shell"
```

### Task 7: Route public profile traffic through the published page system

**Files:**
- Modify: `src/pages/Profile.tsx`
- Modify: `src/AppRouter.tsx`
- Modify: `src/hooks/useSubdomain.ts`
- Test: `src/components/page/PublicPageRenderer.test.tsx`

- [ ] **Step 1: Write failing tests for hosted-page-first rendering**

```tsx
it('renders the published hosted page when one exists', async () => {
  render(<Profile pubkey={pubkey} />);
  await waitFor(() => expect(screen.getByTestId('bento-grid')).toBeInTheDocument());
});
```

- [ ] **Step 2: Run the targeted test and verify failure**

Run: `npx vitest run src/components/page/PublicPageRenderer.test.tsx`
Expected: FAIL because `Profile.tsx` still renders the fixed legacy page only.

- [ ] **Step 3: Update `Profile.tsx` to prefer the published page document**

```tsx
const publishedPage = usePublishedPageDocument(pubkey);
if (publishedPage.data) {
  return <PublicPageRenderer page={publishedPage.data} pubkey={pubkey} />;
}
```

- [ ] **Step 4: Update subdomain detection for `.divine.video`**

```ts
if (parts.length >= 3 && (hostname.endsWith('.divine.space') || hostname.endsWith('.divine.video'))) {
  // extract subdomain
}
```

- [ ] **Step 5: Add the new studio route in `AppRouter.tsx` while preserving legacy fallbacks**

Run: `npx vitest run src/components/page/PublicPageRenderer.test.tsx src/pages/NIP19Page.test.tsx`
Expected: PASS, and no routing regressions.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Profile.tsx src/AppRouter.tsx src/hooks/useSubdomain.ts src/components/page/PublicPageRenderer.test.tsx
git commit -m "feat: serve published hosted pages on profile routes"
```

## Chunk 3: Owner Studio and Manual Widget Editing

### Task 8: Add a first-class page studio route with draft bootstrap and preview

**Files:**
- Create: `src/components/page/PageStudioShell.tsx`
- Create: `src/components/page/PagePreview.tsx`
- Create: `src/pages/PageStudio.tsx`
- Modify: `src/AppRouter.tsx`
- Modify: `src/components/Layout.tsx`
- Test: `src/pages/PageStudio.test.tsx`

- [ ] **Step 1: Write the failing studio tests**

```tsx
it('creates a starter draft when the owner has none', async () => {
  render(<PageStudio />);
  await waitFor(() => expect(mockEnsureStarterDraft).toHaveBeenCalled());
});

it('shows draft preview and publish controls', async () => {
  render(<PageStudio />);
  expect(await screen.findByText(/Publish/i)).toBeInTheDocument();
  expect(screen.getByTestId('bento-grid')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the studio tests and verify failure**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: FAIL because the studio route and shell do not exist.

- [ ] **Step 3: Implement the studio page and shell**

```tsx
export default function PageStudio() {
  const draft = useDraftPageDocument(pubkey);
  useEnsureStarterDraft();
  return (
    <PageStudioShell>
      <PagePreview page={draft.data} pubkey={pubkey} />
    </PageStudioShell>
  );
}
```

- [ ] **Step 4: Add navigation entry points**

```tsx
{ name: 'My Page', href: '/studio/page', icon: User }
```

- [ ] **Step 5: Re-run the studio tests**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: PASS for bootstrap, preview, and publish control visibility.

- [ ] **Step 6: Commit**

```bash
git add src/components/page/PageStudioShell.tsx src/components/page/PagePreview.tsx src/pages/PageStudio.tsx src/AppRouter.tsx src/components/Layout.tsx src/pages/PageStudio.test.tsx
git commit -m "feat: add hosted page studio route"
```

### Task 9: Make `BentoGridEditor` a real manual page editor

**Files:**
- Modify: `src/components/BentoGridEditor.tsx`
- Modify: `src/components/BentoGrid.tsx`
- Modify: `src/lib/widgetRegistry.ts`
- Test: `src/components/BentoGridEditor.test.tsx`

- [ ] **Step 1: Write failing tests for editor-backed preview cards**

```tsx
it('renders the actual widget preview while editing', () => {
  render(<BentoGridEditor layout={layout} pubkey={pubkey} onChange={onChange} />);
  expect(screen.getByTestId('profile-widget')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the editor tests and verify failure**

Run: `npx vitest run src/components/BentoGridEditor.test.tsx`
Expected: FAIL because editor items still render placeholder cards only.

- [ ] **Step 3: Replace placeholder editor items with preview-backed widgets**

```tsx
<Card className="h-full overflow-hidden group">
  <div className="drag-handle ...">...</div>
  <CardContent className="p-0 h-[calc(100%-40px)] overflow-hidden">
    <BentoGrid layout={{ type: 'bento', gridCols: layout.gridCols, rowHeight: layout.rowHeight, widgets: [widget] }} pubkey={pubkey} isEditing />
  </CardContent>
</Card>
```

- [ ] **Step 4: Preserve delete/drag controls without breaking widget previews**

Run: `npx vitest run src/components/BentoGridEditor.test.tsx src/components/BentoGrid.test.tsx`
Expected: PASS for existing add/remove behavior plus real previews.

- [ ] **Step 5: Commit**

```bash
git add src/components/BentoGridEditor.tsx src/components/BentoGrid.tsx src/lib/widgetRegistry.ts src/components/BentoGridEditor.test.tsx
git commit -m "feat: render live widget previews inside the page editor"
```

### Task 10: Retire split edit flows in favor of the studio

**Files:**
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/MySpaceSettings.tsx`
- Modify: `src/pages/Profile.tsx`
- Test: `src/pages/PageStudio.test.tsx`

- [ ] **Step 1: Write the failing navigation tests**

```tsx
it('links profile owners to the page studio instead of split settings flows', async () => {
  render(<Profile pubkey={pubkey} />);
  expect(await screen.findByRole('link', { name: /Edit Page/i })).toHaveAttribute('href', '/studio/page');
});
```

- [ ] **Step 2: Run the targeted test and verify failure**

Run: `npx vitest run src/pages/PageStudio.test.tsx`
Expected: FAIL because owners are still sent to `/settings/profile` and `/settings/myspace`.

- [ ] **Step 3: Update owner entry points**

```tsx
<Link to="/studio/page">
  <Button>Edit Page</Button>
</Link>
```

- [ ] **Step 4: Narrow or redirect legacy settings pages**

```tsx
if (isAuthenticated) {
  return <Navigate to="/studio/page" replace />;
}
```

- [ ] **Step 5: Re-run the navigation tests**

Run: `npx vitest run src/pages/PageStudio.test.tsx src/pages/Profile.test.tsx`
Expected: PASS, with owner editing routed through the studio.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Settings.tsx src/pages/MySpaceSettings.tsx src/pages/Profile.tsx src/pages/PageStudio.test.tsx
git commit -m "refactor: route page editing through the hosted page studio"
```

## Verification Sweep

- [ ] Run focused unit/integration coverage:

```bash
npx vitest run \
  src/lib/pageMigration.test.ts \
  src/hooks/usePageDocument.test.tsx \
  src/hooks/useCalendarEvents.test.tsx \
  src/components/page/PublicPageRenderer.test.tsx \
  src/components/widgets/EventsWidget.test.tsx \
  src/components/BentoGrid.test.tsx \
  src/components/BentoGridEditor.test.tsx \
  src/pages/PageStudio.test.tsx
```

Expected: PASS

- [ ] Run typecheck and lint:

```bash
npx tsc --noEmit
npx eslint src
```

Expected: PASS

- [ ] Run a production build:

```bash
npm run build
```

Expected: Vite production build succeeds and emits dist output.

## Follow-On Plans

After this plan lands, write separate plans for:

1. Social Lite event design and moderation model
2. AI copilot draft patching and conversational studio UX
3. Custom domains, billing, and admin flows
4. Self-host/export strategy aligned with `NIP-5A`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-05-divine-hosted-page-core.md`. Ready to execute?
