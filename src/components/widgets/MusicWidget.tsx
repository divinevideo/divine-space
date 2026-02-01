import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Settings,
  Trash2,
  ExternalLink,
  Disc3
} from 'lucide-react';

// Widget configuration following the bento grid pattern
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

// Music status from Kind 30315 (NIP-38)
export interface MusicStatus {
  type: 'music' | 'profile_song';
  title: string;
  artist?: string;
  url?: string;
  coverArt?: string;
  expiration?: number;
}

interface MusicWidgetProps {
  widget: WidgetConfig;
  musicStatus?: MusicStatus;
  isEditing?: boolean;
  onRemove?: () => void;
  onConfigure?: () => void;
  className?: string;
}

export function MusicWidget({
  widget,
  musicStatus,
  isEditing = false,
  onRemove,
  onConfigure,
  className,
}: MusicWidgetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine widget size for adaptive layout
  const isCompact = widget.w === 1 || widget.h === 1;
  const isLarge = widget.w >= 3 && widget.h >= 2;
  const showVolumeSlider = !isCompact && widget.w >= 2;
  const showProgress = widget.h >= 2 || widget.w >= 3;

  // Handle play/pause
  const togglePlay = () => {
    if (!musicStatus?.url) return;

    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Update progress
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(isNaN(currentProgress) ? 0 : currentProgress);
        }
      }, 500);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  // No music configured - show placeholder
  if (!musicStatus) {
    return (
      <Card className={cn(
        'h-full overflow-hidden relative',
        'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
        'border-dashed border-2 border-border/50',
        isEditing && 'ring-2 ring-primary/50 cursor-move',
        className
      )}>
        {isEditing && (
          <EditToolbar onConfigure={onConfigure} onRemove={onRemove} />
        )}
        <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Music className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {isCompact ? 'No music' : 'No music configured'}
          </p>
          {!isCompact && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add a profile song in settings
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'h-full overflow-hidden relative group',
      'bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10',
      'border border-primary/20',
      isEditing && 'ring-2 ring-primary/50 cursor-move',
      className
    )}>
      {/* Hidden audio element */}
      {musicStatus.url && (
        <audio
          ref={audioRef}
          src={musicStatus.url}
          preload="metadata"
        />
      )}

      {isEditing && (
        <EditToolbar onConfigure={onConfigure} onRemove={onRemove} />
      )}

      <CardContent className={cn(
        'h-full flex',
        isCompact ? 'p-2' : 'p-4',
        isLarge ? 'flex-col' : 'flex-row items-center gap-4'
      )}>
        {/* Album Art / Animated Disc */}
        <div className={cn(
          'relative flex-shrink-0',
          isCompact ? 'h-10 w-10' : isLarge ? 'h-24 w-24 mx-auto mb-4' : 'h-16 w-16'
        )}>
          {musicStatus.coverArt ? (
            <img
              src={musicStatus.coverArt}
              alt={`${musicStatus.title} cover`}
              className={cn(
                'w-full h-full object-cover rounded-lg shadow-lg',
                isPlaying && 'animate-pulse'
              )}
            />
          ) : (
            <div className={cn(
              'w-full h-full rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-purple-600 to-pink-600',
              isPlaying && 'animate-spin-slow'
            )}>
              <Disc3 className={cn(
                'text-white',
                isCompact ? 'h-5 w-5' : 'h-8 w-8'
              )} />
            </div>
          )}

          {/* Now Playing indicator */}
          {isPlaying && (
            <div className="absolute -bottom-1 -right-1 flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-bounce"
                  style={{
                    height: `${8 + Math.random() * 8}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Song Info & Controls */}
        <div className={cn(
          'flex-1 min-w-0',
          isLarge ? 'text-center' : ''
        )}>
          {/* Now Playing Badge */}
          {!isCompact && (
            <div className="flex items-center gap-1.5 mb-1 justify-start">
              <span className={cn(
                'text-[10px] uppercase tracking-wider font-medium',
                isPlaying ? 'text-primary' : 'text-muted-foreground'
              )}>
                {isPlaying ? 'Now Playing' : musicStatus.type === 'profile_song' ? 'Profile Song' : 'Music'}
              </span>
              {musicStatus.url && (
                <a
                  href={musicStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Title */}
          <h4 className={cn(
            'font-semibold truncate',
            isCompact ? 'text-xs' : 'text-sm',
            isLarge && 'text-base'
          )}>
            {musicStatus.title}
          </h4>

          {/* Artist */}
          {musicStatus.artist && !isCompact && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {musicStatus.artist}
            </p>
          )}

          {/* Progress Bar */}
          {showProgress && musicStatus.url && (
            <div className="mt-3 mb-2">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className={cn(
            'flex items-center gap-2',
            isLarge ? 'justify-center mt-4' : 'mt-2'
          )}>
            {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size={isCompact ? 'sm' : 'default'}
              className={cn(
                'rounded-full',
                isCompact ? 'h-8 w-8 p-0' : 'h-10 w-10 p-0',
                isPlaying && 'bg-primary/20'
              )}
              onClick={togglePlay}
              disabled={!musicStatus.url}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
              ) : (
                <Play className={cn(
                  isCompact ? 'h-4 w-4' : 'h-5 w-5',
                  'ml-0.5' // Optical centering for play icon
                )} />
              )}
            </Button>

            {/* Volume Controls */}
            {showVolumeSlider && (
              <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                  aria-label="Volume"
                />
              </div>
            )}

            {/* Compact mute button */}
            {!showVolumeSlider && !isCompact && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}

// Edit toolbar for editing mode
interface EditToolbarProps {
  onConfigure?: () => void;
  onRemove?: () => void;
}

function EditToolbar({ onConfigure, onRemove }: EditToolbarProps) {
  return (
    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {onConfigure && (
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}
          aria-label="Configure widget"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      )}
      {onRemove && (
        <Button
          size="icon"
          variant="destructive"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove widget"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// CSS for spin animation (add to your global CSS or tailwind config)
// .animate-spin-slow {
//   animation: spin 3s linear infinite;
// }

export default MusicWidget;
