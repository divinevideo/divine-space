import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Messages from './Messages';

vi.mock('@unhead/react', () => ({
  useSeoMeta: vi.fn(),
}));

vi.mock('@/components/dm/DMMessagingInterface', () => ({
  DMMessagingInterface: ({
    initialPubkey,
  }: {
    initialPubkey?: string | null;
  }) => <div data-testid="dm-interface" data-initial-pubkey={initialPubkey ?? ''} />,
}));

describe('Messages', () => {
  it('passes the requested recipient pubkey into the DM interface', () => {
    render(
      <MemoryRouter initialEntries={['/messages?with=author-pubkey']}>
        <Messages />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dm-interface')).toHaveAttribute('data-initial-pubkey', 'author-pubkey');
  });
});
