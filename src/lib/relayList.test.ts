import { describe, expect, it } from 'vitest';
import { applyLocalRelayEdit, parseRelayListTags, relayListTags } from './relayList';

describe('relayListTags', () => {
  it('round-trips NIP-65 relay tags', () => {
    const relays = [
      { url: 'wss://both.example/', read: true, write: true },
      { url: 'wss://read.example/', read: true, write: false },
      { url: 'wss://write.example/', read: false, write: true },
      { url: 'wss://off.example/', read: false, write: false },
    ];

    expect(relayListTags(relays)).toEqual([
      ['r', 'wss://both.example/'],
      ['r', 'wss://read.example/', 'read'],
      ['r', 'wss://write.example/', 'write'],
    ]);
    expect(parseRelayListTags(relayListTags(relays))).toEqual(relays.slice(0, 3));
  });
});

describe('applyLocalRelayEdit', () => {
  it('applies a stale local toggle onto the current remote list', () => {
    const localBefore = [
      { url: 'wss://relay.divine.video/', read: true, write: true },
      { url: 'wss://relay.damus.io/', read: true, write: true },
    ];
    const localAfter = [
      { url: 'wss://relay.divine.video/', read: false, write: true },
      { url: 'wss://relay.damus.io/', read: true, write: true },
    ];
    const remoteBase = [
      { url: 'wss://relay.divine.video/', read: true, write: true },
      { url: 'wss://nos.lol/', read: true, write: false },
    ];

    expect(applyLocalRelayEdit(localBefore, localAfter, remoteBase)).toEqual([
      { url: 'wss://relay.divine.video/', read: false, write: true },
      { url: 'wss://nos.lol/', read: true, write: false },
    ]);
  });

  it('adds and removes only the locally edited relay', () => {
    const localBefore = [{ url: 'wss://old.example/', read: true, write: true }];
    const localAfter = [{ url: 'wss://new.example/', read: true, write: true }];
    const remoteBase = [
      { url: 'wss://old.example/', read: true, write: true },
      { url: 'wss://kept.example/', read: true, write: true },
    ];

    expect(applyLocalRelayEdit(localBefore, localAfter, remoteBase)).toEqual([
      { url: 'wss://kept.example/', read: true, write: true },
      { url: 'wss://new.example/', read: true, write: true },
    ]);
  });

  it('keeps the unedited local working set when the remote list is empty', () => {
    const localBefore = [
      { url: 'wss://relay.divine.video', read: true, write: true },
      { url: 'wss://relay.primal.net', read: true, write: true },
      { url: 'wss://relay.damus.io', read: true, write: true },
    ];
    const localAfter = localBefore.filter((relay) => relay.url !== 'wss://relay.damus.io');

    expect(applyLocalRelayEdit(localBefore, localAfter, [])).toEqual([
      { url: 'wss://relay.divine.video', read: true, write: true },
      { url: 'wss://relay.primal.net', read: true, write: true },
    ]);
  });

  it('treats a trailing-slash remote URL as the same relay as a slashless local URL', () => {
    const localBefore = [{ url: 'wss://relay.damus.io', read: true, write: true }];
    const localAfter = [{ url: 'wss://relay.damus.io', read: true, write: false }];
    const remoteBase = [{ url: 'wss://relay.damus.io/', read: true, write: true }];

    expect(applyLocalRelayEdit(localBefore, localAfter, remoteBase)).toEqual([
      { url: 'wss://relay.damus.io', read: true, write: false },
    ]);
  });
});
