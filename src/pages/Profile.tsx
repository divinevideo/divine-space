import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useDivineUser, useDivineUserVideosInfinite } from '@/hooks/useDivineUser';
import { useIsFollowing, useToggleFollow } from '@/hooks/useDivineSocial';
import { useKeycast } from '@/contexts/KeycastContext';
import { useMySpaceProfile } from '@/hooks/useMySpaceProfile';
import { VideoCard, VideoCardSkeleton } from '@/components/VideoCard';
import { Top8Friends } from '@/components/Top8Friends';
import { ProfileMusicPlayer } from '@/components/ProfileMusicPlayer';
import { MoodWidget, StatusWidget, QuoteWidget, ProfileBlings } from '@/components/ProfileWidgets';
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
  Globe,
  Music,
  Palette
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
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
  const { data: myspaceProfile } = useMySpaceProfile(pubkey);

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
  const stats = {
    video_count: divineUser.stats?.video_count ?? 0, 
    total_reactions: divineUser.stats?.total_reactions ?? 0,
    total_comments: divineUser.stats?.total_comments ?? 0,
    total_reposts: divineUser.stats?.total_reposts ?? 0
  };
  const engagement = { 
    avg_reactions_per_video: divineUser.engagement?.avg_reactions_per_video ?? 0, 
    avg_comments_per_video: divineUser.engagement?.avg_comments_per_video ?? 0, 
    engagement_rate: divineUser.engagement?.engagement_rate ?? 0
  };
  const videos = videosData?.pages.flat() ?? [];

  // Format NIP-05 for divine.video domain
  const formatNip05 = (nip05: string | undefined): string | null => {
    if (!nip05) return null;
    // If it's already in format like "user@divine.video" or "_@domain", extract username part
    const parts = nip05.split('@');
    if (parts.length === 2) {
      const [username, domain] = parts;
      // If the domain is divine.video, format as @username.divine.video
      if (domain === 'divine.video') {
        return username === '_' ? '@divine.video' : `@${username}.divine.video`;
      }
      // For other domains, show as-is
      return nip05;
    }
    return nip05;
  };

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

  // Get theme class based on MySpace profile settings
  const themeClass = myspaceProfile?.theme && myspaceProfile.theme !== 'default' 
    ? `theme-${myspaceProfile.theme}` 
    : '';

  return (
    <Layout>
      <div className={cn(themeClass)}>
        {/* Banner */}
        <div className="relative h-48 md:h-64 overflow-hidden">
          {/* Custom background from MySpace profile */}
          {myspaceProfile?.background ? (
            <img 
              src={myspaceProfile.background} 
              alt="Profile background" 
              className="w-full h-full object-cover"
            />
          ) : profile.banner ? (
            <img 
              src={profile.banner} 
              alt="Profile banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn(
              "w-full h-full animated-gradient",
              myspaceProfile?.theme === 'space' && "stars-bg"
            )} />
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
                      {formatNip05(profile.nip05)}
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

              {/* Mood & Status - MySpace style! */}
              <div className="mt-4 space-y-2">
                <MoodWidget mood={myspaceProfile?.mood} />
                <StatusWidget status={myspaceProfile?.status} />
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

        {/* Profile Music Player - The iconic MySpace feature! */}
        {myspaceProfile?.music && (
          <ProfileMusicPlayer 
            music={myspaceProfile.music} 
            autoplay={myspaceProfile.autoplay}
            className="mb-8"
          />
        )}

        {/* Profile Quote */}
        <QuoteWidget quote={myspaceProfile?.quote} className="mb-8" />

        {/* MySpace-style two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Top 8 Friends & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Top 8 Friends - THE classic MySpace feature! */}
            <Top8Friends 
              pubkey={pubkey} 
              isOwnProfile={isOwnProfile}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="myspace-card text-center">
                <CardContent className="py-4">
                  <div className="text-2xl font-bold text-primary">{formatNumber(stats.video_count)}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Video className="h-3 w-3" />
                    Videos
                  </div>
                </CardContent>
              </Card>
              
              <Card className="myspace-card text-center">
                <CardContent className="py-4">
                  <div className="text-2xl font-bold text-pink-500">{formatNumber(social.follower_count)}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    Followers
                  </div>
                </CardContent>
              </Card>
              
              <Card className="myspace-card text-center">
                <CardContent className="py-4">
                  <div className="text-2xl font-bold text-cyan-500">{formatNumber(social.following_count)}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    Following
                  </div>
                </CardContent>
              </Card>
              
              <Card className="myspace-card text-center">
                <CardContent className="py-4">
                  <div className="text-2xl font-bold text-yellow-500">{formatNumber(stats.total_reactions)}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Heart className="h-3 w-3" />
                    Likes
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Stats */}
            <Card className="myspace-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Likes/Video</span>
                  <span className="font-medium">{engagement.avg_reactions_per_video.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Comments</span>
                  <span className="font-medium">{engagement.avg_comments_per_video.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engagement Rate</span>
                  <span className="font-medium">{(engagement.engagement_rate * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Customize Profile button for own profile */}
            {isOwnProfile && (
              <Link to="/settings/myspace">
                <Button variant="outline" className="w-full gap-2">
                  <Palette className="h-4 w-4" />
                  Customize Profile
                </Button>
              </Link>
            )}

            {/* Profile Bling decoration */}
            <ProfileBlings />
          </div>

          {/* Right Column - Videos */}
          <div className="lg:col-span-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <VideoCardSkeleton key={i} />
                    ))}
                  </div>
                ) : videos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
        </div>
      </div>
      </div>
    </Layout>
  );
}
