import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useKeycastPublish } from './useKeycastPublish';
import { useToast } from './useToast';
import { queryStrict } from '@/lib/relayRead';
import { latestEvent, nextCreatedAt } from '@/lib/replaceableEvent';
import type { NostrEvent } from '@nostrify/nostrify';

const CONTACT_LIST_READ_TIMEOUT_MS = 5000;

/**
 * Check if the current user has liked a video
 */
export function useVideoReaction(videoId: string | undefined, _videoAuthorPubkey: string | undefined) {
  const { nostr } = useNostr();
  const { pubkey, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['divine', 'reaction', videoId, pubkey],
    queryFn: async () => {
      if (!pubkey || !videoId) return null;
      
      const events = await nostr.query([{
        kinds: [7],
        authors: [pubkey],
        '#e': [videoId],
        limit: 1,
      }]);

      return events[0] ?? null;
    },
    enabled: isAuthenticated && !!pubkey && !!videoId,
  });
}

/**
 * Like or unlike a video
 */
export function useToggleVideoReaction() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { pubkey, isAuthenticated } = useAuth();

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
      if (!isAuthenticated || !pubkey) throw new Error('Must be logged in');

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
  const { pubkey, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['divine', 'following', pubkey, targetPubkey],
    queryFn: async () => {
      if (!pubkey || !targetPubkey) return false;
      if (pubkey === targetPubkey) return false;
      
      const events = await nostr.query([{
        kinds: [3],
        authors: [pubkey],
        limit: 1,
      }]);

      if (events.length === 0) return false;
      
      const contactList = events[0];
      return contactList.tags.some(
        ([tag, pk]) => tag === 'p' && pk === targetPubkey
      );
    },
    enabled: isAuthenticated && !!pubkey && !!targetPubkey && pubkey !== targetPubkey,
  });
}

/**
 * Follow or unfollow a user
 */
export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { nostr } = useNostr();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { pubkey, isAuthenticated } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      targetPubkey,
      isCurrentlyFollowing,
    }: { 
      targetPubkey: string;
      isCurrentlyFollowing: boolean;
    }) => {
      if (!isAuthenticated || !pubkey) throw new Error('Must be logged in');

      // Kind 3 is replaceable, so this publish discards the previous follow
      // list wholesale. A read that was not answered would look identical to an
      // empty list and republish a contact list holding only this one follow,
      // silently dropping every other follow and the relay preferences in
      // `content`. queryStrict throws rather than returning [] in that case.
      const events = await queryStrict(
        nostr,
        [{
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        }],
        { timeoutMs: CONTACT_LIST_READ_TIMEOUT_MS },
      );

      // Each relay answers with its own copy, so pick the newest before merging.
      const existingEvent = latestEvent(events);
      const existingTags = existingEvent?.tags ?? [];
      const existingContent = existingEvent?.content ?? '';

      let newTags: string[][];
      
      if (isCurrentlyFollowing) {
        // Unfollow - remove the p tag
        newTags = existingTags.filter(
          tag => !(tag[0] === 'p' && tag[1] === targetPubkey)
        );
      } else {
        // Follow - add the p tag
        const alreadyTagged = existingTags.some(
          ([tag, followedPubkey]) => tag === 'p' && followedPubkey === targetPubkey
        );
        newTags = alreadyTagged
          ? existingTags
          : [
              ...existingTags,
              ['p', targetPubkey, 'wss://relay.divine.video'],
            ];
      }

      // Publish updated contact list
      await publishEvent({
        kind: 3,
        content: existingContent,
        tags: newTags,
        // Second-granular timestamps tie when two follows land in the same
        // second, and relays break that tie inconsistently.
        created_at: nextCreatedAt(existingEvent?.created_at),
      });

      return { action: isCurrentlyFollowing ? 'unfollowed' : 'followed' };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'following', pubkey, variables.targetPubkey] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'user', 'social', variables.targetPubkey] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['divine', 'user', 'social', pubkey] 
      });
    },
    onError: (error) => {
      console.error('Failed to update contact list:', error);
      toast({
        title: 'Could not update friends',
        description: 'The current friend list could not be read safely. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Post a comment on a video
 */
export function usePostComment() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { pubkey, isAuthenticated } = useAuth();

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
      if (!isAuthenticated || !pubkey) throw new Error('Must be logged in');

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
 * Get list of pubkeys the current user follows (from Nostr contact list)
 */
export function useFollowingList(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'contactList', pubkey],
    queryFn: async () => {
      if (!pubkey) return [];

      const events = await nostr.query([{
        kinds: [3],
        authors: [pubkey],
        limit: 1,
      }]);

      if (events.length === 0) return [];

      const contactList = events[0];
      return contactList.tags
        .filter(([tag]) => tag === 'p')
        .map(([, pk]) => pk);
    },
    enabled: !!pubkey,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Repost a video
 */
export function useRepostVideo() {
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { pubkey, isAuthenticated } = useAuth();

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
      if (!isAuthenticated || !pubkey) throw new Error('Must be logged in');

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
