import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PageDocument } from '@/types/page';
import Profile from './Profile';

vi.mock('@unhead/react', () => ({
  useSeoMeta: vi.fn(),
  useHead: vi.fn(),
}));

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock('@/hooks/useDivineUser', () => ({
  useDivineUser: vi.fn(() => ({
    data: {
      profile: {},
      social: {},
      stats: {},
    },
    isLoading: false,
    error: null,
  })),
  useDivineUserVideosInfinite: vi.fn(() => ({
    data: { pages: [[]] },
    isLoading: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  })),
}));

vi.mock('@/hooks/useDivineSocial', () => ({
  useIsFollowing: vi.fn(() => ({ data: false, isLoading: false })),
  useToggleFollow: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ pubkey: 'viewer', isAuthenticated: true })),
}));

vi.mock('@/hooks/useMySpaceProfile', () => ({
  useMySpaceProfile: vi.fn(() => ({ data: null })),
  getPresetStyleInfo: vi.fn(),
}));

vi.mock('@/hooks/useUserPosts', () => ({
  useUserPostsInfinite: vi.fn(() => ({
    data: { pages: [[]] },
    isLoading: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  })),
}));

vi.mock('react-intersection-observer', () => ({
  useInView: vi.fn(() => ({ ref: vi.fn(), inView: false })),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

vi.mock('@/hooks/usePageDocument', () => ({
  usePublishedPageDocument: vi.fn(),
}));

vi.mock('@/components/page/PublicPageRenderer', () => ({
  PublicPageRenderer: ({ page, pubkey }: { page: PageDocument; pubkey: string }) => (
    <div data-testid="public-page-renderer" data-identifier={page.identifier} data-pubkey={pubkey} />
  ),
}));

import { usePublishedPageDocument } from '@/hooks/usePageDocument';

describe('Profile hosted page rendering', () => {
  it('renders the published hosted page when one exists', () => {
    const pubkey = 'f'.repeat(64);

    vi.mocked(usePublishedPageDocument).mockReturnValue({
      data: {
        identifier: 'profile',
        shell: { type: 'sidebar-bento' },
        includes: [],
        widgets: [],
      },
      isLoading: false,
    } as never);

    render(<Profile pubkey={pubkey} />);

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('public-page-renderer')).toBeInTheDocument();
  });
});
