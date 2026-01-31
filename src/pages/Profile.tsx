import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useDivineUser, useDivineUserVideosInfinite } from '@/hooks/useDivineUser';
import { useIsFollowing, useToggleFollow } from '@/hooks/useDivineSocial';
import { useKeycast } from '@/contexts/KeycastContext';
import { VideoCard, VideoCardSkeleton } from '@/components/VideoCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  UserMinus, 
  Video, 
  Heart, 
  MessageCircle, 
  Repeat2,
  ExternalLink,
  Users,
  Sparkles,
  Loader2,
  Edit,
  Zap,
  Globe
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import NotFound from './NotFound';

interface ProfileProps {
  pubkey: string;
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function Profile({ pubkey }: ProfileProps) {
  const { pubkey: currentUserPubkey, isAuthenticated } = useKeycast();
  const { toast } = useToast();
  const isOwnProfile = currentUserPubkey === pubkey;

  const { data: divineUser, isLoading: userLoading, error: userError } = useDivineUser(pubkey);
  const { data: isFollowing, isLoading: followingLoading } = useIsFollowing(pubkey);
  const { mutate: toggleFollow, isPending: followPending } = useToggleFollow();

  const { 
    data: videosData, 
    isLoading: videosLoading, 
    hasNextPage, 
    fetchNextPage,
    isFetchingNextPage 
  } = useDivineUserVideosInfinite(pubkey);

  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useSeoMeta({
    title: divineUser?.profile?.display_name || divineUser?.profile?.name || 'Profile',
    description: divineUser?.profile?.about || 'View this profile on DiVine Space',
  });

  if (userLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full rounded-xl mb-4" />
          <div className="flex gap-6">
            <Skeleton className="h-32 w-32 rounded-full -mt-16" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (userError || !divineUser) {
    return <NotFound />;
  }

  // API can return null for various fields when user data isn't available
  const profile = divineUser.profile ?? {};
  const social = divineUser.social ?? { follower_count: 0, following_count: 0 };
  const stats = divineUser.stats ?? { video_count: 0, total_reactions: 0, total_comments: 0, total_reposts: 0 };
  const engagement = divineUser.engagement ?? { avg_reactions_per_video: 0, avg_comments_per_video: 0, engagement_rate: 0 };
  const videos = videosData?.pages.flat() ?? [];

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please log in to follow users', variant: 'destructive' });
      return;
    }
    toggleFollow({
      targetPubkey: pubkey,
      isCurrentlyFollowing: !!isFollowing,
    });
  };

  return (
    <Layout>
      {/* Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        {profile.banner ? (
          <img 
            src={profile.banner} 
            alt="Profile banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full animated-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-16 md:-mt-20 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative mx-auto md:mx-0">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
                <AvatarImage src={profile.picture} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {(profile.name || 'A')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left pt-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {profile.display_name || profile.name || 'Anonymous'}
                  </h1>
                  {profile.name && profile.display_name && (
                    <p className="text-muted-foreground">@{profile.name}</p>
                  )}
                  {profile.nip05 && (
                    <Badge variant="secondary" className="mt-2 gap-1">
                      <Sparkles className="h-3 w-3" />
                      {profile.nip05}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-center md:justify-start">
                  {isOwnProfile ? (
                    <Link to="/settings/profile">
                      <Button variant="outline" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button
                        onClick={handleFollow}
                        disabled={followPending || followingLoading}
                        variant={isFollowing ? "outline" : "default"}
                        className="gap-2"
                      >
                        {followPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                      {profile.lud16 && (
                        <Button variant="outline" size="icon" title="Send a tip">
                          <Zap className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.about && (
                <p className="mt-4 text-muted-foreground max-w-2xl whitespace-pre-wrap">
                  {profile.about}
                </p>
              )}

              {/* Links */}
              {profile.website && (
                <a 
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {profile.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="myspace-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{formatNumber(stats.video_count)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Video className="h-4 w-4" />
                Videos
              </div>
            </CardContent>
          </Card>
          
          <Card className="myspace-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-pink-500">{formatNumber(social.follower_count)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Users className="h-4 w-4" />
                Followers
              </div>
            </CardContent>
          </Card>
          
          <Card className="myspace-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-cyan-500">{formatNumber(social.following_count)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Users className="h-4 w-4" />
                Following
              </div>
            </CardContent>
          </Card>
          
          <Card className="myspace-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-500">{formatNumber(stats.total_reactions)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Heart className="h-4 w-4" />
                Total Likes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Stats */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-center">
              <div>
                <div className="text-lg font-semibold">{(engagement.avg_reactions_per_video ?? 0).toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg. Likes/Video</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{(engagement.avg_comments_per_video ?? 0).toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Avg. Comments/Video</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{((engagement.engagement_rate ?? 0) * 100).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Engagement Rate</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{formatNumber(stats.total_comments)}</div>
                <div className="text-xs text-muted-foreground">Total Comments</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{formatNumber(stats.total_reposts)}</div>
                <div className="text-xs text-muted-foreground">Total Reposts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos */}
        <Tabs defaultValue="videos">
          <TabsList className="bg-muted/50 mb-6">
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              Videos ({stats.video_count})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {videosLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <VideoCardSkeleton key={i} />
                ))}
              </div>
            ) : videos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} showAuthor={false} />
                  ))}
                </div>

                {/* Load more */}
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
                      That's all the videos!
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No videos yet
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
