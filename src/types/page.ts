import type {
  ContentInclude,
  RenderingEngine,
  SiteLayoutType,
  ThemeCustomization,
} from '@/types/site';
import type { Widget } from '@/types/widgets';

export type PageIdentifier = 'profile' | 'profile-draft' | string;
export type PageShellType = 'sidebar-bento';
export type PageContentMode = 'profile' | 'creator-site';

export interface PageShell {
  type: PageShellType;
}

export interface PageDraftState {
  lastPublishedAt?: number;
}

export interface PageDocument {
  identifier: PageIdentifier;
  url?: string;
  name?: string;
  title?: string;
  summary?: string;
  image?: string;
  icon?: string;
  themeId?: string;
  themePackageHash?: string;
  includes: ContentInclude[];
  renderingEngine?: RenderingEngine;
  layout?: SiteLayoutType;
  gridCols?: number;
  shell: PageShell;
  widgets: Widget[];
  customization?: ThemeCustomization;
  rawContent?: string;
  contentMode?: PageContentMode;
  draftState?: PageDraftState;
}

export interface PageDocumentInput
  extends Omit<PageDocument, 'identifier' | 'includes' | 'shell' | 'widgets'> {
  includes?: ContentInclude[];
  shell?: PageShell;
  widgets?: Widget[];
}
