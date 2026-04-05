import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useKeycastPublish } from './useKeycastPublish';

/**
 * Parse hashtags from content
 */
function extractHashtags(content: string): string[] {
  const regex = /#(\w+)/g;
  const matches = content.match(regex);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

/**
 * Post a text note (Kind 1)
 */
export function usePostNote() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { pubkey, isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async ({
      content,
      replyTo,
      quotedEvent,
    }: {
      content: string;
      replyTo?: {
        id: string;
        pubkey: string;
        rootId?: string;
        rootPubkey?: string;
      };
      quotedEvent?: {
        id: string;
        pubkey: string;
      };
    }) => {
      if (!isAuthenticated || !pubkey) throw new Error('Must be logged in');
      if (!content.trim()) throw new Error('Content cannot be empty');

      const tags: string[][] = [];

      // Add hashtags
      const hashtags = extractHashtags(content);
      hashtags.forEach(tag => {
        tags.push(['t', tag]);
      });

      // Handle replies (NIP-10)
      if (replyTo) {
        // If this is a reply to a reply, include the root
        if (replyTo.rootId) {
          tags.push(['e', replyTo.rootId, '', 'root']);
          tags.push(['e', replyTo.id, '', 'reply']);
          if (replyTo.rootPubkey) {
            tags.push(['p', replyTo.rootPubkey]);
          }
        } else {
          // Direct reply - the parent is both root and reply
          tags.push(['e', replyTo.id, '', 'root']);
        }
        tags.push(['p', replyTo.pubkey]);
      }

      // Handle quotes (NIP-18)
      if (quotedEvent) {
        tags.push(['q', quotedEvent.id]);
        tags.push(['p', quotedEvent.pubkey]);
      }

      return publishEvent({
        kind: 1,
        content: content.trim(),
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: () => {
      // Invalidate user posts to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['user', 'posts', pubkey]
      });
      queryClient.invalidateQueries({
        queryKey: ['nostr', 'posts']
      });
    },
  });
}

/**
 * React to a note (Kind 7)
 */
export function useReactToNote() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { pubkey, isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async ({
      noteId,
      notePubkey,
      reaction = '+',
    }: {
      noteId: string;
      notePubkey: string;
      reaction?: string;
    }) => {
      if (!isAuthenticated || !pubkey) throw new Error('Must be logged in');

      return publishEvent({
        kind: 7,
        content: reaction,
        tags: [
          ['e', noteId],
          ['p', notePubkey],
          ['k', '1'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['note', 'reactions', variables.noteId]
      });
    },
  });
}

/**
 * Repost a note (Kind 6 for Kind 1 reposts)
 */
export function useRepostNote() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { pubkey, isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async ({
      noteId,
      notePubkey,
      noteContent,
    }: {
      noteId: string;
      notePubkey: string;
      noteContent?: string;
    }) => {
      if (!isAuthenticated || !pubkey) throw new Error('Must be logged in');

      // Kind 6 repost includes the original event in content (NIP-18)
      const content = noteContent ? JSON.stringify({
        id: noteId,
        pubkey: notePubkey,
        content: noteContent,
      }) : '';

      return publishEvent({
        kind: 6,
        content,
        tags: [
          ['e', noteId, ''],
          ['p', notePubkey],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['nostr', 'posts']
      });
    },
  });
}

/**
 * Delete a note (Kind 5)
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { pubkey, isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async ({
      noteId,
      reason = '',
    }: {
      noteId: string;
      reason?: string;
    }) => {
      if (!isAuthenticated || !pubkey) throw new Error('Must be logged in');

      return publishEvent({
        kind: 5,
        content: reason,
        tags: [
          ['e', noteId],
          ['k', '1'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user', 'posts', pubkey]
      });
      queryClient.invalidateQueries({
        queryKey: ['nostr', 'posts']
      });
    },
  });
}
