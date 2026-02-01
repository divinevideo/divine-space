/**
 * Unified Divine profile hook.
 *
 * Aggregates profile data from multiple Nostr event kinds:
 * - Kind 0: Profile metadata (NIP-01)
 * - Kind 30000: Top 8 friends (NIP-51 Follow Sets)
 * - Kind 30003: Profile links (NIP-51 Bookmark Sets)
 * - Kind 30315: User status (NIP-38)
 * - Kind 30512: Site configuration (NIP-512)
 * - Kind 34236: Video events
 */

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuthor } from './useAuthor';
import { useTop8Friends } from './useTop8Friends';
import { useProfileLinks } from './useProfileLinks';
import { useUserStatus } from './useUserStatus';
import { useSiteConfig } from './useSiteConfig';
import type { DivineProfile } from '@/types/profile';

// Event kind constant for videos
const KIND_VIDEO = 34236;

/**
 * Hook to fetch video events for a user.
 *
 * @param pubkey - The user's public key
 * @returns Query result with video events
 */
export function useDivineUserVideos(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['user-videos', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) return [];

      const events = await nostr.query(
        [{ kinds: [KIND_VIDEO], authors: [pubkey], limit: 20 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      return events;
    },
    enabled: !!pubkey,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Unified hook to fetch all Divine profile data.
 *
 * This hook aggregates data from multiple sources into a single
 * unified profile object, handling loading states and fallbacks.
 *
 * It uses the standard NIP hooks:
 * - useAuthor for Kind 0 metadata
 * - useTop8Friends for Kind 30000 (with Kind 16793 fallback)
 * - useProfileLinks for Kind 30003
 * - useUserStatus for Kind 30315 (mood, music, profile song)
 * - useSiteConfig for Kind 30512
 *
 * @param pubkey - The public key of the profile to fetch
 * @returns DivineProfile - The unified profile data
 *
 * @example
 * ```tsx
 * function ProfilePage({ pubkey }: { pubkey: string }) {
 *   const profile = useDivineProfile(pubkey);
 *
 *   if (profile.isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       <h1>{profile.metadata?.name ?? 'Anonymous'}</h1>
 *       <Top8Widget friends={profile.top8} />
 *       <MoodWidget status={profile.mood} />
 *       <LinksWidget links={profile.links} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDivineProfile(pubkey: string | undefined): DivineProfile {
  // Fetch all profile data using the individual hooks
  const authorQuery = useAuthor(pubkey);
  const top8Query = useTop8Friends(pubkey);
  const linksQuery = useProfileLinks(pubkey);
  const statusQuery = useUserStatus(pubkey);
  const siteQuery = useSiteConfig(pubkey);
  const videosQuery = useDivineUserVideos(pubkey);

  // Combine loading states
  const isLoading =
    authorQuery.isLoading ||
    top8Query.isLoading ||
    linksQuery.isLoading ||
    statusQuery.isLoading ||
    siteQuery.isLoading ||
    videosQuery.isLoading;

  // Combine error states
  const isError =
    authorQuery.isError ||
    top8Query.isError ||
    linksQuery.isError ||
    statusQuery.isError ||
    siteQuery.isError ||
    videosQuery.isError;

  // Create a combined refetch function
  const refetch = async () => {
    await Promise.all([
      authorQuery.refetch(),
      top8Query.refetch(),
      linksQuery.refetch(),
      statusQuery.refetch(),
      siteQuery.refetch(),
      videosQuery.refetch(),
    ]);
  };

  return {
    pubkey: pubkey ?? '',
    metadata: authorQuery.data?.metadata,
    top8: top8Query.friends ?? [],
    links: linksQuery.links ?? [],
    mood: statusQuery.mood,
    nowPlaying: statusQuery.nowPlaying,
    isNowPlayingExpired: statusQuery.isNowPlayingExpired,
    profileSong: statusQuery.profileSong,
    site: siteQuery.data ?? null,
    videos: videosQuery.data ?? [],
    isLoading,
    isError,
    refetch,
  };
}

export default useDivineProfile;
