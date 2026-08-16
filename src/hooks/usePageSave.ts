import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useKeycastPublish } from './useKeycastPublish';
import { useToast } from './useToast';
import { getPageAddress } from '@/lib/pageAddress';
import { queryStrict } from '@/lib/relayRead';
import { latestEvent, nextCreatedAt } from '@/lib/replaceableEvent';

const PAGE_BOOKMARK_KIND = 10003;
const BOOKMARK_READ_TIMEOUT_MS = 5000;

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
  const { toast } = useToast();
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

      // Kind 10003 is replaceable and shared with divine-mobile, which stores
      // saved videos as `e` tags in it. Publishing on an unanswered read would
      // replace the whole list — public tags and the NIP-44 encrypted private
      // items in `content` alike — with just this one bookmark, so a read that
      // did not complete must abort the write rather than look like an empty
      // list. queryStrict throws instead of returning [].
      const events = await queryStrict(
        nostr,
        [
          {
            kinds: [PAGE_BOOKMARK_KIND],
            authors: [pubkey],
            limit: 1,
          },
        ],
        { timeoutMs: BOOKMARK_READ_TIMEOUT_MS },
      );

      // Each relay answers with its own copy, so pick the newest before merging.
      const existingEvent = latestEvent(events);
      const existingTags = existingEvent?.tags ?? [];
      const alreadySaved = existingTags.some(([tag, value]) => tag === 'a' && value === pageAddress);
      const nextTags = alreadySaved
        ? existingTags.filter(([tag, value]) => !(tag === 'a' && value === pageAddress))
        : [...existingTags, ['a', pageAddress]];

      await publish({
        kind: PAGE_BOOKMARK_KIND,
        // Opaque NIP-44 ciphertext holding the user's private items. Passed
        // through untouched: this client never reads or writes them.
        content: existingEvent?.content ?? '',
        tags: nextTags,
        // created_at is second-granular, so two toggles within one second would
        // otherwise tie. Relays resolve ties inconsistently, so step past the
        // base version to guarantee this one supersedes it.
        created_at: nextCreatedAt(existingEvent?.created_at),
      });

      return !alreadySaved;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: createQueryKey(pubkey, pagePubkey, identifier),
      });
    },
    onError: (error) => {
      console.error('Failed to update saved page list:', error);
      toast({
        title: 'Could not update saved pages',
        description: 'The current saved-page list could not be read safely. Please try again.',
        variant: 'destructive',
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
