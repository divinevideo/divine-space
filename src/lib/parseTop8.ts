import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Represents a friend in the Top 8 list.
 * Used for both NIP-51 Kind 30000 (standard) and legacy Kind 16793 formats.
 */
export interface TopFriend {
  /** The friend's pubkey (hex format) */
  pubkey: string;
  /** Optional relay hint for finding the friend's events */
  relay?: string;
  /** Optional petname/nickname for the friend */
  petname?: string;
  /** Position in the Top 8 (1-8) */
  position: number;
}

/**
 * Parse Top 8 friends from a NIP-51 Kind 30000 "Follow Sets" event.
 *
 * Event format (NIP-51):
 * ```json
 * {
 *   kind: 30000,
 *   tags: [
 *     ["d", "top8"],
 *     ["title", "Top 8 Friends"],
 *     ["p", "<pubkey>", "<relay>", "<petname>"],
 *     ...
 *   ],
 *   content: ""
 * }
 * ```
 *
 * @param event - The Kind 30000 event to parse
 * @returns Array of TopFriend objects, limited to first 8
 */
export function parseTop8FromKind30000(event: NostrEvent | undefined): TopFriend[] {
  if (!event || event.kind !== 30000) return [];

  const pTags = event.tags.filter(([name]) => name === 'p');

  return pTags.map((tag, index) => ({
    pubkey: tag[1],
    relay: tag[2] || undefined,
    petname: tag[3] || undefined,
    position: index + 1,
  })).slice(0, 8);
}

/**
 * Parse Top 8 friends from the legacy Kind 16793 DiVine profile event.
 *
 * Legacy event format:
 * ```json
 * {
 *   kind: 16793,
 *   tags: [
 *     ["alt", "DiVine Space profile customization"],
 *     ["p", "<pubkey>", "", "<position>"],
 *     ...
 *   ],
 *   content: ""
 * }
 * ```
 *
 * @param event - The legacy Kind 16793 event to parse
 * @returns Array of TopFriend objects, sorted by position
 */
export function parseTop8FromKind16793(event: NostrEvent | undefined): TopFriend[] {
  if (!event || event.kind !== 16793) return [];

  const pTags = event.tags.filter(([name]) => name === 'p');

  return pTags
    .map(tag => ({
      pubkey: tag[1],
      position: parseInt(tag[3]) || 0,
      petname: undefined,
    }))
    .filter(f => f.position > 0 && f.position <= 8)
    .sort((a, b) => a.position - b.position);
}

/**
 * Convert an array of TopFriend objects to NIP-51 Kind 30000 tags.
 *
 * Output format:
 * ```json
 * [
 *   ["d", "top8"],
 *   ["title", "Top 8 Friends"],
 *   ["p", "<pubkey>", "<relay>", "<petname>"],
 *   ...
 * ]
 * ```
 *
 * @param friends - Array of friends to convert (will be limited to first 8)
 * @returns Array of tags suitable for a Kind 30000 event
 */
export function top8ToKind30000Tags(friends: TopFriend[]): string[][] {
  return [
    ['d', 'top8'],
    ['title', 'Top 8 Friends'],
    ...friends.slice(0, 8).map(f => [
      'p',
      f.pubkey,
      f.relay || '',
      f.petname || '',
    ]),
  ];
}
