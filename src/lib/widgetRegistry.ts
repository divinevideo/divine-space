/**
 * Widget Registry
 *
 * Central registry of all available widget types with their definitions,
 * default sizes, and constraints.
 */

import type {
  WidgetType,
  WidgetDefinition,
  Widget,
  WidgetSizeConstraints,
} from '@/types/widgets';

/**
 * Registry mapping widget types to their definitions.
 */
export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  profile: {
    type: 'profile',
    name: 'Profile',
    description: 'Display name, avatar, and bio',
    icon: 'User',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: false,
  },
  top8: {
    type: 'top8',
    name: 'Top 8 Friends',
    description: 'Your closest friends on Nostr',
    icon: 'Users',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: false,
  },
  music: {
    type: 'music',
    name: 'Music Player',
    description: 'Profile song or now playing',
    icon: 'Music',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 4, h: 2 },
    resizable: true,
    allowMultiple: false,
  },
  links: {
    type: 'links',
    name: 'Links',
    description: 'Social media and project links',
    icon: 'Link',
    defaultSize: { w: 1, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 2, h: 4 },
    resizable: true,
    allowMultiple: false,
  },
  videos: {
    type: 'videos',
    name: 'Videos',
    description: 'Video gallery from your uploads',
    icon: 'Video',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: false,
  },
  mood: {
    type: 'mood',
    name: 'Mood',
    description: 'Current status or mood',
    icon: 'Smile',
    defaultSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 2, h: 1 },
    resizable: true,
    allowMultiple: false,
  },
  gallery: {
    type: 'gallery',
    name: 'Image Gallery',
    description: 'Photo gallery from your uploads',
    icon: 'Image',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: true,
  },
  notes: {
    type: 'notes',
    name: 'Recent Notes',
    description: 'Your latest Nostr posts',
    icon: 'MessageSquare',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: false,
  },
  embed: {
    type: 'embed',
    name: 'Embed',
    description: 'Embed external content (YouTube, etc.)',
    icon: 'ExternalLink',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: true,
  },
  text: {
    type: 'text',
    name: 'Text Block',
    description: 'Custom text content',
    icon: 'Type',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: true,
  },
  spacer: {
    type: 'spacer',
    name: 'Spacer',
    description: 'Empty space for layout',
    icon: 'Square',
    defaultSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
    resizable: true,
    allowMultiple: true,
  },
};

/**
 * Get a widget definition by type.
 */
export function getWidgetDefinition(type: WidgetType): WidgetDefinition {
  return widgetRegistry[type];
}

/**
 * Get all available widget types as an array.
 */
export function getAvailableWidgetTypes(): WidgetType[] {
  return Object.keys(widgetRegistry) as WidgetType[];
}

/**
 * Get all widget definitions as an array.
 */
export function getAllWidgetDefinitions(): WidgetDefinition[] {
  return Object.values(widgetRegistry);
}

/**
 * Get the default size for a widget type.
 */
export function getDefaultSize(type: WidgetType): WidgetSizeConstraints {
  return widgetRegistry[type].defaultSize;
}

/**
 * Get the minimum size constraints for a widget type.
 */
export function getMinSize(type: WidgetType): WidgetSizeConstraints {
  return widgetRegistry[type].minSize;
}

/**
 * Get the maximum size constraints for a widget type.
 */
export function getMaxSize(type: WidgetType): WidgetSizeConstraints {
  return widgetRegistry[type].maxSize;
}

/**
 * Check if a widget can be added to the layout.
 * Returns false if the widget type doesn't allow multiple instances
 * and one already exists.
 */
export function canAddWidget(type: WidgetType, existingWidgets: Widget[]): boolean {
  const definition = widgetRegistry[type];
  if (definition.allowMultiple) {
    return true;
  }
  return !existingWidgets.some((w) => w.type === type);
}

/**
 * Validate widget size against its constraints.
 * Returns the adjusted size if the provided size is outside constraints.
 */
export function validateWidgetSize(
  type: WidgetType,
  size: WidgetSizeConstraints
): WidgetSizeConstraints {
  const definition = widgetRegistry[type];
  return {
    w: Math.max(definition.minSize.w, Math.min(definition.maxSize.w, size.w)),
    h: Math.max(definition.minSize.h, Math.min(definition.maxSize.h, size.h)),
  };
}

/**
 * Apply size constraints from the registry to a widget.
 * Returns a new widget object with minW, minH, maxW, maxH set.
 */
export function applyWidgetConstraints(widget: Widget): Widget {
  const definition = widgetRegistry[widget.type];
  return {
    ...widget,
    minW: definition.minSize.w,
    minH: definition.minSize.h,
    maxW: definition.maxSize.w,
    maxH: definition.maxSize.h,
  };
}
