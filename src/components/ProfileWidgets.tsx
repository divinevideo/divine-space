import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smile, 
  Quote, 
  Eye, 
  Sparkles,
  Clock,
  Calendar,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
