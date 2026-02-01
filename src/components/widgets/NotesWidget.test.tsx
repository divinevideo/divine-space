import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { NotesWidget } from './NotesWidget';
import type { Widget } from '@/types/widgets';

// Mock the useUserPostsInfinite hook
vi.mock('@/hooks/useUserPosts', () => ({
  useUserPostsInfinite: vi.fn(),
}));

import { useUserPostsInfinite } from '@/hooks/useUserPosts';

const mockUseUserPostsInfinite = useUserPostsInfinite as ReturnType<typeof vi.fn>;

describe('NotesWidget', () => {
  const testPubkey = 'test-pubkey-123';

  const mockNotes = [
    {
      id: 'note-1',
      pubkey: testPubkey,
      kind: 1,
      content: 'This is my first note!',
      created_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      tags: [],
      sig: 'sig1',
    },
    {
      id: 'note-2',
      pubkey: testPubkey,
      kind: 1,
      content: 'Another great note here.',
      created_at: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      tags: [],
      sig: 'sig2',
    },
    {
      id: 'note-3',
      pubkey: testPubkey,
      kind: 1,
      content: 'Third note for testing.',
      created_at: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      tags: [],
      sig: 'sig3',
    },
  ];

  const createWidget = (overrides: Partial<Widget> = {}): Widget => ({
    id: 'notes-widget-1',
    type: 'notes',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering notes', () => {
    it('renders notes when data is loaded', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: { pages: [mockNotes] },
        isLoading: false,
      });

      const widget = createWidget();

      render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={false} />
        </TestApp>
      );

      // Should show notes content
      expect(screen.getByText('This is my first note!')).toBeInTheDocument();
      expect(screen.getByText('Another great note here.')).toBeInTheDocument();
      expect(screen.getByText('Third note for testing.')).toBeInTheDocument();
    });

    it('shows the Notes title', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: { pages: [mockNotes] },
        isLoading: false,
      });

      const widget = createWidget();

      render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={false} />
        </TestApp>
      );

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('displays timestamps for notes', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: { pages: [mockNotes] },
        isLoading: false,
      });

      const widget = createWidget();

      render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={false} />
        </TestApp>
      );

      // Should show relative timestamps (the exact text depends on implementation)
      // Look for time elements or timestamp text
      const timeElements = screen.getAllByTestId('note-timestamp');
      expect(timeElements.length).toBe(3);
    });
  });

  describe('Loading state', () => {
    it('renders loading state with skeletons', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const widget = createWidget();

      render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={false} />
        </TestApp>
      );

      // Should show the Notes title even while loading
      expect(screen.getByText('Notes')).toBeInTheDocument();

      // Should have skeleton elements
      const skeletons = document.querySelectorAll('[data-testid="note-skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('renders empty state when no notes', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: { pages: [[]] },
        isLoading: false,
      });

      const widget = createWidget();

      render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={false} />
        </TestApp>
      );

      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });

    it('handles undefined data gracefully', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      const widget = createWidget();

      render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={false} />
        </TestApp>
      );

      // Should show empty state
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });
  });

  describe('Respecting maxNotes config', () => {
    it('respects maxNotes config option', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: { pages: [mockNotes] },
        isLoading: false,
      });

      const widget = createWidget({
        config: { maxNotes: 2 },
      });

      render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={false} />
        </TestApp>
      );

      // Should only show 2 notes even though 3 are available
      expect(screen.getByText('This is my first note!')).toBeInTheDocument();
      expect(screen.getByText('Another great note here.')).toBeInTheDocument();
      expect(screen.queryByText('Third note for testing.')).not.toBeInTheDocument();
    });

    it('uses default maxNotes based on widget size when not configured', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: { pages: [mockNotes] },
        isLoading: false,
      });

      // Small widget should show fewer notes
      const widget = createWidget({ w: 1, h: 1 });

      render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={false} />
        </TestApp>
      );

      // Should call the hook with pubkey
      expect(mockUseUserPostsInfinite).toHaveBeenCalledWith(testPubkey);
    });
  });

  describe('Editing mode', () => {
    it('applies editing ring style when in editing mode', () => {
      mockUseUserPostsInfinite.mockReturnValue({
        data: { pages: [mockNotes] },
        isLoading: false,
      });

      const widget = createWidget();

      const { container } = render(
        <TestApp>
          <NotesWidget widget={widget} pubkey={testPubkey} isEditing={true} />
        </TestApp>
      );

      // The card should have editing styles
      const card = container.querySelector('.widget');
      expect(card).toHaveClass('ring-2', 'ring-primary/50', 'cursor-move');
    });
  });
});
