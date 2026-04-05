import { useEffect, useRef } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { PageStudioShell } from '@/components/page/PageStudioShell';
import { PagePreview } from '@/components/page/PagePreview';
import { useAuth } from '@/hooks/useAuth';
import {
  useDraftPageDocument,
  useEnsureStarterDraft,
  usePublishPageDocument,
} from '@/hooks/usePageDocument';

export default function PageStudio() {
  const { pubkey } = useAuth();
  const draftQuery = useDraftPageDocument(pubkey);
  const { ensureStarterDraft } = useEnsureStarterDraft(pubkey);
  const { publishDraft } = usePublishPageDocument(pubkey);
  const bootstrappedPubkey = useRef<string | undefined>(undefined);

  useSeoMeta({
    title: 'Page Studio - DiVine Space',
    description: 'Edit and publish your hosted page.',
  });

  useEffect(() => {
    if (!pubkey || bootstrappedPubkey.current === pubkey || !draftQuery.isSuccess) {
      return;
    }

    bootstrappedPubkey.current = pubkey;
    if (!draftQuery.data) {
      ensureStarterDraft.mutate();
    }
  }, [draftQuery.data, draftQuery.isSuccess, ensureStarterDraft, pubkey]);

  return (
    <Layout>
      <PageStudioShell
        page={draftQuery.data ?? null}
        pubkey={pubkey}
        onPublish={() => publishDraft.mutate()}
        isPublishing={publishDraft.isPending}
      >
        <PagePreview page={draftQuery.data ?? null} pubkey={pubkey} />
      </PageStudioShell>
    </Layout>
  );
}
