/**
 * EmbedWidget - Bento grid widget for embedding external content.
 *
 * Embeds content from external URLs (YouTube, Vimeo, etc.) using iframes.
 * Includes URL sanitization for security.
 */

import { Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { WidgetProps, EmbedWidgetConfig } from '@/types/widgets';

/**
 * Props for the EmbedWidget component.
 */
export interface EmbedWidgetProps extends WidgetProps {
  /** Configuration for the embed */
  config?: EmbedWidgetConfig;
}

/**
 * Sanitizes a URL for security.
 * Only allows http: and https: protocols.
 * Returns null for invalid URLs.
 */
function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return null;
  }

  // Block dangerous protocols
  const lowerUrl = trimmedUrl.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:') ||
    lowerUrl.startsWith('file:')
  ) {
    return null;
  }

  // Only allow http and https
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    return null;
  }

  return trimmedUrl;
}

/**
 * Converts a YouTube URL to an embed URL.
 * Handles both youtube.com/watch and youtu.be formats.
 */
function convertYouTubeUrl(url: string): string | null {
  // Handle youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // Handle youtu.be/VIDEO_ID
  const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return null;
}

/**
 * Converts a Vimeo URL to an embed URL.
 * Handles vimeo.com/VIDEO_ID format.
 */
function convertVimeoUrl(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return null;
}

/**
 * Processes a URL, converting known video platforms to embed URLs.
 */
function processUrl(url: string): string | null {
  const sanitized = sanitizeUrl(url);
  if (!sanitized) {
    return null;
  }

  // Check for YouTube URLs
  if (sanitized.includes('youtube.com') || sanitized.includes('youtu.be')) {
    return convertYouTubeUrl(sanitized);
  }

  // Check for Vimeo URLs
  if (sanitized.includes('vimeo.com')) {
    return convertVimeoUrl(sanitized);
  }

  // Return the sanitized URL as-is for other embeds
  return sanitized;
}

/**
 * EmbedWidget displays embedded content from external URLs.
 *
 * Features:
 * - Embeds YouTube, Vimeo, and other external content
 * - URL sanitization for security
 * - Lazy loading for performance
 * - Sandbox attribute for iframe security
 */
export function EmbedWidget({ widget, isEditing }: EmbedWidgetProps) {
  const config = widget.config as EmbedWidgetConfig | undefined;
  const url = config?.url;
  const title = config?.title || 'Embedded content';

  // Process the URL
  const embedUrl = url ? processUrl(url) : null;

  // Show invalid URL message if URL was provided but failed sanitization
  if (url && !embedUrl) {
    return (
      <Card
        className={cn(
          'myspace-card h-full overflow-hidden',
          'bg-gradient-to-br from-red-500/5 to-orange-500/5',
          'border-dashed border-red-500/30'
        )}
      >
        <CardContent className="p-3 h-full flex flex-col items-center justify-center">
          <Code className="h-6 w-6 text-red-500/50 mb-1" />
          <span className="text-xs text-muted-foreground text-center">
            Invalid embed URL
          </span>
        </CardContent>
      </Card>
    );
  }

  // Show placeholder when no URL is configured
  if (!embedUrl) {
    return (
      <Card
        className={cn(
          'myspace-card h-full overflow-hidden',
          'bg-gradient-to-br from-blue-500/5 to-purple-500/5',
          'border-dashed border-blue-500/30',
          isEditing && 'cursor-pointer hover:border-blue-500/50'
        )}
      >
        <CardContent className="p-3 h-full flex flex-col items-center justify-center">
          <Code className="h-6 w-6 text-blue-500/50 mb-1" />
          <span className="text-xs text-muted-foreground text-center">
            {isEditing ? 'Click to add embed URL' : 'No embed configured'}
          </span>
        </CardContent>
      </Card>
    );
  }

  // Render the embed
  return (
    <Card
      className={cn(
        'myspace-card h-full overflow-hidden',
        'bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10',
        'border-blue-500/20',
        isEditing && 'cursor-pointer hover:border-blue-500/40'
      )}
    >
      <CardContent className="p-0 h-full">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0 rounded-lg"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </CardContent>
    </Card>
  );
}

export default EmbedWidget;
