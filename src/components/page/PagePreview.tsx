import type { PageDocument } from '@/types/page';
import { Card, CardContent } from '@/components/ui/card';
import { PublicPageRenderer } from './PublicPageRenderer';
import { cn } from '@/lib/utils';

export interface PagePreviewProps {
  page?: PageDocument | null;
  pubkey?: string;
  className?: string;
}

export function PagePreview({ page, pubkey, className }: PagePreviewProps) {
  if (!page || !pubkey) {
    return (
      <Card
        data-testid="page-preview"
        className={cn('border-dashed border-border/60 bg-card/70', className)}
      >
        <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
          The preview will appear here once the starter draft is ready.
        </CardContent>
      </Card>
    );
  }

  return (
    <div data-testid="page-preview" className={cn('space-y-4', className)}>
      <PublicPageRenderer page={page} pubkey={pubkey} />
    </div>
  );
}

export default PagePreview;
