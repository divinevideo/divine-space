import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock modules before importing the hook
vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

// Import the mocked module to control it
import { useNostr } from '@nostrify/react';
import { useSiteConfig, useUpdateSiteConfig, SITE_CONFIG_QUERY_KEY } from './useSiteConfig';

// Helper to create mock site config event
function createMockSiteEvent(
  pubkey: string,
  tags: string[][] = [['d', 'profile']],
  content: string = ''
): NostrEvent {
  return {
    id: 'event123',
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 30512,
    tags,
    content,
    sig: 'sig123',
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

describe('useSiteConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when pubkey is undefined', async () => {
    const mockQuery = vi.fn().mockResolvedValue([]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSiteConfig(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // When query is disabled, data is undefined (not null)
    expect(result.current.data).toBeUndefined();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('queries for site config with correct filter', async () => {
    const pubkey = 'testpubkey123';
    const mockQuery = vi.fn().mockResolvedValue([
      createMockSiteEvent(pubkey, [['d', 'profile']]),
    ]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSiteConfig(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQuery).toHaveBeenCalledWith([
      {
        kinds: [30512],
        authors: [pubkey],
        '#d': ['profile'],
        limit: 1,
      },
    ]);
  });

  it('returns parsed site config from event', async () => {
    const pubkey = 'testpubkey123';
    const mockQuery = vi.fn().mockResolvedValue([
      createMockSiteEvent(
        pubkey,
        [
          ['d', 'profile'],
          ['name', "Test User's Space"],
          ['title', 'Welcome'],
          ['summary', 'A test profile'],
          ['z', 'org.divine.bento'],
        ]
      ),
    ]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSiteConfig(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.identifier).toBe('profile');
    expect(result.current.data!.name).toBe("Test User's Space");
    expect(result.current.data!.title).toBe('Welcome');
    expect(result.current.data!.summary).toBe('A test profile');
    expect(result.current.data!.renderingEngine).toBe('org.divine.bento');
  });

  it('returns null when no site config exists', async () => {
    const pubkey = 'testpubkey123';
    const mockQuery = vi.fn().mockResolvedValue([]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSiteConfig(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('parses widgets from JSON content', async () => {
    const pubkey = 'testpubkey123';
    const widgets = [
      { id: 'profile', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      { id: 'top8', type: 'top8', x: 2, y: 0, w: 2, h: 2 },
    ];
    const mockQuery = vi.fn().mockResolvedValue([
      createMockSiteEvent(
        pubkey,
        [['d', 'profile']],
        JSON.stringify({ widgets })
      ),
    ]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSiteConfig(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.widgets).toHaveLength(2);
    expect(result.current.data!.widgets[0].id).toBe('profile');
    expect(result.current.data!.widgets[1].type).toBe('top8');
  });

  it('parses theme customization from content', async () => {
    const pubkey = 'testpubkey123';
    const content = JSON.stringify({
      widgets: [],
      theme: {
        colors: { primary: '#ff00ff' },
        effects: ['sparkles'],
      },
      customCss: '.test { color: red; }',
    });
    const mockQuery = vi.fn().mockResolvedValue([
      createMockSiteEvent(pubkey, [['d', 'profile']], content),
    ]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSiteConfig(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.customization).toBeDefined();
    expect(result.current.data!.customization!.colors!.primary).toBe('#ff00ff');
    expect(result.current.data!.customization!.effects).toEqual(['sparkles']);
    expect(result.current.data!.customization!.customCss).toBe('.test { color: red; }');
  });

  it('parses content includes', async () => {
    const pubkey = 'testpubkey123';
    const mockQuery = vi.fn().mockResolvedValue([
      createMockSiteEvent(pubkey, [
        ['d', 'profile'],
        ['include', 'k', '34236'],
        ['include', 'k', '1'],
        ['include', 'a', '30000:pubkey:top8'],
      ]),
    ]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSiteConfig(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.includes).toHaveLength(3);
    expect(result.current.data!.includes[0]).toEqual({ type: 'kind', value: '34236' });
    expect(result.current.data!.includes[1]).toEqual({ type: 'kind', value: '1' });
    expect(result.current.data!.includes[2]).toEqual({ type: 'address', value: '30000:pubkey:top8' });
  });

  it('parses theme reference', async () => {
    const pubkey = 'testpubkey123';
    const mockQuery = vi.fn().mockResolvedValue([
      createMockSiteEvent(pubkey, [
        ['d', 'profile'],
        ['x', '30514:themepubkey:divine-bento', 'packagehash123'],
      ]),
    ]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useSiteConfig(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data!.themeId).toBe('30514:themepubkey:divine-bento');
    expect(result.current.data!.themePackageHash).toBe('packagehash123');
  });

  it('provides correct query key', () => {
    const pubkey = 'testpubkey123';
    expect(SITE_CONFIG_QUERY_KEY(pubkey)).toEqual(['site-config', pubkey]);
  });
});

describe('useUpdateSiteConfig', () => {
  // Note: Testing mutation hooks requires more complex setup with auth context
  // These tests verify the basic structure and types

  it('should be importable', () => {
    expect(useUpdateSiteConfig).toBeDefined();
    expect(typeof useUpdateSiteConfig).toBe('function');
  });
});
