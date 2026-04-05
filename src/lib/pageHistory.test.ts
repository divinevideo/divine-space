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
  it('builds revision tags without leaking page metadata', () => {
    const tags = buildPageRevisionTags('rev-1');

    expect(tags).toEqual([
      ['d', 'rev-1'],
      ['k', '30512'],
      ['alt', 'DiVine Space page revision'],
    ]);
  });

  it('snapshots the page for private revision storage', () => {
    const snapshot = createPageRevisionSnapshot(page, 'save-draft', 123);

    expect(snapshot.source).toBe('save-draft');
    expect(snapshot.pageIdentifier).toBe('profile-draft');
    expect(snapshot.createdAt).toBe(123);
    expect(snapshot.page.title).toBe('Creator Home');
    expect(snapshot.page.widgets[0].type).toBe('profile');
  });

  it('parses a decrypted revision snapshot back into a restorable page', () => {
    const snapshot = createPageRevisionSnapshot(page, 'publish', 456);
    const revision = parsePageRevisionContent(
      {
        id: 'revision-event',
        created_at: 456,
        tags: buildPageRevisionTags('rev-1'),
      },
      JSON.stringify(snapshot)
    );

    expect(revision).not.toBeNull();
    expect(revision?.id).toBe('revision-event');
    expect(revision?.source).toBe('publish');
    expect(revision?.pageIdentifier).toBe('profile-draft');
    expect(revision?.page.title).toBe('Creator Home');
  });

  it('rejects malformed decrypted revision payloads', () => {
    expect(
      parsePageRevisionContent(
        {
          id: 'revision-event',
          created_at: 456,
          tags: buildPageRevisionTags('rev-1'),
        },
        'not json'
      )
    ).toBeNull();
  });
});
