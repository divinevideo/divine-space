/**
 * Parsing utilities for NIP-512 Kind 30512 Site Configuration
 */

import type { NostrEvent } from '@nostrify/nostrify';
import type {
  SiteConfig,
  SiteConfigInput,
  ContentInclude,
  Widget,
  ThemeCustomization,
  SiteLayoutType,
} from '@/types/site';

/**
 * Parse theme reference from x tag
 */
export function parseThemeId(tags: string[][]): { themeId: string; packageHash?: string } | undefined {
  const xTag = tags.find(t => t[0] === 'x');
  if (!xTag || !xTag[1]) return undefined;

  return {
    themeId: xTag[1],
    packageHash: xTag[2] || undefined,
  };
}

/**
 * Parse content includes from include tags
 */
export function parseContentIncludes(tags: string[][]): ContentInclude[] {
  const includes: ContentInclude[] = [];

  for (const tag of tags) {
    if (tag[0] !== 'include') continue;

    const includeType = tag[1];
    const value = tag[2];

    if (!value) continue;

    if (includeType === 'k') {
      includes.push({ type: 'kind', value });
    } else if (includeType === 'a') {
      includes.push({ type: 'address', value });
    }
    // Skip unknown include types
  }

  return includes;
}

/**
 * Parse a simple tag value (first match)
 */
function getTagValue(tags: string[][], name: string): string | undefined {
  const tag = tags.find(t => t[0] === name);
  return tag?.[1];
}

/**
 * Parse JSON content safely
 */
function parseJsonContent(content: string): Record<string, unknown> | null {
  if (!content || content.trim() === '') return null;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Parse widgets from content JSON
 */
function parseWidgets(content: Record<string, unknown> | null): Widget[] {
  if (!content || !Array.isArray(content.widgets)) return [];

  return content.widgets.filter((w: unknown): w is Widget => {
    if (typeof w !== 'object' || w === null) return false;
    const widget = w as Record<string, unknown>;
    return (
      typeof widget.id === 'string' &&
      typeof widget.type === 'string' &&
      typeof widget.x === 'number' &&
      typeof widget.y === 'number' &&
      typeof widget.w === 'number' &&
      typeof widget.h === 'number'
    );
  });
}

/**
 * Parse theme customization from content JSON
 */
function parseCustomization(content: Record<string, unknown> | null): ThemeCustomization | undefined {
  if (!content) return undefined;

  const theme = content.theme as Record<string, unknown> | undefined;
  const customCss = content.customCss as string | undefined;

  if (!theme && !customCss) return undefined;

  const customization: ThemeCustomization = {};

  if (theme) {
    if (theme.colors && typeof theme.colors === 'object') {
      customization.colors = theme.colors as ThemeCustomization['colors'];
    }
    if (Array.isArray(theme.effects)) {
      customization.effects = theme.effects as ThemeCustomization['effects'];
    }
    if (typeof theme.font === 'string') {
      customization.font = theme.font;
    }
  }

  if (customCss) {
    customization.customCss = customCss;
  }

  return Object.keys(customization).length > 0 ? customization : undefined;
}

/**
 * Parse a Kind 30512 event into a SiteConfig object
 */
export function parseSiteConfig(event: NostrEvent | null | undefined): SiteConfig | null {
  if (!event) return null;

  const { tags, content } = event;

  // Required: d-tag
  const identifier = getTagValue(tags, 'd');
  if (!identifier) return null;

  // Parse JSON content
  const parsedContent = parseJsonContent(content);

  // Parse theme reference
  const themeRef = parseThemeId(tags);

  // Parse divine extension tags
  const layout = getTagValue(tags, 'divine:layout') as SiteLayoutType | undefined;
  const gridColsStr = getTagValue(tags, 'divine:grid-cols');
  const gridCols = gridColsStr ? parseInt(gridColsStr, 10) : undefined;

  const config: SiteConfig = {
    identifier,
    url: getTagValue(tags, 'r'),
    name: getTagValue(tags, 'name'),
    title: getTagValue(tags, 'title'),
    summary: getTagValue(tags, 'summary'),
    image: getTagValue(tags, 'image'),
    icon: getTagValue(tags, 'icon'),
    themeId: themeRef?.themeId,
    themePackageHash: themeRef?.packageHash,
    includes: parseContentIncludes(tags),
    renderingEngine: getTagValue(tags, 'z'),
    layout,
    gridCols: gridCols && !isNaN(gridCols) ? gridCols : undefined,
    widgets: parseWidgets(parsedContent),
    customization: parseCustomization(parsedContent),
    rawContent: parsedContent === null && content ? content : undefined,
  };

  return config;
}

/**
 * Convert SiteConfigInput to event tags
 */
export function siteConfigToTags(input: SiteConfigInput, pubkey: string): string[][] {
  const tags: string[][] = [
    ['d', 'profile'],
    ['alt', 'Divine Space site configuration'],
  ];

  // Generate site URL
  const siteUrl = `https://divine.space/${pubkey}/`;
  tags.push(['r', siteUrl]);

  // Metadata
  if (input.name) tags.push(['name', input.name]);
  if (input.title) tags.push(['title', input.title]);
  if (input.summary) tags.push(['summary', input.summary]);
  if (input.image) tags.push(['image', input.image]);
  if (input.icon) tags.push(['icon', input.icon]);

  // Theme reference
  if (input.themeId) {
    tags.push(['x', input.themeId]);
  }

  // Content includes
  if (input.includes) {
    for (const include of input.includes) {
      if (include.type === 'kind') {
        tags.push(['include', 'k', include.value]);
      } else if (include.type === 'address') {
        tags.push(['include', 'a', include.value]);
      }
    }
  }

  // Rendering engine - default to bento
  tags.push(['z', 'org.divine.bento']);

  // Divine extensions
  if (input.layout) {
    tags.push(['divine:layout', input.layout]);
  }
  if (input.gridCols !== undefined) {
    tags.push(['divine:grid-cols', input.gridCols.toString()]);
  }

  return tags;
}

/**
 * Convert SiteConfigInput to event content JSON
 */
export function siteConfigToContent(input: SiteConfigInput): string {
  const hasWidgets = input.widgets && input.widgets.length > 0;
  const hasCustomization = input.customization && (
    input.customization.colors ||
    input.customization.effects ||
    input.customization.font ||
    input.customization.customCss
  );

  if (!hasWidgets && !hasCustomization) {
    return '';
  }

  const contentObj: Record<string, unknown> = {};

  if (hasWidgets) {
    contentObj.widgets = input.widgets;
  }

  if (hasCustomization) {
    const theme: Record<string, unknown> = {};

    if (input.customization!.colors) {
      theme.colors = input.customization!.colors;
    }
    if (input.customization!.effects) {
      theme.effects = input.customization!.effects;
    }
    if (input.customization!.font) {
      theme.font = input.customization!.font;
    }

    if (Object.keys(theme).length > 0) {
      contentObj.theme = theme;
    }

    if (input.customization!.customCss) {
      contentObj.customCss = input.customization!.customCss;
    }
  }

  return JSON.stringify(contentObj);
}
