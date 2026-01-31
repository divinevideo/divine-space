import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Play, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import type { VideoListItem } from '@/lib/divine-api';

interface VideoCardProps {
  video: VideoListItem;
  className?: string;
  showAuthor?: boolean;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

export function VideoCard({ video, className, showAuthor = true }: VideoCardProps) {
  const npub = nip19.npubEncode(video.pubkey);
  const createdAt = new Date(video.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  return (
    <Card className={cn(
      "group overflow-hidden bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 hover-lift",
      className
    )}>
      {/* Thumbnail */}
      <Link to={`/video/${video.id}`} className="block relative aspect-[9/16] sm:aspect-video overflow-hidden">
        <img
          src={video.thumbnail || '/placeholder-video.jpg'}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 glow-purple">
            <Play className="h-7 w-7 text-white ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Video kind badge */}
        <div className="absolute top-2 left-2">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm",
            video.kind === 34236 
              ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" 
              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
          )}>
            {video.kind === 34236 ? 'Short' : 'Video'}
          </span>
        </div>
        
        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex items-center gap-3 text-white/80 text-xs">
            <div className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              <span>{formatCount(video.reactions)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{formatCount(video.comments)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat2 className="h-3.5 w-3.5" />
              <span>{formatCount(video.reposts)}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 space-y-2">
        <Link to={`/video/${video.id}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
            {video.title || 'Untitled Video'}
          </h3>
        </Link>

        {showAuthor && (
          <Link to={`/${npub}`} className="flex items-center gap-2 group/author">
            <Avatar className="h-6 w-6 border border-border">
              <AvatarImage src={video.author_avatar} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {(video.author_name || 'A')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground group-hover/author:text-primary transition-colors truncate">
              {video.author_name || 'Anonymous'}
            </span>
          </Link>
        )}

        <p className="text-xs text-muted-foreground">
          {timeAgo}
        </p>
      </div>
    </Card>
  );
}

// Skeleton for loading state
export function VideoCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-card/50 border-border/50">
      <div className="aspect-[9/16] sm:aspect-video bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  );
}
