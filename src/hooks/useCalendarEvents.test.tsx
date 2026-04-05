import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import type { ReactNode } from 'react';
import { useCalendarEvents } from './useCalendarEvents';

vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

import { useNostr } from '@nostrify/react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
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

function createEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'event-id',
    pubkey: 'author-pubkey',
    created_at: 1710000000,
    kind: 31923,
    content: '',
    tags: [
      ['d', 'default'],
      ['title', 'Default title'],
      ['start', '1710003600'],
      ['D', '19828'],
    ],
    sig: 'sig',
    ...overrides,
  };
}

describe('useCalendarEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries authored calendar events with NIP-52 kinds', async () => {
    const pubkey = 'author-pubkey';
    const mockQuery = vi.fn().mockResolvedValue([]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCalendarEvents(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQuery).toHaveBeenCalledWith([
      {
        kinds: [31922, 31923],
        authors: [pubkey],
        limit: 50,
      },
    ]);
  });

  it('filters out malformed calendar events and sorts upcoming events first', async () => {
    const pubkey = 'author-pubkey';
    const now = Math.floor(Date.now() / 1000);
    const validFutureTime = createEvent({
      id: 'future-time',
      created_at: now,
      kind: 31923,
      content: 'Time show',
      tags: [
        ['d', 'time-show'],
        ['title', 'Time Show'],
        ['summary', 'A future show'],
        ['start', String(now + 86400)],
        ['D', '19900'],
      ],
    });
    const validFutureDate = createEvent({
      id: 'future-date',
      kind: 31922,
      content: 'Date appearance',
      tags: [
        ['d', 'date-appearance'],
        ['title', 'Date Appearance'],
        ['start', '2099-12-25'],
        ['end', '2099-12-26'],
      ],
    });
    const malformedMissingTitle = createEvent({
      id: 'missing-title',
      tags: [
        ['d', 'missing-title'],
        ['start', '1716000000'],
        ['D', '19912'],
      ],
    });
    const malformedWrongKind = createEvent({
      id: 'wrong-kind',
      kind: 1,
      tags: [
        ['d', 'wrong-kind'],
        ['title', 'Wrong kind'],
        ['start', '1717000000'],
      ],
    });

    const mockQuery = vi.fn().mockResolvedValue([
      malformedWrongKind,
      validFutureTime,
      malformedMissingTitle,
      validFutureDate,
    ]);
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCalendarEvents(pubkey), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].id).toBe('future-time');
    expect(result.current.data?.[1].id).toBe('future-date');
  });

  it('returns no events when pubkey is undefined', async () => {
    const mockQuery = vi.fn();
    vi.mocked(useNostr).mockReturnValue({
      nostr: { query: mockQuery } as never,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCalendarEvents(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
