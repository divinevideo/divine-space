import { describe, it, expect } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';
import { latestEvent, nextCreatedAt } from './replaceableEvent';

function ev(id: string, created_at: number): NostrEvent {
  return { id, pubkey: 'd4'.repeat(32), created_at, kind: 10003, tags: [], content: '', sig: '' };
}

describe('latestEvent', () => {
  it('returns undefined for no events', () => {
    expect(latestEvent([])).toBeUndefined();
  });

  it('picks the highest created_at regardless of arrival order', () => {
    // Relays answer in whatever order they respond, so the newest copy is not
    // necessarily the first one in the array.
    expect(latestEvent([ev('a', 10), ev('b', 30), ev('c', 20)])?.id).toBe('b');
  });

  it('breaks a created_at tie on the lowest id, per NIP-01', () => {
    expect(latestEvent([ev('ff', 10), ev('aa', 10)])?.id).toBe('aa');
  });
});

describe('nextCreatedAt', () => {
  it('uses the current second when there is no base version', () => {
    expect(nextCreatedAt(undefined, 1_700_000_000_000)).toBe(1_700_000_000);
  });

  it('uses the current second when the base version is older', () => {
    expect(nextCreatedAt(1_699_999_000, 1_700_000_000_000)).toBe(1_700_000_000);
  });

  it('steps past a base version written in the same second', () => {
    // The collision this exists for: two toggles inside one second would
    // otherwise share a created_at, and relays do not resolve that tie
    // consistently.
    expect(nextCreatedAt(1_700_000_000, 1_700_000_000_000)).toBe(1_700_000_001);
  });

  it('steps past a base version whose clock ran ahead of ours', () => {
    // Another device may have published with a clock skewed into the future;
    // matching its timestamp would leave the write unable to supersede it.
    expect(nextCreatedAt(1_700_000_900, 1_700_000_000_000)).toBe(1_700_000_901);
  });
});
