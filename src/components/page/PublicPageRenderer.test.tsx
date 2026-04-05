import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { PublicPageRenderer } from './PublicPageRenderer';
import type { PageDocument } from '@/types/page';

vi.mock('@/components/widgets/ProfileWidget', () => ({
  ProfileWidget: ({ widget, pubkey, isEditing }: { widget: PageDocument['widgets'][number]; pubkey: string; isEditing: boolean }) => (
    <div data-testid="profile-widget" data-widget-id={widget.id} data-pubkey={pubkey} data-editing={isEditing}>
      ProfileWidget
    </div>
  ),
}));

vi.mock('@/components/widgets/LinksWidget', () => ({
  LinksWidget: ({ widget, pubkey, isEditing }: { widget: PageDocument['widgets'][number]; pubkey: string; isEditing: boolean }) => (
    <div data-testid="links-widget" data-widget-id={widget.id} data-pubkey={pubkey} data-editing={isEditing}>
      LinksWidget
    </div>
  ),
}));

vi.mock('./PublicPageActions', () => ({
  PublicPageActions: ({ pubkey }: { pubkey: string }) => (
    <div data-testid="public-page-actions" data-pubkey={pubkey}>
      PublicPageActions
    </div>
  ),
}));

describe('PublicPageRenderer', () => {
  const pubkey = 'npub1testpubkey';

  const page: PageDocument = {
    identifier: 'profile',
    shell: { type: 'sidebar-bento' },
    includes: [],
    widgets: [
      {
        id: 'profile-1',
        type: 'profile',
        x: 0,
        y: 0,
        w: 1,
        h: 2,
      },
      {
        id: 'links-1',
        type: 'links',
        x: 1,
        y: 0,
        w: 3,
        h: 1,
      },
    ],
    title: 'Creator Home',
    summary: 'A public sidebar-bento page',
    image: 'https://example.com/image.jpg',
    icon: 'https://example.com/icon.jpg',
  };

  it('renders the public shell and bento grid', () => {
    render(
      <TestApp>
        <PublicPageRenderer page={page} pubkey={pubkey} />
      </TestApp>
    );

    expect(screen.getByTestId('public-page-shell')).toBeInTheDocument();
    expect(screen.getByTestId('public-page-intro')).toBeInTheDocument();
    expect(screen.getByTestId('public-page-actions')).toHaveAttribute('data-pubkey', pubkey);
    expect(screen.getByTestId('bento-grid')).toBeInTheDocument();
    expect(screen.getByText('Creator Home')).toBeInTheDocument();
    expect(screen.getByText('A public sidebar-bento page')).toBeInTheDocument();
    expect(screen.getByTestId('profile-widget')).toBeInTheDocument();
    expect(screen.getByTestId('links-widget')).toBeInTheDocument();
  });

  it('falls back gracefully for unknown widget types', () => {
    const pageWithUnknownWidget: PageDocument = {
      ...page,
      widgets: [
        ...page.widgets,
        {
          id: 'unknown-1',
          type: 'quote' as never,
          x: 0,
          y: 2,
          w: 4,
          h: 1,
        },
      ],
    };

    render(
      <TestApp>
        <PublicPageRenderer page={pageWithUnknownWidget} pubkey={pubkey} />
      </TestApp>
    );

    expect(screen.getByTestId('placeholder-widget')).toBeInTheDocument();
    expect(screen.getByText('quote')).toBeInTheDocument();
  });
});
