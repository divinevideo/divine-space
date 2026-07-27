# Architecture: Interoperability Strategy

> **Principle**: Layer on standards, don't replace them.

## Overview

Divine-Space will achieve maximum Nostr ecosystem interoperability by:
1. Using standard NIPs for all shareable data
2. Adding divine-specific extensions only when necessary
3. Dual-publishing during migration periods
4. Testing against real ecosystem apps (Nostree, npub.pro, Listr)

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Divine-Specific UI                                │
│  - Bento grid editor                                        │
│  - AI theme customizer                                      │
│  - MySpace aesthetic components                             │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Divine Extensions                                 │
│  - Layout positions in Kind 30512                           │
│  - Theme customizations                                     │
│  - Widget configurations                                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Content (Standard NIPs)                           │
│  - Top 8 → Kind 30000 (NIP-51)                             │
│  - Links → Kind 30003 (NIP-51)                             │
│  - Status/Mood → Kind 30315 (NIP-38)                       │
│  - Site config → Kind 30512 (NIP-512)                      │
│  - Themes → Kind 30514/1036 (NIP-512/136)                  │
│  - Videos → Kind 34236 (existing)                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Identity (Standard NIPs)                          │
│  - Profile → Kind 0 (NIP-01)                               │
│  - Contacts → Kind 3 (NIP-02)                              │
│  - Relay list → Kind 10002 (NIP-65)                        │
│  - NIP-05 verification                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## NIP Adoption Matrix

### Must Adopt (Critical for Interop)

| Feature | NIP | Kind | Why |
|---------|-----|------|-----|
| Follow Sets (Top 8) | NIP-51 | 30000 | Listr, other clients support |
| Bookmark Sets (Links) | NIP-51 | 30003 | Nostree compatibility |
| User Status | NIP-38 | 30315 | Standard status protocol |
| Profile Metadata | NIP-01 | 0 | Universal identity |

### Should Adopt (Recommended for Ecosystem)

| Feature | NIP | Kind | Why |
|---------|-----|------|-----|
| Nostr Sites | NIP-512 | 30512 | npub.pro compatibility |
| Code Packages | NIP-136 | 1036 | Theme distribution |
| Themes | NIP-512 | 30514 | Theme portability |

### May Adopt (Nice to Have)

| Feature | NIP | Kind | Why |
|---------|-----|------|-----|
| Profile Gallery | NIP-93 | 1163 | Image galleries |
| Blossom Media | NIP-B7 | - | Decentralized media |

---

## Interop Testing Matrix

### Apps to Test Against

| App | URL | What to Test |
|-----|-----|--------------|
| **Nostree** | nostree.me | Kind 30003 links appear |
| **npub.pro** | npub.pro | Kind 30512 site renders |
| **Listr** | listr.lol | Kind 30000 lists visible |
| **Primal** | primal.net | Kind 0 profile, Kind 30315 status |
| **Damus** | damus.io | Kind 0 profile basics |
| **Amethyst** | Android | Kind 0, Kind 30315 |

### Test Scenarios

- [ ] Create Top 8 in Divine → View in Listr
- [ ] Create links in Divine → View in Nostree
- [ ] Create site in Divine → View on npub.pro
- [ ] Create status in Divine → View in Primal
- [ ] Create profile in Nostree → View in Divine
- [ ] Create site in npub.pro → View in Divine

---

## Migration Strategy

### From Kind 16793 to Standard NIPs

```typescript
// Phase 1: Dual publish
async function saveTop8(friends: TopFriend[]) {
  // Publish to standard NIP-51
  await publishKind30000(friends);

  // Also publish to legacy for backward compat
  await publishKind16793WithTop8(friends);
}

// Phase 2: Read from both, prefer standard
async function loadTop8(pubkey: string) {
  // Try standard first
  const standard = await queryKind30000(pubkey, 'top8');
  if (standard) return parseTop8FromKind30000(standard);

  // Fallback to legacy
  const legacy = await queryKind16793(pubkey);
  if (legacy) return parseTop8FromKind16793(legacy);

  return [];
}

// Phase 3: Stop writing legacy (after 6 months)
// Phase 4: Stop reading legacy (after 12 months)
```

### Migration Timeline

| Phase | Duration | Actions |
|-------|----------|---------|
| Dual-write | 0-6 months | Write to both, read from both |
| Read-only legacy | 6-12 months | Write standard only, read both |
| Deprecate | 12+ months | Standard only |

---

## Extension Points

### Where Divine Can Extend

1. **Site Event Tags**: Add custom tags to Kind 30512 for layout
2. **Theme Customizations**: Store custom CSS in content
3. **Widget Positions**: Define grid positions in standardized format

### Extension Format

```json
{
  "kind": 30512,
  "tags": [
    ["d", "profile"],
    ["r", "https://divine.space/alice/"],

    // Standard NIP-512 tags
    ["name", "Alice's Space"],
    ["x", "30514:<pubkey>:divine-bento", "<hash>"],
    ["include", "k", "34236"],

    // Divine extensions (namespaced)
    ["divine:layout", "bento"],
    ["divine:grid", "4"],
    ["divine:widget", "profile", "0,0", "2x2"],
    ["divine:widget", "music", "2,0", "2x1"],

    // Or as JSON in content for complex layouts
  ],
  "content": "{\"layout\":{\"widgets\":[...]}}"
}
```

---

## Compatibility Guarantees

### What Divine Guarantees

1. **Standard events are always valid**: Divine will never publish malformed NIP events
2. **Extensions are ignorable**: Other clients can safely ignore `divine:*` tags
3. **Graceful degradation**: Profiles render without divine extensions
4. **No breaking changes**: Once published, event format is stable

### What Divine Expects

1. Relays store standard event kinds
2. Other clients ignore unknown tags gracefully
3. NIP specs remain stable (or versioned)

---

## API Compatibility

### Reading External Profiles

Divine will read and display profiles from:
- Kind 0 (universal profiles)
- Kind 30000 (follow sets / Top 8)
- Kind 30003 (link lists from Nostree)
- Kind 30512 (sites from npub.pro)
- Kind 30315 (status from any client)

### Writing to Ecosystem

Divine profiles will be readable by:
- Any NIP-51 client (Listr, etc.)
- Any NIP-38 client (status)
- Any NIP-512 client (npub.pro)
- Any basic Nostr client (Kind 0)

---

## Decision Records

### ADR-001: Use NIP-51 for Top 8

**Context**: Top 8 friends is currently in custom Kind 16793.

**Decision**: Migrate to Kind 30000 (Follow Sets) with `d: "top8"`.

**Rationale**:
- Standard NIP with existing client support
- Listr already displays Kind 30000 lists
- Petnames supported in 4th position of `p` tag
- No loss of functionality

**Consequences**:
- Top 8 visible in Listr and other NIP-51 clients
- Migration period required for backward compat

### ADR-002: Use NIP-38 for Status

**Context**: Mood and status currently in Kind 16793.

**Decision**: Use Kind 30315 with `d: "general"` for mood, `d: "music"` for now playing.

**Rationale**:
- Standard protocol for live status
- Supported by multiple clients
- Expiration support for ephemeral status

**Consequences**:
- Status visible across ecosystem
- Need separate handling for persistent "profile song"

### ADR-003: Adopt NIP-512 for Site Config

**Context**: Need theme and layout configuration.

**Decision**: Use Kind 30512 for site configuration.

**Rationale**:
- npub.pro compatibility
- Standard theme reference format
- Content filtering built-in

**Consequences**:
- Profiles render on npub.pro
- Must learn Ghost theme system
- Theme packages need Blossom hosting
