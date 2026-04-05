import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { PageCopilotPanel } from '@/components/page/PageCopilotPanel';
import { PageStudioHistorySheet } from '@/components/page/PageStudioHistorySheet';
import { PageStudioShell } from '@/components/page/PageStudioShell';
import { usePageStudioController } from '@/pages/pageStudio/PageStudioProvider';

export default function PageStudioAi() {
  const {
    pubkey,
    workingDraft,
    hasDraftChanges,
    canRevertAiChange,
    isSavingDraft,
    isPublishing,
    revisions,
    isHistoryLoading,
    applySuggestion,
    revertAiChange,
    restoreRevision,
    saveDraft,
    publishDraft,
  } = usePageStudioController();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useSeoMeta({
    title: 'Page Studio AI - DiVine Space',
    description: 'Generate and review AI changes for your hosted page draft.',
  });

  return (
    <Layout>
      <PageStudioShell
        page={workingDraft}
        pubkey={pubkey}
        topBarActions={(
          <>
            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2 sm:w-auto"
              onClick={() => setIsHistoryOpen(true)}
            >
              <History className="h-4 w-4" />
              Revision history
            </Button>
            <Button asChild type="button" variant="outline" className="w-full gap-2 sm:w-auto">
              <Link to="/studio/page">
                <ArrowLeft className="h-4 w-4" />
                Back to page editor
              </Link>
            </Button>
          </>
        )}
        onSaveDraft={() => {
          void saveDraft();
        }}
        isSavingDraft={isSavingDraft}
        hasDraftChanges={hasDraftChanges}
        onPublish={() => {
          void publishDraft();
        }}
        isPublishing={isPublishing}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">AI page copilot</h1>
            <p className="text-sm text-muted-foreground">
              Generate structured changes, review them, and apply them to the same draft used by the manual editor.
            </p>
          </div>
          <PageCopilotPanel
            page={workingDraft}
            onApply={applySuggestion}
            onRevert={revertAiChange}
            canRevert={canRevertAiChange}
          />
        </div>
      </PageStudioShell>
      {isHistoryOpen ? (
        <PageStudioHistorySheet
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          revisions={revisions}
          onRestore={(revision) => {
            restoreRevision(revision);
            setIsHistoryOpen(false);
          }}
          isLoading={isHistoryLoading}
        />
      ) : null}
    </Layout>
  );
}
