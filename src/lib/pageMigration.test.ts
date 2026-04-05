import { describe, expect, it } from 'vitest';
import { getDraftPageIdentifier, getPublishedPageIdentifier } from './pageIdentifiers';

describe('page identifiers', () => {
  it('uses profile for the published page', () => {
    expect(getPublishedPageIdentifier()).toBe('profile');
  });

  it('uses profile-draft for the owner draft', () => {
    expect(getDraftPageIdentifier()).toBe('profile-draft');
  });
});
