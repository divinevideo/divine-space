import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchVideo } from './divine-api';

describe('fetchVideo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes nested event detail responses into the flat video shape used by the app', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        event: {
          id: 'video-123',
          pubkey: '7bae5c2eea581e66ffa062d6e59d8b60690353392ed3cce03753d4773d999b4e',
          created_at: 1775354101,
          kind: 34236,
          tags: [
            ['d', 'asset-123'],
            ['title', 'Nested response title'],
            ['summary', 'Nested response summary'],
            [
              'imeta',
              'url https://media.divine.video/video-123.mp4',
              'image https://media.divine.video/video-123.jpg',
            ],
          ],
          content: 'Nested response content',
          sig: 'signature-123',
        },
        stats: {
          reactions: 3,
          comments: 2,
          reposts: 1,
          engagement_score: 9,
          author_name: 'Nested Author',
          author_avatar: 'https://media.divine.video/avatar.jpg',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const video = await fetchVideo('video-123');

    expect(video).toMatchObject({
      id: 'video-123',
      pubkey: '7bae5c2eea581e66ffa062d6e59d8b60690353392ed3cce03753d4773d999b4e',
      kind: 34236,
      title: 'Nested response title',
      content: 'Nested response content',
      thumbnail: 'https://media.divine.video/video-123.jpg',
      video_url: 'https://media.divine.video/video-123.mp4',
      reactions: 3,
      comments: 2,
      reposts: 1,
      engagement_score: 9,
      author_name: 'Nested Author',
      author_avatar: 'https://media.divine.video/avatar.jpg',
      sig: 'signature-123',
    });
    expect(video.tags).toHaveLength(4);
    expect(video.d_tag).toBe('asset-123');
    expect(video.created_at).toBe(1775354101);
  });
});
