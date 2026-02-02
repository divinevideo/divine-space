import { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';

/**
 * Check if an event is a reply (has 'e' tags referencing parent events)
 * Per NIP-10, replies have 'e' tags pointing to root/parent events
 */
function isReply(event: NostrEvent): boolean {
  return event.tags.some(tag => tag[0] === 'e');
}

/**
 * Fetch a user's Nostr posts (kind 1 notes)
 * Filters out replies - only returns root posts (original posts, not replies)
 */
export function useUserPostsInfinite(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['nostr', 'user', 'posts', pubkey],
    queryFn: async ({ pageParam }) => {
      // Fetch more than needed since we'll filter out replies
      const filter: { kinds: number[]; authors: string[]; limit: number; until?: number } = {
        kinds: [1], // Text notes
        authors: [pubkey!],
        limit: 50, // Fetch more to account for filtered replies
      };

      if (pageParam) {
        filter.until = pageParam;
      }

      const events = await nostr.query([filter]);

      // Filter out replies - only show root posts (posts without 'e' tags)
      const rootPosts = events.filter(event => !isReply(event));

      // Sort by created_at descending and limit to 20
      return rootPosts.sort((a, b) => b.created_at - a.created_at).slice(0, 20);
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: NostrEvent[]) => {
      if (lastPage.length < 20) return undefined;
      const lastEvent = lastPage[lastPage.length - 1];
      return lastEvent ? lastEvent.created_at - 1 : undefined;
    },
    enabled: !!pubkey,
  });
}

/**
 * Fetch a user's Nostr articles (kind 30023 long-form content)
 */
export function useUserArticlesInfinite(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['nostr', 'user', 'articles', pubkey],
    queryFn: async ({ pageParam }) => {
      const filter: { kinds: number[]; authors: string[]; limit: number; until?: number } = {
        kinds: [30023], // Long-form articles
        authors: [pubkey!],
        limit: 10,
      };

      if (pageParam) {
        filter.until = pageParam;
      }

      const events = await nostr.query([filter]);
      
      // Sort by created_at descending
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: NostrEvent[]) => {
      if (lastPage.length < 10) return undefined;
      const lastEvent = lastPage[lastPage.length - 1];
      return lastEvent ? lastEvent.created_at - 1 : undefined;
    },
    enabled: !!pubkey,
  });
}

/**
 * Fetch user's combined posts (kind 1 notes and kind 30023 articles)
 * Filters out replies for kind 1 - only returns root posts
 */
export function useUserAllPostsInfinite(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['nostr', 'user', 'allposts', pubkey],
    queryFn: async ({ pageParam }) => {
      const filter: { kinds: number[]; authors: string[]; limit: number; until?: number } = {
        kinds: [1, 30023], // Text notes and long-form articles
        authors: [pubkey!],
        limit: 50, // Fetch more to account for filtered replies
      };

      if (pageParam) {
        filter.until = pageParam;
      }

      const events = await nostr.query([filter]);

      // Filter out replies for kind 1 events (articles don't use e tags the same way)
      const rootPosts = events.filter(event =>
        event.kind === 30023 || !isReply(event)
      );

      // Sort by created_at descending and limit to 20
      return rootPosts.sort((a, b) => b.created_at - a.created_at).slice(0, 20);
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: NostrEvent[]) => {
      if (lastPage.length < 20) return undefined;
      const lastEvent = lastPage[lastPage.length - 1];
      return lastEvent ? lastEvent.created_at - 1 : undefined;
    },
    enabled: !!pubkey,
  });
}
