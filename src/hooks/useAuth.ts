/**
 * Unified authentication hook that supports both Keycast and Nostrify login systems
 *
 * Use this hook anywhere you need to check if the user is authenticated
 * or get their pubkey/signer. It automatically handles both:
 * - Keycast OAuth (login.divine.video)
 * - Standard Nostr methods (NIP-07 extension, NSEC, NIP-46 bunker)
 */

import { useKeycast } from '@/contexts/KeycastContext';
import { useCurrentUser } from './useCurrentUser';
import type { NostrSigner } from '@nostrify/nostrify';

export interface AuthState {
  /** Whether the user is authenticated (via either system) */
  isAuthenticated: boolean;
  /** Whether we're still checking for existing session */
  isLoading: boolean;
  /** The user's public key (hex) */
  pubkey: string | undefined;
  /** The signer for signing events */
  signer: NostrSigner | undefined;
  /** Whether the user logged in via Keycast */
  isKeycastLogin: boolean;
  /** Logout function */
  logout: () => void;
}

export function useAuth(): AuthState {
  const {
    isAuthenticated: keycastAuth,
    isLoading: keycastLoading,
    pubkey: keycastPubkey,
    signer: keycastSigner,
    logout: keycastLogout
  } = useKeycast();

  const { user: nostrifyUser } = useCurrentUser();

  const isKeycastLogin = keycastAuth && !!keycastPubkey;
  const isNostrifyLogin = !!nostrifyUser;

  const isAuthenticated = isKeycastLogin || isNostrifyLogin;
  const pubkey = keycastPubkey ?? nostrifyUser?.pubkey;
  const signer = keycastSigner ?? nostrifyUser?.signer;

  const logout = () => {
    if (isKeycastLogin) {
      keycastLogout();
    }
    // For Nostrify, the user would need to use the login actions to logout
    // This is handled in LoginArea component
  };

  return {
    isAuthenticated,
    isLoading: keycastLoading,
    pubkey,
    signer,
    isKeycastLogin,
    logout,
  };
}
