import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PageDocument } from '@/types/page';
import AppRouter from './AppRouter';

const useSubdomainMock = vi.fn();
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

const aiSuggestion = {
  message: 'AI refresh',
  operations: [
    { type: 'set_page_title' as const, title: 'AI Creator Home' },
    { type: 'add_widget' as const, widgetType: 'text' as const },
  ],
};

vi.mock('./hooks/useSubdomain', () => ({
  useSubdomain: () => useSubdomainMock(),
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

vi.mock('./components/ScrollToTop', () => ({
  ScrollToTop: () => null,
}));

vi.mock('./pages/Index', () => ({
  default: () => <div>Index</div>,
}));

vi.mock('./pages/Browse', () => ({
  default: () => <div>Browse</div>,
}));

vi.mock('./pages/Search', () => ({
  default: () => <div>Search</div>,
}));

vi.mock('./pages/Leaderboard', () => ({
  default: () => <div>Leaderboard</div>,
}));

vi.mock('./pages/Video', () => ({
  default: () => <div>Video</div>,
}));

vi.mock('./pages/Embed', () => ({
  default: () => <div>Embed</div>,
}));

vi.mock('./pages/Friends', () => ({
  default: () => <div>Friends</div>,
}));

vi.mock('./pages/Settings', () => ({
  default: () => <div>Settings</div>,
}));

vi.mock('./pages/MySpaceSettings', () => ({
  default: () => <div>MySpaceSettings</div>,
}));

vi.mock('./pages/PageStudio', async () => {
  const { usePageStudioController } = await import('./pages/pageStudio/PageStudioProvider');

  return {
    default: function MockPageStudio() {
      const { workingDraft } = usePageStudioController();

      return (
        <div>
          <div data-testid="page-studio-title">{workingDraft?.title}</div>
          <div data-testid="page-studio-widget-count">{workingDraft?.widgets.length ?? 0}</div>
        </div>
      );
    },
  };
});

vi.mock('./pages/PageStudioAi', async () => {
  const router = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  const { usePageStudioController } = await import('./pages/pageStudio/PageStudioProvider');

  return {
    default: function MockPageStudioAi() {
      const { applySuggestion } = usePageStudioController();

      return (
        <div>
          <button type="button" onClick={() => applySuggestion(aiSuggestion)}>
            Apply AI suggestion
          </button>
          <router.Link to="/studio/page">Back to page editor</router.Link>
        </div>
      );
    },
  };
});

vi.mock('./pages/Messages', () => ({
  default: () => <div>Messages</div>,
}));

vi.mock('./pages/Callback', () => ({
  default: () => <div>Callback</div>,
}));

vi.mock('./pages/NIP19Page', () => ({
  NIP19Page: () => <div>NIP19Page</div>,
}));

vi.mock('./pages/Profile', () => ({
  default: () => <div>Profile</div>,
}));

vi.mock('./pages/ClaimName', () => ({
  default: () => <div>ClaimName</div>,
}));

vi.mock('./pages/NotFound', () => ({
  default: () => <div>NotFound</div>,
}));

describe('AppRouter integration', () => {
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
    useSubdomainMock.mockReturnValue({
      isSubdomain: false,
      subdomain: null,
      pubkey: null,
      isUnclaimed: false,
    });
    window.history.replaceState({}, '', '/studio/ai');
  });

  it('keeps the same draft when navigating from the AI route to the page route', async () => {
    render(<AppRouter />);

    fireEvent.click(await screen.findByRole('button', { name: /apply ai suggestion/i }));
    fireEvent.click(screen.getByRole('link', { name: /back to page editor/i }));

    await waitFor(() => {
      expect(screen.getByTestId('page-studio-title')).toHaveTextContent('AI Creator Home');
    });
    expect(screen.getByTestId('page-studio-widget-count')).toHaveTextContent('1');
  });
});
