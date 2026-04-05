import { formatDistanceToNow } from 'date-fns';
import type { PageRevision } from '@/types/pageHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface PageRevisionHistoryProps {
  revisions: PageRevision[];
  onRestore: (revision: PageRevision) => void;
  isLoading?: boolean;
}

function getRevisionLabel(revision: PageRevision): string {
  return revision.page.title || revision.pageIdentifier;
}

function getSourceLabel(source: PageRevision['source']): string {
  return source === 'publish' ? 'Published' : 'Saved draft';
}

export function PageRevisionHistory({
  revisions,
  onRestore,
  isLoading = false,
}: PageRevisionHistoryProps) {
  return (
    <Card data-testid="page-revision-history">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base tracking-tight">Revision history</CardTitle>
        <p className="text-sm text-muted-foreground">
          Restore a saved page state into your local draft.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading revisions…</p>
        ) : revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved revisions yet.</p>
        ) : (
          revisions.map((revision) => (
            <div
              key={revision.id}
              className="rounded-lg border border-border/60 bg-muted/30 p-3"
            >
              <div className="text-sm font-medium">{getRevisionLabel(revision)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {getSourceLabel(revision.source)} ·{' '}
                {formatDistanceToNow(new Date(revision.createdAt * 1000), {
                  addSuffix: true,
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => onRestore(revision)}
              >
                Restore {getRevisionLabel(revision)}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default PageRevisionHistory;
