import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import type { PageDocument } from '@/types/page';
import Settings from './Settings';
import MySpaceSettings from './MySpaceSettings';
import PageStudio from './PageStudio';

const ensureStarterDraft = vi.fn();
const publishDraft = vi.fn();
const draftPage: { current: PageDocument | null } = {
  current: {
    identifier: 'profile-draft',
    shell: { type: 'sidebar-bento' },
    includes: [],
    widgets: [],
    title: 'My Page',
    summary: 'Draft page preview',
  },
};

vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    pubkey: 'a'.repeat(64),
    isAuthenticated: true,
    isLoading: false,
    signer: undefined,
    isKeycastLogin: false,
    logout: vi.fn(),
  })),
}));

vi.mock('@/hooks/useLoggedInAccounts', () => ({
  useLoggedInAccounts: vi.fn(() => ({
    currentUser: { pubkey: 'a'.repeat(64) },
  })),
}));

vi.mock('@/contexts/KeycastContext', () => ({
  useKeycast: vi.fn(() => ({
    pubkey: 'a'.repeat(64),
    isAuthenticated: true,
  })),
}));

vi.mock('@/hooks/usePageDocument', () => ({
  useDraftPageDocument: vi.fn(() => ({
    data: draftPage.current,
    isLoading: false,
    isSuccess: true,
  })),
  useEnsureStarterDraft: vi.fn(() => ({
    ensureStarterDraft: {
      mutate: ensureStarterDraft,
      mutateAsync: ensureStarterDraft,
      isPending: false,
    },
  })),
  usePublishPageDocument: vi.fn(() => ({
    publishDraft: {
      mutate: publishDraft,
      mutateAsync: publishDraft,
      isPending: false,
    },
  })),
}));

describe('PageStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [],
      title: 'My Page',
      summary: 'Draft page preview',
    };
  });

  it('does not create a starter draft when one already exists', async () => {
    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByTestId('bento-grid')).toBeInTheDocument();
    });

    expect(ensureStarterDraft).not.toHaveBeenCalled();
  });

  it('creates a starter draft when the owner has none', async () => {
    draftPage.current = null;

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    await waitFor(() => {
      expect(ensureStarterDraft).toHaveBeenCalled();
    });
  });

  it('shows draft preview and publish controls', async () => {
    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [],
      title: 'My Page',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    expect(await screen.findByRole('button', { name: /publish/i })).toBeInTheDocument();
    expect(screen.getByTestId('bento-grid')).toBeInTheDocument();
  });

  it('redirects authenticated profile settings to the studio', () => {
    render(
      <TestApp>
        <Settings />
      </TestApp>
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/studio/page');
  });

  it('redirects authenticated MySpace settings to the studio', () => {
    render(
      <TestApp>
        <MySpaceSettings />
      </TestApp>
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/studio/page');
  });
});
