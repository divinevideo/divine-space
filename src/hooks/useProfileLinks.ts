import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useKeycast } from '@/contexts/KeycastContext';
import { useKeycastPublish } from './useKeycastPublish';
import {
  parseLinksFromKind30003,
  parseLinksFromKind16793,
  linksToKind30003Tags,
  extractLinksMetadata,
  type ProfileLink,
} from '@/lib/parseLinks';

// Re-export the ProfileLink type for consumers
export type { ProfileLink } from '@/lib/parseLinks';

/**
 * Hook for managing profile links using NIP-51 Kind 30003 (Bookmark Sets).
 *
 * This hook provides:
 * - Reading links from Kind 30003 events (Nostree compatible)
 * - Fallback to legacy Kind 16793 for backward compatibility
 * - Writing new links as Kind 30003 events
 *
 * @param pubkey - The public key of the profile to fetch links for
 * @returns Object containing links data and mutation functions
 *
 * @example
 * ```tsx
 * function ProfileLinks({ pubkey }: { pubkey: string }) {
 *   const { links, isLoading, updateLinks } = useProfileLinks(pubkey);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <ul>
 *       {links.map(link => (
 *         <li key={link.url}>
 *           <a href={link.url}>{link.label || link.url}</a>
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useProfileLinks(pubkey: string | undefined) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const { pubkey: currentUserPubkey } = useKeycast();
  const { mutateAsync: publish, isPending: isPublishing } = useKeycastPublish();

  const query = useQuery({
    queryKey: ['profile-links', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) {
        return { links: [], metadata: undefined };
      }

      // Try Kind 30003 first (standard NIP-51 format)
      const [standardEvent] = await nostr.query(
        [
          {
            kinds: [30003],
            authors: [pubkey],
            '#d': ['links'],
            limit: 1,
          },
        ],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      if (standardEvent) {
        return {
          links: parseLinksFromKind30003(standardEvent),
          metadata: extractLinksMetadata(standardEvent),
          event: standardEvent,
        };
      }

      // Fall back to Kind 16793 (legacy format)
      const [legacyEvent] = await nostr.query(
        [
          {
            kinds: [16793],
            authors: [pubkey],
            limit: 1,
          },
        ],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      if (legacyEvent) {
        return {
          links: parseLinksFromKind16793(legacyEvent),
          metadata: undefined,
          event: legacyEvent,
          isLegacy: true,
        };
      }

      return { links: [], metadata: undefined };
    },
    enabled: !!pubkey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const mutation = useMutation({
    mutationFn: async (links: ProfileLink[]) => {
      if (!currentUserPubkey) {
        throw new Error('Must be logged in to update links');
      }

      const tags = linksToKind30003Tags(links);

      const event = await publish({
        kind: 30003,
        content: '',
        tags,
      });

      return event;
    },
    onSuccess: () => {
      // Invalidate the query to refetch the new data
      queryClient.invalidateQueries({ queryKey: ['profile-links', currentUserPubkey] });
    },
  });

  return {
    // Query state
    links: query.data?.links ?? [],
    metadata: query.data?.metadata,
    event: query.data?.event,
    isLegacy: query.data?.isLegacy ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Mutation
    updateLinks: mutation.mutateAsync,
    isUpdating: isPublishing || mutation.isPending,
    updateError: mutation.error,
  };
}

/**
 * Hook for the current user's profile links.
 * Convenience wrapper that uses the current user's pubkey.
 */
export function useCurrentUserLinks() {
  const { pubkey } = useKeycast();
  return useProfileLinks(pubkey ?? undefined);
}
