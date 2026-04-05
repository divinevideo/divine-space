import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
const isMobileState = vi.hoisted(() => ({
  current: false,
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

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-surface">{children}</div>
  ),
  DrawerContent: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    ['data-testid']?: string;
  }) => (
    <div data-testid={props['data-testid'] ?? 'drawer-content'}>
      {children}
    </div>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    children,
    modal = true,
  }: {
    children: React.ReactNode;
    modal?: boolean;
  }) => (
    <div data-testid="sheet-surface" data-modal={modal ? 'true' : 'false'}>
      {children}
    </div>
  ),
  SheetContent: ({
    children,
    modal = true,
    showOverlay = true,
    ...props
  }: {
    children: React.ReactNode;
    ['data-testid']?: string;
    modal?: boolean;
    showOverlay?: boolean;
  }) => (
    <div
      data-testid={props['data-testid'] ?? 'sheet-content'}
      data-modal={modal ? 'true' : 'false'}
    >
      {modal && showOverlay ? <div data-testid="sheet-overlay" /> : null}
      {children}
    </div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => isMobileState.current),
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
  BentoGridEditor: ({
    layout,
    onChange,
    selectedWidgetId,
    onSelectWidget,
  }: {
    layout: {
      type: 'bento';
      gridCols: number;
      rowHeight: number;
      widgets: Array<{ id: string; type: 'profile'; x: number; y: number; w: number; h: number }>;
    };
    onChange: (layout: {
      type: 'bento';
      gridCols: number;
      rowHeight: number;
      widgets: Array<{ id: string; type: 'profile'; x: number; y: number; w: number; h: number }>;
    }) => void;
    selectedWidgetId?: string;
    onSelectWidget?: (widgetId: string) => void;
  }) => (
    <div data-testid="bento-grid-editor" data-widget-count={layout.widgets.length}>
      <div data-testid="editor-widget-count">{layout.widgets.length}</div>
      <div data-testid="editor-widget-ids">{layout.widgets.map((widget) => widget.id).join(',')}</div>
      {layout.widgets.map((widget) => (
        <button
          key={widget.id}
          type="button"
          data-testid={`widget-${widget.id}`}
          data-x={widget.x}
          data-y={widget.y}
          data-w={widget.w}
          data-h={widget.h}
          data-selected={selectedWidgetId === widget.id ? 'yes' : 'no'}
          onClick={() => onSelectWidget?.(widget.id)}
        >
          {widget.type} widget
        </button>
      ))}
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
    isMobileState.current = false;
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
      expect(screen.getByTestId('bento-grid-editor')).toBeInTheDocument();
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

  it('renders the manual canvas shell without preview, copilot, or history panels', async () => {
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
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-copilot-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-revision-history')).not.toBeInTheDocument();
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

  it('renders add widget in the shell header and appends a widget through the route menu', async () => {
    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    const banner = screen.getByRole('banner');
    const topBar = within(banner);
    expect(topBar.getByRole('button', { name: /add widget/i })).toBeInTheDocument();

    expect(screen.getByTestId('editor-widget-count')).toHaveTextContent('0');

    fireEvent.click(topBar.getByRole('button', { name: /add widget/i }));
    fireEvent.click(await screen.findByTestId('add-widget-profile'));

    expect(await screen.findByTestId('editor-widget-count')).toHaveTextContent('1');
    expect(screen.getByTestId('editor-widget-ids')).toHaveTextContent(/profile-/);
  });

  it('opens the temporary inspector when a widget is selected and closes it on dismiss', async () => {
    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [
        { id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      ],
      title: 'My Page',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(await screen.findByTestId('widget-profile-1'));

    const inspector = await screen.findByTestId('page-studio-inspector');
    expect(inspector).toBeInTheDocument();
    expect(within(inspector).getByText(/profile widget/i)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /close inspector/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('page-studio-inspector')).not.toBeInTheDocument();
    });
  });

  it('updates the editor route state when inspector layout fields change', async () => {
    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [
        { id: 'profile-1', type: 'profile', x: 1.2, y: 2.7, w: 2.4, h: 2.6 },
      ],
      title: 'My Page',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(await screen.findByTestId('widget-profile-1'));

    const inspector = await screen.findByTestId('page-studio-inspector');
    fireEvent.change(within(inspector).getByRole('spinbutton', { name: 'X' }), {
      target: { value: '2.7' },
    });

    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-x', '2');
    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-y', '3');
    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-w', '2');
    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-h', '3');
  });

  it('clamps inspector geometry before saving draft', async () => {
    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [
        { id: 'profile-1', type: 'profile', x: 1.2, y: 2.7, w: 2.4, h: 2.6 },
      ],
      title: 'My Page',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(await screen.findByTestId('widget-profile-1'));

    const inspector = await screen.findByTestId('page-studio-inspector');
    fireEvent.change(within(inspector).getByRole('spinbutton', { name: 'Y' }), {
      target: { value: '-5.2' },
    });
    fireEvent.change(within(inspector).getByRole('spinbutton', { name: 'Width' }), {
      target: { value: '3.8' },
    });

    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-y', '0');
    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-w', '4');
    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-x', '0');
    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-h', '3');

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(updateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: [
            expect.objectContaining({
              id: 'profile-1',
              x: 0,
              y: 0,
              w: 4,
              h: 3,
            }),
          ],
        })
      );
    });
  });

  it('renders the desktop inspector surface when not mobile', async () => {
    isMobileState.current = false;

    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [
        { id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      ],
      title: 'My Page',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(await screen.findByTestId('widget-profile-1'));

    expect(await screen.findByTestId('sheet-surface')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drawer-surface')).not.toBeInTheDocument();
  });

  it('renders the mobile inspector surface when mobile', async () => {
    isMobileState.current = true;

    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [
        { id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      ],
      title: 'My Page',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(await screen.findByTestId('widget-profile-1'));

    expect(await screen.findByTestId('drawer-surface')).toBeInTheDocument();
    expect(screen.queryByTestId('sheet-surface')).not.toBeInTheDocument();
  });

  it('keeps the desktop canvas active while the inspector stays open', async () => {
    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [
        { id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
        { id: 'profile-2', type: 'profile', x: 2, y: 0, w: 2, h: 2 },
      ],
      title: 'My Page',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(await screen.findByTestId('widget-profile-1'));

    const inspector = await screen.findByTestId('page-studio-inspector');
    expect(within(inspector).getByText(/profile widget/i)).toBeVisible();
    expect(screen.queryByTestId('sheet-overlay')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('widget-profile-2'));

    expect(screen.getByTestId('widget-profile-1')).toHaveAttribute('data-selected', 'no');
    expect(screen.getByTestId('widget-profile-2')).toHaveAttribute('data-selected', 'yes');
    expect(within(screen.getByTestId('page-studio-inspector')).getByText(/profile widget/i)).toBeVisible();
  });

  it('removes the selected widget from the inspector and closes the surface', async () => {
    draftPage.current = {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [
        { id: 'profile-1', type: 'profile', x: 0, y: 0, w: 2, h: 2 },
      ],
      title: 'My Page',
      summary: 'Draft page preview',
    };

    render(
      <TestApp>
        <PageStudio />
      </TestApp>
    );

    fireEvent.click(await screen.findByTestId('widget-profile-1'));
    fireEvent.click(screen.getByRole('button', { name: /remove widget/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('page-studio-inspector')).not.toBeInTheDocument();
      expect(screen.getByTestId('editor-widget-count')).toHaveTextContent('0');
    });
  });
});
