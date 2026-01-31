/**
 * Keycast client library for Divine Video OAuth
 * Based on https://github.com/divinevideo/keycast
 */

import { KeycastOAuth } from './oauth';
import { KeycastRpc } from './rpc';
import type { KeycastClientConfig, TokenResponse } from './types';

export { KeycastOAuth } from './oauth';
export { KeycastRpc } from './rpc';
export { generatePkce, validatePkce } from './pkce';

export type {
  KeycastClientConfig,
  KeycastStorage,
  OAuthError,
  PkceChallenge,
  RpcRequest,
  RpcResponse,
  SignedEvent,
  StoredCredentials,
  TokenResponse,
  UnsignedEvent,
} from './types';

/**
 * Create a Keycast client with both OAuth and RPC capabilities
 *
 * @example
 * ```ts
 * import { createKeycastClient } from '@/lib/keycast';
 *
 * const client = createKeycastClient({
 *   serverUrl: 'https://login.divine.video',
 *   clientId: 'divine',
 *   redirectUri: window.location.origin + '/callback',
 * });
 *
 * // Start OAuth flow
 * const { url, pkce } = await client.oauth.getAuthorizationUrl();
 * window.location.href = url;
 *
 * // After callback, exchange code
 * const tokens = await client.oauth.exchangeCode(code, pkce.verifier);
 *
 * // Use RPC client for signing
 * if (tokens.access_token) {
 *   const rpc = client.createRpc(tokens);
 *   const pubkey = await rpc.getPublicKey();
 *   const signed = await rpc.signEvent({ kind: 1, content: 'Hello!', ... });
 * }
 * ```
 */
export function createKeycastClient(config: KeycastClientConfig) {
  const oauth = new KeycastOAuth(config);
  const nostrApi = `${config.serverUrl}/api/nostr`;

  return {
    oauth,

    /**
     * Create an RPC client from token response
     */
    createRpc(tokens: TokenResponse): KeycastRpc | null {
      if (!tokens.access_token) {
        return null;
      }
      return new KeycastRpc({
        nostrApi,
        accessToken: tokens.access_token,
      });
    },
  };
}

/**
 * Default Keycast client configured for login.divine.video
 */
export function createDivineKeycastClient(redirectUri: string) {
  return createKeycastClient({
    serverUrl: 'https://login.divine.video',
    clientId: 'divine',
    redirectUri,
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
  });
}
