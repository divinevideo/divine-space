import type { NostrEvent } from '@nostrify/nostrify';

/**
 * NIP-38 User Status Kind
 * @see https://github.com/nostr-protocol/nips/blob/master/38.md
 */
export const STATUS_KIND = 30315;

/**
 * Legacy Kind for DiVine Space profiles (deprecated)
 */
export const LEGACY_PROFILE_KIND = 16793;

/**
 * Standard status types defined by NIP-38
 */
export type StatusType = 'general' | 'music' | 'profile_song' | string;

/**
 * Parsed user status from a NIP-38 Kind 30315 event
 */
export interface UserStatus {
  /** Status type from d-tag (general, music, profile_song, etc.) */
  type: StatusType;
  /** Status content (what the user is doing, song name, etc.) */
  content: string;
  /** Optional URL reference (spotify link, wavlake link, etc.) */
  url?: string;
  /** Unix timestamp when this status expires (music tracks, temporary statuses) */
  expiration?: number;
  /** When the status was created */
  createdAt: number;
}

/**
 * Parse a NIP-38 Kind 30315 status event into a UserStatus object
 *
 * @param event - The Nostr event to parse
 * @returns Parsed UserStatus or null if invalid
 *
 * @example
 * // General status
 * { kind: 30315, content: "Working", tags: [["d", "general"]] }
 *
 * @example
 * // Music status with expiration
 * { kind: 30315, content: "Song - Artist", tags: [["d", "music"], ["r", "spotify:..."], ["expiration", "..."]] }
 */
export function parseStatusFromKind30315(event: NostrEvent | undefined): UserStatus | null {
  if (!event || event.kind !== STATUS_KIND) {
    return null;
  }

  // Find the d-tag which defines the status type
  const dTag = event.tags.find(([name]) => name === 'd');
  if (!dTag || !dTag[1]) {
    return null;
  }

  const type = dTag[1];
  const content = event.content;

  // Find optional r-tag (URL reference)
  const rTag = event.tags.find(([name]) => name === 'r');
  const url = rTag?.[1];

  // Find optional expiration tag
  const expirationTag = event.tags.find(([name]) => name === 'expiration');
  const expiration = expirationTag?.[1] ? parseInt(expirationTag[1], 10) : undefined;

  return {
    type,
    content,
    url,
    expiration,
    createdAt: event.created_at,
  };
}

/**
 * Parse legacy Kind 16793 mood/status into a UserStatus object
 * For backward compatibility with existing DiVine Space profiles
 *
 * @param event - The legacy Nostr event to parse
 * @returns Parsed UserStatus or null if no mood/status found
 */
export function parseStatusFromKind16793(event: NostrEvent | undefined): UserStatus | null {
  if (!event || event.kind !== LEGACY_PROFILE_KIND) {
    return null;
  }

  // Try to find mood tag first: ["mood", "text", "emoji?"]
  const moodTag = event.tags.find(([name]) => name === 'mood');
  if (moodTag && moodTag[1]) {
    const text = moodTag[1];
    const emoji = moodTag[2];
    const content = emoji ? `${emoji} ${text}` : text;

    return {
      type: 'general',
      content,
      createdAt: event.created_at,
    };
  }

  // Fall back to status tag: ["status", "text"]
  const statusTag = event.tags.find(([name]) => name === 'status');
  if (statusTag && statusTag[1]) {
    return {
      type: 'general',
      content: statusTag[1],
      createdAt: event.created_at,
    };
  }

  return null;
}

/**
 * Convert a UserStatus object to NIP-38 Kind 30315 tags
 *
 * @param status - The status to convert
 * @returns Array of tags for the event
 *
 * @example
 * statusToKind30315Tags({ type: 'music', content: 'Song', url: 'spotify:...' })
 * // Returns: [['d', 'music'], ['r', 'spotify:...']]
 */
export function statusToKind30315Tags(status: UserStatus): string[][] {
  const tags: string[][] = [
    ['d', status.type],
  ];

  if (status.url) {
    tags.push(['r', status.url]);
  }

  if (status.expiration !== undefined) {
    tags.push(['expiration', status.expiration.toString()]);
  }

  return tags;
}

/**
 * Check if a status has expired based on its expiration timestamp
 *
 * @param status - The status to check
 * @returns true if expired, false if still valid or no expiration
 */
export function isStatusExpired(status: UserStatus | null): boolean {
  if (!status || status.expiration === undefined) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return status.expiration < now;
}

/**
 * Get the default expiration for a music track (e.g., 3-5 minutes from now)
 *
 * @param durationSeconds - Duration of the track in seconds (default: 180 = 3 minutes)
 * @returns Unix timestamp for expiration
 */
export function getMusicExpiration(durationSeconds: number = 180): number {
  return Math.floor(Date.now() / 1000) + durationSeconds;
}
