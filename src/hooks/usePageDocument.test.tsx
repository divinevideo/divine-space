import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

import { useNostr } from '@nostrify/react';
import { siteConfigToTags } from '@/lib/parseSiteConfig';
import type { SiteConfigInput } from '@/types/site';
import { useSiteConfig } from './useSiteConfig';

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
});
