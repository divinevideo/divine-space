/**
 * Default Widget Layouts
 *
 * Provides default widget configurations for new users and
 * layout templates for quick profile setup.
 */

import type { Widget, BentoLayout } from '@/types/widgets';

/**
 * The default widget layout for new users.
 * Based on the classic MySpace-inspired arrangement.
 */
export const defaultWidgets: Widget[] = [
  {
    id: 'profile',
    type: 'profile',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
  },
  {
    id: 'music',
    type: 'music',
    x: 2,
    y: 0,
    w: 2,
    h: 1,
  },
  {
    id: 'mood',
    type: 'mood',
    x: 2,
    y: 1,
    w: 1,
    h: 1,
  },
  {
    id: 'links',
    type: 'links',
    x: 3,
    y: 1,
    w: 1,
    h: 1,
  },
  {
    id: 'top8',
    type: 'top8',
    x: 0,
    y: 2,
    w: 2,
    h: 2,
  },
  {
    id: 'videos',
    type: 'videos',
    x: 2,
    y: 2,
    w: 2,
    h: 2,
  },
];

/**
 * Default bento layout configuration.
 */
export const defaultLayout: BentoLayout = {
  type: 'bento',
  gridCols: 4,
  rowHeight: 150,
  widgets: defaultWidgets,
};

/**
 * Minimal layout - clean and simple with just essential widgets.
 */
export const minimalLayout: Widget[] = [
  {
    id: 'profile',
    type: 'profile',
    x: 0,
    y: 0,
    w: 4,
    h: 2,
  },
  {
    id: 'links',
    type: 'links',
    x: 0,
    y: 2,
    w: 4,
    h: 1,
  },
];

/**
 * Classic MySpace layout - traditional two-column arrangement.
 */
export const classicLayout: Widget[] = [
  {
    id: 'profile',
    type: 'profile',
    x: 0,
    y: 0,
    w: 2,
    h: 3,
  },
  {
    id: 'top8',
    type: 'top8',
    x: 0,
    y: 3,
    w: 2,
    h: 2,
  },
  {
    id: 'music',
    type: 'music',
    x: 2,
    y: 0,
    w: 2,
    h: 1,
  },
  {
    id: 'mood',
    type: 'mood',
    x: 2,
    y: 1,
    w: 2,
    h: 1,
  },
  {
    id: 'videos',
    type: 'videos',
    x: 2,
    y: 2,
    w: 2,
    h: 3,
  },
];

/**
 * Maximalist layout - all the widgets!
 */
export const maximalistLayout: Widget[] = [
  {
    id: 'profile',
    type: 'profile',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
  },
  {
    id: 'music',
    type: 'music',
    x: 2,
    y: 0,
    w: 2,
    h: 1,
  },
  {
    id: 'mood',
    type: 'mood',
    x: 2,
    y: 1,
    w: 1,
    h: 1,
  },
  {
    id: 'links',
    type: 'links',
    x: 3,
    y: 1,
    w: 1,
    h: 2,
  },
  {
    id: 'top8',
    type: 'top8',
    x: 0,
    y: 2,
    w: 2,
    h: 2,
  },
  {
    id: 'videos',
    type: 'videos',
    x: 2,
    y: 2,
    w: 1,
    h: 2,
  },
  {
    id: 'notes',
    type: 'notes',
    x: 0,
    y: 4,
    w: 2,
    h: 2,
  },
  {
    id: 'gallery',
    type: 'gallery',
    x: 2,
    y: 4,
    w: 2,
    h: 2,
  },
];

/**
 * Creator-focused layout - emphasizes content.
 */
export const creatorLayout: Widget[] = [
  {
    id: 'profile',
    type: 'profile',
    x: 0,
    y: 0,
    w: 1,
    h: 2,
  },
  {
    id: 'links',
    type: 'links',
    x: 1,
    y: 0,
    w: 1,
    h: 2,
  },
  {
    id: 'videos',
    type: 'videos',
    x: 2,
    y: 0,
    w: 2,
    h: 2,
  },
  {
    id: 'music',
    type: 'music',
    x: 0,
    y: 2,
    w: 2,
    h: 1,
  },
  {
    id: 'gallery',
    type: 'gallery',
    x: 2,
    y: 2,
    w: 2,
    h: 2,
  },
  {
    id: 'notes',
    type: 'notes',
    x: 0,
    y: 3,
    w: 2,
    h: 2,
  },
];

/**
 * Layout template definition.
 */
export interface LayoutTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  description: string;
  /** Preview thumbnail (optional) */
  thumbnail?: string;
  /** Widget configuration for this template */
  widgets: Widget[];
}

/**
 * All available layout templates.
 */
export const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Balanced layout with all essential widgets',
    widgets: defaultWidgets,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple with just the essentials',
    widgets: minimalLayout,
  },
  {
    id: 'classic',
    name: 'Classic MySpace',
    description: 'Traditional two-column layout',
    widgets: classicLayout,
  },
  {
    id: 'maximalist',
    name: 'Maximalist',
    description: 'All the widgets for the power user',
    widgets: maximalistLayout,
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Content-focused layout for creators',
    widgets: creatorLayout,
  },
];

/**
 * Get a layout template by ID.
 */
export function getLayoutTemplate(id: string): LayoutTemplate | undefined {
  return layoutTemplates.find((t) => t.id === id);
}

/**
 * Get all layout templates.
 */
export function getAllLayoutTemplates(): LayoutTemplate[] {
  return layoutTemplates;
}

/**
 * Clone a layout template's widgets with fresh IDs.
 */
export function cloneLayoutWidgets(widgets: Widget[]): Widget[] {
  return widgets.map((widget) => ({
    ...widget,
    id: `${widget.type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }));
}

/**
 * Create a bento layout from widgets.
 */
export function createBentoLayout(
  widgets: Widget[],
  gridCols: number = 4,
  rowHeight: number = 150
): BentoLayout {
  return {
    type: 'bento',
    gridCols,
    rowHeight,
    widgets,
  };
}

export {
  sidebarBentoDefaultWidgets,
  sidebarBentoDefaultLayout,
  cloneSidebarBentoWidgets,
  createSidebarBentoWidgets,
  createSidebarBentoLayout,
} from './sidebarBentoLayout';
