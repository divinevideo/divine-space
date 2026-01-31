import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuthor } from '@/hooks/useAuthor';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useMySpaceProfile, type TopFriend, type PresetStyle } from '@/hooks/useMySpaceProfile';
import { Users, Sparkles, Crown, Heart, Star, Trophy, Medal, Video, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Hook to get who a user follows from their kind 3 contact list
function useFollowingList(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'following-list', pubkey],
    queryFn: async () => {
      if (!pubkey) return [];
      
      const events = await nostr.query([{
        kinds: [3],
        authors: [pubkey],
        limit: 1,
      }]);

      if (events.length === 0) return [];
      
      // Extract pubkeys from p tags
      const followingPubkeys = events[0].tags
        .filter(([tag]) => tag === 'p')
        .map(([_, pk]) => pk)
        .slice(0, 8); // Only take first 8
      
      return followingPubkeys;
    },
    enabled: !!pubkey,
  });
}

interface Top8FriendsProps {
  pubkey: string;
  isOwnProfile?: boolean;
  className?: string;
  presetStyle?: PresetStyle;
}

// Get rank icon based on position
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
    case 2:
      return <Medal className="h-3.5 w-3.5 text-gray-400" />;
    case 3:
      return <Medal className="h-3.5 w-3.5 text-amber-600" />;
    default:
      return null;
  }
}

// Get rank colors
function getRankColors(rank: number) {
  switch (rank) {
    case 1:
      return "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]";
    case 2:
      return "border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.3)]";
    case 3:
      return "border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.3)]";
    default:
      return "border-border";
  }
}

export function Top8Friends({ pubkey, isOwnProfile, className, presetStyle }: Top8FriendsProps) {
  const { data: profile, isLoading: profileLoading } = useMySpaceProfile(pubkey);
  const { data: followingPubkeys = [], isLoading: followingLoading } = useFollowingList(pubkey);

  const isLoading = profileLoading || followingLoading;

  if (isLoading) {
    return <Top8FriendsSkeleton className={className} />;
  }

  // Use custom top friends if set, otherwise fall back to following list
  const customTopFriends = profile?.topFriends || [];
  const hasCustomTop8 = customTopFriends.length > 0;
  
  // Convert following pubkeys to TopFriend format for fallback
  const followingAsFriends: TopFriend[] = followingPubkeys.map(pk => ({ pubkey: pk }));
  
  // Use custom top8 if available, otherwise use following list
  const topFriends = hasCustomTop8 ? customTopFriends : followingAsFriends;
  const hasTop8 = topFriends.length > 0;
  const isUsingFallback = !hasCustomTop8 && followingAsFriends.length > 0;

  // Style variations based on preset
  const headerStyle = presetStyle === 'scene-kid' 
    ? 'xX Top 8 Xx' 
    : presetStyle === 'y2k-princess' 
    ? '~ My Top 8 ~'
    : presetStyle === 'vine-legend'
    ? 'My Vine Fam'
    : presetStyle === 'kawaii-star'
    ? '★ Best Friends ★'
    : presetStyle === 'cyber-punk'
    ? '// TOP_FRIENDS'
    : isUsingFallback
    ? 'Following'
    : `Top ${Math.min(topFriends.length || 8, 8)} Friends`;

  return (
    <Card className={cn("myspace-card overflow-hidden", className)}>
      {/* Decorative header banner */}
      <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Users className="h-5 w-5 text-pink-500" />
              {hasTop8 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn(
              presetStyle === 'scene-kid' && "font-bold tracking-wider",
              presetStyle === 'kawaii-star' && "text-pink-500",
              presetStyle === 'cyber-punk' && "font-mono text-cyan-400",
              !presetStyle && "gradient-text"
            )}>
              {headerStyle}
            </span>
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
          </div>
          {hasTop8 && (
            <Badge variant="secondary" className="text-[10px]">
              {topFriends.length}/8
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {topFriends.length === 0 ? (
          <EmptyTop8State isOwnProfile={isOwnProfile} presetStyle={presetStyle} />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              {topFriends.slice(0, 8).map((friend, index) => (
                <FriendSlot 
                  key={friend.pubkey} 
                  friend={friend} 
                  rank={index + 1}
                  presetStyle={presetStyle}
                  isUsingFallback={isUsingFallback}
                />
              ))}
              {/* Fill empty slots with placeholders if less than 8 */}
              {topFriends.length < 8 && isOwnProfile && !isUsingFallback && (
                Array.from({ length: Math.min(8 - topFriends.length, 4) }).map((_, i) => (
                  <EmptySlot key={`empty-${i}`} presetStyle={presetStyle} />
                ))
              )}
            </div>
            
            {/* Snarky message when using fallback and less than 8 friends */}
            {isUsingFallback && topFriends.length < 8 && (
              <SnarkyMessage count={topFriends.length} presetStyle={presetStyle} />
            )}
            
            {/* Decorative footer */}
            <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              {['✦', '♡', '✦', '♡', '✦'].map((char, i) => (
                <span 
                  key={i} 
                  className={cn(
                    "animate-pulse",
                    i % 2 === 0 ? "text-pink-500" : "text-cyan-500"
                  )}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {char}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface FriendSlotProps {
  friend: TopFriend;
  rank: number;
  presetStyle?: PresetStyle;
  isUsingFallback?: boolean;
}

function FriendSlot({ friend, rank, presetStyle, isUsingFallback }: FriendSlotProps) {
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

  const rankIcon = getRankIcon(rank);
  const rankColors = getRankColors(rank);

  // When using fallback (showing following list), don't show rank styling
  const showRanks = !isUsingFallback;

  return (
    <Link to={`/${npub}`} className="group text-center relative block">
      {/* Rank badge for top 3 */}
      {showRanks && rank <= 3 && (
        <div className={cn(
          "absolute -top-1 z-10",
          rank === 1 ? "-right-1" : "right-0"
        )}>
          {rankIcon}
        </div>
      )}
      
      <div className="relative">
        {/* Animated ring for #1 */}
        {showRanks && rank === 1 && (
          <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-yellow-400 animate-spin-slow opacity-50 blur-sm" 
               style={{ animationDuration: '3s' }} />
        )}
        
        <Avatar className={cn(
          "h-14 w-14 mx-auto border-2 transition-all duration-300 relative",
          "group-hover:scale-110",
          showRanks ? rankColors : "border-border group-hover:border-primary"
        )}>
          <AvatarImage src={metadata?.picture} className="object-cover" />
          <AvatarFallback className={cn(
            "text-lg font-bold",
            showRanks && rank === 1 ? "bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700" :
            showRanks && rank === 2 ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700" :
            showRanks && rank === 3 ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700" :
            "bg-primary/10 text-primary"
          )}>
            {(metadata?.name || 'A')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Position number badge - only show for custom top8, not fallback */}
        {showRanks && (
          <div className={cn(
            "absolute -bottom-1 left-1/2 -translate-x-1/2 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
            rank === 1 && "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg",
            rank === 2 && "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800",
            rank === 3 && "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
            rank > 3 && "bg-muted text-muted-foreground"
          )}>
            #{rank}
          </div>
        )}
      </div>
      
      {/* Name with optional nickname */}
      <div className={cn("mt-2.5", !showRanks && "mt-1.5")}>
        <p className={cn(
          "text-xs truncate group-hover:text-primary transition-colors max-w-[70px] mx-auto font-medium",
          showRanks && rank === 1 && "text-yellow-500 group-hover:text-yellow-400"
        )}>
          {friend.nickname || metadata?.display_name || metadata?.name || 'Anon'}
        </p>
        {/* Show tiny role/title for top 3 - only for custom top8 */}
        {showRanks && rank === 1 && (
          <p className="text-[9px] text-yellow-500/80 mt-0.5">bestie</p>
        )}
      </div>
    </Link>
  );
}

function SnarkyMessage({ count, presetStyle }: { count: number; presetStyle?: PresetStyle }) {
  // Snarky messages based on friend count
  const getSnarkyMessage = () => {
    if (count === 0) return "No friends? Yikes. 💀";
    if (count === 1) return "Just one friend? That's... intimate.";
    if (count === 2) return "Two friends? Quality over quantity, I guess...";
    if (count === 3) return "Three friends? At least you've got a trio.";
    if (count === 4) return "Only 4 friends? Halfway to cool.";
    if (count === 5) return "5 friends? Almost there, keep socializing!";
    if (count === 6) return "6 friends? 2 more and you'd have a full squad.";
    if (count === 7) return "So close! Just one more friend to be elite.";
    return "Impressive friend collection!";
  };

  const getPresetSnarkyMessage = () => {
    if (presetStyle === 'scene-kid') {
      if (count <= 3) return "xX not very scene of u Xx";
      return "xX need moar friends Xx";
    }
    if (presetStyle === 'kawaii-star') {
      if (count <= 3) return "So lonely~ (´;ω;`)";
      return "Find more friends~ ♡";
    }
    if (presetStyle === 'cyber-punk') {
      if (count <= 3) return "// ERROR: friends.length < required";
      return "// WARN: friend_count insufficient";
    }
    if (presetStyle === 'vine-legend') {
      if (count <= 3) return "This is sad. I'm calling the cops.";
      return "Two bros chillin'... alone apparently";
    }
    if (presetStyle === 'y2k-princess') {
      if (count <= 3) return "~ where r ur angels? ~";
      return "~ need more besties ~";
    }
    return getSnarkyMessage();
  };

  return (
    <div className={cn(
      "mt-3 text-center text-[11px] italic",
      presetStyle === 'cyber-punk' ? "font-mono text-cyan-500/70" : "text-muted-foreground/70"
    )}>
      {getPresetSnarkyMessage()}
    </div>
  );
}

function EmptySlot({ presetStyle }: { presetStyle?: PresetStyle }) {
  return (
    <Link to="/friends" className="group text-center opacity-50 hover:opacity-80 transition-all">
      <div className={cn(
        "h-14 w-14 mx-auto rounded-full border-2 border-dashed flex items-center justify-center transition-all",
        "group-hover:border-primary group-hover:bg-primary/5",
        presetStyle === 'scene-kid' ? "border-pink-500/50" :
        presetStyle === 'kawaii-star' ? "border-pink-300/50" :
        presetStyle === 'cyber-punk' ? "border-cyan-500/50" :
        "border-border"
      )}>
        <Plus className={cn(
          "h-5 w-5 transition-colors",
          "group-hover:text-primary",
          presetStyle === 'scene-kid' ? "text-pink-500/50" :
          presetStyle === 'kawaii-star' ? "text-pink-300" :
          presetStyle === 'cyber-punk' ? "text-cyan-500/50" :
          "text-muted-foreground"
        )} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
        Add
      </p>
    </Link>
  );
}

function EmptyTop8State({ isOwnProfile, presetStyle }: { isOwnProfile?: boolean; presetStyle?: PresetStyle }) {
  const emptyMessages: Record<string, { title: string; subtitle: string }> = {
    'scene-kid': { title: 'xX no friends yet Xx', subtitle: 'add ur besties!' },
    'y2k-princess': { title: '~ empty ~', subtitle: 'add ur angels' },
    'kawaii-star': { title: 'No friends yet!', subtitle: 'Find your squad~ ★' },
    'cyber-punk': { title: '// NULL', subtitle: 'init_friends()' },
    'vine-legend': { title: 'No fam yet', subtitle: 'Build your vine crew' },
    'default': { title: 'No Top 8 yet!', subtitle: 'Add your best friends' },
  };

  const message = emptyMessages[presetStyle || 'default'] || emptyMessages.default;

  return (
    <div className="text-center py-8">
      <div className={cn(
        "h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-3",
        "bg-gradient-to-br from-pink-500/20 to-purple-500/20"
      )}>
        <Users className="h-8 w-8 text-pink-500/60" />
      </div>
      <p className={cn(
        "text-sm font-medium mb-1",
        presetStyle === 'scene-kid' && "tracking-wider",
        presetStyle === 'cyber-punk' && "font-mono text-cyan-400"
      )}>
        {message.title}
      </p>
      <p className="text-xs text-muted-foreground mb-4">{message.subtitle}</p>
      {isOwnProfile && (
        <Link to="/friends">
          <Button variant="outline" size="sm" className="gap-2 group">
            <Heart className="h-4 w-4 group-hover:text-pink-500 transition-colors" />
            <span>Find Friends</span>
          </Button>
        </Link>
      )}
      
      {/* Decorative empty slots preview */}
      <div className="flex justify-center gap-2 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="h-8 w-8 rounded-full border border-dashed border-border/50 opacity-30"
          />
        ))}
      </div>
    </div>
  );
}

function Top8FriendsSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("myspace-card overflow-hidden", className)}>
      <div className="h-2 w-full bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-cyan-500/30 animate-pulse" />
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-14 w-14 rounded-full mx-auto mb-2" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
