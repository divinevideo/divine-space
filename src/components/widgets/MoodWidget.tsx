/**
 * MoodWidget - Bento grid widget for displaying user mood/status.
 *
 * Displays the user's current mood emoji, text, and optional status message.
 * Supports editing mode for customization in the bento grid editor.
 */

import { useState } from 'react';
import { Smile, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { WidgetProps } from '@/types/widgets';
import { MOOD_OPTIONS } from '@/components/ProfileWidgets';

/**
 * Configuration specific to the Mood widget.
 */
export interface MoodWidgetConfig {
  /** The mood emoji */
  emoji?: string;
  /** The mood text (e.g., "Happy", "Excited") */
  moodText?: string;
  /** Optional status message */
  statusMessage?: string;
}

/**
 * Props for the MoodWidget component.
 */
export interface MoodWidgetProps extends WidgetProps {
  /** Mood data from the user's profile */
  mood?: {
    emoji?: string;
    text: string;
  };
  /** Optional status message */
  status?: string;
  /** Callback when mood is updated (editing mode) */
  onMoodChange?: (mood: { emoji: string; text: string }) => void;
  /** Callback when status is updated (editing mode) */
  onStatusChange?: (status: string) => void;
}

/**
 * MoodWidget displays the user's current mood and status message.
 *
 * Features:
 * - Shows mood emoji and text in a themed gradient card
 * - Displays optional status message below the mood
 * - Supports editing mode with emoji picker and text input
 * - Adapts styling based on widget size
 */
export function MoodWidget({
  widget,
  isEditing,
  mood,
  status,
  onMoodChange,
  onStatusChange,
}: MoodWidgetProps) {
  const [isEditingMood, setIsEditingMood] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(mood?.emoji || '');
  const [moodText, setMoodText] = useState(mood?.text || '');
  const [statusText, setStatusText] = useState(status || '');

  // Determine if this is a compact display (1x1 size)
  const isCompact = widget.w === 1 && widget.h === 1;

  const handleSaveMood = () => {
    if (onMoodChange && selectedEmoji && moodText) {
      onMoodChange({ emoji: selectedEmoji, text: moodText });
    }
    if (onStatusChange && statusText !== status) {
      onStatusChange(statusText);
    }
    setIsEditingMood(false);
  };

  const handleCancel = () => {
    setSelectedEmoji(mood?.emoji || '');
    setMoodText(mood?.text || '');
    setStatusText(status || '');
    setIsEditingMood(false);
  };

  // Edit mode view
  if (isEditing && isEditingMood) {
    return (
      <Card className="myspace-card h-full overflow-hidden">
        <CardContent className="p-3 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Edit Mood</span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveMood}>
                <Check className="h-3 w-3 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Emoji picker */}
          <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto">
            {MOOD_OPTIONS.slice(0, 12).map((option) => (
              <button
                key={option.emoji}
                type="button"
                className={cn(
                  "text-lg p-1 rounded hover:bg-muted/50 transition-colors",
                  selectedEmoji === option.emoji && "bg-primary/20 ring-1 ring-primary"
                )}
                onClick={() => {
                  setSelectedEmoji(option.emoji);
                  setMoodText(option.label);
                }}
                title={option.label}
              >
                {option.emoji}
              </button>
            ))}
          </div>

          {/* Mood text input */}
          <Input
            value={moodText}
            onChange={(e) => setMoodText(e.target.value)}
            placeholder="Mood text..."
            className="h-7 text-xs mb-2"
          />

          {/* Status message input */}
          {!isCompact && (
            <Input
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Status message..."
              className="h-7 text-xs"
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Display mode view - no mood set
  if (!mood?.text && !status) {
    return (
      <Card
        className={cn(
          "myspace-card h-full overflow-hidden",
          "bg-gradient-to-br from-yellow-500/5 to-orange-500/5",
          "border-dashed border-yellow-500/30",
          isEditing && "cursor-pointer hover:border-yellow-500/50"
        )}
        onClick={() => isEditing && setIsEditingMood(true)}
      >
        <CardContent className="p-3 h-full flex flex-col items-center justify-center">
          <Smile className="h-6 w-6 text-yellow-500/50 mb-1" />
          <span className="text-xs text-muted-foreground text-center">
            {isEditing ? "Click to set mood" : "No mood set"}
          </span>
        </CardContent>
      </Card>
    );
  }

  // Display mode view - mood is set
  return (
    <Card
      className={cn(
        "myspace-card h-full overflow-hidden",
        "bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-pink-500/10",
        "border-yellow-500/20",
        isEditing && "cursor-pointer hover:border-yellow-500/40"
      )}
      onClick={() => isEditing && setIsEditingMood(true)}
    >
      <CardContent className={cn("h-full flex flex-col", isCompact ? "p-2" : "p-3")}>
        {/* Header with icon */}
        <div className="flex items-center gap-1.5 mb-1">
          <Smile className={cn("text-yellow-500 flex-shrink-0", isCompact ? "h-3 w-3" : "h-4 w-4")} />
          <span className={cn("text-muted-foreground font-medium", isCompact ? "text-[10px]" : "text-xs")}>
            Current Mood
          </span>
          {isEditing && (
            <Pencil className="h-3 w-3 text-muted-foreground ml-auto" />
          )}
        </div>

        {/* Mood display */}
        <div className="flex-1 flex flex-col justify-center">
          <div className={cn("flex items-center gap-2", isCompact && "justify-center")}>
            {mood?.emoji && (
              <span className={cn("flex-shrink-0", isCompact ? "text-xl" : "text-2xl")}>
                {mood.emoji}
              </span>
            )}
            <span className={cn(
              "font-semibold gradient-text",
              isCompact ? "text-sm" : "text-base"
            )}>
              {mood?.text}
            </span>
          </div>

          {/* Status message - only show if not compact */}
          {!isCompact && status && (
            <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">
              "{status}"
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MoodWidget;
