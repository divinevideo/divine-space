export interface RelayListRelay {
  url: string;
  read: boolean;
  write: boolean;
}

/** Stable key so `wss://relay.example` and `wss://relay.example/` are the same relay. */
export function relayUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      return `${parsed.protocol}//${parsed.host}`;
    }
    return parsed.toString();
  } catch {
    return url;
  }
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

function keyedRelays(relays: RelayListRelay[]): Map<string, RelayListRelay> {
  return new Map(relays.map((relay) => [relayUrlKey(relay.url), relay]));
}

export function applyLocalRelayEdit(
  localBefore: RelayListRelay[],
  localAfter: RelayListRelay[],
  remoteBase: RelayListRelay[],
): RelayListRelay[] {
  const before = keyedRelays(localBefore);
  const after = keyedRelays(localAfter);
  // An unanswered remote is genuine absence, not "the user has no relays".
  // Seed from the local working set so the first NIP-65 publish keeps the
  // defaults the user did not just edit.
  const merged = keyedRelays(remoteBase.length > 0 ? remoteBase : localBefore);

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
