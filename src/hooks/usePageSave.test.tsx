import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./useKeycastPublish', () => ({
  useKeycastPublish: vi.fn(),
}));

import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useKeycastPublish } from './useKeycastPublish';
import { usePageSave } from './usePageSave';

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

function createBookmarkEvent(tags: string[][], overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'bookmark-event',
    pubkey: 'viewer-pubkey',
    created_at: 1710000000,
    kind: 10003,
    tags,
    content: '',
    sig: 'sig',
    ...overrides,
  };
}

/** A relay stream that answers with `events` and then signals EOSE. */
function settledWith(events: NostrEvent[]) {
  return async function* req(): AsyncIterable<[string, ...unknown[]]> {
    for (const event of events) yield ['EVENT', 'sub', event];
    yield ['EOSE', 'sub'];
  };
}

/**
 * A relay stream that answers (possibly with events) but never signals EOSE —
 * what the pool produces when a relay drops or closes the subscription.
 */
function neverSettles(events: NostrEvent[] = []) {
  return async function* req(): AsyncIterable<[string, ...unknown[]]> {
    for (const event of events) yield ['EVENT', 'sub', event];
  };
}

describe('usePageSave', () => {
  const mockQuery = vi.fn();
  const mockReq = vi.fn();
  const mockPublish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery, req: mockReq } as never,
    });
    vi.mocked(useAuth).mockReturnValue({
      pubkey: 'viewer-pubkey',
      isAuthenticated: true,
      isLoading: false,
      signer: undefined,
      isKeycastLogin: false,
      logout: vi.fn(),
    } as never);
    vi.mocked(useKeycastPublish).mockReturnValue({
      mutateAsync: mockPublish,
      isPending: false,
    } as never);
  });

  it('reads whether the current viewer has saved a hosted page', async () => {
    mockQuery.mockResolvedValue([
      createBookmarkEvent([
        ['a', '30512:author-pubkey:profile'],
      ]),
    ]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageSave('author-pubkey', 'profile'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSaved).toBe(true);
    });

    expect(mockQuery).toHaveBeenCalledWith([
      {
        kinds: [10003],
        authors: ['viewer-pubkey'],
        limit: 1,
      },
    ]);
  });

  it('publishes an updated 10003 bookmark list when toggling save', async () => {
    mockQuery.mockResolvedValue([]);
    mockReq.mockImplementation(settledWith([]));
    mockPublish.mockResolvedValue({ id: 'saved-bookmarks' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageSave('author-pubkey', 'profile'), { wrapper });

    await result.current.toggleSave.mutateAsync();

    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      kind: 10003,
      tags: expect.arrayContaining([
        ['a', '30512:author-pubkey:profile'],
      ]),
    }));
  });

  it('refuses to publish when the bookmark read never completes', async () => {
    // The bug this guards: an unanswered read used to be indistinguishable
    // from an empty list, and the publish replaced the user's whole kind 10003
    // — including divine-mobile's saved videos — with a single `a` tag.
    mockQuery.mockResolvedValue([]);
    mockReq.mockImplementation(neverSettles());

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageSave('author-pubkey', 'profile'), { wrapper });

    await expect(result.current.toggleSave.mutateAsync()).rejects.toThrow();
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('refuses to publish when the relay answered but never signalled EOSE', async () => {
    // Partial results are not a complete read: a newer version may live on a
    // relay that never answered, so merging onto what arrived would drop it.
    mockQuery.mockResolvedValue([]);
    mockReq.mockImplementation(neverSettles([createBookmarkEvent([['e', 'existing-video']])]));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageSave('author-pubkey', 'profile'), { wrapper });

    await expect(result.current.toggleSave.mutateAsync()).rejects.toThrow();
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('preserves existing tags and private-item content when toggling', async () => {
    // divine-mobile stores saved videos as `e` tags in this same list, and
    // NIP-51 private items live in `content` as NIP-44 ciphertext this client
    // cannot read. Both must survive untouched.
    mockQuery.mockResolvedValue([]);
    mockReq.mockImplementation(settledWith([
      createBookmarkEvent(
        [['e', 'saved-video-id'], ['a', '30512:someone-else:profile']],
        { content: 'nip44-ciphertext' },
      ),
    ]));
    mockPublish.mockResolvedValue({ id: 'saved-bookmarks' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageSave('author-pubkey', 'profile'), { wrapper });

    await result.current.toggleSave.mutateAsync();

    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      content: 'nip44-ciphertext',
      tags: [
        ['e', 'saved-video-id'],
        ['a', '30512:someone-else:profile'],
        ['a', '30512:author-pubkey:profile'],
      ],
    }));
  });

  it('merges onto the newest version when relays disagree', async () => {
    // A stale copy on a faster relay must not become the base of the rewrite.
    mockQuery.mockResolvedValue([]);
    mockReq.mockImplementation(settledWith([
      createBookmarkEvent([['e', 'stale']], { id: 'old', created_at: 1710000000 }),
      createBookmarkEvent([['e', 'current']], { id: 'new', created_at: 1710000500 }),
    ]));
    mockPublish.mockResolvedValue({ id: 'saved-bookmarks' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageSave('author-pubkey', 'profile'), { wrapper });

    await result.current.toggleSave.mutateAsync();

    const published = mockPublish.mock.calls[0][0];
    expect(published.tags).toContainEqual(['e', 'current']);
    expect(published.tags).not.toContainEqual(['e', 'stale']);
    // And it must supersede the version it merged from.
    expect(published.created_at).toBeGreaterThan(1710000500);
  });

  it('removes the page from the list when it is already saved', async () => {
    mockQuery.mockResolvedValue([]);
    mockReq.mockImplementation(settledWith([
      createBookmarkEvent([
        ['e', 'saved-video-id'],
        ['a', '30512:author-pubkey:profile'],
      ]),
    ]));
    mockPublish.mockResolvedValue({ id: 'saved-bookmarks' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageSave('author-pubkey', 'profile'), { wrapper });

    await result.current.toggleSave.mutateAsync();

    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      tags: [['e', 'saved-video-id']],
    }));
  });
});
