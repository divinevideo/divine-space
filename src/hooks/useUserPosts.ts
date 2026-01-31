import { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';

/**
 * Fetch a user's Nostr posts (kind 1 notes)
 */
export function useUserPostsInfinite(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['nostr', 'user', 'posts', pubkey],
    queryFn: async ({ pageParam }) => {
      const filter: { kinds: number[]; authors: string[]; limit: number; until?: number } = {
        kinds: [1], // Text notes
        authors: [pubkey!],
        limit: 20,
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
 * Fetch user's combined posts (kind 1 notes and kind 11 video notes)
 */
export function useUserAllPostsInfinite(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['nostr', 'user', 'allposts', pubkey],
    queryFn: async ({ pageParam }) => {
      const filter: { kinds: number[]; authors: string[]; limit: number; until?: number } = {
        kinds: [1, 30023], // Text notes and long-form articles
        authors: [pubkey!],
        limit: 20,
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
      if (lastPage.length < 20) return undefined;
      const lastEvent = lastPage[lastPage.length - 1];
      return lastEvent ? lastEvent.created_at - 1 : undefined;
    },
    enabled: !!pubkey,
  });
}
