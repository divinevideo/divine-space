import { CalendarDays, MapPin, Sparkles } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { WidgetProps } from '@/types/widgets';

function getTagValue(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([tag]) => tag === name)?.[1];
}

function getScheduleLabel(event: NostrEvent): { label: string; dateTime: string } {
  const start = getTagValue(event, 'start') ?? '';

  if (event.kind === 31922) {
    return {
      label: formatCalendarDate(start),
      dateTime: start,
    };
  }

  const timestamp = Number(start) * 1000;
  return {
    label: formatCalendarDateTime(timestamp),
    dateTime: new Date(timestamp).toISOString(),
  };
}

function formatCalendarDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatCalendarDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getEventSummary(event: NostrEvent): string | undefined {
  return getTagValue(event, 'summary') ?? (event.content.trim() || undefined);
}

function getEventLocation(event: NostrEvent): string | undefined {
  return getTagValue(event, 'location');
}

function EventSkeleton() {
  return (
    <div className="space-y-2 rounded-md border border-border/50 bg-muted/30 p-3">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function EmptyState({ isEditing }: { isEditing: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center py-4">
      <CalendarDays className="h-8 w-8 text-muted-foreground/60" />
      <p className="text-sm font-medium">
        {isEditing ? 'Add upcoming events' : 'No upcoming events yet'}
      </p>
      <p className="max-w-[20rem] text-xs text-muted-foreground">
        {isEditing
          ? 'Share shows, appearances, or dates that matter to your audience.'
          : 'Shows, appearances, and launches will appear here when you publish them.'}
      </p>
      {isEditing && (
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Add event
        </Button>
      )}
    </div>
  );
}

function EventCard({ event }: { event: NostrEvent }) {
  const title = getTagValue(event, 'title') ?? 'Untitled event';
  const summary = getEventSummary(event);
  const location = getEventLocation(event);
  const schedule = getScheduleLabel(event);

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {summary && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{summary}</p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0 whitespace-nowrap text-[10px]">
          {schedule.label}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <time dateTime={schedule.dateTime}>{schedule.label}</time>
        {location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {location}
          </span>
        )}
      </div>

      {event.content.trim() && event.content.trim() !== summary && (
        <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
          {event.content.trim()}
        </p>
      )}
    </div>
  );
}

export function EventsWidget({ widget, pubkey, isEditing }: WidgetProps) {
  const { data: events = [], isLoading } = useCalendarEvents(pubkey);
  const displayEvents = events.slice(0, Math.max(1, Math.min(widget.h, 4)));

  return (
    <Card className={cn('widget h-full overflow-hidden', isEditing && 'ring-2 ring-primary/50')}>
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Events
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: Math.min(3, Math.max(1, widget.h)) }).map((_, index) => (
              <EventSkeleton key={index} />
            ))}
          </div>
        ) : displayEvents.length > 0 ? (
          <div className="space-y-2">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState isEditing={isEditing} />
        )}
      </CardContent>
    </Card>
  );
}

export default EventsWidget;
