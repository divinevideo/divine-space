# Divine Space

Divine Space is a decentralized short-form video app that revives Vine's 6-second format, built on Nostr — human-made content only, no AI slop. It pairs quick videos with MySpace-style profiles: customizable bento-grid layouts, themes, music, and a Top 8, so your page actually feels like yours. You own your identity and data; no central platform sits between you and your audience.

## Tech stack

Built with React 18, TypeScript, Vite, TailwindCSS, and shadcn/ui, using [Nostrify](https://nostrify.dev) for the Nostr protocol and TanStack Query for data fetching.

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server. To build for production:

```bash
npm run build
```

To run the test suite (type-check, lint, unit tests, and a production build):

```bash
npm test
```

## Documentation

- `AGENTS.md` — project overview, architecture, and conventions
- `NIP.md` — the custom Nostr event kinds and tags this app uses
- `docs/` — architecture notes, roadmap, and implementation details

---

Part of [Divine](https://divine.video) — your playground for human creativity · [Brand guidelines](https://github.com/divinevideo/brand-guidelines)
