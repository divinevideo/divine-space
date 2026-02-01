/**
 * Profile type system for Divine Space profiles.
 *
 * These types define the unified profile data structure that aggregates
 * data from multiple Nostr event kinds:
 * - Kind 0: Profile metadata (NIP-01)
 * - Kind 30000: Top 8 friends (NIP-51 Follow Sets)
 * - Kind 30003: Profile links (NIP-51 Bookmark Sets)
 * - Kind 30315: User status (NIP-38)
 * - Kind 30512: Site configuration (NIP-512)
 */

import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';

// Re-export types from parsing libraries for convenience
export type { TopFriend } from '@/lib/parseTop8';
export type { ProfileLink } from '@/lib/parseLinks';
export type { UserStatus, StatusType } from '@/lib/parseStatus';
export type { SiteConfig, ThemeCustomization, Widget } from '@/types/site';

// Import types for use in this file
import type { TopFriend } from '@/lib/parseTop8';
import type { ProfileLink } from '@/lib/parseLinks';
import type { UserStatus } from '@/lib/parseStatus';
import type { SiteConfig } from '@/types/site';

/**
 * Legacy profile data from Kind 16793.
 * @deprecated Use standard NIP types instead.
 */
export interface LegacyProfileData {
  /** Top friends from legacy format */
  topFriends: TopFriend[];
  /** Music configuration */
  music?: {
    url: string;
    title?: string;
    artist?: string;
  };
  /** Theme ID */
  theme?: string;
  /** Custom CSS */
  customCss?: string;
  /** Background image/gradient */
  background?: string;
  /** Mood status */
  mood?: {
    text: string;
    emoji?: string;
  };
  /** Status text */
  status?: string;
  /** Quote text */
  quote?: string;
}

/**
 * Unified Divine profile that aggregates all profile data.
 * This is the main interface returned by useDivineProfile.
 */
export interface DivineProfile {
  /** The profile owner's public key */
  pubkey: string;

  /** Profile metadata from Kind 0 */
  metadata?: NostrMetadata;

  /** Top 8 friends from Kind 30000 (or legacy Kind 16793) */
  top8: TopFriend[];

  /** Profile links from Kind 30003 */
  links: ProfileLink[];

  /** Mood/general status from Kind 30315 (d=general) */
  mood: UserStatus | null;

  /** Now playing status from Kind 30315 (d=music) */
  nowPlaying: UserStatus | null;

  /** Whether the now playing status is expired */
  isNowPlayingExpired: boolean;

  /** Persistent profile song from Kind 30315 (d=profile_song) */
  profileSong: UserStatus | null;

  /** Site configuration from Kind 30512 */
  site: SiteConfig | null;

  /** Video events from Kind 34236 */
  videos: NostrEvent[];

  /** Whether any of the underlying queries are loading */
  isLoading: boolean;

  /** Whether there was an error loading profile data */
  isError: boolean;

  /** Refetch all profile data */
  refetch: () => Promise<void>;
}

/**
 * Return type for the useTop8Friends hook.
 */
export interface UseTop8FriendsResult {
  /** The list of Top 8 friends */
  friends: TopFriend[];
  /** Whether the data is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Update the Top 8 friends list */
  updateTop8?: (friends: TopFriend[]) => Promise<void>;
  /** Whether an update is in progress */
  isUpdating?: boolean;
}

/**
 * Return type for the useProfileLinks hook.
 */
export interface UseProfileLinksResult {
  /** The list of profile links */
  links: ProfileLink[];
  /** Whether the data is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
}

/**
 * Return type for the useUserStatus hook.
 */
export interface UseUserStatusResult {
  /** Mood/general status */
  mood: UserStatus | null;
  /** Now playing status */
  nowPlaying: UserStatus | null;
  /** Whether now playing is expired */
  isNowPlayingExpired: boolean;
  /** Profile song status */
  profileSong: UserStatus | null;
  /** Whether the data is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
}

/**
 * Return type for the useSiteConfig hook.
 */
export interface UseSiteConfigResult {
  /** Site configuration */
  site: SiteConfig | null;
  /** Whether the data is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
}
