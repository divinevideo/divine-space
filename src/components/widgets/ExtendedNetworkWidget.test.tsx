import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ExtendedNetworkWidget } from './ExtendedNetworkWidget';
import type { Widget } from '@/types/widgets';

// Mock the useAuthor hook
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

import { useAuthor } from '@/hooks/useAuthor';

const mockUseAuthor = vi.mocked(useAuthor);

const widget: Widget = { id: 'e1', type: 'extended-network', x: 0, y: 0, w: 4, h: 2 };

describe('ExtendedNetworkWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the extended network banner and view-my links', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'testuser' } },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ExtendedNetworkWidget widget={widget} pubkey="abc123" isEditing={false} />
      </TestApp>
    );
    expect(screen.getByText(/is in your extended network/i)).toBeInTheDocument();
    expect(screen.getByText(/view my:/i)).toBeInTheDocument();
  });
});
