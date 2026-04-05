import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import type { PageDocument } from '@/types/page';
import { createPageRevisionSnapshot } from '@/lib/pageHistory';

vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

vi.mock('./useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./useKeycastPublish', () => ({
  useKeycastPublish: vi.fn(),
}));

import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useCurrentUser } from './useCurrentUser';
import { useKeycastPublish } from './useKeycastPublish';
import { usePageHistory } from './usePageHistory';

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
      ['alt', 'DiVine Space page revision'],
    ],
    content,
    sig: 'sig',
  };
}

const page: PageDocument = {
  identifier: 'profile-draft',
  shell: { type: 'sidebar-bento' },
  includes: [],
  widgets: [],
  title: 'Creator Home',
};

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
      isAuthenticated: true,
      isLoading: false,
      pubkey: 'owner-pubkey',
      signer: {
        nip44: {
          encrypt: mockEncrypt,
          decrypt: mockDecrypt,
        },
      },
      isKeycastLogin: false,
      logout: vi.fn(),
    } as never);
    vi.mocked(useCurrentUser).mockReturnValue({
      user: {
        pubkey: 'owner-pubkey',
        signer: {
          nip44: {
            encrypt: mockEncrypt,
            decrypt: mockDecrypt,
          },
        },
      },
    } as never);
    vi.mocked(useKeycastPublish).mockReturnValue({
      mutateAsync: mockPublish,
      isPending: false,
    } as never);
  });

  it('publishes a private revision snapshot encrypted to the owner', async () => {
    mockEncrypt.mockResolvedValue('ciphertext');
    mockPublish.mockResolvedValue({ id: 'published-revision' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageHistory('profile-draft'), { wrapper });

    await result.current.createRevision.mutateAsync({
      page,
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
    mockDecrypt.mockResolvedValue(JSON.stringify(createPageRevisionSnapshot(page, 'save-draft', 123)));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageHistory('profile-draft'), { wrapper });

    await waitFor(() => {
      expect(result.current.revisions).toHaveLength(1);
    });

    expect(mockQuery).toHaveBeenCalledWith([
      {
        kinds: [31234],
        authors: ['owner-pubkey'],
        '#k': ['30512'],
        limit: 50,
      },
    ]);
    expect(mockDecrypt).toHaveBeenCalledWith('owner-pubkey', 'ciphertext');
    expect(result.current.revisions[0].page.title).toBe('Creator Home');
  });

  it('supports revision history when auth comes from the unified auth hook', async () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      user: undefined,
    } as never);
    mockQuery.mockResolvedValue([createMockRevisionEvent()]);
    mockDecrypt.mockResolvedValue(JSON.stringify(createPageRevisionSnapshot(page, 'save-draft', 123)));

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePageHistory('profile-draft'), { wrapper });

    await waitFor(() => {
      expect(result.current.revisions).toHaveLength(1);
    });

    await result.current.createRevision.mutateAsync({
      page,
      source: 'save-draft',
    });

    expect(mockQuery).toHaveBeenCalledWith([
      {
        kinds: [31234],
        authors: ['owner-pubkey'],
        '#k': ['30512'],
        limit: 50,
      },
    ]);
    expect(mockEncrypt).toHaveBeenCalledWith('owner-pubkey', expect.any(String));
    expect(mockPublish).toHaveBeenCalled();
  });
});
