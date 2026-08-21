import React, { useEffect, useRef } from 'react';
import { NostrEvent, NostrFilter, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import type { NUser } from '@nostrify/react/login';
import { useQueryClient } from '@tanstack/react-query';
import { nip42 } from 'nostr-tools';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';

interface NostrProviderProps {
  children: React.ReactNode;
}

const REPLACEABLE_READ_SETTLE_TIMEOUT_MS = 5000;

/** Signer for the currently logged-in user, or undefined when logged out. */
type CurrentSigner = NUser['signer'] | undefined;

/**
 * Answer a relay's NIP-42 AUTH challenge by signing a kind 22242 event as the
 * current user. Divine's relay gates recipient-only reads (e.g. kind 1059 gift
 * wraps) behind AUTH, so without this the pool silently receives none of them.
 *
 * When logged out there is no signer, so we reject; NRelay1 swallows the
 * rejection, leaving the connection usable for public reads.
 */
function signAuthEvent(
  relayUrl: string,
  challenge: string,
  signer: CurrentSigner,
): Promise<NostrEvent> {
  if (!signer) {
    return Promise.reject(
      new Error('Cannot answer NIP-42 AUTH challenge: no signer for the current user'),
    );
  }

  return signer.signEvent(nip42.makeAuthEvent(relayUrl, challenge));
}

/**
 * Keeps `signerRef` pointed at the current user's signer. The pool (and its
 * `auth` callback) is created once, before login, but the signer changes on
 * login/logout; the AUTH callback reads this ref at challenge time. Rendered
 * inside NostrContext so it can resolve the active login via useCurrentUser.
 */
function CurrentSignerTracker(
  { signerRef }: { signerRef: React.MutableRefObject<CurrentSigner> },
): null {
  const { user } = useCurrentUser();

  useEffect(() => {
    signerRef.current = user?.signer;
  }, [user, signerRef]);

  return null;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config } = useAppContext();

  const queryClient = useQueryClient();

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Use refs so the pool always has the latest data
  const relayMetadata = useRef(config.relayMetadata);

  // The pool (and its auth callback) is built once, but the logged-in user and
  // signer change; the NIP-42 auth callback reads this ref at challenge time.
  // CurrentSignerTracker keeps it current.
  const signerRef = useRef<CurrentSigner>(undefined);

  // Invalidate Nostr queries when relay metadata changes
  useEffect(() => {
    relayMetadata.current = config.relayMetadata;
    queryClient.invalidateQueries({ queryKey: ['nostr'] });
  }, [config.relayMetadata, queryClient]);

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = new NPool({
      eoseTimeout: REPLACEABLE_READ_SETTLE_TIMEOUT_MS,
      open(url: string) {
        return new NRelay1(url, {
          // Sign NIP-42 AUTH challenges as the current user so recipient-gated
          // reads (e.g. kind 1059 gift wraps) are delivered. Bound to this
          // relay's url per NIP-42.
          auth: (challenge: string) => signAuthEvent(url, challenge, signerRef.current),
        });
      },
      reqRouter(filters: NostrFilter[]) {
        const routes = new Map<string, NostrFilter[]>();

        // Route to all read relays
        const readRelays = relayMetadata.current.relays
          .filter(r => r.read)
          .map(r => r.url);

        for (const url of readRelays) {
          routes.set(url, filters);
        }

        return routes;
      },
      eventRouter(_event: NostrEvent) {
        // Get write relays from metadata
        const writeRelays = relayMetadata.current.relays
          .filter(r => r.write)
          .map(r => r.url);

        const allRelays = new Set<string>(writeRelays);

        return [...allRelays];
      },
    });
  }

  return (
    <NostrContext.Provider value={{ nostr: pool.current }}>
      <CurrentSignerTracker signerRef={signerRef} />
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;
