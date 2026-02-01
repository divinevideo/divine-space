import { Link } from 'react-router-dom';
import { Video, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDivineUserVideos } from '@/hooks/useDivineUser';
import type { WidgetProps, VideosWidgetConfig } from '@/types/widgets';

/**
 * VideosWidget displays a user's videos in a responsive grid.
 *
 * The grid adapts based on widget size:
 * - 1 column wide: 1 video column
 * - 2 columns wide: 2 video columns
 * - 3+ columns wide: 3 video columns
 */
export function VideosWidget({ widget, pubkey, isEditing }: WidgetProps) {
  const config = widget.config as VideosWidgetConfig | undefined;

  // Calculate max videos based on widget size
  // More videos for larger widgets
  const maxVideos = config?.maxVideos ?? Math.min(widget.w * widget.h * 2, 9);

  const { data: videos, isLoading } = useDivineUserVideos(pubkey, {
    limit: maxVideos,
  });

  // Determine grid columns based on widget width
  const getGridCols = () => {
    if (widget.w === 1) return 'grid-cols-1';
    if (widget.w === 2) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  // Filter videos by kind if configured
  const filteredVideos = config?.kind
    ? videos?.filter(v => v.kind === config.kind)
    : videos;

  return (
    <Card className={cn(
      'widget h-full overflow-hidden',
      isEditing && 'ring-2 ring-primary/50 cursor-move'
    )}>
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          Videos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 h-[calc(100%-48px)] overflow-y-auto">
        {isLoading ? (
          <div className={cn('grid gap-2', getGridCols())}>
            {Array.from({ length: maxVideos }).map((_, i) => (
              <VideoThumbnailSkeleton key={i} />
            ))}
          </div>
        ) : filteredVideos && filteredVideos.length > 0 ? (
          <div className={cn('grid gap-2', getGridCols())}>
            {filteredVideos.slice(0, maxVideos).map((video) => (
              <VideoThumbnail
                key={video.id}
                video={video}
                isEditing={isEditing}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Video className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No videos yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface VideoThumbnailProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    kind: number;
  };
  isEditing: boolean;
}

function VideoThumbnail({ video, isEditing }: VideoThumbnailProps) {
  const content = (
    <div className="group relative overflow-hidden rounded-md bg-muted">
      <AspectRatio ratio={16 / 9}>
        <img
          src={video.thumbnail || '/placeholder-video.jpg'}
          alt={video.title || 'Video'}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="h-4 w-4 text-white ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Video kind badge */}
        <div className="absolute top-1 left-1">
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm",
            video.kind === 34236
              ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
          )}>
            {video.kind === 34236 ? 'Short' : 'Video'}
          </span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-white text-xs font-medium line-clamp-1">
            {video.title || 'Untitled'}
          </p>
        </div>
      </AspectRatio>
    </div>
  );

  // In editing mode, don't make it clickable
  if (isEditing) {
    return content;
  }

  return (
    <Link to={`/video/${video.id}`} className="block">
      {content}
    </Link>
  );
}

function VideoThumbnailSkeleton() {
  return (
    <div className="rounded-md overflow-hidden">
      <AspectRatio ratio={16 / 9}>
        <Skeleton className="h-full w-full" />
      </AspectRatio>
    </div>
  );
}

export default VideosWidget;
