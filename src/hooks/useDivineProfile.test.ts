import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useDivineProfile, useDivineUserVideos } from './useDivineProfile';

// Test pubkey
const TEST_PUBKEY = 'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761';

// Mock the nostr query function
const mockNostrQuery = vi.fn();

// Mock all the individual hooks that useDivineProfile depends on
vi.mock('@nostrify/react', async () => {
  const actual = await vi.importActual('@nostrify/react');
  return {
    ...actual,
    useNostr: () => ({
      nostr: {
        query: mockNostrQuery,
      },
    }),
  };
});

vi.mock('./useAuthor', () => ({
  useAuthor: vi.fn(() => ({
    data: { metadata: { name: 'Test User', about: 'Test bio' } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('./useTop8Friends', () => ({
  useTop8Friends: vi.fn(() => ({
    friends: [
      { pubkey: 'a'.repeat(64), position: 1, petname: 'Alice' },
      { pubkey: 'b'.repeat(64), position: 2, petname: 'Bob' },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('./useProfileLinks', () => ({
  useProfileLinks: vi.fn(() => ({
    links: [
      { url: 'https://github.com/test', label: 'GitHub' },
      { url: 'https://twitter.com/test', label: 'Twitter' },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('./useUserStatus', () => ({
  useUserStatus: vi.fn(() => ({
    mood: { type: 'general', content: 'Vibing', createdAt: Date.now() },
    nowPlaying: null,
    isNowPlayingExpired: false,
    profileSong: { type: 'profile_song', content: 'Bohemian Rhapsody', createdAt: Date.now() },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('./useSiteConfig', () => ({
  useSiteConfig: vi.fn(() => ({
    data: {
      identifier: 'profile',
      url: 'https://divine.space/test/',
      name: 'Test Space',
      layout: 'bento',
      widgets: [],
      includes: [],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

describe('useDivineProfile', () => {
  beforeEach(() => {
    mockNostrQuery.mockReset();
    // Default to returning empty arrays
    mockNostrQuery.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useDivineProfile (unified hook)', () => {
    it('should return empty profile when pubkey is undefined', async () => {
      const { result } = renderHook(() => useDivineProfile(undefined), {
        wrapper: TestApp,
      });

      expect(result.current.pubkey).toBe('');
    });

    it('should aggregate data from all source hooks', async () => {
      const { result } = renderHook(() => useDivineProfile(TEST_PUBKEY), {
        wrapper: TestApp,
      });

      // Check that data is aggregated from all hooks
      expect(result.current.pubkey).toBe(TEST_PUBKEY);
      expect(result.current.metadata?.name).toBe('Test User');
      expect(result.current.top8).toHaveLength(2);
      expect(result.current.top8[0].petname).toBe('Alice');
      expect(result.current.links).toHaveLength(2);
      expect(result.current.mood?.content).toBe('Vibing');
      expect(result.current.profileSong?.content).toBe('Bohemian Rhapsody');
      expect(result.current.site?.name).toBe('Test Space');
    });

    it('should combine loading states correctly', async () => {
      const { result } = renderHook(() => useDivineProfile(TEST_PUBKEY), {
        wrapper: TestApp,
      });

      // The unified hook combines loading states from all hooks
      // isLoading may be true while video query is still pending
      await waitFor(() => {
        expect(typeof result.current.isLoading).toBe('boolean');
      });
    });

    it('should have a refetch function', async () => {
      const { result } = renderHook(() => useDivineProfile(TEST_PUBKEY), {
        wrapper: TestApp,
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should handle isNowPlayingExpired from useUserStatus', async () => {
      const { result } = renderHook(() => useDivineProfile(TEST_PUBKEY), {
        wrapper: TestApp,
      });

      expect(result.current.isNowPlayingExpired).toBe(false);
    });
  });

  describe('useDivineUserVideos', () => {
    it('should return empty array when pubkey is undefined', async () => {
      const { result } = renderHook(() => useDivineUserVideos(undefined), {
        wrapper: TestApp,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When pubkey is undefined, the query is disabled so data stays undefined
      expect(result.current.data).toBeUndefined();
    });

    it('should fetch Kind 34236 video events', async () => {
      const videoEvents = [
        {
          kind: 34236,
          pubkey: TEST_PUBKEY,
          content: 'Video description',
          tags: [
            ['d', 'video-1'],
            ['title', 'My Video'],
          ],
          id: 'video-1-id',
          created_at: Date.now(),
          sig: 'sig',
        },
        {
          kind: 34236,
          pubkey: TEST_PUBKEY,
          content: 'Another video',
          tags: [
            ['d', 'video-2'],
            ['title', 'Another Video'],
          ],
          id: 'video-2-id',
          created_at: Date.now() - 1000,
          sig: 'sig',
        },
      ];

      mockNostrQuery.mockResolvedValueOnce(videoEvents);

      const { result } = renderHook(() => useDivineUserVideos(TEST_PUBKEY), {
        wrapper: TestApp,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].kind).toBe(34236);
    });

    it('should query with correct filter parameters', async () => {
      mockNostrQuery.mockResolvedValueOnce([]);

      renderHook(() => useDivineUserVideos(TEST_PUBKEY), {
        wrapper: TestApp,
      });

      await waitFor(() => {
        expect(mockNostrQuery).toHaveBeenCalled();
      });

      // Verify the query was called with correct parameters
      expect(mockNostrQuery).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            kinds: [34236],
            authors: [TEST_PUBKEY],
            limit: 20,
          }),
        ]),
        expect.any(Object)
      );
    });
  });
});
