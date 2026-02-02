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

// ========================================
// DiVine Space Enhanced Widgets
// ========================================

// Blinkie decoration bar
interface BlinkieBarProps {
  pattern?: string;
  colors?: readonly string[] | string[];
  className?: string;
}

export function BlinkieBar({ pattern = '★ ☆ ★ ☆ ★', colors = ['#ec4899', '#06b6d4'], className }: BlinkieBarProps) {
  const chars = pattern.split(' ');
  
  return (
    <div className={cn(
      "flex items-center justify-center gap-1 py-2 overflow-hidden",
      className
    )}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="animate-glitter text-sm"
          style={{ 
            color: colors[i % colors.length],
            animationDelay: `${i * 0.2}s`
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

// Interests/Tags cloud with DiVine styling
interface InterestsCloudProps {
  interests?: string[];
  className?: string;
  style?: PresetStyle;
}

export function InterestsCloud({ interests, className, style }: InterestsCloudProps) {
  if (!interests || interests.length === 0) return null;

  const tagStyle = style === 'scene-kid' 
    ? 'bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30'
    : style === 'kawaii-star'
    ? 'bg-pink-300/20 text-pink-400 border-pink-300/30 hover:bg-pink-300/30'
    : style === 'cyber-punk'
    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30'
    : style === 'vine-legend'
    ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
    : style === 'dark-romantic'
    ? 'bg-red-900/20 text-red-300 border-red-900/30 hover:bg-red-900/30'
    : 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30';

  return (
    <Card className={cn("myspace-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-500" />
          <span className="gradient-text">Interests</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest, i) => (
            <span
              key={i}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-default",
                tagStyle
              )}
            >
              {interest}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Vine-style video count badge
interface VideoCountBadgeProps {
  count: number;
  type?: 'videos' | 'vines' | 'shorts';
  className?: string;
}

export function VideoCountBadge({ count, type = 'videos', className }: VideoCountBadgeProps) {
  const icons = {
    videos: '🎬',
    vines: '🍃',
    shorts: '📱',
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
      "bg-gradient-to-r from-purple-500/20 to-pink-500/20",
      "border border-primary/30",
      className
    )}>
      <span>{icons[type]}</span>
      <span className="font-bold text-sm">{count}</span>
      <span className="text-xs text-muted-foreground capitalize">{type}</span>
    </div>
  );
}

// Online status indicator
interface OnlineStatusProps {
  isOnline?: boolean;
  lastSeen?: number;
  className?: string;
}

export function OnlineStatus({ isOnline, lastSeen, className }: OnlineStatusProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <div className={cn(
        "w-2.5 h-2.5 rounded-full",
        isOnline 
          ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
          : "bg-gray-500"
      )} />
      <span className={cn(
        "font-medium",
        isOnline ? "text-green-500" : "text-muted-foreground"
      )}>
        {isOnline ? 'Online Now' : lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen * 1000), { addSuffix: true })}` : 'Offline'}
      </span>
    </div>
  );
}

// Profile view counter with animation
interface ProfileViewCounterProps {
  views: number;
  className?: string;
}

export function ProfileViewCounter({ views, className }: ProfileViewCounterProps) {
  const [displayViews, setDisplayViews] = useState(0);

  useEffect(() => {
    // Animate counter on mount
    const duration = 1500;
    const steps = 40;
    const increment = views / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= views) {
        setDisplayViews(views);
        clearInterval(timer);
      } else {
        setDisplayViews(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [views]);

  return (
    <div className={cn(
      "text-center p-4 rounded-xl",
      "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10",
      "border border-primary/20",
      className
    )}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Eye className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Profile Views</span>
      </div>
      <div className="font-mono text-3xl font-bold gradient-text">
        {displayViews.toLocaleString()}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
        <Star className="h-3 w-3 text-yellow-500" />
        You're visitor #{displayViews.toLocaleString()}!
        <Star className="h-3 w-3 text-yellow-500" />
      </p>
    </div>
  );
}

// Vine-style loop indicator
export function VineLoopBadge({ className }: { className?: string }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
      "bg-green-500/20 border border-green-500/30",
      "text-green-400 text-xs font-medium",
      className
    )}>
      <span className="animate-spin-slow">🔄</span>
      <span>Loop</span>
    </div>
  );
}

// DiVine creator badge
interface CreatorBadgeProps {
  tier?: 'new' | 'rising' | 'verified' | 'legend';
  className?: string;
}

export function CreatorBadge({ tier = 'new', className }: CreatorBadgeProps) {
  const tiers = {
    new: { label: 'New Creator', emoji: '🌱', colors: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400' },
    rising: { label: 'Rising Star', emoji: '⭐', colors: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400' },
    verified: { label: 'Verified', emoji: '✓', colors: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400' },
    legend: { label: 'DiVine Legend', emoji: '👑', colors: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400' },
  };

  const { label, emoji, colors } = tiers[tier];

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
      `bg-gradient-to-r ${colors}`,
      "border text-xs font-medium",
      className
    )}>
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

// Glitter text effect
interface GlitterTextProps {
  text: string;
  className?: string;
}

export function GlitterText({ text, className }: GlitterTextProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      <span className="relative z-10">{text}</span>
      <span 
        className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-glitter blur-[1px]"
        aria-hidden
      >
        {text}
      </span>
    </span>
  );
}

// Scene kid style "about me" box
interface SceneAboutBoxProps {
  text: string;
  className?: string;
}

export function SceneAboutBox({ text, className }: SceneAboutBoxProps) {
  return (
    <Card className={cn("myspace-card overflow-hidden", className)}>
      {/* Scene kid header */}
      <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-black to-pink-500" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-pink-500">x</span>
          <span>About Me</span>
          <span className="text-pink-500">x</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{text}</p>
      </CardContent>
      {/* Decorative footer */}
      <div className="px-4 pb-3">
        <BlinkieBar pattern="x X x X x" colors={['#000000', '#ec4899']} />
      </div>
    </Card>
  );
}

// Y2K style decorative box
interface Y2KBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function Y2KBox({ children, className }: Y2KBoxProps) {
  return (
    <div className={cn(
      "relative p-4 rounded-xl overflow-hidden",
      "bg-gradient-to-br from-pink-200/20 via-purple-200/20 to-cyan-200/20",
      "border-2 border-pink-300/30",
      className
    )}>
      {/* Butterfly decorations */}
      <span className="absolute top-1 left-2 text-sm animate-bounce-gentle">🦋</span>
      <span className="absolute top-1 right-2 text-sm animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>🦋</span>
      {children}
    </div>
  );
}

// Kawaii star decoration frame
interface KawaiiFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function KawaiiFrame({ children, className }: KawaiiFrameProps) {
  return (
    <div className={cn(
      "relative p-4",
      className
    )}>
      {/* Corner stars */}
      <span className="absolute top-0 left-0 text-yellow-400 animate-glitter">✧</span>
      <span className="absolute top-0 right-0 text-pink-400 animate-glitter" style={{ animationDelay: '0.3s' }}>✧</span>
      <span className="absolute bottom-0 left-0 text-pink-400 animate-glitter" style={{ animationDelay: '0.6s' }}>✧</span>
      <span className="absolute bottom-0 right-0 text-yellow-400 animate-glitter" style={{ animationDelay: '0.9s' }}>✧</span>
      {children}
    </div>
  );
}

// Featured video slot for profile
interface FeaturedVideoSlotProps {
  videoId?: string;
  title?: string;
  thumbnail?: string;
  className?: string;
}

export function FeaturedVideoSlot({ videoId, title, thumbnail, className }: FeaturedVideoSlotProps) {
  if (!videoId) {
    return (
      <div className={cn(
        "aspect-video rounded-xl border-2 border-dashed border-border/50",
        "flex items-center justify-center",
        "bg-muted/20",
        className
      )}>
        <div className="text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Pin a video here!</p>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/video/${videoId}`} className={cn("block group", className)}>
      <div className="relative aspect-video rounded-xl overflow-hidden border border-primary/30">
        <img 
          src={thumbnail || '/placeholder-video.jpg'} 
          alt={title || 'Featured video'}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <p className="text-white text-sm font-medium truncate">{title || 'Featured Video'}</p>
        </div>
        {/* Pinned badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-1">
          <Star className="h-3 w-3" />
          Featured
        </div>
      </div>
    </Link>
  );
}
