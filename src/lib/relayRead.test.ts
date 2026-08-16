import { describe, it, expect } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';
import { queryStrict, RelayReadError, type ReqCapable } from './relayRead';

function ev(id: string, created_at = 1): NostrEvent {
  return { id, pubkey: 'd4'.repeat(32), created_at, kind: 10003, tags: [], content: '', sig: '' };
}

/** A relay whose stream yields exactly the given messages, then ends. */
function fakeRelay(msgs: Array<[string, ...unknown[]]>): ReqCapable {
  return {
    async *req() {
      for (const m of msgs) yield m;
    },
  } as ReqCapable;
}

const opts = () => ({ signal: new AbortController().signal, timeoutMs: 1000 });

describe('queryStrict', () => {
  it('returns events once the relay signals EOSE', async () => {
    const relay = fakeRelay([
      ['EVENT', 'sub', ev('a')],
      ['EVENT', 'sub', ev('b')],
      ['EOSE', 'sub'],
    ]);
    await expect(queryStrict(relay, [{ ids: ['a'] }], opts())).resolves.toHaveLength(2);
  });

  it('returns an empty result for a genuinely empty relay (EOSE, no events)', async () => {
    // The distinction this module exists for: an answered read that found
    // nothing is a real "no bookmarks", and callers may safely create the list.
    const relay = fakeRelay([['EOSE', 'sub']]);
    await expect(queryStrict(relay, [{ ids: ['a'] }], opts())).resolves.toEqual([]);
  });

  it('throws when the relay CLOSES the subscription', async () => {
    // Funnelcake sends CLOSED with "could not complete query" when its query
    // layer degrades. NPool.query would swallow this and return [], which is
    // indistinguishable from an empty account. Assert the message, not just the
    // type, or turning this throw into a break still passes via the EOSE check.
    const relay = fakeRelay([['CLOSED', 'sub', 'error: could not complete query']]);
    await expect(queryStrict(relay, [{ ids: ['a'] }], opts())).rejects.toThrow(/closed the subscription/i);
  });

  it('rejects rather than resolving when the read times out', async () => {
    // The live failure path. A relay that stops responding (or closes, which
    // NRelay1 swallows) hangs until our timeout aborts the iterator, and the
    // abort must surface as a rejection. If it ever resolved instead, an empty
    // result would be treated as an empty bookmark list.
    const hanging: ReqCapable = {
      async *req(_filters, opts) {
        await new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () =>
            reject(new DOMException('The signal has been aborted', 'AbortError')));
        });
        yield ['EOSE', 'sub'] as [string, ...unknown[]]; // unreachable
      },
    } as ReqCapable;

    await expect(
      queryStrict(hanging, [{ ids: ['a'] }], { signal: new AbortController().signal, timeoutMs: 50 }),
    ).rejects.toThrow();
  });

  it('throws when the stream ends without EOSE', async () => {
    // NPool.req returns immediately when no relay is routed to, and an aborted
    // read simply stops. Neither established what the relay holds.
    const relay = fakeRelay([]);
    await expect(queryStrict(relay, [{ ids: ['a'] }], opts())).rejects.toBeInstanceOf(RelayReadError);
  });

  it('does not treat events received before a CLOSE as a complete read', async () => {
    const relay = fakeRelay([
      ['EVENT', 'sub', ev('a')],
      ['CLOSED', 'sub', 'error: stored replay timed out'],
    ]);
    await expect(queryStrict(relay, [{ ids: ['a'] }], opts())).rejects.toBeInstanceOf(RelayReadError);
  });
});
