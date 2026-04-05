import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import {
  LinksWidget,
  getLinkIcon,
  parseLinksFromTags,
  type ProfileLink,
} from './LinksWidget';
import type { Widget } from '@/types/widgets';

// Mock useNostr
vi.mock('@nostrify/react', () => ({
  useNostr: () => ({
    nostr: {
      query: vi.fn().mockResolvedValue([]),
    },
  }),
}));

/**
 * Simple wrapper for testing that doesn't need full app context
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('LinksWidget', () => {
  const defaultWidget: Widget = {
    id: 'links-1',
    type: 'links',
    x: 0,
    y: 0,
    w: 1,
    h: 2,
  };

  const testPubkey = 'test-pubkey-123';

  describe('getLinkIcon', () => {
    it('returns Github icon for github.com URLs', () => {
      const Icon1 = getLinkIcon('https://github.com/user');
      const Icon2 = getLinkIcon('https://www.github.com/user/repo');

      // Check displayName or name property to verify it's the right icon
      expect(Icon1.displayName || Icon1.name).toContain('Github');
      expect(Icon2.displayName || Icon2.name).toContain('Github');
    });

    it('returns Twitter icon for twitter.com and x.com URLs', () => {
      const Icon1 = getLinkIcon('https://twitter.com/user');
      const Icon2 = getLinkIcon('https://x.com/user');

      expect(Icon1.displayName || Icon1.name).toContain('Twitter');
      expect(Icon2.displayName || Icon2.name).toContain('Twitter');
    });

    it('returns Youtube icon for youtube.com and youtu.be URLs', () => {
      const Icon1 = getLinkIcon('https://youtube.com/watch?v=123');
      const Icon2 = getLinkIcon('https://youtu.be/123');

      expect(Icon1.displayName || Icon1.name).toContain('Youtube');
      expect(Icon2.displayName || Icon2.name).toContain('Youtube');
    });

    it('returns Instagram icon for instagram.com URLs', () => {
      const Icon = getLinkIcon('https://instagram.com/user');
      expect(Icon.displayName || Icon.name).toContain('Instagram');
    });

    it('returns Linkedin icon for linkedin.com URLs', () => {
      const Icon = getLinkIcon('https://linkedin.com/in/user');
      expect(Icon.displayName || Icon.name).toContain('Linkedin');
    });

    it('returns Music icon for music-related URLs', () => {
      const Icon1 = getLinkIcon('https://spotify.com/artist/123');
      const Icon2 = getLinkIcon('https://soundcloud.com/user');
      const Icon3 = getLinkIcon('https://music.apple.com/album');

      expect(Icon1.displayName || Icon1.name).toContain('Music');
      expect(Icon2.displayName || Icon2.name).toContain('Music');
      expect(Icon3.displayName || Icon3.name).toContain('Music');
    });

    it('returns Camera icon for photography URLs', () => {
      const Icon1 = getLinkIcon('https://flickr.com/photos/user');
      const Icon2 = getLinkIcon('https://500px.com/user');
      const Icon3 = getLinkIcon('https://unsplash.com/@user');

      expect(Icon1.displayName || Icon1.name).toContain('Camera');
      expect(Icon2.displayName || Icon2.name).toContain('Camera');
      expect(Icon3.displayName || Icon3.name).toContain('Camera');
    });

    it('returns MessageCircle icon for messaging platforms', () => {
      const Icon1 = getLinkIcon('https://discord.gg/invite');
      const Icon2 = getLinkIcon('https://telegram.me/channel');
      const Icon3 = getLinkIcon('https://signal.me/#p/123');

      expect(Icon1.displayName || Icon1.name).toContain('MessageCircle');
      expect(Icon2.displayName || Icon2.name).toContain('MessageCircle');
      expect(Icon3.displayName || Icon3.name).toContain('MessageCircle');
    });

    it('returns Mail icon for mailto links', () => {
      const Icon = getLinkIcon('mailto:user@example.com');
      expect(Icon.displayName || Icon.name).toContain('Mail');
    });

    it('returns Globe icon for unknown URLs', () => {
      const Icon1 = getLinkIcon('https://example.com');
      const Icon2 = getLinkIcon('https://mywebsite.io');

      expect(Icon1.displayName || Icon1.name).toContain('Globe');
      expect(Icon2.displayName || Icon2.name).toContain('Globe');
    });
  });

  describe('parseLinksFromTags', () => {
    it('parses links from r tags', () => {
      const tags = [
        ['d', 'links'],
        ['r', 'https://github.com/alice', 'GitHub'],
        ['r', 'https://twitter.com/alice', 'Twitter'],
        ['t', 'social'],
      ];

      const links = parseLinksFromTags(tags);

      expect(links).toHaveLength(2);
      expect(links[0]).toEqual({ url: 'https://github.com/alice', label: 'GitHub' });
      expect(links[1]).toEqual({ url: 'https://twitter.com/alice', label: 'Twitter' });
    });

    it('extracts label from URL when not provided', () => {
      const tags = [['r', 'https://example.com/page']];

      const links = parseLinksFromTags(tags);

      expect(links).toHaveLength(1);
      expect(links[0].label).toBe('Example.com');
    });

    it('handles empty tags array', () => {
      const links = parseLinksFromTags([]);
      expect(links).toHaveLength(0);
    });

    it('ignores malformed r tags', () => {
      const tags = [
        ['r'], // Missing URL
        ['r', ''], // Empty URL
        ['r', 'https://valid.com', 'Valid'],
      ];

      const links = parseLinksFromTags(tags);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe('https://valid.com');
    });

    it('handles URLs with special characters in labels', () => {
      const tags = [
        ['r', 'https://example.com', 'My Awesome Website & Blog'],
      ];

      const links = parseLinksFromTags(tags);

      expect(links).toHaveLength(1);
      expect(links[0].label).toBe('My Awesome Website & Blog');
    });

    it('preserves order of links', () => {
      const tags = [
        ['r', 'https://first.com', 'First'],
        ['r', 'https://second.com', 'Second'],
        ['r', 'https://third.com', 'Third'],
      ];

      const links = parseLinksFromTags(tags);

      expect(links).toHaveLength(3);
      expect(links[0].label).toBe('First');
      expect(links[1].label).toBe('Second');
      expect(links[2].label).toBe('Third');
    });
  });

  describe('LinksWidget Component', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders without crashing', () => {
      render(
        <TestWrapper>
          <LinksWidget widget={defaultWidget} pubkey={testPubkey} isEditing={false} />
        </TestWrapper>
      );

      expect(screen.getByText('Links')).toBeInTheDocument();
    });

    it('shows empty state when no links', async () => {
      render(
        <TestWrapper>
          <LinksWidget widget={defaultWidget} pubkey={testPubkey} isEditing={false} />
        </TestWrapper>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('No links yet')).toBeInTheDocument();
      });
    });

    it('shows add button in editing mode with empty state', async () => {
      render(
        <TestWrapper>
          <LinksWidget widget={defaultWidget} pubkey={testPubkey} isEditing={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Add some links to your profile')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /add link/i })).toBeInTheDocument();
    });

    it('applies editing mode styling', () => {
      const { container } = render(
        <TestWrapper>
          <LinksWidget widget={defaultWidget} pubkey={testPubkey} isEditing={true} />
        </TestWrapper>
      );

      // Check for editing ring style
      const card = container.querySelector('.ring-2');
      expect(card).toBeInTheDocument();
    });

    it('uses custom title from config', () => {
      const widgetWithConfig: Widget = {
        ...defaultWidget,
        config: { title: 'My Links' },
      };

      render(
        <TestWrapper>
          <LinksWidget widget={widgetWithConfig} pubkey={testPubkey} isEditing={false} />
        </TestWrapper>
      );

      expect(screen.getByText('My Links')).toBeInTheDocument();
    });

    it('hides title when showTitle is false', () => {
      const widgetWithConfig: Widget = {
        ...defaultWidget,
        config: { showTitle: false },
      };

      render(
        <TestWrapper>
          <LinksWidget widget={widgetWithConfig} pubkey={testPubkey} isEditing={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Links')).not.toBeInTheDocument();
    });

    it('adapts to different widget sizes', () => {
      // Test compact mode for 1x1 widget
      const compactWidget: Widget = {
        ...defaultWidget,
        w: 1,
        h: 1,
      };

      const { rerender } = render(
        <TestWrapper>
          <LinksWidget widget={compactWidget} pubkey={testPubkey} isEditing={false} />
        </TestWrapper>
      );

      // Test larger widget
      const largeWidget: Widget = {
        ...defaultWidget,
        w: 2,
        h: 2,
      };

      rerender(
        <TestWrapper>
          <LinksWidget widget={largeWidget} pubkey={testPubkey} isEditing={false} />
        </TestWrapper>
      );

      // Component should render without errors in both sizes
      expect(screen.getByText('Links')).toBeInTheDocument();
    });

    it('renders loading skeleton initially', () => {
      const { container } = render(
        <TestWrapper>
          <LinksWidget widget={defaultWidget} pubkey={testPubkey} isEditing={false} />
        </TestWrapper>
      );

      // Should show loading skeleton
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ProfileLink type', () => {
    it('has correct structure', () => {
      const link: ProfileLink = {
        url: 'https://example.com',
        label: 'Example',
      };

      expect(link.url).toBe('https://example.com');
      expect(link.label).toBe('Example');
    });
  });
});
