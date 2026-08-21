import { act, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NostrLoginProvider } from '@nostrify/react/login';
import { useNostr } from '@nostrify/react';
import { generateSecretKey, getPublicKey, nip19, verifyEvent } from 'nostr-tools';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  NostrClientMsg,
  NostrClientREQ,
  NostrEvent,
  NostrRelayMsg,
  NPool,
} from '@nostrify/nostrify';

import { AppProvider } from '@/components/AppProvider';
import NostrProvider from '@/components/NostrProvider';
import type { AppConfig } from '@/contexts/AppContext';
import { useLoginActions } from '@/hooks/useLoginActions';

const RELAY_URL = 'wss://relay.divine.video';

type AuthCallback = (challenge: string) => Promise<NostrEvent>;

/**
 * Stands in for `NRelay1` so the provider's relay subclass can be driven without
 * a socket. It mirrors the parts of `NRelay1` the subclass builds on: `send`
 * tracks open subscriptions, and `receive` drops one on `CLOSED`.
 */
const { relays } = vi.hoisted(() => ({ relays: [] as MockRelay[] }));

interface MockRelay {
  url: string;
  opts: { auth?: AuthCallback };
  sent: NostrClientMsg[];
  delivered: NostrRelayMsg[];
  closed: boolean;
  feed(msg: NostrRelayMsg): void;
  emit(msg: NostrClientMsg): void;
  close(): Promise<void>;
}

vi.mock('@nostrify/nostrify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nostrify/nostrify')>();

  class MockNRelay1 {
    readonly sent: NostrClientMsg[] = [];
    readonly delivered: NostrRelayMsg[] = [];
    closed = false;

    private readonly subs = new Map<string, NostrClientREQ>();

    constructor(readonly url: string, readonly opts: { auth?: AuthCallback } = {}) {
      relays.push(this as unknown as MockRelay);
    }

    get subscriptions(): readonly NostrClientREQ[] {
      return [...this.subs.values()];
    }

    /** Simulate a message arriving from the relay. */
    feed(msg: NostrRelayMsg): void {
      (this as unknown as { receive(m: NostrRelayMsg): void }).receive(msg);
    }

    /** Simulate the client sending a message. */
    emit(msg: NostrClientMsg): void {
      (this as unknown as { send(m: NostrClientMsg): void }).send(msg);
    }

    protected receive(msg: NostrRelayMsg): void {
      this.delivered.push(msg);
      if (msg[0] === 'CLOSED') this.subs.delete(msg[1]);
    }

    protected send(msg: NostrClientMsg): void {
      this.sent.push(msg);
      if (msg[0] === 'REQ') this.subs.set(msg[1], msg);
    }

    close(): Promise<void> {
      this.closed = true;
      return Promise.resolve();
    }
  }

  return { ...actual, NRelay1: MockNRelay1 };
});

const defaultConfig: AppConfig = {
  theme: 'light',
  relayMetadata: {
    relays: [{ url: RELAY_URL, read: true, write: true }],
    updatedAt: 0,
  },
};

let pool: NPool | undefined;
let login: ReturnType<typeof useLoginActions> | undefined;

function Probe() {
  const { nostr } = useNostr();
  pool = nostr as NPool;
  login = useLoginActions();
  return null;
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <AppProvider storageKey='test-app-config' defaultConfig={defaultConfig}>
      <QueryClientProvider client={queryClient}>
        <NostrLoginProvider storageKey='test-login'>
          <NostrProvider>
            <Probe />
          </NostrProvider>
        </NostrLoginProvider>
      </QueryClientProvider>
    </AppProvider>,
  );
}

/** Force the pool to open `url` and return the relay it built. */
function openRelay(url = RELAY_URL): MockRelay {
  pool!.relay(url);
  return relays[relays.length - 1];
}

async function loginWithNsec(): Promise<string> {
  const sk = generateSecretKey();
  await act(async () => {
    login!.nsec(nip19.nsecEncode(sk));
  });
  return getPublicKey(sk);
}

/** Wait for CurrentSignerTracker to publish the signer to the pool's auth callback. */
function authOf(relay: MockRelay): AuthCallback {
  const auth = relay.opts.auth;
  if (!auth) throw new Error(`No auth callback registered for ${relay.url}`);
  return auth;
}

describe('NostrProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    relays.length = 0;
    pool = undefined;
    login = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('NIP-42 AUTH', () => {
    it('signs the challenge as the logged-in user, bound to the relay url', async () => {
      renderProvider();
      const pubkey = await loginWithNsec();

      const event = await waitFor(() => authOf(openRelay())('challenge-abc'));

      expect(event.kind).toBe(22242);
      expect(event.pubkey).toBe(pubkey);
      expect(event.tags).toContainEqual(['relay', RELAY_URL]);
      expect(event.tags).toContainEqual(['challenge', 'challenge-abc']);
      expect(verifyEvent(event)).toBe(true);
    });

    it('rejects the challenge while logged out, leaving public reads usable', async () => {
      renderProvider();

      await expect(authOf(openRelay())('challenge-abc')).rejects.toThrow(/no signer/i);
    });

    it('stops signing after logout', async () => {
      renderProvider();
      await loginWithNsec();

      const auth = authOf(openRelay());
      await waitFor(() => auth('challenge-abc'));

      await act(async () => {
        await login!.logout();
      });

      await waitFor(async () => {
        await expect(auth('challenge-abc')).rejects.toThrow(/no signer/i);
      });
    });
  });

  describe('subscriptions refused pending AUTH', () => {
    const req: NostrClientREQ = ['REQ', 'sub-1', { kinds: [1059] }];
    const refusal: NostrRelayMsg = ['CLOSED', 'sub-1', 'auth-required: we only serve gift wraps to their recipient'];

    it('holds the refusal back and replays the subscription once AUTH is sent', async () => {
      renderProvider();
      await loginWithNsec();

      const relay = openRelay();
      await waitFor(() => expect(authOf(relay)('c')).resolves.toBeTruthy());

      relay.emit(req);
      relay.feed(refusal);

      // The caller must not see the refusal, or its subscription ends for good.
      expect(relay.delivered).not.toContainEqual(refusal);

      relay.emit(['AUTH', { id: 'x' } as NostrEvent]);

      expect(relay.sent.filter((msg) => msg[0] === 'REQ')).toEqual([req, req]);
      expect(relay.sent.findIndex((msg) => msg[0] === 'AUTH'))
        .toBeLessThan(relay.sent.lastIndexOf(req));
    });

    it('passes the refusal through when logged out, since AUTH cannot answer it', async () => {
      renderProvider();

      const relay = openRelay();
      relay.emit(req);
      relay.feed(refusal);

      expect(relay.delivered).toContainEqual(refusal);
    });

    it('delivers the refusal anyway when AUTH never arrives', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      renderProvider();
      await loginWithNsec();

      const relay = openRelay();
      await waitFor(() => expect(authOf(relay)('c')).resolves.toBeTruthy());

      relay.emit(req);
      relay.feed(refusal);
      expect(relay.delivered).not.toContainEqual(refusal);

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(relay.delivered).toContainEqual(refusal);
    });

    it('holds a subscription only once, so a re-refused replay cannot loop', async () => {
      renderProvider();
      await loginWithNsec();

      const relay = openRelay();
      await waitFor(() => expect(authOf(relay)('c')).resolves.toBeTruthy());

      relay.emit(req);
      relay.feed(refusal);
      relay.emit(['AUTH', { id: 'x' } as NostrEvent]);

      relay.feed(refusal);

      expect(relay.delivered).toContainEqual(refusal);
    });

    it('drops a held refusal when the relay is closed', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      renderProvider();
      await loginWithNsec();

      const relay = openRelay();
      await waitFor(() => expect(authOf(relay)('c')).resolves.toBeTruthy());

      relay.emit(req);
      relay.feed(refusal);

      await act(async () => {
        await relay.close();
        vi.advanceTimersByTime(5000);
      });

      // The connection this refusal belonged to is gone, so nothing should
      // still be scheduled to deliver it.
      expect(relay.delivered).not.toContainEqual(refusal);
    });

    it('leaves an ordinary CLOSED alone', async () => {
      renderProvider();
      await loginWithNsec();

      const relay = openRelay();
      await waitFor(() => expect(authOf(relay)('c')).resolves.toBeTruthy());

      const closed: NostrRelayMsg = ['CLOSED', 'sub-1', 'error: something else'];
      relay.emit(req);
      relay.feed(closed);

      expect(relay.delivered).toContainEqual(closed);
    });
  });

  describe('account changes', () => {
    it('replaces the pool so relays reconnect and re-authenticate as the new user', async () => {
      renderProvider();
      await loginWithNsec();

      const relay = openRelay();
      const stalePool = pool;

      await act(async () => {
        await login!.logout();
      });

      await waitFor(() => expect(pool).not.toBe(stalePool));
      expect(relay.closed).toBe(true);
    });

    it('does not churn the pool when logging in before any relay has connected', async () => {
      renderProvider();
      const initialPool = pool;

      await loginWithNsec();
      // The profile read that follows login is what opens the first connection.
      await waitFor(() => expect(relays.length).toBeGreaterThan(0));

      expect(pool).toBe(initialPool);
      expect(relays.some((relay) => relay.closed)).toBe(false);
    });
  });
});
