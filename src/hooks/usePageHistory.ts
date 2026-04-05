import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useKeycastPublish } from './useKeycastPublish';
import {
  buildPageRevisionTags,
  createPageRevisionSnapshot,
  parsePageRevisionContent,
} from '@/lib/pageHistory';
import type { PageDocument } from '@/types/page';
import type { PageRevision, PageRevisionSource } from '@/types/pageHistory';

export const PAGE_HISTORY_KIND = 31234;

export const PAGE_HISTORY_QUERY_KEY = (pubkey: string, identifier = 'profile-draft') => [
  'page-history',
  pubkey,
  identifier,
];

export function usePageHistory(identifier = 'profile-draft') {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: user ? PAGE_HISTORY_QUERY_KEY(user.pubkey, identifier) : ['page-history', 'none', identifier],
    enabled: !!user?.pubkey && !!user.signer?.nip44,
    queryFn: async (): Promise<PageRevision[]> => {
      if (!user?.pubkey || !user.signer?.nip44) {
        return [];
      }

      const events = await nostr.query([
        {
          kinds: [PAGE_HISTORY_KIND],
          authors: [user.pubkey],
          '#k': ['30512'],
          limit: 50,
        },
      ]);

      const revisions = await Promise.all(
        events.map(async (event) => {
          try {
            const plaintext = await user.signer.nip44!.decrypt(user.pubkey, event.content);
            return parsePageRevisionContent(event, plaintext);
          } catch {
            return null;
          }
        })
      );

      return revisions
        .filter((revision): revision is PageRevision => revision !== null)
        .filter((revision) => revision.pageIdentifier === identifier)
        .sort((left, right) => right.createdAt - left.createdAt);
    },
  });

  const createRevision = useMutation({
    mutationFn: async ({
      page,
      source,
    }: {
      page: PageDocument;
      source: PageRevisionSource;
    }) => {
      if (!user?.pubkey) {
        throw new Error('Not authenticated');
      }

      if (!user.signer?.nip44) {
        throw new Error('NIP-44 encryption not available');
      }

      const snapshot = createPageRevisionSnapshot(page, source);
      const revisionId = `${page.identifier}-${source}-${snapshot.createdAt}`;
      const ciphertext = await user.signer.nip44.encrypt(user.pubkey, JSON.stringify(snapshot));

      return publish({
        kind: PAGE_HISTORY_KIND,
        content: ciphertext,
        tags: buildPageRevisionTags(revisionId),
        created_at: snapshot.createdAt,
      });
    },
    onSuccess: async () => {
      if (!user?.pubkey) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: PAGE_HISTORY_QUERY_KEY(user.pubkey, identifier),
      });
    },
  });

  return {
    ...query,
    revisions: query.data ?? [],
    createRevision,
  };
}

export default usePageHistory;
