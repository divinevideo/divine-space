import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ContactActionsWidget } from './ContactActionsWidget';
import type { Widget } from '@/types/widgets';

// TestApp lacks KeycastProvider, so useAuth (and hooks depending on it) must be mocked.
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ pubkey: undefined, isAuthenticated: false }),
}));

vi.mock('@/hooks/useDivineSocial', () => ({
  useIsFollowing: () => ({ data: false }),
  useToggleFollow: () => ({ mutate: vi.fn() }),
}));

const widget: Widget = { id: 'c1', type: 'contact-actions', x: 0, y: 0, w: 1, h: 1 };

describe('ContactActionsWidget', () => {
  it('renders myspace contact actions', () => {
    render(
      <TestApp>
        <ContactActionsWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/message/i)).toBeInTheDocument();
    expect(screen.getByText(/add to friends/i)).toBeInTheDocument();
    expect(screen.getByText(/add to favorites/i)).toBeInTheDocument();
  });

  it('disables add to friends when logged out', () => {
    render(
      <TestApp>
        <ContactActionsWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByRole('button', { name: /add to friends/i })).toBeDisabled();
  });
});
