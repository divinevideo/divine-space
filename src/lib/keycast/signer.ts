/**
 * Keycast Signer - NIP-07 compatible signer using Keycast RPC
 */

import { KeycastRpc } from './rpc';
import type { NostrEvent, NostrSigner } from '@nostrify/nostrify';

/**
 * A Nostr signer that uses Keycast RPC for signing operations
 * Compatible with NIP-07 signer interface
 */
export class KeycastSigner implements NostrSigner {
  private rpc: KeycastRpc;
  private cachedPubkey: string | null = null;

  constructor(rpc: KeycastRpc) {
    this.rpc = rpc;
  }

  /**
   * Get the public key
   */
  async getPublicKey(): Promise<string> {
    if (this.cachedPubkey) {
      return this.cachedPubkey;
    }
    this.cachedPubkey = await this.rpc.getPublicKey();
    return this.cachedPubkey;
  }

  /**
   * Sign an event
   */
  async signEvent(event: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>): Promise<NostrEvent> {
    const pubkey = await this.getPublicKey();
    
    const unsigned = {
      kind: event.kind,
      content: event.content,
      tags: event.tags,
      created_at: event.created_at,
      pubkey,
    };

    const signed = await this.rpc.signEvent(unsigned);
    return signed;
  }

  /**
   * NIP-44 encryption
   */
  nip44 = {
    encrypt: async (recipientPubkey: string, plaintext: string): Promise<string> => {
      return this.rpc.nip44Encrypt(recipientPubkey, plaintext);
    },
    decrypt: async (senderPubkey: string, ciphertext: string): Promise<string> => {
      return this.rpc.nip44Decrypt(senderPubkey, ciphertext);
    },
  };

  /**
   * NIP-04 encryption (legacy)
   */
  nip04 = {
    encrypt: async (recipientPubkey: string, plaintext: string): Promise<string> => {
      return this.rpc.nip04Encrypt(recipientPubkey, plaintext);
    },
    decrypt: async (senderPubkey: string, ciphertext: string): Promise<string> => {
      return this.rpc.nip04Decrypt(senderPubkey, ciphertext);
    },
  };
}
