/**
 * Hook for fetching and updating NIP-512 Kind 30512 Site Configuration
 *
 * This hook enables Divine profiles to be rendered on npub.pro and
 * supports Ghost theme ecosystem compatibility.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useKeycastPublish } from './useKeycastPublish';
import { parseSiteConfig, siteConfigToTags, siteConfigToContent } from '@/lib/parseSiteConfig';
import type { SiteConfig, SiteConfigInput } from '@/types/site';
import { SITE_CONFIG_KIND } from '@/types/site';

/**
 * Query key factory for site config
 */
export const SITE_CONFIG_QUERY_KEY = (pubkey: string, identifier = 'profile') => [
  'site-config',
  pubkey,
  identifier,
];

/**
 * Fetch a user's site configuration (Kind 30512)
 *
 * @param pubkey - The user's public key (hex)
 * @param identifier - The site config identifier to load
 * @returns Query result with parsed SiteConfig or null
 */
export function useSiteConfig(pubkey: string | undefined, identifier = 'profile') {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: pubkey ? SITE_CONFIG_QUERY_KEY(pubkey, identifier) : ['site-config', 'none', identifier],
    queryFn: async (): Promise<SiteConfig | null> => {
      if (!pubkey) return null;

      const events = await nostr.query([
        {
          kinds: [SITE_CONFIG_KIND],
          authors: [pubkey],
          '#d': [identifier],
          limit: 1,
        },
      ]);

      if (events.length === 0) {
        return null;
      }

      return parseSiteConfig(events[0]);
    },
    enabled: !!pubkey,
  });
}

/**
 * Hook for updating the current user's site configuration
 *
 * @returns Mutation for updating site config
 */
export function useUpdateSiteConfig() {
  const { pubkey } = useAuth();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SiteConfigInput) => {
      if (!pubkey) {
        throw new Error('Not authenticated');
      }

      const tags = siteConfigToTags(input, pubkey);
      const content = siteConfigToContent(input);

      const event = await publish({
        kind: SITE_CONFIG_KIND,
        content,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      return event;
    },
    onSuccess: (_event, input) => {
      if (!pubkey) return;

      // Optimistically update the cache
      queryClient.setQueryData(
        SITE_CONFIG_QUERY_KEY(pubkey),
        (old: SiteConfig | null | undefined): SiteConfig => {
          const merged: SiteConfig = {
            identifier: 'profile',
            includes: input.includes ?? old?.includes ?? [],
            widgets: input.widgets ?? old?.widgets ?? [],
            name: input.name ?? old?.name,
            title: input.title ?? old?.title,
            summary: input.summary ?? old?.summary,
            image: input.image ?? old?.image,
            icon: input.icon ?? old?.icon,
            themeId: input.themeId ?? old?.themeId,
            layout: input.layout ?? old?.layout,
            gridCols: input.gridCols ?? old?.gridCols,
            customization: input.customization ?? old?.customization,
            url: old?.url ?? `https://divine.space/${pubkey}/`,
            renderingEngine: 'org.divine.bento',
          };
          return merged;
        }
      );

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: SITE_CONFIG_QUERY_KEY(pubkey),
      });
    },
    onError: (error) => {
      console.error('Failed to update site config:', error);
    },
  });
}

/**
 * Hook for setting the theme on a site configuration
 *
 * @returns Mutation for updating the theme
 */
export function useSetSiteTheme() {
  const { pubkey } = useAuth();
  const { data: currentConfig } = useSiteConfig(pubkey ?? undefined);
  const { mutateAsync: updateConfig } = useUpdateSiteConfig();

  return useMutation({
    mutationFn: async (themeId: string) => {
      return updateConfig({
        ...currentConfig,
        themeId,
      });
    },
  });
}

/**
 * Hook for updating widgets on a site configuration
 *
 * @returns Mutation for updating widgets
 */
export function useUpdateSiteWidgets() {
  const { pubkey } = useAuth();
  const { data: currentConfig } = useSiteConfig(pubkey ?? undefined);
  const { mutateAsync: updateConfig } = useUpdateSiteConfig();

  return useMutation({
    mutationFn: async (widgets: SiteConfig['widgets']) => {
      return updateConfig({
        ...currentConfig,
        widgets,
      });
    },
  });
}

/**
 * Hook for updating customization on a site configuration
 *
 * @returns Mutation for updating customization
 */
export function useUpdateSiteCustomization() {
  const { pubkey } = useAuth();
  const { data: currentConfig } = useSiteConfig(pubkey ?? undefined);
  const { mutateAsync: updateConfig } = useUpdateSiteConfig();

  return useMutation({
    mutationFn: async (customization: SiteConfig['customization']) => {
      return updateConfig({
        ...currentConfig,
        customization,
      });
    },
  });
}

/**
 * Hook for updating content includes on a site configuration
 *
 * @returns Mutation for updating includes
 */
export function useUpdateSiteIncludes() {
  const { pubkey } = useAuth();
  const { data: currentConfig } = useSiteConfig(pubkey ?? undefined);
  const { mutateAsync: updateConfig } = useUpdateSiteConfig();

  return useMutation({
    mutationFn: async (includes: SiteConfig['includes']) => {
      return updateConfig({
        ...currentConfig,
        includes,
      });
    },
  });
}
