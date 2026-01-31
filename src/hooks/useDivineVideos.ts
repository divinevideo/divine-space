import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { 
  fetchVideos, 
  fetchVideo, 
  fetchVideoStats,
  type VideoListItem, 
  type VideoSort 
} from '@/lib/divine-api';

/**
 * Fetch a list of videos from Divine Video
 */
export function useDivineVideos(options?: {
  sort?: VideoSort;
  kind?: number;
  limit?: number;
  tag?: string;
  platform?: string;
}) {
  return useQuery({
    queryKey: ['divine', 'videos', options],
    queryFn: () => fetchVideos({
      sort: options?.sort ?? 'trending',
      kind: options?.kind,
      limit: options?.limit ?? 20,
      tag: options?.tag,
      platform: options?.platform,
    }),
  });
}

/**
 * Fetch videos with infinite scroll pagination
 */
export function useDivineVideosInfinite(options?: {
  sort?: VideoSort;
  kind?: number;
  tag?: string;
  platform?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['divine', 'videos', 'infinite', options],
    queryFn: async ({ pageParam }) => {
      return fetchVideos({
        sort: options?.sort ?? 'trending',
        kind: options?.kind,
        tag: options?.tag,
        platform: options?.platform,
        limit: 20,
        before: pageParam,
      });
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: VideoListItem[]) => {
      if (lastPage.length < 20) return undefined;
      const lastVideo = lastPage[lastPage.length - 1];
      if (!lastVideo) return undefined;
      return Math.floor(new Date(lastVideo.created_at).getTime() / 1000);
    },
  });
}

/**
 * Fetch a single video by ID
 */
export function useDivineVideo(id: string | undefined) {
  return useQuery({
    queryKey: ['divine', 'video', id],
    queryFn: () => fetchVideo(id!),
    enabled: !!id,
  });
}

/**
 * Fetch video stats
 */
export function useDivineVideoStats(id: string | undefined) {
  return useQuery({
    queryKey: ['divine', 'video', 'stats', id],
    queryFn: () => fetchVideoStats(id!),
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
