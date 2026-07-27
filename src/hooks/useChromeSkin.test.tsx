import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChromeSkin } from './useChromeSkin';
import { CHROME_SKIN_STORAGE_KEY } from '@/lib/chromeSkins';

describe('useChromeSkin', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.chromeSkin;
  });

  it('defaults to plain and applies the data attribute', () => {
    const { result } = renderHook(() => useChromeSkin());
    expect(result.current.skin).toBe('plain');
    expect(document.documentElement.dataset.chromeSkin).toBe('plain');
  });

  it('switches skins, persists, and updates the attribute', () => {
    const { result } = renderHook(() => useChromeSkin());
    act(() => result.current.setSkin('terminal'));
    expect(result.current.skin).toBe('terminal');
    expect(localStorage.getItem(CHROME_SKIN_STORAGE_KEY)).toBe('"terminal"');
    expect(document.documentElement.dataset.chromeSkin).toBe('terminal');
  });

  it('ignores invalid skin ids', () => {
    const { result } = renderHook(() => useChromeSkin());
    act(() => result.current.setSkin('bogus-skin'));
    expect(result.current.skin).toBe('plain');
  });

  it('restores a stored skin', () => {
    localStorage.setItem(CHROME_SKIN_STORAGE_KEY, '"scene-kid"');
    const { result } = renderHook(() => useChromeSkin());
    expect(result.current.skin).toBe('scene-kid');
  });
});
