import type { ReactNode } from 'react';
import { ArrowUpRight, Loader2, Pencil, Sparkles } from 'lucide-react';
import type { PageDocument } from '@/types/page';
import { LoginArea } from '@/components/auth/LoginArea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PageStudioShellProps {
  page?: PageDocument | null;
  pubkey?: string;
  children: ReactNode;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  hasDraftChanges?: boolean;
  onPublish?: () => void;
  isPublishing?: boolean;
  className?: string;
}

function getTitle(page?: PageDocument | null): string {
  return page?.title || page?.name || 'Untitled page';
}

function getSummary(page?: PageDocument | null): string | undefined {
  return page?.summary?.trim() || undefined;
}

export function PageStudioShell({
  page,
  pubkey,
  children,
  onSaveDraft,
  isSavingDraft = false,
  hasDraftChanges = false,
  onPublish,
  isPublishing = false,
  className,
}: PageStudioShellProps) {
  const title = getTitle(page);
  const summary = getSummary(page);
  const hasDraft = !!page;

  return (
    <main
      data-testid="page-studio-shell"
      className={cn(
        'min-h-screen bg-background text-foreground',
        'bg-[radial-gradient(circle_at_top,_rgba(120,119,198,0.14),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_30%)]',
        className
      )}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="rounded-3xl border border-border/60 bg-card/90 px-5 py-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="uppercase tracking-wide">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Studio
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {page?.identifier ?? 'profile-draft'}
                </Badge>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Page studio</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Edit your hosted page on one canvas, save draft changes, and publish when you're ready.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{title}</span>
                {summary ? <span aria-hidden="true">•</span> : null}
                {summary ? <span>{summary}</span> : null}
                {!hasDraft ? (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>Starter content will appear once the draft is created.</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:justify-end">
              {pubkey ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full gap-2 sm:w-auto"
                    onClick={onSaveDraft}
                    disabled={!hasDraft || !hasDraftChanges || isSavingDraft || isPublishing}
                  >
                    {isSavingDraft ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                    Save Draft
                  </Button>

                  <Button
                    type="button"
                    className="w-full gap-2 sm:w-auto"
                    onClick={onPublish}
                    disabled={!hasDraft || isPublishing || isSavingDraft}
                  >
                    {isPublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                    Publish
                  </Button>
                </>
              ) : (
                <LoginArea className="w-full sm:w-auto" />
              )}
            </div>
          </div>
        </header>

        <section className="min-w-0">
          {children}
        </section>
      </div>
    </main>
  );
}

export default PageStudioShell;
