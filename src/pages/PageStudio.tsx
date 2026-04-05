import { useEffect, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { BentoGridEditor } from '@/components/BentoGridEditor';
import { Layout } from '@/components/Layout';
import { PageStudioActionsMenu } from '@/components/page/PageStudioActionsMenu';
import { PageStudioAddWidgetMenu } from '@/components/page/PageStudioAddWidgetMenu';
import { PageStudioInspector } from '@/components/page/PageStudioInspector';
import { PageStudioHistorySheet } from '@/components/page/PageStudioHistorySheet';
import { PageStudioShell } from '@/components/page/PageStudioShell';
import { useAuth } from '@/hooks/useAuth';
import { appendWidgetToLayout } from '@/lib/pageStudioWidgets';
import { createSidebarBentoLayout } from '@/lib/sidebarBentoLayout';
import { getMaxSize, getMinSize } from '@/lib/widgetRegistry';
import type { PageDocument } from '@/types/page';
import type { PageRevision } from '@/types/pageHistory';
import type { BentoLayout, Widget, WidgetType } from '@/types/widgets';
import { usePageStudioController } from '@/pages/pageStudio/PageStudioProvider';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeGridValue(value: number): number {
  return Math.round(value);
}

function sanitizeWidgetLayoutUpdate(
  widget: Widget,
  nextLayout: Partial<Pick<Widget, 'x' | 'y' | 'w' | 'h'>>,
  gridCols: number
): Pick<Widget, 'x' | 'y' | 'w' | 'h'> {
  const minSize = getMinSize(widget.type);
  const maxSize = getMaxSize(widget.type);
  const nextW = normalizeGridValue(nextLayout.w ?? widget.w);
  const nextH = normalizeGridValue(nextLayout.h ?? widget.h);
  const w = clamp(nextW, minSize.w, maxSize.w);
  const h = clamp(nextH, minSize.h, maxSize.h);
  const x = clamp(normalizeGridValue(nextLayout.x ?? widget.x), 0, Math.max(0, gridCols - w));
  const y = Math.max(0, normalizeGridValue(nextLayout.y ?? widget.y));

  return { x, y, w, h };
}

export default function PageStudio() {
  const { pubkey } = useAuth();
  const {
    workingDraft,
    hasDraftChanges,
    isSavingDraft,
    isPublishing,
    revisions,
    isHistoryLoading,
    setDraftPage,
    clearAiSnapshot,
    restoreRevision,
    saveDraft,
    publishDraft,
  } = usePageStudioController();
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useSeoMeta({
    title: 'Page Studio - DiVine Space',
    description: 'Edit and publish your hosted page.',
  });

  useEffect(() => {
    if (!selectedWidgetId) {
      return;
    }

    if (!workingDraft?.widgets.some((widget) => widget.id === selectedWidgetId)) {
      setSelectedWidgetId(null);
    }
  }, [selectedWidgetId, workingDraft?.widgets]);

  const selectedWidget = workingDraft?.widgets.find((widget) => widget.id === selectedWidgetId) ?? null;

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
    clearAiSnapshot();
  };

  const handleAddWidget = (type: WidgetType) => {
    setDraftPage((currentPage) => {
      if (!currentPage) {
        return currentPage;
      }

      return {
        ...currentPage,
        layout: 'bento',
        widgets: appendWidgetToLayout(currentPage.widgets, type),
      };
    });
  };

  const handleSelectWidget = (widgetId: string) => {
    setSelectedWidgetId(widgetId);
  };

  const handleCloseInspector = () => {
    setSelectedWidgetId(null);
  };

  const handleOpenHistory = () => {
    setIsHistoryOpen(true);
  };

  const handleRestoreRevision = (revision: PageRevision) => {
    restoreRevision(revision);
    setSelectedWidgetId(null);
    setIsHistoryOpen(false);
  };

  const updateWidget = (
    widgetId: string,
    nextLayout: Partial<Pick<Widget, 'x' | 'y' | 'w' | 'h'>>
  ) => {
    setDraftPage((currentPage) => {
      if (!currentPage) {
        return currentPage;
      }

      const gridCols = currentPage.gridCols ?? 4;

      return {
        ...currentPage,
        layout: 'bento',
        widgets: currentPage.widgets.map((widget) => (
          widget.id === widgetId
            ? { ...widget, ...sanitizeWidgetLayoutUpdate(widget, nextLayout, gridCols) }
            : widget
        )),
      };
    });
    clearAiSnapshot();
  };

  const removeWidget = (widgetId: string) => {
    setDraftPage((currentPage) => {
      if (!currentPage) {
        return currentPage;
      }

      return {
        ...currentPage,
        layout: 'bento',
        widgets: currentPage.widgets.filter((widget) => widget.id !== widgetId),
      };
    });
    clearAiSnapshot();

    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null);
    }
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
        topBarActions={workingDraft && pubkey ? (
          <>
            <PageStudioAddWidgetMenu
              widgets={workingDraft.widgets}
              onAddWidget={handleAddWidget}
            />
            <PageStudioActionsMenu onOpenHistory={handleOpenHistory} />
          </>
        ) : undefined}
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
        {workingDraft ? (
          <BentoGridEditor
            layout={editorLayout}
            pubkey={pubkey ?? ''}
            onChange={handleEditorChange}
            selectedWidgetId={selectedWidgetId ?? undefined}
            onSelectWidget={handleSelectWidget}
          />
        ) : null}
      </PageStudioShell>
      {isHistoryOpen ? (
        <PageStudioHistorySheet
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          revisions={revisions}
          onRestore={handleRestoreRevision}
          isLoading={isHistoryLoading}
        />
      ) : null}
      {selectedWidget ? (
        <PageStudioInspector
          widget={selectedWidget}
          onClose={handleCloseInspector}
          onRemoveWidget={removeWidget}
          onUpdateWidget={updateWidget}
        />
      ) : null}
    </Layout>
  );
}
