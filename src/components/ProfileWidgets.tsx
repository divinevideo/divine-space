import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Smile, 
  Quote, 
  Eye, 
  Sparkles,
  Clock,
  Calendar,
  Heart,
  Wand2,
  Palette,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { type PresetStyle, getPresetStyleInfo } from '@/hooks/useMySpaceProfile';

// Mood emojis for selection
export const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🎉', label: 'Excited' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🔥', label: 'On Fire' },
  { emoji: '💀', label: 'Dead' },
  { emoji: '✨', label: 'Magical' },
  { emoji: '🌙', label: 'Dreamy' },
  { emoji: '☕', label: 'Caffeinated' },
  { emoji: '🎵', label: 'Musical' },
  { emoji: '💭', label: 'Contemplative' },
  { emoji: '🤘', label: 'Rocking' },
  { emoji: '🎨', label: 'Creative' },
  { emoji: '💡', label: 'Inspired' },
  { emoji: '🚀', label: 'Productive' },
  { emoji: '🌈', label: 'Hopeful' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '📚', label: 'Learning' },
  { emoji: '💪', label: 'Motivated' },
  { emoji: '🧘', label: 'Zen' },
];

interface MoodWidgetProps {
  mood?: { text: string; emoji?: string };
  className?: string;
}

export function MoodWidget({ mood, className }: MoodWidgetProps) {
  if (!mood) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20",
      className
    )}>
      <Smile className="h-4 w-4 text-yellow-500 flex-shrink-0" />
      <span className="text-sm">
        <span className="text-muted-foreground">Current Mood:</span>{' '}
        <span className="font-medium">{mood.emoji} {mood.text}</span>
      </span>
    </div>
  );
}

interface StatusWidgetProps {
  status?: string;
  className?: string;
}

export function StatusWidget({ status, className }: StatusWidgetProps) {
  if (!status) return null;

  return (
    <div className={cn(
      "px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20",
      className
    )}>
      <p className="text-sm italic text-muted-foreground">
        "{status}"
      </p>
    </div>
  );
}

interface QuoteWidgetProps {
  quote?: string;
  className?: string;
}

export function QuoteWidget({ quote, className }: QuoteWidgetProps) {
  if (!quote) return null;

  return (
    <Card className={cn("myspace-card", className)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Quote className="h-6 w-6 text-pink-500 flex-shrink-0 rotate-180" />
          <div>
            <p className="text-sm italic leading-relaxed">{quote}</p>
            <Quote className="h-4 w-4 text-pink-500 ml-auto mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface VisitorCounterProps {
  count: number;
  className?: string;
}

export function VisitorCounter({ count, className }: VisitorCounterProps) {
  const [displayCount, setDisplayCount] = useState(0);

  // Animate counter on mount
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = count / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayCount(count);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [count]);

  return (
    <div className={cn(
      "text-center p-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-primary/20",
      className
    )}>
      <div className="flex items-center justify-center gap-2 mb-1">
        <Eye className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Profile Views</span>
      </div>
      <div className="font-mono text-2xl font-bold gradient-text">
        {displayCount.toLocaleString()}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        You are visitor #{displayCount.toLocaleString()}!
      </p>
    </div>
  );
}

interface LastOnlineProps {
  timestamp?: number;
  isOnline?: boolean;
  className?: string;
}

export function LastOnlineWidget({ timestamp, isOnline, className }: LastOnlineProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm",
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
      )} />
      {isOnline ? (
        <span className="text-green-500 font-medium">Online Now</span>
      ) : timestamp ? (
        <span className="text-muted-foreground">
          Last seen {formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true })}
        </span>
      ) : (
        <span className="text-muted-foreground">Offline</span>
      )}
    </div>
  );
}

interface ProfileBlingsProps {
  className?: string;
}

// Fun sparkly decorations
export function ProfileBlings({ className }: ProfileBlingsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-2", className)}>
      {['✦', '★', '♡', '✧', '♡', '★', '✦'].map((char, i) => (
        <span
          key={i}
          className={cn(
            "text-primary animate-pulse",
            i % 2 === 0 ? "text-pink-500" : "text-cyan-500"
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

// Marquee scrolling text (classic MySpace!)
interface MarqueeTextProps {
  text: string;
  className?: string;
}

export function MarqueeText({ text, className }: MarqueeTextProps) {
  return (
    <div className={cn("overflow-hidden whitespace-nowrap", className)}>
      <div className="inline-block animate-marquee">
        <span className="px-4">{text}</span>
        <span className="px-4">{text}</span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Profile Interests Section
interface InterestsSectionProps {
  interests?: {
    music?: string[];
    movies?: string[];
    books?: string[];
    heroes?: string[];
  };
  className?: string;
}

export function InterestsSection({ interests, className }: InterestsSectionProps) {
  if (!interests) return null;

  const sections = [
    { key: 'music', label: 'Music', icon: '🎵', items: interests.music },
    { key: 'movies', label: 'Movies', icon: '🎬', items: interests.movies },
    { key: 'books', label: 'Books', icon: '📚', items: interests.books },
    { key: 'heroes', label: 'Heroes', icon: '⭐', items: interests.heroes },
  ].filter(s => s.items && s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <Card className={cn("myspace-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-pink-500" />
          <span className="gradient-text">Interests</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sections.map((section) => (
          <div key={section.key}>
            <p className="text-sm font-medium mb-1">
              {section.icon} {section.label}
            </p>
            <div className="flex flex-wrap gap-1">
              {section.items?.map((item, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// About Me Section with rich formatting support
interface AboutMeSectionProps {
  about?: string;
  whoIdLikeToMeet?: string;
  className?: string;
}

export function AboutMeSection({ about, whoIdLikeToMeet, className }: AboutMeSectionProps) {
  if (!about && !whoIdLikeToMeet) return null;

  return (
    <Card className={cn("myspace-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <span className="gradient-text">About Me</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {about && (
          <div>
            <p className="text-sm whitespace-pre-wrap">{about}</p>
          </div>
        )}
        {whoIdLikeToMeet && (
          <div>
            <p className="text-sm font-medium mb-1 text-primary">Who I'd Like to Meet:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {whoIdLikeToMeet}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========================================
// Preset Profile Components
// ========================================

interface PresetBadgeProps {
  style: PresetStyle;
  className?: string;
}

export function PresetBadge({ style, className }: PresetBadgeProps) {
  const info = getPresetStyleInfo(style);
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "gap-1.5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
        "bg-background/80 border border-primary/30",
        "animate-pulse-glow",
        className
      )}
    >
      <span className="text-base">{info.emoji}</span>
      <span className="gradient-text">{info.name}</span>
    </Badge>
  );
}

interface ClaimProfileBannerProps {
  presetStyle?: PresetStyle;
  className?: string;
}

export function ClaimProfileBanner({ presetStyle, className }: ClaimProfileBannerProps) {
  const info = presetStyle ? getPresetStyleInfo(presetStyle) : null;
  
  return (
    <div className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20",
      "border-b border-primary/30",
      className
    )}>
      {/* Animated background */}
      <div className="absolute inset-0 animated-gradient opacity-30" />
      
      <div className="relative container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center animate-float">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="gradient-text">Make this profile yours!</span>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </h3>
              <p className="text-sm text-muted-foreground">
                {info ? (
                  <>Your preset style is <span className="font-medium text-primary">{info.emoji} {info.name}</span> - customize it to make it truly yours!</>
                ) : (
                  <>Customize your profile with themes, music, Top 8 friends & more!</>
                )}
              </p>
            </div>
          </div>
          
          <Link to="/settings/myspace">
            <Button className="gap-2 glow-purple group">
              <Palette className="h-4 w-4" />
              <span>Customize Now</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Decorative sparkles */}
      <div className="absolute top-2 left-[10%] text-yellow-500 animate-pulse">✦</div>
      <div className="absolute bottom-2 right-[15%] text-pink-500 animate-pulse" style={{ animationDelay: '0.5s' }}>★</div>
      <div className="absolute top-3 right-[30%] text-cyan-500 animate-pulse" style={{ animationDelay: '0.3s' }}>✧</div>
    </div>
  );
}

// Preset Music Suggestion Card (for unclaimed profiles)
interface MusicSuggestionProps {
  suggestion?: { title: string; artist: string; genre: string };
  className?: string;
}

export function MusicSuggestion({ suggestion, className }: MusicSuggestionProps) {
  if (!suggestion) return null;
  
  return (
    <Card className={cn("myspace-card", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Star className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              SUGGESTED VIBE
            </p>
            <p className="font-semibold truncate text-sm">{suggestion.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {suggestion.artist} • {suggestion.genre}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Themed decoration divider
interface ThemedDividerProps {
  style?: PresetStyle;
  className?: string;
}

export function ThemedDivider({ style, className }: ThemedDividerProps) {
  const symbols = style === 'scene-kid' 
    ? ['☆', '♥', '★', '♥', '☆']
    : style === 'kawaii-star'
    ? ['✧', '♡', '⭐', '♡', '✧']
    : style === 'dark-romantic'
    ? ['🥀', '✦', '🖤', '✦', '🥀']
    : style === 'y2k-princess'
    ? ['🦋', '✿', '💫', '✿', '🦋']
    : style === 'cyber-punk'
    ? ['◆', '▸', '◈', '◂', '◆']
    : style === 'cosmic-dreamer'
    ? ['✦', '☆', '🌙', '☆', '✦']
    : ['✦', '★', '♡', '★', '✦'];

  return (
    <div className={cn("flex items-center justify-center gap-2 py-2 text-sm", className)}>
      {symbols.map((char, i) => (
        <span
          key={i}
          className={cn(
            "animate-pulse",
            i % 2 === 0 ? "text-pink-500" : "text-cyan-500"
          )}
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

// Random MySpace-style "Thanks for visiting!" messages
export function VisitorMessage({ className }: { className?: string }) {
  const messages = [
    "Thanks 4 stopping by! ♥",
    "Thanks for the add! xoxo",
    "~*~ Welcome to my space ~*~",
    "Leave some love! ♡",
    "PC4PC? Sign my guestbook!",
    "★ You're visitor #random! ★",
    "Thanks for being here! ✨",
    "Welcome, friend! 🌟",
  ];
  
  const [message] = useState(() => messages[Math.floor(Math.random() * messages.length)]);
  
  return (
    <div className={cn(
      "text-center py-2 px-4 rounded-lg",
      "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10",
      "border border-primary/20",
      "text-sm font-medium gradient-text",
      className
    )}>
      {message}
    </div>
  );
}
