import { describe, expect, it, vi } from 'vitest';
import { getSubdomainFromHostname } from './useSubdomain';

describe('getSubdomainFromHostname', () => {
  it('extracts hosted page subdomains from divine.video', () => {
    vi.stubGlobal('window', {
      location: { hostname: 'alice.divine.video' },
    });

    expect(getSubdomainFromHostname()).toBe('alice');
  });
});
