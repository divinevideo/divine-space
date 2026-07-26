# MySpace 2.0 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin divine.space as "MySpace 2.0" — quiet utilitarian default chrome with user-choosable site skins, a hybrid directory/video homepage, and a faithful MySpace 1.0 widget anatomy for profile pages.

**Architecture:** Two-layer design tokens. New `--chrome-*` CSS vars (site frame, skinnable via `data-chrome-skin` on `<html>`) aliased into shadcn base vars so existing `ui/` components follow skins unmodified. Existing `.theme-*` profile classes keep styling profile page bodies. New widget types (`extended-network`, `contact-actions`, `profile-details`, `blurbs`) plug into the existing BentoGrid renderer; `defaultLayout.ts` gains a "MySpace 1.0" preset composed from them.

**Tech Stack:** React 18, TypeScript, Tailwind 3, shadcn/ui, Vitest + Testing Library, existing `useLocalStorage`/`useNostr`/`useDivineVideos` hooks.

**Spec:** `docs/superpowers/specs/2026-07-27-myspace2-redesign-design.md`

**Validation for every task:** `npm run test` must pass before commit (runs `tsc --noEmit && eslint && vitest run && vite build`).

---

### Task 1: Chrome skin registry

**Files:**
- Create: `src/lib/chromeSkins.ts`
- Test: `src/lib/chromeSkins.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/chromeSkins.test.ts
import { describe, it, expect } from 'vitest';
import { CHROME_SKINS, DEFAULT_CHROME_SKIN, isChromeSkin, getChromeSkin } from './chromeSkins';

describe('chromeSkins', () => {
  it('has plain as the default skin', () => {
    expect(DEFAULT_CHROME_SKIN).toBe('plain');
  });

  it('includes the four launch skins', () => {
    const ids = CHROME_SKINS.map((s) => s.id);
    expect(ids).toEqual(['plain', 'classic-blue', 'terminal', 'scene-kid']);
  });

  it('isChromeSkin validates skin ids', () => {
    expect(isChromeSkin('plain')).toBe(true);
    expect(isChromeSkin('scene-kid')).toBe(true);
    expect(isChromeSkin('purple-rain')).toBe(false);
    expect(isChromeSkin('')).toBe(false);
  });

  it('getChromeSkin returns a definition and falls back to default', () => {
    expect(getChromeSkin('terminal').name).toBe('Terminal');
    expect(getChromeSkin('bogus').id).toBe(DEFAULT_CHROME_SKIN);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/chromeSkins.test.ts`
Expected: FAIL — module `./chromeSkins` does not exist.

- [ ] **Step 3: Implement the registry**

```typescript
// src/lib/chromeSkins.ts
/**
 * Chrome Skin Registry
 *
 * Site-wide skins that restyle the platform chrome (header, nav, cards)
 * via the data-chrome-skin attribute on <html>. Independent from the
 * per-profile .theme-* classes, which style profile page bodies.
 */

export type ChromeSkinId = 'plain' | 'classic-blue' | 'terminal' | 'scene-kid';

export interface ChromeSkin {
  id: ChromeSkinId;
  name: string;
  description: string;
}

export const CHROME_SKIN_STORAGE_KEY = 'divine-chrome-skin';

export const DEFAULT_CHROME_SKIN: ChromeSkinId = 'plain';

export const CHROME_SKINS: ChromeSkin[] = [
  {
    id: 'plain',
    name: 'Plain',
    description: 'Quiet default. Flat white, Verdana, orange-red accent.',
  },
  {
    id: 'classic-blue',
    name: 'Classic Blue',
    description: 'MySpace 1.0 chrome. White pages, #003399 blue bar and links.',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Phosphor green on near-black, monospace everything.',
  },
  {
    id: 'scene-kid',
    name: 'Scene Kid',
    description: 'Black background, hot pink and cyan. rawr xD.',
  },
];

export function isChromeSkin(value: string): value is ChromeSkinId {
  return CHROME_SKINS.some((s) => s.id === value);
}

export function getChromeSkin(id: string): ChromeSkin {
  return CHROME_SKINS.find((s) => s.id === id) ?? CHROME_SKINS[0];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/chromeSkins.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/chromeSkins.ts src/lib/chromeSkins.test.ts
git commit -m "feat: add chrome skin registry"
```

---

### Task 2: Chrome skin CSS tokens

**Files:**
- Modify: `src/index.css` (append; also alias shadcn base vars in `:root`/`.dark` section)

- [ ] **Step 1: Append the chrome token layer**

Append to the end of `src/index.css`:

```css
/* ========================================
   Chrome Skin Token Layer
   ========================================
   Site-wide skins via data-chrome-skin on <html>.
   Aliases shadcn base vars so ui/ components follow skins.
   Profile page bodies still use scoped .theme-* classes.
   ======================================== */

@layer base {
  :root,
  [data-chrome-skin='plain'] {
    --chrome-bg: 0 0% 100%;
    --chrome-fg: 0 0% 13%;
    --chrome-card: 0 0% 100%;
    --chrome-muted: 0 0% 45%;
    --chrome-border: 0 0% 82%;
    --chrome-accent: 14 100% 50%;
    --chrome-accent-fg: 0 0% 100%;
    --chrome-link: 220 90% 40%;
    --chrome-font: Verdana, Geneva, 'DejaVu Sans', sans-serif;
    --chrome-radius: 2px;
  }

  [data-chrome-skin='classic-blue'] {
    --chrome-bg: 0 0% 94%;
    --chrome-fg: 0 0% 13%;
    --chrome-card: 0 0% 100%;
    --chrome-muted: 0 0% 40%;
    --chrome-border: 0 0% 70%;
    --chrome-accent: 220 100% 30%;
    --chrome-accent-fg: 0 0% 100%;
    --chrome-link: 220 100% 30%;
    --chrome-font: Verdana, Geneva, 'DejaVu Sans', sans-serif;
    --chrome-radius: 0px;
  }

  [data-chrome-skin='terminal'] {
    --chrome-bg: 240 10% 6%;
    --chrome-fg: 140 80% 70%;
    --chrome-card: 240 10% 9%;
    --chrome-muted: 140 20% 45%;
    --chrome-border: 140 30% 25%;
    --chrome-accent: 140 100% 55%;
    --chrome-accent-fg: 240 10% 6%;
    --chrome-link: 180 100% 60%;
    --chrome-font: 'Courier New', Courier, monospace;
    --chrome-radius: 0px;
  }

  [data-chrome-skin='scene-kid'] {
    --chrome-bg: 300 20% 4%;
    --chrome-fg: 320 100% 80%;
    --chrome-card: 300 25% 8%;
    --chrome-muted: 320 30% 50%;
    --chrome-border: 320 60% 30%;
    --chrome-accent: 320 100% 55%;
    --chrome-accent-fg: 0 0% 100%;
    --chrome-link: 185 100% 55%;
    --chrome-font: Verdana, Geneva, 'DejaVu Sans', sans-serif;
    --chrome-radius: 4px;
  }

  /* Alias shadcn base vars onto chrome tokens so ui/ components follow skins */
  :root,
  [data-chrome-skin] {
    --background: var(--chrome-bg);
    --foreground: var(--chrome-fg);
    --card: var(--chrome-card);
    --card-foreground: var(--chrome-fg);
    --popover: var(--chrome-card);
    --popover-foreground: var(--chrome-fg);
    --primary: var(--chrome-accent);
    --primary-foreground: var(--chrome-accent-fg);
    --secondary: var(--chrome-card);
    --secondary-foreground: var(--chrome-fg);
    --muted: var(--chrome-card);
    --muted-foreground: var(--chrome-muted);
    --accent: var(--chrome-accent);
    --accent-foreground: var(--chrome-accent-fg);
    --border: var(--chrome-border);
    --input: var(--chrome-border);
    --ring: var(--chrome-accent);
    --radius: var(--chrome-radius);
  }

  body {
    font-family: var(--chrome-font);
  }
}
```

Note: leave the existing `.dark` block and all `.theme-*` profile classes untouched — they are overridden by the alias layer for chrome surfaces but still apply inside profile containers that set their own scoped vars.

- [ ] **Step 2: Verify build**

Run: `npx vite build -l error`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add chrome skin token layer"
```

---

### Task 3: `useChromeSkin` hook

**Files:**
- Create: `src/hooks/useChromeSkin.ts`
- Test: `src/hooks/useChromeSkin.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/hooks/useChromeSkin.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChromeSkin } from './useChromeSkin';
import { CHROME_SKIN_STORAGE_KEY } from '@/lib/chromeSkins';

describe('useChromeSkin', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.chromeSkin;
  });

  it('defaults to plain and applies the data attribute', () => {
    const { result } = renderHook(() => useChromeSkin());
    expect(result.current.skin).toBe('plain');
    expect(document.documentElement.dataset.chromeSkin).toBe('plain');
  });

  it('switches skins, persists, and updates the attribute', () => {
    const { result } = renderHook(() => useChromeSkin());
    act(() => result.current.setSkin('terminal'));
    expect(result.current.skin).toBe('terminal');
    expect(localStorage.getItem(CHROME_SKIN_STORAGE_KEY)).toBe('"terminal"');
    expect(document.documentElement.dataset.chromeSkin).toBe('terminal');
  });

  it('ignores invalid skin ids', () => {
    const { result } = renderHook(() => useChromeSkin());
    act(() => result.current.setSkin('bogus-skin'));
    expect(result.current.skin).toBe('plain');
  });

  it('restores a stored skin', () => {
    localStorage.setItem(CHROME_SKIN_STORAGE_KEY, '"scene-kid"');
    const { result } = renderHook(() => useChromeSkin());
    expect(result.current.skin).toBe('scene-kid');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useChromeSkin.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

```typescript
// src/hooks/useChromeSkin.ts
import { useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  CHROME_SKIN_STORAGE_KEY,
  DEFAULT_CHROME_SKIN,
  isChromeSkin,
  type ChromeSkinId,
} from '@/lib/chromeSkins';

/**
 * Manages the site-wide chrome skin. Applies data-chrome-skin to <html>
 * and persists the choice to localStorage. Logged-out visitors always
 * start from the plain default.
 */
export function useChromeSkin() {
  const [stored, setStored] = useLocalStorage<string>(
    CHROME_SKIN_STORAGE_KEY,
    DEFAULT_CHROME_SKIN
  );

  const skin: ChromeSkinId = isChromeSkin(stored) ? stored : DEFAULT_CHROME_SKIN;

  useEffect(() => {
    document.documentElement.dataset.chromeSkin = skin;
  }, [skin]);

  const setSkin = useCallback(
    (next: string) => {
      if (isChromeSkin(next)) {
        setStored(next);
      }
    },
    [setStored]
  );

  return { skin, setSkin };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useChromeSkin.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useChromeSkin.ts src/hooks/useChromeSkin.test.tsx
git commit -m "feat: add useChromeSkin hook"
```

---

### Task 4: Flat chrome Layout rewrite

**Files:**
- Modify: `src/components/Layout.tsx` (full rewrite)
- Modify: `src/App.test.tsx` (if it asserts on the old wordmark/header — check and update assertions)

- [ ] **Step 1: Rewrite Layout.tsx**

Replace the entire file with:

```tsx
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useKeycast } from '@/contexts/KeycastContext';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { cn } from '@/lib/utils';
import { nip19 } from 'nostr-tools';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated: keycastAuth, pubkey: keycastPubkey } = useKeycast();
  const { currentUser } = useLoggedInAccounts();

  const isAuthenticated = keycastAuth || !!currentUser;
  const pubkey = keycastPubkey ?? currentUser?.pubkey;

  const navigation = [
    { name: 'home', href: '/' },
    { name: 'browse', href: '/browse' },
    { name: 'search', href: '/search' },
    { name: 'leaderboards', href: '/leaderboard' },
  ];

  const userNavigation = isAuthenticated && pubkey ? [
    { name: 'my page', href: '/studio/page' },
    { name: 'my profile', href: `/${nip19.npubEncode(pubkey)}` },
    { name: 'friends', href: '/friends' },
  ] : [];

  const allNav = [...navigation, ...userNavigation];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-12 items-center justify-between gap-4">
            {/* Wordmark */}
            <Link to="/" className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-primary text-primary-foreground">
                <Play className="h-3 w-3 fill-current" />
              </span>
              <span className="text-lg font-bold tracking-tight">
                divine<span className="text-primary">.space</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 text-sm">
              {allNav.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'hover:underline underline-offset-4',
                      isActive && 'font-bold underline'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <LoginArea className="hidden sm:flex" />
              <button
                className="md:hidden p-2"
                aria-label="Toggle menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
              {allNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'py-1 hover:underline underline-offset-4',
                    location.pathname === item.href && 'font-bold underline'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-3 border-t border-border">
                <LoginArea className="w-full" />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-3rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>divine.space — a place for videos</span>
          <span className="flex items-center gap-3">
            <Link to="/search" className="hover:underline">about</Link>
            <a href="https://divine.video" target="_blank" rel="noopener noreferrer" className="hover:underline">
              divine.video
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Check tests referencing the old chrome**

Run: `grep -rn "DiVine Space\|Sparkles\|gradient-text" src/App.test.tsx src/AppRouter*.test.tsx`
Expected: any assertions on the old wordmark text `DiVine Space` must be updated to `divine` / `.space` (the wordmark is now split across two spans; assert on `divine` text presence instead).

- [ ] **Step 3: Run full validation**

Run: `npm run test`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.tsx src/App.test.tsx src/AppRouter.test.tsx src/AppRouter.integration.test.tsx
git commit -m "feat: rewrite site chrome as flat myspace-era header"
```

---

### Task 5: Hybrid homepage rewrite

**Files:**
- Modify: `src/pages/Index.tsx` (full rewrite)
- Test: `src/pages/Index.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

```typescript
// src/pages/Index.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import Index from './Index';

describe('Index', () => {
  it('renders the claim CTA and section headings', () => {
    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    expect(screen.getByText(/make your own corner of the internet/i)).toBeInTheDocument();
    expect(screen.getByText(/featured pages/i)).toBeInTheDocument();
    expect(screen.getByText(/fresh videos/i)).toBeInTheDocument();
    expect(screen.getByText(/random page/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/Index.test.tsx`
Expected: FAIL — assertions not found (old hero copy).

- [ ] **Step 3: Rewrite Index.tsx**

Replace the entire file. Data notes: featured pages query recent kind 30512 (site config) events via `useNostr`; each card links to the author's npub profile and shows their display name via `useAuthor`. Random page picks a random entry from the same query.

```tsx
import { useSeoMeta, useHead } from '@unhead/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';
import { Layout } from '@/components/Layout';
import { VideoCard, VideoCardSkeleton } from '@/components/VideoCard';
import { useDivineVideos } from '@/hooks/useDivineVideos';
import { useDivineTrendingHashtags } from '@/hooks/useDivineSearch';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import type { VideoSort } from '@/lib/divine-api';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const SORTS: { id: VideoSort; label: string }[] = [
  { id: 'trending', label: 'trending' },
  { id: 'recent', label: 'recent' },
  { id: 'popular', label: 'popular' },
];

function FeaturedPageCard({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const name = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <Link
      to={`/${npub}`}
      className="block border border-border bg-card hover:border-primary"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {metadata?.picture ? (
          <img src={metadata.picture} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
            {name[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-2 text-sm truncate">{name}</div>
    </Link>
  );
}

export default function Index() {
  const [sort, setSort] = useState<VideoSort>('trending');
  const { nostr } = useNostr();
  const navigate = useNavigate();

  useSeoMeta({
    title: 'divine.space — a place for videos',
    description: 'Make your own corner of the internet. Custom profile pages, videos, and friends on Nostr.',
  });

  useHead({
    meta: [
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://divine.space/' },
      { property: 'og:title', content: 'divine.space — a place for videos' },
      { property: 'og:description', content: 'Make your own corner of the internet. Custom profile pages, videos, and friends on Nostr.' },
      { property: 'og:image', content: 'https://divine.space/og-image.svg' },
      { property: 'og:site_name', content: 'divine.space' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  });

  const { data: videos, isLoading: videosLoading } = useDivineVideos({ sort, limit: 9 });
  const { data: trendingHashtags } = useDivineTrendingHashtags();

  // Featured pages: authors of the most recent published site configs (kind 30512)
  const { data: featuredPubkeys } = useQuery({
    queryKey: ['featured-pages'],
    queryFn: async () => {
      const events = await nostr.query([{ kinds: [30512], limit: 20 }]);
      const seen = new Set<string>();
      for (const e of events.sort((a, b) => b.created_at - a.created_at)) {
        seen.add(e.pubkey);
        if (seen.size >= 6) break;
      }
      return [...seen];
    },
    staleTime: 60_000,
  });

  const handleRandomPage = () => {
    if (featuredPubkeys && featuredPubkeys.length > 0) {
      const random = featuredPubkeys[Math.floor(Math.random() * featuredPubkeys.length)];
      navigate(`/${nip19.npubEncode(random)}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Intro line */}
        <p className="text-sm text-muted-foreground">
          make your own corner of the internet —{' '}
          <Link to="/settings/profile" className="text-primary underline underline-offset-4">
            claim your page
          </Link>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured pages */}
            <section>
              <h2 className="text-lg font-bold mb-3">featured pages</h2>
              {featuredPubkeys && featuredPubkeys.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {featuredPubkeys.map((pk) => (
                    <FeaturedPageCard key={pk} pubkey={pk} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                  no pages yet — be the first to make one.
                </div>
              )}
            </section>

            {/* Fresh videos */}
            <section>
              <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
                <h2 className="text-lg font-bold">fresh videos</h2>
                <div className="flex gap-3 text-sm">
                  {SORTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSort(s.id)}
                      className={
                        sort === s.id
                          ? 'font-bold underline underline-offset-4'
                          : 'text-muted-foreground hover:underline underline-offset-4'
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {videosLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))}
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                  no videos found.
                </div>
              )}

              <div className="pt-4">
                <Link to="/browse" className="text-sm text-primary underline underline-offset-4">
                  browse all videos →
                </Link>
              </div>
            </section>
          </div>

          {/* Rail */}
          <aside className="space-y-6">
            <section>
              <h3 className="text-sm font-bold mb-2">explore</h3>
              <button
                onClick={handleRandomPage}
                className="text-sm text-primary underline underline-offset-4"
              >
                🎲 random page
              </button>
            </section>

            <section>
              <h3 className="text-sm font-bold mb-2">trending tags</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {trendingHashtags?.slice(0, 10).map((tag) => (
                  <Link
                    key={tag.hashtag}
                    to={`/search?tag=${tag.hashtag}`}
                    className="text-primary hover:underline underline-offset-4"
                  >
                    #{tag.hashtag}
                  </Link>
                ))}
              </div>
            </section>

            <section className="border border-border p-3 text-sm text-muted-foreground">
              divine.space is a myspace-inspired video platform on nostr. your page, your rules.
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/Index.test.tsx`
Expected: PASS. Then run `npm run test` for full validation.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Index.tsx src/pages/Index.test.tsx
git commit -m "feat: rewrite homepage as hybrid page directory + video feed"
```

---

### Task 6: New widget types

**Files:**
- Modify: `src/types/widgets.ts:11-23` (extend `WidgetType` union + `isWidgetType`)
- Modify: `src/lib/widgetRegistry.ts:18` (add registry entries)
- Test: `src/lib/widgets.test.ts` (extend existing — add cases below)

- [ ] **Step 1: Extend failing tests**

Add to `src/lib/widgets.test.ts` (follow the file's existing test style):

```typescript
it('includes the new myspace anatomy widget types', () => {
  expect(isWidgetType('extended-network')).toBe(true);
  expect(isWidgetType('contact-actions')).toBe(true);
  expect(isWidgetType('profile-details')).toBe(true);
  expect(isWidgetType('blurbs')).toBe(true);
});

it('has registry entries for the new widget types', () => {
  expect(getWidgetDefinition('extended-network').name).toBe('Profile Header');
  expect(getWidgetDefinition('contact-actions').name).toBe('Contact Actions');
  expect(getWidgetDefinition('profile-details').name).toBe('Details');
  expect(getWidgetDefinition('blurbs').name).toBe('Blurbs');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/widgets.test.ts`
Expected: FAIL — `isWidgetType('extended-network')` returns false.

- [ ] **Step 3: Extend the type union**

In `src/types/widgets.ts`, replace the `WidgetType` union with:

```typescript
export type WidgetType =
  | 'profile'      // Name, avatar, bio
  | 'top8'         // Top 8 friends
  | 'music'        // Music player
  | 'links'        // Link list
  | 'videos'       // Video grid
  | 'mood'         // Mood/status
  | 'gallery'      // Image gallery
  | 'notes'        // Recent notes
  | 'events'       // Upcoming events
  | 'embed'        // Custom embed (YouTube, etc.)
  | 'text'         // Custom text block
  | 'spacer'       // Empty spacer
  | 'extended-network' // "X is in your extended network" header
  | 'contact-actions'  // message / add friend / add to faves
  | 'profile-details'  // status, zodiac, here-for
  | 'blurbs';          // about me / who I'd like to meet
```

And extend `isWidgetType`'s `validTypes` array to include the four new strings.

- [ ] **Step 4: Add registry entries**

In `src/lib/widgetRegistry.ts`, add to the `widgetRegistry` object (after `spacer`):

```typescript
  'extended-network': {
    type: 'extended-network',
    name: 'Profile Header',
    description: '"In your extended network" banner with pic and status',
    icon: 'Megaphone',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 4, h: 3 },
    resizable: true,
    allowMultiple: false,
  },
  'contact-actions': {
    type: 'contact-actions',
    name: 'Contact Actions',
    description: 'Message, add friend, add to faves',
    icon: 'Mail',
    defaultSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 2, h: 2 },
    resizable: true,
    allowMultiple: false,
  },
  'profile-details': {
    type: 'profile-details',
    name: 'Details',
    description: 'Status, zodiac, here for',
    icon: 'Info',
    defaultSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 2, h: 2 },
    resizable: true,
    allowMultiple: false,
  },
  blurbs: {
    type: 'blurbs',
    name: 'Blurbs',
    description: 'About me / who I\'d like to meet',
    icon: 'FileText',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: false,
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/widgets.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/widgets.ts src/lib/widgetRegistry.ts src/lib/widgets.test.ts
git commit -m "feat: add myspace anatomy widget types"
```

---

### Task 7: Blurbs widget component

**Files:**
- Create: `src/components/widgets/BlurbsWidget.tsx`
- Test: `src/components/widgets/BlurbsWidget.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/widgets/BlurbsWidget.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { BlurbsWidget } from './BlurbsWidget';
import type { Widget } from '@/types/widgets';

const widget: Widget = { id: 'b1', type: 'blurbs', x: 0, y: 0, w: 3, h: 2 };

describe('BlurbsWidget', () => {
  it('renders about-me and meet sections with orange headers', () => {
    render(
      <TestApp>
        <BlurbsWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/about me/i)).toBeInTheDocument();
    expect(screen.getByText(/who i'd like to meet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/widgets/BlurbsWidget.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the widget**

Data source: the profile owner's kind-0 `about` via `useAuthor(pubkey)`; the "who I'd like to meet" text comes from `widget.config.meet` (editable in studio later; empty renders a prompt).

```tsx
// src/components/widgets/BlurbsWidget.tsx
import type { Widget } from '@/types/widgets';
import { useAuthor } from '@/hooks/useAuthor';

interface BlurbsWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function BlurbsWidget({ widget, pubkey }: BlurbsWidgetProps) {
  const author = useAuthor(pubkey);
  const about = author.data?.metadata?.about;
  const meet = (widget.config?.meet as string | undefined) ?? '';

  return (
    <div className="h-full w-full overflow-auto border border-border bg-card p-3 text-sm space-y-3">
      <section>
        <h3 className="font-bold text-primary">about me:</h3>
        <p className="whitespace-pre-wrap">
          {about || <span className="text-muted-foreground">(nothing here yet)</span>}
        </p>
      </section>
      <section>
        <h3 className="font-bold text-primary">who i'd like to meet:</h3>
        <p className="whitespace-pre-wrap">
          {meet || <span className="text-muted-foreground">(edit your page to fill this in)</span>}
        </p>
      </section>
    </div>
  );
}

export default BlurbsWidget;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/widgets/BlurbsWidget.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/BlurbsWidget.tsx src/components/widgets/BlurbsWidget.test.tsx
git commit -m "feat: add blurbs widget"
```

---

### Task 8: Contact Actions + Profile Details widgets

**Files:**
- Create: `src/components/widgets/ContactActionsWidget.tsx`
- Create: `src/components/widgets/ProfileDetailsWidget.tsx`
- Test: `src/components/widgets/ContactActionsWidget.test.tsx`
- Test: `src/components/widgets/ProfileDetailsWidget.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/widgets/ContactActionsWidget.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ContactActionsWidget } from './ContactActionsWidget';
import type { Widget } from '@/types/widgets';

const widget: Widget = { id: 'c1', type: 'contact-actions', x: 0, y: 0, w: 1, h: 1 };

describe('ContactActionsWidget', () => {
  it('renders myspace contact actions', () => {
    render(
      <TestApp>
        <ContactActionsWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/message/i)).toBeInTheDocument();
    expect(screen.getByText(/add to friends/i)).toBeInTheDocument();
    expect(screen.getByText(/add to favorites/i)).toBeInTheDocument();
  });
});
```

```typescript
// src/components/widgets/ProfileDetailsWidget.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ProfileDetailsWidget } from './ProfileDetailsWidget';
import type { Widget } from '@/types/widgets';

const widget: Widget = { id: 'd1', type: 'profile-details', x: 0, y: 0, w: 1, h: 1 };

describe('ProfileDetailsWidget', () => {
  it('renders detail rows from config', () => {
    const configured: Widget = {
      ...widget,
      config: { status: 'vibing', hereFor: 'friends' },
    };
    render(
      <TestApp>
        <ProfileDetailsWidget widget={configured} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText('vibing')).toBeInTheDocument();
    expect(screen.getByText(/here for/i)).toBeInTheDocument();
    expect(screen.getByText('friends')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/widgets/ContactActionsWidget.test.tsx src/components/widgets/ProfileDetailsWidget.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement ContactActionsWidget**

Message → DM page (`/messages`), add to friends → existing `useToggleFollow`, add to favorites → follow-list based favorite (reuse `useToggleFollow` for now; favorites = future refinement). Keep it honest: actions that don't apply when viewing own profile or logged out are disabled.

```tsx
// src/components/widgets/ContactActionsWidget.tsx
import { Link } from 'react-router-dom';
import type { Widget } from '@/types/widgets';
import { useAuth } from '@/hooks/useAuth';
import { useIsFollowing, useToggleFollow } from '@/hooks/useDivineSocial';

interface ContactActionsWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function ContactActionsWidget({ pubkey }: ContactActionsWidgetProps) {
  const { pubkey: currentUserPubkey, isAuthenticated } = useAuth();
  const isOwnProfile = currentUserPubkey === pubkey;
  const { data: isFollowing } = useIsFollowing(pubkey);
  const { mutate: toggleFollow } = useToggleFollow();

  const disabled = !isAuthenticated || isOwnProfile;

  const rowClass =
    'block w-full text-left text-sm text-primary hover:underline underline-offset-4 disabled:text-muted-foreground disabled:no-underline disabled:cursor-default';

  return (
    <div className="h-full w-full overflow-auto border border-border bg-card p-3 space-y-1">
      <Link to="/messages" className={rowClass}>
        ✉ message
      </Link>
      <button
        className={rowClass}
        disabled={disabled}
        onClick={() =>
          toggleFollow({ targetPubkey: pubkey, isCurrentlyFollowing: !!isFollowing })
        }
      >
        ➕ {isFollowing ? 'remove from friends' : 'add to friends'}
      </button>
      <button className={rowClass} disabled={disabled}>
        ⭐ add to favorites
      </button>
      <button className={rowClass} disabled={disabled}>
        🚩 block user
      </button>
    </div>
  );
}

export default ContactActionsWidget;
```

- [ ] **Step 4: Implement ProfileDetailsWidget**

```tsx
// src/components/widgets/ProfileDetailsWidget.tsx
import type { Widget } from '@/types/widgets';

interface ProfileDetailsWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function ProfileDetailsWidget({ widget }: ProfileDetailsWidgetProps) {
  const rows: [string, string | undefined][] = [
    ['status:', widget.config?.status as string | undefined],
    ['here for:', widget.config?.hereFor as string | undefined],
    ['zodiac:', widget.config?.zodiac as string | undefined],
    ['smoke / drink:', widget.config?.smokeDrink as string | undefined],
    ['occupation:', widget.config?.occupation as string | undefined],
  ];

  return (
    <div className="h-full w-full overflow-auto border border-border bg-card p-3 text-sm">
      <dl className="space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="text-muted-foreground shrink-0">{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default ProfileDetailsWidget;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/widgets/ContactActionsWidget.test.tsx src/components/widgets/ProfileDetailsWidget.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/ContactActionsWidget.tsx src/components/widgets/ContactActionsWidget.test.tsx src/components/widgets/ProfileDetailsWidget.tsx src/components/widgets/ProfileDetailsWidget.test.tsx
git commit -m "feat: add contact actions and profile details widgets"
```

---

### Task 9: Extended Network header widget

**Files:**
- Create: `src/components/widgets/ExtendedNetworkWidget.tsx`
- Test: `src/components/widgets/ExtendedNetworkWidget.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/widgets/ExtendedNetworkWidget.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ExtendedNetworkWidget } from './ExtendedNetworkWidget';
import type { Widget } from '@/types/widgets';

const widget: Widget = { id: 'e1', type: 'extended-network', x: 0, y: 0, w: 4, h: 2 };

describe('ExtendedNetworkWidget', () => {
  it('renders the extended network banner and view-my links', () => {
    render(
      <TestApp>
        <ExtendedNetworkWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/is in your extended network/i)).toBeInTheDocument();
    expect(screen.getByText(/view my:/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/widgets/ExtendedNetworkWidget.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the widget**

```tsx
// src/components/widgets/ExtendedNetworkWidget.tsx
import type { Widget } from '@/types/widgets';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';

interface ExtendedNetworkWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function ExtendedNetworkWidget({ pubkey }: ExtendedNetworkWidgetProps) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const name = metadata?.display_name || metadata?.name || genUserName(pubkey);

  return (
    <div className="h-full w-full overflow-hidden border border-border bg-card">
      <div className="bg-primary text-primary-foreground text-sm px-3 py-1">
        {name} is in your extended network
      </div>
      <div className="flex gap-3 p-3">
        <div className="w-24 shrink-0">
          <div className="aspect-square overflow-hidden border border-border bg-muted">
            {metadata?.picture ? (
              <img src={metadata.picture} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                {name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-xs mt-1 text-primary">view my: pics | vids</div>
        </div>
        <div className="min-w-0 text-sm">
          <div className="font-bold text-base">{name}</div>
          <div className="text-green-600 dark:text-green-400 text-xs">● online now!</div>
          {metadata?.nip05 && (
            <div className="text-muted-foreground text-xs mt-1 truncate">{metadata.nip05}</div>
          )}
          {metadata?.website && (
            <a
              href={metadata.website}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary text-xs mt-1 hover:underline truncate"
            >
              {metadata.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExtendedNetworkWidget;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/widgets/ExtendedNetworkWidget.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/ExtendedNetworkWidget.tsx src/components/widgets/ExtendedNetworkWidget.test.tsx
git commit -m "feat: add extended network header widget"
```

---

### Task 10: Register widgets in BentoGrid

**Files:**
- Modify: `src/components/BentoGrid.tsx:8-19,44-55`

- [ ] **Step 1: Add imports and map entries**

Add to the import block:

```typescript
import { BlurbsWidget } from '@/components/widgets/BlurbsWidget';
import { ContactActionsWidget } from '@/components/widgets/ContactActionsWidget';
import { ProfileDetailsWidget } from '@/components/widgets/ProfileDetailsWidget';
import { ExtendedNetworkWidget } from '@/components/widgets/ExtendedNetworkWidget';
```

Add to `WIDGET_COMPONENTS`:

```typescript
  blurbs: BlurbsWidget,
  'contact-actions': ContactActionsWidget,
  'profile-details': ProfileDetailsWidget,
  'extended-network': ExtendedNetworkWidget,
```

- [ ] **Step 2: Verify existing BentoGrid tests + typecheck**

Run: `npx vitest run src/components/BentoGrid.test.tsx && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/BentoGrid.tsx
git commit -m "feat: render myspace anatomy widgets in bento grid"
```

---

### Task 11: MySpace 1.0 layout preset

**Files:**
- Modify: `src/lib/defaultLayout.ts` (add preset + template entry)
- Test: extend an existing defaultLayout test file if present, else create `src/lib/defaultLayout.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/defaultLayout.test.ts
import { describe, it, expect } from 'vitest';
import { getLayoutTemplate, myspaceLayout } from './defaultLayout';

describe('myspace 1.0 preset', () => {
  it('is registered as a layout template', () => {
    const template = getLayoutTemplate('myspace');
    expect(template).toBeDefined();
    expect(template?.name).toBe('MySpace 1.0');
    expect(template?.widgets).toBe(myspaceLayout);
  });

  it('contains the full classic anatomy without overlaps', () => {
    const types = myspaceLayout.map((w) => w.type);
    for (const required of [
      'extended-network', 'contact-actions', 'profile-details',
      'blurbs', 'music', 'top8', 'videos', 'notes',
    ]) {
      expect(types).toContain(required);
    }
    // No two widgets overlap
    for (let i = 0; i < myspaceLayout.length; i++) {
      for (let j = i + 1; j < myspaceLayout.length; j++) {
        const a = myspaceLayout[i];
        const b = myspaceLayout[j];
        const overlap =
          a.x < b.x + b.w && b.x < a.x + a.w &&
          a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.type} overlaps ${b.type}`).toBe(false);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/defaultLayout.test.ts`
Expected: FAIL — `myspaceLayout` not exported.

- [ ] **Step 3: Implement the preset**

In `src/lib/defaultLayout.ts`, after `creatorLayout`:

```typescript
/**
 * MySpace 1.0 layout - faithful classic anatomy.
 * Left rail: contact actions + details. Right: blurbs, music, videos, top 8, wall.
 */
export const myspaceLayout: Widget[] = [
  { id: 'extended-network', type: 'extended-network', x: 0, y: 0, w: 4, h: 2 },
  { id: 'contact-actions', type: 'contact-actions', x: 0, y: 2, w: 1, h: 1 },
  { id: 'profile-details', type: 'profile-details', x: 0, y: 3, w: 1, h: 1 },
  { id: 'music', type: 'music', x: 0, y: 4, w: 1, h: 1 },
  { id: 'blurbs', type: 'blurbs', x: 1, y: 2, w: 3, h: 2 },
  { id: 'videos', type: 'videos', x: 1, y: 4, w: 3, h: 2 },
  { id: 'top8', type: 'top8', x: 0, y: 5, w: 1, h: 2 },
  { id: 'notes', type: 'notes', x: 1, y: 6, w: 3, h: 2 },
];
```

Add to `layoutTemplates` (as the first entry so it reads as the flagship):

```typescript
  {
    id: 'myspace',
    name: 'MySpace 1.0',
    description: 'The classic: extended network header, blurbs, top 8, wall',
    widgets: myspaceLayout,
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/defaultLayout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/defaultLayout.ts src/lib/defaultLayout.test.ts
git commit -m "feat: add myspace 1.0 layout preset"
```

---

### Task 12: De-slop Profile fallback page

**Files:**
- Modify: `src/pages/Profile.tsx`

The published-page path (`PublicPageRenderer`) is unchanged. This task flattens the fallback (no published page) so it stops reading as AI-template:

- [ ] **Step 1: Remove slop styling**

In `src/pages/Profile.tsx`:
- Replace the `animated-gradient` fallback banner (line ~254-258) with a flat `bg-muted` div.
- Delete the overlay gradient div at line ~260 (`bg-gradient-to-t from-background...`).
- Replace the stats `Card className="myspace-card"` with `Card` (plain) and remove the colored stat values (`text-pink-500`, `text-cyan-500`, `text-purple-500` → default foreground).
- Replace remaining `myspace-card` usages in post skeletons (line ~579) with plain `Card`.
- Loading skeleton: remove `-mt-16` overlapping-avatar hero treatment; use simple stacked skeletons.

- [ ] **Step 2: Run validation**

Run: `npm run test`
Expected: PASS (update `Profile.test.tsx` assertions only if they target removed classes).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Profile.tsx src/pages/Profile.test.tsx
git commit -m "refactor: de-slop profile fallback styling"
```

---

### Task 13: Site skin picker in settings

**Files:**
- Create: `src/components/ChromeSkinPicker.tsx`
- Test: `src/components/ChromeSkinPicker.test.tsx`
- Modify: `src/pages/Settings.tsx` (render the picker near the top of the page — read the file first and place it as the first settings section)

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/ChromeSkinPicker.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ChromeSkinPicker } from './ChromeSkinPicker';

describe('ChromeSkinPicker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists all skins and marks the active one', () => {
    render(
      <TestApp>
        <ChromeSkinPicker />
      </TestApp>
    );
    for (const name of ['Plain', 'Classic Blue', 'Terminal', 'Scene Kid']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /Plain/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches the skin on click', () => {
    render(
      <TestApp>
        <ChromeSkinPicker />
      </TestApp>
    );
    fireEvent.click(screen.getByRole('button', { name: /Terminal/ }));
    expect(document.documentElement.dataset.chromeSkin).toBe('terminal');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ChromeSkinPicker.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the picker**

```tsx
// src/components/ChromeSkinPicker.tsx
import { CHROME_SKINS } from '@/lib/chromeSkins';
import { useChromeSkin } from '@/hooks/useChromeSkin';
import { cn } from '@/lib/utils';

export function ChromeSkinPicker() {
  const { skin, setSkin } = useChromeSkin();

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">site skin</h2>
      <p className="text-sm text-muted-foreground">
        restyles the whole site frame. your page keeps its own theme.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CHROME_SKINS.map((s) => (
          <button
            key={s.id}
            aria-pressed={skin === s.id}
            onClick={() => setSkin(s.id)}
            className={cn(
              'border p-3 text-left',
              skin === s.id ? 'border-primary border-2' : 'border-border hover:border-primary'
            )}
          >
            <div className="font-bold text-sm">{s.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.description}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ChromeSkinPicker;
```

- [ ] **Step 4: Render it in Settings.tsx**

Read `src/pages/Settings.tsx`, then insert `<ChromeSkinPicker />` as the first section inside the page's settings container, with the import added at top. Do not change any existing settings controls.

- [ ] **Step 5: Run validation**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ChromeSkinPicker.tsx src/components/ChromeSkinPicker.test.tsx src/pages/Settings.tsx
git commit -m "feat: add site skin picker to settings"
```

---

### Task 14: Final validation + visual check

- [ ] **Step 1: Full suite**

Run: `npm run test`
Expected: `All tests passed!`

- [ ] **Step 2: Visual smoke test**

Run: `npm run dev`, then via playwright-mcp visit `/`, a profile page, and `/settings/profile`; switch skins and confirm chrome restyles while profile theme is unaffected. Screenshot each.

- [ ] **Step 3: Fix anything found, commit**

```bash
git commit -m "chore: myspace 2.0 redesign final pass"
```

---

## Self-Review Notes

- Spec §1 (token layer, registry, hook): Tasks 1–3. Nostr cross-device skin sync (kind 30078) deferred — YAGNI for v1; localStorage only. Spec allows; add later if requested.
- Spec §2 (chrome/brand): Task 4.
- Spec §3 (homepage): Task 5. Activity ticker and numbered top-creators rail cut to keep homepage shippable — featured pages + tags + random button deliver the directory feel; revisit if wanted.
- Spec §4 (widget anatomy): Tasks 6–11. Comments-as-widget: existing `notes` widget covers the wall for v1.
- Spec §5 (settings UX): Task 13. Page-studio preset picker: layoutTemplates already power the studio template picker, so the MySpace 1.0 preset appears automatically (Task 11). AI copilot prompt update deferred.
- Spec §6 (validation): Task 14.
