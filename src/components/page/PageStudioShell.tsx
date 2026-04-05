import type { ReactNode } from 'react';
import { ArrowUpRight, Loader2, Pencil, Sparkles } from 'lucide-react';
import type { PageDocument } from '@/types/page';
import { LoginArea } from '@/components/auth/LoginArea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface PageStudioShellProps {
  page?: PageDocument | null;
  pubkey?: string;
  children: ReactNode;
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
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="border-border/60 bg-card/90 backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="uppercase tracking-wide">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Studio
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {page?.identifier ?? 'profile-draft'}
                  </Badge>
                </div>
                <CardTitle className="text-2xl tracking-tight">Page studio</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  Edit your hosted page, preview the draft, and publish changes when you are ready.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current draft
                  </div>
                  <div className="mt-1 text-base font-medium">{title}</div>
                  {summary && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
                  )}
                  {!hasDraft && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Starter content will appear here once the draft is created.
                    </p>
                  )}
                </div>

                {pubkey ? (
                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={onPublish}
                    disabled={!hasDraft || isPublishing}
                  >
                    {isPublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                    Publish
                  </Button>
                ) : (
                  <LoginArea className="w-full" />
                )}
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/60 bg-card/70">
              <CardContent className="space-y-3 p-5 text-sm leading-6 text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <Pencil className="h-4 w-4" />
                  <span className="font-medium">Publishing flow</span>
                </div>
                <p>
                  The preview on the right is the same page renderer used for the public hosted page.
                </p>
                <p>
                  Publishing writes the current draft to the canonical public page identifier.
                </p>
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}

export default PageStudioShell;
