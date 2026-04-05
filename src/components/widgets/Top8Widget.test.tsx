import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Top8Widget, type WidgetConfig } from './Top8Widget';
import type { ReactNode } from 'react';

// Mock all required hooks
vi.mock('@/hooks/useMySpaceProfile', () => ({
  useMySpaceProfile: vi.fn(),
}));

vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(() => ({
    nostr: {
      query: vi.fn().mockResolvedValue([]),
    },
  })),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    }),
  };
});

import { useMySpaceProfile } from '@/hooks/useMySpaceProfile';
import { useAuthor } from '@/hooks/useAuthor';
import { useQuery } from '@tanstack/react-query';

const mockUseMySpaceProfile = vi.mocked(useMySpaceProfile);
const mockUseAuthor = vi.mocked(useAuthor);
const mockUseQuery = vi.mocked(useQuery);

// Simple wrapper for tests
function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Top8Widget', () => {
  const defaultWidget: WidgetConfig = {
    id: 'top8',
    type: 'top8',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
  };

  // Valid 64-character hex pubkeys for tests
  const testPubkey = '0'.repeat(64);
  const validPubkeys = [
    '1'.repeat(64),
    '2'.repeat(64),
    '3'.repeat(64),
    '4'.repeat(64),
    '5'.repeat(64),
    '6'.repeat(64),
    '7'.repeat(64),
    '8'.repeat(64),
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for following list query
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useQuery>);

    // Default mock: no profile data
    mockUseMySpaceProfile.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    // Default mock: no author data
    mockUseAuthor.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);
  });

  it('renders the widget card', () => {
    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    // Should render the widget card
    const widget = document.querySelector('.widget');
    expect(widget).toBeInTheDocument();
  });

  it('shows loading skeleton when profile is loading', () => {
    mockUseMySpaceProfile.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      isPending: true,
      isSuccess: false,
      status: 'pending',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    // Should show skeleton (animated gradient banner)
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows empty state when no friends', () => {
    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: [], autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    expect(screen.getByText('No Top 8!')).toBeInTheDocument();
    expect(screen.getByText('Add friends')).toBeInTheDocument();
  });

  it('displays friends with proper rank badges', () => {
    const mockFriends = [
      { pubkey: validPubkeys[0], position: 1 },
      { pubkey: validPubkeys[1], position: 2 },
      { pubkey: validPubkeys[2], position: 3 },
      { pubkey: validPubkeys[3], position: 4 },
    ];

    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: mockFriends, autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockImplementation((pubkey: string | undefined) => {
      const mockData: Record<string, { name: string; display_name: string; picture: string }> = {
        [validPubkeys[0]]: { name: 'Alice', display_name: 'Alice A', picture: 'https://example.com/alice.jpg' },
        [validPubkeys[1]]: { name: 'Bob', display_name: 'Bob B', picture: 'https://example.com/bob.jpg' },
        [validPubkeys[2]]: { name: 'Charlie', display_name: 'Charlie C', picture: 'https://example.com/charlie.jpg' },
        [validPubkeys[3]]: { name: 'David', display_name: 'David D', picture: 'https://example.com/david.jpg' },
      };

      return {
        data: pubkey && mockData[pubkey] ? { metadata: mockData[pubkey] } : undefined,
        isLoading: false,
        error: null,
        isError: false,
        isPending: false,
        isSuccess: true,
        status: 'success',
      } as unknown as ReturnType<typeof useAuthor>;
    });

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    // Check that friends' names are displayed
    expect(screen.getByText('Alice A')).toBeInTheDocument();
    expect(screen.getByText('Bob B')).toBeInTheDocument();
    expect(screen.getByText('Charlie C')).toBeInTheDocument();
    expect(screen.getByText('David D')).toBeInTheDocument();

    // Check rank badges are present
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  it('shows edit mode toolbar when isEditing is true', () => {
    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: [], autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} isEditing={true} />
      </TestWrapper>
    );

    // Should show edit toolbar with settings and delete buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Check the card has editing ring
    const card = document.querySelector('.ring-2');
    expect(card).toBeInTheDocument();
  });

  it('displays scene-kid style header', () => {
    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: [{ pubkey: validPubkeys[0], position: 1 }], autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'Test' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} presetStyle="scene-kid" />
      </TestWrapper>
    );

    expect(screen.getByText('xX Top 8 Xx')).toBeInTheDocument();
  });

  it('displays kawaii-star style header', () => {
    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: [{ pubkey: validPubkeys[0], position: 1 }], autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'Test' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} presetStyle="kawaii-star" />
      </TestWrapper>
    );

    expect(screen.getByText('Best Friends')).toBeInTheDocument();
  });

  it('displays cyber-punk style header', () => {
    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: [{ pubkey: validPubkeys[0], position: 1 }], autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'Test' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} presetStyle="cyber-punk" />
      </TestWrapper>
    );

    expect(screen.getByText('// TOP_FRIENDS')).toBeInTheDocument();
  });

  it('shows friend count badge', () => {
    const mockFriends = [
      { pubkey: validPubkeys[0], position: 1 },
      { pubkey: validPubkeys[1], position: 2 },
      { pubkey: validPubkeys[2], position: 3 },
    ];

    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: mockFriends, autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'Test' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    expect(screen.getByText('3/8')).toBeInTheDocument();
  });

  it('renders empty slots for missing friends', () => {
    const mockFriends = [
      { pubkey: validPubkeys[0], position: 1 },
      { pubkey: validPubkeys[1], position: 2 },
    ];

    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: mockFriends, autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'Test' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    // Should show "Add" text for empty slots
    const addTexts = screen.getAllByText('Add');
    expect(addTexts.length).toBe(6); // 8 - 2 friends = 6 empty slots
  });

  it('shows #1 bestie label for non-compact widget', () => {
    const mockFriends = [
      { pubkey: validPubkeys[0], position: 1 },
    ];

    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: mockFriends, autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'BestFriend', display_name: 'Best Friend' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    // Use a larger widget size so bestie label is shown
    const largeWidget = { ...defaultWidget, h: 3 };

    render(
      <TestWrapper>
        <Top8Widget widget={largeWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    expect(screen.getByText('bestie')).toBeInTheDocument();
  });

  it('uses nickname when available', () => {
    const mockFriends = [
      { pubkey: validPubkeys[0], position: 1, nickname: 'My BFF' },
    ];

    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: mockFriends, autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'RealName', display_name: 'Display Name' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    // Should show nickname instead of real name
    expect(screen.getByText('My BFF')).toBeInTheDocument();
    expect(screen.queryByText('Display Name')).not.toBeInTheDocument();
  });

  it('renders as a grid with 4 columns', () => {
    const mockFriends = Array.from({ length: 8 }, (_, i) => ({
      pubkey: validPubkeys[i],
      position: i + 1,
    }));

    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: mockFriends, autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'Test' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    // Check the grid has 4 columns class
    const grid = document.querySelector('.grid-cols-4');
    expect(grid).toBeInTheDocument();
  });

  it('has decorative gradient banner', () => {
    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: [], autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    // Check for gradient banner
    const banner = document.querySelector('.bg-gradient-to-r');
    expect(banner).toBeInTheDocument();
  });

  it('renders links to friend profiles', () => {
    const mockFriends = [
      { pubkey: validPubkeys[0], position: 1 },
    ];

    mockUseMySpaceProfile.mockReturnValue({
      data: { topFriends: mockFriends, autoplay: false, theme: 'default' },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useMySpaceProfile>);

    mockUseAuthor.mockReturnValue({
      data: { metadata: { name: 'Friend' } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as unknown as ReturnType<typeof useAuthor>);

    render(
      <TestWrapper>
        <Top8Widget widget={defaultWidget} pubkey={testPubkey} />
      </TestWrapper>
    );

    // Should have a link starting with /npub
    const links = screen.getAllByRole('link');
    const profileLink = links.find(link => link.getAttribute('href')?.startsWith('/npub'));
    expect(profileLink).toBeInTheDocument();
  });
});
