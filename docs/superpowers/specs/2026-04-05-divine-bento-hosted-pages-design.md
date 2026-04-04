# Divine Bento Hosted Pages Design

Date: 2026-04-05
Status: Approved for planning

## Summary

DiVine should evolve from a fixed MySpace-style profile plus separate settings screens into a hosted Nostr page product with a real page studio.

The product center is:

- `divine.space` as the app shell, discovery surface, and owner studio
- `username.divine.video` as the published public page
- a draft-first bento page model that powers both manual widget editing and AI-assisted page creation

The default public page shell should be a sidebar bento layout. Owners build with a curated widget system in `v1`, while a Lovable/Shakespeare-style AI copilot assembles and edits the same structured page model in drafts. The hosted page should read as a mixed-media creator site that can plausibly replace a lightweight Tumblr-style blog/portfolio, not only a social profile.

## Product Goals

- Make hosted user pages a first-class product, not an afterthought of the video app
- Support mixed-media creator publishing across video, text, and photo-oriented content
- Let the public page function as a portfolio/blog/archive of past work
- Give creators a first-class way to surface upcoming shows, appearances, releases, or events
- Give users an obvious, central way to build and rearrange their page
- Publish visitor-facing pages to `username.divine.video`
- Keep editing safe with draft and publish separation
- Support web and mobile authoring against the same page model
- Stay aligned with the Nostr site ecosystem where practical

## Non-Goals

- Full freeform visual canvas editing in `v1`
- Instagram import/sync in `v1`
- Full comment systems on every widget in `v1`
- A second parallel page system that bypasses the structured widget model

## Standards Review

The product should align with existing Nostr site patterns instead of inventing a Divine-only publishing model.

### Primary Alignment

- Use a `kind:30512` site configuration style as the canonical hosted page document
- Treat the current bento/site-config path as the base to build on
- Continue using standard Nostr content where possible for posts, long-form content, lists, media, and relay discovery

### Relevant Nostr Standards

- `NIP-23` long-form content for richer authored content
- `NIP-52` calendar events for upcoming appearances, shows, and date/time-based creator events
- `NIP-51` lists/bookmark sets/follow sets for links, curated lists, and friend-like constructs
- `NIP-65` relay discovery for fetch/publish strategy
- `NIP-94` file metadata for media/assets
- `NIP-5A` as a future export/self-hosting path, not the primary authoring model

### Ecosystem Position

`npub.pro` is best understood as a hosted Nostr site renderer and admin surface, not a fully freeform page builder. Divine should follow that underlying site-model direction, but provide a much stronger bento authoring and AI-assisted editing experience on top.

## Product Surfaces

### 1. App Shell: `divine.space`

This remains a general app surface similar to `divine.video`, not only the builder.

Responsibilities:

- app navigation and account context
- discovery/search/feed/friends entry points
- entry into page creation and editing
- drafts, publishing, and page management
- AI copilot workspace

### 2. Public Site: `username.divine.video`

This is the hosted published site visitors see.

Responsibilities:

- render the published page snapshot
- present mixed-media archive and portfolio content clearly
- surface upcoming creator events in a first-class way
- expose social-lite interactions
- present a stable, shareable public identity surface

### 3. Owner Studio: routes inside `divine.space`

This is the first-class page-building experience.

Responsibilities:

- edit draft page state
- manual widget composition
- AI-assisted page generation and refinement
- preview and publish

## Public Page Model

### Default Shell

The default shell is `Sidebar Bento`.

- Left rail: profile intro, links, music, follow/save/contact, Top Friends, compact social blocks
- Right column: text, embeds, notes, featured videos/posts/photos, guestbook, events, and other content widgets

This preserves strong profile identity while still feeling like a hosted personal site. The intended feel is “creator homepage with social primitives,” not just “profile page with extra cards.”

### Social Lite in `v1`

The first public interaction layer should include:

- guestbook
- follow/save page affordance
- contact or outbound contact block

Avoid per-widget comment systems in `v1`. Guestbook provides the strongest “alive page” feeling with much less complexity.

## Builder Model

### `v1` Curated Widgets

The first builder should be a structured widget editor, not a freeform canvas.

Core `v1` widgets:

- profile / intro
- links
- text / note
- embed
- videos / featured media
- posts / notes
- gallery / photo media
- music
- events / upcoming
- top friends
- guestbook
- follow/save/contact

Owners can:

- add/remove widgets
- reorder and resize widgets
- configure widget settings
- show/hide blocks
- preview draft state

### Why Structured Widgets First

- consistent rendering on public pages
- predictable editing on web and mobile
- easier migration from existing profile data
- safe substrate for AI editing

### Creator/Portfolio Bias

The builder should bias toward creator use cases:

- “send people here to see everything I make”
- archive past work across multiple media types
- highlight current projects
- surface upcoming appearances or releases

This means notes/posts and events cannot be treated as marginal widgets. They are core to the public page story.

## AI Copilot Model

The AI layer should behave like Lovable or Shakespeare for page building, but it must operate on the same structured draft model as manual editing.

### Capabilities

- prompt-to-layout generation
- style/vibe changes
- widget additions/removals/reordering
- copy suggestions and page tone adjustments
- iterative conversational editing

### Guardrails

- AI only edits drafts
- AI produces structured page changes, not arbitrary runtime HTML/DOM
- owner can inspect, refine, and publish explicitly

## Draft and Publish Lifecycle

Each user page has two states:

- `Draft`: private working copy used by manual editing and AI
- `Published`: visitor-facing version served on `username.divine.video`

Lifecycle:

1. owner opens studio in `divine.space`
2. owner edits manually or through AI
3. owner previews the draft
4. owner explicitly publishes
5. public page updates to the new published snapshot

Draft-first behavior is mandatory. AI and manual changes must never directly mutate the live page.

## Cross-Platform Authoring

There should be one shared page model and one shared public rendering model, with different editing chrome by platform.

### Web

- drag/drop and resize heavy
- richer side panels
- stronger AI copilot/chat workflow

### `divine-mobile`

- guided editing
- simpler reorder/configure interactions
- AI-assisted flows over complex drag/drop

The rendering output should remain consistent. Only the editing experience differs.

## Canonical Data Model

There should be one canonical hosted page document per user.

Conceptually it contains:

- site metadata: title, summary, image, routing/domain binding
- shell settings: layout type, header/nav behavior, theme id
- widgets: ordered/resizable blocks with type, size, position, visibility, config
- content/archive settings for mixed-media presentation where needed
- social settings: guestbook/contact/follow-save toggles
- draft/publish metadata
- AI revision metadata for draft history and patching

## Migration Strategy

Do not force users into blank pages.

When a user first opens the page studio, generate a starter draft from existing Divine/Nostr data:

- Kind `0` profile metadata
- current website/link data
- music/theme/background data where useful
- Top Friends / social data
- featured videos/posts where available

If the user later has NIP-52 events, those should slot naturally into the page model as first-class event widgets rather than bespoke Divine-only structures.

The goal is “your current page, now editable,” not “start from nothing.”

## Existing System Consolidation

The current codebase contains competing concepts:

- fixed profile page
- MySpace customization page
- dormant bento/site-config path

The new product should consolidate these into one hosted page system.

Effects:

- current profile/myspace settings become inputs into the canonical page model
- dormant bento editor infrastructure becomes part of the real studio
- the fixed profile page stops being the long-term source of truth

## Risks

- diverging legacy and new page systems during migration
- draft/publish bugs causing live page corruption
- weak parity between preview and public rendering
- AI edits becoming opaque or unsafe
- mobile editing becoming too limited or too complex

## Testing Focus

- page model parsing, migration, and serialization
- draft creation and publish flows
- widget rendering parity between studio preview and public page
- cross-platform editor behavior
- AI patch application to structured page documents

## Recommended Implementation Direction

Build Divine as:

- an `npub.pro`-style hosted Nostr site model underneath
- a sidebar-bento public page shell by default
- a curated widget studio in `divine.space`
- an AI-assisted draft workflow on top of the same canonical model

This avoids both extremes:

- not a bolt-on builder beside the old profile system
- not a completely bespoke freeform builder that ignores the Nostr site ecosystem
