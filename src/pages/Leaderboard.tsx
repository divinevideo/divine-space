import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useDivineVideoLeaderboard, useDivineCreatorLeaderboard } from '@/hooks/useDivineSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Crown, Video, User, Eye, Play, Clock } from 'lucide-react';
import { useState } from 'react';
import { nip19 } from 'nostr-tools';
import type { LeaderboardPeriod } from '@/lib/divine-api';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const periodLabels: Record<LeaderboardPeriod, string> = {
  day: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  alltime: 'All Time',
};

export default function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [activeTab, setActiveTab] = useState<'videos' | 'creators'>('creators');

  useSeoMeta({
    title: 'Leaderboards - DiVine Space',
    description: 'See the top videos and creators on DiVine Space.',
  });

  const { data: videoLeaderboard, isLoading: videosLoading } = useDivineVideoLeaderboard({ 
    period, 
    limit: 20 
  });
  
  const { data: creatorLeaderboard, isLoading: creatorsLoading } = useDivineCreatorLeaderboard({ 
    period, 
    limit: 20 
  });

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-yellow-950 border-yellow-400';
      case 2:
        return 'bg-gray-400 text-gray-950 border-gray-300';
      case 3:
        return 'bg-amber-600 text-amber-950 border-amber-500';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="h-10 w-10 text-yellow-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            Leaderboards
          </h1>
          <p className="text-muted-foreground">
            The top performers on DiVine Space
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
            {Object.entries(periodLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key as LeaderboardPeriod)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'videos' | 'creators')}>
          <div className="flex justify-center mb-8">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="creators" className="gap-2 px-6">
                <Crown className="h-4 w-4" />
                Top Creators
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2 px-6">
                <Video className="h-4 w-4" />
                Top Videos
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Creators Tab */}
          <TabsContent value="creators">
            <div className="max-w-3xl mx-auto space-y-3">
              {creatorsLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </CardContent>
                  </Card>
                ))
              ) : creatorLeaderboard?.entries.map((creator, index) => {
                const npub = nip19.npubEncode(creator.pubkey);
                const rank = index + 1;
                return (
                  <Link key={creator.pubkey} to={`/${npub}`}>
                    <Card className="hover:border-primary/30 transition-all hover-lift group">
                      <CardContent className="p-4 flex items-center gap-4">
                        {/* Rank Badge */}
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 ${getRankStyle(rank)}`}
                        >
                          {rank <= 3 ? (
                            <Crown className="h-5 w-5" />
                          ) : (
                            rank
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-14 w-14 border-2 border-border group-hover:border-primary transition-colors">
                          <AvatarImage src={creator.picture} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {(creator.name || 'A')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {creator.display_name || creator.name || 'Anonymous'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Video className="h-3.5 w-3.5" />
                              {creator.videos_with_views} videos
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                            <Eye className="h-4 w-4" />
                            {formatNumber(creator.views)}
                          </div>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="max-w-3xl mx-auto space-y-3">
              {videosLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-20 w-32 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </CardContent>
                  </Card>
                ))
              ) : videoLeaderboard?.entries.map((video, index) => {
                const npub = nip19.npubEncode(video.pubkey);
                const rank = index + 1;
                return (
                  <Link key={video.id} to={`/video/${video.id}`}>
                    <Card className="hover:border-primary/30 transition-all hover-lift group">
                      <CardContent className="p-4 flex items-center gap-4">
                        {/* Rank Badge */}
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 shrink-0 ${getRankStyle(rank)}`}
                        >
                          {rank <= 3 ? (
                            <Crown className="h-5 w-5" />
                          ) : (
                            rank
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0">
                          <img 
                            src={video.thumbnail || '/placeholder-video.jpg'} 
                            alt={video.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate group-hover:text-primary transition-colors">
                            {video.title || 'Untitled'}
                          </p>
                          <Link 
                            to={`/${npub}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {video.author_name || 'Anonymous'}
                          </Link>
                        </div>

                        {/* Stats */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                            <Eye className="h-4 w-4" />
                            {formatNumber(video.views)}
                          </div>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
