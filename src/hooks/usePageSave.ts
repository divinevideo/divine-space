import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useKeycastPublish } from './useKeycastPublish';
import { getPageAddress } from '@/lib/pageAddress';

const PAGE_BOOKMARK_KIND = 10003;

function createQueryKey(
  viewerPubkey: string | undefined,
  pagePubkey: string | undefined,
  identifier: string
) {
  return ['divine', 'saved-page', viewerPubkey ?? 'none', pagePubkey ?? 'none', identifier];
}

export function usePageSave(pagePubkey: string | undefined, identifier = 'profile') {
  const { nostr } = useNostr();
  const { pubkey, isAuthenticated } = useAuth();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();
  const pageAddress = pagePubkey ? getPageAddress(pagePubkey, identifier) : null;

  const query = useQuery({
    queryKey: createQueryKey(pubkey, pagePubkey, identifier),
    enabled: isAuthenticated && !!pubkey && !!pageAddress,
    queryFn: async () => {
      if (!pubkey || !pageAddress) {
        return false;
      }

      const events = await nostr.query([
        {
          kinds: [PAGE_BOOKMARK_KIND],
          authors: [pubkey],
          limit: 1,
        },
      ]);

      return events[0]?.tags.some(([tag, value]) => tag === 'a' && value === pageAddress) ?? false;
    },
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !pubkey || !pageAddress) {
        throw new Error('Must be logged in');
      }

      const events = await nostr.query([
        {
          kinds: [PAGE_BOOKMARK_KIND],
          authors: [pubkey],
          limit: 1,
        },
      ]);

      const existingEvent = events[0];
      const existingTags = existingEvent?.tags ?? [];
      const alreadySaved = existingTags.some(([tag, value]) => tag === 'a' && value === pageAddress);
      const nextTags = alreadySaved
        ? existingTags.filter(([tag, value]) => !(tag === 'a' && value === pageAddress))
        : [...existingTags, ['a', pageAddress]];

      await publish({
        kind: PAGE_BOOKMARK_KIND,
        content: existingEvent?.content ?? '',
        tags: nextTags,
      });

      return !alreadySaved;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: createQueryKey(pubkey, pagePubkey, identifier),
      });
    },
  });

  return {
    ...query,
    isSaved: query.data ?? false,
    toggleSave,
  };
}

export default usePageSave;
