/**
 * NotesWidget - Bento grid widget for displaying user's recent Nostr notes.
 *
 * Displays the user's recent Kind 1 notes with timestamps.
 * Supports configuration for maximum number of notes to display.
 */

import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUserPostsInfinite } from '@/hooks/useUserPosts';
import type { WidgetProps, NotesWidgetConfig } from '@/types/widgets';

/**
 * Format a timestamp as a relative time string.
 */
function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  // For older dates, show the date
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
}

/**
 * NotesWidget displays a user's recent notes in a scrollable list.
 *
 * Features:
 * - Shows recent Kind 1 notes
 * - Displays relative timestamps
 * - Configurable maximum number of notes
 * - Loading and empty states
 */
export function NotesWidget({ widget, pubkey, isEditing }: WidgetProps) {
  const config = widget.config as NotesWidgetConfig | undefined;

  // Calculate max notes based on widget size or config
  const maxNotes = config?.maxNotes ?? Math.min(widget.w * widget.h * 2, 10);

  const { data, isLoading } = useUserPostsInfinite(pubkey);

  // Flatten pages and get notes
  const notes = data?.pages?.flatMap(page => page) ?? [];
  const displayNotes = notes.slice(0, maxNotes);

  return (
    <Card className={cn(
      'widget h-full overflow-hidden',
      isEditing && 'ring-2 ring-primary/50 cursor-move'
    )}>
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 h-[calc(100%-48px)] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: Math.min(maxNotes, 3) }).map((_, i) => (
              <NoteSkeleton key={i} />
            ))}
          </div>
        ) : displayNotes.length > 0 ? (
          <div className="space-y-3">
            {displayNotes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface NoteItemProps {
  note: {
    id: string;
    content: string;
    created_at: number;
  };
}

function NoteItem({ note }: NoteItemProps) {
  return (
    <div className="p-2 rounded-md bg-muted/50 border border-border/50">
      <p className="text-sm line-clamp-3 mb-1">{note.content}</p>
      <span
        className="text-xs text-muted-foreground"
        data-testid="note-timestamp"
      >
        {formatRelativeTime(note.created_at)}
      </span>
    </div>
  );
}

function NoteSkeleton() {
  return (
    <div className="p-2 rounded-md bg-muted/50 border border-border/50" data-testid="note-skeleton">
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export default NotesWidget;
