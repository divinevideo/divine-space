import { describe, expect, it } from 'vitest';
import { getPageAddress } from './pageAddress';

describe('getPageAddress', () => {
  it('builds the 30512 address for a hosted page', () => {
    expect(getPageAddress('author-pubkey', 'profile')).toBe('30512:author-pubkey:profile');
  });
});
