import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useDivineUserFollowing, useDivineUserFollowers } from '@/hooks/useDivineUser';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Heart, Sparkles } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { LoginArea } from '@/components/auth/LoginArea';

export default function Friends() {
  const { user, metadata } = useCurrentUser();

  useSeoMeta({
    title: 'Friends - DiVine Space',
    description: 'Manage your friends and followers on DiVine Space.',
  });

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center myspace-card">
            <CardContent className="py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Connect with Friends</h2>
              <p className="text-muted-foreground mb-6">
                Log in to see your friends, followers, and who you're following.
              </p>
              <LoginArea className="justify-center" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return <FriendsContent pubkey={user.pubkey} />;
}

function FriendsContent({ pubkey }: { pubkey: string }) {
  const { data: following, isLoading: followingLoading } = useDivineUserFollowing(pubkey);
  const { data: followers, isLoading: followersLoading } = useDivineUserFollowers(pubkey);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            <Users className="inline h-8 w-8 mr-2" />
            My Friends
          </h1>
          <p className="text-muted-foreground">
            Manage your connections on DiVine Space
          </p>
        </div>

        <Tabs defaultValue="following">
          <TabsList className="bg-muted/50 mb-6">
            <TabsTrigger value="following" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Following
              {following && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-xs">
                  {following.pubkeys.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="followers" className="gap-2">
              <Heart className="h-4 w-4" />
              Followers
              {followers && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-xs">
                  {followers.pubkeys.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Following Tab */}
          <TabsContent value="following">
            {followingLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <FriendCardSkeleton key={i} />
                ))}
              </div>
            ) : following && following.pubkeys.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {following.pubkeys.map((pk) => (
                  <FriendCard key={pk} pubkey={pk} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    You're not following anyone yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Explore creators and start following!
                  </p>
                  <Link to="/leaderboard" className="inline-block mt-4">
                    <button className="text-primary hover:underline">
                      Discover creators
                    </button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers">
            {followersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <FriendCardSkeleton key={i} />
                ))}
              </div>
            ) : followers && followers.pubkeys.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {followers.pubkeys.map((pk) => (
                  <FriendCard key={pk} pubkey={pk} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No followers yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Share your content to grow your following!
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

function FriendCard({ pubkey }: { pubkey: string }) {
  const { data: author, isLoading } = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);

  if (isLoading) {
    return <FriendCardSkeleton />;
  }

  const metadata = author?.metadata;

  return (
    <Link to={`/${npub}`}>
      <Card className="myspace-card hover:border-primary/30 transition-all hover-lift group h-full">
        <CardContent className="p-4 text-center">
          <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-border group-hover:border-primary transition-colors">
            <AvatarImage src={metadata?.picture} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {(metadata?.name || 'A')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {metadata?.display_name || metadata?.name || 'Anonymous'}
          </h3>
          {metadata?.name && metadata?.display_name && (
            <p className="text-xs text-muted-foreground truncate">
              @{metadata.name}
            </p>
          )}
          {metadata?.nip05 && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground truncate">
                {metadata.nip05}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function FriendCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <Skeleton className="h-20 w-20 rounded-full mx-auto mb-3" />
        <Skeleton className="h-5 w-24 mx-auto mb-1" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </CardContent>
    </Card>
  );
}
