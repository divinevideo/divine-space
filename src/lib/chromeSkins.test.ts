import { describe, it, expect } from 'vitest';
import { CHROME_SKINS, DEFAULT_CHROME_SKIN, isChromeSkin, getChromeSkin } from './chromeSkins';

describe('chromeSkins', () => {
  it('has plain as the default skin', () => {
    expect(DEFAULT_CHROME_SKIN).toBe('plain');
  });

  it('includes the four launch skins', () => {
    const ids = CHROME_SKINS.map((s) => s.id);
    expect(ids).toEqual(['plain', 'classic-blue', 'terminal', 'scene-kid']);
  });

  it('isChromeSkin validates skin ids', () => {
    expect(isChromeSkin('plain')).toBe(true);
    expect(isChromeSkin('scene-kid')).toBe(true);
    expect(isChromeSkin('purple-rain')).toBe(false);
    expect(isChromeSkin('')).toBe(false);
  });

  it('getChromeSkin returns a definition and falls back to default', () => {
    expect(getChromeSkin('terminal').name).toBe('Terminal');
    expect(getChromeSkin('bogus').id).toBe(DEFAULT_CHROME_SKIN);
  });
});
