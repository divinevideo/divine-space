import { useSeoMeta, useHead } from '@unhead/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';
import { Layout } from '@/components/Layout';
import { VideoCard, VideoCardSkeleton } from '@/components/VideoCard';
import { useDivineVideos } from '@/hooks/useDivineVideos';
import { useDivineTrendingHashtags } from '@/hooks/useDivineSearch';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import type { VideoSort } from '@/lib/divine-api';

const SORTS: { id: VideoSort; label: string }[] = [
  { id: 'trending', label: 'trending' },
  { id: 'recent', label: 'recent' },
  { id: 'popular', label: 'popular' },
];

function FeaturedPageCard({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const name = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <Link
      to={`/${npub}`}
      className="block border border-border bg-card hover:border-primary"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {metadata?.picture ? (
          <img src={metadata.picture} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
            {name[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-2 text-sm truncate">{name}</div>
    </Link>
  );
}

export default function Index() {
  const [sort, setSort] = useState<VideoSort>('trending');
  const { nostr } = useNostr();
  const navigate = useNavigate();

  useSeoMeta({
    title: 'divine.space — a place for videos',
    description: 'Make your own corner of the internet. Custom profile pages, videos, and friends on Nostr.',
  });

  useHead({
    meta: [
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://divine.space/' },
      { property: 'og:title', content: 'divine.space — a place for videos' },
      { property: 'og:description', content: 'Make your own corner of the internet. Custom profile pages, videos, and friends on Nostr.' },
      { property: 'og:image', content: 'https://divine.space/og-image.svg' },
      { property: 'og:site_name', content: 'divine.space' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  });

  const { data: videos, isLoading: videosLoading } = useDivineVideos({ sort, limit: 9 });
  const { data: trendingHashtags } = useDivineTrendingHashtags();

  // Featured pages: authors of the most recent published site configs (kind 30512)
  const { data: featuredPubkeys } = useQuery({
    queryKey: ['featured-pages'],
    queryFn: async () => {
      const events = await nostr.query([{ kinds: [30512], limit: 20 }]);
      const seen = new Set<string>();
      for (const e of events.sort((a, b) => b.created_at - a.created_at)) {
        seen.add(e.pubkey);
        if (seen.size >= 6) break;
      }
      return [...seen];
    },
    staleTime: 60_000,
  });

  const handleRandomPage = () => {
    if (featuredPubkeys && featuredPubkeys.length > 0) {
      const random = featuredPubkeys[Math.floor(Math.random() * featuredPubkeys.length)];
      navigate(`/${nip19.npubEncode(random)}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Intro line */}
        <p className="text-sm text-muted-foreground">
          make your own corner of the internet —{' '}
          <Link to="/settings/profile" className="text-primary underline underline-offset-4">
            claim your page
          </Link>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured pages */}
            <section>
              <h2 className="text-lg font-bold mb-3">featured pages</h2>
              {featuredPubkeys && featuredPubkeys.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {featuredPubkeys.map((pk) => (
                    <FeaturedPageCard key={pk} pubkey={pk} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                  no pages yet — be the first to make one.
                </div>
              )}
            </section>

            {/* Fresh videos */}
            <section>
              <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
                <h2 className="text-lg font-bold">fresh videos</h2>
                <div className="flex gap-3 text-sm">
                  {SORTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSort(s.id)}
                      className={
                        sort === s.id
                          ? 'font-bold underline underline-offset-4'
                          : 'text-muted-foreground hover:underline underline-offset-4'
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {videosLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))}
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                  no videos found.
                </div>
              )}

              <div className="pt-4">
                <Link to="/browse" className="text-sm text-primary underline underline-offset-4">
                  browse all videos →
                </Link>
              </div>
            </section>
          </div>

          {/* Rail */}
          <aside className="space-y-6">
            <section>
              <h3 className="text-sm font-bold mb-2">explore</h3>
              <button
                onClick={handleRandomPage}
                className="text-sm text-primary underline underline-offset-4"
              >
                🎲 random page
              </button>
            </section>

            <section>
              <h3 className="text-sm font-bold mb-2">trending tags</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {trendingHashtags?.slice(0, 10).map((tag) => (
                  <Link
                    key={tag.hashtag}
                    to={`/search?tag=${tag.hashtag}`}
                    className="text-primary hover:underline underline-offset-4"
                  >
                    #{tag.hashtag}
                  </Link>
                ))}
              </div>
            </section>

            <section className="border border-border p-3 text-sm text-muted-foreground">
              divine.space is a myspace-inspired video platform on nostr. your page, your rules.
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
