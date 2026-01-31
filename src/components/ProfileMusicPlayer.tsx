import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Music, 
  ExternalLink,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProfileMusic } from '@/hooks/useMySpaceProfile';

interface ProfileMusicPlayerProps {
  music: ProfileMusic;
  autoplay?: boolean;
  className?: string;
}

export function ProfileMusicPlayer({ music, autoplay = false, className }: ProfileMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract audio URL - handle Wavlake, YouTube, etc.
  const audioUrl = getAudioUrl(music.url);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Unable to load audio');
      setIsLoaded(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Autoplay if enabled (will likely be blocked by browser)
    if (autoplay && isLoaded) {
      audio.play().catch(() => {
        // Autoplay was blocked, that's fine
      });
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [autoplay, isLoaded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error('Playback failed:', err);
        setError('Playback failed');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Card className={cn("myspace-card bg-gradient-to-r from-purple-900/30 to-pink-900/30", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Music className="h-8 w-8 opacity-50" />
            <div>
              <p className="text-sm font-medium">{music.title || 'Profile Song'}</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "myspace-card overflow-hidden relative",
      isPlaying && "animate-pulse-glow",
      className
    )}>
      {/* Animated background when playing */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 transition-opacity duration-500",
        isPlaying ? "opacity-100 animated-gradient" : "opacity-0"
      )} />
      
      <CardContent className="p-4 relative z-10">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        <div className="flex items-center gap-4">
          {/* Album art / Music icon */}
          <div className={cn(
            "h-16 w-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 transition-transform duration-300",
            isPlaying && "animate-pulse"
          )}>
            <Music className="h-8 w-8 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Song info */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold truncate text-sm">
                  {music.title || 'Profile Song'}
                </p>
                {music.artist && (
                  <p className="text-xs text-muted-foreground truncate">
                    {music.artist}
                  </p>
                )}
              </div>
              <a
                href={music.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-muted-foreground w-8">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
                disabled={!isLoaded}
              />
              <span className="text-[10px] text-muted-foreground w-8 text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!isLoaded}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="default"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full",
                    isPlaying && "glow-purple"
                  )}
                  onClick={togglePlay}
                  disabled={!isLoaded && !error}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!isLoaded}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Now playing indicator */}
        {isPlaying && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="text-[10px] text-primary font-medium">NOW PLAYING</span>
            <div className="flex items-end gap-0.5 h-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-0.5 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to extract direct audio URL from various sources
function getAudioUrl(url: string): string {
  // For now, just return the URL as-is
  // In the future, could handle Wavlake, YouTube, Spotify embeds, etc.
  return url;
}

// Compact version for profile sidebar
export function ProfileMusicPlayerCompact({ music, className }: { music: ProfileMusic; className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-primary/20",
      isPlaying && "animate-pulse-glow",
      className
    )}>
      <audio ref={audioRef} src={music.url} onEnded={() => setIsPlaying(false)} />
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full bg-primary/20 hover:bg-primary/30",
          isPlaying && "glow-purple"
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{music.title || 'Profile Song'}</p>
        {music.artist && (
          <p className="text-xs text-muted-foreground truncate">{music.artist}</p>
        )}
      </div>
      
      <Music className={cn(
        "h-5 w-5 text-primary transition-transform",
        isPlaying && "animate-bounce"
      )} />
    </div>
  );
}
