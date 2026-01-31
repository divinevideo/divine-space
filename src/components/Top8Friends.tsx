import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthor } from '@/hooks/useAuthor';
import { useMySpaceProfile, type TopFriend } from '@/hooks/useMySpaceProfile';
import { Users, Sparkles, Crown, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Top8FriendsProps {
  pubkey: string;
  isOwnProfile?: boolean;
  className?: string;
}

export function Top8Friends({ pubkey, isOwnProfile, className }: Top8FriendsProps) {
  const { data: profile, isLoading } = useMySpaceProfile(pubkey);

  if (isLoading) {
    return <Top8FriendsSkeleton className={className} />;
  }

  const topFriends = profile?.topFriends || [];

  if (topFriends.length === 0 && !isOwnProfile) {
    return null; // Don't show empty section on others' profiles
  }

  return (
    <Card className={cn("myspace-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-pink-500" />
          <span className="gradient-text">Top {Math.min(topFriends.length || 8, 8)} Friends</span>
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topFriends.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Top 8 yet!</p>
            {isOwnProfile && (
              <Link to="/friends">
                <Button variant="outline" size="sm" className="mt-3">
                  Add Friends
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {topFriends.slice(0, 8).map((friend, index) => (
              <FriendSlot 
                key={friend.pubkey} 
                friend={friend} 
                rank={index + 1}
              />
            ))}
            {/* Fill empty slots with placeholders if less than 8 */}
            {topFriends.length < 8 && isOwnProfile && (
              Array.from({ length: Math.min(8 - topFriends.length, 4) }).map((_, i) => (
                <EmptySlot key={`empty-${i}`} />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FriendSlot({ friend, rank }: { friend: TopFriend; rank: number }) {
  const { data: author, isLoading } = useAuthor(friend.pubkey);
  const npub = nip19.npubEncode(friend.pubkey);
  const metadata = author?.metadata;

  if (isLoading) {
    return (
      <div className="text-center">
        <Skeleton className="h-14 w-14 rounded-full mx-auto mb-1" />
        <Skeleton className="h-3 w-12 mx-auto" />
      </div>
    );
  }

  return (
    <Link to={`/${npub}`} className="group text-center relative">
      {/* Rank badge for #1 */}
      {rank === 1 && (
        <div className="absolute -top-1 -right-1 z-10">
          <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
        </div>
      )}
      
      <div className="relative">
        <Avatar className={cn(
          "h-14 w-14 mx-auto border-2 transition-all duration-300",
          "group-hover:scale-110 group-hover:border-primary",
          rank === 1 ? "border-yellow-500 glow-pink" : "border-border"
        )}>
          <AvatarImage src={metadata?.picture} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            {(metadata?.name || 'A')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Position number */}
        <div className={cn(
          "absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
          rank === 1 
            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" 
            : "bg-muted text-muted-foreground"
        )}>
          {rank}
        </div>
      </div>
      
      <p className="mt-2 text-xs truncate group-hover:text-primary transition-colors max-w-[70px] mx-auto">
        {metadata?.display_name || metadata?.name || 'Anon'}
      </p>
    </Link>
  );
}

function EmptySlot() {
  return (
    <Link to="/friends" className="group text-center opacity-40 hover:opacity-70 transition-opacity">
      <div className="h-14 w-14 mx-auto rounded-full border-2 border-dashed border-border flex items-center justify-center">
        <Heart className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Add</p>
    </Link>
  );
}

function Top8FriendsSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("myspace-card", className)}>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-14 w-14 rounded-full mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
