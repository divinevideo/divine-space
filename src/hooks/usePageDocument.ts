import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useAuthor } from './useAuthor';
import { useKeycastPublish } from './useKeycastPublish';
import { useMySpaceProfile } from './useMySpaceProfile';
import {
  SITE_CONFIG_QUERY_KEY,
  useSiteConfig,
} from './useSiteConfig';
import { siteConfigToContent, siteConfigToTags } from '@/lib/parseSiteConfig';
import {
  getDraftPageIdentifier,
  getPublishedPageIdentifier,
} from '@/lib/pageIdentifiers';
import { createStarterDraft } from '@/lib/pageMigration';
import { SITE_CONFIG_KIND, type SiteConfigInput } from '@/types/site';
import type { PageDocument } from '@/types/page';

function toPageDocument(
  siteConfig: ReturnType<typeof useSiteConfig>['data'],
  identifier: string
): PageDocument | null | undefined {
  if (siteConfig === undefined) {
    return undefined;
  }

  if (siteConfig === null) {
    return null;
  }

  return {
    ...siteConfig,
    identifier: siteConfig.identifier || identifier,
    shell: { type: 'sidebar-bento' },
    contentMode: identifier === getDraftPageIdentifier() ? 'creator-site' : 'profile',
  };
}

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

export function useDraftPageDocument(pubkey?: string) {
  const query = useSiteConfig(pubkey, getDraftPageIdentifier());

  return {
    ...query,
    data: toPageDocument(query.data, getDraftPageIdentifier()),
  };
}

export function usePublishedPageDocument(pubkey?: string) {
  const query = useSiteConfig(pubkey, getPublishedPageIdentifier());

  return {
    ...query,
    data: toPageDocument(query.data, getPublishedPageIdentifier()),
  };
}

export function usePublishPageDocument(pubkey?: string) {
  const { pubkey: authPubkey } = useAuth();
  const targetPubkey = pubkey ?? authPubkey;
  const draftQuery = useDraftPageDocument(targetPubkey);
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  const publishDraft = useMutation({
    mutationFn: async (draftOverride?: PageDocument) => {
      if (!targetPubkey) {
        throw new Error('Not authenticated');
      }

      const draft =
        draftOverride ??
        draftQuery.data ??
        toPageDocument(
          (await draftQuery.refetch()).data,
          getDraftPageIdentifier()
        );

      if (!draft) {
        throw new Error('No draft page to publish');
      }

      const input = pageDocumentToSiteConfigInput(draft);

      return publish({
        kind: SITE_CONFIG_KIND,
        content: siteConfigToContent(input),
        tags: siteConfigToTags(input, targetPubkey, getPublishedPageIdentifier()),
      });
    },
    onSuccess: async () => {
      if (!targetPubkey) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SITE_CONFIG_QUERY_KEY(targetPubkey, getDraftPageIdentifier()),
        }),
        queryClient.invalidateQueries({
          queryKey: SITE_CONFIG_QUERY_KEY(targetPubkey, getPublishedPageIdentifier()),
        }),
      ]);
    },
  });

  return {
    ...publishDraft,
    publishDraft,
  };
}

export function useEnsureStarterDraft(pubkey?: string) {
  const { pubkey: authPubkey } = useAuth();
  const targetPubkey = pubkey ?? authPubkey;
  const draftQuery = useDraftPageDocument(targetPubkey);
  const publishedQuery = usePublishedPageDocument(targetPubkey);
  const authorQuery = useAuthor(targetPubkey);
  const myspaceQuery = useMySpaceProfile(targetPubkey);
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  const ensureStarterDraft = useMutation({
    mutationFn: async () => {
      if (!targetPubkey) {
        throw new Error('Not authenticated');
      }

      if (draftQuery.data) {
        return draftQuery.data;
      }

      const starterDraft = createStarterDraft({
        pubkey: targetPubkey,
        profile: authorQuery.data?.metadata ?? null,
        myspace: myspaceQuery.data ?? null,
        site: publishedQuery.data ?? null,
      });
      const input = pageDocumentToSiteConfigInput(starterDraft);

      await publish({
        kind: SITE_CONFIG_KIND,
        content: siteConfigToContent(input),
        tags: siteConfigToTags(input, targetPubkey, getDraftPageIdentifier()),
      });

      return starterDraft;
    },
    onSuccess: async () => {
      if (!targetPubkey) return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SITE_CONFIG_QUERY_KEY(targetPubkey, getDraftPageIdentifier()),
        }),
        queryClient.invalidateQueries({
          queryKey: SITE_CONFIG_QUERY_KEY(targetPubkey, getPublishedPageIdentifier()),
        }),
      ]);
    },
  });

  return {
    ...ensureStarterDraft,
    ensureStarterDraft,
  };
}
