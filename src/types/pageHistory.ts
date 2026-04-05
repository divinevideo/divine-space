import type { PageDocument } from '@/types/page';

export type PageRevisionSource = 'save-draft' | 'publish';

export interface UnsignedPageRevisionEvent {
  kind: 30512;
  created_at: number;
  tags: string[][];
  content: string;
}

export interface PageRevisionSnapshot {
  source: PageRevisionSource;
  pageIdentifier: string;
  createdAt: number;
  unsignedEvent: UnsignedPageRevisionEvent;
}

export interface PageRevision {
  id: string;
  createdAt: number;
  source: PageRevisionSource;
  pageIdentifier: string;
  page: PageDocument;
}
