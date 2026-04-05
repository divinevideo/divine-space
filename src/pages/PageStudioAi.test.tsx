import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import type { PageDocument } from '@/types/page';
import { PageStudioProvider } from '@/pages/pageStudio/PageStudioProvider';
import PageStudioAi from './PageStudioAi';

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

vi.mock('@/hooks/usePageDocument', () => ({
  useDraftPageDocument: vi.fn(() => ({
    data: draftPage.current,
    isLoading: false,
    isSuccess: true,
  })),
  useEnsureStarterDraft: vi.fn(() => ({
    ensureStarterDraft: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    },
  })),
  usePublishPageDocument: vi.fn(() => ({
    publishDraft: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    },
  })),
}));

vi.mock('@/hooks/useSiteConfig', () => ({
  useUpdateSiteConfig: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/usePageHistory', () => ({
  usePageHistory: vi.fn(() => ({
    revisions: [],
    createRevision: {
      mutateAsync: vi.fn(),
      isPending: false,
    },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/components/page/PageCopilotPanel', () => ({
  PageCopilotPanel: () => <div data-testid="page-copilot-panel" />,
}));

vi.mock('@/components/page/PageRevisionHistory', () => ({
  PageRevisionHistory: () => <div data-testid="page-revision-history" />,
}));

describe('PageStudioAi', () => {
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

  it('renders the focused AI route with a back link and no revision history card', async () => {
    render(
      <TestApp>
        <PageStudioProvider>
          <PageStudioAi />
        </PageStudioProvider>
      </TestApp>
    );

    expect(await screen.findByTestId('page-copilot-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('page-revision-history')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to page editor/i })).toHaveAttribute(
      'href',
      '/studio/page'
    );
  });
});
