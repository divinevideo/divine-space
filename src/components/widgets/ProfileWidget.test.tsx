import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ProfileWidget, WidgetConfig } from './ProfileWidget';

// Mock the useAuthor hook
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

import { useAuthor } from '@/hooks/useAuthor';

const mockUseAuthor = vi.mocked(useAuthor);

describe('ProfileWidget', () => {
  const testPubkey = 'test-pubkey-123';

  const mockMetadata = {
    name: 'testuser',
    display_name: 'Test User',
    about: 'This is a test bio that describes the user.',
    picture: 'https://example.com/avatar.jpg',
    nip05: 'testuser@example.com',
  };

  const baseWidget: WidgetConfig = {
    id: 'profile-widget',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton when data is loading', () => {
    mockUseAuthor.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget widget={baseWidget} pubkey={testPubkey} />
      </TestApp>
    );

    // Should show skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders user profile data correctly', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget widget={baseWidget} pubkey={testPubkey} />
      </TestApp>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('testuser@example.com')).toBeInTheDocument();
    expect(screen.getByText('This is a test bio that describes the user.')).toBeInTheDocument();
  });

  it('renders avatar with fallback when no picture', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: { ...mockMetadata, picture: undefined } },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget widget={baseWidget} pubkey={testPubkey} />
      </TestApp>
    );

    // Avatar fallback should show first letter of name
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders Anonymous when no name provided', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: {} },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget widget={baseWidget} pubkey={testPubkey} />
      </TestApp>
    );

    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('renders compact layout when h=1', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    const compactWidget: WidgetConfig = {
      ...baseWidget,
      h: 1,
    };

    render(
      <TestApp>
        <ProfileWidget widget={compactWidget} pubkey={testPubkey} />
      </TestApp>
    );

    // In compact mode, bio should not be shown
    expect(screen.queryByText('This is a test bio that describes the user.')).not.toBeInTheDocument();
    // But name and nip05 should still be visible
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('testuser@example.com')).toBeInTheDocument();
  });

  it('shows bio when h >= 2', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget widget={{ ...baseWidget, h: 2 }} pubkey={testPubkey} />
      </TestApp>
    );

    expect(screen.getByText('This is a test bio that describes the user.')).toBeInTheDocument();
  });

  it('shows edit mode controls when isEditing is true', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    const onSettings = vi.fn();
    const onDelete = vi.fn();

    render(
      <TestApp>
        <ProfileWidget
          widget={baseWidget}
          pubkey={testPubkey}
          isEditing={true}
          onSettings={onSettings}
          onDelete={onDelete}
        />
      </TestApp>
    );

    // Should have edit mode styling
    const card = document.querySelector('.ring-primary\\/50');
    expect(card).toBeInTheDocument();

    // Should have settings and delete buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('calls onSettings when settings button is clicked', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    const onSettings = vi.fn();
    const onDelete = vi.fn();

    render(
      <TestApp>
        <ProfileWidget
          widget={baseWidget}
          pubkey={testPubkey}
          isEditing={true}
          onSettings={onSettings}
          onDelete={onDelete}
        />
      </TestApp>
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // Settings button

    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    const onSettings = vi.fn();
    const onDelete = vi.fn();

    render(
      <TestApp>
        <ProfileWidget
          widget={baseWidget}
          pubkey={testPubkey}
          isEditing={true}
          onSettings={onSettings}
          onDelete={onDelete}
        />
      </TestApp>
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Delete button

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onSettings).not.toHaveBeenCalled();
  });

  it('does not show edit controls when not in edit mode', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget
          widget={baseWidget}
          pubkey={testPubkey}
          isEditing={false}
          onSettings={vi.fn()}
          onDelete={vi.fn()}
        />
      </TestApp>
    );

    // Should not have edit mode styling
    const card = document.querySelector('.ring-primary\\/50');
    expect(card).not.toBeInTheDocument();

    // Should not have buttons
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('uses display_name over name when both are provided', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget widget={baseWidget} pubkey={testPubkey} />
      </TestApp>
    );

    // display_name should be the main heading
    expect(screen.getByText('Test User')).toBeInTheDocument();
    // name should be shown as @username
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('uses name when display_name is not provided', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'justname' } },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget widget={baseWidget} pubkey={testPubkey} />
      </TestApp>
    );

    expect(screen.getByText('justname')).toBeInTheDocument();
    // Should not show @username since no display_name
    expect(screen.queryByText('@justname')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget
          widget={baseWidget}
          pubkey={testPubkey}
          className="custom-test-class"
        />
      </TestApp>
    );

    const card = document.querySelector('.custom-test-class');
    expect(card).toBeInTheDocument();
  });

  it('renders avatar with fallback letter when picture is provided', () => {
    mockUseAuthor.mockReturnValue({
      data: { metadata: mockMetadata },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useAuthor>);

    render(
      <TestApp>
        <ProfileWidget widget={baseWidget} pubkey={testPubkey} />
      </TestApp>
    );

    // Radix Avatar uses lazy image loading, so the fallback (first letter)
    // is shown initially while the image loads asynchronously
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
