# Research: Prior Art - Nostr Profile Builders

> **Last Updated**: 2026-02-01

## Executive Summary

This document captures research on existing Nostr link-in-bio apps, profile builders, and relevant NIPs. The key finding is that **no one has built a true bento-grid profile builder for Nostr yet** - this is an opportunity for Divine-Space.

---

## Existing Apps

### Active Apps

| App | URL | Description | Event Kind | Open Source |
|-----|-----|-------------|------------|-------------|
| **Nostree** | [nostree.me](https://nostree.me) | Linktree-style link lists + notes | Kind 30003 | [Yes](https://github.com/gzuuus/linktr-nostr) |
| **npub.pro** | [npub.pro](https://npub.pro) | Full website builder with Ghost themes | Kind 30512 | [Yes](https://github.com/nostrband/nostrsite) |
| **NostrLink** | [nostrlink.app](https://nostrlink.app) | Link-in-bio pages | Unknown | No |
| **Listr** | [listr.lol](https://listr.lol) | List management | Kind 30000/10000 | Unknown |
| **Nosta.me** | [nosta.me](https://nosta.me) | Profile viewer (not builder) | Kind 0 | Unknown |
| **AllSocial.me** | [allsocial.me](https://allsocial.me) | Linktree-like | Unknown | No |

### Inactive/Unknown Status

| App | Notes |
|-----|-------|
| **Favvy** | ECONNREFUSED - may be offline |
| **Bento.me** | Shutting down Feb 2025 |

---

## Nostree Deep Dive

### Technology
- **Framework**: Svelte + TypeScript
- **Styling**: TailwindCSS
- **Protocol**: NDK (Nostr Dev Kit)

### Event Structure (Kind 30003)
```json
{
  "kind": 30003,
  "tags": [
    ["d", "nostree-<uuid>"],
    ["title", "My Links"],
    ["description", "..."],
    ["image", "<banner-url>"],
    ["r", "https://github.com/user", "GitHub"],
    ["r", "https://twitter.com/user", "Twitter"],
    ["t", "links"]
  ],
  "content": ""
}
```

### Features
- 11 built-in themes
- Multiple link lists per user
- Displays recent notes and long-form posts
- Friendly URLs via slugs
- No account required (uses Nostr keys)

### Source Code
- Repository: [github.com/gzuuus/linktr-nostr](https://github.com/gzuuus/linktr-nostr)

---

## npub.pro Deep Dive

### Technology
- **Engine**: libnostrsite
- **Themes**: Ghost CMS themes (Handlebars)
- **Storage**: Nostr relays + Blossom servers

### Event Structure (Kind 30512 - NIP-512)
```json
{
  "kind": 30512,
  "tags": [
    ["d", "site-id"],
    ["r", "https://user.npub.pro/"],
    ["name", "My Site"],
    ["x", "30514:<pubkey>:theme-name", "<package-hash>"],
    ["include", "k", "1"],
    ["include", "k", "30023"],
    ["z", "org.nostrsites"]
  ]
}
```

### Features
- Full website from Nostr content
- Ghost theme ecosystem compatibility
- PWA support (offline)
- SEO optimized
- Self-hostable
- Free subdomain (user.npub.pro)
- Custom domain support (Pro)

### Source Code
- Engine: [github.com/nostrband/nostrsite](https://github.com/nostrband/nostrsite)
- NIP-512: [github.com/brugeman/nips/blob/nip/512/512.md](https://github.com/brugeman/nips/blob/nip/512/512.md)

---

## Shakespeare.diy Deep Dive

### Technology
- **Framework**: React PWA
- **Storage**: IndexedDB + LightningFS
- **Compilation**: esbuild-wasm (in-browser)
- **Version Control**: isomorphic-git

### Features
- Natural language website building
- Multiple AI providers (OpenRouter, Claude, GPT-4, local)
- Nostr-based payments (Lightning)
- Code download/export
- Git integration

### How It Works
1. User describes website in natural language
2. AI generates code
3. Compiled in-browser
4. Deployed to Nostr/Blossom

### Source Code
- Repository: [gitlab.com/soapbox-pub/shakespeare](https://gitlab.com/soapbox-pub/shakespeare)
- License: AGPL-3.0

---

## Relevant NIPs

### NIP-51: Lists (Finalized)

| Kind | Purpose |
|------|---------|
| 10000 | Mute list |
| 10001 | Pin list |
| 10003 | Bookmarks |
| **30000** | Follow sets (for Top 8) |
| **30003** | Bookmark sets (for links) |

**Use For**: Top 8 Friends, Profile Links

### NIP-38: User Statuses (Draft)

| Kind | Purpose |
|------|---------|
| **30315** | User status |

**d-tag values**:
- `general` - Mood/status
- `music` - Now playing
- Custom values supported

**Use For**: Mood, Now Playing, Profile Song

### NIP-512: Nostr Sites (Proposed)

| Kind | Purpose |
|------|---------|
| 512 | Submit event |
| **30512** | Site configuration |
| 30513 | Hashtag page |
| **30514** | Theme definition |
| 30515 | Plugin definition |

**Use For**: Site configuration, theme selection

### NIP-136: Code Packages (Proposed)

| Kind | Purpose |
|------|---------|
| **1036** | Code package (theme files) |

**Use For**: Theme distribution via Blossom

### NIP-93: Profile Gallery (Proposed)

| Kind | Purpose |
|------|---------|
| **1163** | Gallery entry |

**Use For**: Image galleries (future)

### NIP-B7: Blossom Media (Finalized)

**Use For**: Decentralized media hosting

---

## Ghost Theme System

### Structure
```
theme/
├── package.json       # Theme metadata
├── index.hbs          # Homepage
├── default.hbs        # Base layout
├── post.hbs           # Single post
├── page.hbs           # Static page
├── author.hbs         # Author page
├── tag.hbs            # Tag archive
├── partials/          # Reusable components
└── assets/            # CSS, JS, images
```

### Handlebars Templating
```handlebars
{{!< default}}

<main>
  {{#foreach posts}}
    <article>
      <h2>{{title}}</h2>
      <p>{{excerpt}}</p>
    </article>
  {{/foreach}}
</main>
```

### Bento Ghost Theme
- URL: [bentotheme.io](https://www.bentotheme.io)
- Price: $99
- Features: Bento grid, 22 color schemes, dark mode

---

## Competitive Analysis

### Divine-Space Differentiators

| Feature | Nostree | npub.pro | Divine-Space |
|---------|---------|----------|--------------|
| **Bento grid** | No | No | **Yes** (planned) |
| **Drag-and-drop** | No | No | **Yes** (planned) |
| **Top 8 Friends** | No | No | **Yes** |
| **Profile Music** | No | No | **Yes** |
| **MySpace Themes** | No | No | **Yes** |
| **AI Customization** | No | No | **Yes** (planned) |
| **Mood/Status** | No | No | **Yes** |
| **Video Integration** | No | Limited | **Yes** |

### Feature Gaps to Address

1. **Bento Grid Layout** - No one has this
2. **Drag-and-drop Widget Positioning** - No one has this
3. **AI Theme Generation** - Shakespeare has for websites, not profiles
4. **Variable Widget Sizes** - All use linear lists
5. **Rich Embeds** - Limited across ecosystem

---

## Interoperability Matrix

### What Divine-Space Should Read

| Source | Event Kind | Data |
|--------|------------|------|
| Nostree | 30003 | Link lists |
| npub.pro | 30512 | Site config |
| Listr | 30000 | People lists |
| Any client | 0 | Profile metadata |
| Any client | 30315 | User status |

### What Divine-Space Should Write

| Target | Event Kind | Data |
|--------|------------|------|
| Nostree | 30003 | Links (compatible) |
| npub.pro | 30512 | Site config |
| Listr | 30000 | Top 8 Friends |
| All clients | 0 | Profile metadata |
| All clients | 30315 | Status |

---

## Key Sources

### Apps
- [Nostree](https://nostree.me)
- [npub.pro](https://npub.pro)
- [Shakespeare.diy](https://shakespeare.diy)
- [NostrLink](https://nostrlink.app)
- [Listr](https://listr.lol)

### NIPs
- [NIP-51 Lists](https://github.com/nostr-protocol/nips/blob/master/51.md)
- [NIP-38 User Statuses](https://nips.nostr.com/38)
- [NIP-512 Nostr Sites](https://github.com/brugeman/nips/blob/nip/512/512.md)
- [NIP-136 Code Packages](https://github.com/brugeman/nips/blob/nip/136/136.md)
- [NIP-B7 Blossom](https://nips.nostr.com/B7)

### GitHub
- [linktr-nostr (Nostree)](https://github.com/gzuuus/linktr-nostr)
- [nostrsite (npub.pro)](https://github.com/nostrband/nostrsite)
- [shakespeare (Soapbox)](https://gitlab.com/soapbox-pub/shakespeare)
- [awesome-nostr](https://github.com/aljazceru/awesome-nostr)

### Articles
- [Nostr Tech Weekly](https://habla.news/nostreport)
- [Productivity Apps (Habla)](https://habla.news/tony/productivity)
- [npub.pro Launch](https://www.nobsbitcoin.com/npub-pro-launched/)
