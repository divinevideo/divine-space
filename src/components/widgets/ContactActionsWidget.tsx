import { Link } from 'react-router-dom';
import type { Widget } from '@/types/widgets';
import { useAuth } from '@/hooks/useAuth';
import { useIsFollowing, useToggleFollow } from '@/hooks/useDivineSocial';

interface ContactActionsWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function ContactActionsWidget({ pubkey }: ContactActionsWidgetProps) {
  const { pubkey: currentUserPubkey, isAuthenticated } = useAuth();
  const isOwnProfile = currentUserPubkey === pubkey;
  const { data: isFollowing } = useIsFollowing(pubkey);
  const { mutate: toggleFollow } = useToggleFollow();

  const disabled = !isAuthenticated || isOwnProfile;

  const rowClass =
    'block w-full text-left text-sm text-primary hover:underline underline-offset-4 disabled:text-muted-foreground disabled:no-underline disabled:cursor-default';

  return (
    <div className="h-full w-full overflow-auto border border-border bg-card p-3 space-y-1">
      <Link to="/messages" className={rowClass}>
        ✉ message
      </Link>
      <button
        className={rowClass}
        disabled={disabled}
        onClick={() =>
          toggleFollow({ targetPubkey: pubkey, isCurrentlyFollowing: !!isFollowing })
        }
      >
        ➕ {isFollowing ? 'remove from friends' : 'add to friends'}
      </button>
      <button className={rowClass} disabled={disabled}>
        ⭐ add to favorites
      </button>
      <button className={rowClass} disabled={disabled}>
        🚩 block user
      </button>
    </div>
  );
}

export default ContactActionsWidget;
