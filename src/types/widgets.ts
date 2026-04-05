/**
 * Widget type system for the bento grid layout.
 *
 * The bento grid uses a 4-column layout where widgets can be positioned
 * and sized according to grid coordinates.
 */

/**
 * All available widget types in the bento grid.
 */
export type WidgetType =
  | 'profile'      // Name, avatar, bio
  | 'top8'         // Top 8 friends
  | 'music'        // Music player
  | 'links'        // Link list
  | 'videos'       // Video grid
  | 'mood'         // Mood/status
  | 'gallery'      // Image gallery
  | 'notes'        // Recent notes
  | 'events'       // Upcoming events
  | 'embed'        // Custom embed (YouTube, etc.)
  | 'text'         // Custom text block
  | 'spacer';      // Empty spacer

/**
 * Widget-specific configuration.
 * Each widget type can have its own configuration options.
 */
export interface WidgetConfig {
  /** Widget-specific configuration options */
  [key: string]: unknown;
}

/**
 * Configuration for the profile widget.
 */
export interface ProfileWidgetConfig extends WidgetConfig {
  /** Whether to show the bio */
  showBio?: boolean;
  /** Whether to show the NIP-05 identifier */
  showNip05?: boolean;
  /** Avatar size: 'small' | 'medium' | 'large' */
  avatarSize?: 'small' | 'medium' | 'large';
}

/**
 * Configuration for the music widget.
 */
export interface MusicWidgetConfig extends WidgetConfig {
  /** Whether to autoplay (muted by default) */
  autoplay?: boolean;
  /** Whether to show the track info */
  showTrackInfo?: boolean;
}

/**
 * Configuration for the embed widget.
 */
export interface EmbedWidgetConfig extends WidgetConfig {
  /** The embed URL (YouTube, etc.) */
  url?: string;
  /** Embed title for accessibility */
  title?: string;
}

/**
 * Configuration for the text widget.
 */
export interface TextWidgetConfig extends WidgetConfig {
  /** The text content */
  content?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Configuration for the gallery widget.
 */
export interface GalleryWidgetConfig extends WidgetConfig {
  /** Maximum number of images to display */
  maxImages?: number;
  /** Gallery display style */
  style?: 'grid' | 'carousel' | 'masonry';
}

/**
 * Configuration for the notes widget.
 */
export interface NotesWidgetConfig extends WidgetConfig {
  /** Maximum number of notes to display */
  maxNotes?: number;
  /** Whether to show replies */
  showReplies?: boolean;
}

/**
 * Configuration for the videos widget.
 */
export interface VideosWidgetConfig extends WidgetConfig {
  /** Maximum number of videos to display */
  maxVideos?: number;
  /** Filter by video kind (34235 for videos, 34236 for shorts) */
  kind?: number;
}

/**
 * A widget instance in the bento grid.
 */
export interface Widget {
  /** Unique identifier for this widget instance */
  id: string;
  /** The type of widget */
  type: WidgetType;
  /** X position in grid columns (0-3 for a 4-column grid) */
  x: number;
  /** Y position in grid rows */
  y: number;
  /** Width in grid columns (1-4) */
  w: number;
  /** Height in grid rows (1-4) */
  h: number;
  /** Minimum width constraint (optional) */
  minW?: number;
  /** Minimum height constraint (optional) */
  minH?: number;
  /** Maximum width constraint (optional) */
  maxW?: number;
  /** Maximum height constraint (optional) */
  maxH?: number;
  /** Widget-specific configuration */
  config?: WidgetConfig;
}

/**
 * Size constraints for a widget.
 */
export interface WidgetSizeConstraints {
  /** Width in grid columns */
  w: number;
  /** Height in grid rows */
  h: number;
}

/**
 * Definition of a widget type for the registry.
 * Contains metadata and constraints for each widget type.
 */
export interface WidgetDefinition {
  /** The widget type identifier */
  type: WidgetType;
  /** Human-readable name for the widget */
  name: string;
  /** Description of what the widget does */
  description: string;
  /** Icon name from lucide-react */
  icon: string;
  /** Default size when adding a new widget */
  defaultSize: WidgetSizeConstraints;
  /** Minimum size constraints */
  minSize: WidgetSizeConstraints;
  /** Maximum size constraints */
  maxSize: WidgetSizeConstraints;
  /** Whether this widget can be resized */
  resizable: boolean;
  /** Whether users can have multiple instances of this widget */
  allowMultiple: boolean;
}

/**
 * Props passed to widget components.
 */
export interface WidgetProps {
  /** The widget instance data */
  widget: Widget;
  /** The pubkey of the profile being viewed */
  pubkey: string;
  /** Whether the grid is in editing mode */
  isEditing: boolean;
}

/**
 * Layout stored in the site configuration (Kind 30512).
 */
export interface BentoLayout {
  /** Layout type identifier */
  type: 'bento';
  /** Number of grid columns (typically 4) */
  gridCols: number;
  /** Row height in pixels */
  rowHeight: number;
  /** Array of widget instances */
  widgets: Widget[];
}

/**
 * Type guard to check if a string is a valid WidgetType.
 */
export function isWidgetType(value: string): value is WidgetType {
  const validTypes: WidgetType[] = [
    'profile', 'top8', 'music', 'links', 'videos',
    'mood', 'gallery', 'notes', 'events', 'embed', 'text', 'spacer'
  ];
  return validTypes.includes(value as WidgetType);
}

/**
 * Create a new widget with default values.
 */
export function createWidget(
  type: WidgetType,
  position: { x: number; y: number },
  size: WidgetSizeConstraints,
  config?: WidgetConfig
): Widget {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    x: position.x,
    y: position.y,
    w: size.w,
    h: size.h,
    config,
  };
}
