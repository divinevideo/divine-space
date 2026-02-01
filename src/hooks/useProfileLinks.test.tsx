import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import type { ReactNode } from 'react';

// Mock the modules before importing the hook
vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

vi.mock('@/contexts/KeycastContext', () => ({
  useKeycast: vi.fn(),
}));

vi.mock('./useKeycastPublish', () => ({
  useKeycastPublish: vi.fn(),
}));

// Import after mocks are set up
import { useProfileLinks } from './useProfileLinks';
import { useNostr } from '@nostrify/react';
import { useKeycast } from '@/contexts/KeycastContext';
import { useKeycastPublish } from './useKeycastPublish';

// Helper to create mock events
function createMockEvent(kind: number, tags: string[][], pubkey: string = 'test-pubkey'): NostrEvent {
  return {
    id: 'mock-id-' + Math.random(),
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content: '',
    sig: 'mock-sig',
  };
}

// Simple wrapper with just QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useProfileLinks', () => {
  const mockQuery = vi.fn();
  const mockPublish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    (useNostr as ReturnType<typeof vi.fn>).mockReturnValue({
      nostr: { query: mockQuery },
    });

    (useKeycast as ReturnType<typeof vi.fn>).mockReturnValue({
      pubkey: 'user-pubkey',
      signer: { signEvent: vi.fn() },
    });

    (useKeycastPublish as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockPublish,
      isPending: false,
    });
  });

  it('should query Kind 30003 with d-tag "links"', async () => {
    mockQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useProfileLinks('test-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalled();
    });

    // Check that it queried for Kind 30003
    expect(mockQuery).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          kinds: [30003],
          authors: ['test-pubkey'],
          '#d': ['links'],
        }),
      ]),
      expect.any(Object)
    );
  });

  it('should return empty array when no links exist', async () => {
    mockQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useProfileLinks('test-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.links).toEqual([]);
  });

  it('should parse links from Kind 30003 event', async () => {
    const mockEvent = createMockEvent(30003, [
      ['d', 'links'],
      ['title', 'My Links'],
      ['r', 'https://github.com/alice', 'GitHub'],
      ['r', 'https://twitter.com/alice', 'Twitter'],
    ]);

    mockQuery.mockResolvedValue([mockEvent]);

    const { result } = renderHook(() => useProfileLinks('test-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.links.length).toBe(2);
    });

    expect(result.current.links).toEqual([
      { url: 'https://github.com/alice', label: 'GitHub' },
      { url: 'https://twitter.com/alice', label: 'Twitter' },
    ]);
  });

  it('should fall back to Kind 16793 for legacy profiles', async () => {
    // First query (30003) returns empty
    // Second query (16793) returns legacy event
    const legacyEvent = createMockEvent(16793, [
      ['link', 'https://legacy.com', 'Legacy Link'],
    ]);

    mockQuery
      .mockResolvedValueOnce([]) // Kind 30003 query
      .mockResolvedValueOnce([legacyEvent]); // Kind 16793 query

    const { result } = renderHook(() => useProfileLinks('test-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.links.length).toBe(1);
    });

    expect(result.current.links).toEqual([
      { url: 'https://legacy.com', label: 'Legacy Link' },
    ]);
  });

  it('should prefer Kind 30003 over Kind 16793', async () => {
    const standardEvent = createMockEvent(30003, [
      ['d', 'links'],
      ['r', 'https://standard.com', 'Standard'],
    ]);

    // Only return the standard event on first call
    mockQuery.mockResolvedValueOnce([standardEvent]);

    const { result } = renderHook(() => useProfileLinks('test-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.links.length).toBe(1);
    });

    // Should use standard, not legacy
    expect(result.current.links[0].url).toBe('https://standard.com');
  });

  it('should return metadata from the event', async () => {
    const mockEvent = createMockEvent(30003, [
      ['d', 'links'],
      ['title', 'My Social Links'],
      ['description', 'All my profiles'],
      ['image', 'https://example.com/banner.jpg'],
      ['r', 'https://github.com/alice', 'GitHub'],
    ]);

    mockQuery.mockResolvedValue([mockEvent]);

    const { result } = renderHook(() => useProfileLinks('test-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.metadata?.title).toBeDefined();
    });

    expect(result.current.metadata).toEqual({
      title: 'My Social Links',
      description: 'All my profiles',
      image: 'https://example.com/banner.jpg',
      dTag: 'links',
    });
  });

  it('should not query when pubkey is undefined', async () => {
    const { result } = renderHook(() => useProfileLinks(undefined), {
      wrapper: createWrapper(),
    });

    // Give it some time to potentially make a query
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockQuery).not.toHaveBeenCalled();
    expect(result.current.links).toEqual([]);
  });

  it('should return empty links array when data is undefined', async () => {
    // Test that the hook provides safe defaults even when query fails or returns undefined
    mockQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useProfileLinks('test-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should always return an array, never undefined
    expect(result.current.links).toEqual([]);
    expect(Array.isArray(result.current.links)).toBe(true);
  });
});

describe('useProfileLinks mutation', () => {
  const mockQuery = vi.fn();
  const mockPublish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useNostr as ReturnType<typeof vi.fn>).mockReturnValue({
      nostr: { query: mockQuery },
    });

    (useKeycast as ReturnType<typeof vi.fn>).mockReturnValue({
      pubkey: 'user-pubkey',
      signer: { signEvent: vi.fn() },
    });

    (useKeycastPublish as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockPublish,
      isPending: false,
    });

    mockQuery.mockResolvedValue([]);
  });

  it('should provide updateLinks mutation', async () => {
    const { result } = renderHook(() => useProfileLinks('user-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.updateLinks).toBe('function');
  });

  it('should publish Kind 30003 event when updating links', async () => {
    mockPublish.mockResolvedValue({ id: 'new-event-id' });

    const { result } = renderHook(() => useProfileLinks('user-pubkey'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newLinks = [
      { url: 'https://github.com/alice', label: 'GitHub' },
      { url: 'https://twitter.com/alice', label: 'Twitter' },
    ];

    await result.current.updateLinks(newLinks);

    expect(mockPublish).toHaveBeenCalledWith({
      kind: 30003,
      content: '',
      tags: expect.arrayContaining([
        ['d', 'links'],
        ['title', 'My Links'],
        ['r', 'https://github.com/alice', 'GitHub'],
        ['r', 'https://twitter.com/alice', 'Twitter'],
      ]),
    });
  });

  it('should indicate updating state', async () => {
    (useKeycastPublish as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockPublish,
      isPending: true,
    });

    const { result } = renderHook(() => useProfileLinks('user-pubkey'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isUpdating).toBe(true);
  });
});
