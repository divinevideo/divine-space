import { describe, expect, it } from 'vitest';
import type { PageDocument } from '@/types/page';
import {
  buildPageRevisionTags,
  createPageRevisionSnapshot,
  parsePageRevisionContent,
} from './pageHistory';

const page: PageDocument = {
  identifier: 'profile-draft',
  shell: { type: 'sidebar-bento' },
  includes: [],
  widgets: [
    {
      id: 'profile-1',
      type: 'profile',
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    },
  ],
  title: 'Creator Home',
  summary: 'Comedy and videos',
};

describe('pageHistory helpers', () => {
  it('builds revision tags for a private 30512 snapshot', () => {
    const tags = buildPageRevisionTags('profile-draft', 'save-draft', 'rev-1');

    expect(tags).toContainEqual(['k', '30512']);
    expect(tags).toContainEqual(['d', 'rev-1']);
    expect(tags).toContainEqual(['identifier', 'profile-draft']);
    expect(tags).toContainEqual(['source', 'save-draft']);
  });

  it('serializes a page snapshot into an unsigned 30512 event payload', () => {
    const snapshot = createPageRevisionSnapshot(page, 'owner-pubkey', 'save-draft');

    expect(snapshot.source).toBe('save-draft');
    expect(snapshot.pageIdentifier).toBe('profile-draft');
    expect(snapshot.unsignedEvent.kind).toBe(30512);
    expect(snapshot.unsignedEvent.tags).toContainEqual(['d', 'profile-draft']);
  });

  it('parses decrypted revision content back into a restorable page', () => {
    const snapshot = createPageRevisionSnapshot(page, 'owner-pubkey', 'publish');
    const revision = parsePageRevisionContent(
      {
        id: 'revision-event',
        created_at: 123,
        tags: buildPageRevisionTags('profile-draft', 'publish', 'rev-1'),
      },
      JSON.stringify(snapshot.unsignedEvent)
    );

    expect(revision?.id).toBe('revision-event');
    expect(revision?.source).toBe('publish');
    expect(revision?.page.title).toBe('Creator Home');
    expect(revision?.page.identifier).toBe('profile-draft');
  });
});
