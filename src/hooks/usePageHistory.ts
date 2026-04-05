import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useKeycastPublish } from './useKeycastPublish';
import {
  buildPageRevisionTags,
  createPageRevisionSnapshot,
  parsePageRevisionContent,
} from '@/lib/pageHistory';
import type { PageDocument } from '@/types/page';
import type { PageRevision, PageRevisionSource } from '@/types/pageHistory';

export const PAGE_HISTORY_QUERY_KEY = (pubkey: string, identifier = 'profile-draft') => [
  'page-history',
  pubkey,
  identifier,
];

export function usePageHistory(pubkey?: string, identifier = 'profile-draft') {
  const { nostr } = useNostr();
  const { signer } = useAuth();

  return useQuery({
    queryKey: pubkey ? PAGE_HISTORY_QUERY_KEY(pubkey, identifier) : ['page-history', 'none', identifier],
    enabled: !!pubkey && !!signer?.nip44,
    queryFn: async (): Promise<PageRevision[]> => {
      if (!pubkey || !signer?.nip44) {
        return [];
      }

      const events = await nostr.query([
        {
          kinds: [31234],
          authors: [pubkey],
          '#k': ['30512'],
          limit: 50,
        },
      ]);

      const revisions = await Promise.all(
        events.map(async (event) => {
          const plaintext = await signer.nip44!.decrypt(event.pubkey, event.content);
          return parsePageRevisionContent(event, plaintext);
        })
      );

      return revisions
        .filter((revision): revision is PageRevision => !!revision)
        .filter((revision) => revision.pageIdentifier === identifier)
        .sort((left, right) => right.createdAt - left.createdAt);
    },
  });
}

export function useCreatePageRevision(pubkey?: string) {
  const { pubkey: authPubkey, signer } = useAuth();
  const targetPubkey = pubkey ?? authPubkey;
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  const createRevision = useMutation({
    mutationFn: async ({
      page,
      source,
    }: {
      page: PageDocument;
      source: PageRevisionSource;
    }) => {
      if (!targetPubkey) {
        throw new Error('Not authenticated');
      }

      if (!signer?.nip44) {
        throw new Error('NIP-44 encryption not available');
      }

      const snapshot = createPageRevisionSnapshot(page, targetPubkey, source);
      const revisionId = `${page.identifier}-${source}-${snapshot.createdAt}`;
      const ciphertext = await signer.nip44.encrypt(
        targetPubkey,
        JSON.stringify(snapshot.unsignedEvent)
      );

      return publish({
        kind: 31234,
        content: ciphertext,
        tags: buildPageRevisionTags(page.identifier, source, revisionId),
        created_at: snapshot.createdAt,
      });
    },
    onSuccess: async (_event, variables) => {
      if (!targetPubkey) return;

      await queryClient.invalidateQueries({
        queryKey: PAGE_HISTORY_QUERY_KEY(targetPubkey, variables.page.identifier),
      });
    },
  });

  const restoreRevision = useCallback(async (revision: PageRevision): Promise<PageDocument> => {
    return revision.page;
  }, []);

  return {
    ...createRevision,
    createRevision,
    restoreRevision,
  };
}
