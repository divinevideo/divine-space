import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NostrEvent,
  NostrFilter,
  NPool,
  NRelay1,
  type NostrClientMsg,
  type NostrRelayCLOSED,
  type NostrRelayMsg,
  type NRelay1Opts,
} from '@nostrify/nostrify';
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

/** Prefix a relay uses to refuse a subscription until the client authenticates (NIP-42). */
const AUTH_REQUIRED_PREFIX = 'auth-required';

/** How long a refused subscription is held open waiting for AUTH before the refusal is delivered anyway. */
const AUTH_RETRY_TIMEOUT_MS = 5000;

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
 * A relay that retries a subscription the relay refused pending AUTH.
 *
 * `NRelay1` flushes queued `REQ`s as soon as the socket opens, but answering a
 * challenge needs a signature — a network round trip for a remote signer. The
 * `REQ` therefore normally reaches a gating relay first and comes back as
 * `CLOSED "auth-required: ..."`, which ends the caller's subscription. Neither
 * `NRelay1` nor `NPool` retries a closed subscription, so that read would be
 * lost for the lifetime of the connection.
 *
 * So hold the refusal back instead of passing it on, and replay the
 * subscription once the `AUTH` response has been sent. Each subscription is
 * held at most once, and if authentication never happens the original refusal
 * is delivered so the caller still terminates.
 */
class AuthRetryRelay extends NRelay1 {
  private readonly held = new Map<string, { closed: NostrRelayCLOSED; timer: ReturnType<typeof setTimeout> }>();
  private readonly retried = new Set<string>();

  constructor(
    url: string,
    opts: NRelay1Opts,
    /** Whether a challenge can currently be answered; holding a refusal is pointless if not. */
    private readonly canAuthenticate: () => boolean,
  ) {
    super(url, opts);
  }

  protected receive(msg: NostrRelayMsg): void {
    if (this.shouldHold(msg)) {
      this.hold(msg);
      return;
    }

    super.receive(msg);
  }

  protected send(msg: NostrClientMsg): void {
    super.send(msg);

    if (msg[0] === 'AUTH') {
      this.replayHeld();
    }
  }

  /**
   * Release anything still being held. `NRelay1.close` knows nothing about the
   * hold timers, so without this a replaced pool leaves one running per held
   * subscription for up to `AUTH_RETRY_TIMEOUT_MS` after the connection they
   * belonged to is gone.
   */
  async close(): Promise<void> {
    for (const { timer } of this.held.values()) {
      clearTimeout(timer);
    }

    this.held.clear();

    await super.close();
  }

  private shouldHold(msg: NostrRelayMsg): msg is NostrRelayCLOSED {
    return msg[0] === 'CLOSED' &&
      msg[2].startsWith(AUTH_REQUIRED_PREFIX) &&
      !this.retried.has(msg[1]) &&
      this.canAuthenticate();
  }

  private hold(closed: NostrRelayCLOSED): void {
    const subscriptionId = closed[1];

    this.retried.add(subscriptionId);
    this.held.set(subscriptionId, {
      closed,
      timer: setTimeout(() => {
        this.held.delete(subscriptionId);
        super.receive(closed);
      }, AUTH_RETRY_TIMEOUT_MS),
    });
  }

  private replayHeld(): void {
    const held = [...this.held.values()];
    this.held.clear();

    for (const { closed, timer } of held) {
      clearTimeout(timer);

      const req = this.subscriptions.find((sub) => sub[1] === closed[1]);

      if (req) {
        this.send(req);
      } else {
        super.receive(closed);
      }
    }
  }
}

/**
 * Keeps `signerRef` pointed at the current user's signer, and reports account
 * changes so the provider can shed connections authenticated as someone else.
 * The pool (and its `auth` callback) is created once, before login, but the
 * signer changes on login/logout; the AUTH callback reads this ref at challenge
 * time. Rendered inside NostrContext so it can resolve the active login via
 * useCurrentUser.
 */
function CurrentSignerTracker(
  { signerRef, onAccountChange }: {
    signerRef: React.MutableRefObject<CurrentSigner>;
    onAccountChange: () => void;
  },
): null {
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;
  const previousPubkey = useRef(pubkey);

  // Declared first so the new signer is in place before the pool is replaced.
  useEffect(() => {
    signerRef.current = user?.signer;
  }, [user, signerRef]);

  useEffect(() => {
    if (previousPubkey.current === pubkey) return;
    previousPubkey.current = pubkey;
    onAccountChange();
  }, [pubkey, onAccountChange]);

  return null;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config } = useAppContext();

  const queryClient = useQueryClient();

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Bumped when the pool is replaced, to publish the new one on the context.
  const [, setPoolGeneration] = useState(0);

  // Use refs so the pool always has the latest data
  const relayMetadata = useRef(config.relayMetadata);

  // The pool (and its auth callback) is built once, but the logged-in user and
  // signer change; the NIP-42 auth callback reads this ref at challenge time.
  // CurrentSignerTracker keeps it current.
  const signerRef = useRef<CurrentSigner>(undefined);

  const createPool = useCallback(() => {
    return new NPool({
      eoseTimeout: REPLACEABLE_READ_SETTLE_TIMEOUT_MS,
      open(url: string) {
        return new AuthRetryRelay(
          url,
          {
            // Sign NIP-42 AUTH challenges as the current user so recipient-gated
            // reads (e.g. kind 1059 gift wraps) are delivered. Bound to this
            // relay's url per NIP-42.
            auth: (challenge: string) => signAuthEvent(url, challenge, signerRef.current),
          },
          () => signerRef.current !== undefined,
        );
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
  }, []);

  // NIP-42 authenticates the socket, not the request, so a connection opened
  // for the previous account stays authenticated as them and the relay keeps
  // refusing the new account's recipient-gated reads. Replace the pool so every
  // relay reconnects and answers the next challenge as the current user.
  const handleAccountChange = useCallback(() => {
    const stale = pool.current;

    // A pool that never opened a socket has no relay session to shed.
    if (!stale?.relays.size) return;

    pool.current = createPool();
    setPoolGeneration((generation) => generation + 1);

    void stale.close();
    queryClient.invalidateQueries({ queryKey: ['nostr'] });
  }, [createPool, queryClient]);

  // Invalidate Nostr queries when relay metadata changes
  useEffect(() => {
    relayMetadata.current = config.relayMetadata;
    queryClient.invalidateQueries({ queryKey: ['nostr'] });
  }, [config.relayMetadata, queryClient]);

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = createPool();
  }

  return (
    <NostrContext.Provider value={{ nostr: pool.current }}>
      <CurrentSignerTracker
        signerRef={signerRef}
        onAccountChange={handleAccountChange}
      />
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;
