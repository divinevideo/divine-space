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
import { useCreatePageRevision, usePageHistory } from './usePageHistory';

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

function createMockRevisionEvent(content = 'ciphertext'): NostrEvent {
  return {
    id: 'revision-event',
    pubkey: 'owner-pubkey',
    created_at: 123,
    kind: 31234,
    tags: [
      ['d', 'rev-1'],
      ['k', '30512'],
      ['identifier', 'profile-draft'],
      ['source', 'save-draft'],
    ],
    content,
    sig: 'sig',
  };
}

describe('usePageHistory', () => {
  const mockQuery = vi.fn();
  const mockPublish = vi.fn();
  const mockEncrypt = vi.fn();
  const mockDecrypt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });
    vi.mocked(useAuth).mockReturnValue({
      pubkey: 'owner-pubkey',
      isAuthenticated: true,
      isLoading: false,
      signer: {
        getPublicKey: vi.fn(),
        signEvent: vi.fn(),
        nip44: {
          encrypt: mockEncrypt,
          decrypt: mockDecrypt,
        },
      },
      isKeycastLogin: false,
      logout: vi.fn(),
    });
    vi.mocked(useKeycastPublish).mockReturnValue({
      mutateAsync: mockPublish,
      isPending: false,
    } as never);
  });

  it('publishes a private revision snapshot encrypted to the owner', async () => {
    mockEncrypt.mockResolvedValue('ciphertext');
    mockPublish.mockResolvedValue({ id: 'published-revision' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreatePageRevision(), { wrapper });

    await result.current.createRevision.mutateAsync({
      page: {
        identifier: 'profile-draft',
        shell: { type: 'sidebar-bento' },
        includes: [],
        widgets: [],
        title: 'Creator Home',
      },
      source: 'save-draft',
    });

    expect(mockEncrypt).toHaveBeenCalledWith('owner-pubkey', expect.any(String));
    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      kind: 31234,
      tags: expect.arrayContaining([['k', '30512']]),
      content: 'ciphertext',
    }));
  });

  it('queries and decrypts page revisions for the current owner', async () => {
    mockQuery.mockResolvedValue([createMockRevisionEvent()]);
    mockDecrypt.mockResolvedValue(JSON.stringify({
      kind: 30512,
      created_at: 123,
      tags: [
        ['d', 'profile-draft'],
        ['title', 'Creator Home'],
      ],
      content: JSON.stringify({ widgets: [] }),
    }));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageHistory('owner-pubkey', 'profile-draft'), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    expect(mockQuery).toHaveBeenCalledWith([
      {
        kinds: [31234],
        authors: ['owner-pubkey'],
        '#k': ['30512'],
        limit: 50,
      },
    ]);
    expect(result.current.data?.[0].page.title).toBe('Creator Home');
  });
});
