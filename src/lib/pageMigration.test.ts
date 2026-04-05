import { describe, expect, it } from 'vitest';
import { getDraftPageIdentifier, getPublishedPageIdentifier } from './pageIdentifiers';
import { createSidebarBentoWidgets } from './sidebarBentoLayout';
import { createStarterDraft } from './pageMigration';

describe('page identifiers', () => {
  it('uses profile for the published page', () => {
    expect(getPublishedPageIdentifier()).toBe('profile');
  });

  it('uses profile-draft for the owner draft', () => {
    expect(getDraftPageIdentifier()).toBe('profile-draft');
  });
});

describe('sidebar-bento draft migration', () => {
  it('creates the canonical sidebar-bento starter widgets', () => {
    const widgets = createSidebarBentoWidgets();

    expect(widgets).toHaveLength(4);
    expect(widgets.map((widget) => widget.type)).toEqual([
      'profile',
      'links',
      'music',
      'top8',
    ]);
  });

  it('builds a starter draft from profile, MySpace, and site-config inputs', () => {
    const draft = createStarterDraft({
      pubkey: 'alicepubkey',
      profile: {
        name: 'alice',
        about: 'hello',
        website: 'https://example.com',
      },
      myspace: {
        music: {
          url: 'https://track.test',
          title: 'Song',
          artist: 'Artist',
        },
        topFriends: [{ pubkey: 'friend-pubkey', position: 1 }],
      },
      site: {
        title: 'Alice Space',
        summary: 'Published summary',
        includes: [{ type: 'kind', value: '34236' }],
        widgets: [
          { id: 'profile', type: 'profile', x: 0, y: 0, w: 4, h: 2 },
        ],
        layout: 'bento',
        gridCols: 6,
        customization: { customCss: '.page { color: red; }' },
      },
    });

    expect(draft).toMatchObject({
      identifier: 'profile-draft',
      shell: { type: 'sidebar-bento' },
      contentMode: 'creator-site',
      name: 'alice',
      summary: 'Published summary',
      url: 'https://divine.space/alicepubkey/',
      gridCols: 6,
    });
    expect(draft.widgets).toHaveLength(1);
    expect(draft.widgets[0].type).toBe('profile');
    expect(draft.includes).toEqual([{ type: 'kind', value: '34236' }]);
    expect(draft.customization).toEqual({ customCss: '.page { color: red; }' });
  });
});
