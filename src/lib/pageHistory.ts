import type { NostrEvent } from '@nostrify/nostrify';
import { parseSiteConfig, siteConfigToContent, siteConfigToTags } from '@/lib/parseSiteConfig';
import type { PageDocument } from '@/types/page';
import type { SiteConfigInput } from '@/types/site';
import type {
  PageRevision,
  PageRevisionSnapshot,
  PageRevisionSource,
  UnsignedPageRevisionEvent,
} from '@/types/pageHistory';

function pageDocumentToSiteConfigInput(page: PageDocument): SiteConfigInput {
  return {
    name: page.name,
    title: page.title,
    summary: page.summary,
    image: page.image,
    icon: page.icon,
    themeId: page.themeId,
    includes: page.includes,
    layout: page.layout,
    gridCols: page.gridCols,
    widgets: page.widgets,
    customization: page.customization,
  };
}

function getTagValue(tags: string[][], name: string): string | undefined {
  return tags.find(([tagName]) => tagName === name)?.[1];
}

export function buildPageRevisionTags(
  identifier: string,
  source: PageRevisionSource,
  revisionId: string
): string[][] {
  return [
    ['d', revisionId],
    ['k', '30512'],
    ['alt', 'DiVine Space page revision'],
    ['identifier', identifier],
    ['source', source],
  ];
}

export function createPageRevisionSnapshot(
  page: PageDocument,
  pubkey: string,
  source: PageRevisionSource,
  createdAt = Math.floor(Date.now() / 1000)
): PageRevisionSnapshot {
  const input = pageDocumentToSiteConfigInput(page);
  const unsignedEvent: UnsignedPageRevisionEvent = {
    kind: 30512,
    created_at: createdAt,
    tags: siteConfigToTags(input, pubkey, page.identifier),
    content: siteConfigToContent(input),
  };

  return {
    source,
    pageIdentifier: page.identifier,
    createdAt,
    unsignedEvent,
  };
}

export function parsePageRevisionContent(
  event: Pick<NostrEvent, 'id' | 'created_at' | 'tags'>,
  plaintext: string
): PageRevision | null {
  let parsedEvent: unknown;

  try {
    parsedEvent = JSON.parse(plaintext);
  } catch {
    return null;
  }

  if (
    typeof parsedEvent !== 'object' ||
    parsedEvent === null ||
    !('kind' in parsedEvent) ||
    parsedEvent.kind !== 30512 ||
    !('tags' in parsedEvent) ||
    !Array.isArray(parsedEvent.tags) ||
    !('content' in parsedEvent) ||
    typeof parsedEvent.content !== 'string' ||
    !('created_at' in parsedEvent) ||
    typeof parsedEvent.created_at !== 'number'
  ) {
    return null;
  }

  const siteConfig = parseSiteConfig(parsedEvent as NostrEvent);
  if (!siteConfig) {
    return null;
  }

  const source = getTagValue(event.tags, 'source');
  if (source !== 'save-draft' && source !== 'publish') {
    return null;
  }

  return {
    id: event.id,
    createdAt: event.created_at,
    source,
    pageIdentifier: siteConfig.identifier,
    page: {
      ...siteConfig,
      identifier: siteConfig.identifier,
      shell: { type: 'sidebar-bento' },
      contentMode: 'creator-site',
    },
  };
}
