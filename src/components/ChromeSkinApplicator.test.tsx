import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ChromeSkinApplicator } from './ChromeSkinApplicator';
import { CHROME_SKIN_STORAGE_KEY } from '@/lib/chromeSkins';

describe('ChromeSkinApplicator', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.chromeSkin;
  });

  it('applies the stored skin to the document root', () => {
    localStorage.setItem(CHROME_SKIN_STORAGE_KEY, '"terminal"');
    render(<ChromeSkinApplicator />);
    expect(document.documentElement.dataset.chromeSkin).toBe('terminal');
  });

  it('applies the plain default when nothing is stored', () => {
    render(<ChromeSkinApplicator />);
    expect(document.documentElement.dataset.chromeSkin).toBe('plain');
  });
});
