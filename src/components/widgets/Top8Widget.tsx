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
import { Users, Sparkles, Crown, Medal, Plus, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Widget configuration for bento grid
 */
export interface WidgetConfig {
  id: string;
  type: string;
  x: number;      // Grid column (0-3)
  y: number;      // Grid row
  w: number;      // Width in columns (1-4)
  h: number;      // Height in rows (1-4)
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  config?: Record<string, unknown>;
}

export interface Top8WidgetProps {
  widget: WidgetConfig;
  pubkey: string;
  isEditing?: boolean;
  presetStyle?: PresetStyle;
  className?: string;
}

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
        .map(([, pk]) => pk)
        .slice(0, 8); // Only take first 8

      return followingPubkeys;
    },
    enabled: !!pubkey,
  });
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

// Get rank colors for avatar border
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

/**
 * Top8Widget - Displays top 8 friends in a 4x2 grid for the bento grid system.
 *
 * Features:
 * - 4x2 grid layout showing up to 8 friends
 * - Rank badges (#1 crown, #2 silver medal, #3 bronze medal)
 * - Avatar and petname display
 * - Hover effects with scale animation
 * - Edit mode support with settings/delete buttons
 * - Falls back to following list if no custom top 8
 */
export function Top8Widget({
  widget,
  pubkey,
  isEditing = false,
  presetStyle,
  className
}: Top8WidgetProps) {
  const { data: profile, isLoading: profileLoading } = useMySpaceProfile(pubkey);
  const { data: followingPubkeys = [], isLoading: followingLoading } = useFollowingList(pubkey);

  const isLoading = profileLoading || followingLoading;

  if (isLoading) {
    return <Top8WidgetSkeleton widget={widget} isEditing={isEditing} className={className} />;
  }

  // Use custom top friends if set, otherwise fall back to following list
  const customTopFriends = profile?.topFriends || [];
  const hasCustomTop8 = customTopFriends.length > 0;

  // Convert following pubkeys to TopFriend format for fallback
  const followingAsFriends: TopFriend[] = followingPubkeys.map((pk, index) => ({
    pubkey: pk,
    position: index + 1
  }));

  // Use custom top8 if available, otherwise use following list
  const topFriends = hasCustomTop8 ? customTopFriends : followingAsFriends;
  const isUsingFallback = !hasCustomTop8 && followingAsFriends.length > 0;

  // Style variations based on preset
  const headerStyle = presetStyle === 'scene-kid'
    ? 'xX Top 8 Xx'
    : presetStyle === 'y2k-princess'
    ? '~ My Top 8 ~'
    : presetStyle === 'vine-legend'
    ? 'My Vine Fam'
    : presetStyle === 'kawaii-star'
    ? 'Best Friends'
    : presetStyle === 'cyber-punk'
    ? '// TOP_FRIENDS'
    : isUsingFallback
    ? 'Following'
    : `Top ${Math.min(topFriends.length || 8, 8)}`;

  return (
    <Card className={cn(
      "widget h-full overflow-hidden relative",
      isEditing && "ring-2 ring-primary/50",
      className
    )}>
      {/* Edit mode toolbar */}
      {isEditing && (
        <div className="widget-toolbar absolute top-2 right-2 z-10 flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7">
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Decorative header banner */}
      <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />

      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Users className="h-4 w-4 text-pink-500" />
              {topFriends.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn(
              "text-xs font-semibold",
              presetStyle === 'scene-kid' && "font-bold tracking-wider",
              presetStyle === 'kawaii-star' && "text-pink-500",
              presetStyle === 'cyber-punk' && "font-mono text-cyan-400",
              !presetStyle && "gradient-text"
            )}>
              {headerStyle}
            </span>
            <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
          </div>
          {topFriends.length > 0 && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1">
              {topFriends.length}/8
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        {topFriends.length === 0 ? (
          <EmptyTop8State presetStyle={presetStyle} />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {topFriends.slice(0, 8).map((friend, index) => (
                <FriendSlot
                  key={friend.pubkey}
                  friend={friend}
                  rank={index + 1}
                  presetStyle={presetStyle}
                  isUsingFallback={isUsingFallback}
                  compact={widget.h <= 2}
                />
              ))}
              {/* Fill empty slots with placeholders if less than 8 */}
              {topFriends.length < 8 && !isUsingFallback && (
                Array.from({ length: Math.min(8 - topFriends.length, 8 - topFriends.length) }).map((_, i) => (
                  <EmptySlot key={`empty-${i}`} presetStyle={presetStyle} compact={widget.h <= 2} />
                ))
              )}
            </div>

            {/* Decorative footer */}
            <div className="mt-2 flex items-center justify-center gap-0.5 text-[8px] text-muted-foreground">
              {['*', '~', '*', '~', '*'].map((char, i) => (
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
  compact?: boolean;
}

function FriendSlot({ friend, rank, presetStyle: _presetStyle, isUsingFallback, compact }: FriendSlotProps) {
  const { data: author, isLoading } = useAuthor(friend.pubkey);
  const npub = nip19.npubEncode(friend.pubkey);
  const metadata = author?.metadata;

  if (isLoading) {
    return (
      <div className="text-center">
        <Skeleton className={cn(
          "rounded-full mx-auto mb-1",
          compact ? "h-10 w-10" : "h-12 w-12"
        )} />
        <Skeleton className="h-2.5 w-10 mx-auto" />
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
          "absolute -top-0.5 z-10",
          rank === 1 ? "-right-0.5" : "right-0"
        )}>
          {rankIcon}
        </div>
      )}

      <div className="relative">
        {/* Animated ring for #1 */}
        {showRanks && rank === 1 && (
          <div
            className="absolute inset-0 -m-0.5 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-yellow-400 animate-spin opacity-50 blur-sm"
            style={{ animationDuration: '3s' }}
          />
        )}

        <Avatar className={cn(
          "mx-auto border-2 transition-all duration-300 relative",
          "group-hover:scale-110",
          compact ? "h-10 w-10" : "h-12 w-12",
          showRanks ? rankColors : "border-border group-hover:border-primary"
        )}>
          <AvatarImage src={metadata?.picture} className="object-cover" />
          <AvatarFallback className={cn(
            "text-sm font-bold",
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
            "absolute -bottom-0.5 left-1/2 -translate-x-1/2 min-w-[16px] h-4 px-0.5 rounded-full text-[8px] font-bold flex items-center justify-center",
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
      <div className={cn("mt-1.5", !showRanks && "mt-1")}>
        <p className={cn(
          "text-[10px] truncate group-hover:text-primary transition-colors max-w-[60px] mx-auto font-medium",
          showRanks && rank === 1 && "text-yellow-500 group-hover:text-yellow-400"
        )}>
          {friend.nickname || metadata?.display_name || metadata?.name || 'Anon'}
        </p>
        {/* Show tiny role/title for #1 - only for custom top8 */}
        {showRanks && rank === 1 && !compact && (
          <p className="text-[8px] text-yellow-500/80 mt-0.5">bestie</p>
        )}
      </div>
    </Link>
  );
}

function EmptySlot({ presetStyle, compact }: { presetStyle?: PresetStyle; compact?: boolean }) {
  return (
    <Link to="/friends" className="group text-center opacity-50 hover:opacity-80 transition-all">
      <div className={cn(
        "mx-auto rounded-full border-2 border-dashed flex items-center justify-center transition-all",
        "group-hover:border-primary group-hover:bg-primary/5",
        compact ? "h-10 w-10" : "h-12 w-12",
        presetStyle === 'scene-kid' ? "border-pink-500/50" :
        presetStyle === 'kawaii-star' ? "border-pink-300/50" :
        presetStyle === 'cyber-punk' ? "border-cyan-500/50" :
        "border-border"
      )}>
        <Plus className={cn(
          "h-4 w-4 transition-colors",
          "group-hover:text-primary",
          presetStyle === 'scene-kid' ? "text-pink-500/50" :
          presetStyle === 'kawaii-star' ? "text-pink-300" :
          presetStyle === 'cyber-punk' ? "text-cyan-500/50" :
          "text-muted-foreground"
        )} />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
        Add
      </p>
    </Link>
  );
}

function EmptyTop8State({ presetStyle }: { presetStyle?: PresetStyle }) {
  const emptyMessages: Record<string, { title: string; subtitle: string }> = {
    'scene-kid': { title: 'xX no friends Xx', subtitle: 'add besties!' },
    'y2k-princess': { title: '~ empty ~', subtitle: 'add angels' },
    'kawaii-star': { title: 'No friends!', subtitle: 'Find squad~' },
    'cyber-punk': { title: '// NULL', subtitle: 'init()' },
    'vine-legend': { title: 'No fam', subtitle: 'Build crew' },
    'default': { title: 'No Top 8!', subtitle: 'Add friends' },
  };

  const message = emptyMessages[presetStyle || 'default'] || emptyMessages.default;

  return (
    <div className="text-center py-4">
      <div className={cn(
        "h-12 w-12 mx-auto rounded-full flex items-center justify-center mb-2",
        "bg-gradient-to-br from-pink-500/20 to-purple-500/20"
      )}>
        <Users className="h-6 w-6 text-pink-500/60" />
      </div>
      <p className={cn(
        "text-xs font-medium mb-0.5",
        presetStyle === 'scene-kid' && "tracking-wider",
        presetStyle === 'cyber-punk' && "font-mono text-cyan-400"
      )}>
        {message.title}
      </p>
      <p className="text-[10px] text-muted-foreground">{message.subtitle}</p>

      {/* Decorative empty slots preview */}
      <div className="flex justify-center gap-1.5 mt-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-6 w-6 rounded-full border border-dashed border-border/50 opacity-30"
          />
        ))}
      </div>
    </div>
  );
}

interface Top8WidgetSkeletonProps {
  widget: WidgetConfig;
  isEditing?: boolean;
  className?: string;
}

function Top8WidgetSkeleton({ widget, isEditing, className }: Top8WidgetSkeletonProps) {
  const compact = widget.h <= 2;

  return (
    <Card className={cn(
      "widget h-full overflow-hidden",
      isEditing && "ring-2 ring-primary/50",
      className
    )}>
      <div className="h-1.5 w-full bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-cyan-500/30 animate-pulse" />
      <CardHeader className="pb-2 pt-3 px-3">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className={cn(
                "rounded-full mx-auto mb-1",
                compact ? "h-10 w-10" : "h-12 w-12"
              )} />
              <Skeleton className="h-2.5 w-10 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default Top8Widget;
