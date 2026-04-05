/**
 * Site Configuration Types (NIP-512 Kind 30512)
 *
 * These types define the structure for site configuration events
 * which enable Divine profiles to be rendered on npub.pro and
 * support Ghost theme ecosystem compatibility.
 */

import type { Widget } from '@/types/widgets';

export type { Widget, WidgetType } from '@/types/widgets';

// Layout types
export type SiteLayoutType = 'classic' | 'bento' | 'minimal';

// Rendering engines
export type RenderingEngine = 'org.divine.bento' | 'org.nostrsites.handlebars' | string;

// Visual effects available for customization
export type VisualEffect = 'sparkles' | 'glitter' | 'stars' | 'cursor-trail';

/**
 * Theme customization options
 */
export interface ThemeCustomization {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  effects?: VisualEffect[];
  font?: string;
  customCss?: string;
}

/**
 * Content filter for including specific event types
 */
export interface ContentInclude {
  type: 'kind' | 'address';
  value: string; // Kind number or naddr-style address
}

/**
 * Site configuration data structure
 * Represents the parsed data from a Kind 30512 event
 */
export interface SiteConfig {
  // Required fields
  identifier: string; // d-tag value (typically 'profile')
  url?: string; // Site URL (r tag)

  // Identity/metadata
  name?: string;
  title?: string;
  summary?: string;
  image?: string; // OG image URL
  icon?: string; // Favicon URL

  // Theme reference
  themeId?: string; // naddr of Kind 30514 theme
  themePackageHash?: string; // Hash from x tag

  // Content configuration
  includes: ContentInclude[];

  // Rendering
  renderingEngine?: RenderingEngine;

  // Divine-specific extensions
  layout?: SiteLayoutType;
  gridCols?: number;
  widgets: Widget[];
  customization?: ThemeCustomization;

  // Raw content for extensions
  rawContent?: string;
}

/**
 * Input for creating/updating a site configuration
 */
export interface SiteConfigInput {
  name?: string;
  title?: string;
  summary?: string;
  image?: string;
  icon?: string;
  themeId?: string;
  includes?: ContentInclude[];
  layout?: SiteLayoutType;
  gridCols?: number;
  widgets?: Widget[];
  customization?: ThemeCustomization;
}

/**
 * Theme definition (Kind 30514)
 */
export interface ThemeDefinition {
  id: string; // d-tag
  title: string;
  summary?: string;
  version: string;
  license?: string;
  packageEventId?: string; // e-tag reference to Kind 1036
  renderingEngine?: RenderingEngine;
  image?: string; // Preview image
  tags: string[];
  description?: string; // content field
}

/**
 * Theme package file entry (from Kind 1036)
 */
export interface ThemePackageFile {
  hash: string;
  path: string;
  url: string;
}

/**
 * Theme package (Kind 1036)
 */
export interface ThemePackage {
  title: string;
  version: string;
  license?: string;
  packageHash: string; // x-tag
  files: ThemePackageFile[];
  description?: string; // content field
}

// Event kind constants
export const SITE_CONFIG_KIND = 30512;
export const THEME_DEFINITION_KIND = 30514;
export const THEME_PACKAGE_KIND = 1036;
