# Divine-Space Bento Profile System Roadmap

> **Vision**: Build the first true Nostr bento-grid profile builder with full ecosystem interoperability, combining Bento.me's UX with MySpace's personality and Nostr's data sovereignty.

## Executive Summary

Divine-Space will evolve from a custom MySpace-inspired profile system to a fully interoperable Nostr profile builder that:
- Uses standard NIPs for maximum ecosystem compatibility
- Supports both Ghost themes (NIP-512) and AI-generated themes
- Provides drag-and-drop bento grid layouts
- Maintains unique MySpace features (Top 8, music, themes)

---

## Phase Overview

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| **Phase 1** | Standards Adoption | 2-3 weeks | None |
| **Phase 2** | Theme System | 3-4 weeks | Phase 1 |
| **Phase 3** | AI Theme Generator | 2-3 weeks | Phase 2 |
| **Phase 4** | Bento Grid | 3-4 weeks | Phase 2 |

---

## Phase 1: Standards Adoption

**Goal**: Migrate from custom Kind 16793 to standard NIPs for maximum interoperability.

### Tasks

- [ ] **1.1** Migrate Top 8 Friends to NIP-51 (Kind 30000)
  - [ ] Create `useTop8Friends` hook using Kind 30000
  - [ ] Add `d` tag = `"top8"` or `"featured-friends"`
  - [ ] Support petnames in 4th `p` tag position
  - [ ] Write migration utility for existing Kind 16793 data
  - [ ] Add dual-publish (Kind 30000 + backward compat)
  - [ ] Write tests for Top 8 CRUD operations

- [ ] **1.2** Migrate Links to NIP-51 (Kind 30003)
  - [ ] Create `useProfileLinks` hook using Kind 30003
  - [ ] Use `r` tags for URLs with labels
  - [ ] Ensure Nostree/Listr compatibility
  - [ ] Write tests for link management

- [ ] **1.3** Adopt NIP-38 for Status (Kind 30315)
  - [ ] Create `useMusicStatus` hook with `d: "music"`
  - [ ] Create `useMoodStatus` hook with `d: "general"`
  - [ ] Handle expiration for ephemeral statuses
  - [ ] Write tests for status publishing

- [ ] **1.4** Design Profile Song Solution
  - [ ] Research extending Kind 0 metadata
  - [ ] Or create persistent `d: "profile_song"` status
  - [ ] Document decision in ADR
  - [ ] Implement chosen approach
  - [ ] Write tests

- [ ] **1.5** Update Profile Page to Read Standard Events
  - [ ] Refactor Profile.tsx to query multiple kinds
  - [ ] Add fallback to Kind 16793 for migration period
  - [ ] Create unified profile data aggregator hook
  - [ ] Write integration tests

- [ ] **1.6** Deprecation Plan for Kind 16793
  - [ ] Document migration path
  - [ ] Add deprecation warnings in code
  - [ ] Set sunset date (6 months)

### Acceptance Criteria
- [ ] Top 8 visible in apps that support NIP-51 (Listr)
- [ ] Links visible in Nostree
- [ ] Mood/status visible in clients supporting NIP-38
- [ ] All existing tests pass
- [ ] New tests cover standard NIP hooks

---

## Phase 2: Theme System (NIP-512 + Ghost)

**Goal**: Adopt NIP-512 for site configuration and support Ghost themes.

### Tasks

- [ ] **2.1** Create Divine Site Event (Kind 30512)
  - [ ] Define site event structure
  - [ ] Include content filters for videos, notes, links
  - [ ] Reference theme via `x` tag
  - [ ] Add `z` tag for renderer identification
  - [ ] Write tests for site event creation

- [ ] **2.2** Create Base Divine Ghost Theme
  - [ ] Set up Ghost theme project structure
  - [ ] Create Handlebars templates for profile
  - [ ] Port existing CSS themes to Ghost format
  - [ ] Package as Kind 1036 code package
  - [ ] Publish to Blossom server
  - [ ] Write theme rendering tests

- [ ] **2.3** Create Divine Bento Theme
  - [ ] Fork/adapt existing Bento Ghost theme
  - [ ] Add MySpace-specific components
  - [ ] Support Top 8 widget
  - [ ] Support music player widget
  - [ ] Support mood/status widgets
  - [ ] Write widget tests

- [ ] **2.4** Integrate libnostrsite Renderer
  - [ ] Add libnostrsite dependency
  - [ ] Create theme rendering component
  - [ ] Handle theme loading from Blossom
  - [ ] Cache themes locally
  - [ ] Write rendering tests

- [ ] **2.5** Theme Selector UI
  - [ ] Create theme browser component
  - [ ] Preview themes before applying
  - [ ] Publish theme selection to Kind 30512
  - [ ] Write UI tests

- [ ] **2.6** Ensure npub.pro Compatibility
  - [ ] Test divine profiles render on npub.pro
  - [ ] Document any compatibility issues
  - [ ] Fix rendering discrepancies

### Acceptance Criteria
- [ ] Divine profiles can use Ghost themes
- [ ] Divine profiles render correctly on npub.pro
- [ ] Theme packages published to Blossom
- [ ] At least 3 MySpace themes ported
- [ ] All tests pass

---

## Phase 3: AI Theme Generator

**Goal**: Enable users to customize themes via natural language.

### Tasks

- [ ] **3.1** Design AI Theme Architecture
  - [ ] Define customization schema (colors, fonts, effects)
  - [ ] Design prompt engineering for theme generation
  - [ ] Choose CSS generation vs component generation
  - [ ] Document in ADR

- [ ] **3.2** Integrate AI Provider
  - [ ] Add OpenRouter/Claude/GPT-4 support
  - [ ] Use existing AI chat hook
  - [ ] Implement rate limiting
  - [ ] Add cost tracking
  - [ ] Write provider tests

- [ ] **3.3** Create Theme Customization UI
  - [ ] Natural language input field
  - [ ] Real-time preview
  - [ ] Iteration support ("make it more pink")
  - [ ] Undo/redo capability
  - [ ] Write UI tests

- [ ] **3.4** CSS Generation Pipeline
  - [ ] Parse AI response to CSS
  - [ ] Validate generated CSS
  - [ ] Sanitize for security
  - [ ] Apply to base theme
  - [ ] Write generation tests

- [ ] **3.5** Save Custom Themes
  - [ ] Store customizations in site event
  - [ ] Option to publish as new theme (Kind 30514)
  - [ ] Theme versioning
  - [ ] Write persistence tests

- [ ] **3.6** Preset Prompts
  - [ ] "Make it Y2K with butterflies"
  - [ ] "Add more sparkles and glitter"
  - [ ] "Make it emo/scene kid style"
  - [ ] "Cyberpunk neon aesthetic"
  - [ ] Document prompt library

### Acceptance Criteria
- [ ] Users can describe themes in natural language
- [ ] AI generates valid CSS customizations
- [ ] Preview updates in real-time
- [ ] Customizations persist to Nostr
- [ ] All tests pass

---

## Phase 4: Bento Grid Layout

**Goal**: Implement drag-and-drop bento grid for widget positioning.

### Tasks

- [ ] **4.1** Select Grid Library
  - [ ] Evaluate react-grid-layout
  - [ ] Evaluate dnd-kit
  - [ ] Evaluate @hello-pangea/dnd
  - [ ] Document decision in ADR
  - [ ] Add chosen dependency

- [ ] **4.2** Define Widget System
  - [ ] Create widget interface/type
  - [ ] Define standard widget sizes (1x1, 2x1, 1x2, 2x2)
  - [ ] Create widget registry
  - [ ] Write widget type tests

- [ ] **4.3** Implement Core Widgets
  - [ ] Profile widget (name, avatar, bio)
  - [ ] Top 8 widget
  - [ ] Music player widget
  - [ ] Links widget
  - [ ] Video grid widget
  - [ ] Mood/status widget
  - [ ] Nostr note embed widget
  - [ ] Write tests for each widget

- [ ] **4.4** Create Grid Editor
  - [ ] Drag-and-drop positioning
  - [ ] Widget resizing
  - [ ] Grid snapping
  - [ ] Collision detection
  - [ ] Mobile responsive behavior
  - [ ] Write editor tests

- [ ] **4.5** Persist Layout to Nostr
  - [ ] Design layout tag schema
  - [ ] Add layout to site event (Kind 30512)
  - [ ] Load saved layouts
  - [ ] Write persistence tests

- [ ] **4.6** Layout Templates
  - [ ] Classic MySpace layout
  - [ ] Bento grid layout
  - [ ] Minimalist layout
  - [ ] Maximalist layout
  - [ ] Write template tests

### Acceptance Criteria
- [ ] Users can drag widgets to reposition
- [ ] Users can resize widgets
- [ ] Layouts persist to Nostr
- [ ] Layouts render correctly for visitors
- [ ] Mobile responsive
- [ ] All tests pass

---

## Technical Debt & Maintenance

### Ongoing Tasks

- [ ] Maintain backward compatibility with Kind 16793
- [ ] Monitor NIP-512 spec changes
- [ ] Update Ghost themes for new features
- [ ] Performance optimization for grid rendering
- [ ] Accessibility audit (WCAG 2.1 AA)

### Documentation

- [ ] Update NIP.md with new event structures
- [ ] Create user documentation
- [ ] Create developer documentation
- [ ] Document all ADRs

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Interop with Nostree | 100% | Links visible |
| Interop with npub.pro | 100% | Profiles render |
| Theme load time | < 2s | Performance test |
| Grid interaction FPS | > 30 | Performance test |
| Test coverage | > 80% | Coverage report |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| NIP-512 spec changes | Medium | Pin to stable version, monitor |
| Ghost theme complexity | Medium | Start with simple theme |
| AI cost overruns | Low | Rate limiting, caching |
| Grid library limitations | Medium | Evaluate multiple options |
| Migration breaks existing profiles | High | Dual-publish, fallback logic |

---

## Related Documents

- [Architecture: Interop Strategy](./architecture/INTEROP-STRATEGY.md)
- [Architecture: Data Model](./architecture/DATA-MODEL.md)
- [Implementation: Phase 1](./implementation/PHASE-1-STANDARDS.md)
- [Implementation: Phase 2](./implementation/PHASE-2-THEMES.md)
- [Implementation: Phase 3](./implementation/PHASE-3-AI.md)
- [Implementation: Phase 4](./implementation/PHASE-4-BENTO.md)
- [Workflows: Agent Workflow](./workflows/AGENT-WORKFLOW.md)
- [Workflows: TDD Guidelines](./workflows/TDD-GUIDELINES.md)
- [Research: Prior Art](./research/PRIOR-ART.md)
