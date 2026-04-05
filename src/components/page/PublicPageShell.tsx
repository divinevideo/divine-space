import type { ReactNode } from 'react';
import { Globe, ArrowUpRight } from 'lucide-react';
import type { PageDocument } from '@/types/page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PublicPageActions } from './PublicPageActions';

export interface PublicPageShellProps {
  page: PageDocument;
  pubkey: string;
  children: ReactNode;
  className?: string;
}

function getPageTitle(page: PageDocument): string {
  return page.title || page.name || 'Untitled page';
}

function getPageSummary(page: PageDocument): string | undefined {
  return page.summary?.trim() || undefined;
}

function getDomainLabel(page: PageDocument): string {
  if (!page.url) return 'divine.video';

  try {
    return new URL(page.url).hostname;
  } catch {
    return 'divine.video';
  }
}

export function PublicPageShell({ page, pubkey, children, className }: PublicPageShellProps) {
  const title = getPageTitle(page);
  const summary = getPageSummary(page);
  const domainLabel = getDomainLabel(page);
  const shellLabel = page.shell.type.replace('-', ' ');

  return (
    <main
      data-testid="public-page-shell"
      className={cn(
        'min-h-screen bg-background text-foreground',
        'bg-[radial-gradient(circle_at_top,_rgba(120,119,198,0.16),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_30%)]',
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <aside data-testid="public-page-intro" className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="overflow-hidden border-border/60 bg-card/90 backdrop-blur">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border border-border/60">
                    <AvatarImage src={page.icon || page.image} alt={title} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {title.charAt(0).toUpperCase() || <Globe className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="uppercase tracking-wide">
                        {shellLabel}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {page.identifier}
                      </Badge>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                  </div>
                </div>

                {summary && (
                  <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1">
                    <Globe className="h-3.5 w-3.5" />
                    {domainLabel}
                  </span>
                  {page.url && (
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 transition-colors hover:text-foreground"
                    >
                      Open site
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <PublicPageActions page={page} pubkey={pubkey} />
          </aside>

          <section className="min-w-0">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}

export default PublicPageShell;
