import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import NotFound from './NotFound';
import Profile from './Profile';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type, data } = decoded;

  switch (type) {
    case 'npub':
      return <Profile pubkey={data} />;

    case 'nprofile':
      return <Profile pubkey={data.pubkey} />;

    case 'note':
      // For note IDs, redirect to video page since Divine is video-focused
      return <NotFound />;

    case 'nevent':
      // Could be a video or other event
      return <NotFound />;

    case 'naddr':
      // Addressable events like articles or videos
      return <NotFound />;

    default:
      return <NotFound />;
  }
}
