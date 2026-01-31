import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { 
  searchVideos, 
  searchProfiles,
  fetchHashtags,
  fetchTrendingHashtags,
  fetchPlatformStats,
  fetchVideoLeaderboard,
  fetchCreatorLeaderboard,
  type LeaderboardPeriod,
} from '@/lib/divine-api';

/**
 * Search for videos
 */
export function useDivineSearch(options?: {
  q?: string;
  tag?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['divine', 'search', options?.q, options?.tag],
    queryFn: () => searchVideos({
      q: options?.q,
      tag: options?.tag,
      limit: 50,
    }),
    enabled: options?.enabled !== false && !!(options?.q || options?.tag),
  });
}

/**
 * Search videos with infinite scroll
 */
export function useDivineSearchInfinite(options?: {
  q?: string;
  tag?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['divine', 'search', 'infinite', options?.q, options?.tag],
    queryFn: async ({ pageParam = 0 }) => {
      return searchVideos({
        q: options?.q,
        tag: options?.tag,
        limit: 20,
        offset: pageParam,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.flat().length;
    },
    enabled: !!(options?.q || options?.tag),
  });
}

/**
 * Search for user profiles
 */
export function useDivineProfileSearch(q: string | undefined, options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['divine', 'search', 'profiles', q],
    queryFn: () => searchProfiles(q!, { limit: 20 }),
    enabled: options?.enabled !== false && !!q,
  });
}

/**
 * Fetch popular hashtags
 */
export function useDivineHashtags() {
  return useQuery({
    queryKey: ['divine', 'hashtags'],
    queryFn: fetchHashtags,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch trending hashtags
 */
export function useDivineTrendingHashtags() {
  return useQuery({
    queryKey: ['divine', 'hashtags', 'trending'],
    queryFn: fetchTrendingHashtags,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch platform statistics
 */
export function useDivinePlatformStats() {
  return useQuery({
    queryKey: ['divine', 'stats'],
    queryFn: fetchPlatformStats,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch video leaderboard
 */
export function useDivineVideoLeaderboard(options?: {
  period?: LeaderboardPeriod;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['divine', 'leaderboard', 'videos', options?.period],
    queryFn: () => fetchVideoLeaderboard({
      period: options?.period ?? 'week',
      limit: options?.limit ?? 10,
    }),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch creator leaderboard
 */
export function useDivineCreatorLeaderboard(options?: {
  period?: LeaderboardPeriod;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['divine', 'leaderboard', 'creators', options?.period],
    queryFn: () => fetchCreatorLeaderboard({
      period: options?.period ?? 'week',
      limit: options?.limit ?? 10,
    }),
    staleTime: 60 * 1000, // 1 minute
  });
}
