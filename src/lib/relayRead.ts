import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

/** The slice of NPool that queryStrict needs, kept structural so it is testable. */
export interface ReqCapable {
  req(
    filters: NostrFilter[],
    opts?: { signal?: AbortSignal },
  ): AsyncIterable<[string, ...unknown[]]>;
}

/** A relay read that never established what the relay holds. */
export class RelayReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RelayReadError';
  }
}

/**
 * Reads events and treats anything other than a completed read as an error.
 *
 * `NPool.query` is unusable before a write to a replaceable event: it documents
 * that it "will return partial results instead of throwing", breaks out of its
 * loop on `CLOSED`, and wraps everything in a bare catch. Every one of those
 * paths yields `[]`, which is indistinguishable from a genuine absence — so a
 * caller that reads-modifies-writes cannot tell "you have no bookmarks" from
 * "no relay answered", and republishes the list with only the item it just
 * added.
 *
 * Funnelcake closes subscriptions with "error: could not complete query" when
 * its query layer degrades, sending no `EVENT` and no `EOSE`, so this is a live
 * path rather than a theoretical one.
 *
 * Driving `req` directly lets us insist on the one signal that actually means
 * "the relay finished answering": EOSE. `NPool.req` emits its aggregate EOSE
 * only once every routed relay has EOSEd, so this also gives us
 * all-relays-settled semantics — matching the bar divine-mobile's
 * `BookmarkService` sets with `requireAllRelaysSettled: true` before touching
 * the same kind 10003 list.
 */
export async function queryStrict(
  nostr: ReqCapable,
  filters: NostrFilter[],
  opts: { signal?: AbortSignal; timeoutMs: number },
): Promise<NostrEvent[]> {
  const timeout = AbortSignal.timeout(opts.timeoutMs);
  const combined = opts.signal
    ? AbortSignal.any([opts.signal, timeout])
    : timeout;

  const events: NostrEvent[] = [];
  let complete = false;

  for await (const msg of nostr.req(filters, { signal: combined })) {
    if (msg[0] === 'EVENT') {
      events.push(msg[2] as NostrEvent);
    } else if (msg[0] === 'EOSE') {
      complete = true;
      break;
    } else if (msg[0] === 'CLOSED') {
      // Defensive rather than hot: NRelay1 currently breaks on CLOSED without
      // forwarding it, so in practice a relay-side close surfaces here as the
      // timeout below (an AbortError) rather than through this branch. CLOSED is
      // part of the message contract and the typings advertise it, so handle it
      // explicitly instead of relying on that implementation detail.
      throw new RelayReadError('Relay closed the subscription before the read completed');
    }
  }

  // No EOSE and no CLOSED. In practice this is the no-route case: an aborted or
  // timed-out read does not fall through here, it throws AbortError out of the
  // iterator (NPool's Machina rejects on abort). Either way we never established
  // what the relay holds, so we must not answer.
  if (!complete) {
    throw new RelayReadError('Relay read did not complete');
  }

  return events;
}
