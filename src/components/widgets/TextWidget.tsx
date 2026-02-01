/**
 * TextWidget - Bento grid widget for displaying custom text content.
 *
 * Displays custom text content with optional markdown rendering and alignment options.
 * Supports editing mode for customization in the bento grid editor.
 */

import { useState } from 'react';
import { Type, Pencil, Check, X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { WidgetProps, TextWidgetConfig } from '@/types/widgets';

/**
 * Props for the TextWidget component.
 */
export interface TextWidgetProps extends WidgetProps {
  /** Callback when content is updated (editing mode) */
  onContentChange?: (content: string, align: 'left' | 'center' | 'right') => void;
}

/**
 * Simple markdown renderer for basic formatting.
 * Supports bold, italic, and links.
 */
function renderMarkdown(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match bold **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      elements.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Match italic *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      elements.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Match links [text](url)
    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      elements.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // No match, add the next character as plain text
    // Find next special character or end of string
    const nextSpecial = remaining.search(/\*|\[/);
    if (nextSpecial === -1) {
      elements.push(<span key={key++}>{remaining}</span>);
      break;
    } else if (nextSpecial === 0) {
      // Special char at start but no match - treat as plain text
      elements.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    } else {
      elements.push(<span key={key++}>{remaining.slice(0, nextSpecial)}</span>);
      remaining = remaining.slice(nextSpecial);
    }
  }

  return elements;
}

/**
 * TextWidget displays custom text content with markdown support.
 *
 * Features:
 * - Shows text content with optional markdown rendering
 * - Supports text alignment (left, center, right)
 * - Supports editing mode with textarea and alignment options
 * - Adapts styling based on widget size
 */
export function TextWidget({
  widget,
  isEditing,
  onContentChange,
}: TextWidgetProps) {
  const config = widget.config as TextWidgetConfig | undefined;
  const [isEditingText, setIsEditingText] = useState(false);
  const [editContent, setEditContent] = useState(config?.content || '');
  const [editAlign, setEditAlign] = useState<'left' | 'center' | 'right'>(config?.align || 'left');

  const content = config?.content || '';
  const align = config?.align || 'left';

  const handleSave = () => {
    if (onContentChange) {
      onContentChange(editContent, editAlign);
    }
    setIsEditingText(false);
  };

  const handleCancel = () => {
    setEditContent(config?.content || '');
    setEditAlign(config?.align || 'left');
    setIsEditingText(false);
  };

  const handleOpenEdit = () => {
    if (isEditing) {
      setEditContent(config?.content || '');
      setEditAlign(config?.align || 'left');
      setIsEditingText(true);
    }
  };

  // Alignment classes
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Edit mode view
  if (isEditing && isEditingText) {
    return (
      <Card className="myspace-card h-full overflow-hidden">
        <CardContent className="p-3 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Edit Text</span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
                <Check className="h-3 w-3 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Alignment options */}
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              className={cn(
                "p-1.5 rounded hover:bg-muted/50 transition-colors",
                editAlign === 'left' && "bg-primary/20 ring-1 ring-primary"
              )}
              onClick={() => setEditAlign('left')}
              title="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "p-1.5 rounded hover:bg-muted/50 transition-colors",
                editAlign === 'center' && "bg-primary/20 ring-1 ring-primary"
              )}
              onClick={() => setEditAlign('center')}
              title="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "p-1.5 rounded hover:bg-muted/50 transition-colors",
                editAlign === 'right' && "bg-primary/20 ring-1 ring-primary"
              )}
              onClick={() => setEditAlign('right')}
              title="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          {/* Text input */}
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Enter your text..."
            className="flex-1 text-sm resize-none"
          />
        </CardContent>
      </Card>
    );
  }

  // Display mode view - no content set
  if (!content) {
    return (
      <Card
        className={cn(
          "myspace-card h-full overflow-hidden",
          "bg-gradient-to-br from-blue-500/5 to-purple-500/5",
          "border-dashed border-blue-500/30",
          isEditing && "cursor-pointer hover:border-blue-500/50"
        )}
        onClick={handleOpenEdit}
      >
        <CardContent className="p-3 h-full flex flex-col items-center justify-center">
          <Type className="h-6 w-6 text-blue-500/50 mb-1" />
          <span className="text-xs text-muted-foreground text-center">
            {isEditing ? "Click to add text" : "No content"}
          </span>
        </CardContent>
      </Card>
    );
  }

  // Display mode view - content is set
  return (
    <Card
      className={cn(
        "myspace-card h-full overflow-hidden",
        isEditing && "cursor-pointer hover:border-primary/40"
      )}
      onClick={handleOpenEdit}
    >
      <CardContent className="p-3 h-full flex flex-col">
        {/* Edit indicator */}
        {isEditing && (
          <div className="flex justify-end mb-1">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </div>
        )}

        {/* Text content */}
        <div className={cn("text-content flex-1 overflow-auto text-sm", alignClass[align])}>
          {renderMarkdown(content)}
        </div>
      </CardContent>
    </Card>
  );
}

export default TextWidget;
