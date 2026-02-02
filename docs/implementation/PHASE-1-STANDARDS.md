# Implementation: Phase 1 - Standards Adoption

> **Goal**: Migrate from custom Kind 16793 to standard NIPs for ecosystem interoperability.

## Overview

| Feature | Current | Target | NIP |
|---------|---------|--------|-----|
| Top 8 Friends | Kind 16793 | Kind 30000 | NIP-51 |
| Links | Kind 16793 | Kind 30003 | NIP-51 |
| Mood/Status | Kind 16793 | Kind 30315 | NIP-38 |
| Music Status | Kind 16793 | Kind 30315 | NIP-38 |
| Profile Song | Kind 16793 | TBD | - |

---

## Task 1.1: Migrate Top 8 Friends to Kind 30000

### Files to Create/Modify

- [ ] `src/hooks/useTop8Friends.ts` - New hook
- [ ] `src/hooks/useTop8Friends.test.ts` - Tests
- [ ] `src/lib/parseTop8.ts` - Parsing utilities
- [ ] `src/lib/parseTop8.test.ts` - Parsing tests
- [ ] `src/hooks/useMySpaceProfile.ts` - Update to use new hook
- [ ] `src/components/Top8Friends.tsx` - Update to use new hook

### Implementation Steps

#### Step 1: Write Tests First

```typescript
// src/hooks/useTop8Friends.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useTop8Friends } from './useTop8Friends';

describe('useTop8Friends', () => {
  it('should query Kind 30000 with d-tag "top8"', async () => {
    // Implementation
  });

  it('should return empty array when no Top 8 exists', async () => {
    // Implementation
  });

  it('should fall back to Kind 16793 for legacy profiles', async () => {
    // Implementation
  });

  it('should parse petnames from 4th position of p tags', async () => {
    // Implementation
  });

  it('should order friends by tag position', async () => {
    // Implementation
  });
});
```

#### Step 2: Implement Parsing Utilities

```typescript
// src/lib/parseTop8.ts
import type { NostrEvent } from '@nostrify/nostrify';

export interface TopFriend {
  pubkey: string;
  relay?: string;
  petname?: string;
  position: number;
}

export function parseTop8FromKind30000(event: NostrEvent | undefined): TopFriend[] {
  if (!event || event.kind !== 30000) return [];

  const pTags = event.tags.filter(([name]) => name === 'p');

  return pTags.map((tag, index) => ({
    pubkey: tag[1],
    relay: tag[2] || undefined,
    petname: tag[3] || undefined,
    position: index + 1,
  })).slice(0, 8);
}

export function parseTop8FromKind16793(event: NostrEvent | undefined): TopFriend[] {
  if (!event || event.kind !== 16793) return [];

  // Legacy format: ["p", "<pubkey>", "", "<position>"]
  const pTags = event.tags.filter(([name]) => name === 'p');

  return pTags
    .map(tag => ({
      pubkey: tag[1],
      position: parseInt(tag[3]) || 0,
      petname: undefined,
    }))
    .filter(f => f.position > 0 && f.position <= 8)
    .sort((a, b) => a.position - b.position);
}

export function top8ToKind30000Tags(friends: TopFriend[]): string[][] {
  return [
    ['d', 'top8'],
    ['title', 'Top 8 Friends'],
    ...friends.slice(0, 8).map(f => [
      'p',
      f.pubkey,
      f.relay || '',
      f.petname || '',
    ]),
  ];
}
```

#### Step 3: Implement Hook

```typescript
// src/hooks/useTop8Friends.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useNostrPublish } from './useNostrPublish';
import {
  parseTop8FromKind30000,
  parseTop8FromKind16793,
  top8ToKind30000Tags,
  type TopFriend,
} from '@/lib/parseTop8';

export function useTop8Friends(pubkey: string | undefined) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const { mutateAsync: publish } = useNostrPublish();

  const query = useQuery({
    queryKey: ['top8', pubkey],
    queryFn: async () => {
      if (!pubkey) return [];

      // Try Kind 30000 first (standard)
      const [standardEvent] = await nostr.query([{
        kinds: [30000],
        authors: [pubkey],
        '#d': ['top8'],
        limit: 1,
      }]);

      if (standardEvent) {
        return parseTop8FromKind30000(standardEvent);
      }

      // Fall back to Kind 16793 (legacy)
      const [legacyEvent] = await nostr.query([{
        kinds: [16793],
        authors: [pubkey],
        limit: 1,
      }]);

      return parseTop8FromKind16793(legacyEvent);
    },
    enabled: !!pubkey,
  });

  const mutation = useMutation({
    mutationFn: async (friends: TopFriend[]) => {
      const tags = top8ToKind30000Tags(friends);
      await publish({ kind: 30000, tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top8', pubkey] });
    },
  });

  return {
    ...query,
    friends: query.data ?? [],
    updateTop8: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
```

#### Step 4: Update Components

```typescript
// src/components/Top8Friends.tsx
// Update to use new hook instead of useMySpaceProfile
import { useTop8Friends } from '@/hooks/useTop8Friends';

export function Top8Friends({ pubkey }: { pubkey: string }) {
  const { friends, isLoading } = useTop8Friends(pubkey);
  // ... rest of component
}
```

### Acceptance Criteria

- [ ] Kind 30000 events published for new Top 8
- [ ] Legacy Kind 16793 read for backward compat
- [ ] Top 8 visible in Listr.lol
- [ ] All tests pass
- [ ] No regression in existing functionality

---

## Task 1.2: Migrate Links to Kind 30003

### Files to Create/Modify

- [ ] `src/hooks/useProfileLinks.ts` - New hook
- [ ] `src/hooks/useProfileLinks.test.ts` - Tests
- [ ] `src/lib/parseLinks.ts` - Parsing utilities

### Event Format

```typescript
{
  kind: 30003,
  tags: [
    ['d', 'links'],
    ['title', 'My Links'],
    ['r', 'https://github.com/alice', 'GitHub'],
    ['r', 'https://twitter.com/alice', 'Twitter'],
    ['r', 'https://youtube.com/@alice', 'YouTube'],
  ],
  content: ''
}
```

### Implementation Pattern

Same as Task 1.1 - TDD with parsing utilities and hook.

---

## Task 1.3: Adopt NIP-38 for Status

### Files to Create/Modify

- [ ] `src/hooks/useUserStatus.ts` - New hook
- [ ] `src/hooks/useUserStatus.test.ts` - Tests
- [ ] `src/lib/parseStatus.ts` - Parsing utilities

### Event Formats

#### Mood Status

```typescript
{
  kind: 30315,
  tags: [['d', 'general']],
  content: '✨ vibing'
}
```

#### Music Status (Now Playing)

```typescript
{
  kind: 30315,
  tags: [
    ['d', 'music'],
    ['r', 'spotify:track:abc123'],
    ['expiration', '1692845589']
  ],
  content: 'Toxic - Britney Spears'
}
```

---

## Task 1.4: Profile Song Decision

### Options

#### Option A: Extend Kind 0

```typescript
// In kind 0 metadata JSON
{
  "name": "alice",
  "about": "...",
  "profile_song": {
    "url": "https://wavlake.com/track/...",
    "title": "Bohemian Rhapsody",
    "artist": "Queen"
  }
}
```

**Pros**: Simple, universal
**Cons**: Non-standard extension

#### Option B: Persistent Kind 30315

```typescript
{
  kind: 30315,
  tags: [
    ['d', 'profile_song'],
    ['r', 'https://wavlake.com/track/...'],
    ['title', 'Bohemian Rhapsody'],
    ['artist', 'Queen'],
    // No expiration = persistent
  ],
  content: 'Bohemian Rhapsody - Queen'
}
```

**Pros**: Uses existing NIP-38
**Cons**: Unclear if `d` tag is extensible

### Decision Required

- [ ] Research if NIP-38 allows custom `d` tags
- [ ] Consult with Nostr community
- [ ] Document decision in ADR

---

## Task 1.5: Update Profile Page

### Refactor Profile.tsx

```typescript
// src/pages/Profile.tsx
import { useDivineProfile } from '@/hooks/useDivineProfile';

export function Profile({ pubkey }: { pubkey: string }) {
  const profile = useDivineProfile(pubkey);

  return (
    <div>
      {/* Use profile.top8 from Kind 30000 */}
      <Top8Widget friends={profile.top8} />

      {/* Use profile.mood from Kind 30315 */}
      <MoodWidget status={profile.mood} />

      {/* Use profile.links from Kind 30003 */}
      <LinksWidget links={profile.links} />

      {/* ... */}
    </div>
  );
}
```

### Create Unified Profile Hook

```typescript
// src/hooks/useDivineProfile.ts
export function useDivineProfile(pubkey: string) {
  const { data: metadata } = useAuthor(pubkey);
  const { friends: top8 } = useTop8Friends(pubkey);
  const { data: links } = useProfileLinks(pubkey);
  const { mood, nowPlaying, profileSong } = useUserStatus(pubkey);
  const { data: site } = useSiteConfig(pubkey);
  const { data: videos } = useDivineUserVideos(pubkey);

  return {
    pubkey,
    metadata,
    top8,
    links,
    mood,
    nowPlaying,
    profileSong,
    site,
    videos,
    isLoading: /* combine loading states */,
  };
}
```

---

## Task 1.6: Deprecation Plan

### Timeline

| Date | Action |
|------|--------|
| Day 0 | Deploy dual-write (30000 + 16793) |
| Month 1 | Monitor adoption, fix issues |
| Month 3 | Add deprecation warning in code |
| Month 6 | Stop writing Kind 16793 |
| Month 12 | Stop reading Kind 16793 |

### Code Comments

```typescript
/**
 * @deprecated Use useTop8Friends instead.
 * This hook reads from Kind 16793 which will be removed in v2.0.
 * Migration guide: docs/migration/kind-16793.md
 */
export function useMySpaceProfile(pubkey: string) {
  console.warn('useMySpaceProfile is deprecated. Use useTop8Friends instead.');
  // ...
}
```

---

## Testing Strategy

### Unit Tests

- Parsing functions
- Event building functions

### Integration Tests

- Hooks with mocked Nostr
- Data flow through components

### Interop Tests (Manual)

- [ ] Create Top 8 → View in Listr
- [ ] Create links → View in Nostree
- [ ] View Nostree links → Display in Divine
- [ ] View Listr lists → Display in Divine

---

## Rollback Plan

If issues arise:
1. Disable Kind 30000 writing
2. Revert to Kind 16793 only
3. Fix issues
4. Re-deploy dual-write

Data is never lost since Kind 16793 is always written during migration period.
