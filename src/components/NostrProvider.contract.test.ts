import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NRelay1, type NostrClientMsg, type NostrEvent, type NostrRelayMsg } from '@nostrify/nostrify';

/**
 * `AuthRetryRelay` in NostrProvider.tsx extends `NRelay1` and builds on its
 * protected `receive`/`send` and its `subscriptions` getter, because that is
 * the only seam nostrify offers for retrying a subscription a relay refused
 * pending NIP-42 AUTH.
 *
 * NostrProvider.test.tsx substitutes a stand-in for `NRelay1` so the subclass
 * can be driven without a socket, which means it would keep passing if a
 * nostrify upgrade moved that seam. These tests use the real `NRelay1` and
 * pin the specific behaviour the subclass depends on, so such an upgrade
 * fails here instead of silently emptying gift-wrap reads at runtime.
 */

const RELAY_URL = 'wss://relay.invalid';

/** Reaches the protected seam a subclass would inherit. */
interface Seam {
  receive(msg: NostrRelayMsg): void;
  send(msg: NostrClientMsg): void;
}

/** Subclasses `NRelay1` exactly as `AuthRetryRelay` does. */
class RecordingRelay extends NRelay1 {
  readonly sent: NostrClientMsg[] = [];

  protected send(msg: NostrClientMsg): void {
    this.sent.push(msg);
    super.send(msg);
  }

  /** Simulate a message arriving from the relay. */
  deliver(msg: NostrRelayMsg): void {
    (this as unknown as Seam).receive(msg);
  }

  /** Simulate the client sending a message. */
  emit(msg: NostrClientMsg): void {
    (this as unknown as Seam).send(msg);
  }
}

/** Stands in for the global WebSocket so constructing a relay opens nothing. */
class InertWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly OPEN = InertWebSocket.OPEN;
  readyState: number = InertWebSocket.CONNECTING;
  binaryType = 'blob';
  bufferedAmount = 0;
  extensions = '';

  constructor(readonly url: string) {}

  addEventListener(): void {}
  removeEventListener(): void {}
  send(): void {}

  close(): void {
    this.readyState = InertWebSocket.CLOSED;
  }
}

const realWebSocket = globalThis.WebSocket;
const open: RecordingRelay[] = [];

function makeRelay(opts: { auth?: (challenge: string) => Promise<NostrEvent> } = {}): RecordingRelay {
  const relay = new RecordingRelay(RELAY_URL, { ...opts, backoff: false, idleTimeout: false });
  open.push(relay);
  return relay;
}

describe('the NRelay1 seam AuthRetryRelay depends on', () => {
  beforeAll(() => {
    globalThis.WebSocket = InertWebSocket as unknown as typeof WebSocket;
  });

  afterAll(() => {
    globalThis.WebSocket = realWebSocket;
  });

  afterEach(async () => {
    await Promise.all(open.splice(0).map((relay) => relay.close()));
  });

  it('leaves receive and send on the prototype for a subclass to extend', () => {
    // `AuthRetryRelay` overrides both and calls `super` from each.
    expect(Object.getOwnPropertyDescriptor(NRelay1.prototype, 'receive')?.value).toBeTypeOf('function');
    expect(Object.getOwnPropertyDescriptor(NRelay1.prototype, 'send')?.value).toBeTypeOf('function');
  });

  it('tracks an open subscription in `subscriptions` so a refused one can be replayed', () => {
    const relay = makeRelay();
    const req: NostrClientMsg = ['REQ', 'sub-1', { kinds: [1059] }];

    relay.emit(req);

    // `replayHeld` looks the original REQ up here to re-send it.
    expect(relay.subscriptions).toContainEqual(req);
  });

  it('forgets a subscription once `receive` handles its CLOSED', () => {
    const relay = makeRelay();
    relay.emit(['REQ', 'sub-1', { kinds: [1059] }]);

    relay.deliver(['CLOSED', 'sub-1', 'auth-required: we only serve gift wraps to their recipient']);

    // Withholding CLOSED from `super.receive` is precisely what keeps the
    // subscription around long enough to replay it.
    expect(relay.subscriptions).toHaveLength(0);
  });

  it('answers an AUTH challenge via opts.auth and sends the result back through `send`', async () => {
    const signed = { id: 'signed-auth-event' } as NostrEvent;
    const auth = vi.fn().mockResolvedValue(signed);
    const relay = makeRelay({ auth });

    relay.deliver(['AUTH', 'challenge-abc']);

    // The AUTH response must route through the overridable `send`, since that
    // is what tells `AuthRetryRelay` a challenge has been answered.
    await vi.waitFor(() => expect(relay.sent).toContainEqual(['AUTH', signed]));
    expect(auth).toHaveBeenCalledWith('challenge-abc');
  });
});
