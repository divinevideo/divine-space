import { useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { BentoGridEditor } from '@/components/BentoGridEditor';
import { Layout } from '@/components/Layout';
import { PageCopilotPanel } from '@/components/page/PageCopilotPanel';
import { PageStudioShell } from '@/components/page/PageStudioShell';
import { PagePreview } from '@/components/page/PagePreview';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateSiteConfig } from '@/hooks/useSiteConfig';
import { applyPageCopilotSuggestion } from '@/lib/pageCopilot';
import { createSidebarBentoLayout } from '@/lib/sidebarBentoLayout';
import type { PageDocument } from '@/types/page';
import type { PageCopilotSuggestion } from '@/types/pageCopilot';
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
  const draftQuery = useDraftPageDocument(pubkey);
  const { ensureStarterDraft } = useEnsureStarterDraft(pubkey);
  const { publishDraft } = usePublishPageDocument(pubkey);
  const saveDraft = useUpdateSiteConfig('profile-draft');
  const bootstrappedPubkey = useRef<string | undefined>(undefined);
  const [draftPage, setDraftPage] = useState<PageDocument | null>(null);
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState<PageDocument | null>(null);
  const [lastAiSnapshot, setLastAiSnapshot] = useState<PageDocument | null>(null);

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
    setLastAiSnapshot(null);
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
    setLastAiSnapshot(null);
  };

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

  const handleSaveDraft = async () => {
    if (!workingDraft) {
      return;
    }

    await saveDraft.mutateAsync(pageDocumentToSiteConfigInput(workingDraft));
    setSavedDraftSnapshot(workingDraft);
  };

  const handlePublish = async () => {
    if (hasDraftChanges && workingDraft) {
      await handleSaveDraft();
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
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Edit Draft</h2>
              <p className="text-sm text-muted-foreground">
                Drag, resize, add, or remove widgets in your hosted page draft.
              </p>
            </div>
            {workingDraft ? (
              <BentoGridEditor
                layout={editorLayout}
                pubkey={pubkey ?? ''}
                onChange={handleEditorChange}
              />
            ) : null}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Preview</h2>
              <p className="text-sm text-muted-foreground">
                This preview uses the same renderer as the published hosted page.
              </p>
            </div>
            <PagePreview page={workingDraft} pubkey={pubkey} />
          </section>

          <section className="space-y-3 2xl:self-start">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Copilot</h2>
              <p className="text-sm text-muted-foreground">
                Generate structured draft changes, inspect them, then apply them to your page.
              </p>
            </div>
            <PageCopilotPanel
              page={workingDraft}
              onApply={handleApplySuggestion}
              onRevert={handleRevertAiChange}
              canRevert={!!lastAiSnapshot}
            />
          </section>
        </div>
      </PageStudioShell>
    </Layout>
  );
}
