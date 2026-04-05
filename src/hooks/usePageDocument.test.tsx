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

vi.mock('./useAuthor', () => ({
  useAuthor: vi.fn(),
}));

vi.mock('./useMySpaceProfile', () => ({
  useMySpaceProfile: vi.fn(),
}));

import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useAuthor } from './useAuthor';
import { useKeycastPublish } from './useKeycastPublish';
import { useMySpaceProfile } from './useMySpaceProfile';
import { siteConfigToTags } from '@/lib/parseSiteConfig';
import type { SiteConfigInput } from '@/types/site';
import { useSiteConfig } from './useSiteConfig';
import {
  useEnsureStarterDraft,
  usePublishedPageDocument,
  usePublishPageDocument,
} from './usePageDocument';

function createMockSiteEvent(
  pubkey: string,
  identifier: string,
  content: string = ''
): NostrEvent {
  return {
    id: 'event123',
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 30512,
    tags: [['d', identifier]],
    content,
    sig: 'sig123',
  };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('page document plumbing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries and parses the requested draft identifier', async () => {
    const pubkey = 'testpubkey123';
    const draftEvent = createMockSiteEvent(pubkey, 'profile-draft', JSON.stringify({
      widgets: [],
    }));
    const mockQuery = vi.fn().mockResolvedValue([draftEvent]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useSiteConfig(pubkey, 'profile-draft'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQuery).toHaveBeenCalledWith([
      {
        kinds: [30512],
        authors: [pubkey],
        '#d': ['profile-draft'],
        limit: 1,
      },
    ]);
    expect(queryClient.getQueryCache().getAll().map((query) => query.queryKey)).toContainEqual([
      'site-config',
      pubkey,
      'profile-draft',
    ]);
    expect(result.current.data?.identifier).toBe('profile-draft');
  });

  it('serializes the requested identifier into site config tags', () => {
    const input: SiteConfigInput = {};

    const tags = siteConfigToTags(input, 'testpubkey123', 'profile-draft');

    expect(tags).toContainEqual(['d', 'profile-draft']);
  });

  it('fetches the published page with identifier profile', async () => {
    const pubkey = 'publishedpubkey123';
    const publishedEvent = createMockSiteEvent(pubkey, 'profile', JSON.stringify({
      widgets: [],
    }));
    const mockQuery = vi.fn().mockResolvedValue([publishedEvent]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => usePublishedPageDocument(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.data?.identifier).toBe('profile');
    });
  });

  it('publishes the draft page into the published identifier', async () => {
    const pubkey = 'owner-pubkey';
    const draftEvent = createMockSiteEvent(pubkey, 'profile-draft', JSON.stringify({
      widgets: [
        { id: 'profile', type: 'profile', x: 0, y: 0, w: 1, h: 1 },
      ],
    }));
    const mockQuery = vi.fn().mockResolvedValue([draftEvent]);
    const mockPublish = vi.fn().mockResolvedValue({ id: 'published-event' });

    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });
    vi.mocked(useAuth).mockReturnValue({
      pubkey,
      isAuthenticated: true,
      isLoading: false,
      signer: undefined,
      isKeycastLogin: false,
      logout: vi.fn(),
    });
    vi.mocked(useKeycastPublish).mockReturnValue({
      mutateAsync: mockPublish,
      isPending: false,
    } as never);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => usePublishPageDocument(pubkey), { wrapper });

    await result.current.publishDraft.mutateAsync(undefined);

    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      tags: expect.arrayContaining([['d', 'profile']]),
    }));
  });

  it('bootstraps a starter draft when none exists', async () => {
    const pubkey = 'starter-pubkey';
    const mockQuery = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const mockPublish = vi.fn().mockResolvedValue({ id: 'draft-event' });

    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });
    vi.mocked(useAuth).mockReturnValue({
      pubkey,
      isAuthenticated: true,
      isLoading: false,
      signer: undefined,
      isKeycastLogin: false,
      logout: vi.fn(),
    });
    vi.mocked(useKeycastPublish).mockReturnValue({
      mutateAsync: mockPublish,
      isPending: false,
    } as never);
    vi.mocked(useAuthor).mockReturnValue({
      data: {
        metadata: {
          name: 'Alice',
          about: 'Hello world',
          website: 'https://example.com',
        },
      },
    } as never);
    vi.mocked(useMySpaceProfile).mockReturnValue({
      data: {
        topFriends: [{ pubkey: 'friend-1', position: 1 }],
      },
    } as never);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useEnsureStarterDraft(pubkey), { wrapper });

    await result.current.ensureStarterDraft.mutateAsync();

    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      tags: expect.arrayContaining([['d', 'profile-draft']]),
    }));
  });
});
