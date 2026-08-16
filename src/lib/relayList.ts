export interface RelayListRelay {
  url: string;
  read: boolean;
  write: boolean;
}

export function parseRelayListTags(tags: string[][]): RelayListRelay[] {
  return tags
    .filter(([name, url]) => name === 'r' && !!url)
    .map(([, url, marker]) => ({
      url,
      read: !marker || marker === 'read',
      write: !marker || marker === 'write',
    }));
}

export function relayListTags(relays: RelayListRelay[]): string[][] {
  return relays
    .map((relay) => {
      if (relay.read && relay.write) return ['r', relay.url];
      if (relay.read) return ['r', relay.url, 'read'];
      if (relay.write) return ['r', relay.url, 'write'];
      return null;
    })
    .filter((tag): tag is string[] => tag !== null);
}

export function applyLocalRelayEdit(
  localBefore: RelayListRelay[],
  localAfter: RelayListRelay[],
  remoteBase: RelayListRelay[],
): RelayListRelay[] {
  const before = new Map(localBefore.map((relay) => [relay.url, relay]));
  const after = new Map(localAfter.map((relay) => [relay.url, relay]));
  const merged = new Map(remoteBase.map((relay) => [relay.url, relay]));

  for (const url of before.keys()) {
    if (!after.has(url)) {
      merged.delete(url);
    }
  }

  for (const [url, nextRelay] of after.entries()) {
    const previousRelay = before.get(url);
    if (!previousRelay) {
      merged.set(url, nextRelay);
      continue;
    }

    if (previousRelay.read !== nextRelay.read || previousRelay.write !== nextRelay.write) {
      merged.set(url, nextRelay);
    }
  }

  return [...merged.values()];
}
