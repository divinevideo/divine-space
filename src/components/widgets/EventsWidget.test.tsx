import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { EventsWidget } from './EventsWidget';
import type { Widget } from '@/types/widgets';
import type { NostrEvent } from '@nostrify/nostrify';

vi.mock('@/hooks/useCalendarEvents', () => ({
  useCalendarEvents: vi.fn(),
}));

import { useCalendarEvents } from '@/hooks/useCalendarEvents';

const mockUseCalendarEvents = vi.mocked(useCalendarEvents);

function createWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: 'events-widget-1',
    type: 'events' as unknown as Widget['type'],
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    ...overrides,
  } as Widget;
}

function createEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: 'event-1',
    pubkey: 'author-pubkey',
    created_at: 1710000000,
    kind: 31923,
    content: 'A live show with friends.',
    tags: [
      ['d', 'live-show'],
      ['title', 'Live Show'],
      ['summary', 'An evening set'],
      ['location', 'Brooklyn, NY'],
      ['start', '1715000000'],
      ['D', '19900'],
    ],
    sig: 'sig',
    ...overrides,
  };
}

describe('EventsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upcoming calendar events', () => {
    mockUseCalendarEvents.mockReturnValue({
      data: [
        createEvent(),
      ],
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as never);

    render(
      <TestApp>
        <EventsWidget widget={createWidget()} pubkey="author-pubkey" isEditing={false} />
      </TestApp>
    );

    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Live Show')).toBeInTheDocument();
    expect(screen.getByText('An evening set')).toBeInTheDocument();
    expect(screen.getByText('Brooklyn, NY')).toBeInTheDocument();
    expect(screen.getByText('A live show with friends.')).toBeInTheDocument();
  });

  it('shows an empty state when there are no events', () => {
    mockUseCalendarEvents.mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as never);

    render(
      <TestApp>
        <EventsWidget widget={createWidget()} pubkey="author-pubkey" isEditing={false} />
      </TestApp>
    );

    expect(screen.getByText('No upcoming events yet')).toBeInTheDocument();
  });

  it('shows an editing prompt when empty and editing is enabled', () => {
    mockUseCalendarEvents.mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
    } as never);

    render(
      <TestApp>
        <EventsWidget widget={createWidget()} pubkey="author-pubkey" isEditing={true} />
      </TestApp>
    );

    expect(screen.getByText('Add upcoming events')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
  });
});
