import type { NostrEvent } from '@nostrify/nostrify';
import type { PageDocument } from '@/types/page';
import type {
  PageRevision,
  PageRevisionSnapshot,
  PageRevisionSource,
} from '@/types/pageHistory';

function clonePage(page: PageDocument): PageDocument {
  return {
    ...page,
    includes: [...page.includes],
    widgets: page.widgets.map((widget) => ({ ...widget })),
    customization: page.customization
      ? {
          ...page.customization,
          colors: page.customization.colors ? { ...page.customization.colors } : undefined,
          effects: page.customization.effects ? [...page.customization.effects] : undefined,
        }
      : undefined,
    draftState: page.draftState ? { ...page.draftState } : undefined,
  };
}

function isRevisionSnapshot(value: unknown): value is PageRevisionSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.source === 'save-draft' || candidate.source === 'publish') &&
    typeof candidate.pageIdentifier === 'string' &&
    typeof candidate.createdAt === 'number' &&
    typeof candidate.page === 'object' &&
    candidate.page !== null
  );
}

export function buildPageRevisionTags(revisionId: string): string[][] {
  return [
    ['d', revisionId],
    ['k', '30512'],
    ['alt', 'DiVine Space page revision'],
  ];
}

export function createPageRevisionSnapshot(
  page: PageDocument,
  source: PageRevisionSource,
  createdAt = Math.floor(Date.now() / 1000)
): PageRevisionSnapshot {
  return {
    source,
    pageIdentifier: page.identifier,
    createdAt,
    page: clonePage(page),
  };
}

export function parsePageRevisionContent(
  event: Pick<NostrEvent, 'id' | 'created_at' | 'tags'>,
  plaintext: string
): PageRevision | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(plaintext);
  } catch {
    return null;
  }

  if (!isRevisionSnapshot(parsed)) {
    return null;
  }

  return {
    id: event.id,
    createdAt: event.created_at,
    source: parsed.source,
    pageIdentifier: parsed.pageIdentifier,
    page: clonePage(parsed.page),
  };
}
