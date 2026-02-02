import { NostrEvent } from '@nostrify/nostrify';
import { useState } from 'react';
import { NoteContent } from '@/components/NoteContent';
import { PostActions } from '@/components/PostActions';
import { usePostReplies } from '@/hooks/useUserPosts';
import { useAuthor } from '@/hooks/useAuthor';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';

interface ReplyProps {
  reply: NostrEvent;
  getDirectReplies: (parentId: string) => NostrEvent[];
  depth?: number;
}

function Reply({ reply, getDirectReplies, depth = 1 }: ReplyProps) {
  const [expanded, setExpanded] = useState(depth < 3); // Auto-expand first 3 levels
  const { data: authorData } = useAuthor(reply.pubkey);
  const author = authorData?.metadata;
  const nestedReplies = getDirectReplies(reply.id);
  const hasReplies = nestedReplies.length > 0;

  return (
    <div className={cn('border-l-2 border-muted pl-4 mt-3', depth > 2 && 'border-muted/50')}>
      <div className="flex items-start gap-2">
        <Link to={`/${nip19.npubEncode(reply.pubkey)}`}>
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={author?.picture} />
            <AvatarFallback className="text-xs">
              {(author?.name || 'A')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/${nip19.npubEncode(reply.pubkey)}`}
              className="text-sm font-medium hover:underline truncate"
            >
              {author?.display_name || author?.name || 'Anonymous'}
            </Link>
            <time
              dateTime={new Date(reply.created_at * 1000).toISOString()}
              className="text-xs text-muted-foreground flex-shrink-0"
            >
              {new Date(reply.created_at * 1000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>
          <div className="text-sm whitespace-pre-wrap break-words">
            <NoteContent event={reply} />
          </div>
          <div className="mt-1">
            <PostActions post={reply} compact />
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 mt-1 text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            {nestedReplies.length} {nestedReplies.length === 1 ? 'reply' : 'replies'}
          </Button>
          {expanded && nestedReplies.map((nestedReply) => (
            <Reply
              key={nestedReply.id}
              reply={nestedReply}
              getDirectReplies={getDirectReplies}
              depth={depth + 1}
            />
          ))}
        </>
      )}
    </div>
  );
}

interface ThreadedPostProps {
  post: NostrEvent;
  className?: string;
}

export function ThreadedPost({ post, className }: ThreadedPostProps) {
  const [showReplies, setShowReplies] = useState(false);
  const { data: repliesData, isLoading: repliesLoading } = usePostReplies(
    showReplies ? post.id : undefined
  );

  const replyCount = repliesData?.replyCount ?? 0;
  const directReplies = repliesData?.directReplies ?? [];
  const getDirectReplies = repliesData?.getDirectReplies ?? (() => []);

  return (
    <Card className={cn('myspace-card hover:shadow-md transition-shadow', className)}>
      <CardContent className="py-4">
        {/* Main post content */}
        <div className="whitespace-pre-wrap break-words text-sm">
          <NoteContent event={post} />
        </div>

        {/* Post footer */}
        <div className="flex items-center justify-between mt-3">
          <time
            dateTime={new Date(post.created_at * 1000).toISOString()}
            className="text-xs text-muted-foreground"
          >
            {new Date(post.created_at * 1000).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </time>
          <PostActions post={post} compact />
        </div>

        {/* Replies section */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowReplies(!showReplies)}
          >
            {repliesLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <MessageCircle className="h-3 w-3 mr-1" />
            )}
            {showReplies ? 'Hide' : 'Show'} replies
            {replyCount > 0 && ` (${replyCount})`}
          </Button>

          {/* Replies list */}
          {showReplies && !repliesLoading && directReplies.length > 0 && (
            <div className="mt-2">
              {directReplies.map((reply) => (
                <Reply
                  key={reply.id}
                  reply={reply}
                  getDirectReplies={getDirectReplies}
                />
              ))}
            </div>
          )}

          {showReplies && !repliesLoading && directReplies.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 ml-2">
              No replies yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
