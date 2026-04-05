import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchUser,
  fetchUserVideos,
  fetchUserFollowers,
  fetchUserFollowing,
  fetchUserSocial,
  fetchUserFeed,
  fetchUserRecommendations,
  type VideoListItem,
} from '@/lib/divine-api';

/**
 * Fetch a user's profile and stats from Divine Video
 */
export function useDivineUser(pubkey: string | undefined) {
  return useQuery({
    queryKey: ['divine', 'user', pubkey],
    queryFn: () => fetchUser(pubkey!),
    enabled: !!pubkey,
  });
}

/**
 * Fetch a user's videos
 */
export function useDivineUserVideos(pubkey: string | undefined, options?: {
  limit?: number;
}) {
  return useQuery({
    queryKey: ['divine', 'user', 'videos', pubkey, options],
    queryFn: () => fetchUserVideos(pubkey!, { limit: options?.limit ?? 20 }),
    enabled: !!pubkey,
  });
}

/**
 * Fetch a user's videos with infinite scroll
 */
export function useDivineUserVideosInfinite(pubkey: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['divine', 'user', 'videos', 'infinite', pubkey],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchUserVideos(pubkey!, { limit: 20, offset: pageParam });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: VideoListItem[], allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.flat().length;
    },
    enabled: !!pubkey,
  });
}

/**
 * Fetch a user's followers
 */
export function useDivineUserFollowers(pubkey: string | undefined) {
  return useQuery({
    queryKey: ['divine', 'user', 'followers', pubkey],
    queryFn: () => fetchUserFollowers(pubkey!),
    enabled: !!pubkey,
  });
}

/**
 * Fetch who a user follows
 */
export function useDivineUserFollowing(pubkey: string | undefined) {
  return useQuery({
    queryKey: ['divine', 'user', 'following', pubkey],
    queryFn: () => fetchUserFollowing(pubkey!),
    enabled: !!pubkey,
  });
}

/**
 * Fetch a user's social counts
 */
export function useDivineUserSocial(pubkey: string | undefined) {
  return useQuery({
    queryKey: ['divine', 'user', 'social', pubkey],
    queryFn: () => fetchUserSocial(pubkey!),
    enabled: !!pubkey,
  });
}

/**
 * Fetch a user's personalized feed
 */
export function useDivineUserFeed(pubkey: string | undefined, options?: {
  sort?: 'recent' | 'trending';
}) {
  return useInfiniteQuery({
    queryKey: ['divine', 'user', 'feed', pubkey, options],
    queryFn: async ({ pageParam }) => {
      return fetchUserFeed(pubkey!, {
        sort: options?.sort ?? 'recent',
        limit: 20,
        before: pageParam,
      });
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more) return undefined;
      return lastPage.next_cursor ? parseInt(lastPage.next_cursor) : undefined;
    },
    enabled: !!pubkey,
  });
}

/**
 * Fetch personalized recommendations for a user
 */
export function useDivineRecommendations(pubkey: string | undefined, options?: {
  limit?: number;
  category?: string;
}) {
  return useQuery({
    queryKey: ['divine', 'user', 'recommendations', pubkey, options],
    queryFn: () => fetchUserRecommendations(pubkey!, {
      limit: options?.limit ?? 10,
      category: options?.category,
    }),
    enabled: !!pubkey,
  });
}
