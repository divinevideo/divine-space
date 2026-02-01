import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Profile link structure compatible with NIP-51 Kind 30003 (Bookmark Sets)
 * and Nostree link format.
 */
export interface ProfileLink {
  url: string;
  label: string;
}

/**
 * Parse links from a Kind 30003 (Bookmark Set) event.
 * This is the standard NIP-51 format used by Nostree and other clients.
 *
 * Expected format:
 * ```
 * {
 *   kind: 30003,
 *   tags: [
 *     ['d', 'links'],
 *     ['title', 'My Links'],
 *     ['r', 'https://github.com/alice', 'GitHub'],
 *     ['r', 'https://twitter.com/alice', 'Twitter'],
 *   ]
 * }
 * ```
 */
export function parseLinksFromKind30003(event: NostrEvent | undefined): ProfileLink[] {
  if (!event || event.kind !== 30003) return [];

  const rTags = event.tags.filter(([name]) => name === 'r');

  return rTags
    .map((tag) => ({
      url: tag[1] || '',
      label: tag[2] || '',
    }))
    .filter((link) => link.url.length > 0);
}

/**
 * Parse links from a legacy Kind 16793 event.
 * Supports both 'link' and 'r' tag formats for backward compatibility.
 */
export function parseLinksFromKind16793(event: NostrEvent | undefined): ProfileLink[] {
  if (!event || event.kind !== 16793) return [];

  // Legacy format might use 'link' or 'r' tags
  const linkTags = event.tags.filter(([name]) => name === 'link' || name === 'r');

  return linkTags
    .map((tag) => ({
      url: tag[1] || '',
      label: tag[2] || '',
    }))
    .filter((link) => link.url.length > 0);
}

/**
 * Convert profile links to Kind 30003 tags.
 * Produces Nostree-compatible format with 'r' tags.
 *
 * @param links - Array of profile links
 * @param title - Optional title for the link set (default: 'My Links')
 * @param dTag - Optional d-tag identifier (default: 'links')
 * @returns Array of tags for Kind 30003 event
 *
 * Output format:
 * ```
 * [
 *   ['d', 'links'],
 *   ['title', 'My Links'],
 *   ['r', 'https://github.com/alice', 'GitHub'],
 *   ['r', 'https://twitter.com/alice', 'Twitter'],
 * ]
 * ```
 */
export function linksToKind30003Tags(
  links: ProfileLink[],
  title: string = 'My Links',
  dTag: string = 'links'
): string[][] {
  return [
    ['d', dTag],
    ['title', title],
    ...links.map((link) => ['r', link.url, link.label]),
  ];
}

/**
 * Extract metadata from a Kind 30003 event.
 */
export function extractLinksMetadata(event: NostrEvent | undefined): {
  title?: string;
  description?: string;
  image?: string;
  dTag?: string;
} {
  if (!event || event.kind !== 30003) return {};

  const findTag = (name: string) => event.tags.find(([n]) => n === name)?.[1];

  return {
    title: findTag('title'),
    description: findTag('description'),
    image: findTag('image'),
    dTag: findTag('d'),
  };
}
