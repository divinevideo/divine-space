import { describe, it, expect } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  parseStatusFromKind30315,
  parseStatusFromKind16793,
  statusToKind30315Tags,
  isStatusExpired,
  type UserStatus,
  STATUS_KIND,
} from './parseStatus';

// Helper to create a mock NIP-38 status event
function createStatusEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'test-id',
    pubkey: 'test-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind: STATUS_KIND,
    tags: [['d', 'general']],
    content: 'Test status',
    sig: 'test-sig',
    ...overrides,
  };
}

describe('parseStatusFromKind30315', () => {
  it('should return null for undefined event', () => {
    const result = parseStatusFromKind30315(undefined);
    expect(result).toBeNull();
  });

  it('should return null for non-30315 event', () => {
    const event = createStatusEvent({ kind: 1 });
    const result = parseStatusFromKind30315(event);
    expect(result).toBeNull();
  });

  it('should parse general status with content', () => {
    const event = createStatusEvent({
      content: 'Working on code',
      tags: [['d', 'general']],
    });
    const result = parseStatusFromKind30315(event);

    expect(result).toEqual({
      type: 'general',
      content: 'Working on code',
      url: undefined,
      expiration: undefined,
      createdAt: event.created_at,
    });
  });

  it('should parse music status with Spotify reference', () => {
    const event = createStatusEvent({
      content: 'Toxic - Britney Spears',
      tags: [
        ['d', 'music'],
        ['r', 'spotify:track:abc123'],
        ['expiration', '1692845589'],
      ],
    });
    const result = parseStatusFromKind30315(event);

    expect(result).toEqual({
      type: 'music',
      content: 'Toxic - Britney Spears',
      url: 'spotify:track:abc123',
      expiration: 1692845589,
      createdAt: event.created_at,
    });
  });

  it('should parse profile_song status without expiration', () => {
    const event = createStatusEvent({
      content: 'Bohemian Rhapsody - Queen',
      tags: [
        ['d', 'profile_song'],
        ['r', 'https://wavlake.com/track/abc123'],
      ],
    });
    const result = parseStatusFromKind30315(event);

    expect(result).toEqual({
      type: 'profile_song',
      content: 'Bohemian Rhapsody - Queen',
      url: 'https://wavlake.com/track/abc123',
      expiration: undefined,
      createdAt: event.created_at,
    });
  });

  it('should handle empty content (clear status)', () => {
    const event = createStatusEvent({
      content: '',
      tags: [['d', 'general']],
    });
    const result = parseStatusFromKind30315(event);

    expect(result).toEqual({
      type: 'general',
      content: '',
      url: undefined,
      expiration: undefined,
      createdAt: event.created_at,
    });
  });

  it('should return null if d-tag is missing', () => {
    const event = createStatusEvent({
      content: 'Test',
      tags: [],
    });
    const result = parseStatusFromKind30315(event);
    expect(result).toBeNull();
  });

  it('should handle status with multiple r-tags (uses first)', () => {
    const event = createStatusEvent({
      content: 'Linked status',
      tags: [
        ['d', 'general'],
        ['r', 'https://example.com/first'],
        ['r', 'https://example.com/second'],
      ],
    });
    const result = parseStatusFromKind30315(event);

    expect(result?.url).toBe('https://example.com/first');
  });

  it('should parse custom status type', () => {
    const event = createStatusEvent({
      content: 'Streaming live!',
      tags: [
        ['d', 'streaming'],
        ['r', 'https://zap.stream/...'],
      ],
    });
    const result = parseStatusFromKind30315(event);

    expect(result?.type).toBe('streaming');
  });
});

describe('parseStatusFromKind16793', () => {
  it('should return null for undefined event', () => {
    const result = parseStatusFromKind16793(undefined);
    expect(result).toBeNull();
  });

  it('should parse legacy mood tag', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 16793,
      tags: [
        ['mood', 'Happy', '😊'],
      ],
      content: '',
      sig: 'test-sig',
    };
    const result = parseStatusFromKind16793(event);

    expect(result).toEqual({
      type: 'general',
      content: '😊 Happy',
      url: undefined,
      expiration: undefined,
      createdAt: event.created_at,
    });
  });

  it('should parse legacy mood without emoji', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 16793,
      tags: [
        ['mood', 'Focused'],
      ],
      content: '',
      sig: 'test-sig',
    };
    const result = parseStatusFromKind16793(event);

    expect(result).toEqual({
      type: 'general',
      content: 'Focused',
      url: undefined,
      expiration: undefined,
      createdAt: event.created_at,
    });
  });

  it('should parse legacy status tag', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 16793,
      tags: [
        ['status', 'Living my best life'],
      ],
      content: '',
      sig: 'test-sig',
    };
    const result = parseStatusFromKind16793(event);

    expect(result).toEqual({
      type: 'general',
      content: 'Living my best life',
      url: undefined,
      expiration: undefined,
      createdAt: event.created_at,
    });
  });

  it('should return null for Kind 16793 without mood or status', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 16793,
      tags: [
        ['p', 'some-pubkey', '', '1'],
      ],
      content: '',
      sig: 'test-sig',
    };
    const result = parseStatusFromKind16793(event);
    expect(result).toBeNull();
  });

  it('should prefer mood over status when both present', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 16793,
      tags: [
        ['mood', 'Excited', '🎉'],
        ['status', 'Some status'],
      ],
      content: '',
      sig: 'test-sig',
    };
    const result = parseStatusFromKind16793(event);

    expect(result?.content).toBe('🎉 Excited');
  });
});

describe('statusToKind30315Tags', () => {
  it('should create general status tags', () => {
    const status: UserStatus = {
      type: 'general',
      content: 'Working',
      createdAt: 0,
    };
    const tags = statusToKind30315Tags(status);

    expect(tags).toEqual([
      ['d', 'general'],
    ]);
  });

  it('should create music status tags with url and expiration', () => {
    const status: UserStatus = {
      type: 'music',
      content: 'Song Title - Artist',
      url: 'spotify:track:123',
      expiration: 1692845589,
      createdAt: 0,
    };
    const tags = statusToKind30315Tags(status);

    expect(tags).toEqual([
      ['d', 'music'],
      ['r', 'spotify:track:123'],
      ['expiration', '1692845589'],
    ]);
  });

  it('should create profile_song tags without expiration', () => {
    const status: UserStatus = {
      type: 'profile_song',
      content: 'My favorite song',
      url: 'https://wavlake.com/track/xyz',
      createdAt: 0,
    };
    const tags = statusToKind30315Tags(status);

    expect(tags).toEqual([
      ['d', 'profile_song'],
      ['r', 'https://wavlake.com/track/xyz'],
    ]);
  });

  it('should omit url tag if not provided', () => {
    const status: UserStatus = {
      type: 'general',
      content: 'Just vibing',
      createdAt: 0,
    };
    const tags = statusToKind30315Tags(status);

    expect(tags).toEqual([
      ['d', 'general'],
    ]);
    expect(tags.find(t => t[0] === 'r')).toBeUndefined();
  });
});

describe('isStatusExpired', () => {
  it('should return false for status without expiration', () => {
    const status: UserStatus = {
      type: 'general',
      content: 'Test',
      createdAt: 0,
    };
    expect(isStatusExpired(status)).toBe(false);
  });

  it('should return true for expired status', () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const status: UserStatus = {
      type: 'music',
      content: 'Old song',
      expiration: pastTime,
      createdAt: 0,
    };
    expect(isStatusExpired(status)).toBe(true);
  });

  it('should return false for future expiration', () => {
    const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const status: UserStatus = {
      type: 'music',
      content: 'Current song',
      expiration: futureTime,
      createdAt: 0,
    };
    expect(isStatusExpired(status)).toBe(false);
  });

  it('should return null for null status', () => {
    expect(isStatusExpired(null)).toBe(false);
  });
});
