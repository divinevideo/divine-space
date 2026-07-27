import type { Widget } from '@/types/widgets';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';

interface ExtendedNetworkWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function ExtendedNetworkWidget({ pubkey }: ExtendedNetworkWidgetProps) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const name = metadata?.display_name || metadata?.name || genUserName(pubkey);

  return (
    <div className="h-full w-full overflow-hidden border border-border bg-card">
      <div className="bg-primary text-primary-foreground text-sm px-3 py-1">
        {name} is in your extended network
      </div>
      <div className="flex gap-3 p-3">
        <div className="w-24 shrink-0">
          <div className="aspect-square overflow-hidden border border-border bg-muted">
            {metadata?.picture ? (
              <img src={metadata.picture} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                {name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-xs mt-1 text-primary">view my: pics | vids</div>
        </div>
        <div className="min-w-0 text-sm">
          <div className="font-bold text-base">{name}</div>
          <div className="text-green-600 dark:text-green-400 text-xs">● online now!</div>
          {metadata?.nip05 && (
            <div className="text-muted-foreground text-xs mt-1 truncate">{metadata.nip05}</div>
          )}
          {metadata?.website && (
            <a
              href={metadata.website}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary text-xs mt-1 hover:underline truncate"
            >
              {metadata.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExtendedNetworkWidget;
