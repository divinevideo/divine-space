import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { BlurbsWidget } from './BlurbsWidget';
import type { Widget } from '@/types/widgets';

// Mock the useAuthor hook (matches existing widget test pattern)
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

import { useAuthor } from '@/hooks/useAuthor';

const mockUseAuthor = vi.mocked(useAuthor);

const widget: Widget = { id: 'b1', type: 'blurbs', x: 0, y: 0, w: 3, h: 2 };

describe('BlurbsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthor.mockReturnValue({
      data: { metadata: { about: 'I like long walks on the beach.' } },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);
  });

  it('renders both section headers', () => {
    render(
      <TestApp>
        <BlurbsWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/about me/i)).toBeInTheDocument();
    expect(screen.getByText(/who i'd like to meet/i)).toBeInTheDocument();
  });

  it('renders the about text from profile metadata', () => {
    render(
      <TestApp>
        <BlurbsWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText('I like long walks on the beach.')).toBeInTheDocument();
  });

  it('renders the meet text from widget config', () => {
    const withMeet: Widget = { ...widget, config: { meet: 'Cool people' } };
    render(
      <TestApp>
        <BlurbsWidget widget={withMeet} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText('Cool people')).toBeInTheDocument();
  });

  it('shows loading state while profile is fetching', () => {
    mockUseAuthor.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <BlurbsWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText(/nothing here yet/i)).not.toBeInTheDocument();
  });

  it('shows empty state when no about text is available', () => {
    mockUseAuthor.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <BlurbsWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument();
  });
});
