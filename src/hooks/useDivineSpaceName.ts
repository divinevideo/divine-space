// ABOUTME: Hook for divine.space name registration and lookup
// ABOUTME: Interacts with /api/register-name and /api/lookup-name endpoints

import { useMutation, useQuery } from '@tanstack/react-query';

const API_BASE = 'https://divine.space';

interface LookupResult {
  found: boolean;
  name?: string;
  pubkey?: string;
  nip05?: string;
  subdomain?: string;
}

interface RegisterResult {
  success: boolean;
  name: string;
  nip05: string;
  subdomain: string;
  error?: string;
}

/**
 * Look up a name registration by name
 */
export function useLookupName(name: string | undefined) {
  return useQuery({
    queryKey: ['divine-space-name', name],
    queryFn: async (): Promise<LookupResult> => {
      if (!name) return { found: false };

      const response = await fetch(`${API_BASE}/api/lookup-name?name=${encodeURIComponent(name)}`);
      return response.json();
    },
    enabled: !!name,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Look up a name registration by pubkey
 */
export function useLookupPubkey(pubkey: string | undefined) {
  return useQuery({
    queryKey: ['divine-space-pubkey', pubkey],
    queryFn: async (): Promise<LookupResult> => {
      if (!pubkey) return { found: false };

      const response = await fetch(`${API_BASE}/api/lookup-name?pubkey=${encodeURIComponent(pubkey)}`);
      return response.json();
    },
    enabled: !!pubkey,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Check if a name is available
 */
export function useCheckNameAvailability(name: string | undefined) {
  return useQuery({
    queryKey: ['divine-space-name-available', name],
    queryFn: async (): Promise<{ available: boolean; error?: string }> => {
      if (!name) return { available: false, error: 'No name provided' };

      // Validate format
      const nameRegex = /^[a-z0-9_-]{3,30}$/;
      if (!nameRegex.test(name.toLowerCase())) {
        return { available: false, error: 'Invalid name format' };
      }

      const response = await fetch(`${API_BASE}/api/lookup-name?name=${encodeURIComponent(name)}`);
      const data: LookupResult = await response.json();

      return { available: !data.found };
    },
    enabled: !!name && name.length >= 3,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Register a name for the current user
 */
export function useRegisterName() {
  return useMutation({
    mutationFn: async ({ name, pubkey }: { name: string; pubkey: string }): Promise<RegisterResult> => {
      const response = await fetch(`${API_BASE}/api/register-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, pubkey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register name');
      }

      return data;
    },
  });
}

/**
 * Validate a name format
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }

  if (name.length > 30) {
    return { valid: false, error: 'Name must be at most 30 characters' };
  }

  const nameRegex = /^[a-z0-9_-]+$/;
  if (!nameRegex.test(name.toLowerCase())) {
    return { valid: false, error: 'Name can only contain letters, numbers, underscores, and hyphens' };
  }

  const reservedNames = ['www', 'api', 'admin', 'root', 'mail', 'email', 'support', 'help', 'info', 'divine', 'nostr'];
  if (reservedNames.includes(name.toLowerCase())) {
    return { valid: false, error: 'This name is reserved' };
  }

  return { valid: true };
}
