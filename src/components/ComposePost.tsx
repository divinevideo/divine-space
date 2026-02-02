import { useState, useRef } from 'react';
import { usePostNote } from '@/hooks/usePostNote';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthor } from '@/hooks/useAuthor';
import { Send, Loader2, Image, AtSign, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposePostProps {
  className?: string;
  placeholder?: string;
  onSuccess?: () => void;
  replyTo?: {
    id: string;
    pubkey: string;
    rootId?: string;
    rootPubkey?: string;
  };
  quotedEvent?: {
    id: string;
    pubkey: string;
  };
  compact?: boolean;
}

export function ComposePost({
  className,
  placeholder = "What's on your mind?",
  onSuccess,
  replyTo,
  quotedEvent,
  compact = false,
}: ComposePostProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { pubkey, isAuthenticated } = useAuth();
  const { data: author } = useAuthor(pubkey ?? undefined);
  const { mutate: postNote, isPending } = usePostNote();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({ title: 'Please write something first', variant: 'destructive' });
      return;
    }

    postNote(
      { content, replyTo, quotedEvent },
      {
        onSuccess: () => {
          setContent('');
          toast({ title: 'Posted!' });
          onSuccess?.();
        },
        onError: (error) => {
          toast({
            title: 'Failed to post',
            description: error.message,
            variant: 'destructive'
          });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const profile = author?.metadata;
  const charCount = content.length;
  const isOverLimit = charCount > 280;
  const showCharCount = charCount > 200;

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-3 items-start", className)}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={profile?.picture} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {(profile?.name || 'A')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[38px] max-h-[120px] resize-none py-2"
            disabled={isPending}
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !content.trim()}
            className="flex-shrink-0"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Card className={cn("myspace-card", className)}>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={profile?.picture} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {(profile?.name || 'A')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className={cn(
                  "min-h-[80px] resize-none transition-all",
                  isFocused && "min-h-[120px]"
                )}
                disabled={isPending}
              />

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="Add image (coming soon)"
                    disabled
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="Mention someone"
                    onClick={() => {
                      setContent(prev => prev + '@');
                      textareaRef.current?.focus();
                    }}
                  >
                    <AtSign className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="Add hashtag"
                    onClick={() => {
                      setContent(prev => prev + '#');
                      textareaRef.current?.focus();
                    }}
                  >
                    <Hash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  {showCharCount && (
                    <span className={cn(
                      "text-xs",
                      isOverLimit ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {charCount}/280
                    </span>
                  )}
                  <Button
                    type="submit"
                    disabled={isPending || !content.trim() || isOverLimit}
                    className="gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to post
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
