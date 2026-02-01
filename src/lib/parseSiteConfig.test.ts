import { describe, it, expect } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  parseSiteConfig,
  siteConfigToTags,
  siteConfigToContent,
  parseThemeId,
  parseContentIncludes,
} from './parseSiteConfig';
import type { SiteConfig, SiteConfigInput } from '@/types/site';

// Helper to create a mock Kind 30512 event
function createSiteEvent(
  tags: string[][],
  content: string = '',
  pubkey: string = 'testpubkey123'
): NostrEvent {
  return {
    id: 'event123',
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 30512,
    tags,
    content,
    sig: 'sig123',
  };
}

describe('parseSiteConfig', () => {
  it('returns null for null event', () => {
    expect(parseSiteConfig(null)).toBeNull();
  });

  it('returns null for undefined event', () => {
    expect(parseSiteConfig(undefined)).toBeNull();
  });

  it('parses minimal site config with only d-tag', () => {
    const event = createSiteEvent([['d', 'profile']]);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.identifier).toBe('profile');
    expect(config!.widgets).toEqual([]);
    expect(config!.includes).toEqual([]);
  });

  it('parses site config with all basic metadata', () => {
    const event = createSiteEvent([
      ['d', 'profile'],
      ['r', 'https://divine.space/alice/'],
      ['name', "Alice's Space"],
      ['title', 'Welcome to my profile'],
      ['summary', 'Creative director & artist'],
      ['image', 'https://example.com/og.jpg'],
      ['icon', 'https://example.com/favicon.ico'],
    ]);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.url).toBe('https://divine.space/alice/');
    expect(config!.name).toBe("Alice's Space");
    expect(config!.title).toBe('Welcome to my profile');
    expect(config!.summary).toBe('Creative director & artist');
    expect(config!.image).toBe('https://example.com/og.jpg');
    expect(config!.icon).toBe('https://example.com/favicon.ico');
  });

  it('parses theme reference from x tag', () => {
    const event = createSiteEvent([
      ['d', 'profile'],
      ['x', '30514:divinepubkey123:divine-scene', 'abc123hash'],
    ]);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.themeId).toBe('30514:divinepubkey123:divine-scene');
    expect(config!.themePackageHash).toBe('abc123hash');
  });

  it('parses content includes for kinds', () => {
    const event = createSiteEvent([
      ['d', 'profile'],
      ['include', 'k', '34236'],
      ['include', 'k', '1'],
    ]);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.includes).toHaveLength(2);
    expect(config!.includes[0]).toEqual({ type: 'kind', value: '34236' });
    expect(config!.includes[1]).toEqual({ type: 'kind', value: '1' });
  });

  it('parses content includes for addresses', () => {
    const event = createSiteEvent([
      ['d', 'profile'],
      ['include', 'a', '30003:pubkey123:links'],
      ['include', 'a', '30000:pubkey123:top8'],
    ]);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.includes).toHaveLength(2);
    expect(config!.includes[0]).toEqual({ type: 'address', value: '30003:pubkey123:links' });
    expect(config!.includes[1]).toEqual({ type: 'address', value: '30000:pubkey123:top8' });
  });

  it('parses rendering engine from z tag', () => {
    const event = createSiteEvent([
      ['d', 'profile'],
      ['z', 'org.divine.bento'],
    ]);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.renderingEngine).toBe('org.divine.bento');
  });

  it('parses divine extensions from namespaced tags', () => {
    const event = createSiteEvent([
      ['d', 'profile'],
      ['divine:layout', 'bento'],
      ['divine:grid-cols', '4'],
    ]);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.layout).toBe('bento');
    expect(config!.gridCols).toBe(4);
  });

  it('parses widgets from JSON content', () => {
    const widgets = [
      { id: 'profile', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      { id: 'music', type: 'music', x: 2, y: 0, w: 2, h: 1 },
    ];
    const content = JSON.stringify({ widgets });
    const event = createSiteEvent([['d', 'profile']], content);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.widgets).toHaveLength(2);
    expect(config!.widgets[0].id).toBe('profile');
    expect(config!.widgets[0].type).toBe('profile');
    expect(config!.widgets[1].id).toBe('music');
  });

  it('parses theme customization from JSON content', () => {
    const content = JSON.stringify({
      widgets: [],
      theme: {
        colors: { primary: '#ff00ff', secondary: '#00ffff' },
        effects: ['sparkles', 'glitter'],
      },
      customCss: '.profile-name { color: #ff00ff; }',
    });
    const event = createSiteEvent([['d', 'profile']], content);
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.customization).toBeDefined();
    expect(config!.customization!.colors!.primary).toBe('#ff00ff');
    expect(config!.customization!.colors!.secondary).toBe('#00ffff');
    expect(config!.customization!.effects).toEqual(['sparkles', 'glitter']);
    expect(config!.customization!.customCss).toBe('.profile-name { color: #ff00ff; }');
  });

  it('handles invalid JSON content gracefully', () => {
    const event = createSiteEvent([['d', 'profile']], 'not valid json');
    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.widgets).toEqual([]);
    expect(config!.rawContent).toBe('not valid json');
  });

  it('parses complete site configuration', () => {
    const content = JSON.stringify({
      widgets: [
        { id: 'profile', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
        { id: 'top8', type: 'top8', x: 0, y: 2, w: 2, h: 2 },
      ],
      theme: {
        colors: { primary: '#ff00ff' },
        effects: ['sparkles'],
      },
    });

    const event = createSiteEvent(
      [
        ['d', 'profile'],
        ['r', 'https://divine.space/alice/'],
        ['name', "Alice's Space"],
        ['title', 'Welcome'],
        ['summary', 'Artist'],
        ['image', 'https://example.com/og.jpg'],
        ['x', '30514:divinepubkey:divine-bento', 'hash123'],
        ['include', 'k', '34236'],
        ['include', 'k', '1'],
        ['include', 'a', '30003:pubkey:links'],
        ['z', 'org.divine.bento'],
        ['divine:layout', 'bento'],
        ['divine:grid-cols', '4'],
      ],
      content
    );

    const config = parseSiteConfig(event);

    expect(config).not.toBeNull();
    expect(config!.identifier).toBe('profile');
    expect(config!.url).toBe('https://divine.space/alice/');
    expect(config!.name).toBe("Alice's Space");
    expect(config!.themeId).toBe('30514:divinepubkey:divine-bento');
    expect(config!.includes).toHaveLength(3);
    expect(config!.renderingEngine).toBe('org.divine.bento');
    expect(config!.layout).toBe('bento');
    expect(config!.gridCols).toBe(4);
    expect(config!.widgets).toHaveLength(2);
    expect(config!.customization!.colors!.primary).toBe('#ff00ff');
  });
});

describe('parseThemeId', () => {
  it('parses valid theme reference', () => {
    const tags = [['x', '30514:pubkey123:theme-name', 'packagehash']];
    const result = parseThemeId(tags);

    expect(result).toEqual({
      themeId: '30514:pubkey123:theme-name',
      packageHash: 'packagehash',
    });
  });

  it('returns undefined for missing x tag', () => {
    const tags = [['d', 'profile']];
    const result = parseThemeId(tags);

    expect(result).toBeUndefined();
  });

  it('handles x tag without package hash', () => {
    const tags = [['x', '30514:pubkey123:theme-name']];
    const result = parseThemeId(tags);

    expect(result).toEqual({
      themeId: '30514:pubkey123:theme-name',
      packageHash: undefined,
    });
  });
});

describe('parseContentIncludes', () => {
  it('parses kind includes', () => {
    const tags = [
      ['include', 'k', '1'],
      ['include', 'k', '30023'],
    ];
    const result = parseContentIncludes(tags);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'kind', value: '1' });
    expect(result[1]).toEqual({ type: 'kind', value: '30023' });
  });

  it('parses address includes', () => {
    const tags = [['include', 'a', '30000:pubkey:top8']];
    const result = parseContentIncludes(tags);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'address', value: '30000:pubkey:top8' });
  });

  it('handles unknown include types gracefully', () => {
    const tags = [
      ['include', 'k', '1'],
      ['include', 'unknown', 'value'],
    ];
    const result = parseContentIncludes(tags);

    // Should only return valid includes
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'kind', value: '1' });
  });

  it('returns empty array for no includes', () => {
    const tags = [['d', 'profile']];
    const result = parseContentIncludes(tags);

    expect(result).toEqual([]);
  });
});

describe('siteConfigToTags', () => {
  it('creates minimal tags with only required fields', () => {
    const input: SiteConfigInput = {};
    const pubkey = 'testpubkey123';
    const tags = siteConfigToTags(input, pubkey);

    expect(tags).toContainEqual(['d', 'profile']);
    expect(tags).toContainEqual(['alt', 'Divine Space site configuration']);
  });

  it('includes metadata tags when provided', () => {
    const input: SiteConfigInput = {
      name: "Alice's Space",
      title: 'Welcome',
      summary: 'Artist',
      image: 'https://example.com/og.jpg',
      icon: 'https://example.com/favicon.ico',
    };
    const tags = siteConfigToTags(input, 'testpubkey');

    expect(tags).toContainEqual(['name', "Alice's Space"]);
    expect(tags).toContainEqual(['title', 'Welcome']);
    expect(tags).toContainEqual(['summary', 'Artist']);
    expect(tags).toContainEqual(['image', 'https://example.com/og.jpg']);
    expect(tags).toContainEqual(['icon', 'https://example.com/favicon.ico']);
  });

  it('includes theme reference when provided', () => {
    const input: SiteConfigInput = {
      themeId: '30514:pubkey:divine-bento',
    };
    const tags = siteConfigToTags(input, 'testpubkey');

    expect(tags.some(t => t[0] === 'x' && t[1] === '30514:pubkey:divine-bento')).toBe(true);
  });

  it('includes content filters', () => {
    const input: SiteConfigInput = {
      includes: [
        { type: 'kind', value: '34236' },
        { type: 'kind', value: '1' },
        { type: 'address', value: '30003:pubkey:links' },
      ],
    };
    const tags = siteConfigToTags(input, 'testpubkey');

    expect(tags).toContainEqual(['include', 'k', '34236']);
    expect(tags).toContainEqual(['include', 'k', '1']);
    expect(tags).toContainEqual(['include', 'a', '30003:pubkey:links']);
  });

  it('includes divine extension tags', () => {
    const input: SiteConfigInput = {
      layout: 'bento',
      gridCols: 4,
    };
    const tags = siteConfigToTags(input, 'testpubkey');

    expect(tags).toContainEqual(['divine:layout', 'bento']);
    expect(tags).toContainEqual(['divine:grid-cols', '4']);
    expect(tags).toContainEqual(['z', 'org.divine.bento']);
  });

  it('generates site URL with pubkey', () => {
    const input: SiteConfigInput = {};
    const tags = siteConfigToTags(input, 'npub1test123');

    expect(tags.some(t => t[0] === 'r' && t[1].includes('npub1test123'))).toBe(true);
  });
});

describe('siteConfigToContent', () => {
  it('returns empty string for empty config', () => {
    const input: SiteConfigInput = {};
    const content = siteConfigToContent(input);

    expect(content).toBe('');
  });

  it('serializes widgets to JSON', () => {
    const input: SiteConfigInput = {
      widgets: [
        { id: 'profile', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      ],
    };
    const content = siteConfigToContent(input);
    const parsed = JSON.parse(content);

    expect(parsed.widgets).toHaveLength(1);
    expect(parsed.widgets[0].id).toBe('profile');
  });

  it('serializes customization to JSON', () => {
    const input: SiteConfigInput = {
      customization: {
        colors: { primary: '#ff00ff' },
        effects: ['sparkles'],
        customCss: '.test { color: red; }',
      },
    };
    const content = siteConfigToContent(input);
    const parsed = JSON.parse(content);

    expect(parsed.theme.colors.primary).toBe('#ff00ff');
    expect(parsed.theme.effects).toEqual(['sparkles']);
    expect(parsed.customCss).toBe('.test { color: red; }');
  });

  it('includes both widgets and customization', () => {
    const input: SiteConfigInput = {
      widgets: [{ id: 'test', type: 'profile', x: 0, y: 0, w: 1, h: 1 }],
      customization: {
        colors: { primary: '#000' },
      },
    };
    const content = siteConfigToContent(input);
    const parsed = JSON.parse(content);

    expect(parsed.widgets).toBeDefined();
    expect(parsed.theme).toBeDefined();
  });
});
