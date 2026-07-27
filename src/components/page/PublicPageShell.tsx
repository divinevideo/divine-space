import type { ReactNode } from 'react';
import type { PageDocument } from '@/types/page';
import { cn } from '@/lib/utils';

export interface PublicPageShellProps {
  page: PageDocument;
  pubkey: string;
  children: ReactNode;
  className?: string;
}

/**
 * Minimal shell for published pages. The page canvas is the identity —
 * no intro sidebar, no chrome. Visitor actions (follow, message) live in
 * the page's own widgets (e.g. contact-actions).
 */
export function PublicPageShell({ children, className }: PublicPageShellProps) {
  return (
    <main
      data-testid="public-page-shell"
      className={cn('min-h-screen bg-background text-foreground', className)}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </div>
    </main>
  );
}

export default PublicPageShell;
