import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
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
import { useToggleFollow } from './useDivineSocial';

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

function createContactList(tags: string[][], overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'contact-list',
    pubkey: 'viewer-pubkey',
    created_at: 1710000000,
    kind: 3,
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

/** A relay stream that answers but never signals EOSE. */
function neverSettles(events: NostrEvent[] = []) {
  return async function* req(): AsyncIterable<[string, ...unknown[]]> {
    for (const event of events) yield ['EVENT', 'sub', event];
  };
}

describe('useToggleFollow', () => {
  const mockReq = vi.fn();
  const mockPublish = vi.fn();
  // `query` is stubbed even though the hook no longer calls it: without it, a
  // regression back to `nostr.query` would throw a TypeError here and the
  // "refuses to publish" test would pass for the wrong reason.
  const mockQuery = vi.fn().mockResolvedValue([]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockResolvedValue([]);

    vi.mocked(useNostr).mockReturnValue({
      nostr: { req: mockReq, query: mockQuery } as never,
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

  it('refuses to publish when the contact list read never completes', async () => {
    // Losing follows is the worst case of this bug: an unanswered read used to
    // look like an empty contact list, and the publish replaced every follow
    // the user had with the single one being added.
    mockReq.mockImplementation(neverSettles());

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToggleFollow(), { wrapper });

    await expect(
      result.current.mutateAsync({ targetPubkey: 'target', isCurrentlyFollowing: false }),
    ).rejects.toThrow();
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('preserves existing follows and relay preferences when following', async () => {
    mockReq.mockImplementation(settledWith([
      createContactList(
        [['p', 'existing-follow'], ['p', 'another-follow']],
        { content: '{"wss://relay.example":{"read":true,"write":true}}' },
      ),
    ]));
    mockPublish.mockResolvedValue({ id: 'contacts' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToggleFollow(), { wrapper });

    await result.current.mutateAsync({ targetPubkey: 'target', isCurrentlyFollowing: false });

    const published = mockPublish.mock.calls[0][0];
    expect(published.kind).toBe(3);
    expect(published.content).toBe('{"wss://relay.example":{"read":true,"write":true}}');
    expect(published.tags).toContainEqual(['p', 'existing-follow']);
    expect(published.tags).toContainEqual(['p', 'another-follow']);
    expect(published.tags).toContainEqual(['p', 'target', 'wss://relay.divine.video']);
  });

  it('does not append a duplicate p tag when the read list already includes the target', async () => {
    mockReq.mockImplementation(settledWith([
      createContactList([['p', 'target'], ['p', 'existing-follow']]),
    ]));
    mockPublish.mockResolvedValue({ id: 'contacts' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToggleFollow(), { wrapper });

    await result.current.mutateAsync({ targetPubkey: 'target', isCurrentlyFollowing: false });

    expect(mockPublish.mock.calls[0][0].tags).toEqual([
      ['p', 'target'],
      ['p', 'existing-follow'],
    ]);
  });

  it('removes only the unfollowed pubkey', async () => {
    mockReq.mockImplementation(settledWith([
      createContactList([['p', 'existing-follow'], ['p', 'target']]),
    ]));
    mockPublish.mockResolvedValue({ id: 'contacts' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToggleFollow(), { wrapper });

    await result.current.mutateAsync({ targetPubkey: 'target', isCurrentlyFollowing: true });

    expect(mockPublish.mock.calls[0][0].tags).toEqual([['p', 'existing-follow']]);
  });

  it('merges onto the newest contact list and supersedes it', async () => {
    // A stale copy on a faster relay must not become the base of the rewrite.
    mockReq.mockImplementation(settledWith([
      createContactList([['p', 'stale']], { id: 'old', created_at: 1710000000 }),
      createContactList([['p', 'current']], { id: 'new', created_at: 1710000500 }),
    ]));
    mockPublish.mockResolvedValue({ id: 'contacts' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useToggleFollow(), { wrapper });

    await result.current.mutateAsync({ targetPubkey: 'target', isCurrentlyFollowing: false });

    const published = mockPublish.mock.calls[0][0];
    expect(published.tags).toContainEqual(['p', 'current']);
    expect(published.tags).not.toContainEqual(['p', 'stale']);
    expect(published.created_at).toBeGreaterThan(1710000500);
  });
});
