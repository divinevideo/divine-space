# DiVine Space Custom NIPs

This document defines custom Nostr event kinds used by DiVine Space for MySpace-inspired profile customization features.

## Kind 16793: Profile Customization

A replaceable event that stores a user's profile customization settings including Top 8 friends, profile music, theme preferences, mood status, and other MySpace-inspired features.

### Event Structure

```json
{
  "kind": 16793,
  "content": "<optional additional JSON data>",
  "tags": [
    ["alt", "DiVine Space profile customization"],
    
    // Top 8 Friends - ordered list (position 1-8)
    ["p", "<pubkey1>", "", "1"],
    ["p", "<pubkey2>", "", "2"],
    ["p", "<pubkey3>", "", "3"],
    // ... up to 8 friends
    
    // Profile Song (URL to audio - Wavlake, YouTube, etc.)
    ["music", "<url>", "<title>", "<artist>"],
    
    // Auto-play setting for profile music
    ["autoplay", "true|false"],
    
    // Theme selection
    ["theme", "<theme-name>"],
    
    // Custom CSS (limited/sanitized)
    ["css", "<custom-css>"],
    
    // Background image
    ["background", "<image-url>"],
    
    // Current mood
    ["mood", "<mood-text>", "<emoji>"],
    
    // Status message
    ["status", "<status-text>"],
    
    // Featured/pinned video
    ["pinned", "<video-event-id>"],
    
    // Profile song lyrics/quote
    ["quote", "<quote-text>"]
  ]
}
```

### Tags Specification

| Tag | Description | Format |
|-----|-------------|--------|
| `p` | Top 8 friend with position | `["p", "<pubkey>", "", "<position 1-8>"]` |
| `music` | Profile song URL | `["music", "<url>", "<title?>", "<artist?>"]` |
| `autoplay` | Auto-play music on visit | `["autoplay", "true\|false"]` |
| `theme` | Theme preset name | `["theme", "<name>"]` |
| `css` | Custom CSS snippet | `["css", "<css-code>"]` |
| `background` | Background image URL | `["background", "<url>"]` |
| `mood` | Current mood | `["mood", "<text>", "<emoji?>"]` |
| `status` | Status message | `["status", "<text>"]` |
| `pinned` | Pinned video event ID | `["pinned", "<event-id>"]` |
| `quote` | Profile quote/lyrics | `["quote", "<text>"]` |

### Available Themes

- `default` - Default DiVine Space theme
- `scene` - Scene/Emo aesthetic
- `y2k` - Y2K/early 2000s aesthetic  
- `gothic` - Dark gothic theme
- `kawaii` - Cute anime/kawaii theme
- `neon` - Cyberpunk neon theme
- `retro` - Retro 90s theme
- `space` - Space/cosmic theme

### Example Event

```json
{
  "kind": 16793,
  "pubkey": "...",
  "created_at": 1234567890,
  "content": "",
  "tags": [
    ["alt", "DiVine Space profile customization"],
    ["p", "abc123...", "", "1"],
    ["p", "def456...", "", "2"],
    ["p", "ghi789...", "", "3"],
    ["music", "https://wavlake.com/track/...", "Bohemian Rhapsody", "Queen"],
    ["autoplay", "true"],
    ["theme", "scene"],
    ["mood", "vibing", "😎"],
    ["status", "Creating chaos in the metaverse"],
    ["quote", "I'm not like other profiles"]
  ],
  "id": "...",
  "sig": "..."
}
```

### Client Behavior

1. Clients should query for kind 16793 events by author to get profile customizations
2. Only the most recent event per pubkey should be used (replaceable event)
3. Custom CSS should be sanitized to prevent XSS attacks
4. Audio autoplay should respect user preferences and browser policies
5. Top 8 friends should be displayed in order (1-8)
