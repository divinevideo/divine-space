import { describe, it, expect } from 'vitest';
import { getLayoutTemplate, myspaceLayout } from './defaultLayout';

describe('myspace 1.0 preset', () => {
  it('is registered as a layout template', () => {
    const template = getLayoutTemplate('myspace');
    expect(template).toBeDefined();
    expect(template?.name).toBe('MySpace 1.0');
    expect(template?.widgets).toBe(myspaceLayout);
  });

  it('contains the full classic anatomy without overlaps', () => {
    const types = myspaceLayout.map((w) => w.type);
    for (const required of [
      'extended-network', 'contact-actions', 'profile-details',
      'blurbs', 'music', 'top8', 'videos', 'notes',
    ]) {
      expect(types).toContain(required);
    }
    // No two widgets overlap
    for (let i = 0; i < myspaceLayout.length; i++) {
      for (let j = i + 1; j < myspaceLayout.length; j++) {
        const a = myspaceLayout[i];
        const b = myspaceLayout[j];
        const overlap =
          a.x < b.x + b.w && b.x < a.x + a.w &&
          a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.type} overlaps ${b.type}`).toBe(false);
      }
    }
  });
});
