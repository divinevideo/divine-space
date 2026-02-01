import { useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Link as LinkIcon,
  Github,
  Twitter,
  Youtube,
  Instagram,
  Linkedin,
  Globe,
  Music,
  Camera,
  Mail,
  MessageCircle,
  ExternalLink,
  Plus,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetProps } from '@/types/widgets';

/**
 * Profile link structure as defined in DATA-MODEL.md
 * Stored in Kind 30003 (NIP-51 Bookmark Set)
 */
export interface ProfileLink {
  url: string;
  label: string;
}

/**
 * Configuration options for the LinksWidget
 */
export interface LinksWidgetConfig {
  /** Maximum number of links to display (default: unlimited) */
  maxLinks?: number;
  /** Whether to show link icons (default: true) */
  showIcons?: boolean;
  /** Whether to show the widget title (default: true) */
  showTitle?: boolean;
  /** Custom title for the widget */
  title?: string;
}

/**
 * Get the appropriate icon for a link based on its URL
 */
export function getLinkIcon(url: string): React.ComponentType<{ className?: string }> {
  const urlLower = url.toLowerCase();

  // Check more specific domains first before generic patterns
  if (urlLower.includes('github.com')) return Github;
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return Youtube;
  if (urlLower.includes('instagram.com')) return Instagram;
  if (urlLower.includes('linkedin.com')) return Linkedin;
  if (urlLower.includes('spotify.com') || urlLower.includes('soundcloud.com') || urlLower.includes('music.')) return Music;
  // Photography sites before Twitter to avoid 500px.com matching x.com
  if (urlLower.includes('flickr.com') || urlLower.includes('500px.com') || urlLower.includes('unsplash.com')) return Camera;
  // Messaging platforms
  if (urlLower.includes('discord.') || urlLower.includes('telegram.') || urlLower.includes('signal.')) return MessageCircle;
  // Twitter/X after photography to avoid false positives
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return Twitter;
  if (urlLower.startsWith('mailto:')) return Mail;

  return Globe;
}

/**
 * Parse links from Kind 30003 event tags
 */
export function parseLinksFromTags(tags: string[][]): ProfileLink[] {
  const links: ProfileLink[] = [];

  for (const tag of tags) {
    if (tag[0] === 'r' && tag[1]) {
      links.push({
        url: tag[1],
        label: tag[2] || extractLabelFromUrl(tag[1]),
      });
    }
  }

  return links;
}

/**
 * Extract a reasonable label from a URL
 */
function extractLabelFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove www. and get the domain
    const domain = parsed.hostname.replace(/^www\./, '');
    // Capitalize first letter
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Link';
  }
}

/**
 * Hook to fetch profile links from Nostr (Kind 30003)
 */
export function useProfileLinks(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['profile-links', pubkey],
    queryFn: async (): Promise<ProfileLink[]> => {
      if (!pubkey) return [];

      const events = await nostr.query([
        {
          kinds: [30003],
          authors: [pubkey],
          '#d': ['links'],
          limit: 1,
        },
      ]);

      if (events.length === 0) return [];

      return parseLinksFromTags(events[0].tags);
    },
    enabled: !!pubkey,
  });
}

/**
 * Individual link item component
 */
interface LinkItemProps {
  link: ProfileLink;
  showIcon?: boolean;
  compact?: boolean;
}

function LinkItem({ link, showIcon = true, compact = false }: LinkItemProps) {
  const Icon = getLinkIcon(link.url);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-2 rounded-md transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        compact ? "px-2 py-1.5" : "px-3 py-2"
      )}
    >
      {showIcon && (
        <Icon className={cn(
          "flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors",
          compact ? "h-3.5 w-3.5" : "h-4 w-4"
        )} />
      )}
      <span className={cn(
        "flex-1 truncate",
        compact ? "text-xs" : "text-sm"
      )}>
        {link.label}
      </span>
      <ExternalLink className={cn(
        "flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity",
        compact ? "h-3 w-3" : "h-3.5 w-3.5"
      )} />
    </a>
  );
}

/**
 * Empty state component for when there are no links
 */
interface EmptyStateProps {
  isEditing: boolean;
}

function EmptyState({ isEditing }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
      <LinkIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground">
        {isEditing ? 'Add some links to your profile' : 'No links yet'}
      </p>
      {isEditing && (
        <Button variant="outline" size="sm" className="mt-3 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Link
        </Button>
      )}
    </div>
  );
}

/**
 * LinksWidget Component
 *
 * Displays a list of profile links in the bento grid layout.
 * Adapts to widget size by showing more or fewer links.
 * Supports editing mode for profile owners.
 */
export function LinksWidget({ widget, pubkey, isEditing }: WidgetProps) {
  const { data: links, isLoading } = useProfileLinks(pubkey);
  const config = widget.config as LinksWidgetConfig | undefined;

  // Calculate how many links to show based on widget size
  const maxLinks = useMemo(() => {
    if (config?.maxLinks) return config.maxLinks;

    // Approximate links per row height
    const linksPerUnit = widget.w >= 2 ? 3 : 4;
    return widget.h * linksPerUnit;
  }, [widget.w, widget.h, config?.maxLinks]);

  const displayLinks = useMemo(() => {
    if (!links) return [];
    return links.slice(0, maxLinks);
  }, [links, maxLinks]);

  const hasMoreLinks = links && links.length > maxLinks;
  const showIcons = config?.showIcons !== false;
  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'Links';

  // Determine if we should use compact mode based on widget size
  const isCompact = widget.h === 1 || (widget.w === 1 && widget.h <= 2);

  return (
    <Card className={cn(
      "h-full flex flex-col overflow-hidden",
      isEditing && "ring-2 ring-primary/50"
    )}>
      {showTitle && (
        <CardHeader className={cn(
          "flex-shrink-0 flex flex-row items-center justify-between",
          isCompact ? "p-2 pb-1" : "p-4 pb-2"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isCompact ? "text-sm" : "text-base"
          )}>
            <LinkIcon className={cn(
              "text-primary",
              isCompact ? "h-3.5 w-3.5" : "h-4 w-4"
            )} />
            <span className="gradient-text">{title}</span>
          </CardTitle>
          {isEditing && (
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
      )}

      <CardContent className={cn(
        "flex-1 min-h-0",
        showTitle ? (isCompact ? "p-2 pt-0" : "p-4 pt-0") : (isCompact ? "p-2" : "p-4")
      )}>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: Math.min(3, maxLinks) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "animate-pulse bg-muted rounded-md",
                  isCompact ? "h-6" : "h-8"
                )}
              />
            ))}
          </div>
        ) : !displayLinks.length ? (
          <EmptyState isEditing={isEditing} />
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-0.5">
              {displayLinks.map((link, index) => (
                <LinkItem
                  key={`${link.url}-${index}`}
                  link={link}
                  showIcon={showIcons}
                  compact={isCompact}
                />
              ))}
              {hasMoreLinks && (
                <div className={cn(
                  "text-center text-muted-foreground",
                  isCompact ? "text-xs pt-1" : "text-sm pt-2"
                )}>
                  +{links!.length - maxLinks} more
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default LinksWidget;
