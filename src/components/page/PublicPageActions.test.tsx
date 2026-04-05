import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import type { PageDocument } from '@/types/page';
import { PublicPageActions } from './PublicPageActions';

const navigate = vi.fn();
const toggleFollow = vi.fn();
const toggleSave = vi.fn();
const toast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    toast,
    dismiss: vi.fn(),
    toasts: [],
  })),
}));

vi.mock('@/hooks/useDivineSocial', () => ({
  useIsFollowing: vi.fn(),
  useToggleFollow: vi.fn(),
}));

vi.mock('@/hooks/usePageSave', () => ({
  usePageSave: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
import { useIsFollowing, useToggleFollow } from '@/hooks/useDivineSocial';
import { usePageSave } from '@/hooks/usePageSave';

const page: PageDocument = {
  identifier: 'profile',
  shell: { type: 'sidebar-bento' },
  includes: [],
  widgets: [],
  title: 'Creator Home',
};

describe('PublicPageActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      pubkey: 'viewer-pubkey',
      isAuthenticated: true,
      isLoading: false,
      signer: undefined,
      isKeycastLogin: false,
      logout: vi.fn(),
    } as never);
    vi.mocked(useIsFollowing).mockReturnValue({
      data: false,
      isLoading: false,
    } as never);
    vi.mocked(useToggleFollow).mockReturnValue({
      mutate: toggleFollow,
      isPending: false,
    } as never);
    vi.mocked(usePageSave).mockReturnValue({
      isSaved: false,
      isLoading: false,
      toggleSave: {
        mutate: toggleSave,
        isPending: false,
      },
    } as never);
  });

  it('lets an authenticated viewer follow, save, and message from the public page', () => {
    render(
      <TestApp>
        <PublicPageActions page={page} pubkey="author-pubkey" />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /follow/i }));
    fireEvent.click(screen.getByRole('button', { name: /save page/i }));
    fireEvent.click(screen.getByRole('button', { name: /message/i }));

    expect(toggleFollow).toHaveBeenCalledWith({
      targetPubkey: 'author-pubkey',
      isCurrentlyFollowing: false,
    });
    expect(toggleSave).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/messages?with=author-pubkey');
  });

  it('warns instead of mutating when the viewer is logged out', () => {
    vi.mocked(useAuth).mockReturnValue({
      pubkey: undefined,
      isAuthenticated: false,
      isLoading: false,
      signer: undefined,
      isKeycastLogin: false,
      logout: vi.fn(),
    } as never);

    render(
      <TestApp>
        <PublicPageActions page={page} pubkey="author-pubkey" />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /follow/i }));

    expect(toggleFollow).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringMatching(/log in/i),
      variant: 'destructive',
    }));
  });
});
