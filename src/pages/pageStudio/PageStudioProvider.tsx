import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useUpdateSiteConfig } from '@/hooks/useSiteConfig';
import { usePageHistory } from '@/hooks/usePageHistory';
import {
  useDraftPageDocument,
  useEnsureStarterDraft,
  usePublishPageDocument,
} from '@/hooks/usePageDocument';
import { applyPageCopilotSuggestion } from '@/lib/pageCopilot';
import type { PageDocument } from '@/types/page';
import type { PageCopilotSuggestion } from '@/types/pageCopilot';
import type { PageRevision } from '@/types/pageHistory';
import type { SiteConfigInput } from '@/types/site';

function pageDocumentToSiteConfigInput(page: PageDocument): SiteConfigInput {
  return {
    name: page.name,
    title: page.title,
    summary: page.summary,
    image: page.image,
    icon: page.icon,
    themeId: page.themeId,
    includes: page.includes,
    layout: page.layout,
    gridCols: page.gridCols,
    widgets: page.widgets,
    customization: page.customization,
  };
}

function serializePageDocument(page: PageDocument | null): string {
  return JSON.stringify(page ?? null);
}

export interface PageStudioControllerValue {
  pubkey?: string;
  workingDraft: PageDocument | null;
  hasDraftChanges: boolean;
  canRevertAiChange: boolean;
  isSavingDraft: boolean;
  isPublishing: boolean;
  revisions: PageRevision[];
  isHistoryLoading: boolean;
  setDraftPage: React.Dispatch<React.SetStateAction<PageDocument | null>>;
  clearAiSnapshot: () => void;
  applySuggestion: (suggestion: PageCopilotSuggestion) => void;
  revertAiChange: () => void;
  restoreRevision: (revision: PageRevision) => void;
  saveDraft: () => Promise<void>;
  publishDraft: () => Promise<void>;
}

const PageStudioContext = createContext<PageStudioControllerValue | null>(null);

export function PageStudioProvider({ children }: { children: ReactNode }) {
  const { pubkey } = useAuth();
  const { toast } = useToast();
  const draftQuery = useDraftPageDocument(pubkey);
  const { ensureStarterDraft } = useEnsureStarterDraft(pubkey);
  const { publishDraft } = usePublishPageDocument(pubkey);
  const bootstrappedPubkey = useRef<string | undefined>(undefined);
  const [draftPage, setDraftPage] = useState<PageDocument | null>(null);
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState<PageDocument | null>(null);
  const [lastAiSnapshot, setLastAiSnapshot] = useState<PageDocument | null>(null);
  const lastHydratedDraftSnapshot = useRef<string | null>(null);
  const previousPubkey = useRef<string | undefined>(pubkey);
  const authEpoch = useRef(0);
  const pageIdentifier = draftPage?.identifier ?? draftQuery.data?.identifier ?? 'profile-draft';
  const saveDraftMutation = useUpdateSiteConfig(pageIdentifier);
  const revisionHistory = usePageHistory(pageIdentifier);

  useEffect(() => {
    if (previousPubkey.current === pubkey) {
      return;
    }

    previousPubkey.current = pubkey;
    authEpoch.current += 1;
    bootstrappedPubkey.current = undefined;
    lastHydratedDraftSnapshot.current = null;
    setDraftPage(null);
    setSavedDraftSnapshot(null);
    setLastAiSnapshot(null);
  }, [pubkey]);

  useEffect(() => {
    if (!pubkey || bootstrappedPubkey.current === pubkey || !draftQuery.isSuccess) {
      return;
    }

    bootstrappedPubkey.current = pubkey;
    if (!draftQuery.data) {
      ensureStarterDraft.mutate();
    }
  }, [draftQuery.data, draftQuery.isSuccess, ensureStarterDraft, pubkey]);

  const workingDraft = draftPage ?? draftQuery.data ?? null;
  const hasDraftChanges = serializePageDocument(workingDraft) !== serializePageDocument(savedDraftSnapshot);

  useEffect(() => {
    if (draftQuery.data === undefined) {
      return;
    }

    const serializedDraftQuery = serializePageDocument(draftQuery.data);
    if (serializedDraftQuery === lastHydratedDraftSnapshot.current) {
      return;
    }

    if (draftPage !== null || savedDraftSnapshot !== null) {
      if (hasDraftChanges) {
        return;
      }
    }

    setDraftPage(draftQuery.data);
    setSavedDraftSnapshot(draftQuery.data);
    setLastAiSnapshot(null);
    lastHydratedDraftSnapshot.current = serializedDraftQuery;
  }, [draftPage, draftQuery.data, hasDraftChanges, savedDraftSnapshot]);

  const handleApplySuggestion = (suggestion: PageCopilotSuggestion) => {
    if (!workingDraft) {
      return;
    }

    setLastAiSnapshot(workingDraft);
    setDraftPage(applyPageCopilotSuggestion(workingDraft, suggestion));
  };

  const handleRevertAiChange = () => {
    if (!lastAiSnapshot) {
      return;
    }

    setDraftPage(lastAiSnapshot);
    setLastAiSnapshot(null);
  };

  const handleRestoreRevision = (revision: PageRevision) => {
    setDraftPage(revision.page);
    setLastAiSnapshot(null);
  };

  const isCurrentAuthEpoch = (epoch: number) => authEpoch.current === epoch;

  const handleSaveDraft = async ({
    page = workingDraft,
    epoch = authEpoch.current,
  }: {
    page?: PageDocument | null;
    epoch?: number;
  } = {}) => {
    if (!page) {
      return;
    }

    try {
      await revisionHistory.createRevision.mutateAsync({
        page,
        source: 'save-draft',
      });
    } catch {
      if (isCurrentAuthEpoch(epoch)) {
        toast({
          title: 'Revision history failed to save',
          variant: 'destructive',
        });
      }
    }

    await saveDraftMutation.mutateAsync(pageDocumentToSiteConfigInput(page));

    if (!isCurrentAuthEpoch(epoch)) {
      return;
    }

    setSavedDraftSnapshot(page);
  };

  const handlePublish = async () => {
    if (!workingDraft) {
      return;
    }

    const epoch = authEpoch.current;
    const page = workingDraft;

    if (hasDraftChanges) {
      await handleSaveDraft({ page, epoch });
      if (!isCurrentAuthEpoch(epoch)) {
        return;
      }
    }

    try {
      await revisionHistory.createRevision.mutateAsync({
        page,
        source: 'publish',
      });
    } catch {
      if (isCurrentAuthEpoch(epoch)) {
        toast({
          title: 'Publish history snapshot failed',
          variant: 'destructive',
        });
      }
    }

    if (!isCurrentAuthEpoch(epoch)) {
      return;
    }

    await publishDraft.mutateAsync(page);
  };

  const value: PageStudioControllerValue = {
    pubkey,
    workingDraft,
    hasDraftChanges,
    canRevertAiChange: !!lastAiSnapshot,
    isSavingDraft: saveDraftMutation.isPending,
    isPublishing: publishDraft.isPending,
    revisions: revisionHistory.revisions,
    isHistoryLoading: revisionHistory.isLoading,
    setDraftPage,
    clearAiSnapshot: () => {
      setLastAiSnapshot(null);
    },
    applySuggestion: handleApplySuggestion,
    revertAiChange: handleRevertAiChange,
    restoreRevision: handleRestoreRevision,
    saveDraft: handleSaveDraft,
    publishDraft: handlePublish,
  };

  return (
    <PageStudioContext.Provider value={value}>
      {children}
    </PageStudioContext.Provider>
  );
}

export function usePageStudioController() {
  const context = useContext(PageStudioContext);

  if (!context) {
    throw new Error('usePageStudioController must be used within a PageStudioProvider');
  }

  return context;
}

export default PageStudioProvider;
