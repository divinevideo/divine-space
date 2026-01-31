import { useNostr } from "@nostrify/react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useKeycast } from "@/contexts/KeycastContext";
import type { NostrEvent } from "@nostrify/nostrify";

/**
 * Publish Nostr events using the Keycast signer
 */
export function useKeycastPublish(): UseMutationResult<NostrEvent, Error, Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>> {
  const { nostr } = useNostr();
  const { signer, pubkey } = useKeycast();

  return useMutation({
    mutationFn: async (t: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>) => {
      if (!signer || !pubkey) {
        throw new Error("User is not logged in");
      }

      const tags = t.tags ?? [];

      // Add the client tag if it doesn't exist
      if (typeof location !== 'undefined' && location.protocol === "https:" && !tags.some(([name]) => name === "client")) {
        tags.push(["client", location.hostname]);
      }

      const event = await signer.signEvent({
        kind: t.kind,
        content: t.content ?? "",
        tags,
        created_at: t.created_at ?? Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(5000) });
      return event;
    },
    onError: (error) => {
      console.error("Failed to publish event:", error);
    },
    onSuccess: (data) => {
      console.log("Event published successfully:", data);
    },
  });
}
