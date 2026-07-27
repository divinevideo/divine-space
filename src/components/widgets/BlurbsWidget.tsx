import type { Widget } from '@/types/widgets';
import { useAuthor } from '@/hooks/useAuthor';

interface BlurbsWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function BlurbsWidget({ widget, pubkey }: BlurbsWidgetProps) {
  const author = useAuthor(pubkey);
  const about = author.data?.metadata?.about;
  const meet = (widget.config?.meet as string | undefined) ?? '';

  return (
    <div className="h-full w-full overflow-auto border border-border bg-card p-3 text-sm space-y-3">
      <section>
        <h3 className="font-bold text-primary">about me:</h3>
        <p className="whitespace-pre-wrap">
          {author.isLoading ? (
            <span className="text-muted-foreground">loading...</span>
          ) : (
            about || <span className="text-muted-foreground">(nothing here yet)</span>
          )}
        </p>
      </section>
      <section>
        <h3 className="font-bold text-primary">who i'd like to meet:</h3>
        <p className="whitespace-pre-wrap">
          {meet || <span className="text-muted-foreground">(edit your page to fill this in)</span>}
        </p>
      </section>
    </div>
  );
}

export default BlurbsWidget;
