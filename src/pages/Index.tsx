import { useSeoMeta, useHead } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { VideoCard, VideoCardSkeleton } from '@/components/VideoCard';
import { useDivineVideos } from '@/hooks/useDivineVideos';
import { useDivineTrendingHashtags, useDivinePlatformStats, useDivineCreatorLeaderboard } from '@/hooks/useDivineSearch';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Flame, Clock, Video, Users, Hash, Crown, Sparkles } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import type { VideoSort } from '@/lib/divine-api';
import { useState } from 'react';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function Index() {
  const [sort, setSort] = useState<VideoSort>('trending');
  
  useSeoMeta({
    title: 'DiVine Space - Your MySpace for Videos',
    description: 'A nostalgic video social network powered by Nostr. Browse trending videos, connect with creators, and share your favorites.',
  });

  // Open Graph and Twitter Card meta tags for homepage
  useHead({
    meta: [
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://divine.space/' },
      { property: 'og:title', content: 'DiVine Space - Your MySpace for Videos' },
      { property: 'og:description', content: 'A nostalgic video social network powered by Nostr. Browse trending videos, connect with creators, and share your favorites.' },
      { property: 'og:image', content: 'https://divine.space/og-image.svg' },
      { property: 'og:site_name', content: 'DiVine Space' },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'DiVine Space - Your MySpace for Videos' },
      { name: 'twitter:description', content: 'A nostalgic video social network powered by Nostr. Browse trending videos, connect with creators, and share your favorites.' },
      { name: 'twitter:image', content: 'https://divine.space/og-image.svg' },
    ],
  });

  const { data: videos, isLoading: videosLoading } = useDivineVideos({ 
    sort, 
    limit: 12 
  });
  
  const { data: trendingHashtags, isLoading: hashtagsLoading } = useDivineTrendingHashtags();
  const { data: stats } = useDivinePlatformStats();
  const { data: topCreators, isLoading: creatorsLoading } = useDivineCreatorLeaderboard({ 
    period: 'week', 
    limit: 8 
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 animated-gradient opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Welcome to the revival</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">DiVine Space</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We heard you missed Vine and MySpace, so we decided to make a mashup of the two. Welcome to divine.space
            </p>

            {stats && (
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">{formatNumber(stats.total_videos - stats.vine_videos)}</span>
                  <span className="text-muted-foreground">New Videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-pink-500" />
                  <span className="text-lg font-semibold">{formatNumber(stats.vine_videos)}</span>
                  <span className="text-muted-foreground">Classic Vines</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sort Tabs */}
            <Tabs defaultValue="trending" value={sort} onValueChange={(v) => setSort(v as VideoSort)}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-2xl font-bold">Videos</h2>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="trending" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Trending</span>
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Recent</span>
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="gap-2">
                    <Flame className="h-4 w-4" />
                    <span className="hidden sm:inline">Popular</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={sort} className="mt-6">
                {videosLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <VideoCardSkeleton key={i} />
                    ))}
                  </div>
                ) : videos && videos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No videos found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-center pt-4">
              <Link to="/browse">
                <Button variant="outline" className="gap-2">
                  <Video className="h-4 w-4" />
                  Browse All Videos
                </Button>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Top Creators */}
            <Card className="myspace-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Top Creators This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {creatorsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))
                ) : topCreators?.entries.slice(0, 5).map((creator, i) => {
                  const npub = nip19.npubEncode(creator.pubkey);
                  return (
                    <Link 
                      key={creator.pubkey} 
                      to={`/${npub}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="relative">
                        <span className="absolute -left-1 -top-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <Avatar className="h-10 w-10 border-2 border-border group-hover:border-primary transition-colors">
                          <AvatarImage src={creator.picture} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {(creator.name || 'A')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {creator.display_name || creator.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(creator.views)} views
                        </p>
                      </div>
                    </Link>
                  );
                })}
                <Link to="/leaderboard" className="block">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View All
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Trending Hashtags */}
            <Card className="myspace-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hash className="h-5 w-5 text-cyan-500" />
                  Trending Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hashtagsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-16 rounded-full" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trendingHashtags?.slice(0, 10).map((tag) => (
                      <Link key={tag.hashtag} to={`/search?tag=${tag.hashtag}`}>
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          #{tag.hashtag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">About DiVine Space</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  DiVine Space is a MySpace-inspired video platform built on Nostr. 
                  Discover videos, connect with creators, and express yourself in a decentralized social network.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Nostr-Powered
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Decentralized
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Open Source
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
