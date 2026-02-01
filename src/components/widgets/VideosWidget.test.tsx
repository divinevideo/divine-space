import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { VideosWidget } from './VideosWidget';
import type { Widget } from '@/types/widgets';

// Mock the useDivineUserVideos hook
vi.mock('@/hooks/useDivineUser', () => ({
  useDivineUserVideos: vi.fn(),
}));

import { useDivineUserVideos } from '@/hooks/useDivineUser';

const mockUseDivineUserVideos = useDivineUserVideos as ReturnType<typeof vi.fn>;

describe('VideosWidget', () => {
  const testPubkey = 'test-pubkey-123';

  const mockVideos = [
    {
      id: 'video-1',
      title: 'Test Video 1',
      thumbnail: 'https://example.com/thumb1.jpg',
      kind: 34235,
      pubkey: testPubkey,
    },
    {
      id: 'video-2',
      title: 'Test Short',
      thumbnail: 'https://example.com/thumb2.jpg',
      kind: 34236,
      pubkey: testPubkey,
    },
    {
      id: 'video-3',
      title: 'Another Video',
      thumbnail: 'https://example.com/thumb3.jpg',
      kind: 34235,
      pubkey: testPubkey,
    },
  ];

  const createWidget = (overrides: Partial<Widget> = {}): Widget => ({
    id: 'videos-widget-1',
    type: 'videos',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with skeletons', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const widget = createWidget();

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should show the Videos title
    expect(screen.getByText('Videos')).toBeInTheDocument();
  });

  it('renders videos when data is loaded', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const widget = createWidget();

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should show video thumbnails with alt text
    expect(screen.getByAltText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByAltText('Test Short')).toBeInTheDocument();
    expect(screen.getByAltText('Another Video')).toBeInTheDocument();
  });

  it('renders empty state when no videos', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const widget = createWidget();

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    expect(screen.getByText('No videos yet')).toBeInTheDocument();
  });

  it('shows video kind badges', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const widget = createWidget();

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should show Video badges for kind 34235
    const videoBadges = screen.getAllByText('Video');
    expect(videoBadges.length).toBe(2);

    // Should show Short badge for kind 34236
    expect(screen.getByText('Short')).toBeInTheDocument();
  });

  it('renders videos as links when not editing', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const widget = createWidget();

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should have links to video pages
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3);
    expect(links[0]).toHaveAttribute('href', '/video/video-1');
    expect(links[1]).toHaveAttribute('href', '/video/video-2');
    expect(links[2]).toHaveAttribute('href', '/video/video-3');
  });

  it('does not render links when in editing mode', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const widget = createWidget();

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={true} />
      </TestApp>
    );

    // Should not have any links in editing mode
    const links = screen.queryAllByRole('link');
    expect(links.length).toBe(0);

    // But images should still be visible
    expect(screen.getByAltText('Test Video 1')).toBeInTheDocument();
  });

  it('applies editing ring style when in editing mode', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const widget = createWidget();

    const { container } = render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={true} />
      </TestApp>
    );

    // The card should have editing styles
    const card = container.querySelector('.widget');
    expect(card).toHaveClass('ring-2', 'ring-primary/50', 'cursor-move');
  });

  it('requests correct number of videos based on widget size', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: [],
      isLoading: false,
    });

    // Large widget (3x3) should request more videos
    const largeWidget = createWidget({ w: 3, h: 3 });

    render(
      <TestApp>
        <VideosWidget widget={largeWidget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should have called the hook with a limit based on widget size
    expect(mockUseDivineUserVideos).toHaveBeenCalledWith(testPubkey, {
      limit: expect.any(Number),
    });

    // For a 3x3 widget: Math.min(3 * 3 * 2, 9) = 9
    const callArgs = mockUseDivineUserVideos.mock.calls[0];
    expect(callArgs[1].limit).toBe(9);
  });

  it('respects maxVideos config option', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const widget = createWidget({
      config: { maxVideos: 2 },
    });

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should only show 2 videos even though 3 are available
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
  });

  it('filters videos by kind when configured', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    // Only show shorts (kind 34236)
    const widget = createWidget({
      config: { kind: 34236 },
    });

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should only show the short video
    expect(screen.getByAltText('Test Short')).toBeInTheDocument();
    expect(screen.queryByAltText('Test Video 1')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Another Video')).not.toBeInTheDocument();
  });

  it('handles undefined videos gracefully', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const widget = createWidget();

    render(
      <TestApp>
        <VideosWidget widget={widget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should show empty state
    expect(screen.getByText('No videos yet')).toBeInTheDocument();
  });

  it('uses 1 column grid for narrow widgets', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const narrowWidget = createWidget({ w: 1 });

    const { container } = render(
      <TestApp>
        <VideosWidget widget={narrowWidget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should have grid-cols-1 class
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
  });

  it('uses 2 column grid for medium widgets', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const mediumWidget = createWidget({ w: 2 });

    const { container } = render(
      <TestApp>
        <VideosWidget widget={mediumWidget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should have grid-cols-2 class
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2');
  });

  it('uses 3 column grid for wide widgets', () => {
    mockUseDivineUserVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
    });

    const wideWidget = createWidget({ w: 3 });

    const { container } = render(
      <TestApp>
        <VideosWidget widget={wideWidget} pubkey={testPubkey} isEditing={false} />
      </TestApp>
    );

    // Should have grid-cols-3 class
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-3');
  });
});
