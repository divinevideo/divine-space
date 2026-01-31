import { useKeycast } from '@/contexts/KeycastContext';
import { useAuthor } from './useAuthor';

/**
 * Get the current Keycast-authenticated user with their profile data
 */
export function useKeycastUser() {
  const { isAuthenticated, isLoading, pubkey, signer, rpc, login, logout } = useKeycast();
  const author = useAuthor(pubkey ?? undefined);

  return {
    isAuthenticated,
    isLoading,
    pubkey,
    signer,
    rpc,
    login,
    logout,
    metadata: author.data?.metadata,
    event: author.data?.event,
    // Compatibility with useCurrentUser pattern
    user: isAuthenticated && pubkey && signer ? {
      pubkey,
      signer,
    } : undefined,
  };
}
