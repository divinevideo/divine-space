import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useKeycast } from '@/contexts/KeycastContext';
import { useKeycastPublish } from './useKeycastPublish';
import {
  parseStatusFromKind30315,
  parseStatusFromKind16793,
  statusToKind30315Tags,
  isStatusExpired,
  getMusicExpiration,
  STATUS_KIND,
  LEGACY_PROFILE_KIND,
  type UserStatus,
} from '@/lib/parseStatus';

/**
 * Hook to fetch and manage the user's mood/general status (d-tag: "general")
 *
 * NIP-38 defines "general" as the standard status type for what a user is doing.
 *
 * @param pubkey - The user's public key
 * @returns The mood status and loading state
 *
 * @example
 * const { mood, isLoading } = useMoodStatus(pubkey);
 * if (mood) {
 *   console.log(mood.content); // "Working on code"
 * }
 */
export function useMoodStatus(pubkey: string | undefined) {
  const { nostr } = useNostr();

  const query = useQuery({
    queryKey: ['user-status', 'mood', pubkey],
    queryFn: async ({ signal }): Promise<UserStatus | null> => {
      if (!pubkey) return null;

      // Try NIP-38 Kind 30315 first (standard)
      const [standardEvent] = await nostr.query(
        [
          {
            kinds: [STATUS_KIND],
            authors: [pubkey],
            '#d': ['general'],
            limit: 1,
          },
        ],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) },
      );

      if (standardEvent) {
        return parseStatusFromKind30315(standardEvent);
      }

      // Fall back to Kind 16793 (legacy DiVine Space format)
      const [legacyEvent] = await nostr.query(
        [
          {
            kinds: [LEGACY_PROFILE_KIND],
            authors: [pubkey],
            limit: 1,
          },
        ],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) },
      );

      return parseStatusFromKind16793(legacyEvent);
    },
    enabled: !!pubkey,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });

  return {
    ...query,
    mood: query.data ?? null,
  };
}

/**
 * Hook to fetch the user's music status (d-tag: "music")
 *
 * Music status is for live streaming what you're currently listening to.
 * It typically has an expiration when the track will stop playing.
 *
 * @param pubkey - The user's public key
 * @returns The music status, expiration state, and loading state
 *
 * @example
 * const { nowPlaying, isExpired, isLoading } = useMusicStatus(pubkey);
 * if (nowPlaying && !isExpired) {
 *   console.log(`Now playing: ${nowPlaying.content}`);
 * }
 */
export function useMusicStatus(pubkey: string | undefined) {
  const { nostr } = useNostr();

  const query = useQuery({
    queryKey: ['user-status', 'music', pubkey],
    queryFn: async ({ signal }): Promise<UserStatus | null> => {
      if (!pubkey) return null;

      const [event] = await nostr.query(
        [
          {
            kinds: [STATUS_KIND],
            authors: [pubkey],
            '#d': ['music'],
            limit: 1,
          },
        ],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) },
      );

      return parseStatusFromKind30315(event);
    },
    enabled: !!pubkey,
    staleTime: 30 * 1000, // 30 seconds - music changes frequently
    retry: 2,
  });

  const nowPlaying = query.data ?? null;
  const isExpired = isStatusExpired(nowPlaying);

  return {
    ...query,
    nowPlaying,
    isExpired,
  };
}

/**
 * Hook to fetch the user's profile song (d-tag: "profile_song")
 *
 * Profile song is a persistent song that represents the user's profile,
 * like the classic MySpace profile song. It should NOT have an expiration.
 *
 * @param pubkey - The user's public key
 * @returns The profile song and loading state
 *
 * @example
 * const { profileSong, isLoading } = useProfileSong(pubkey);
 * if (profileSong) {
 *   console.log(`Profile song: ${profileSong.content}`);
 *   console.log(`URL: ${profileSong.url}`);
 * }
 */
export function useProfileSong(pubkey: string | undefined) {
  const { nostr } = useNostr();

  const query = useQuery({
    queryKey: ['user-status', 'profile_song', pubkey],
    queryFn: async ({ signal }): Promise<UserStatus | null> => {
      if (!pubkey) return null;

      const [event] = await nostr.query(
        [
          {
            kinds: [STATUS_KIND],
            authors: [pubkey],
            '#d': ['profile_song'],
            limit: 1,
          },
        ],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) },
      );

      return parseStatusFromKind30315(event);
    },
    enabled: !!pubkey,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile song changes rarely
    retry: 2,
  });

  return {
    ...query,
    profileSong: query.data ?? null,
  };
}

/**
 * Combined hook to fetch all user status types at once
 *
 * @param pubkey - The user's public key
 * @returns All status types combined
 *
 * @example
 * const { mood, nowPlaying, profileSong, isLoading } = useUserStatus(pubkey);
 */
export function useUserStatus(pubkey: string | undefined) {
  const moodQuery = useMoodStatus(pubkey);
  const musicQuery = useMusicStatus(pubkey);
  const profileSongQuery = useProfileSong(pubkey);

  const isLoading =
    moodQuery.isLoading || musicQuery.isLoading || profileSongQuery.isLoading;
  const isError =
    moodQuery.isError || musicQuery.isError || profileSongQuery.isError;

  return {
    mood: moodQuery.mood,
    nowPlaying: musicQuery.nowPlaying,
    isNowPlayingExpired: musicQuery.isExpired,
    profileSong: profileSongQuery.profileSong,
    isLoading,
    isError,
    refetch: async () => {
      await Promise.all([
        moodQuery.refetch(),
        musicQuery.refetch(),
        profileSongQuery.refetch(),
      ]);
    },
  };
}

/**
 * Hook to update the current user's mood status
 *
 * @returns Mutation to update mood status
 *
 * @example
 * const { updateMood, isUpdating } = useUpdateMoodStatus();
 * await updateMood({ content: 'Feeling great!' });
 */
export function useUpdateMoodStatus() {
  const { pubkey } = useKeycast();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      url,
    }: {
      content: string;
      url?: string;
    }) => {
      if (!pubkey) throw new Error('Not authenticated');

      const status: UserStatus = {
        type: 'general',
        content,
        url,
        createdAt: Math.floor(Date.now() / 1000),
      };

      const tags = statusToKind30315Tags(status);

      await publish({
        kind: STATUS_KIND,
        content,
        tags,
        created_at: status.createdAt,
      });

      return status;
    },
    onSuccess: (status) => {
      queryClient.setQueryData(['user-status', 'mood', pubkey], status);
    },
  });
}

/**
 * Hook to update the current user's music status (now playing)
 *
 * @returns Mutation to update music status
 *
 * @example
 * const { updateNowPlaying, isUpdating } = useUpdateMusicStatus();
 * await updateNowPlaying({
 *   content: 'Song Title - Artist',
 *   url: 'spotify:track:abc123',
 *   durationSeconds: 180, // 3 minutes
 * });
 */
export function useUpdateMusicStatus() {
  const { pubkey } = useKeycast();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      url,
      durationSeconds = 180,
    }: {
      content: string;
      url?: string;
      durationSeconds?: number;
    }) => {
      if (!pubkey) throw new Error('Not authenticated');

      const status: UserStatus = {
        type: 'music',
        content,
        url,
        expiration: getMusicExpiration(durationSeconds),
        createdAt: Math.floor(Date.now() / 1000),
      };

      const tags = statusToKind30315Tags(status);

      await publish({
        kind: STATUS_KIND,
        content,
        tags,
        created_at: status.createdAt,
      });

      return status;
    },
    onSuccess: (status) => {
      queryClient.setQueryData(['user-status', 'music', pubkey], status);
    },
  });
}

/**
 * Hook to clear the current user's music status
 *
 * Per NIP-38, an empty content clears the status.
 *
 * @returns Mutation to clear music status
 */
export function useClearMusicStatus() {
  const { pubkey } = useKeycast();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!pubkey) throw new Error('Not authenticated');

      await publish({
        kind: STATUS_KIND,
        content: '',
        tags: [['d', 'music']],
        created_at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(['user-status', 'music', pubkey], null);
    },
  });
}

/**
 * Hook to update the current user's profile song
 *
 * Profile song is persistent and should NOT have an expiration.
 *
 * @returns Mutation to update profile song
 *
 * @example
 * const { updateProfileSong, isUpdating } = useUpdateProfileSong();
 * await updateProfileSong({
 *   content: 'Bohemian Rhapsody - Queen',
 *   url: 'https://wavlake.com/track/xyz',
 * });
 */
export function useUpdateProfileSong() {
  const { pubkey } = useKeycast();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      url,
    }: {
      content: string;
      url?: string;
    }) => {
      if (!pubkey) throw new Error('Not authenticated');

      const status: UserStatus = {
        type: 'profile_song',
        content,
        url,
        // No expiration for profile song - it's persistent
        createdAt: Math.floor(Date.now() / 1000),
      };

      const tags = statusToKind30315Tags(status);

      await publish({
        kind: STATUS_KIND,
        content,
        tags,
        created_at: status.createdAt,
      });

      return status;
    },
    onSuccess: (status) => {
      queryClient.setQueryData(['user-status', 'profile_song', pubkey], status);
    },
  });
}

/**
 * Hook to clear the current user's profile song
 *
 * @returns Mutation to clear profile song
 */
export function useClearProfileSong() {
  const { pubkey } = useKeycast();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!pubkey) throw new Error('Not authenticated');

      await publish({
        kind: STATUS_KIND,
        content: '',
        tags: [['d', 'profile_song']],
        created_at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(['user-status', 'profile_song', pubkey], null);
    },
  });
}
