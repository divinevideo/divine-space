// ABOUTME: Hook for detecting and handling divine.space subdomains
// ABOUTME: Reads injected user context from Compute service

interface DivineSpaceUser {
  subdomain: string;
  pubkey: string;
  nip05: string;
}

interface DivineSpaceUnclaimed {
  subdomain: string;
}

declare global {
  interface Window {
    __DIVINE_SPACE_USER__?: DivineSpaceUser;
    __DIVINE_SPACE_UNCLAIMED__?: DivineSpaceUnclaimed;
  }
}

export interface SubdomainContext {
  /** Whether we're on a subdomain */
  isSubdomain: boolean;
  /** The subdomain name (e.g., "alice") */
  subdomain: string | null;
  /** The user's pubkey if subdomain is registered */
  pubkey: string | null;
  /** The user's NIP-05 identifier */
  nip05: string | null;
  /** Whether this subdomain is unclaimed */
  isUnclaimed: boolean;
}

/**
 * Get subdomain context from window globals injected by Compute service
 */
export function useSubdomain(): SubdomainContext {
  // Check for registered user subdomain
  if (typeof window !== 'undefined' && window.__DIVINE_SPACE_USER__) {
    return {
      isSubdomain: true,
      subdomain: window.__DIVINE_SPACE_USER__.subdomain,
      pubkey: window.__DIVINE_SPACE_USER__.pubkey,
      nip05: window.__DIVINE_SPACE_USER__.nip05,
      isUnclaimed: false,
    };
  }

  // Check for unclaimed subdomain
  if (typeof window !== 'undefined' && window.__DIVINE_SPACE_UNCLAIMED__) {
    return {
      isSubdomain: true,
      subdomain: window.__DIVINE_SPACE_UNCLAIMED__.subdomain,
      pubkey: null,
      nip05: null,
      isUnclaimed: true,
    };
  }

  // Not on a subdomain
  return {
    isSubdomain: false,
    subdomain: null,
    pubkey: null,
    nip05: null,
    isUnclaimed: false,
  };
}

/**
 * Get subdomain from hostname (client-side fallback)
 */
export function getSubdomainFromHostname(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;

  // Handle local development
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return null;
  }

  // Extract subdomain from divine.space
  const parts = hostname.split('.');
  if (parts.length >= 3 && hostname.endsWith('.divine.space')) {
    const subdomain = parts.slice(0, -2).join('.');
    if (subdomain === 'www') return null;
    return subdomain.toLowerCase();
  }

  return null;
}
