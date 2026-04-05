import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import React from 'react';

// Mock modules before importing the hook
vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

vi.mock('./useKeycastPublish', () => ({
  useKeycastPublish: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Import the mocked module to control it
import { useNostr } from '@nostrify/react';
import { useTop8Friends, TOP8_KIND_STANDARD, TOP8_KIND_LEGACY, TOP8_D_TAG } from './useTop8Friends';

// Helper to create mock events
function createMockEvent(kind: number, tags: string[][], pubkey = 'test-pubkey'): NostrEvent {
  return {
    id: `test-event-${kind}-${Date.now()}`,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content: '',
    sig: 'test-sig',
  };
}

// Simple wrapper that only provides QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useTop8Friends', () => {
  let mockNostrQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNostrQuery = vi.fn();
    vi.mocked(useNostr).mockReturnValue({
      nostr: {
        query: mockNostrQuery,
        event: vi.fn(),
        req: vi.fn(),
        close: vi.fn(),
      },
    } as unknown as ReturnType<typeof useNostr>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should export correct constants', () => {
    expect(TOP8_KIND_STANDARD).toBe(30000);
    expect(TOP8_KIND_LEGACY).toBe(16793);
    expect(TOP8_D_TAG).toBe('top8');
  });

  it('should return empty array when pubkey is undefined', async () => {
    const { result } = renderHook(() => useTop8Friends(undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled, so no loading state
    expect(result.current.friends).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should query Kind 30000 with d-tag "top8" first', async () => {
    const pubkey = 'user-pubkey-123';

    // Return empty array for all queries (no top8 found)
    mockNostrQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have queried for Kind 30000 first
    expect(mockNostrQuery).toHaveBeenCalledWith([{
      kinds: [30000],
      authors: [pubkey],
      '#d': ['top8'],
      limit: 1,
    }]);
  });

  it('should return parsed friends from Kind 30000 event', async () => {
    const pubkey = 'user-pubkey-123';
    const kind30000Event = createMockEvent(30000, [
      ['d', 'top8'],
      ['title', 'Top 8 Friends'],
      ['p', 'friend1', 'wss://relay.example.com', 'Alice'],
      ['p', 'friend2', '', 'Bob'],
      ['p', 'friend3'],
    ], pubkey);

    mockNostrQuery.mockResolvedValueOnce([kind30000Event]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.friends).toHaveLength(3);
    expect(result.current.friends[0]).toEqual({
      pubkey: 'friend1',
      relay: 'wss://relay.example.com',
      petname: 'Alice',
      position: 1,
    });
    expect(result.current.friends[1].petname).toBe('Bob');
    expect(result.current.friends[2].petname).toBeUndefined();
  });

  it('should fall back to Kind 16793 for legacy profiles', async () => {
    const pubkey = 'legacy-user-pubkey';
    const legacyEvent = createMockEvent(16793, [
      ['alt', 'DiVine Space profile customization'],
      ['p', 'friend1', '', '1'],
      ['p', 'friend2', '', '2'],
    ], pubkey);

    // First query for Kind 30000 returns empty
    mockNostrQuery.mockResolvedValueOnce([]);
    // Second query for Kind 16793 returns legacy event
    mockNostrQuery.mockResolvedValueOnce([legacyEvent]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have queried for Kind 16793 as fallback
    expect(mockNostrQuery).toHaveBeenCalledWith([{
      kinds: [16793],
      authors: [pubkey],
      limit: 1,
    }]);

    expect(result.current.friends).toHaveLength(2);
    expect(result.current.friends[0].pubkey).toBe('friend1');
    expect(result.current.friends[0].position).toBe(1);
  });

  it('should return empty array when no Top 8 exists in either format', async () => {
    const pubkey = 'new-user-pubkey';

    // Both queries return empty
    mockNostrQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.friends).toEqual([]);
  });

  it('should order friends by tag position in Kind 30000', async () => {
    const pubkey = 'user-pubkey';
    const event = createMockEvent(30000, [
      ['d', 'top8'],
      ['p', 'first-friend'],
      ['p', 'second-friend'],
      ['p', 'third-friend'],
    ], pubkey);

    mockNostrQuery.mockResolvedValueOnce([event]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.friends[0].pubkey).toBe('first-friend');
    expect(result.current.friends[0].position).toBe(1);
    expect(result.current.friends[1].pubkey).toBe('second-friend');
    expect(result.current.friends[1].position).toBe(2);
    expect(result.current.friends[2].pubkey).toBe('third-friend');
    expect(result.current.friends[2].position).toBe(3);
  });

  it('should parse petnames from 4th position of p tags', async () => {
    const pubkey = 'user-pubkey';
    const event = createMockEvent(30000, [
      ['d', 'top8'],
      ['p', 'friend-pubkey', 'wss://relay.example.com', 'My Best Friend'],
    ], pubkey);

    mockNostrQuery.mockResolvedValueOnce([event]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.friends[0].petname).toBe('My Best Friend');
  });

  it('should prefer Kind 30000 over Kind 16793 when both exist', async () => {
    const pubkey = 'user-with-both';
    const kind30000Event = createMockEvent(30000, [
      ['d', 'top8'],
      ['p', 'new-friend-1'],
      ['p', 'new-friend-2'],
    ], pubkey);

    // Kind 30000 returns result
    mockNostrQuery.mockResolvedValueOnce([kind30000Event]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only have made one query since Kind 30000 was found
    expect(mockNostrQuery).toHaveBeenCalledTimes(1);
    expect(result.current.friends[0].pubkey).toBe('new-friend-1');
  });

  it('should handle errors gracefully', async () => {
    const pubkey = 'error-pubkey';
    mockNostrQuery.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.friends).toEqual([]);
  });

  it('should limit results to 8 friends maximum', async () => {
    const pubkey = 'popular-user';
    const tags: string[][] = [
      ['d', 'top8'],
      ...Array.from({ length: 15 }, (_, i) => ['p', `friend${i + 1}`]),
    ];
    const event = createMockEvent(30000, tags, pubkey);

    mockNostrQuery.mockResolvedValueOnce([event]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.friends).toHaveLength(8);
    expect(result.current.friends[7].pubkey).toBe('friend8');
  });

  it('should provide updateTop8 function for mutations', async () => {
    const pubkey = 'test-user';
    mockNostrQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.updateTop8).toBe('function');
  });

  it('should provide isUpdating state during mutations', async () => {
    const pubkey = 'test-user';
    mockNostrQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useTop8Friends(pubkey), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isUpdating).toBe(false);
  });
});

describe('useTop8Friends - query key behavior', () => {
  let mockNostrQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNostrQuery = vi.fn().mockResolvedValue([]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: {
        query: mockNostrQuery,
        event: vi.fn(),
        req: vi.fn(),
        close: vi.fn(),
      },
    } as unknown as ReturnType<typeof useNostr>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should use pubkey in query key for caching', async () => {
    const pubkey1 = 'user-1';
    const pubkey2 = 'user-2';

    // Create separate query clients to avoid cache interference
    const queryClient1 = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const queryClient2 = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Render hook for first user
    const { result: result1 } = renderHook(
      () => useTop8Friends(pubkey1),
      {
        wrapper: ({ children }) =>
          React.createElement(QueryClientProvider, { client: queryClient1 }, children)
      }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    // Render hook for second user
    const { result: result2 } = renderHook(
      () => useTop8Friends(pubkey2),
      {
        wrapper: ({ children }) =>
          React.createElement(QueryClientProvider, { client: queryClient2 }, children)
      }
    );

    await waitFor(() => {
      expect(result2.current.isLoading).toBe(false);
    });

    // Should have queried for both users
    expect(mockNostrQuery).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ authors: [pubkey1] })])
    );
    expect(mockNostrQuery).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ authors: [pubkey2] })])
    );
  });
});
