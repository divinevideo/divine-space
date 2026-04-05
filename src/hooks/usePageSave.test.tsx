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

function createBookmarkEvent(tags: string[][]): NostrEvent {
  return {
    id: 'bookmark-event',
    pubkey: 'viewer-pubkey',
    created_at: 1710000000,
    kind: 10003,
    tags,
    content: '',
    sig: 'sig',
  };
}

describe('usePageSave', () => {
  const mockQuery = vi.fn();
  const mockPublish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
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
});
