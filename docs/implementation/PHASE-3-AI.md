# Implementation: Phase 3 - AI Theme Generator

> **Goal**: Enable natural language theme customization, inspired by AI site builders.

## Overview

Users can describe their desired theme in plain English:
- "Make it Y2K with butterflies and pink gradients"
- "Add more sparkles and glitter"
- "Make it look like 2006 MySpace"

The AI generates CSS customizations that layer on base themes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Input                                │
│  "Make it more emo with black and pink"                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Provider                                │
│  - Claude, GPT-4, or local model                            │
│  - System prompt with theme schema                          │
│  - Few-shot examples                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Generated Output                           │
│  {                                                           │
│    colors: { primary: '#ff69b4', secondary: '#000' },       │
│    effects: ['sparkles', 'glitter'],                        │
│    css: '.profile-name { text-shadow: ... }'                │
│  }                                                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Validation & Sanitization                  │
│  - Validate CSS                                              │
│  - Sanitize for XSS                                         │
│  - Apply to preview                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Site Event Update                          │
│  - Store in Kind 30512 content                              │
│  - Or publish as custom theme (Kind 30514)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Task 3.1: Design AI Theme Architecture

### Customization Schema

```typescript
// src/types/theme-customization.ts
export interface ThemeCustomization {
  // Colors
  colors?: {
    primary?: string;      // Main accent color
    secondary?: string;    // Secondary accent
    background?: string;   // Page background
    card?: string;         // Widget background
    text?: string;         // Main text color
    muted?: string;        // Secondary text
  };

  // Visual effects
  effects?: ThemeEffect[];

  // Typography
  font?: {
    heading?: string;
    body?: string;
  };

  // Background
  background?: {
    type: 'solid' | 'gradient' | 'image' | 'pattern';
    value: string;
  };

  // Custom CSS (sanitized)
  css?: string;

  // Borders & shadows
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  shadows?: 'none' | 'subtle' | 'medium' | 'heavy' | 'glow';
}

export type ThemeEffect =
  | 'sparkles'
  | 'glitter'
  | 'stars'
  | 'cursor-trail'
  | 'neon-glow'
  | 'scanlines'
  | 'noise'
  | 'rainbow-border';
```

### System Prompt

```typescript
const THEME_SYSTEM_PROMPT = `You are a theme customization assistant for Divine Space, a MySpace-inspired profile builder.

When users describe their desired aesthetic, generate a JSON customization object.

## Available Properties

### Colors (hex codes)
- primary: Main accent color
- secondary: Secondary accent
- background: Page background
- card: Widget/card background
- text: Main text color
- muted: Secondary text color

### Effects (array of strings)
Available: sparkles, glitter, stars, cursor-trail, neon-glow, scanlines, noise, rainbow-border

### Background
- type: solid, gradient, image, pattern
- value: color, gradient CSS, or URL

### Border Radius
Options: none, small, medium, large, full

### Shadows
Options: none, subtle, medium, heavy, glow

### Custom CSS
Valid CSS for advanced customizations. Keep it minimal.

## Example Output

User: "Make it Y2K with butterflies"
{
  "colors": {
    "primary": "#ff69b4",
    "secondary": "#87ceeb",
    "background": "#ffe4f0"
  },
  "effects": ["sparkles", "glitter"],
  "background": {
    "type": "pattern",
    "value": "butterflies"
  },
  "borderRadius": "full",
  "shadows": "glow"
}

User: "Emo scene kid aesthetic"
{
  "colors": {
    "primary": "#ff1493",
    "secondary": "#000000",
    "background": "#1a1a1a",
    "text": "#ffffff"
  },
  "effects": ["stars", "neon-glow"],
  "font": {
    "heading": "Impact"
  },
  "borderRadius": "none",
  "shadows": "heavy"
}

Respond ONLY with valid JSON. No explanation needed.`;
```

---

## Task 3.2: Integrate AI Provider

### Using Existing AI Chat Hook

```typescript
// src/hooks/useThemeAI.ts
import { useShakespeare } from '@/hooks/useShakespeare';
import { validateThemeCustomization, sanitizeCSS } from '@/lib/themeValidation';

export function useThemeAI() {
  const { mutateAsync: chat, isPending } = useShakespeare();

  const generateCustomization = async (
    prompt: string,
    currentTheme?: ThemeCustomization
  ): Promise<ThemeCustomization> => {
    const messages = [
      { role: 'system' as const, content: THEME_SYSTEM_PROMPT },
      ...(currentTheme ? [{
        role: 'assistant' as const,
        content: `Current customization: ${JSON.stringify(currentTheme)}`,
      }] : []),
      { role: 'user' as const, content: prompt },
    ];

    const response = await chat({ messages });

    // Parse JSON from response
    const json = extractJSON(response.content);
    const customization = JSON.parse(json);

    // Validate and sanitize
    const validated = validateThemeCustomization(customization);
    if (validated.css) {
      validated.css = sanitizeCSS(validated.css);
    }

    return validated;
  };

  return {
    generateCustomization,
    isGenerating: isPending,
  };
}
```

### Multi-Provider Support

```typescript
// src/lib/aiProviders.ts
export interface AIProvider {
  name: string;
  chat: (messages: Message[]) => Promise<string>;
}

export const providers: Record<string, AIProvider> = {
  builtin: {
    name: 'Built-in AI',
    chat: async (messages) => {
      // Use built-in AI chat API
    },
  },
  openrouter: {
    name: 'OpenRouter',
    chat: async (messages) => {
      // Use OpenRouter API with Claude/GPT-4
    },
  },
  local: {
    name: 'Local (Ollama)',
    chat: async (messages) => {
      // Use local Ollama instance
    },
  },
};
```

---

## Task 3.3: Create Theme Customization UI

### Component

```typescript
// src/components/ThemeCustomizer.tsx
import { useState, useCallback } from 'react';
import { useThemeAI } from '@/hooks/useThemeAI';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { ThemePreview } from './ThemePreview';

export function ThemeCustomizer() {
  const [prompt, setPrompt] = useState('');
  const [customization, setCustomization] = useState<ThemeCustomization | null>(null);
  const [history, setHistory] = useState<ThemeCustomization[]>([]);

  const { generateCustomization, isGenerating } = useThemeAI();
  const { updateSite } = useSiteConfig(currentUser.pubkey);

  const handleGenerate = useCallback(async () => {
    const result = await generateCustomization(prompt, customization);
    setHistory(prev => [...prev, customization].filter(Boolean) as ThemeCustomization[]);
    setCustomization(result);
    setPrompt('');
  }, [prompt, customization, generateCustomization]);

  const handleUndo = () => {
    if (history.length > 0) {
      setCustomization(history[history.length - 1]);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (customization) {
      await updateSite({ customization });
    }
  };

  return (
    <div className="theme-customizer">
      <div className="customizer-input">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your theme... (e.g., 'Make it more Y2K with pink and butterflies')"
        />
        <div className="customizer-actions">
          <Button onClick={handleGenerate} disabled={isGenerating || !prompt}>
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
          <Button variant="outline" onClick={handleUndo} disabled={history.length === 0}>
            Undo
          </Button>
        </div>
      </div>

      <div className="customizer-preview">
        <ThemePreview customization={customization} />
      </div>

      <div className="customizer-save">
        <Button onClick={handleSave} disabled={!customization}>
          Save Theme
        </Button>
      </div>

      <PresetPrompts onSelect={setPrompt} />
    </div>
  );
}
```

### Preset Prompts Component

```typescript
// src/components/PresetPrompts.tsx
const PRESET_PROMPTS = [
  { label: 'Y2K Princess', prompt: 'Make it Y2K with butterflies, pink gradients, and sparkles' },
  { label: 'Scene Kid', prompt: 'Emo scene kid aesthetic with black, pink, and neon accents' },
  { label: 'Gothic', prompt: 'Dark romantic gothic with deep purple, velvet textures' },
  { label: 'Kawaii', prompt: 'Cute kawaii style with pastels, stars, and rounded corners' },
  { label: 'Cyberpunk', prompt: 'Neon cyberpunk with cyan, magenta, and glowing effects' },
  { label: 'Retro 90s', prompt: 'Retro 90s aesthetic with bold colors and geometric patterns' },
  { label: 'More Sparkles', prompt: 'Add more sparkles and glitter effects everywhere' },
  { label: 'Make it Darker', prompt: 'Make the theme darker and more moody' },
  { label: 'More Neon', prompt: 'Add more neon glow effects to everything' },
];

export function PresetPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="preset-prompts">
      <h4>Quick Styles</h4>
      <div className="preset-grid">
        {PRESET_PROMPTS.map(({ label, prompt }) => (
          <Button
            key={label}
            variant="ghost"
            size="sm"
            onClick={() => onSelect(prompt)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 3.4: CSS Generation & Validation

### CSS Generation

```typescript
// src/lib/generateCSS.ts
export function customizationToCSS(customization: ThemeCustomization): string {
  const rules: string[] = [];

  // Colors
  if (customization.colors) {
    rules.push(`:root {`);
    if (customization.colors.primary) {
      rules.push(`  --primary: ${customization.colors.primary};`);
    }
    if (customization.colors.secondary) {
      rules.push(`  --secondary: ${customization.colors.secondary};`);
    }
    if (customization.colors.background) {
      rules.push(`  --background: ${customization.colors.background};`);
    }
    if (customization.colors.card) {
      rules.push(`  --card: ${customization.colors.card};`);
    }
    if (customization.colors.text) {
      rules.push(`  --foreground: ${customization.colors.text};`);
    }
    rules.push(`}`);
  }

  // Border radius
  if (customization.borderRadius) {
    const radiusMap = {
      none: '0',
      small: '0.25rem',
      medium: '0.5rem',
      large: '1rem',
      full: '9999px',
    };
    rules.push(`:root { --radius: ${radiusMap[customization.borderRadius]}; }`);
  }

  // Shadows
  if (customization.shadows === 'glow') {
    rules.push(`.widget { box-shadow: 0 0 20px var(--primary); }`);
  }

  // Custom CSS (already sanitized)
  if (customization.css) {
    rules.push(customization.css);
  }

  return rules.join('\n');
}
```

### CSS Sanitization

```typescript
// src/lib/sanitizeCSS.ts
import DOMPurify from 'dompurify';

const ALLOWED_PROPERTIES = new Set([
  'color', 'background', 'background-color', 'background-image', 'background-gradient',
  'border', 'border-radius', 'border-color',
  'box-shadow', 'text-shadow',
  'font-family', 'font-size', 'font-weight',
  'margin', 'padding',
  'animation', 'transition',
  'opacity', 'transform',
]);

const FORBIDDEN_VALUES = [
  'javascript:', 'expression(', 'url(data:', 'url(javascript:',
];

export function sanitizeCSS(css: string): string {
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Check for forbidden values
  for (const forbidden of FORBIDDEN_VALUES) {
    if (css.toLowerCase().includes(forbidden)) {
      throw new Error(`Forbidden CSS value: ${forbidden}`);
    }
  }

  // Parse and validate each rule
  // ... more validation logic

  return css;
}
```

---

## Task 3.5: Save Custom Themes

### Save to Site Event

```typescript
// Store customization in Kind 30512 content
const siteContent = JSON.stringify({
  layout: existingLayout,
  customization: newCustomization,
});

await publish({
  kind: 30512,
  tags: [/* ... */],
  content: siteContent,
});
```

### Publish as Shareable Theme

```typescript
// Optionally publish as Kind 30514 for others to use
async function publishAsTheme(
  customization: ThemeCustomization,
  metadata: { name: string; description: string }
) {
  // Generate CSS from customization
  const css = customizationToCSS(customization);

  // Upload CSS to Blossom
  const { hash, url } = await uploadToBlossom(
    new File([css], 'custom.css', { type: 'text/css' })
  );

  // Publish package
  const packageEvent = await publish({
    kind: 1036,
    tags: [
      ['title', metadata.name],
      ['x', hash],
      ['f', hash, 'custom.css', url],
    ],
  });

  // Publish theme
  await publish({
    kind: 30514,
    tags: [
      ['d', `custom-${Date.now()}`],
      ['title', metadata.name],
      ['summary', metadata.description],
      ['e', packageEvent.id],
      ['t', 'ai-generated'],
    ],
  });
}
```

---

## Testing Strategy

### Unit Tests
- CSS generation from customization
- CSS sanitization
- JSON parsing from AI response

### Integration Tests
- AI generation flow
- Preview rendering
- Save/load cycle

### Manual Tests
- Various prompt types
- Edge cases (empty, nonsense)
- Performance with large CSS

---

## Acceptance Criteria

- [ ] Users can describe themes in natural language
- [ ] AI generates valid customizations
- [ ] Preview updates in real-time
- [ ] CSS is properly sanitized
- [ ] Customizations persist to Nostr
- [ ] Undo/redo works
- [ ] Preset prompts available
- [ ] All tests pass
