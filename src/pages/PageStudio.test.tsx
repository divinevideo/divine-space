import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import type { PageDocument } from '@/types/page';
import type { PageCopilotSuggestion } from '@/types/pageCopilot';
import type { PageRevision } from '@/types/pageHistory';
import Settings from './Settings';
import MySpaceSettings from './MySpaceSettings';
import PageStudio from './PageStudio';

const {
  ensureStarterDraft,
  publishDraft,
  updateDraft,
  createRevision,
  toast,
  usePageHistoryMock,
} = vi.hoisted(() => ({
  ensureStarterDraft: vi.fn(),
  publishDraft: vi.fn(),
  updateDraft: vi.fn(),
  createRevision: vi.fn(),
  toast: vi.fn(),
  usePageHistoryMock: vi.fn(),
}));
const revisions: { current: PageRevision[] } = {
  current: [],
};
const aiSuggestion: PageCopilotSuggestion = {
  message: 'AI refresh',
  operations: [
    { type: 'set_page_title', title: 'AI Creator Home' },
    { type: 'add_widget', widgetType: 'text' },
  ],
};
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

vi.mock('@/hooks/useSiteConfig', () => ({
  useUpdateSiteConfig: vi.fn(() => ({
    mutateAsync: updateDraft,
    isPending: false,
  })),
}));

vi.mock('@/hooks/usePageHistory', () => ({
  usePageHistory: usePageHistoryMock,
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    toast,
  })),
}));

vi.mock('@/components/BentoGridEditor', () => ({
  BentoGridEditor: ({ onChange }: { onChange: (layout: { type: 'bento'; gridCols: number; rowHeight: number; widgets: Array<{ id: string; type: 'profile'; x: number; y: number; w: number; h: number }> }) => void }) => (
    <div data-testid="bento-grid-editor">
      <button
        type="button"
        onClick={() => onChange({
          type: 'bento',
          gridCols: 4,
          rowHeight: 150,
          widgets: [
            { id: 'profile-1', type: 'profile', x: 1, y: 0, w: 2, h: 2 },
          ],
        })}
      >
        Simulate editor change
      </button>
    </div>
  ),
}));

vi.mock('@/components/page/PageCopilotPanel', () => ({
  PageCopilotPanel: ({
    onApply,
    onRevert,
    canRevert,
  }: {
    onApply: (suggestion: PageCopilotSuggestion) => void;
    onRevert: () => void;
    canRevert: boolean;
  }) => (
    <div data-testid="page-copilot-panel" data-can-revert={canRevert ? 'yes' : 'no'}>
      <button type="button" onClick={() => onApply(aiSuggestion)}>
        Apply AI suggestion
      </button>
      <button type="button" onClick={onRevert} disabled={!canRevert}>
        Revert AI suggestion
      </button>
    </div>
  ),
}));

vi.mock('@/components/page/PageRevisionHistory', () => ({
  PageRevisionHistory: ({
    revisions,
    onRestore,
  }: {
    revisions: PageRevision[];
    onRestore: (revision: PageRevision) => void;
  }) => (
    <div data-testid="page-revision-history">
      {revisions.map((revision) => (
        <button
          key={revision.id}
          type="button"
          onClick={() => onRestore(revision)}
        >
          Restore {revision.page.title}
        </button>
      ))}
    </div>
  ),
}));

describe('PageStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePageHistoryMock.mockImplementation(() => ({
      revisions: revisions.current,
      createRevision: {
        mutateAsync: createRevision,
        isPending: false,
      },
    }));
    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [],
      title: 'My Page',
      summary: 'Draft page preview',
    };
    revisions.current = [];
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

  it('uses the active draft identifier for revision history', async () => {
    draftPage.current = {
      identifier: 'creator-home-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [],
      title: 'Creator Home',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    await waitFor(() => {
      expect(usePageHistoryMock).toHaveBeenCalledWith('creator-home-draft');
    });
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
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByTestId('bento-grid-editor')).toBeInTheDocument();
    expect(screen.getByTestId('bento-grid')).toBeInTheDocument();
    expect(screen.getByTestId('page-copilot-panel')).toBeInTheDocument();
  });

  it('saves draft edits before publishing', async () => {
    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /simulate editor change/i }));
    fireEvent.click(screen.getByRole('button', { name: /publish/i }));

    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalled();
      expect(publishDraft).toHaveBeenCalled();
    });
  });

  it('applies and reverts AI draft changes', async () => {
    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    expect(screen.getAllByText('My Page').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /apply ai suggestion/i }));

    await waitFor(() => {
      expect(screen.getAllByText('AI Creator Home').length).toBeGreaterThan(0);
    });
    expect(screen.getByTestId('page-copilot-panel')).toHaveAttribute('data-can-revert', 'yes');

    fireEvent.click(screen.getByRole('button', { name: /revert ai suggestion/i }));

    await waitFor(() => {
      expect(screen.getAllByText('My Page').length).toBeGreaterThan(0);
    });
    expect(screen.getByTestId('page-copilot-panel')).toHaveAttribute('data-can-revert', 'no');
  });

  it('disables AI revert after a later manual edit', async () => {
    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /apply ai suggestion/i }));

    await waitFor(() => {
      expect(screen.getByTestId('page-copilot-panel')).toHaveAttribute('data-can-revert', 'yes');
    });

    fireEvent.click(screen.getByRole('button', { name: /simulate editor change/i }));

    await waitFor(() => {
      expect(screen.getByTestId('page-copilot-panel')).toHaveAttribute('data-can-revert', 'no');
    });
  });

  it('saves AI draft edits before publishing', async () => {
    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /apply ai suggestion/i }));
    fireEvent.click(screen.getByRole('button', { name: /publish/i }));

    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'AI Creator Home',
          widgets: expect.arrayContaining([
            expect.objectContaining({ type: 'text' }),
          ]),
        })
      );
      expect(publishDraft).toHaveBeenCalled();
    });
  });

  it('creates a revision before saving the draft', async () => {
    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /simulate editor change/i }));
    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(createRevision).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'save-draft' })
      );
      expect(updateDraft).toHaveBeenCalled();
    });

    expect(createRevision.mock.invocationCallOrder[0]).toBeLessThan(updateDraft.mock.invocationCallOrder[0]);
  });

  it('warns when revision history fails during save but still saves the draft', async () => {
    createRevision.mockRejectedValueOnce(new Error('history failed'));

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /simulate editor change/i }));
    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalled();
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Revision history failed to save',
        variant: 'destructive',
      })
    );
  });

  it('creates a publish revision before publishing', async () => {
    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /publish/i }));

    await waitFor(() => {
      expect(createRevision).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'publish' })
      );
      expect(publishDraft).toHaveBeenCalled();
    });
  });

  it('restores a saved revision into the working draft without publishing', async () => {
    revisions.current = [
      {
        id: 'rev-1',
        createdAt: 123,
        source: 'save-draft',
        pageIdentifier: 'profile-draft',
        page: {
          identifier: 'profile-draft',
          shell: { type: 'sidebar-bento' },
          includes: [],
          widgets: [],
          title: 'Restored Home',
        },
      },
    ];

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(screen.getByRole('button', { name: /restore restored home/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Restored Home').length).toBeGreaterThan(0);
    });
    expect(publishDraft).not.toHaveBeenCalled();
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
