import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ProfileDetailsWidget } from './ProfileDetailsWidget';
import type { Widget } from '@/types/widgets';

const widget: Widget = { id: 'd1', type: 'profile-details', x: 0, y: 0, w: 1, h: 1 };

describe('ProfileDetailsWidget', () => {
  it('renders detail rows from config', () => {
    const configured: Widget = {
      ...widget,
      config: { status: 'vibing', hereFor: 'friends' },
    };
    render(
      <TestApp>
        <ProfileDetailsWidget widget={configured} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText('vibing')).toBeInTheDocument();
    expect(screen.getByText(/here for/i)).toBeInTheDocument();
    expect(screen.getByText('friends')).toBeInTheDocument();
  });
});
