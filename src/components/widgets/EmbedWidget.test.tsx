import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { EmbedWidget } from './EmbedWidget';
import type { Widget, EmbedWidgetConfig } from '@/types/widgets';

// Helper to create a base widget config
function createWidget(config?: EmbedWidgetConfig, overrides: Partial<Widget> = {}): Widget {
  return {
    id: 'embed-1',
    type: 'embed',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    config,
    ...overrides,
  };
}

describe('EmbedWidget', () => {
  describe('YouTube Embed', () => {
    it('renders YouTube embed from watch URL', () => {
      const widget = createWidget({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test YouTube Video',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      const iframe = screen.getByTitle('Test YouTube Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('renders YouTube embed from youtu.be URL', () => {
      const widget = createWidget({
        url: 'https://youtu.be/dQw4w9WgXcQ',
        title: 'YouTube Short URL',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      const iframe = screen.getByTitle('YouTube Short URL');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });

  describe('Vimeo Embed', () => {
    it('renders Vimeo embed from standard URL', () => {
      const widget = createWidget({
        url: 'https://vimeo.com/123456789',
        title: 'Test Vimeo Video',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      const iframe = screen.getByTitle('Test Vimeo Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://player.vimeo.com/video/123456789');
    });
  });

  describe('Empty State', () => {
    it('shows placeholder when no URL is configured', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      expect(screen.getByText('No embed configured')).toBeInTheDocument();
    });

    it('shows placeholder with empty URL', () => {
      const widget = createWidget({ url: '' });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      expect(screen.getByText('No embed configured')).toBeInTheDocument();
    });

    it('shows edit prompt in editing mode', () => {
      const widget = createWidget();

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={true} />
        </TestApp>
      );

      expect(screen.getByText('Click to add embed URL')).toBeInTheDocument();
    });
  });

  describe('URL Security', () => {
    it('blocks javascript: URLs', () => {
      const widget = createWidget({
        url: 'javascript:alert("xss")',
        title: 'Malicious Embed',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      // Should show placeholder instead of iframe
      expect(screen.getByText('Invalid embed URL')).toBeInTheDocument();
      expect(screen.queryByRole('iframe')).not.toBeInTheDocument();
    });

    it('blocks data: URLs', () => {
      const widget = createWidget({
        url: 'data:text/html,<script>alert("xss")</script>',
        title: 'Data URL',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      expect(screen.getByText('Invalid embed URL')).toBeInTheDocument();
      expect(screen.queryByRole('iframe')).not.toBeInTheDocument();
    });

    it('allows https: URLs', () => {
      const widget = createWidget({
        url: 'https://example.com/embed',
        title: 'Safe Embed',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      const iframe = screen.getByTitle('Safe Embed');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://example.com/embed');
    });

    it('allows http: URLs for backwards compatibility', () => {
      const widget = createWidget({
        url: 'http://example.com/embed',
        title: 'HTTP Embed',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      const iframe = screen.getByTitle('HTTP Embed');
      expect(iframe).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses title for iframe accessibility', () => {
      const widget = createWidget({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Accessible Video Title',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      const iframe = screen.getByTitle('Accessible Video Title');
      expect(iframe).toBeInTheDocument();
    });

    it('uses default title when none provided', () => {
      const widget = createWidget({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      const iframe = screen.getByTitle('Embedded content');
      expect(iframe).toBeInTheDocument();
    });

    it('iframe has proper security attributes', () => {
      const widget = createWidget({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Video',
      });

      render(
        <TestApp>
          <EmbedWidget widget={widget} pubkey="test-pubkey" isEditing={false} />
        </TestApp>
      );

      const iframe = screen.getByTitle('Video');
      expect(iframe).toHaveAttribute('sandbox');
      expect(iframe).toHaveAttribute('loading', 'lazy');
    });
  });
});
