import { useState } from 'react';
import { useReactToNote, useRepostNote, useDeleteNote } from '@/hooks/usePostNote';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart, Repeat2, MessageCircle, MoreHorizontal, Trash2, Share, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';

interface PostActionsProps {
  post: NostrEvent;
  onReply?: () => void;
  className?: string;
  compact?: boolean;
}

export function PostActions({ post, onReply, className, compact = false }: PostActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const { pubkey, isAuthenticated } = useAuth();
  const { mutate: reactToNote, isPending: isReacting } = useReactToNote();
  const { mutate: repostNote, isPending: isReposting } = useRepostNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
  const { toast } = useToast();

  const isOwnPost = pubkey === post.pubkey;

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please log in to like posts', variant: 'destructive' });
      return;
    }

    reactToNote(
      { noteId: post.id, notePubkey: post.pubkey, reaction: '+' },
      {
        onSuccess: () => {
          setIsLiked(true);
          toast({ title: 'Liked!' });
        },
        onError: (error) => {
          toast({ title: 'Failed to like', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleRepost = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please log in to repost', variant: 'destructive' });
      return;
    }

    repostNote(
      { noteId: post.id, notePubkey: post.pubkey, noteContent: post.content },
      {
        onSuccess: () => {
          toast({ title: 'Reposted!' });
        },
        onError: (error) => {
          toast({ title: 'Failed to repost', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteNote(
      { noteId: post.id },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          toast({ title: 'Post deleted' });
        },
        onError: (error) => {
          toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleShare = async () => {
    const noteUrl = `https://njump.me/${post.id}`;
    try {
      await navigator.clipboard.writeText(noteUrl);
      toast({ title: 'Link copied to clipboard!' });
    } catch {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const buttonSize = compact ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <>
      <div className={cn("flex items-center gap-1", className)}>
        {/* Reply */}
        {onReply && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(buttonSize, "text-muted-foreground hover:text-primary hover:bg-primary/10")}
            onClick={onReply}
            title="Reply"
          >
            <MessageCircle className={iconSize} />
          </Button>
        )}

        {/* Repost */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(buttonSize, "text-muted-foreground hover:text-green-500 hover:bg-green-500/10")}
          onClick={handleRepost}
          disabled={isReposting}
          title="Repost"
        >
          {isReposting ? (
            <Loader2 className={cn(iconSize, "animate-spin")} />
          ) : (
            <Repeat2 className={iconSize} />
          )}
        </Button>

        {/* Like */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            buttonSize,
            "hover:text-pink-500 hover:bg-pink-500/10",
            isLiked ? "text-pink-500" : "text-muted-foreground"
          )}
          onClick={handleLike}
          disabled={isReacting || isLiked}
          title="Like"
        >
          {isReacting ? (
            <Loader2 className={cn(iconSize, "animate-spin")} />
          ) : (
            <Heart className={cn(iconSize, isLiked && "fill-current")} />
          )}
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(buttonSize, "text-muted-foreground hover:text-primary hover:bg-primary/10")}
          onClick={handleShare}
          title="Share"
        >
          <Share className={iconSize} />
        </Button>

        {/* More options (delete for own posts) */}
        {isOwnPost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(buttonSize, "text-muted-foreground hover:text-primary")}
              >
                <MoreHorizontal className={iconSize} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The post will be marked for deletion on relays.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
