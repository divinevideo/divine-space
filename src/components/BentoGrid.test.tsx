import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { BentoGrid } from './BentoGrid';
import type { BentoLayout, Widget } from '@/types/widgets';

// Mock all widget components
vi.mock('@/components/widgets/ProfileWidget', () => ({
  ProfileWidget: ({ widget, pubkey, isEditing }: { widget: Widget; pubkey: string; isEditing: boolean }) => (
    <div data-testid="profile-widget" data-widget-id={widget.id} data-pubkey={pubkey} data-editing={isEditing}>
      ProfileWidget
    </div>
  ),
}));

vi.mock('@/components/widgets/Top8Widget', () => ({
  Top8Widget: ({ widget, pubkey, isEditing }: { widget: Widget; pubkey: string; isEditing: boolean }) => (
    <div data-testid="top8-widget" data-widget-id={widget.id} data-pubkey={pubkey} data-editing={isEditing}>
      Top8Widget
    </div>
  ),
}));

vi.mock('@/components/widgets/MusicWidget', () => ({
  MusicWidget: ({ widget, pubkey, isEditing }: { widget: Widget; pubkey: string; isEditing: boolean }) => (
    <div data-testid="music-widget" data-widget-id={widget.id} data-pubkey={pubkey} data-editing={isEditing}>
      MusicWidget
    </div>
  ),
}));

vi.mock('@/components/widgets/LinksWidget', () => ({
  LinksWidget: ({ widget, pubkey, isEditing }: { widget: Widget; pubkey: string; isEditing: boolean }) => (
    <div data-testid="links-widget" data-widget-id={widget.id} data-pubkey={pubkey} data-editing={isEditing}>
      LinksWidget
    </div>
  ),
}));

vi.mock('@/components/widgets/MoodWidget', () => ({
  MoodWidget: ({ widget, pubkey, isEditing }: { widget: Widget; pubkey: string; isEditing: boolean }) => (
    <div data-testid="mood-widget" data-widget-id={widget.id} data-pubkey={pubkey} data-editing={isEditing}>
      MoodWidget
    </div>
  ),
}));

vi.mock('@/components/widgets/VideosWidget', () => ({
  VideosWidget: ({ widget, pubkey, isEditing }: { widget: Widget; pubkey: string; isEditing: boolean }) => (
    <div data-testid="videos-widget" data-widget-id={widget.id} data-pubkey={pubkey} data-editing={isEditing}>
      VideosWidget
    </div>
  ),
}));

describe('BentoGrid', () => {
  const testPubkey = 'npub1test123';

  const createWidget = (overrides: Partial<Widget> = {}): Widget => ({
    id: 'widget-1',
    type: 'profile',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    ...overrides,
  });

  const createLayout = (widgets: Widget[] = []): BentoLayout => ({
    type: 'bento',
    gridCols: 4,
    rowHeight: 100,
    widgets,
  });

  describe('empty grid', () => {
    it('renders an empty grid with no widgets', () => {
      const layout = createLayout([]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      const grid = screen.getByTestId('bento-grid');
      expect(grid).toBeInTheDocument();
      expect(grid.children.length).toBe(0);
    });

    it('applies correct grid styles', () => {
      const layout = createLayout([]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      const grid = screen.getByTestId('bento-grid');
      expect(grid).toHaveStyle({ display: 'grid' });
    });
  });

  describe('rendering a single widget', () => {
    it('renders a profile widget', () => {
      const layout = createLayout([
        createWidget({ id: 'profile-1', type: 'profile' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('profile-widget')).toBeInTheDocument();
      expect(screen.getByText('ProfileWidget')).toBeInTheDocument();
    });

    it('renders a top8 widget', () => {
      const layout = createLayout([
        createWidget({ id: 'top8-1', type: 'top8' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('top8-widget')).toBeInTheDocument();
    });

    it('renders a music widget', () => {
      const layout = createLayout([
        createWidget({ id: 'music-1', type: 'music' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('music-widget')).toBeInTheDocument();
    });

    it('renders a links widget', () => {
      const layout = createLayout([
        createWidget({ id: 'links-1', type: 'links' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('links-widget')).toBeInTheDocument();
    });

    it('renders a mood widget', () => {
      const layout = createLayout([
        createWidget({ id: 'mood-1', type: 'mood' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('mood-widget')).toBeInTheDocument();
    });

    it('renders a videos widget', () => {
      const layout = createLayout([
        createWidget({ id: 'videos-1', type: 'videos' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('videos-widget')).toBeInTheDocument();
    });
  });

  describe('rendering multiple widgets', () => {
    it('renders multiple widgets of different types', () => {
      const layout = createLayout([
        createWidget({ id: 'profile-1', type: 'profile', x: 0, y: 0 }),
        createWidget({ id: 'top8-1', type: 'top8', x: 2, y: 0 }),
        createWidget({ id: 'music-1', type: 'music', x: 0, y: 2 }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('profile-widget')).toBeInTheDocument();
      expect(screen.getByTestId('top8-widget')).toBeInTheDocument();
      expect(screen.getByTestId('music-widget')).toBeInTheDocument();
    });

    it('renders correct number of widgets', () => {
      const layout = createLayout([
        createWidget({ id: 'w1', type: 'profile' }),
        createWidget({ id: 'w2', type: 'links' }),
        createWidget({ id: 'w3', type: 'mood' }),
        createWidget({ id: 'w4', type: 'videos' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      const grid = screen.getByTestId('bento-grid');
      expect(grid.children.length).toBe(4);
    });
  });

  describe('handling unknown widget types', () => {
    it('renders a placeholder for gallery widget (not yet implemented)', () => {
      const layout = createLayout([
        createWidget({ id: 'gallery-1', type: 'gallery' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('placeholder-widget')).toBeInTheDocument();
      expect(screen.getByText('gallery')).toBeInTheDocument();
    });

    it('renders a placeholder for spacer widget (not yet implemented)', () => {
      const layout = createLayout([
        createWidget({ id: 'spacer-1', type: 'spacer' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('placeholder-widget')).toBeInTheDocument();
      expect(screen.getByText('spacer')).toBeInTheDocument();
    });

    it('handles mix of implemented and unimplemented widgets', () => {
      const layout = createLayout([
        createWidget({ id: 'profile-1', type: 'profile' }),
        createWidget({ id: 'gallery-1', type: 'gallery' }),
        createWidget({ id: 'music-1', type: 'music' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      expect(screen.getByTestId('profile-widget')).toBeInTheDocument();
      expect(screen.getByTestId('music-widget')).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-widget')).toBeInTheDocument();
      expect(screen.getByText('gallery')).toBeInTheDocument();
    });
  });

  describe('passing correct props to widgets', () => {
    it('passes pubkey to widgets', () => {
      const layout = createLayout([
        createWidget({ id: 'profile-1', type: 'profile' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      const widget = screen.getByTestId('profile-widget');
      expect(widget).toHaveAttribute('data-pubkey', testPubkey);
    });

    it('passes widget data to widgets', () => {
      const layout = createLayout([
        createWidget({ id: 'my-unique-widget', type: 'top8' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      const widget = screen.getByTestId('top8-widget');
      expect(widget).toHaveAttribute('data-widget-id', 'my-unique-widget');
    });

    it('passes isEditing=false by default', () => {
      const layout = createLayout([
        createWidget({ id: 'profile-1', type: 'profile' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      const widget = screen.getByTestId('profile-widget');
      expect(widget).toHaveAttribute('data-editing', 'false');
    });

    it('passes isEditing=true when specified', () => {
      const layout = createLayout([
        createWidget({ id: 'profile-1', type: 'profile' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} isEditing={true} />
        </TestApp>
      );

      const widget = screen.getByTestId('profile-widget');
      expect(widget).toHaveAttribute('data-editing', 'true');
    });

    it('passes isEditing prop to all widgets', () => {
      const layout = createLayout([
        createWidget({ id: 'profile-1', type: 'profile' }),
        createWidget({ id: 'music-1', type: 'music' }),
        createWidget({ id: 'links-1', type: 'links' }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} isEditing={true} />
        </TestApp>
      );

      expect(screen.getByTestId('profile-widget')).toHaveAttribute('data-editing', 'true');
      expect(screen.getByTestId('music-widget')).toHaveAttribute('data-editing', 'true');
      expect(screen.getByTestId('links-widget')).toHaveAttribute('data-editing', 'true');
    });
  });

  describe('grid positioning', () => {
    it('applies grid column and row positioning styles', () => {
      const layout = createLayout([
        createWidget({ id: 'profile-1', type: 'profile', x: 1, y: 2, w: 2, h: 3 }),
      ]);

      render(
        <TestApp>
          <BentoGrid layout={layout} pubkey={testPubkey} />
        </TestApp>
      );

      const grid = screen.getByTestId('bento-grid');
      const widgetWrapper = grid.firstChild as HTMLElement;

      // CSS grid uses 1-based indexing, so x=1 becomes column-start=2
      expect(widgetWrapper).toHaveStyle({
        gridColumn: '2 / span 2',
        gridRow: '3 / span 3',
      });
    });
  });
});
