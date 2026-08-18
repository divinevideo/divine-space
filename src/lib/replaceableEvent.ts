import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Helpers for rewriting replaceable events (kind 0, 3 and 10000-19999) safely.
 *
 * A replaceable event has no partial update: publishing one discards the
 * previous version entirely. Read the current version, merge into it, and make
 * sure the result actually supersedes what it was built from.
 */

/**
 * The newest event in `events`, by NIP-01 ordering: the latest `created_at`
 * wins, and ties are broken by the lowest `id` in lexical order.
 *
 * Each relay answers with its own copy, so a read that reaches several relays
 * can return several versions of the same replaceable event.
 */
export function latestEvent(events: NostrEvent[]): NostrEvent | undefined {
  return events.reduce<NostrEvent | undefined>((newest, event) => {
    if (!newest) return event;
    if (event.created_at !== newest.created_at) {
      return event.created_at > newest.created_at ? event : newest;
    }
    return event.id < newest.id ? event : newest;
  }, undefined);
}

/**
 * A `created_at` that is guaranteed to supersede `baseCreatedAt`.
 *
 * `created_at` is measured in whole seconds, so two edits within the same
 * second collide. NIP-01 breaks such a tie on the lowest id, which is
 * effectively random with respect to which edit came second, and relays do not
 * all implement even that — the Divine relay stores events in a ClickHouse
 * `ReplacingMergeTree(created_at)`, which resolves a tie by insertion order.
 * Stepping one second past the version we merged from removes the tie instead
 * of hoping it is broken in our favour.
 */
export function nextCreatedAt(baseCreatedAt: number | undefined, now = Date.now()): number {
  const seconds = Math.floor(now / 1000);
  return baseCreatedAt === undefined ? seconds : Math.max(seconds, baseCreatedAt + 1);
}
