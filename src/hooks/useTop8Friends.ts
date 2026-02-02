import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useKeycastPublish } from './useKeycastPublish';
import {
  parseTop8FromKind30000,
  parseTop8FromKind16793,
  top8ToKind30000Tags,
  type TopFriend,
} from '@/lib/parseTop8';

// Re-export TopFriend type for consumers
export type { TopFriend };

/**
 * NIP-51 Kind 30000 "Follow Sets" for Top 8 Friends.
 * This is the standard format that will be readable by other Nostr apps like Listr.
 */
export const TOP8_KIND_STANDARD = 30000;

/**
 * Legacy Kind 16793 for DiVine profile customization.
 * @deprecated Use Kind 30000 instead. This is only used for backward compatibility.
 */
export const TOP8_KIND_LEGACY = 16793;

/**
 * The d-tag identifier for the Top 8 list in Kind 30000 events.
 */
export const TOP8_D_TAG = 'top8';

/**
 * Hook to fetch and manage a user's Top 8 Friends list.
 *
 * This hook implements NIP-51 Kind 30000 "Follow Sets" for the Top 8 feature,
 * while maintaining backward compatibility with the legacy Kind 16793 format.
 *
 * Query priority:
 * 1. Kind 30000 with d-tag "top8" (NIP-51 standard)
 * 2. Kind 16793 (legacy DiVine format) - fallback only
 *
 * @param pubkey - The user's pubkey to fetch Top 8 for (hex format)
 * @returns Object containing friends array, loading/error states, and update functions
 *
 * @example
 * ```tsx
 * function Top8Widget({ pubkey }: { pubkey: string }) {
 *   const { friends, isLoading, updateTop8 } = useTop8Friends(pubkey);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       {friends.map(friend => (
 *         <FriendCard key={friend.pubkey} friend={friend} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTop8Friends(pubkey: string | undefined) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const { mutateAsync: publish } = useKeycastPublish();

  const query = useQuery({
    queryKey: ['top8', pubkey],
    queryFn: async (): Promise<TopFriend[]> => {
      if (!pubkey) return [];

      // Try Kind 30000 first (NIP-51 standard)
      const [standardEvent] = await nostr.query([{
        kinds: [TOP8_KIND_STANDARD],
        authors: [pubkey],
        '#d': [TOP8_D_TAG],
        limit: 1,
      }]);

      if (standardEvent) {
        return parseTop8FromKind30000(standardEvent);
      }

      // Fall back to Kind 16793 (legacy DiVine format)
      const [legacyEvent] = await nostr.query([{
        kinds: [TOP8_KIND_LEGACY],
        authors: [pubkey],
        limit: 1,
      }]);

      return parseTop8FromKind16793(legacyEvent);
    },
    enabled: !!pubkey,
  });

  const mutation = useMutation({
    mutationFn: async (friends: TopFriend[]) => {
      const tags = top8ToKind30000Tags(friends);
      await publish({
        kind: TOP8_KIND_STANDARD,
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top8', pubkey] });
    },
  });

  return {
    // Query state
    ...query,
    // Convenience accessor for the friends array
    friends: query.data ?? [],
    // Mutation functions
    updateTop8: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

/**
 * Hook to add a friend to the current user's Top 8.
 *
 * @param currentUserPubkey - The current user's pubkey
 * @returns Mutation function to add a friend
 *
 * @example
 * ```tsx
 * function AddFriendButton({ friendPubkey }: { friendPubkey: string }) {
 *   const { user } = useCurrentUser();
 *   const { friends, updateTop8 } = useTop8Friends(user?.pubkey);
 *   const addFriend = useAddToTop8(user?.pubkey, friends, updateTop8);
 *
 *   return (
 *     <Button onClick={() => addFriend(friendPubkey)}>
 *       Add to Top 8
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAddToTop8(
  currentUserPubkey: string | undefined,
  currentFriends: TopFriend[],
  updateTop8: (friends: TopFriend[]) => Promise<void>
) {
  return useMutation({
    mutationFn: async (friendPubkey: string) => {
      if (!currentUserPubkey) {
        throw new Error('Not authenticated');
      }

      // Check if already in Top 8
      if (currentFriends.some(f => f.pubkey === friendPubkey)) {
        throw new Error('Already in Top 8');
      }

      // Check if Top 8 is full
      if (currentFriends.length >= 8) {
        throw new Error('Top 8 is full');
      }

      // Find next available position
      const usedPositions = new Set(currentFriends.map(f => f.position));
      let nextPosition = 1;
      while (usedPositions.has(nextPosition) && nextPosition <= 8) {
        nextPosition++;
      }

      const newFriends: TopFriend[] = [
        ...currentFriends,
        { pubkey: friendPubkey, position: nextPosition },
      ];

      await updateTop8(newFriends);
      return newFriends;
    },
  });
}

/**
 * Hook to remove a friend from the current user's Top 8.
 *
 * @param currentUserPubkey - The current user's pubkey
 * @returns Mutation function to remove a friend
 */
export function useRemoveFromTop8(
  currentUserPubkey: string | undefined,
  currentFriends: TopFriend[],
  updateTop8: (friends: TopFriend[]) => Promise<void>
) {
  return useMutation({
    mutationFn: async (friendPubkey: string) => {
      if (!currentUserPubkey) {
        throw new Error('Not authenticated');
      }

      const newFriends = currentFriends.filter(f => f.pubkey !== friendPubkey);

      // Recalculate positions to be sequential
      const reorderedFriends = newFriends.map((f, index) => ({
        ...f,
        position: index + 1,
      }));

      await updateTop8(reorderedFriends);
      return reorderedFriends;
    },
  });
}

/**
 * Hook to reorder friends in the Top 8.
 *
 * @param currentUserPubkey - The current user's pubkey
 * @returns Mutation function to reorder friends
 */
export function useReorderTop8(
  currentUserPubkey: string | undefined,
  updateTop8: (friends: TopFriend[]) => Promise<void>
) {
  return useMutation({
    mutationFn: async (newOrder: string[]) => {
      if (!currentUserPubkey) {
        throw new Error('Not authenticated');
      }

      const reorderedFriends: TopFriend[] = newOrder.map((pk, index) => ({
        pubkey: pk,
        position: index + 1,
      }));

      await updateTop8(reorderedFriends);
      return reorderedFriends;
    },
  });
}
