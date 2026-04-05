import { Bookmark, Loader2, MessageCircle, UserMinus, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useIsFollowing, useToggleFollow } from '@/hooks/useDivineSocial';
import { usePageSave } from '@/hooks/usePageSave';
import type { PageDocument } from '@/types/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface PublicPageActionsProps {
  page: PageDocument;
  pubkey: string;
}

export function PublicPageActions({ page, pubkey }: PublicPageActionsProps) {
  const navigate = useNavigate();
  const { pubkey: currentUserPubkey, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: isFollowing = false, isLoading: followingLoading } = useIsFollowing(pubkey);
  const { mutate: toggleFollow, isPending: followPending } = useToggleFollow();
  const { isSaved, isLoading: saveLoading, toggleSave } = usePageSave(pubkey, page.identifier);

  if (currentUserPubkey === pubkey) {
    return null;
  }

  const requireAuth = (action: string) => {
    toast({
      title: `Please log in to ${action}`,
      variant: 'destructive',
    });
  };

  const handleFollow = () => {
    if (!isAuthenticated) {
      requireAuth('follow creators');
      return;
    }

    toggleFollow({
      targetPubkey: pubkey,
      isCurrentlyFollowing: isFollowing,
    });
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      requireAuth('save pages');
      return;
    }

    toggleSave.mutate();
  };

  const handleMessage = () => {
    if (!isAuthenticated) {
      requireAuth('message creators');
      return;
    }

    navigate(`/messages?with=${pubkey}`);
  };

  return (
    <Card className="border-border/60 bg-card/90 backdrop-blur" data-testid="public-page-actions">
      <CardContent className="space-y-2 p-4">
        <Button
          type="button"
          variant={isFollowing ? 'secondary' : 'default'}
          className="w-full justify-start gap-2"
          onClick={handleFollow}
          disabled={followPending || followingLoading}
        >
          {followPending || followingLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFollowing ? (
            <UserMinus className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isFollowing ? 'Following' : 'Follow'}
        </Button>

        <Button
          type="button"
          variant={isSaved ? 'secondary' : 'outline'}
          className="w-full justify-start gap-2"
          onClick={handleSave}
          disabled={toggleSave.isPending || saveLoading}
        >
          {toggleSave.isPending || saveLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {isSaved ? 'Saved' : 'Save Page'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleMessage}
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </Button>
      </CardContent>
    </Card>
  );
}

export default PublicPageActions;
