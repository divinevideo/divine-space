# MySpace 2.0 Redesign — Design Spec

Date: 2026-07-27
Status: Approved by user

## Goal

Make divine.space stop reading as AI-generated template and instead read as
"MySpace 2.0": a quiet, utilitarian platform frame (neocities model) with
user-choosable chaos — skinnable site chrome and fully customizable widget-canvas
profile pages with a faithful MySpace 1.0 anatomy as the default preset.

## Approved Direction Decisions

| Question | Decision |
|---|---|
| Design direction | User-choosable chaos: plain default + user-selectable skins/themes |
| Brand model | Neocities model: quiet utilitarian default chrome, personality lives in user pages; users skin the whole app |
| Profile layout | Freeform widget canvas (existing page-studio renderer); MySpace 1.0 anatomy shipped as default widget preset |
| Homepage | Hybrid: featured user pages + fresh videos + activity rail |
| Implementation approach | Token-layer reskin: split `--chrome-*` vs `--profile-*` vars, rebuild three surfaces, keep everything else |

## §1 Token & Skin Architecture

- New CSS custom property layer `--chrome-*` in `src/index.css`:
  - `--chrome-bg`, `--chrome-fg`, `--chrome-border`, `--chrome-accent`,
    `--chrome-link`, `--chrome-font`, `--chrome-radius`
  - Orthogonal to the existing profile theme vars (`--background`, `--primary`,
    etc. under `.theme-*` classes), which continue to style profile pages.
- Chrome components (Layout, Index, Browse, Search, Leaderboard, settings chrome)
  consume only `--chrome-*` values.
- shadcn base vars (`--background`, `--foreground`, `--card`, `--border`,
  `--primary`, `--muted`, etc.) are aliased to `--chrome-*` so the 48 existing
  `ui/` components follow skins with zero edits.
- Skin registry: `src/lib/chromeSkins.ts` exporting skin definitions:
  - `plain` (default): flat white/gray, Verdana-ish system stack, orange-red accent
  - `classic-blue`: MySpace 1.0 chrome (white bg, #003399 blue bar/links)
  - `terminal`: dark bg, phosphor green, monospace
  - `scene-kid`: near-black bg, hot pink/cyan accents
- New hook `src/hooks/useChromeSkin.ts`:
  - Applies skin via `data-chrome-skin` attribute on `<html>`
  - Persists to localStorage for logged-out users
  - When logged in, also publishes/reads an app-settings Nostr event
    (NIP-78, kind 30078) so skins sync across devices
- Skins never override a profile page owner's theme: chrome skin styles the
  site frame; the page body renders the owner's profile theme.

## §2 Site Chrome (Layout + Brand)

- Wordmark: flat text `divine.space` with orange-red `.` accent and a tiny
  play-badge glyph. No Sparkles icon, no gradient text, no glow.
- Header: thin 1px bottom border, skin background, text nav links
  (`home · browse · search · leaderboards`, plus `my page · friends` when
  logged in). Active link = bold + underline. Login rendered as plain
  `login | sign up` text links (still powered by LoginArea underneath).
- Remove from chrome surfaces: `animated-gradient` hero, `gradient-text`,
  `glow-*`, `hover-lift`, backdrop-blur sticky header. (These utilities remain
  available inside profile themes.)
- Footer: single line — `divine.space — a place for videos · about ·
  divine.video`.

## §3 Homepage (Index)

- Hero section removed. Single-line intro: wordmark +
  "make your own corner of the internet — claim yourname.divine.space" + claim CTA.
- Main grid (2/3 content + 1/3 rail):
  - **Featured pages**: 4–6 cards of user pages with mini preview thumbnails,
    page name, view count. Ordered by recent page-document update (fallback:
    platform stats). Uses existing page-document/site-config infrastructure.
  - **Fresh videos**: existing `useDivineVideos`, rendered dense and flat
    (square corners, 1px borders, small captions). Sort switch as plain text
    links: `trending · recent · popular`.
  - **Rail**: activity ticker (new pages, page updates), trending tags as plain
    `#tag` links, "🎲 random page" button (redirects to a random published
    page), numbered top-creators list.
- Loading/empty states: flat bordered boxes/skeletons, no shimmer gradients.

## §4 Profile Widget Anatomy

- Profiles render through the existing page-studio widget canvas; no new
  renderer.
- Default preset in `src/lib/defaultLayout.ts`: MySpace 1.0 anatomy composed of
  widgets:
  - `extended-network` header: "X is in your extended network", profile pic,
    online status, "view my: pics | vids"
  - `contact-actions`: message · add friend · add to faves
  - `profile-details`: status, zodiac, here-for, etc.
  - `blurbs`: about me / who I'd like to meet (rich text)
  - videos grid widget (existing)
  - friend space / Top 8 widget (existing `Top8Friends`)
  - comments widget (adapt existing comments components)
  - profile song widget (existing `ProfileMusicPlayer`)
- New widgets to implement in `src/lib/widgetRegistry.ts` +
  `src/components/ProfileWidgets.tsx`: `extended-network`, `contact-actions`,
  `profile-details`, `blurbs`. Others reuse existing components.
- Page studio gains preset picker ("MySpace 1.0", "Minimal", "Video creator")
  applied on new page or explicit reset. AI copilot prompt updated to prefer
  MySpace-anatomy widgets.
- Existing `.theme-*` profile themes (scene, y2k, gothic, kawaii, neon, retro,
  space, vine, tiktok, grunge, cottagecore) keep restyling the canvas unchanged.

## §5 Settings & Skin UX

- MySpaceSettings page keeps profile-theme controls as-is.
- New "Site skin" section in Settings: thumbnail grid of chrome skins with
  instant preview; saves to localStorage immediately and publishes to Nostr
  settings event when logged in.
- Logged-out visitors always get the `plain` default skin.

## §6 Build / Test Impact

- Token aliasing means no edits to the 48 `ui/` components.
- Rewrites: `src/components/Layout.tsx`, `src/pages/Index.tsx` (full),
  `src/pages/Profile.tsx` (becomes widget-canvas host).
- New files: `src/lib/chromeSkins.ts`, `src/hooks/useChromeSkin.ts`.
- Modified: `src/lib/defaultLayout.ts` (presets), `src/lib/widgetRegistry.ts`,
  `src/components/ProfileWidgets.tsx`, page-studio preset picker, AI copilot
  prompt.
- Tests: update `App.test.tsx`, `AppRouter*.test.tsx`, `Profile.test.tsx`,
  `PageStudio*.test.tsx` where markup assumptions break; add coverage for skin
  switching and preset application.
- Validation: `npm run test` (typecheck + lint + vitest) must pass; visual
  verification of home/profile/settings via playwright-mcp.
- No Nostr schema changes; page documents, themes, publishing untouched.

## Non-Goals

- Rewriting shadcn/ui component library
- Changing Nostr event schemas or relay infrastructure
- Mobile app / native work
- Removing existing profile themes or widget types
