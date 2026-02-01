import { describe, it, expect } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  parseLinksFromKind30003,
  parseLinksFromKind16793,
  linksToKind30003Tags,
  type ProfileLink,
} from './parseLinks';

// Helper to create a mock event
function createMockEvent(kind: number, tags: string[][]): NostrEvent {
  return {
    id: 'mock-id',
    pubkey: 'mock-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content: '',
    sig: 'mock-sig',
  };
}

describe('parseLinksFromKind30003', () => {
  it('should return empty array for undefined event', () => {
    const result = parseLinksFromKind30003(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for wrong kind', () => {
    const event = createMockEvent(30000, [['r', 'https://example.com', 'Example']]);
    const result = parseLinksFromKind30003(event);
    expect(result).toEqual([]);
  });

  it('should parse r tags with URL and label (Nostree compatible)', () => {
    const event = createMockEvent(30003, [
      ['d', 'links'],
      ['title', 'My Links'],
      ['r', 'https://github.com/alice', 'GitHub'],
      ['r', 'https://twitter.com/alice', 'Twitter'],
      ['r', 'https://youtube.com/@alice', 'YouTube'],
    ]);

    const result = parseLinksFromKind30003(event);

    expect(result).toEqual([
      { url: 'https://github.com/alice', label: 'GitHub' },
      { url: 'https://twitter.com/alice', label: 'Twitter' },
      { url: 'https://youtube.com/@alice', label: 'YouTube' },
    ]);
  });

  it('should handle r tags without label', () => {
    const event = createMockEvent(30003, [
      ['d', 'links'],
      ['r', 'https://example.com'],
    ]);

    const result = parseLinksFromKind30003(event);

    expect(result).toEqual([
      { url: 'https://example.com', label: '' },
    ]);
  });

  it('should preserve link order from tags', () => {
    const event = createMockEvent(30003, [
      ['d', 'links'],
      ['r', 'https://first.com', 'First'],
      ['r', 'https://second.com', 'Second'],
      ['r', 'https://third.com', 'Third'],
    ]);

    const result = parseLinksFromKind30003(event);

    expect(result[0].url).toBe('https://first.com');
    expect(result[1].url).toBe('https://second.com');
    expect(result[2].url).toBe('https://third.com');
  });

  it('should filter out invalid r tags (missing URL)', () => {
    const event = createMockEvent(30003, [
      ['d', 'links'],
      ['r'], // Invalid - no URL
      ['r', 'https://valid.com', 'Valid'],
      ['r', ''], // Invalid - empty URL
    ]);

    const result = parseLinksFromKind30003(event);

    expect(result).toEqual([
      { url: 'https://valid.com', label: 'Valid' },
    ]);
  });

  it('should ignore non-r tags', () => {
    const event = createMockEvent(30003, [
      ['d', 'links'],
      ['title', 'My Links'],
      ['description', 'Social media and projects'],
      ['image', 'https://example.com/banner.jpg'],
      ['t', 'social'],
      ['r', 'https://github.com/alice', 'GitHub'],
      ['p', 'somepubkey'],
    ]);

    const result = parseLinksFromKind30003(event);

    expect(result).toEqual([
      { url: 'https://github.com/alice', label: 'GitHub' },
    ]);
  });

  it('should extract metadata from event', () => {
    const event = createMockEvent(30003, [
      ['d', 'links'],
      ['title', 'My Social Links'],
      ['description', 'All my profiles'],
      ['image', 'https://example.com/banner.jpg'],
      ['r', 'https://github.com/alice', 'GitHub'],
    ]);

    // This tests that parsing works with metadata tags present
    const result = parseLinksFromKind30003(event);
    expect(result.length).toBe(1);
  });
});

describe('parseLinksFromKind16793', () => {
  it('should return empty array for undefined event', () => {
    const result = parseLinksFromKind16793(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for wrong kind', () => {
    const event = createMockEvent(30003, [['link', 'https://example.com', 'Example']]);
    const result = parseLinksFromKind16793(event);
    expect(result).toEqual([]);
  });

  it('should parse legacy link tags', () => {
    // Legacy format might use 'link' or 'r' tags
    const event = createMockEvent(16793, [
      ['link', 'https://github.com/alice', 'GitHub'],
      ['link', 'https://twitter.com/alice', 'Twitter'],
    ]);

    const result = parseLinksFromKind16793(event);

    expect(result).toEqual([
      { url: 'https://github.com/alice', label: 'GitHub' },
      { url: 'https://twitter.com/alice', label: 'Twitter' },
    ]);
  });

  it('should handle r tags in legacy events too', () => {
    const event = createMockEvent(16793, [
      ['r', 'https://example.com', 'Example Site'],
    ]);

    const result = parseLinksFromKind16793(event);

    expect(result).toEqual([
      { url: 'https://example.com', label: 'Example Site' },
    ]);
  });
});

describe('linksToKind30003Tags', () => {
  it('should create proper tags for Kind 30003 event', () => {
    const links: ProfileLink[] = [
      { url: 'https://github.com/alice', label: 'GitHub' },
      { url: 'https://twitter.com/alice', label: 'Twitter' },
    ];

    const tags = linksToKind30003Tags(links);

    expect(tags).toContainEqual(['d', 'links']);
    expect(tags).toContainEqual(['title', 'My Links']);
    expect(tags).toContainEqual(['r', 'https://github.com/alice', 'GitHub']);
    expect(tags).toContainEqual(['r', 'https://twitter.com/alice', 'Twitter']);
  });

  it('should handle empty links array', () => {
    const tags = linksToKind30003Tags([]);

    expect(tags).toContainEqual(['d', 'links']);
    expect(tags).toContainEqual(['title', 'My Links']);
    // Should only have d and title tags
    expect(tags.filter(t => t[0] === 'r')).toEqual([]);
  });

  it('should accept custom title', () => {
    const links: ProfileLink[] = [
      { url: 'https://example.com', label: 'Example' },
    ];

    const tags = linksToKind30003Tags(links, 'Social Links');

    expect(tags).toContainEqual(['title', 'Social Links']);
  });

  it('should accept custom d-tag identifier', () => {
    const links: ProfileLink[] = [
      { url: 'https://example.com', label: 'Example' },
    ];

    const tags = linksToKind30003Tags(links, 'My Links', 'social-links');

    expect(tags).toContainEqual(['d', 'social-links']);
  });

  it('should handle links without labels', () => {
    const links: ProfileLink[] = [
      { url: 'https://example.com', label: '' },
    ];

    const tags = linksToKind30003Tags(links);

    expect(tags).toContainEqual(['r', 'https://example.com', '']);
  });

  it('should produce Nostree-compatible format', () => {
    // Nostree expects: ['r', '<url>', '<label>']
    const links: ProfileLink[] = [
      { url: 'https://nostree.me/@alice', label: 'Nostree' },
    ];

    const tags = linksToKind30003Tags(links);
    const rTag = tags.find(t => t[0] === 'r');

    expect(rTag).toBeDefined();
    expect(rTag).toEqual(['r', 'https://nostree.me/@alice', 'Nostree']);
    expect(rTag!.length).toBe(3); // Exactly 3 elements for Nostree compatibility
  });
});

describe('round-trip parsing', () => {
  it('should preserve links through create -> parse cycle', () => {
    const originalLinks: ProfileLink[] = [
      { url: 'https://github.com/alice', label: 'GitHub' },
      { url: 'https://twitter.com/alice', label: 'Twitter' },
      { url: 'https://youtube.com/@alice', label: 'YouTube' },
    ];

    const tags = linksToKind30003Tags(originalLinks);
    const event = createMockEvent(30003, tags);
    const parsedLinks = parseLinksFromKind30003(event);

    expect(parsedLinks).toEqual(originalLinks);
  });

  it('should handle special characters in URLs and labels', () => {
    const originalLinks: ProfileLink[] = [
      { url: 'https://example.com/path?query=value&foo=bar', label: 'Example & More' },
      { url: 'https://example.com/path#section', label: 'With # Hash' },
    ];

    const tags = linksToKind30003Tags(originalLinks);
    const event = createMockEvent(30003, tags);
    const parsedLinks = parseLinksFromKind30003(event);

    expect(parsedLinks).toEqual(originalLinks);
  });
});
