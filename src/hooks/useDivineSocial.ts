import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Check if the current user has liked a video
 */
export function useVideoReaction(videoId: string | undefined, videoAuthorPubkey: string | undefined) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['divine', 'reaction', videoId, user?.pubkey],
    queryFn: async () => {
      if (!user || !videoId) return null;
      
      const events = await nostr.query([{
        kinds: [7],
        authors: [user.pubkey],
        '#e': [videoId],
        limit: 1,
      }]);

      return events[0] ?? null;
    },
    enabled: !!user && !!videoId,
  });
}

/**
 * Like or unlike a video
 */
export function useToggleVideoReaction() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ 
      videoId, 
      videoAuthorPubkey,
      videoKind,
      existingReaction 
    }: { 
      videoId: string; 
      videoAuthorPubkey: string;
      videoKind: number;
      existingReaction: NostrEvent | null;
    }) => {
      if (!user) throw new Error('Must be logged in');

      if (existingReaction) {
        // Unlike - create deletion event
        await publishEvent({
          kind: 5,
          content: '',
          tags: [['e', existingReaction.id]],
        });
        return { action: 'unliked' };
      } else {
        // Like - create reaction event
        await publishEvent({
          kind: 7,
          content: '+',
          tags: [
            ['e', videoId],
            ['p', videoAuthorPubkey],
            ['k', videoKind.toString()],
          ],
        });
        return { action: 'liked' };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'reaction', variables.videoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'video', 'stats', variables.videoId] 
      });
    },
  });
}

/**
 * Check if the current user is following another user
 */
export function useIsFollowing(targetPubkey: string | undefined) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['divine', 'following', user?.pubkey, targetPubkey],
    queryFn: async () => {
      if (!user || !targetPubkey) return false;
      if (user.pubkey === targetPubkey) return false;
      
      const events = await nostr.query([{
        kinds: [3],
        authors: [user.pubkey],
        limit: 1,
      }]);

      if (events.length === 0) return false;
      
      const contactList = events[0];
      return contactList.tags.some(
        ([tag, pubkey]) => tag === 'p' && pubkey === targetPubkey
      );
    },
    enabled: !!user && !!targetPubkey && user?.pubkey !== targetPubkey,
  });
}

/**
 * Follow or unfollow a user
 */
export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { nostr } = useNostr();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ 
      targetPubkey,
      isCurrentlyFollowing,
    }: { 
      targetPubkey: string;
      isCurrentlyFollowing: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Get current contact list
      const events = await nostr.query([{
        kinds: [3],
        authors: [user.pubkey],
        limit: 1,
      }]);

      const existingTags = events[0]?.tags ?? [];
      const existingContent = events[0]?.content ?? '';

      let newTags: string[][];
      
      if (isCurrentlyFollowing) {
        // Unfollow - remove the p tag
        newTags = existingTags.filter(
          tag => !(tag[0] === 'p' && tag[1] === targetPubkey)
        );
      } else {
        // Follow - add the p tag
        newTags = [
          ...existingTags,
          ['p', targetPubkey, 'wss://relay.divine.video'],
        ];
      }

      // Publish updated contact list
      await publishEvent({
        kind: 3,
        content: existingContent,
        tags: newTags,
      });

      return { action: isCurrentlyFollowing ? 'unfollowed' : 'followed' };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'following', user?.pubkey, variables.targetPubkey] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'user', 'social', variables.targetPubkey] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'user', 'social', user?.pubkey] 
      });
    },
  });
}

/**
 * Post a comment on a video
 */
export function usePostComment() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ 
      videoId,
      videoAuthorPubkey,
      videoKind,
      content,
      parentId,
      parentAuthorPubkey,
      parentKind,
    }: { 
      videoId: string;
      videoAuthorPubkey: string;
      videoKind: number;
      content: string;
      parentId?: string;
      parentAuthorPubkey?: string;
      parentKind?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const tags: string[][] = [
        ['E', videoId],
        ['K', videoKind.toString()],
        ['P', videoAuthorPubkey],
        ['e', parentId ?? videoId],
        ['k', parentKind?.toString() ?? videoKind.toString()],
        ['p', parentAuthorPubkey ?? videoAuthorPubkey],
      ];

      return publishEvent({
        kind: 1111,
        content,
        tags,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'comments', variables.videoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'video', 'stats', variables.videoId] 
      });
    },
  });
}

/**
 * Fetch comments for a video
 */
export function useVideoComments(videoId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['divine', 'comments', videoId],
    queryFn: async () => {
      if (!videoId) return [];
      
      const events = await nostr.query([{
        kinds: [1111],
        '#E': [videoId],
        limit: 100,
      }]);

      return events.sort((a, b) => a.created_at - b.created_at);
    },
    enabled: !!videoId,
  });
}

/**
 * Repost a video
 */
export function useRepostVideo() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ 
      videoId,
      videoAuthorPubkey,
      videoKind,
    }: { 
      videoId: string;
      videoAuthorPubkey: string;
      videoKind: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      return publishEvent({
        kind: 16,
        content: '',
        tags: [
          ['e', videoId, 'wss://relay.divine.video'],
          ['p', videoAuthorPubkey],
          ['k', videoKind.toString()],
        ],
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'video', 'stats', variables.videoId] 
      });
    },
  });
}
