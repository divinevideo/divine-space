import { useState, useEffect } from 'react';
import { Plus, X, Wifi, Settings } from 'lucide-react';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/hooks/useAuth';
import { useKeycastPublish } from '@/hooks/useKeycastPublish';
import { useToast } from '@/hooks/useToast';
import { queryStrict } from '@/lib/relayRead';
import { latestEvent, nextCreatedAt } from '@/lib/replaceableEvent';
import { applyLocalRelayEdit, parseRelayListTags, relayListTags, type RelayListRelay } from '@/lib/relayList';

const RELAY_LIST_KIND = 10002;
const RELAY_LIST_READ_TIMEOUT_MS = 5000;

type Relay = RelayListRelay;

export function RelayListManager() {
  const { config, updateConfig } = useAppContext();
  const { nostr } = useNostr();
  const { isAuthenticated, pubkey } = useAuth();
  const { mutateAsync: publishEvent } = useKeycastPublish();
  const { toast } = useToast();

  const [relays, setRelays] = useState<Relay[]>(config.relayMetadata.relays);
  const [newRelayUrl, setNewRelayUrl] = useState('');

  // Sync local state with config when it changes (e.g., from NostrProvider sync)
  useEffect(() => {
    setRelays(config.relayMetadata.relays);
  }, [config.relayMetadata.relays]);

  const normalizeRelayUrl = (url: string): string => {
    url = url.trim();
    try {
      return new URL(url).toString();
    } catch {
      try {
        return new URL(`wss://${url}`).toString();
      } catch {
        return url;
      }
    }
  };

  const isValidRelayUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;

    const normalized = normalizeRelayUrl(trimmed);
    try {
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddRelay = () => {
    if (!isValidRelayUrl(newRelayUrl)) {
      toast({
        title: 'Invalid relay URL',
        description: 'Please enter a valid relay URL (e.g., wss://relay.example.com)',
        variant: 'destructive',
      });
      return;
    }

    const normalized = normalizeRelayUrl(newRelayUrl);

    if (relays.some(r => r.url === normalized)) {
      toast({
        title: 'Relay already exists',
        description: 'This relay is already in your list.',
        variant: 'destructive',
      });
      return;
    }

    const newRelays = [...relays, { url: normalized, read: true, write: true }];
    setRelays(newRelays);
    setNewRelayUrl('');

    saveRelays(relays, newRelays);
  };

  const handleRemoveRelay = (url: string) => {
    const newRelays = relays.filter(r => r.url !== url);
    setRelays(newRelays);
    saveRelays(relays, newRelays);
  };

  const handleToggleRead = (url: string) => {
    const newRelays = relays.map(r =>
      r.url === url ? { ...r, read: !r.read } : r
    );
    setRelays(newRelays);
    saveRelays(relays, newRelays);
  };

  const handleToggleWrite = (url: string) => {
    const newRelays = relays.map(r =>
      r.url === url ? { ...r, write: !r.write } : r
    );
    setRelays(newRelays);
    saveRelays(relays, newRelays);
  };

  const saveRelays = (previousRelays: Relay[], newRelays: Relay[]) => {
    const now = Math.floor(Date.now() / 1000);

    // Update local config
    updateConfig((current) => ({
      ...current,
      relayMetadata: {
        relays: newRelays,
        updatedAt: now,
      },
    }));

    // Publish to Nostr if user is logged in
    if (isAuthenticated && pubkey) {
      publishNIP65RelayList(previousRelays, newRelays);
    }
  };

  const publishNIP65RelayList = async (previousRelays: Relay[], requestedRelays: Relay[]) => {
    try {
      const events = await queryStrict(
        nostr,
        [{ kinds: [RELAY_LIST_KIND], authors: [pubkey!], limit: 1 }],
        { timeoutMs: RELAY_LIST_READ_TIMEOUT_MS },
      );
      const existingEvent = latestEvent(events);
      const remoteRelays = existingEvent ? parseRelayListTags(existingEvent.tags) : [];
      const relayList = applyLocalRelayEdit(previousRelays, requestedRelays, remoteRelays);
      const createdAt = nextCreatedAt(existingEvent?.created_at);

      const published = await publishEvent({
        kind: RELAY_LIST_KIND,
        content: '',
        tags: relayListTags(relayList),
        created_at: createdAt,
      });

      setRelays(relayList);
      updateConfig((current) => ({
        ...current,
        relayMetadata: {
          relays: relayList,
          updatedAt: published.created_at,
        },
      }));
      toast({
        title: 'Relay list published',
        description: 'Your relay list has been published to Nostr.',
      });
    } catch (error) {
      console.error('Failed to publish relay list:', error);
      setRelays(previousRelays);
      updateConfig((current) => ({
        ...current,
        relayMetadata: {
          relays: previousRelays,
          updatedAt: config.relayMetadata.updatedAt,
        },
      }));
      toast({
        title: 'Failed to publish relay list',
        description: 'The current relay list could not be read safely. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderRelayUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'wss:') {
        if (parsed.pathname === '/') {
          return parsed.host;
        } else {
          return parsed.host + parsed.pathname;
        }
      } else {
        return parsed.href;
      }
    } catch {
      return url;
    }
  }

  return (
    <div className="space-y-4">
      {/* Relay List */}
      <div className="space-y-2">
        {relays.map((relay) => (
          <div
            key={relay.url}
            className="flex items-center gap-3 p-3 rounded-md border bg-muted/20"
          >
            <Wifi className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm flex-1 truncate" title={relay.url}>
              {renderRelayUrl(relay.url)}
            </span>

            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`read-${relay.url}`} className="text-sm cursor-pointer">
                      Read
                    </Label>
                    <Switch
                      id={`read-${relay.url}`}
                      checked={relay.read}
                      onCheckedChange={() => handleToggleRead(relay.url)}
                      className="data-[state=checked]:bg-green-500 scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`write-${relay.url}`} className="text-sm cursor-pointer">
                      Write
                    </Label>
                    <Switch
                      id={`write-${relay.url}`}
                      checked={relay.write}
                      onCheckedChange={() => handleToggleWrite(relay.url)}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveRelay(relay.url)}
              className="size-5 text-muted-foreground hover:text-destructive hover:bg-transparent shrink-0"
              disabled={relays.length <= 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Relay Form */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="new-relay-url" className="sr-only">
            Relay URL
          </Label>
          <Input
            id="new-relay-url"
            placeholder="Enter relay URL (e.g., wss://relay.example.com)"
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddRelay();
              }
            }}
          />
        </div>
        <Button
          onClick={handleAddRelay}
          disabled={!newRelayUrl.trim()}
          variant="outline"
          size="sm"
          className="h-10 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Relay
        </Button>
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground">
          Log in to sync your relay list with Nostr
        </p>
      )}
    </div>
  );
}
