# Divine Space

Divine Space is a MySpace-inspired video social network built on Nostr. It pairs short-form video with fully customizable profiles — bento-grid layouts, themes, profile music, a Top 8, and moods — so your page actually feels like yours. You own your identity and content; no central platform sits between you and your audience.

## Features

- **Short-form video feed** — browse, watch, and embed videos, with a trending leaderboard. Video and social data come from both Nostr relays and the `relay.divine.video` REST API.
- **MySpace-style profiles** — a Top 8, profile music, mood and status, selectable themes (Scene, Y2K, Gothic, Kawaii, Neon, Retro, Space, and more), and custom CSS.
- **Page Studio** — a drag-and-drop bento-grid page builder (`/studio/page`) plus an AI-assisted builder (`/studio/ai`) that helps compose and edit your page.
- **Direct messages** — encrypted DMs over NIP-04 and NIP-17.
- **Lightning zaps** — send and receive zaps, with wallet support via WebLN and Nostr Wallet Connect (NWC).
- **Divine Space names** — claim a name/subdomain for your profile.
- **Multiple accounts** — sign in with multiple Nostr identities and switch between them.

## Architecture

Divine Space is a client-side single-page app. It has no backend of its own — state lives on Nostr relays, so profiles, videos, and social graph are portable across the wider Nostr ecosystem.

- **Nostr integration** uses [Nostrify](https://nostrify.dev) (`@nostrify/nostrify`, `@nostrify/react`) and `nostr-tools`. By default the app connects to `wss://relay.divine.video`, `wss://relay.primal.net`, and `wss://relay.damus.io`.
- **Profile customization** is stored in a custom replaceable event, kind `16793`, which carries the Top 8, profile music, theme, mood, status, pinned video, and other MySpace-style settings. See [`NIP.md`](./NIP.md) for the full specification.
- **Media uploads** go through Blossom servers.
- **Data fetching and caching** use TanStack Query; routing uses React Router.

The app is part of the broader Divine platform: it reads video and engagement data from the Divine video API at `relay.divine.video` and shares the `divine.video` media and relay infrastructure.

## Tech stack

React 18, TypeScript, and Vite, with TailwindCSS and [shadcn/ui](https://ui.shadcn.com) (Radix UI) for the interface, `react-grid-layout` for bento layouts, and Zod for schema validation.

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server. To build for production:

```bash
npm run build
```

To run the full check suite — type-check, lint, unit tests (Vitest), and a production build:

```bash
npm test
```

## Deployment

Production runs on Fastly Compute. The build in `compute-js/` serves the static bundle at the edge. Deploys are automated by the GitHub Actions workflow in `.github/workflows/deploy.yml`, which runs after the Test workflow succeeds on `main` (or via manual dispatch) and requires a `FASTLY_API_TOKEN` secret. A GitLab CI pipeline (`.gitlab-ci.yml`) provides an alternative Pages deployment.

## Documentation

- [`AGENTS.md`](./AGENTS.md) — project overview, architecture, and conventions
- [`NIP.md`](./NIP.md) — the custom Nostr event kind and tags this app uses
- [`docs/`](./docs) — architecture notes, data model, roadmap, and implementation details

---

Part of [Divine](https://divine.video) — your playground for human creativity · [Brand guidelines](https://github.com/divinevideo/brand-guidelines)
