import { describe, it, expect } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  parseTop8FromKind30000,
  parseTop8FromKind16793,
  top8ToKind30000Tags,
  type TopFriend,
} from './parseTop8';

// Helper to create a mock NostrEvent
function createMockEvent(kind: number, tags: string[][]): NostrEvent {
  return {
    id: 'test-event-id',
    pubkey: 'test-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content: '',
    sig: 'test-sig',
  };
}

describe('parseTop8FromKind30000', () => {
  it('should return empty array when event is undefined', () => {
    const result = parseTop8FromKind30000(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array when event kind is not 30000', () => {
    const event = createMockEvent(16793, [
      ['d', 'top8'],
      ['p', 'pubkey1'],
    ]);
    const result = parseTop8FromKind30000(event);
    expect(result).toEqual([]);
  });

  it('should parse p tags from Kind 30000 event', () => {
    const event = createMockEvent(30000, [
      ['d', 'top8'],
      ['title', 'Top 8 Friends'],
      ['p', 'pubkey1', 'wss://relay.example.com', 'Alice'],
      ['p', 'pubkey2', '', 'Bob'],
      ['p', 'pubkey3'],
    ]);

    const result = parseTop8FromKind30000(event);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      pubkey: 'pubkey1',
      relay: 'wss://relay.example.com',
      petname: 'Alice',
      position: 1,
    });
    expect(result[1]).toEqual({
      pubkey: 'pubkey2',
      relay: undefined,
      petname: 'Bob',
      position: 2,
    });
    expect(result[2]).toEqual({
      pubkey: 'pubkey3',
      relay: undefined,
      petname: undefined,
      position: 3,
    });
  });

  it('should limit to first 8 friends', () => {
    const tags: string[][] = [
      ['d', 'top8'],
      ...Array.from({ length: 10 }, (_, i) => ['p', `pubkey${i + 1}`]),
    ];
    const event = createMockEvent(30000, tags);

    const result = parseTop8FromKind30000(event);

    expect(result).toHaveLength(8);
    expect(result[7].pubkey).toBe('pubkey8');
  });

  it('should assign positions based on tag order (1-indexed)', () => {
    const event = createMockEvent(30000, [
      ['d', 'top8'],
      ['p', 'first'],
      ['p', 'second'],
      ['p', 'third'],
    ]);

    const result = parseTop8FromKind30000(event);

    expect(result[0].position).toBe(1);
    expect(result[1].position).toBe(2);
    expect(result[2].position).toBe(3);
  });

  it('should handle empty relay and petname gracefully', () => {
    const event = createMockEvent(30000, [
      ['d', 'top8'],
      ['p', 'pubkey1', '', ''],
    ]);

    const result = parseTop8FromKind30000(event);

    expect(result[0]).toEqual({
      pubkey: 'pubkey1',
      relay: undefined,
      petname: undefined,
      position: 1,
    });
  });

  it('should ignore non-p tags', () => {
    const event = createMockEvent(30000, [
      ['d', 'top8'],
      ['title', 'My Top 8'],
      ['p', 'pubkey1'],
      ['e', 'some-event-id'],
      ['p', 'pubkey2'],
      ['description', 'My favorite people'],
    ]);

    const result = parseTop8FromKind30000(event);

    expect(result).toHaveLength(2);
    expect(result[0].pubkey).toBe('pubkey1');
    expect(result[1].pubkey).toBe('pubkey2');
  });
});

describe('parseTop8FromKind16793', () => {
  it('should return empty array when event is undefined', () => {
    const result = parseTop8FromKind16793(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array when event kind is not 16793', () => {
    const event = createMockEvent(30000, [
      ['p', 'pubkey1', '', '1'],
    ]);
    const result = parseTop8FromKind16793(event);
    expect(result).toEqual([]);
  });

  it('should parse legacy format with position in 4th element', () => {
    const event = createMockEvent(16793, [
      ['alt', 'DiVine Space profile customization'],
      ['p', 'pubkey1', '', '1'],
      ['p', 'pubkey2', '', '2'],
      ['p', 'pubkey3', '', '3'],
    ]);

    const result = parseTop8FromKind16793(event);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      pubkey: 'pubkey1',
      position: 1,
      petname: undefined,
    });
    expect(result[1]).toEqual({
      pubkey: 'pubkey2',
      position: 2,
      petname: undefined,
    });
    expect(result[2]).toEqual({
      pubkey: 'pubkey3',
      position: 3,
      petname: undefined,
    });
  });

  it('should sort friends by position', () => {
    const event = createMockEvent(16793, [
      ['p', 'pubkey3', '', '3'],
      ['p', 'pubkey1', '', '1'],
      ['p', 'pubkey2', '', '2'],
    ]);

    const result = parseTop8FromKind16793(event);

    expect(result[0].pubkey).toBe('pubkey1');
    expect(result[1].pubkey).toBe('pubkey2');
    expect(result[2].pubkey).toBe('pubkey3');
  });

  it('should filter out invalid positions (< 1 or > 8)', () => {
    const event = createMockEvent(16793, [
      ['p', 'pubkey0', '', '0'],
      ['p', 'pubkey1', '', '1'],
      ['p', 'pubkey9', '', '9'],
      ['p', 'pubkey5', '', '5'],
      ['p', 'pubkeyNaN', '', 'not-a-number'],
    ]);

    const result = parseTop8FromKind16793(event);

    expect(result).toHaveLength(2);
    expect(result[0].pubkey).toBe('pubkey1');
    expect(result[1].pubkey).toBe('pubkey5');
  });

  it('should handle p tags without position', () => {
    const event = createMockEvent(16793, [
      ['p', 'pubkey1', '', '1'],
      ['p', 'pubkey-no-position'],
      ['p', 'pubkey2', '', '2'],
    ]);

    const result = parseTop8FromKind16793(event);

    // pubkey-no-position should be filtered out (position is NaN -> 0 -> filtered)
    expect(result).toHaveLength(2);
  });
});

describe('top8ToKind30000Tags', () => {
  it('should create proper tag structure with d-tag and title', () => {
    const friends: TopFriend[] = [];
    const tags = top8ToKind30000Tags(friends);

    expect(tags).toContainEqual(['d', 'top8']);
    expect(tags).toContainEqual(['title', 'Top 8 Friends']);
  });

  it('should convert friends to p tags with proper format', () => {
    const friends: TopFriend[] = [
      { pubkey: 'pubkey1', relay: 'wss://relay.example.com', petname: 'Alice', position: 1 },
      { pubkey: 'pubkey2', position: 2 },
    ];

    const tags = top8ToKind30000Tags(friends);

    expect(tags).toContainEqual(['p', 'pubkey1', 'wss://relay.example.com', 'Alice']);
    expect(tags).toContainEqual(['p', 'pubkey2', '', '']);
  });

  it('should limit output to 8 friends', () => {
    const friends: TopFriend[] = Array.from({ length: 10 }, (_, i) => ({
      pubkey: `pubkey${i + 1}`,
      position: i + 1,
    }));

    const tags = top8ToKind30000Tags(friends);
    const pTags = tags.filter(([name]) => name === 'p');

    expect(pTags).toHaveLength(8);
  });

  it('should handle undefined relay and petname', () => {
    const friends: TopFriend[] = [
      { pubkey: 'pubkey1', position: 1 },
    ];

    const tags = top8ToKind30000Tags(friends);

    expect(tags).toContainEqual(['p', 'pubkey1', '', '']);
  });

  it('should preserve order of friends', () => {
    const friends: TopFriend[] = [
      { pubkey: 'first', position: 1 },
      { pubkey: 'second', position: 2 },
      { pubkey: 'third', position: 3 },
    ];

    const tags = top8ToKind30000Tags(friends);
    const pTags = tags.filter(([name]) => name === 'p');

    expect(pTags[0][1]).toBe('first');
    expect(pTags[1][1]).toBe('second');
    expect(pTags[2][1]).toBe('third');
  });
});

describe('TopFriend interface', () => {
  it('should allow optional relay and petname fields', () => {
    const minimalFriend: TopFriend = {
      pubkey: 'pubkey1',
      position: 1,
    };

    const fullFriend: TopFriend = {
      pubkey: 'pubkey2',
      relay: 'wss://relay.example.com',
      petname: 'Best Friend',
      position: 2,
    };

    expect(minimalFriend.pubkey).toBeDefined();
    expect(minimalFriend.relay).toBeUndefined();
    expect(fullFriend.petname).toBe('Best Friend');
  });
});
