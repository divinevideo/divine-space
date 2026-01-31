import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { VideoCard, VideoCardSkeleton } from '@/components/VideoCard';
import { useDivineVideosInfinite } from '@/hooks/useDivineVideos';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Flame, Clock, Loader2, Video, Play } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import type { VideoSort } from '@/lib/divine-api';

export default function Browse() {
  const [sort, setSort] = useState<VideoSort>('trending');
  const [kind, setKind] = useState<number | undefined>(undefined);

  useSeoMeta({
    title: 'Browse Videos - DiVine Space',
    description: 'Explore trending, popular, and recent videos on DiVine Space.',
  });

  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useDivineVideosInfinite({ sort, kind });

  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const videos = data?.pages.flat() ?? [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Browse Videos</h1>
          <p className="text-muted-foreground">
            Explore the latest and greatest content from the community.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Sort Tabs */}
          <Tabs value={sort} onValueChange={(v) => setSort(v as VideoSort)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="popular" className="gap-2">
                <Flame className="h-4 w-4" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="loops" className="gap-2">
                <Play className="h-4 w-4" />
                Most Loops
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Kind Filter */}
          <div className="flex gap-2">
            <Button
              variant={kind === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setKind(undefined)}
            >
              All
            </Button>
            <Button
              variant={kind === 34236 ? "default" : "outline"}
              size="sm"
              onClick={() => setKind(34236)}
              className="gap-1"
            >
              <Video className="h-3 w-3" />
              Shorts
            </Button>
            <Button
              variant={kind === 34235 ? "default" : "outline"}
              size="sm"
              onClick={() => setKind(34235)}
              className="gap-1"
            >
              <Video className="h-3 w-3" />
              Videos
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : videos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Load more trigger */}
            <div ref={ref} className="flex justify-center py-8">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading more...
                </div>
              ) : hasNextPage ? (
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  Load More
                </Button>
              ) : videos.length > 0 ? (
                <p className="text-muted-foreground text-sm">
                  You've reached the end!
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No videos found. Try a different filter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
