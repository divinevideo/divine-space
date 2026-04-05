import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppRouter from './AppRouter';

const useSubdomainMock = vi.fn();

vi.mock('./hooks/useSubdomain', () => ({
  useSubdomain: () => useSubdomainMock(),
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

vi.mock('./pages/PageStudio', () => ({
  default: () => <div>PageStudio</div>,
}));

vi.mock('./pages/PageStudioAi', () => ({
  default: () => <div data-testid="page-studio-ai-route">PageStudioAi</div>,
}));

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

vi.mock('./pages/pageStudio/PageStudioProvider', () => ({
  PageStudioProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSubdomainMock.mockReturnValue({
      isSubdomain: false,
      subdomain: null,
      pubkey: null,
      isUnclaimed: false,
    });
    window.history.replaceState({}, '', '/');
  });

  it('registers the /studio/ai route on the apex domain router', async () => {
    window.history.replaceState({}, '', '/studio/ai');

    render(<AppRouter />);

    expect(await screen.findByTestId('page-studio-ai-route')).toBeInTheDocument();
  });

  it('registers the /studio/ai route on the subdomain router', async () => {
    useSubdomainMock.mockReturnValue({
      isSubdomain: true,
      subdomain: 'alice',
      pubkey: 'a'.repeat(64),
      isUnclaimed: false,
    });
    window.history.replaceState({}, '', '/studio/ai');

    render(<AppRouter />);

    expect(await screen.findByTestId('page-studio-ai-route')).toBeInTheDocument();
  });
});
