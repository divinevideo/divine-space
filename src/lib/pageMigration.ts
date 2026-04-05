import type { NostrMetadata } from '@nostrify/nostrify';
import type { PageDocument } from '@/types/page';
import type { ContentInclude, SiteConfig, ThemeCustomization, Widget } from '@/types/site';
import type { TopFriend } from './parseTop8';
import { getDraftPageIdentifier } from './pageIdentifiers';
import {
  cloneSidebarBentoWidgets,
  createSidebarBentoWidgets,
} from './sidebarBentoLayout';

export interface StarterDraftMySpaceInput {
  topFriends?: TopFriend[];
  music?: {
    url: string;
    title?: string;
    artist?: string;
  };
  autoplay?: boolean;
  bio?: string;
  quote?: string;
  customCss?: string;
}

export type StarterDraftSiteInput = Partial<Omit<SiteConfig, 'includes' | 'widgets'>> & {
  includes?: ContentInclude[];
  widgets?: Widget[];
};

export interface StarterDraftInput {
  pubkey: string;
  profile?: Partial<NostrMetadata> | null;
  myspace?: StarterDraftMySpaceInput | null;
  site?: StarterDraftSiteInput | null;
}

function buildStarterIncludes(input: StarterDraftInput): ContentInclude[] {
  const includes: ContentInclude[] = [{ type: 'kind', value: '0' }];

  if (input.pubkey) {
    includes.push(
      { type: 'address', value: `30003:${input.pubkey}:links` },
      { type: 'address', value: `30000:${input.pubkey}:top8` }
    );
  }

  if (input.myspace?.music) {
    includes.push({ type: 'kind', value: '30315' });
  }

  return dedupeIncludes(includes);
}

function dedupeIncludes(includes: ContentInclude[]): ContentInclude[] {
  const seen = new Set<string>();

  return includes.filter((include) => {
    const key = `${include.type}:${include.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildStarterCustomization(
  input: StarterDraftInput
): ThemeCustomization | undefined {
  if (input.site?.customization) {
    return input.site.customization;
  }

  if (!input.myspace?.customCss) {
    return undefined;
  }

  return {
    customCss: input.myspace.customCss,
  };
}

function buildStarterWidgets(input: StarterDraftInput): Widget[] {
  if (input.site?.widgets && input.site.widgets.length > 0) {
    return cloneSidebarBentoWidgets(input.site.widgets);
  }

  return createSidebarBentoWidgets();
}

export function createStarterDraft(input: StarterDraftInput): PageDocument {
  const profile = input.profile ?? {};
  const site = input.site ?? {};
  const title = site.title ?? profile.display_name ?? profile.name;
  const summary = site.summary ?? input.myspace?.bio ?? profile.about ?? input.myspace?.quote;
  const widgets = buildStarterWidgets(input);

  return {
    identifier: getDraftPageIdentifier(),
    url: site.url ?? `https://divine.space/${input.pubkey}/`,
    name: site.name ?? profile.display_name ?? profile.name,
    title,
    summary,
    image: site.image ?? profile.banner ?? profile.picture,
    icon: site.icon ?? profile.picture,
    themeId: site.themeId,
    themePackageHash: site.themePackageHash,
    includes: site.includes && site.includes.length > 0 ? site.includes : buildStarterIncludes(input),
    renderingEngine: site.renderingEngine ?? 'org.divine.bento',
    layout: site.layout ?? 'bento',
    gridCols: site.gridCols ?? 4,
    shell: { type: 'sidebar-bento' },
    widgets,
    customization: buildStarterCustomization(input),
    rawContent: site.rawContent,
    contentMode: 'creator-site',
  };
}
