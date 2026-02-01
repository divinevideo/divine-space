import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NostrContext } from '@nostrify/react';
import type { NostrEvent, NStore } from '@nostrify/nostrify';
import { useMoodStatus, useMusicStatus, useProfileSong, useUserStatus } from './useUserStatus';
import { STATUS_KIND } from '@/lib/parseStatus';
import type { ReactNode } from 'react';

// Mock event creator
function createEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'test-id',
    pubkey: 'test-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind: STATUS_KIND,
    tags: [],
    content: '',
    sig: 'test-sig',
    ...overrides,
  };
}

// Create a wrapper with mocked Nostr context
function createWrapper(events: NostrEvent[] = []) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const mockNostr: NStore = {
    query: vi.fn().mockImplementation(async (filters) => {
      // Filter events based on the query
      return events.filter((event) => {
        const filter = filters[0];
        if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
        if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
        if (filter['#d']) {
          const dTag = event.tags.find(([name]) => name === 'd');
          if (!dTag || !filter['#d'].includes(dTag[1])) return false;
        }
        return true;
      });
    }),
    event: vi.fn().mockResolvedValue(undefined),
  };

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NostrContext.Provider value={{ nostr: mockNostr }}>
        {children}
      </NostrContext.Provider>
    </QueryClientProvider>
  );
}

describe('useMoodStatus', () => {
  const testPubkey = 'abc123def456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when no status exists', async () => {
    const wrapper = createWrapper([]);

    const { result } = renderHook(() => useMoodStatus(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mood).toBeNull();
  });

  it('should return null when pubkey is undefined', async () => {
    const wrapper = createWrapper([]);

    const { result } = renderHook(() => useMoodStatus(undefined), { wrapper });

    // Query should not be enabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mood).toBeNull();
  });

  it('should query Kind 30315 with d-tag "general"', async () => {
    const moodEvent = createEvent({
      pubkey: testPubkey,
      content: 'Feeling creative',
      tags: [['d', 'general']],
    });

    const wrapper = createWrapper([moodEvent]);

    const { result } = renderHook(() => useMoodStatus(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.mood).not.toBeNull();
    });

    expect(result.current.mood?.content).toBe('Feeling creative');
    expect(result.current.mood?.type).toBe('general');
  });

  it('should fall back to Kind 16793 for legacy profiles', async () => {
    const legacyEvent: NostrEvent = {
      id: 'legacy-id',
      pubkey: testPubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 16793,
      tags: [['mood', 'Happy', '😊']],
      content: '',
      sig: 'test-sig',
    };

    // Create wrapper that returns legacy event for the fallback query
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    const mockNostr: NStore = {
      query: vi.fn().mockImplementation(async (filters) => {
        const filter = filters[0];
        // Return empty for Kind 30315, return legacy for Kind 16793
        if (filter.kinds?.includes(STATUS_KIND)) return [];
        if (filter.kinds?.includes(16793)) return [legacyEvent];
        return [];
      }),
      event: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <NostrContext.Provider value={{ nostr: mockNostr }}>
          {children}
        </NostrContext.Provider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useMoodStatus(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.mood).not.toBeNull();
    });

    expect(result.current.mood?.content).toBe('😊 Happy');
    expect(result.current.mood?.type).toBe('general');
  });
});

describe('useMusicStatus', () => {
  const testPubkey = 'abc123def456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query Kind 30315 with d-tag "music"', async () => {
    const futureExpiration = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
    const musicEvent = createEvent({
      pubkey: testPubkey,
      content: 'Toxic - Britney Spears',
      tags: [
        ['d', 'music'],
        ['r', 'spotify:track:abc123'],
        ['expiration', futureExpiration.toString()],
      ],
    });

    const wrapper = createWrapper([musicEvent]);

    const { result } = renderHook(() => useMusicStatus(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.nowPlaying).not.toBeNull();
    });

    expect(result.current.nowPlaying?.content).toBe('Toxic - Britney Spears');
    expect(result.current.nowPlaying?.type).toBe('music');
    expect(result.current.nowPlaying?.url).toBe('spotify:track:abc123');
    expect(result.current.isExpired).toBe(false);
  });

  it('should detect expired music status', async () => {
    const pastExpiration = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
    const expiredMusicEvent = createEvent({
      pubkey: testPubkey,
      content: 'Old Song',
      tags: [
        ['d', 'music'],
        ['expiration', pastExpiration.toString()],
      ],
    });

    const wrapper = createWrapper([expiredMusicEvent]);

    const { result } = renderHook(() => useMusicStatus(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isExpired).toBe(true);
  });

  it('should return null when no music status exists', async () => {
    const wrapper = createWrapper([]);

    const { result } = renderHook(() => useMusicStatus(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nowPlaying).toBeNull();
    expect(result.current.isExpired).toBe(false);
  });
});

describe('useProfileSong', () => {
  const testPubkey = 'abc123def456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query Kind 30315 with d-tag "profile_song"', async () => {
    const profileSongEvent = createEvent({
      pubkey: testPubkey,
      content: 'Bohemian Rhapsody - Queen',
      tags: [
        ['d', 'profile_song'],
        ['r', 'https://wavlake.com/track/xyz'],
      ],
    });

    const wrapper = createWrapper([profileSongEvent]);

    const { result } = renderHook(() => useProfileSong(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.profileSong).not.toBeNull();
    });

    expect(result.current.profileSong?.content).toBe('Bohemian Rhapsody - Queen');
    expect(result.current.profileSong?.type).toBe('profile_song');
    expect(result.current.profileSong?.url).toBe('https://wavlake.com/track/xyz');
    // Profile song should not have expiration
    expect(result.current.profileSong?.expiration).toBeUndefined();
  });

  it('should return null when no profile song exists', async () => {
    const wrapper = createWrapper([]);

    const { result } = renderHook(() => useProfileSong(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profileSong).toBeNull();
  });
});

describe('useUserStatus (combined)', () => {
  const testPubkey = 'abc123def456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all status types at once', async () => {
    const futureExpiration = Math.floor(Date.now() / 1000) + 300;

    const events = [
      createEvent({
        pubkey: testPubkey,
        content: 'Working on code',
        tags: [['d', 'general']],
      }),
      createEvent({
        pubkey: testPubkey,
        content: 'Current Song',
        tags: [
          ['d', 'music'],
          ['expiration', futureExpiration.toString()],
        ],
      }),
      createEvent({
        pubkey: testPubkey,
        content: 'Favorite Song',
        tags: [['d', 'profile_song']],
      }),
    ];

    const wrapper = createWrapper(events);

    const { result } = renderHook(() => useUserStatus(testPubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mood?.content).toBe('Working on code');
    expect(result.current.nowPlaying?.content).toBe('Current Song');
    expect(result.current.profileSong?.content).toBe('Favorite Song');
  });

  it('should return nulls when pubkey is undefined', async () => {
    const wrapper = createWrapper([]);

    const { result } = renderHook(() => useUserStatus(undefined), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.mood).toBeNull();
    expect(result.current.nowPlaying).toBeNull();
    expect(result.current.profileSong).toBeNull();
  });
});
