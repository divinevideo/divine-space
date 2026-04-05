import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

const CALENDAR_KINDS = [31922, 31923] as const;

type CalendarEvent = NostrEvent & {
  kind: 31922 | 31923;
};

function getTagValue(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([tag]) => tag === name)?.[1];
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateStart(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function parseTimeStart(value: string): number | null {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return timestamp * 1000;
}

function getStartSortValue(event: CalendarEvent): number | null {
  const start = getTagValue(event, 'start');
  if (!start) return null;

  if (event.kind === 31922) {
    return parseDateStart(start);
  }

  return parseTimeStart(start);
}

export function isValidCalendarEvent(event: NostrEvent): event is CalendarEvent {
  if (event.kind !== 31922 && event.kind !== 31923) {
    return false;
  }

  const d = getTagValue(event, 'd');
  const title = getTagValue(event, 'title');
  const start = getTagValue(event, 'start');

  if (!d || !title || !start) {
    return false;
  }

  if (event.kind === 31922) {
    const startDate = parseDateStart(start);
    if (startDate === null) return false;

    const end = getTagValue(event, 'end');
    if (!end) return true;

    const endDate = parseDateStart(end);
    return endDate !== null && endDate > startDate;
  }

  const startTime = parseTimeStart(start);
  const dayValue = Number(getTagValue(event, 'D'));
  if (startTime === null || !Number.isFinite(dayValue)) {
    return false;
  }

  const end = getTagValue(event, 'end');
  if (!end) {
    return true;
  }

  const endTime = Number(end);
  return Number.isFinite(endTime) && endTime > startTime / 1000;
}

function isUpcomingCalendarEvent(event: CalendarEvent): boolean {
  const now = Date.now();
  const today = getLocalDateString(new Date());

  if (event.kind === 31922) {
    const start = getTagValue(event, 'start');
    const end = getTagValue(event, 'end') ?? start;
    if (!start || !end) return false;

    return end >= today;
  }

  const start = getTagValue(event, 'start');
  if (!start) return false;

  const startTime = parseTimeStart(start);
  if (startTime === null) return false;

  const end = getTagValue(event, 'end');
  if (!end) {
    return startTime >= now;
  }

  const endTime = Number(end) * 1000;
  if (!Number.isFinite(endTime)) return false;

  return endTime > now;
}

function sortCalendarEvents(left: CalendarEvent, right: CalendarEvent): number {
  const leftStart = getStartSortValue(left);
  const rightStart = getStartSortValue(right);

  if (leftStart === null && rightStart === null) return 0;
  if (leftStart === null) return 1;
  if (rightStart === null) return -1;

  return leftStart - rightStart;
}

/**
 * Fetches upcoming calendar events authored by the given user.
 */
export function useCalendarEvents(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['calendar-events', pubkey],
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!pubkey) return [];

      const events = await nostr.query([
        {
          kinds: [...CALENDAR_KINDS],
          authors: [pubkey],
          limit: 50,
        },
      ]);

      return events
        .filter(isValidCalendarEvent)
        .filter(isUpcomingCalendarEvent)
        .sort(sortCalendarEvents);
    },
    enabled: !!pubkey,
  });
}

export default useCalendarEvents;
