import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { PageDocument } from '@/types/page';
import { PageStudioProvider, usePageStudioController } from './PageStudioProvider';

const {
  ensureStarterDraft,
  publishDraftMutation,
  updateDraft,
  createRevision,
  toast,
  usePageHistoryMock,
} = vi.hoisted(() => ({
  ensureStarterDraft: vi.fn(),
  publishDraftMutation: vi.fn(),
  updateDraft: vi.fn(),
  createRevision: vi.fn(),
  toast: vi.fn(),
  usePageHistoryMock: vi.fn(),
}));

const draftQueryState: {
  current: {
    data: PageDocument | null | undefined;
    isSuccess: boolean;
  };
} = {
  current: {
    data: {
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      includes: [],
      widgets: [],
      title: 'Server Draft',
      summary: 'Draft page preview',
    },
    isSuccess: true,
  },
};

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
    data: draftQueryState.current.data,
    isLoading: false,
    isSuccess: draftQueryState.current.isSuccess,
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
      mutate: publishDraftMutation,
      mutateAsync: publishDraftMutation,
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

function createPage(overrides: Partial<PageDocument> = {}): PageDocument {
  return {
    identifier: 'profile-draft',
    shell: { type: 'sidebar-bento' },
    includes: [],
    widgets: [],
    title: 'Server Draft',
    summary: 'Draft page preview',
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <PageStudioProvider>{children}</PageStudioProvider>;
}

describe('PageStudioProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftQueryState.current = {
      data: createPage(),
      isSuccess: true,
    };
    usePageHistoryMock.mockImplementation(() => ({
      revisions: [],
      createRevision: {
        mutateAsync: createRevision,
        isPending: false,
      },
      isLoading: false,
    }));
  });

  it('publishes the latest local draft after unsaved edits', async () => {
    const { result } = renderHook(() => usePageStudioController(), { wrapper });

    await waitFor(() => {
      expect(result.current.workingDraft?.title).toBe('Server Draft');
    });

    act(() => {
      result.current.setDraftPage((current) => current ? {
        ...current,
        title: 'Locally Edited Draft',
      } : current);
    });

    await act(async () => {
      await result.current.publishDraft();
    });

    expect(updateDraft).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Locally Edited Draft',
    }));
    expect(publishDraftMutation).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Locally Edited Draft',
    }));
  });

  it('does not overwrite a dirty local draft when query data refreshes', async () => {
    const { result, rerender } = renderHook(() => usePageStudioController(), { wrapper });

    await waitFor(() => {
      expect(result.current.workingDraft?.title).toBe('Server Draft');
    });

    act(() => {
      result.current.setDraftPage((current) => current ? {
        ...current,
        title: 'Local Dirty Draft',
      } : current);
    });

    draftQueryState.current = {
      data: createPage({
        title: 'Refetched Server Draft',
      }),
      isSuccess: true,
    };

    rerender();

    await waitFor(() => {
      expect(result.current.workingDraft?.title).toBe('Local Dirty Draft');
    });
  });
});
