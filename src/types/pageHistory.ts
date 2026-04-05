import type { PageDocument } from '@/types/page';

export type PageRevisionSource = 'save-draft' | 'publish';

export interface PageRevisionSnapshot {
  source: PageRevisionSource;
  pageIdentifier: string;
  createdAt: number;
  page: PageDocument;
}

export interface PageRevision {
  id: string;
  createdAt: number;
  source: PageRevisionSource;
  pageIdentifier: string;
  page: PageDocument;
}
