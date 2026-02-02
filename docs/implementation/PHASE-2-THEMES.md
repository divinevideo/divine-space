# Implementation: Phase 2 - Theme System (NIP-512 + Ghost)

> **Goal**: Adopt NIP-512 for site configuration and support Ghost themes for npub.pro compatibility.

## Overview

This phase enables:
- Divine profiles to render on npub.pro
- Ghost theme ecosystem compatibility
- Theme publishing to Nostr + Blossom
- MySpace themes ported to Ghost format

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Profile                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Kind 30512: Site Configuration                  │
│  - Theme reference (x tag → Kind 30514)                     │
│  - Content filters (include tags)                           │
│  - Layout configuration                                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Kind 30514: Theme Definition                    │
│  - Theme metadata                                            │
│  - Package reference (e tag → Kind 1036)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Kind 1036: Theme Package                        │
│  - File list with hashes                                     │
│  - Blossom URLs for each file                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Blossom Server                                  │
│  - index.hbs, post.hbs, etc.                                │
│  - CSS, JS assets                                            │
│  - Images                                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Task 2.1: Create Divine Site Event (Kind 30512)

### Files to Create/Modify

- [ ] `src/hooks/useSiteConfig.ts` - Site configuration hook
- [ ] `src/hooks/useSiteConfig.test.ts` - Tests
- [ ] `src/lib/parseSiteConfig.ts` - Parsing utilities
- [ ] `src/types/site.ts` - TypeScript types

### Event Structure

```typescript
interface SiteEvent {
  kind: 30512;
  tags: [
    // Required
    ['d', 'profile'],
    ['r', 'https://divine.space/alice/'],

    // Metadata
    ['name', "Alice's Space"],
    ['title', 'Welcome to my profile'],
    ['summary', 'Creative director & artist'],
    ['image', '<og-image-url>'],
    ['icon', '<favicon-url>'],

    // Theme (Kind 30514 reference)
    ['x', '30514:<divine-pubkey>:divine-scene', '<package-hash>'],

    // Content includes
    ['include', 'k', '34236'],     // Videos
    ['include', 'k', '1'],          // Notes
    ['include', 'a', '30003:<pubkey>:links'],
    ['include', 'a', '30000:<pubkey>:top8'],

    // Rendering engine
    ['z', 'org.divine.bento'],
  ];
  content: JSON.stringify({
    // Custom layout data (divine extension)
    layout: {
      type: 'bento',
      gridCols: 4,
      widgets: [/* widget configs */],
    },
    customization: {
      colors: { primary: '#ff00ff' },
      effects: ['sparkles'],
    },
  });
}
```

### Implementation

```typescript
// src/hooks/useSiteConfig.ts
export function useSiteConfig(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['site-config', pubkey],
    queryFn: async () => {
      if (!pubkey) return null;

      const [event] = await nostr.query([{
        kinds: [30512],
        authors: [pubkey],
        '#d': ['profile'],
        limit: 1,
      }]);

      if (!event) return null;

      return parseSiteConfig(event);
    },
    enabled: !!pubkey,
  });
}
```

---

## Task 2.2: Create Base Divine Ghost Theme

### Theme Project Structure

```
divine-theme-base/
├── package.json
├── index.hbs          # Main layout
├── default.hbs        # Base template
├── post.hbs           # Single post/note
├── page.hbs           # Static pages
├── author.hbs         # Profile page
├── tag.hbs            # Tag archives
├── partials/
│   ├── navigation.hbs
│   ├── header.hbs
│   ├── footer.hbs
│   ├── top8.hbs       # Divine-specific
│   ├── music-player.hbs
│   ├── mood-widget.hbs
│   └── links-widget.hbs
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── themes/
│   │       ├── scene.css
│   │       ├── y2k.css
│   │       └── gothic.css
│   └── js/
│       ├── main.js
│       └── music-player.js
└── locales/
    └── en.json
```

### Key Templates

#### index.hbs (Profile Page)

```handlebars
{{!< default}}

<div class="divine-profile {{@site.accent_color}}">
  {{> header}}

  <main class="profile-content">
    <div class="bento-grid">
      {{> partials/profile-widget}}
      {{> partials/top8}}
      {{> partials/music-player}}
      {{> partials/mood-widget}}
      {{> partials/links-widget}}

      {{#foreach posts}}
        {{> partials/post-card}}
      {{/foreach}}
    </div>
  </main>

  {{> footer}}
</div>
```

#### partials/top8.hbs

```handlebars
<div class="widget top8-widget" data-size="2x2">
  <h3 class="widget-title">Top 8 Friends</h3>
  <div class="top8-grid">
    {{#each @custom.top8}}
      <a href="{{this.profile_url}}" class="friend-card rank-{{@index}}">
        <img src="{{this.picture}}" alt="{{this.name}}" />
        <span class="friend-name">{{this.petname}}</span>
        {{#if (eq @index 0)}}
          <span class="crown">👑</span>
        {{/if}}
      </a>
    {{/each}}
  </div>
</div>
```

### package.json

```json
{
  "name": "divine-theme-base",
  "description": "MySpace-inspired theme for Divine Space",
  "version": "1.0.0",
  "license": "MIT",
  "author": {
    "name": "Divine Space",
    "url": "https://divine.space"
  },
  "config": {
    "posts_per_page": 10,
    "image_sizes": {
      "xxs": { "width": 30 },
      "xs": { "width": 100 },
      "s": { "width": 300 },
      "m": { "width": 600 },
      "l": { "width": 1000 },
      "xl": { "width": 2000 }
    }
  },
  "custom": {
    "theme_variant": {
      "type": "select",
      "options": ["default", "scene", "y2k", "gothic", "kawaii"],
      "default": "default"
    },
    "enable_music": {
      "type": "boolean",
      "default": true
    },
    "enable_sparkles": {
      "type": "boolean",
      "default": false
    }
  }
}
```

---

## Task 2.3: Create Divine Bento Theme

### Bento Grid CSS

```css
/* assets/css/bento-grid.css */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1rem;
}

.widget {
  background: var(--widget-bg);
  border-radius: 1rem;
  padding: 1rem;
  overflow: hidden;
}

/* Widget sizes */
.widget[data-size="1x1"] { grid-column: span 1; grid-row: span 1; }
.widget[data-size="2x1"] { grid-column: span 2; grid-row: span 1; }
.widget[data-size="1x2"] { grid-column: span 1; grid-row: span 2; }
.widget[data-size="2x2"] { grid-column: span 2; grid-row: span 2; }

/* Responsive */
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## Task 2.4: Integrate libnostrsite Renderer

### Installation

```bash
npm install @nostrband/nostrsite
```

### Theme Loading Component

```typescript
// src/components/ThemeRenderer.tsx
import { useEffect, useState } from 'react';
import { loadTheme, renderSite } from '@nostrband/nostrsite';
import { useSiteConfig } from '@/hooks/useSiteConfig';

interface ThemeRendererProps {
  pubkey: string;
}

export function ThemeRenderer({ pubkey }: ThemeRendererProps) {
  const { data: siteConfig } = useSiteConfig(pubkey);
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function render() {
      if (!siteConfig?.themeId) return;

      setIsLoading(true);

      try {
        // Load theme from Blossom
        const theme = await loadTheme(siteConfig.themeId);

        // Render site with theme
        const rendered = await renderSite({
          site: siteConfig,
          theme,
          // Custom data for divine widgets
          custom: {
            top8: await loadTop8(pubkey),
            mood: await loadMoodStatus(pubkey),
            // ...
          },
        });

        setHtml(rendered);
      } catch (error) {
        console.error('Theme render error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    render();
  }, [siteConfig, pubkey]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Use shadow DOM or iframe for style isolation
  return (
    <div
      className="theme-container"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

---

## Task 2.5: Theme Selector UI

### Component

```typescript
// src/components/ThemeSelector.tsx
import { useState } from 'react';
import { useThemes } from '@/hooks/useThemes';
import { useSiteConfig } from '@/hooks/useSiteConfig';

export function ThemeSelector() {
  const { data: themes } = useThemes();
  const { data: currentSite, updateSite } = useSiteConfig(currentUser.pubkey);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  return (
    <div className="theme-selector">
      <h2>Choose Your Theme</h2>

      <div className="theme-grid">
        {themes?.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={currentSite?.themeId === theme.id}
            onPreview={() => setPreviewTheme(theme.id)}
            onSelect={() => updateSite({ themeId: theme.id })}
          />
        ))}
      </div>

      {previewTheme && (
        <ThemePreview
          themeId={previewTheme}
          onClose={() => setPreviewTheme(null)}
        />
      )}
    </div>
  );
}
```

---

## Task 2.6: Publish Theme to Nostr + Blossom

### Theme Publishing Flow

```typescript
// src/lib/publishTheme.ts
import { uploadToBlossom } from '@/lib/blossom';
import { useNostrPublish } from '@/hooks/useNostrPublish';

export async function publishTheme(
  themeFiles: File[],
  metadata: ThemeMetadata
) {
  const { publish } = useNostrPublish();

  // 1. Upload files to Blossom
  const fileEntries = await Promise.all(
    themeFiles.map(async file => {
      const { hash, url } = await uploadToBlossom(file);
      return { hash, path: file.name, url };
    })
  );

  // 2. Calculate package hash
  const packageHash = calculatePackageHash(fileEntries);

  // 3. Publish Kind 1036 (Package)
  const packageEvent = await publish({
    kind: 1036,
    tags: [
      ['title', metadata.name],
      ['version', metadata.version],
      ['x', packageHash],
      ...fileEntries.map(f => ['f', f.hash, f.path, f.url]),
      ['l', 'theme', 'org.nostrsites.ontology'],
    ],
    content: metadata.description,
  });

  // 4. Publish Kind 30514 (Theme)
  const themeEvent = await publish({
    kind: 30514,
    tags: [
      ['d', metadata.id],
      ['title', metadata.name],
      ['summary', metadata.description],
      ['version', metadata.version],
      ['e', packageEvent.id],
      ['z', 'org.divine.bento'],
      ['image', metadata.previewUrl],
      ...metadata.tags.map(t => ['t', t]),
    ],
    content: metadata.longDescription,
  });

  return themeEvent;
}
```

---

## Testing Strategy

### Unit Tests
- Site config parsing
- Theme metadata parsing
- Package hash calculation

### Integration Tests
- Theme loading from Blossom
- Site rendering with theme
- Theme selection flow

### Interop Tests
- Divine profile renders on npub.pro
- npub.pro site renders on Divine
- Theme switching works correctly

---

## Acceptance Criteria

- [ ] Divine profiles publish Kind 30512 site events
- [ ] At least one Ghost theme published as Kind 30514
- [ ] Profiles render correctly on npub.pro
- [ ] Theme selector allows switching themes
- [ ] MySpace themes (scene, y2k, gothic) available
- [ ] All tests pass
