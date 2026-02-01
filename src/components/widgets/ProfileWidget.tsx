import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthor } from '@/hooks/useAuthor';
import { cn } from '@/lib/utils';
import { Sparkles, Settings, Trash2 } from 'lucide-react';

/**
 * Widget configuration for bento grid positioning and sizing
 */
export interface WidgetConfig {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface ProfileWidgetProps {
  /** Widget configuration (size, position) */
  widget: WidgetConfig;
  /** User's public key to fetch profile data */
  pubkey: string;
  /** Whether the widget is in editing mode (shows controls) */
  isEditing?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when settings button is clicked in edit mode */
  onSettings?: () => void;
  /** Callback when delete button is clicked in edit mode */
  onDelete?: () => void;
}

/**
 * ProfileWidget displays user profile information in a bento grid widget.
 * Adapts content based on widget height:
 * - h=1: Compact view with avatar, name, and nip05
 * - h>=2: Full view with bio
 * - h>=3: Extended view with more bio text
 */
export function ProfileWidget({
  widget,
  pubkey,
  isEditing = false,
  className,
  onSettings,
  onDelete,
}: ProfileWidgetProps) {
  const { data: author, isLoading } = useAuthor(pubkey);
  const metadata = author?.metadata;

  if (isLoading) {
    return <ProfileWidgetSkeleton widget={widget} className={className} />;
  }

  // Determine layout based on widget height
  const isCompact = widget.h === 1;
  const isExtended = widget.h >= 3;

  // Calculate avatar size based on widget dimensions
  const avatarSize = isCompact ? 'h-12 w-12' : widget.h >= 2 ? 'h-20 w-20' : 'h-16 w-16';

  // Determine bio line clamping based on height
  const bioLineClamp = isExtended ? 'line-clamp-6' : 'line-clamp-3';

  return (
    <Card
      className={cn(
        'widget h-full overflow-hidden relative',
        isEditing && 'ring-2 ring-primary/50 cursor-move',
        className
      )}
    >
      {/* Edit mode toolbar */}
      {isEditing && (
        <div className="widget-toolbar absolute top-2 right-2 z-10 flex gap-1">
          {onSettings && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onSettings();
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <CardContent className={cn('h-full', isCompact ? 'p-3' : 'p-4')}>
        {isCompact ? (
          // Compact horizontal layout for h=1
          <div className="flex items-center gap-3 h-full">
            <Avatar className={cn(avatarSize, 'flex-shrink-0')}>
              <AvatarImage src={metadata?.picture} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {(metadata?.name || metadata?.display_name || 'A')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold truncate">
                {metadata?.display_name || metadata?.name || 'Anonymous'}
              </h2>
              {metadata?.nip05 && (
                <p className="text-xs text-muted-foreground truncate">{metadata.nip05}</p>
              )}
            </div>
          </div>
        ) : (
          // Vertical centered layout for h>=2
          <div className="flex flex-col items-center justify-center gap-3 h-full">
            <Avatar className={cn(avatarSize, 'border-2 border-background shadow-lg')}>
              <AvatarImage src={metadata?.picture} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {(metadata?.name || metadata?.display_name || 'A')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="text-center space-y-1 min-w-0 max-w-full">
              <h2 className="text-xl font-bold truncate px-2">
                {metadata?.display_name || metadata?.name || 'Anonymous'}
              </h2>

              {metadata?.name && metadata?.display_name && (
                <p className="text-sm text-muted-foreground truncate">@{metadata.name}</p>
              )}

              {metadata?.nip05 && (
                <Badge variant="secondary" className="gap-1 max-w-full">
                  <Sparkles className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{metadata.nip05}</span>
                </Badge>
              )}
            </div>

            {/* Bio - only shown when h >= 2 */}
            {widget.h >= 2 && metadata?.about && (
              <p
                className={cn(
                  'text-sm text-center text-muted-foreground px-2',
                  bioLineClamp
                )}
              >
                {metadata.about}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for ProfileWidget
 */
function ProfileWidgetSkeleton({
  widget,
  className,
}: {
  widget: WidgetConfig;
  className?: string;
}) {
  const isCompact = widget.h === 1;
  const avatarSize = isCompact ? 'h-12 w-12' : 'h-20 w-20';

  return (
    <Card className={cn('widget h-full overflow-hidden', className)}>
      <CardContent className={cn('h-full', isCompact ? 'p-3' : 'p-4')}>
        {isCompact ? (
          <div className="flex items-center gap-3 h-full">
            <Skeleton className={cn(avatarSize, 'rounded-full flex-shrink-0')} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 h-full">
            <Skeleton className={cn(avatarSize, 'rounded-full')} />
            <div className="space-y-2 text-center">
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
            {widget.h >= 2 && (
              <div className="space-y-1 w-full max-w-[200px]">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5 mx-auto" />
                <Skeleton className="h-3 w-3/5 mx-auto" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProfileWidget;
