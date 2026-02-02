# Architecture: Data Model

> **Principle**: Use standard NIPs for shareable data, divine extensions for UI state.

## Event Kind Overview

| Kind | NIP | Purpose | Replaceability |
|------|-----|---------|----------------|
| 0 | NIP-01 | Profile metadata | Replaceable |
| 3 | NIP-02 | Contact list | Replaceable |
| 10002 | NIP-65 | Relay list | Replaceable |
| 30000 | NIP-51 | Follow sets (Top 8) | Addressable |
| 30003 | NIP-51 | Bookmark sets (Links) | Addressable |
| 30315 | NIP-38 | User status (Mood/Music) | Addressable |
| 30512 | NIP-512 | Site configuration | Addressable |
| 30514 | NIP-512 | Theme definition | Addressable |
| 1036 | NIP-136 | Code package (Theme files) | Regular |
| 34236 | Custom | Video events | Addressable |
| 16793 | Custom (DEPRECATED) | Legacy profile customization | Replaceable |

---

## Event Schemas

### Kind 30000: Top 8 Friends (Follow Set)

```typescript
interface Top8Event {
  kind: 30000;
  tags: [
    ['d', 'top8'],
    ['title', 'Top 8 Friends'],
    ['description', 'My closest friends on Nostr'],
    // Up to 8 friends, 4th position = petname
    ['p', '<pubkey1>', '<relay?>', '<petname?>'],
    ['p', '<pubkey2>', '<relay?>', '<petname?>'],
    // ... up to 8
  ];
  content: ''; // Empty or encrypted private entries
}
```

**Query**:
```typescript
const top8 = await nostr.query([{
  kinds: [30000],
  authors: [pubkey],
  '#d': ['top8'],
  limit: 1
}]);
```

---

### Kind 30003: Profile Links (Bookmark Set)

```typescript
interface LinksEvent {
  kind: 30003;
  tags: [
    ['d', 'links'],
    ['title', 'My Links'],
    ['description', 'Social media and projects'],
    ['image', '<banner-url?>'],
    // Links with labels
    ['r', 'https://github.com/alice', 'GitHub'],
    ['r', 'https://twitter.com/alice', 'Twitter'],
    ['r', 'https://youtube.com/@alice', 'YouTube'],
    // Tags for categorization
    ['t', 'social'],
    ['t', 'creator'],
  ];
  content: '';
}
```

**Query**:
```typescript
const links = await nostr.query([{
  kinds: [30003],
  authors: [pubkey],
  '#d': ['links'],
  limit: 1
}]);
```

---

### Kind 30315: User Status (NIP-38)

#### Music Status (Now Playing)

```typescript
interface MusicStatusEvent {
  kind: 30315;
  tags: [
    ['d', 'music'],
    ['r', 'spotify:track:abc123'], // Or URL
    ['expiration', '<unix-timestamp>'], // When track ends
  ];
  content: 'Toxic - Britney Spears';
}
```

#### General Status (Mood)

```typescript
interface MoodStatusEvent {
  kind: 30315;
  tags: [
    ['d', 'general'],
    // No expiration = persistent mood
  ];
  content: '✨ vibing';
}
```

#### Profile Song (Persistent)

```typescript
// Option A: Custom d-tag (no expiration)
interface ProfileSongEvent {
  kind: 30315;
  tags: [
    ['d', 'profile_song'],
    ['r', 'https://wavlake.com/track/...'],
    ['title', 'Bohemian Rhapsody'],
    ['artist', 'Queen'],
    // No expiration tag = persistent
  ];
  content: 'Bohemian Rhapsody - Queen';
}

// Option B: Extend Kind 0 (alternative approach)
interface ExtendedMetadata {
  name: string;
  about: string;
  picture: string;
  // Divine extension
  profile_song?: {
    url: string;
    title: string;
    artist: string;
  };
}
```

---

### Kind 30512: Site Configuration (NIP-512)

```typescript
interface SiteEvent {
  kind: 30512;
  tags: [
    // Required
    ['d', 'profile'],
    ['r', 'https://divine.space/alice/'],

    // Identity
    ['name', "Alice's Space"],
    ['title', 'Welcome to my profile'],
    ['summary', 'Creative director & artist'],
    ['image', '<og-image-url>'],

    // Theme reference (Kind 30514 + Kind 1036)
    ['x', '30514:<theme-pubkey>:divine-bento', '<package-hash>'],

    // Content filters
    ['include', 'k', '34236'],     // Include videos
    ['include', 'k', '1'],          // Include notes
    ['include', 'a', '30003:<pubkey>:links'], // Include links
    ['include', 'a', '30000:<pubkey>:top8'],  // Include Top 8

    // Rendering engine
    ['z', 'org.divine.bento'],

    // Divine extensions (namespaced)
    ['divine:layout', 'bento'],
    ['divine:grid-cols', '4'],
  ];
  content: JSON.stringify({
    // Complex layout data
    widgets: [
      { id: 'profile', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      { id: 'music', type: 'music', x: 2, y: 0, w: 2, h: 1 },
      { id: 'top8', type: 'top8', x: 0, y: 2, w: 2, h: 2 },
      { id: 'links', type: 'links', x: 2, y: 1, w: 2, h: 1 },
      { id: 'videos', type: 'videos', x: 2, y: 2, w: 2, h: 2 },
    ],
    // AI customizations
    customCss: '.profile-name { color: #ff00ff; }',
    theme: {
      colors: { primary: '#ff00ff', secondary: '#00ffff' },
      effects: ['sparkles', 'glitter'],
    }
  });
}
```

---

### Kind 30514: Theme Definition (NIP-512)

```typescript
interface ThemeEvent {
  kind: 30514;
  tags: [
    ['d', 'divine-scene'],
    ['title', 'Scene Kid Theme'],
    ['summary', 'Emo/scene aesthetic with pink and black'],
    ['version', '1.0.0'],
    ['license', 'MIT'],
    // Reference to package (Kind 1036)
    ['e', '<package-event-id>'],
    // Rendering engine compatibility
    ['z', 'org.divine.bento'],
    // Preview image
    ['image', '<preview-url>'],
    // Tags for discovery
    ['t', 'myspace'],
    ['t', 'scene'],
    ['t', 'emo'],
  ];
  content: 'A nostalgic scene kid theme inspired by 2006 MySpace.';
}
```

---

### Kind 1036: Theme Package (NIP-136)

```typescript
interface PackageEvent {
  kind: 1036;
  tags: [
    ['title', 'Divine Scene Theme'],
    ['version', '1.0.0'],
    ['license', 'MIT'],
    // Package hash (content-addressed)
    ['x', '<sha256-of-all-files>'],
    // File list: [hash, path, url]
    ['f', '<sha256>', 'index.hbs', 'https://blossom.divine.space/abc123'],
    ['f', '<sha256>', 'post.hbs', 'https://blossom.divine.space/def456'],
    ['f', '<sha256>', 'assets/main.css', 'https://blossom.divine.space/ghi789'],
    ['f', '<sha256>', 'assets/app.js', 'https://blossom.divine.space/jkl012'],
    // Label for ontology
    ['l', 'theme', 'org.nostrsites.ontology'],
    ['L', 'org.nostrsites.ontology'],
  ];
  content: 'Scene kid theme with glitter and emo aesthetics.';
}
```

---

## TypeScript Types

```typescript
// src/types/profile.ts

export interface TopFriend {
  pubkey: string;
  relay?: string;
  petname?: string;
  position: number; // 1-8
}

export interface ProfileLink {
  url: string;
  label: string;
}

export interface UserStatus {
  type: 'general' | 'music' | 'profile_song';
  content: string;
  url?: string;
  title?: string;
  artist?: string;
  expiration?: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number; // Width in grid units (1-4)
  h: number; // Height in grid units (1-4)
  config?: Record<string, unknown>;
}

export type WidgetType =
  | 'profile'
  | 'top8'
  | 'music'
  | 'links'
  | 'videos'
  | 'notes'
  | 'mood'
  | 'gallery'
  | 'embed';

export interface ThemeCustomization {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  effects?: ('sparkles' | 'glitter' | 'stars' | 'cursor-trail')[];
  font?: string;
  customCss?: string;
}

export interface SiteConfig {
  url: string;
  name: string;
  title?: string;
  summary?: string;
  image?: string;
  themeId?: string; // naddr of Kind 30514
  layout: 'classic' | 'bento' | 'minimal';
  widgets: Widget[];
  customization?: ThemeCustomization;
}

export interface DivineProfile {
  // Identity (Kind 0)
  pubkey: string;
  metadata: NostrMetadata;

  // Top 8 (Kind 30000)
  top8: TopFriend[];

  // Links (Kind 30003)
  links: ProfileLink[];

  // Status (Kind 30315)
  mood?: UserStatus;
  nowPlaying?: UserStatus;
  profileSong?: UserStatus;

  // Site (Kind 30512)
  site?: SiteConfig;

  // Videos (Kind 34236)
  videos: NostrEvent[];

  // Legacy (Kind 16793) - deprecated
  legacyProfile?: LegacyProfileData;
}
```

---

## Query Patterns

### Load Complete Profile

```typescript
async function loadDivineProfile(pubkey: string): Promise<DivineProfile> {
  // Parallel queries for efficiency
  const [
    metadata,
    top8,
    links,
    statuses,
    site,
    videos,
    legacy,
  ] = await Promise.all([
    // Kind 0
    nostr.query([{ kinds: [0], authors: [pubkey], limit: 1 }]),
    // Kind 30000 (Top 8)
    nostr.query([{ kinds: [30000], authors: [pubkey], '#d': ['top8'], limit: 1 }]),
    // Kind 30003 (Links)
    nostr.query([{ kinds: [30003], authors: [pubkey], '#d': ['links'], limit: 1 }]),
    // Kind 30315 (All statuses)
    nostr.query([{ kinds: [30315], authors: [pubkey], limit: 10 }]),
    // Kind 30512 (Site)
    nostr.query([{ kinds: [30512], authors: [pubkey], '#d': ['profile'], limit: 1 }]),
    // Kind 34236 (Videos)
    nostr.query([{ kinds: [34236], authors: [pubkey], limit: 20 }]),
    // Kind 16793 (Legacy - fallback)
    nostr.query([{ kinds: [16793], authors: [pubkey], limit: 1 }]),
  ]);

  return {
    pubkey,
    metadata: parseMetadata(metadata[0]),
    top8: parseTop8(top8[0]) || parseTop8FromLegacy(legacy[0]),
    links: parseLinks(links[0]),
    mood: parseStatus(statuses, 'general'),
    nowPlaying: parseStatus(statuses, 'music'),
    profileSong: parseStatus(statuses, 'profile_song'),
    site: parseSite(site[0]),
    videos,
    legacyProfile: parseLegacy(legacy[0]),
  };
}
```

---

## Migration Utilities

### Migrate Kind 16793 to Standard NIPs

```typescript
async function migrateLegacyProfile(legacyEvent: NostrEvent): Promise<void> {
  const data = parseLegacy(legacyEvent);

  // 1. Migrate Top 8 to Kind 30000
  if (data.topFriends.length > 0) {
    await publishTop8(data.topFriends);
  }

  // 2. Migrate links to Kind 30003 (if any)
  // ... extract links from legacy format

  // 3. Migrate mood to Kind 30315
  if (data.mood) {
    await publishMoodStatus(data.mood);
  }

  // 4. Migrate music to Kind 30315
  if (data.music) {
    await publishProfileSong(data.music);
  }

  // 5. Create site event (Kind 30512)
  await publishSiteConfig({
    theme: data.theme,
    layout: 'classic',
    // ... other config
  });
}
```
