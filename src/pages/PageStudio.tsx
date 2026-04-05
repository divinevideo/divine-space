import { useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { BentoGridEditor } from '@/components/BentoGridEditor';
import { Layout } from '@/components/Layout';
import { PageStudioShell } from '@/components/page/PageStudioShell';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useUpdateSiteConfig } from '@/hooks/useSiteConfig';
import { usePageHistory } from '@/hooks/usePageHistory';
import { createSidebarBentoLayout } from '@/lib/sidebarBentoLayout';
import type { PageDocument } from '@/types/page';
import type { SiteConfigInput } from '@/types/site';
import type { BentoLayout } from '@/types/widgets';
import {
  useDraftPageDocument,
  useEnsureStarterDraft,
  usePublishPageDocument,
} from '@/hooks/usePageDocument';

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

export default function PageStudio() {
  const { pubkey } = useAuth();
  const { toast } = useToast();
  const draftQuery = useDraftPageDocument(pubkey);
  const { ensureStarterDraft } = useEnsureStarterDraft(pubkey);
  const { publishDraft } = usePublishPageDocument(pubkey);
  const bootstrappedPubkey = useRef<string | undefined>(undefined);
  const [draftPage, setDraftPage] = useState<PageDocument | null>(null);
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState<PageDocument | null>(null);
  const pageIdentifier = draftPage?.identifier ?? draftQuery.data?.identifier ?? 'profile-draft';
  const saveDraft = useUpdateSiteConfig(pageIdentifier);
  const revisionHistory = usePageHistory(pageIdentifier);

  useSeoMeta({
    title: 'Page Studio - DiVine Space',
    description: 'Edit and publish your hosted page.',
  });

  useEffect(() => {
    if (!pubkey || bootstrappedPubkey.current === pubkey || !draftQuery.isSuccess) {
      return;
    }

    bootstrappedPubkey.current = pubkey;
    if (!draftQuery.data) {
      ensureStarterDraft.mutate();
    }
  }, [draftQuery.data, draftQuery.isSuccess, ensureStarterDraft, pubkey]);

  useEffect(() => {
    if (draftQuery.data === undefined) {
      return;
    }

    setDraftPage(draftQuery.data);
    setSavedDraftSnapshot(draftQuery.data);
  }, [draftQuery.data]);

  const workingDraft = draftPage ?? draftQuery.data ?? null;
  const hasDraftChanges = serializePageDocument(workingDraft) !== serializePageDocument(savedDraftSnapshot);

  const handleEditorChange = (layout: BentoLayout) => {
    setDraftPage((currentPage) => {
      if (!currentPage) {
        return currentPage;
      }

      return {
        ...currentPage,
        layout: 'bento',
        gridCols: layout.gridCols,
        widgets: layout.widgets,
      };
    });
  };

  const handleSaveDraft = async () => {
    if (!workingDraft) {
      return;
    }

    try {
      await revisionHistory.createRevision.mutateAsync({
        page: workingDraft,
        source: 'save-draft',
      });
    } catch {
      toast({
        title: 'Revision history failed to save',
        variant: 'destructive',
      });
    }

    await saveDraft.mutateAsync(pageDocumentToSiteConfigInput(workingDraft));
    setSavedDraftSnapshot(workingDraft);
  };

  const handlePublish = async () => {
    if (!workingDraft) {
      return;
    }

    if (hasDraftChanges && workingDraft) {
      await handleSaveDraft();
    }

    try {
      await revisionHistory.createRevision.mutateAsync({
        page: workingDraft,
        source: 'publish',
      });
    } catch {
      toast({
        title: 'Publish history snapshot failed',
        variant: 'destructive',
      });
    }

    await publishDraft.mutateAsync();
  };

  const editorLayout = createSidebarBentoLayout(
    workingDraft?.widgets ?? [],
    workingDraft?.gridCols ?? 4,
    150
  );

  return (
    <Layout>
      <PageStudioShell
        page={workingDraft}
        pubkey={pubkey}
        onSaveDraft={() => {
          void handleSaveDraft();
        }}
        isSavingDraft={saveDraft.isPending}
        hasDraftChanges={hasDraftChanges}
        onPublish={() => {
          void handlePublish();
        }}
        isPublishing={publishDraft.isPending}
      >
        {workingDraft ? (
          <BentoGridEditor
            layout={editorLayout}
            pubkey={pubkey ?? ''}
            onChange={handleEditorChange}
          />
        ) : null}
      </PageStudioShell>
    </Layout>
  );
}
